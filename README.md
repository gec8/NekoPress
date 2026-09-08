# NekoPress

NekoPress 是一个基于 Next.js 16 与 Supabase 的现代内容管理系统，面向动漫、游戏、开发和生活类内容。项目同时包含响应式内容前台与独立管理后台，覆盖文章、动态、评论、媒体、轮播、分类、网站设置、审计和备份恢复。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth%20%2B%20Storage-3ecf8e?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

## 功能概览

### 内容前台

- 响应式首页、自动轮播 Hero、编辑精选、文章分页、专题和图片墙
- 文章详情、阅读进度、桌面粘性目录、移动端目录面板
- 上一篇、下一篇、相关推荐、评论、分享和返回顶部
- Moments 动态页与首页动态预览
- `Ctrl + K` / `⌘ + K` 全局快捷搜索
- 亮色与暗色主题、骨架加载、品牌化错误页面
- Sitemap、Robots、Open Graph 和基础 SEO 设置
- 缺少封面时按内容生成稳定的在线随机图片，并保留加载失败兜底

### 管理系统

- 固定侧栏、顶部栏、面包屑、权限状态和服务健康提示
- 文章、动态、评论的分页、批量操作、草稿和发布管理
- Markdown 编辑器、本地草稿、自动保存、离线保护和离开提醒
- 文章版本历史、回收站、恢复和未来时间定时发布
- 首页轮播、分类标签、网站信息及 SEO 设置
- 管理员和编辑两级权限；高风险操作仅限管理员
- 工作台统计、七日趋势、内容排行和运营待办
- 管理员操作日志及 JSON 内容备份
- 后台写入后自动刷新前台缓存

### 媒体中心

- 支持 JPG、PNG、WebP、GIF、AVIF、MP3、WAV、OGG、MP4 和 WebM
- 图片最大 8MB，音频和视频最大 50MB
- 点击选择、批量选择、文件夹选择、全页面拖拽和链接导入
- 上传前图片缩略图、视频首帧、音视频时长及显示文件名编辑
- 逐文件等待、上传、成功、失败、取消状态和总体进度
- 大文件通过 Supabase TUS 分块断点续传，支持暂停、继续和自动重试
- TUS 授权异常时自动降级到服务端标准上传
- SHA-256 内容指纹去重；文件名不同但内容相同仍可识别和复用
- 上传后复制链接、查看媒体、前往写文章和清理已完成任务
- 媒体类型、用途、大小和时间筛选，首屏分批渲染
- 删除前检查文章、动态、轮播和网站设置中的引用
- 手动一致性检查：缺失索引、Storage 文件丢失和中断上传修复

### 安全与可靠性

- Supabase Auth、PostgreSQL、Storage 和 Row Level Security
- 登录限流，区分密码错误、会话过期、网络故障和数据库异常
- 评论频率限制与重复提交防护
- 上传内容签名、MIME、尺寸、文件大小和请求频率校验
- Storage 直传仅允许 `admin` / `editor` 写入指定媒体目录
- 安全响应头、键盘焦点、减少动画和跳过导航支持
- 开发环境可使用 Mock 数据；生产环境不会静默回退到演示数据

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase PostgreSQL / Auth / Storage
- TanStack Query
- tus-js-client
- Zod

## 快速开始

需要 Node.js 20 或更高版本。

```powershell
git clone https://github.com/gec8/NekoPress.git
Set-Location NekoPress
npm install
Copy-Item .env.example .env.local
npm run dev
```

访问：

- 前台：`http://localhost:3000`
- 后台：`http://localhost:3000/admin`
- 登录：`http://localhost:3000/auth/login`

## 环境变量

复制 `.env.example` 后填写：

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=media
```

`SUPABASE_SECRET_KEY` 只能配置在服务器或部署平台中，不要提交 `.env`、`.env.local` 或任何真实密钥。

## 配置 Supabase

新项目按以下顺序执行：

1. 在 Supabase SQL Editor 执行 `supabase/schema.sql`。
2. 执行 `supabase/seed.sql` 写入示例内容。
3. 在 Authentication 中创建后台用户。
4. 将该用户在 `public.profiles` 表中的 `role` 设置为 `admin` 或 `editor`。
5. 填写 `.env.local` 并重新启动项目。

完整 schema 会创建内容表、权限策略、触发器、公开的 `media` Storage bucket，以及媒体资产和引用目录。

### 已有数据库升级

按文件名顺序执行 `supabase/migrations/` 中尚未应用的迁移。当前迁移包括：

- 内容字段标准化、首页轮播和网站设置
- 文章历史、回收站与管理员操作日志
- 音频和视频 Storage 支持
- 媒体资产目录及内容引用关系
- 登录用户 TUS 上传权限与 RLS 修复
- 媒体 SHA-256 内容指纹去重

不要重复跳过中间迁移。所有迁移均设计为可安全应用于已有项目。

## 后台权限

后台使用 Supabase Auth 登录，并以 `profiles.role` 判断权限：

- `editor`：管理日常内容和媒体
- `admin`：拥有编辑权限，并可删除内容、修改网站设置、修复媒体和恢复备份
- `user`：不能进入管理后台

## 数据备份与恢复

系统页支持导出内容 JSON 备份。备份格式 v2 包含内容数据、媒体资产清单、Storage 路径和引用关系，但不包含账号、密码、密钥及 Storage 文件本体。

恢复流程分为三步：选择 JSON、验证预览、确认合并。恢复只合并或更新记录，不会清空现有数据库，也不会删除现有媒体文件。

## 常用命令

```powershell
npm run dev                  # 启动开发服务器
npm run lint                 # 代码规范检查
npm run test:unit            # 单元测试
npm run build                # 生产构建
npm run test:integration     # HTTP 集成测试
npm run check                # 规范检查与完整测试
npm run deploy:check         # 部署环境与完整质量检查
```

## 主要路由

| 路由 | 功能 |
| --- | --- |
| `/` | 首页 |
| `/article/[slug]` | 文章详情 |
| `/category/[slug]` | 分类内容 |
| `/search` | 内容搜索 |
| `/moments` | 动态 |
| `/admin` | 管理工作台 |
| `/admin/articles` | 文章管理 |
| `/admin/moments` | 动态管理 |
| `/admin/comments` | 评论审核 |
| `/admin/media` | 媒体中心 |
| `/admin/carousel` | 首页轮播 |
| `/admin/taxonomy` | 分类与标签 |
| `/admin/settings` | 网站设置 |
| `/admin/system` | 系统状态、备份与恢复 |
| `/admin/audit` | 管理员操作日志 |

## 部署

推荐将 GitHub 仓库连接到 Vercel：

1. 在 Supabase 执行完整 schema 或尚未应用的迁移。
2. 在部署平台配置 `.env.example` 中的环境变量。
3. 将 `NEXT_PUBLIC_SITE_URL` 设置为正式 HTTPS 地址。
4. 在本地运行 `npm run deploy:check`。
5. 推送到 `main`，等待 GitHub `Quality checks` 工作流通过。
6. 发布后检查 `/api/health` 和后台 `/admin/system`。

## 测试策略

- 单元测试覆盖鉴权错误、后台跳转、超时处理、图片回退、媒体签名和请求安全。
- 集成测试使用生产构建验证健康接口、后台跳转、会话状态和登录校验。
- GitHub Actions 会在推送到 `main` 或创建 Pull Request 时执行质量检查。

## 项目地址

[https://github.com/gec8/NekoPress](https://github.com/gec8/NekoPress)
