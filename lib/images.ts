export const DEFAULT_ARTICLE_IMAGE = "/images/default-cover.svg";
export const DEFAULT_MOMENT_IMAGE = "/images/default-moment.svg";

export function randomOnlineImage(seed: string | number, width = 1200, height = 675) {
  const safeSeed = encodeURIComponent(String(seed || "nekopress").slice(0, 120));
  return `https://picsum.photos/seed/${safeSeed}/${width}/${height}.webp`;
}

export function articleImage(value?: string | null, seed: string | number = "nekopress") {
  return value?.trim() || randomOnlineImage(`article-${seed}`);
}
