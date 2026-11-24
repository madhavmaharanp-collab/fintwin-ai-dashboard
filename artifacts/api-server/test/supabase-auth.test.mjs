import assert from "node:assert/strict";
import { after, test } from "node:test";
import { supabaseAuthMiddleware } from "../src/middlewares/auth.ts";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

async function run(header) {
  const req = { headers: { authorization: header } };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;
  await supabaseAuthMiddleware(req, res, () => { continued = true; });
  return { req, res, continued };
}

test("no bearer token leaves the request unauthenticated", async () => {
  const result = await run(undefined);
  assert.equal(result.continued, true);
  assert.equal(result.req.auth, undefined);
});

test("a forged token is rejected by Supabase rather than decoded locally", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(new Headers(options.headers).get("authorization"), "Bearer forged-token");
    return Response.json({ msg: "invalid JWT" }, { status: 401 });
  };
  const result = await run("Bearer forged-token");
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.continued, false);
  assert.equal(result.req.auth, undefined);
});

test("a verified user is passed to the next middleware", async () => {
  globalThis.fetch = async () => Response.json({
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@example.test",
    email_confirmed_at: "2026-01-01T00:00:00Z",
  });
  const result = await run("Bearer verified-token");
  assert.equal(result.continued, true);
  assert.equal(result.req.auth.userId, "00000000-0000-0000-0000-000000000001");
  assert.equal(result.req.auth.emailVerified, true);
});

test("an unavailable auth service fails closed", async () => {
  globalThis.fetch = async () => Response.json({ msg: "unavailable" }, { status: 503 });
  const result = await run("Bearer token");
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.continued, false);
});
