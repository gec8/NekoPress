import assert from "node:assert/strict";
import test from "node:test";
import { withTimeout } from "../../lib/async.ts";

test("returns a completed operation", async () => {
  assert.equal(await withTimeout(Promise.resolve("ok"), 50), "ok");
});

test("returns null for rejected and timed out operations", async () => {
  assert.equal(await withTimeout(Promise.reject(new Error("failed")), 50), null);
  assert.equal(await withTimeout(new Promise((resolve) => setTimeout(() => resolve("late"), 30)), 5), null);
});
