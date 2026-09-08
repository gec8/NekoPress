import assert from "node:assert/strict";
import test from "node:test";
import { isAuthNetworkError, isSessionExpiredError, safeAdminDestination } from "../../lib/auth-errors.ts";

test("recognizes expired or missing Supabase sessions", () => {
  assert.equal(isSessionExpiredError({ message: "Auth session missing!" }), true);
  assert.equal(isSessionExpiredError({ code: "refresh_token_not_found" }), true);
  assert.equal(isSessionExpiredError({ status: 401 }), true);
  assert.equal(isSessionExpiredError(new TypeError("fetch failed")), false);
  assert.equal(isSessionExpiredError(null), false);
});

test("distinguishes authentication network failures from bad credentials",()=>{
  assert.equal(isAuthNetworkError({name:"AuthRetryableFetchError",message:"fetch failed",status:0}),true);
  assert.equal(isAuthNetworkError({message:"Invalid login credentials",status:400}),false);
});

test("only accepts destinations inside the admin area", () => {
  assert.equal(safeAdminDestination("/admin"), "/admin");
  assert.equal(safeAdminDestination("/admin/articles?page=2"), "/admin/articles?page=2");
  assert.equal(safeAdminDestination("/"), "/admin");
  assert.equal(safeAdminDestination("//example.com/admin"), "/admin");
  assert.equal(safeAdminDestination("/administrator"), "/admin");
  assert.equal(safeAdminDestination(undefined), "/admin");
});
