import { getAuth } from "@clerk/express";
import { CreateAiCoachResponseBody, CreateAiCoachResponseResponse } from "@workspace/api-zod";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const adviceSystem = [
  "You are FinTwin, an educational personal-finance coach.",
  "Use only the financial snapshot supplied by the user. Be kind, concise, practical, and specific.",
  "Do not claim certainty, promise returns, or recommend specific securities. Do not treat this as regulated financial advice.",
  "Return exactly one JSON object with keys answer and chart. answer is plain text, at most 4 short paragraphs. chart is null unless a small chart directly answers the question; otherwise chart has title, labels (up to 8), and numeric values aligned to labels.",
  "Use the supplied currency and do not invent missing amounts. Mention important assumptions.",
].join(" ");

router.post("/ai/coach", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to use FinTwin AI." });
    return;
  }
  const parsed = CreateAiCoachResponseBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.question.trim()) {
    res.status(400).json({ error: "Enter a question and try again." });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "The AI service is not configured." });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_completion_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: adviceSystem },
          { role: "user", content: JSON.stringify({ question: parsed.data.question, snapshot: parsed.data.snapshot }) },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      req.log.warn({ status: response.status, userId }, "FinTwin AI provider request failed");
      res.status(502).json({ error: "FinTwin AI could not respond right now. Please try again." });
      return;
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: "FinTwin AI returned an empty response." });
      return;
    }
    const output = CreateAiCoachResponseResponse.safeParse(JSON.parse(content));
    if (!output.success) {
      req.log.warn({ userId }, "FinTwin AI response did not match its schema");
      res.status(502).json({ error: "FinTwin AI returned an unusable response. Please try again." });
      return;
    }
    res.json(output.data);
  } catch (error) {
    req.log.warn({ err: error, userId }, "FinTwin AI request failed");
    res.status(502).json({ error: "FinTwin AI is temporarily unavailable." });
  }
});

export default router;
