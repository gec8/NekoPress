import assert from "node:assert/strict";
import test from "node:test";
import { consumeFixedWindow, isRecentDuplicate, recordSubmission, requestClientKey } from "../../lib/request-security.ts";

test("extracts the first forwarded client address",()=>{
  const request=new Request("https://example.com",{headers:{"x-forwarded-for":"203.0.113.7, 10.0.0.1"}});
  assert.equal(requestClientKey(request),"203.0.113.7");
});

test("limits requests inside a fixed window",()=>{
  const key=`test-rate-${crypto.randomUUID()}`;
  assert.equal(consumeFixedWindow(key,2,60_000).allowed,true);
  assert.equal(consumeFixedWindow(key,2,60_000).allowed,true);
  assert.equal(consumeFixedWindow(key,2,60_000).allowed,false);
});

test("recognizes a recently recorded duplicate",()=>{
  const key=`test-duplicate-${crypto.randomUUID()}`;
  assert.equal(isRecentDuplicate(key,60_000),false);
  recordSubmission(key);
  assert.equal(isRecentDuplicate(key,60_000),true);
});
