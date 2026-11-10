import { getAuth } from "@clerk/express";
import { CreateAiCoachResponseBody, CreateAiCoachResponseResponse } from "@workspace/api-zod";
import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();
const adviceSystem = [
  "You are FinTwin, an educational personal-finance coach.",
  "Use only the financial snapshot supplied by the user. Be kind, concise, practical, and specific.",
  "Do not claim certainty, promise returns, or recommend specific securities. Do not treat this as regulated financial advice.",
  "Return exactly one JSON object with keys answer and chart. answer is plain text, at most 4 short paragraphs. chart is null unless a small chart directly answers the question; otherwise chart has title, labels (up to 8), and numeric values aligned to labels.",
  "Use the supplied currency and do not invent missing amounts. Mention important assumptions.",
].join(" ");

async function requestOpenAI(apiKey: string, input: { question: string; snapshot: unknown }): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: adviceSystem },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return JSON.parse(content);
}

async function requestGoogleAI(apiKey: string, input: { question: string; snapshot: unknown }): Promise<unknown> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: adviceSystem }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Google AI returned ${response.status}`);
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) throw new Error("Google AI returned an empty response");
  return JSON.parse(content);
}

async function tryProvider(
  provider: "openai" | "google",
  generate: () => Promise<unknown>,
  req: Request,
) {
  try {
    const output = CreateAiCoachResponseResponse.safeParse(await generate());
    if (output.success) return output.data;
    req.log.warn({ provider }, "FinTwin AI provider returned an invalid response");
  } catch {
    // Never log provider errors or request objects; they can contain sensitive details.
    req.log.warn({ provider }, "FinTwin AI provider request failed; trying fallback if available");
  }
  return null;
}

router.post("/ai/coach", async (req, res): Promise<void> => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Sign in to use FinTwin AI." });
    return;
  }
  const parsed = CreateAiCoachResponseBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.question.trim()) {
    res.status(400).json({ error: "Enter a question and try again." });
    return;
  }
  const openAiKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!openAiKey && !googleKey) {
    res.status(503).json({ error: "The AI service is not configured." });
    return;
  }

  const input = { question: parsed.data.question, snapshot: parsed.data.snapshot };
  let output = openAiKey ? await tryProvider("openai", () => requestOpenAI(openAiKey, input), req) : null;
  if (!output && googleKey) {
    if (openAiKey) req.log.info("Using Google AI fallback for FinTwin coach");
    output = await tryProvider("google", () => requestGoogleAI(googleKey, input), req);
  }
  if (!output) {
    res.status(502).json({ error: "FinTwin AI could not respond right now. Please try again." });
    return;
  }
  res.json(output);
});

export default router;
