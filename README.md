# FavTidy - 项目收藏管理系统

这是一个基于 Next.js 构建的项目收藏管理系统，可以帮助用户收集、分类和管理喜爱的项目。

使用Vercel+TiDB无服务器搭建免费站点。

## 功能特性

- 项目收藏管理（添加、编辑、删除、查询）
- 项目分类和标签系统
- 搜索功能（支持项目名称、描述、关键词搜索）
- 分页浏览
- 公开/私有项目设置
- 响应式设计，支持各种设备

## 技术栈

- [Next.js 15](https://nextjs.org/)
- [React 19](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- MySQL 数据库
- JSON Web Tokens (JWT) 认证

## 环境要求

- Node.js (推荐版本 18 或更高)
- MySQL 数据库
- npm/yarn/pnpm/bun 包管理器

## 环境变量配置

在项目根目录创建 `.env` 文件，并配置以下环境变量：

```env
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database
MYSQL_PORT=3306
```

## 数据库表结构
以下可以免费使用数据库资源：
1. [TiDB](https://tidbcloud.com/)（推荐）
2. [CockroachDB](https://www.cockroachlabs.com/)


系统需要以下数据库表结构：

```sql
create table fav_favorites(
    id int unsigned auto_increment comment '主键ID' primary key,
    project_name varchar(255) not null comment '项目名称',
    project_url varchar(500) not null comment '项目地址',
    project_description varchar(400) null comment '项目详细介绍',
    keywords varchar(20) null comment '项目关键词（逗号分隔）',
    search_tokens varchar(500) null comment '搜索分词（用于全文搜索，存储分词结果）',
    category varchar(100) null comment '项目分类',
    rating tinyint unsigned default 0 null comment '评分（0-5）',
    is_public tinyint(1) default 0 null comment '是否公开（0:私有, 1:公开）',
    tags varchar(80) null comment '标签（逗号分隔）',
    favicon_url varchar(500) null comment '网站图标地址',
    screenshot_url varchar(500) null comment '项目截图地址',
    created_at timestamp default CURRENT_TIMESTAMP null comment '创建时间',
    updated_at timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint fav_favorites_unique
      unique (project_url)
)comment '项目收藏表';
```

## 安装与运行

1. 克隆项目代码:

```bash
git clone <repository-url>
```

2. 安装依赖:

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. 配置环境变量（参考上面的环境变量配置）

4. 运行开发服务器:

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 构建与部署

构建生产版本:

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

启动生产服务器:

```bash
npm run start
# 或
yarn start
# 或
pnpm start
```

## 项目结构

```
app/
  ├── api/              # API 路由
  │   ├── tidy/         # 收藏项目相关 API
  │   └── auth/         # 认证相关 API
  ├── components/       # React 组件
  ├── contexts/         # React 上下文
  ├── login/            # 登录页面
  └── tdiy/             # 主要应用页面
lib/                  # 工具库
  ├── mysql.ts          # MySQL 连接配置
  ├── auth.ts           # 认证相关工具
  └── jwt.ts            # JWT 工具
```

## API 接口

### 收藏项目接口 (`/api/tidy`)

- `GET /api/tidy` - 获取项目列表（支持分页、搜索、分类筛选）
- `POST /api/tidy` - 创建新项目收藏
- `PUT /api/tidy` - 更新项目信息
- `DELETE /api/tidy?id=:id` - 删除指定项目
- `OPTIONS /api/tidy` - 获取所有分类

### 认证接口 (`/api/auth`)

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/check` - 检查用户登录状态

## 部署

推荐使用 [Vercel](https://vercel.com/) 部署此 Next.js 应用，Vercel 是 Next.js 官方推荐的部署平台。

## 学习资源

想了解更多关于 Next.js 的内容，可以查看以下资源：

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 的特性和 API
- [学习 Next.js](https://nextjs.org/learn) - 交互式 Next.js 教程
- [Next.js GitHub 仓库](https://github.com/vercel/next.js)

## 许可证

该项目基于 MIT 许可证开源。