import type { ScoredPosition } from "./types";

// Accepts Grok (xAI), Groq (Llama), or Gemini — all OpenAI-compatible.
const XAI_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const PROVIDER = XAI_KEY
  ? {
      key: XAI_KEY,
      baseUrl: "https://api.x.ai/v1",
      model: process.env.XAI_MODEL || "grok-2-1212",
      name: "grok",
    }
  : GEMINI_KEY
    ? {
        key: GEMINI_KEY,
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
        name: "gemini",
      }
    : GROQ_KEY
      ? {
          key: GROQ_KEY,
          baseUrl: "https://api.groq.com/openai/v1",
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          name: "groq",
        }
      : null;

export function isAiEnhanceEnabled(): boolean {
  return PROVIDER !== null;
}

interface EnhancedOutput {
  aiSummary: string;
  aiExplanation: string[];
}

const SYSTEM_PROMPT = `You are a DeFi portfolio analyst for the DeFi Sweeper agent.
For each stale/healthy DeFi position, produce a terse, specific one-sentence summary and 2-4 concrete explanations.
Focus on: dust thresholds, opportunity cost, protocol risk, unclaimed rewards, liquidation risk (healthRate < 1.5), and gas-vs-value tradeoff.
Never use marketing fluff. No emojis. Write like an on-call engineer.
Respond ONLY with JSON: {"aiSummary": string, "aiExplanation": string[]}.`;

async function callProvider(
  userMessage: string,
  timeoutMs: number
): Promise<EnhancedOutput | null> {
  if (!PROVIDER) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${PROVIDER.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROVIDER.key}`,
      },
      body: JSON.stringify({
        model: PROVIDER.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`${PROVIDER.name} HTTP ${res.status}:`, (await res.text()).slice(0, 200));
      return null;
    }
    const j = await res.json();
    const text: string = j.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    if (typeof parsed.aiSummary !== "string" || !Array.isArray(parsed.aiExplanation)) {
      return null;
    }
    return {
      aiSummary: parsed.aiSummary,
      aiExplanation: parsed.aiExplanation.slice(0, 4).map(String),
    };
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      console.warn("AI enhance failed:", (err as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function describe(p: ScoredPosition): string {
  const rewards = p.rewards
    .filter((r) => parseFloat(r.amount || "0") > 0)
    .map((r) => `${parseFloat(r.amount).toFixed(4)} ${r.symbol} (~$${parseFloat(r.valueUsd || "0").toFixed(2)})`)
    .join(", ");
  const tokens = p.tokens
    .map((t) => `${t.symbol}=${parseFloat(t.amount).toFixed(4)} ($${parseFloat(t.valueUsd || "0").toFixed(2)})`)
    .join(", ");
  return [
    `Position: ${p.platformName} on ${p.chainLabel}`,
    `Type: ${p.investTypeLabel}`,
    `Total USD: $${p.totalValueUsd.toFixed(2)}`,
    `Heuristic health score: ${p.healthScore}/100 (${p.healthStatus})`,
    `Tokens: ${tokens}`,
    `Unclaimed rewards: ${rewards || "none"}`,
    `Heuristic summary: ${p.aiSummary}`,
    `Heuristic explanations: ${p.aiExplanation.join(" | ")}`,
    `Sweep target: ${p.recommendation.target || "none"} @ ${p.recommendation.targetApy || "—"}`,
  ].join("\n");
}

export async function enhanceWithAi(
  positions: ScoredPosition[],
  timeoutMsPerCall = 8000
): Promise<ScoredPosition[]> {
  if (!PROVIDER || positions.length === 0) return positions;

  // Gemini free tier is rate-limited — run sequentially with spacing.
  // Other providers can go in parallel.
  const isGemini = PROVIDER.name === "gemini";
  const results: ScoredPosition[] = [];

  if (isGemini) {
    for (const p of positions) {
      const enhanced = await callProvider(describe(p), timeoutMsPerCall);
      results.push(
        enhanced
          ? { ...p, aiSummary: enhanced.aiSummary, aiExplanation: enhanced.aiExplanation }
          : p
      );
      // ~250ms spacing keeps us under 15 rpm with overhead room
      await new Promise((r) => setTimeout(r, 250));
    }
    return results;
  }

  return Promise.all(
    positions.map(async (p) => {
      const enhanced = await callProvider(describe(p), timeoutMsPerCall);
      return enhanced
        ? { ...p, aiSummary: enhanced.aiSummary, aiExplanation: enhanced.aiExplanation }
        : p;
    })
  );
}

export function aiProviderName(): string {
  return PROVIDER?.name || "heuristic";
}
