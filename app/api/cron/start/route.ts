import { NextResponse } from 'next/server';
import { pool } from '@/lib/mysql'
import { RowDataPacket } from 'mysql2';
// 定义项目接口
interface Project {
    id: number;
    project_url: string;
}

// 定义 GraphQL 响应接口
interface GitHubGraphQLResponse {
    data: {
        [key: string]: {
            stargazerCount: number;
        } | null; // 可能为空（如果仓库被删除或改名）
    };
    errors?: any[];
}

export async function GET(request: Request) {
    // ============ Vercel Hobby 计划cron限制，自定义限制查询 ============
    const date = new Date();
    // getDay() 返回 0 (周日) 到 6 (周六)
    const currentDay = date.getDay(); 
    // 周五的代码是 5。
    if (currentDay !== 5) { 
        return NextResponse.json({ 
            success: true, 
            message: `非目标运行日 (${currentDay})，任务跳过。` 
        });
    }
    // ============ Vercel Hobby 计划cron限制，自定义限制查询 ============
    const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    };

    try {
        // 1. 获取所有项目列表 (请在此处替换为你真实的数据库查询代码)
        const githubProjects = await getGitHubProjectsOnly();

        if (githubProjects.length === 0) {
            return NextResponse.json({
                success: true,
                message: '没有找到符合条件的 GitHub 项目'
            }, { headers });
        }

        // 2. 预处理：解析 Owner 和 Repo
        const validProjects = githubProjects
            .map((project) => {
                // 匹配 github.com/owner/repo
                const match = project.project_url.match(/github\.com\/([^/]+)\/([^/]+)/);
                if (match) {
                    return {
                        id: project.id,
                        owner: match[1],
                        repo: match[2].replace(/\/$/, ''), // 去除可能的尾部斜杠
                    };
                }
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        // 3. 拆分项目列表 (Chunking)，以 50 为界，防止 GraphQL 复杂度超限
        const CHUNK_SIZE = 50;
        const chunks = [];
        for (let i = 0; i < validProjects.length; i += CHUNK_SIZE) {
            chunks.push(validProjects.slice(i, i + CHUNK_SIZE));
        }

        let updatedCount = 0;
        const errors: string[] = [];

        // 4. 循环处理每一批次
        for (const chunk of chunks) {
            // 构造 GraphQL Query
            // 使用 repo_{id} 作为别名，方便后续精准更新数据库
            const queryBody = chunk
                .map(
                    (p) => `
                    repo_${p.id}: repository(owner: "${p.owner}", name: "${p.repo}") {
                        stargazerCount  
                    }`
                )
                .join('\n');

            const query = `query { ${queryBody} }`;

            try {
                const response = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `bearer ${process.env.GITHUB_TOKEN}`,
                    },
                    body: JSON.stringify({ query }),
                });

                const json: GitHubGraphQLResponse = await response.json();

                // 记录 GraphQL 错误但继续执行
                if (json.errors) {
                    console.warn('GraphQL partial errors:', JSON.stringify(json.errors));
                }

                if (json.data) {
                    // 并发执行数据库更新操作
                    const updatePromises = Object.entries(json.data).map(async ([alias, data]) => {
                        // data 为 null 表示仓库可能被删除或转为私有，跳过更新
                        if (!data) return;

                        const projectId = parseInt(alias.replace('repo_', ''));
                        const stars = data.stargazerCount;

                        await updateProjectRating(projectId, stars);
                        updatedCount++;
                    });

                    // 等待当前批次的所有数据库更新完成
                    await Promise.all(updatePromises);
                }
            } catch (err: any) {
                console.error('Batch processing error:', err);
                errors.push(err.message || 'Unknown batch error');
            }
        }

        return NextResponse.json({
            success: true,
            message: `评分更新完成，共更新 ${updatedCount} 个项目`,
            errors: errors.length > 0 ? errors : undefined,
        }, { headers });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        }, { status: 500, headers });
    }
}

// 从数据库获取项目
async function getGitHubProjectsOnly(): Promise<Project[]> {
    // 使用 LIKE 进行模糊匹配筛选
    const sql = "SELECT id, project_url FROM fav_favorites WHERE project_url LIKE ?";

    // mysql2 在 TypeScript 中返回的结果类型需要断言
    // RowDataPacket[] 是 select 查询的标准返回类型
    const [rows] = await pool.query<RowDataPacket[]>(sql, ['https://github.com/%']);

    return rows as Project[];
}

// 模拟：更新数据库
async function updateProjectRating(id: number, rating: number): Promise<void> {
    const sql = "UPDATE fav_favorites SET rating = ? WHERE id = ?";

    // 使用 execute 比 query 更适合执行预处理语句 (Prepared Statements)
    await pool.execute(sql, [rating, id]);
}