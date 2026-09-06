export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  views: number;
  likes: number;
  imageUrl: string;
  featured?: boolean;
  tags: string[];
};

export type AdminArticle = Article & {
  published: boolean;
  deletedAt?: string;
};

export type ArticleVersion = {
  id: number;
  articleId: number;
  title: string;
  changeType: "update" | "restore" | "trash";
  createdAt: string;
};

export type Comment = {
  id: string;
  articleId: number;
  author: string;
  message: string;
  createdAt: string;
};

export type AdminComment = Comment & {
  approved: boolean;
};

export type PaginatedArticles = {
  items: Article[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Moment = {
  id: string;
  content: string;
  mood: string;
  publishedAt: string;
  tags: string[];
  imageUrl: string;
};

export type AdminMoment = Moment & {
  published: boolean;
};

export type CarouselItem = {
  id: number;
  articleId: number;
  sortOrder: number;
  enabled: boolean;
  customTitle: string;
  customExcerpt: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
};

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  defaultCoverUrl: string;
  postsPerPage: number;
  commentsRequireApproval: boolean;
  seoTitle: string;
  seoDescription: string;
};

export type CategoryItem = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  visible: boolean;
  sortOrder: number;
};
