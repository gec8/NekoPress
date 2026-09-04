# CHECK REPORT

本报告对应“前后台联动 V2”版本。

## V2 后台联动

- 文章写入后自动刷新首页、分类、详情、搜索和 Sitemap
- 后台不再用 Mock 数据掩盖鉴权或数据库错误
- 文章草稿与发布状态在编辑和列表中保持一致
- 评论改为提交后待审核，后台支持通过、撤回公开和删除
- Moments 后台支持新建、编辑、草稿、发布和删除
- 仪表盘展示文章、待审核评论、Moments 和浏览量
- 普通用户不能再修改自己的 `profiles.role`
- Supabase schema 包含旧项目安全升级语句
- 图片上传统一迁移到 Supabase Storage，不再依赖 Cloudflare R2

## 已完成改动

- 全站 Ctrl/Command + K 即时搜索
- 搜索请求 180ms debounce + AbortController 取消旧请求
- 文章阅读进度条
- 桌面端文章 TOC，IntersectionObserver 高亮当前章节
- 移动端文章目录 Sheet
- 移动端文章底部操作栏
- 上一篇 / 下一篇
- 同分类相关推荐
- Moments 首页预览与 `/moments` 页面
- Supabase `moments` schema / seed
- 首页和文章页 loading skeleton
- sitemap 加入 `/moments`
- Footer 增加主要入口

## 静态检查

- TypeScript / TSX 文件：46
- 使用 TypeScript 5.8.3 parser 检查
- Parse errors：0
- 本地 `@/` import 缺失：0
- 相对 import 缺失：0
- 新增列表均使用稳定 id 作为 key
- 未引入新的 npm 依赖

## React 19 ESLint 高风险点检查

重点检查了 `useEffect` 内同步 `setState`：

- ReadingProgress：setState 位于 `requestAnimationFrame` 回调
- ArticleToc：setState 位于 `IntersectionObserver` 回调
- SearchCommand：请求状态更新位于 timeout / fetch 异步回调
- ThemeToggle：沿用已修复版本，没有 mount effect 内同步 setState

因此没有重新引入此前的 `react-hooks/set-state-in-effect` 同类写法。

## 当前验证

已在当前 Windows 项目目录真实执行：

```powershell
npm run lint
npm run build
```

结果：ESLint、TypeScript 和 Next.js 16.3.4 生产构建全部通过，共生成 22 个页面及接口路由。

如果旧 `.next` 缓存影响开发 Overlay：

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

## 数据库升级

旧 Supabase 项目需要重新执行完整 `supabase/schema.sql`，以应用评论待审核、Moments、Storage bucket 和 profiles 权限升级；全新项目执行完整 schema 和 seed 即可。
