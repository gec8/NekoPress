import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";

export function revalidateArticleContent(...slugs: Array<string | null | undefined>) {
  revalidateTag(PUBLIC_CACHE_TAGS.articles, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.carousel, "max");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");
  revalidatePath("/category/[slug]", "page");
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/article/${slug}`);
  }
}

export function revalidateMomentContent() {
  revalidateTag(PUBLIC_CACHE_TAGS.moments, "max");
  revalidatePath("/");
  revalidatePath("/moments");
}

export function revalidateCommentContent() {
  revalidateTag(PUBLIC_CACHE_TAGS.comments, "max");
  revalidatePath("/article/[slug]", "page");
}

export function revalidateCategoryContent() {
  revalidateTag(PUBLIC_CACHE_TAGS.categories, "max");
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
}

export function revalidateSiteSettings() {
  revalidateTag(PUBLIC_CACHE_TAGS.settings, "max");
  revalidatePath("/", "layout");
}

export function revalidateAdminContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/comments");
  revalidatePath("/admin/moments");
  revalidatePath("/admin/carousel");
  revalidatePath("/admin/trash");
}
