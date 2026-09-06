import assert from "node:assert/strict";
import test from "node:test";
import { articleImage, DEFAULT_ARTICLE_IMAGE } from "../../lib/images.ts";

test("uses the configured article image", () => {
  assert.equal(articleImage("https://example.com/cover.jpg"), "https://example.com/cover.jpg");
});

test("uses a local fallback for missing image values", () => {
  assert.equal(articleImage("  "), DEFAULT_ARTICLE_IMAGE);
  assert.equal(articleImage(null), DEFAULT_ARTICLE_IMAGE);
  assert.equal(articleImage(undefined), DEFAULT_ARTICLE_IMAGE);
});
