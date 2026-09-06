import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.TEST_BASE_URL;
if (!baseUrl) throw new Error("TEST_BASE_URL is required");

test("public health endpoint reports a valid service state", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "NekoPress");
  assert.equal(Number.isNaN(Date.parse(body.time)), false);
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  assert.equal(response.headers.get("x-frame-options"),"DENY");
  assert.match(response.headers.get("permissions-policy")??"",/camera=\(\)/);
});

test("protected route preserves its destination when redirecting", async () => {
  const response = await fetch(`${baseUrl}/admin/articles?page=2`, { redirect: "manual" });
  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location);
  const target = new URL(location, baseUrl);
  assert.equal(target.pathname, "/auth/login");
  assert.equal(target.searchParams.get("next"), "/admin/articles?page=2");
});

test("session endpoint distinguishes an expired session", async () => {
  const response = await fetch(`${baseUrl}/api/auth/session`);
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(body.ok, false);
  assert.equal(body.kind, "session");
});

test("login endpoint validates input before contacting auth service", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "invalid", password: "" }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.kind, "validation");
});

test("media upload and deletion require an authenticated administrator", async () => {
  const form=new FormData();
  form.set("file",new File([new Uint8Array([1,2,3])],"fake.png",{type:"image/png"}));
  const upload=await fetch(`${baseUrl}/api/upload`,{method:"POST",body:form});
  assert.equal(upload.status,401);
  const removal=await fetch(`${baseUrl}/api/admin/media?path=${encodeURIComponent("uploads/2026-01-01/00000000-0000-0000-0000-000000000000.png")}`,{method:"DELETE"});
  assert.equal(removal.status,401);
});

test("comment endpoint rejects malformed content before database access",async()=>{
  const response=await fetch(`${baseUrl}/api/comments`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({articleId:1,author:"A",message:"x"})});
  assert.equal(response.status,400);
});

test("trash and version mutations require authentication",async()=>{
  const trash=await fetch(`${baseUrl}/api/admin/articles`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id:1,action:"restore"})});
  assert.equal(trash.status,401);
  const history=await fetch(`${baseUrl}/api/admin/articles/history`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({articleId:1,versionId:1})});
  assert.equal(history.status,401);
});

test("content export requires an authenticated administrator",async()=>{
  const response=await fetch(`${baseUrl}/api/admin/export`);
  assert.equal(response.status,401);
});

test("unknown routes return the branded not-found page",async()=>{
  const response=await fetch(`${baseUrl}/this-page-does-not-exist`);
  const html=await response.text();
  assert.equal(response.status,404);
  assert.match(html,/没有找到这个页面/);
});
