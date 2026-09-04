import { revalidatePath } from "next/cache";

export function revalidateArticleContent(...slugs: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");
  revalidatePath("/category/[slug]", "page");
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/article/${slug}`);
  }
}

export function revalidateMomentContent() {
  revalidatePath("/");
  revalidatePath("/moments");
}

export function revalidateAdminContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/comments");
  revalidatePath("/admin/moments");
  revalidatePath("/admin/carousel");
}
