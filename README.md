# NekoPress

NekoPress 是一个面向动漫、游戏、开发与生活内容的 Next.js 16 内容站示例。项目采用 App Router、TypeScript、Tailwind CSS 与 Supabase；没有配置 Supabase 时会自动使用本地 Mock 数据。

## 当前前台能力

- 响应式首页、自动轮播 Hero、编辑精选、文章分页、专题与图片墙
- `Ctrl + K` Command Palette 即时搜索
- 文章详情页阅读进度条
- 桌面端粘性 TOC / 移动端目录 Sheet
- 移动端文章底部操作栏：目录、评论、分享、返回顶部
- 上一篇 / 下一篇与相关推荐
- Moments / 说说：`/moments`
- 首页 Moments 预览
- 首页与文章页骨架加载状态
- 亮 / 暗色主题
- Supabase PostgreSQL / Auth / RLS
- 独立管理系统界面：可折叠侧栏、顶部栏、面包屑和健康状态
- 文章、动态、评论服务端分页及批量管理
- 文章 Markdown 编辑器、本地草稿、自动保存和离线保护
- 管理员 / 编辑两级权限控制
- 工作台统计、七日发布趋势、内容排行与运营待办
- 首页轮播、分类标签、媒体库和网站 SEO 设置
- 评论先审后发与后台审核
- Moments 后台 CRUD、草稿和发布状态
- 后台写入后自动刷新前台页面缓存
- Supabase Storage 后台图片上传
- Sitemap / Robots / Open Graph

## 本地运行

```powershell
Copy-Item .env.example .env.local
npm install
npm run lint
npm run build
npm run dev
```

默认访问：`http://localhost:3000`

未配置 Supabase 时，文章、评论初始展示和 Moments 会使用 `lib/mock-data.ts`。

## Supabase

创建项目后执行：

1. `supabase/schema.sql`
2. `supabase/seed.sql`

然后填写 `.env.local` 中的 Supabase 配置。`schema.sql` 会同时创建公开的 `media` Storage bucket，限制为常见图片格式和 8MB。

`schema.sql` 包含 Moments、评论审核、Storage bucket 和 profiles 权限收紧升级。旧项目也应重新执行完整 schema；末尾的升级语句会把新评论默认状态改为待审核，并限制普通用户修改自己的角色。

## 主要路由

- `/` 首页
- `/article/[slug]` 文章详情
- `/category/[slug]` 分类
- `/search` 搜索
- `/moments` 说说
- `/auth/login` 登录
- `/admin` 管理后台
- `/admin/articles` 文章管理
- `/admin/comments` 评论审核
- `/admin/moments` Moments 管理
- `/admin/media` 媒体库
- `/admin/carousel` 首页轮播
- `/admin/taxonomy` 分类与标签
- `/admin/settings` 网站设置

## 后台账号

后台使用 Supabase Auth 登录。登录用户必须在 `profiles` 表中拥有 `admin` 或 `editor` 角色；其中删除内容和修改网站设置仅允许 `admin`。

## 搜索快捷键

桌面端在任意页面按：

```text
Ctrl + K
```

macOS 可使用 `⌘ + K`。

## 构建说明

建议以 `npm run lint` 和 `npm run build` 作为最终上线前门槛。开发模式下 Next.js 的错误 Overlay 会比生产构建更严格地暴露重复 key、Hydration 和运行时问题，应优先修完再部署。
