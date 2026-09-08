import assert from "node:assert/strict";
import test from "node:test";
import { articleImage, randomOnlineImage } from "../../lib/images.ts";

test("uses the configured article image", () => {
  assert.equal(articleImage("https://example.com/cover.jpg"), "https://example.com/cover.jpg");
});

test("uses a stable online random image for missing values", () => {
  assert.equal(articleImage("  ","hello world"), "https://picsum.photos/seed/article-hello%20world/1200/675.webp");
  assert.equal(articleImage(null,42), articleImage(undefined,42));
  assert.equal(randomOnlineImage("moment/1",800,450), "https://picsum.photos/seed/moment%2F1/800/450.webp");
});
