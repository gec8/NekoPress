export const DEFAULT_ARTICLE_IMAGE = "/images/default-cover.svg";
export const DEFAULT_MOMENT_IMAGE = "/images/default-moment.svg";

export function articleImage(value?: string | null) {
  return value?.trim() || DEFAULT_ARTICLE_IMAGE;
}
