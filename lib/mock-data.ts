import type { Article, Comment, Moment } from "@/lib/types";

export const categories = ["全部", "日常", "开发", "动漫", "游戏", "生活", "效率", "音乐", "资源"];

export const articles: Article[] = [
  {
    id: 1,
    slug: "sakura-life-notes",
    title: "在樱花落下之前，给自己的生活加一点可爱",
    excerpt: "把忙碌的日常拆成柔软的小片段：一杯咖啡、一首歌、一个傍晚，以及认真记录它们的理由。",
    content: [
      "我们常常以为生活需要一次很大的改变，才会变得有趣。其实很多时候，真正能让一天发光的，是那些很小、很具体的瞬间。",
      "我喜欢把这些瞬间记下来：清晨窗边的光、走路时随机播放到的一首旧歌、工作结束后买到的一块草莓蛋糕。它们没有宏大的意义，却会让生活变得有触感。",
      "如果你也想开始记录，不需要复杂的工具。写下三句话，拍一张照片，或者给今天取一个标题就够了。",
    ],
    category: "日常", author: "Mia", publishedAt: "2026-08-28", readMinutes: 5, views: 1842, likes: 126,
    imageUrl: "https://cdn.pixabay.com/photo/2025/12/24/08/06/anime-girl-10032460_1280.jpg", featured: true,
    tags: ["生活", "记录", "随笔"],
  },
  {
    id: 2,
    slug: "flutter-web-animation-notes",
    title: "Flutter Web 动画手记：让界面更轻盈的 6 个细节",
    excerpt: "不用复杂的第三方库，也能通过轻量动画做出舒服的网页体验。",
    content: [
      "动画的价值不是炫技，而是帮助用户理解界面发生了什么。按钮状态、卡片悬停、页面切换，都是适合使用轻量动画的地方。",
      "真正影响体验的是节制：过多阴影、大面积模糊和巨型图片都会让页面变慢。",
    ],
    category: "开发", author: "Neko Dev", publishedAt: "2026-08-26", readMinutes: 8, views: 2310, likes: 203,
    imageUrl: "https://cdn.pixabay.com/photo/2025/12/01/12/11/anime-girl-9988017_1280.jpg", featured: true,
    tags: ["Flutter", "Web", "UI"],
  },
  {
    id: 3, slug: "anime-weekend-list", title: "本月动画清单：适合周末一口气看完的作品",
    excerpt: "从治愈日常到轻科幻，整理几部节奏舒服、画面耐看的作品。",
    content: ["这份清单的标准很简单：希望打开之后能很快进入状态。", "选番时也可以给自己留一点随机性。"],
    category: "动漫", author: "Yuki", publishedAt: "2026-08-22", readMinutes: 6, views: 3214, likes: 298,
    imageUrl: "https://cdn.pixabay.com/photo/2025/04/17/12/03/girl-9540346_1280.jpg", tags: ["动漫", "推荐", "周末"],
  },
  {
    id: 4, slug: "pink-white-desk", title: "桌面布置记录：粉白配色的低成本升级方案",
    excerpt: "从灯光、收纳到壁纸，不换电脑也能让工作区焕然一新。",
    content: ["桌面改造最容易掉进买很多东西的陷阱。", "灯光是投入产出比最高的一项。"],
    category: "生活", author: "Mia", publishedAt: "2026-08-18", readMinutes: 4, views: 1495, likes: 118,
    imageUrl: "https://cdn.pixabay.com/photo/2025/10/08/12/28/anime-style-9881451_1280.jpg", tags: ["桌搭", "生活", "收纳"],
  },
  {
    id: 5, slug: "reading-system", title: "做一个真正适合自己的阅读系统",
    excerpt: "收藏不等于阅读。一个有效的阅读系统，应该让发现、阅读、摘录、回顾形成闭环。",
    content: ["很多人的收藏夹越来越大，但真正读完的内容并没有变多。", "摘录不需要太多，更重要的是写下为什么这句话有用。"],
    category: "效率", author: "Neko Dev", publishedAt: "2026-08-12", readMinutes: 7, views: 2760, likes: 245,
    imageUrl: "https://cdn.pixabay.com/photo/2025/06/10/03/54/ai-generated-9651234_1280.jpg", tags: ["阅读", "效率", "知识管理"],
  },
  {
    id: 6, slug: "summer-playlist", title: "夏末歌单：适合黄昏散步的 12 首歌",
    excerpt: "不赶时间的时候，戴上耳机走一段路。音乐会替普通的街道加上一层电影滤镜。",
    content: ["黄昏是一天里最适合散步的时间。", "歌单不是固定答案。"],
    category: "音乐", author: "Yuki", publishedAt: "2026-08-05", readMinutes: 3, views: 1110, likes: 97,
    imageUrl: "https://cdn.pixabay.com/photo/2025/11/11/13/32/13-32-17-857_1280.png", tags: ["音乐", "歌单", "散步"],
  },
  {
    id: 7, slug: "indie-game-night", title: "独立游戏夜话：那些让人舍不得按下退出键的世界",
    excerpt: "聊聊几款在叙事、音乐与探索感上很有余韵的独立游戏。",
    content: ["独立游戏最吸引人的地方，是它们往往愿意把一个很小的想法做到足够完整。", "比起通关，我更在意离开游戏后还会不会想起其中的场景。"],
    category: "游戏", author: "Yuki", publishedAt: "2026-08-30", readMinutes: 7, views: 3480, likes: 312,
    imageUrl: "https://cdn.pixabay.com/photo/2025/04/29/06/39/anime-9566327_1280.jpg", featured: true, tags: ["游戏", "独立游戏", "推荐"],
  },
  {
    id: 8, slug: "flutter-state-management", title: "Flutter 状态管理不焦虑：先把数据流讲清楚",
    excerpt: "在选择 Provider、Riverpod 或 Bloc 之前，先理解状态从哪里来、由谁修改。",
    content: ["状态管理工具很多，但多数项目真正需要解决的问题并没有那么复杂。", "好的状态管理应该让数据变化路径更容易被理解。"],
    category: "开发", author: "Neko Dev", publishedAt: "2026-08-24", readMinutes: 9, views: 2890, likes: 261,
    imageUrl: "https://cdn.pixabay.com/photo/2025/09/20/07/34/anime-girl-9844377_1280.png", tags: ["Flutter", "架构", "状态管理"],
  },
  {
    id: 9, slug: "anime-web-resources", title: "我的二次元网站资源箱：图标、配色与灵感来源",
    excerpt: "整理做个人网站时常用的图标、色彩和排版思路。",
    content: ["资源越多不代表设计越好，真正重要的是先确定站点的视觉关键词。", "建立一个小型设计资源箱可以减少从零开始的成本。"],
    category: "资源", author: "Mia", publishedAt: "2026-08-20", readMinutes: 6, views: 2540, likes: 214,
    imageUrl: "https://cdn.pixabay.com/photo/2025/10/12/04/36/anime-style-9889035_1280.jpg", tags: ["资源", "设计", "配色"],
  },
  {
    id: 10, slug: "city-walk", title: "周末城市散步：把熟悉的街区重新走一遍",
    excerpt: "不做攻略，不赶景点，只用一个下午重新观察每天路过却没有认真看过的地方。",
    content: ["城市散步的乐趣，是让熟悉的地方重新变陌生。", "拍照不是必须，但看到喜欢的光线可以留下来。"],
    category: "日常", author: "Mia", publishedAt: "2026-08-16", readMinutes: 5, views: 1670, likes: 143,
    imageUrl: "https://cdn.pixabay.com/photo/2025/09/07/22/40/anime-girl-9821145_1280.png", tags: ["散步", "生活", "摄影"],
  },
  {
    id: 11, slug: "useful-bookmarks", title: "把收藏夹变成真正有用的资料库",
    excerpt: "给收藏内容增加入口、标签、回顾和清理机制。",
    content: ["收藏的问题不是数量，而是没有后续动作。", "资料库应该降低寻找信息的成本。"],
    category: "效率", author: "Neko Dev", publishedAt: "2026-08-10", readMinutes: 7, views: 2215, likes: 198,
    imageUrl: "https://cdn.pixabay.com/photo/2025/12/24/08/06/anime-girl-10032460_1280.jpg", tags: ["效率", "收藏", "知识管理"],
  },
  {
    id: 12, slug: "coding-night-playlist", title: "夜晚工作歌单：适合写代码时循环播放的音乐",
    excerpt: "节奏稳定、存在感适中，适合夜间写代码、阅读或整理资料。",
    content: ["写代码时我更喜欢没有强烈歌词干扰的音乐。", "真正好用的工作歌单是能够连续播放很久而不打断注意力。"],
    category: "音乐", author: "Yuki", publishedAt: "2026-08-03", readMinutes: 4, views: 1350, likes: 119,
    imageUrl: "https://cdn.pixabay.com/photo/2025/12/01/12/11/anime-girl-9988017_1280.jpg", tags: ["音乐", "工作", "歌单"],
  },
];

export const initialComments: Comment[] = [
  { id: "c1", articleId: 1, author: "Akira", message: "很喜欢这种记录方式，读完真的会想把今天写下来。", createdAt: "2026-08-30T10:00:00Z" },
  { id: "c2", articleId: 2, author: "DevCat", message: "控制动画幅度确实很关键。", createdAt: "2026-08-29T08:00:00Z" },
];


export const moments: Moment[] = [
  { id: "m1", content: "把文章页的阅读节奏重新整理了一遍。比起再加一个漂亮卡片，我更喜欢这种读起来安静、用起来顺手的改动。", mood: "开发记录", publishedAt: "2026-09-02", tags: ["Next.js", "UI"], imageUrl: "https://cdn.pixabay.com/photo/2025/12/01/12/11/anime-girl-9988017_1280.jpg" },
  { id: "m2", content: "最近重新整理了自己的收藏夹：真正需要的不是更多链接，而是更少、更容易再次找到的内容。", mood: "碎碎念", publishedAt: "2026-08-31", tags: ["效率", "生活"], imageUrl: "https://cdn.pixabay.com/photo/2025/12/24/08/06/anime-girl-10032460_1280.jpg" },
  { id: "m3", content: "周末适合把歌单调低一点，开一盏暖色灯，慢慢看完一篇长文章。", mood: "日常", publishedAt: "2026-08-29", tags: ["音乐", "阅读"], imageUrl: "https://cdn.pixabay.com/photo/2025/04/17/12/03/girl-9540346_1280.jpg" },
  { id: "m4", content: "做内容站最容易犯的错，是把首页塞满。最近更想让每一个区域都留一点呼吸。", mood: "设计笔记", publishedAt: "2026-08-27", tags: ["设计", "Web"], imageUrl: "" },
  { id: "m5", content: "今天又发现一个很可爱的独立游戏。好作品最大的后劲，是关掉游戏之后还会想起它的世界。", mood: "游戏", publishedAt: "2026-08-25", tags: ["游戏", "推荐"], imageUrl: "" },
];
