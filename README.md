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
- 公开内容使用无 Cookie 的 Supabase 客户端与标签缓存，后台更新后自动失效
- 登录成功后确认会话与后台角色，区分会话过期、网络故障和数据库异常
- 评论限流与重复提交防护；上传文件签名、尺寸和频率校验；媒体删除前检查内容引用
- 文章回收站、版本历史与恢复，以及未保存内容离开提醒
- 后台系统状态页：分别检测权限、数据库、媒体存储、迁移状态和响应耗时
- 顶部健康提示采用轻量检测，每 5 分钟按需运行，页面隐藏或离线时自动暂停
- 管理员操作日志：追踪文章、批量管理和评论审核等关键操作
- 管理员一键导出内容 JSON 备份，不包含账号、评论、密钥和图片文件
- 全站浏览器安全响应头：防点击劫持、类型嗅探、来源泄露和无关设备权限
- 键盘无障碍：跳过导航、全局焦点提示、减少动画适配和带标签的登录表单
- 品牌化 404、后台错误恢复与根布局故障兜底页面
- 文章未来时间定时发布，公开查询在到点前严格隐藏内容
- 文章编辑器支持上传并插入图片、MP3/WAV/OGG 音频和 MP4/WebM 视频
- 音视频支持标题、作者与自定义封面；未设置时使用 NekoPress 默认媒体封面
- Sitemap / Robots / Open Graph

## 本地运行

```powershell
Copy-Item .env.example .env.local
npm install
npm run lint
npm run build
npm run test
npm run dev
```

默认访问：`http://localhost:3000`

开发环境未配置 Supabase 或连接失败时，文章、评论初始展示和 Moments 会使用 `lib/mock-data.ts`。生产环境不会使用演示数据：未配置时显示配置异常，连接失败时显示服务异常，数据库为空时显示空状态。

## Supabase

创建项目后执行：

1. `supabase/schema.sql`
2. `supabase/seed.sql`

已有数据库升级时，按文件名顺序执行 `supabase/migrations/` 中尚未应用的迁移；其中包括回收站、版本历史与后台操作日志。

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
- `/admin/system` 系统状态与备份检查
- `/admin/audit` 管理员操作日志

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

## 发布与部署

推荐连接 GitHub 仓库到 Vercel，并在部署平台配置 `.env.example` 中列出的环境变量。不要上传 `.env` 或 `.env.local`。

发布前在本机执行：

```powershell
npm run deploy:check
```

该命令会检查生产网址、Supabase 地址与密钥是否齐全，但不会输出密钥内容，然后执行代码规范、单元测试、生产构建和接口测试。GitHub 的 `Quality checks` 工作流会在推送到 `main` 或创建 Pull Request 时自动运行项目检查。

建议发布顺序：

1. 在 Supabase 执行 schema 或尚未应用的 migrations。
2. 在部署平台配置生产环境变量，`NEXT_PUBLIC_SITE_URL` 使用正式 HTTPS 域名。
3. 执行 `npm run deploy:check`。
4. 推送到 GitHub，等待自动检查通过后再发布。
5. 发布后访问 `/api/health` 和后台 `/admin/system` 验证服务。

## 自动化测试

- `npm run test:unit`：运行鉴权跳转、超时处理和图片回退单元测试。
- `npm run test:integration`：基于现有生产构建临时启动 3101 端口，验证健康检查、后台跳转、会话状态和登录校验。
- `npm test`：依次执行单元测试、生产构建和 HTTP 集成测试。
- `npm run check`：执行 ESLint 和全部测试，适合作为提交或部署前检查。
