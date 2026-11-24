import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import aiRouter from "../src/routes/ai";

process.env.GEMINI_API_KEY = "test-key";
const app = express();
app.use(express.json({ limit: "64kb" }));
app.use((req, _res, next) => {
  const userId = req.header("x-test-user");
  if (userId) req.auth = { userId };
  next();
});
app.use(aiRouter);

const originalFetch = globalThis.fetch;
let baseUrl: string;
let calls = 0;
let chart: unknown = null;
const server = app.listen(0);

before(async () => {
  if (!server.listening) await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
      calls++;
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: "Test", chart }) }] } }] });
    }
    return originalFetch(input, init);
  };
});

after(async () => {
  globalThis.fetch = originalFetch;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const body = {
  question: "How is my budget?",
  snapshot: {
    currency: "USD", monthlyIncome: 100, monthlyExpenses: 20,
    monthlySurplus: 80, savingsRate: 80, netWorth: 100,
    transactions: [], goals: [],
  },
};

function request(userId?: string) {
  return originalFetch(`${baseUrl}/ai/coach`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(userId ? { "x-test-user": userId } : {}) },
    body: JSON.stringify(body),
  });
}

test("unauthenticated requests are rejected before reaching Gemini", async () => {
  const response = await request();
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test("AI requests are limited to ten per minute per user", async () => {
  for (let i = 0; i < 10; i++) {
    assert.equal((await request("user-one")).status, 200);
  }
  const blocked = await request("user-one");
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get("retry-after"));
  assert.equal(calls, 10);
  assert.equal((await request("user-two")).status, 200);
});

test("AI chart labels and values must align", async () => {
  chart = { title: "Bad chart", labels: ["A", "B"], values: [1] };
  assert.equal((await request("user-three")).status, 502);
});

test("the instance limit applies across authenticated users", async () => {
  chart = null;
  for (let i = 0; i < 107; i++) {
    assert.equal((await request(`global-user-${Math.floor(i / 10)}`)).status, 200);
  }
  const blocked = await request("new-user");
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), { error: "The AI service is busy. Please try again shortly." });
});
