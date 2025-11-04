import { pool } from '@/lib/mysql'
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// 项目收藏表
// CREATE TABLE `fav_favorites` (
//     `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
//     `project_name` VARCHAR(255) NOT NULL COMMENT '项目名称',
//     `project_url` VARCHAR(500) NOT NULL COMMENT '项目地址',
//     `project_description` TEXT COMMENT '项目详细介绍',
//     `keywords` VARCHAR(500) COMMENT '项目关键词（逗号分隔）',
//     `search_tokens` TEXT COMMENT '搜索分词（用于全文搜索，存储分词结果）',
//     `category` VARCHAR(100) COMMENT '项目分类',
//     `rating` TINYINT UNSIGNED DEFAULT 0 COMMENT '评分（0-5）',
//     `is_public` TINYINT(1) DEFAULT 0 COMMENT '是否公开（0:私有, 1:公开）',
//     `tags` VARCHAR(300) COMMENT '标签（逗号分隔）',
//     `favicon_url` VARCHAR(500) COMMENT '网站图标地址',
//     `screenshot_url` VARCHAR(500) COMMENT '项目截图地址',
//     `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
//     `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
//     PRIMARY KEY (`id`),
//     FULLTEXT INDEX `idx_search` (`project_name`, `project_description`, `keywords`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

// 获取所有分类的API
export async function OPTIONS(request: NextRequest) {
    try {
        // 获取所有不同的分类
        const [categories] = await pool.query(
            'SELECT DISTINCT category FROM fav_favorites WHERE category IS NOT NULL AND category != "" ORDER BY category'
        );
        
        return Response.json({
            success: true,
            message: '获取分类成功',
            data: {
                categories: (categories as any[]).map(row => row.category)
            }
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: '获取分类失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // 检查用户是否登录
        const user = await getCurrentUser();
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        
        // 参数校验
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            return Response.json({
                success: false,
                message: '无效的分页参数，页码应大于0，每页大小应在1-100之间'
            }, { status: 400 });
        }

        // 计算偏移量
        const offset = (page - 1) * pageSize;

        // 构建查询条件
        let whereConditions = [];
        let queryParams = [];
        
        // 搜索条件：支持项目名称、关键词、标签、项目介绍的模糊搜索
        if (search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            whereConditions.push(
                '(project_name LIKE ? OR keywords LIKE ? OR project_description LIKE ? OR tags LIKE ?)'
            );
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // 分类筛选
        if (category.trim()) {
            whereConditions.push('category = ?');
            queryParams.push(category.trim());
        }
        
        // 如果用户未登录，只显示公开内容
        if (!user) {
            whereConditions.push('is_public = ?');
            queryParams.push(1);
        }
        
        // 构建WHERE子句
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        // 查询数据
        const [rows] = await pool.query(
            `SELECT * FROM fav_favorites ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...queryParams, pageSize, offset]
        );

        // 查询总数
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM fav_favorites ${whereClause}`,
            queryParams
        );
        const total = (countResult as any)[0].total;
        const totalPages = Math.ceil(total / pageSize);

        return Response.json({
            success: true,
            message: '获取成功',
            data: {
                list: rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages
                },
                search: {
                    keyword: search,
                    category: category
                }
            }
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: '获取失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({
                success: false,
                message: '用户未登录'
            }, { status: 401 });
        }

        const body = await request.json();
        const {
            project_name,
            project_url,
            project_description,
            keywords,
            category,
            rating,
            is_public,
            tags,
            favicon_url,
            screenshot_url
        } = body;

        // 检查必填字段
        if (!project_name || !project_url) {
            return Response.json({
                success: false,
                message: '项目名称和项目地址为必填字段'
            }, { status: 400 })
        }

        // 构建搜索索引字段（将项目名称、介绍、关键词合并用于搜索）
        const searchTokens = [
            project_name,
            project_description || '',
            keywords || ''
        ].filter(Boolean).join(' ');

        const [result] = await pool.query(
            `INSERT INTO fav_favorites 
            (project_name, project_url, project_description, keywords, search_tokens, category, rating, is_public, tags, favicon_url, screenshot_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                project_name,
                project_url,
                project_description || '',
                keywords || '',
                searchTokens,
                category || '其他',
                rating || 0,
                is_public || 0,
                tags || '',
                favicon_url || '',
                screenshot_url || ''
            ]
        );

        // 查询刚创建的记录
        const [rows] = await pool.query(
            'SELECT * FROM fav_favorites WHERE id = ?',
            [(result as any).insertId]
        );

        return Response.json({
            success: true,
            message: '创建成功'
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: '创建失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({
                success: false,
                message: '用户未登录'
            }, { status: 401 });
        }
        const body = await request.json();
        const { id, ...updateData } = body;

        // 检查ID是否存在
        if (!id) {
            return Response.json({
                success: false,
                message: '缺少项目ID'
            }, { status: 400 });
        }

        // 构建更新语句
        const fields = Object.keys(updateData);
        if (fields.length === 0) {
            return Response.json({
                success: false,
                message: '没有提供要更新的字段'
            }, { status: 400 });
        }

        const setUpdates = fields.map(field => `${field} = ?`).join(', ');
        const values = [...fields.map(field => (updateData as any)[field]), id];

        // 更新数据
        const [result] = await pool.query(
            `UPDATE fav_favorites SET ${setUpdates} WHERE id = ?`,
            values
        );

        // 检查是否有记录被更新
        if ((result as any).affectedRows === 0) {
            return Response.json({
                success: false,
                message: '未找到指定ID的项目'
            }, { status: 404 });
        }

        // 查询更新后的记录
        const [rows] = await pool.query(
            'SELECT * FROM fav_favorites WHERE id = ?',
            [id]
        );

        return Response.json({
            success: true,
            message: '更新成功'
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: '更新失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return Response.json({
                success: false,
                message: '用户未登录'
            }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // 检查ID是否存在
        if (!id) {
            return Response.json({
                success: false,
                message: '缺少项目ID'
            }, { status: 400 });
        }

        // 删除数据
        const [result] = await pool.query(
            'DELETE FROM fav_favorites WHERE id = ?',
            [id]
        );

        // 检查是否有记录被删除
        if ((result as any).affectedRows === 0) {
            return Response.json({
                success: false,
                message: '未找到指定ID的项目'
            }, { status: 404 });
        }

        return Response.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: '删除失败',
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}