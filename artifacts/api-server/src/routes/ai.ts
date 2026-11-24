import { Router, type IRouter, type Request } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middlewares/auth";
import { CreateAiCoachResponseBody, CreateAiCoachResponseResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const globalAiLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  keyGenerator: () => "ai-global",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "The AI service is busy. Please try again shortly." },
});

const userAiLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => {
    if (!req.auth?.userId) throw new Error("AI rate limit requires an authenticated user");
    return req.auth.userId;
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please try again shortly." },
});

const adviceSystem = [
  "You are FinTwin, an educational personal-finance coach.",
  "Use only the financial snapshot supplied by the user. Be kind, concise, practical, and specific.",
  "Do not claim certainty, promise returns, or recommend specific securities. Do not treat this as regulated financial advice.",
  "Return exactly one JSON object with keys answer and chart. answer is plain text, at most 4 short paragraphs. chart is null unless a small chart directly answers the question; otherwise chart has title, labels (up to 8), and numeric values aligned to labels.",
  "Use the supplied currency and do not invent missing amounts. Mention important assumptions.",
].join(" ");

/**
 * Call Google Gemini API for financial insights
 * API key is kept server-side only - NEVER exposed in frontend
 */
async function requestGemini(apiKey: string, input: { question: string; snapshot: unknown }): Promise<unknown> {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: adviceSystem }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(45_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}: ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message: string };
  };

  if (payload.error) {
    throw new Error(`Gemini API error: ${payload.error.message}`);
  }

  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini API returned an empty response");
  }

  return JSON.parse(content);
}

/**
 * POST /ai/coach
 * Generate AI financial insights using Gemini
 * Requires authentication
 */
router.post("/ai/coach", requireAuth, globalAiLimit, userAiLimit, async (req: Request, res): Promise<void> => {
  const parsed = CreateAiCoachResponseBody.safeParse(req.body);

  if (!parsed.success || !parsed.data.question.trim()) {
    res.status(400).json({ error: "Enter a question and try again." });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    req.log?.error("GEMINI_API_KEY is not configured");
    res.status(503).json({ error: "The AI service is not configured on the server." });
    return;
  }

  try {
    const input = { question: parsed.data.question, snapshot: parsed.data.snapshot };
    const output = CreateAiCoachResponseResponse.safeParse(await requestGemini(geminiKey, input));

    if (!output.success || (output.data.chart && output.data.chart.labels.length !== output.data.chart.values.length)) {
      req.log?.warn("Gemini returned an invalid response structure");
      res.status(502).json({ error: "AI service returned an invalid response. Please try again." });
      return;
    }

    res.json(output.data);
  } catch (err) {
    req.log?.error({ errorType: err instanceof Error ? err.name : "UnknownError" }, "Gemini API request failed");
    res.status(502).json({ error: "FinTwin AI could not respond right now. Please try again." });
  }
});

export default router;
