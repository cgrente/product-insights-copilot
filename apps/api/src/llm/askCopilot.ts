import OpenAI from "openai";
import { SAMPLE_DATA } from "../data/sampleData.js";
import { AskResponseSchema, type AskResponse } from "@copilot/shared";
import { askOllama } from "./ollamaClient.js";

type Provider = "openai" | "ollama";

function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

function getProvider(): Provider {
  return process.env.LLM_PROVIDER === "ollama" ? "ollama" : "openai";
}

function getFallbackProvider(): "demo" | "none" {
  // Explicit only. If not set, no demo fallback.
  return process.env.FALLBACK_PROVIDER === "demo" ? "demo" : "none";
}

function hasOpenAiKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

function maskKey(key?: string) {
  if (!key) return "(none)";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

/**
 * Demo-mode answer (always returns a valid AskResponse).
 */
function demoAnswer(question: string): AskResponse {
  const pages = SAMPLE_DATA.pages;

  if (!pages?.length) {
    return AskResponseSchema.parse({
      answer: "Demo mode: dataset has no pages, so I can't compute an answer.",
      insufficientData: true,
      confidence: "low",
      citations: ["SAMPLE_DATA.pages"],
      evidence: [],
      demo: true,
      source: "demo",
    });
  }

  const max = pages.reduce(
    (best, p) => (p.bounceRate > best.bounceRate ? p : best),
    pages[0]
  );

  const q = question.toLowerCase();
  if (q.includes("highest") && q.includes("bounce")) {
    return AskResponseSchema.parse({
      answer: `Demo mode: "${max.path}" has the highest bounce rate (${(
        max.bounceRate * 100
      ).toFixed(1)}%).`,
      insufficientData: false,
      confidence: "low",
      citations: ["SAMPLE_DATA.pages[].bounceRate"],
      evidence: [{ path: "SAMPLE_DATA.pages[].bounceRate" }],
      demo: true,
      source: "demo",
    });
  }

  return AskResponseSchema.parse({
    answer: `Demo mode: I can answer questions about pages (views, bounce rate) for ${SAMPLE_DATA.period}. Try: "Which page has the highest bounce rate?"`,
    insufficientData: false,
    confidence: "low",
    citations: ["SAMPLE_DATA"],
    evidence: [],
    demo: true,
    source: "demo",
  });
}

/**
 * IMPORTANT:
 * OpenAI json_schema strict requires `required` to include every property at each level.
 * So we keep the model-output schema minimal and fully-required, with arrays allowed to be empty.
 */
const MODEL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    insufficientData: { type: "boolean" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    citations: { type: "array", items: { type: "string" }, maxItems: 10 },
    evidence: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          path: { type: "string" },
          // Do NOT include "note" here (strict schema will force it to be required)
        },
        required: ["path"],
      },
    },
  },
  required: ["answer", "insufficientData", "confidence", "citations", "evidence"],
} as const;

/**
 * Returns a valid AskResponse when provider fails AND demo fallback is disabled.
 * We keep it schema-valid by using answer + insufficientData=true, plus empty arrays.
 */
function providerErrorAnswer(params: {
  provider: Provider;
  message: string;
  insufficientData?: boolean;
}): AskResponse {
  const { provider, message } = params;

  return AskResponseSchema.parse({
    answer: message,
    insufficientData: params.insufficientData ?? true,
    confidence: "low",
    citations: [],
    evidence: [],
    demo: false,
    source: provider,
  });
}

/**
 * Normalize provider output into the AskResponse shape we expect.
 * (Ollama may omit arrays; OpenAI strict won't, but we keep it defensive.)
 */
function normalizeProviderObject(
  obj: Record<string, unknown>,
  provider: Provider
): AskResponse {
  const normalized: Record<string, unknown> = {
    ...obj,

    // enforce required arrays
    citations: Array.isArray(obj.citations) ? obj.citations : [],
    evidence: Array.isArray(obj.evidence) ? obj.evidence : [],

    demo: false,
    source: provider,
  };

  return AskResponseSchema.parse(normalized);
}

export async function askCopilot(question: string): Promise<AskResponse> {
  // Explicit demo mode always wins
  if (isDemoMode()) return demoAnswer(question);

  const provider = getProvider();
  const fallback = getFallbackProvider();

  const systemPrompt = `
You are a product analytics copilot.

Return ONLY a valid JSON object with EXACTLY these keys:
- answer: string
- insufficientData: boolean
- confidence: "low" | "medium" | "high"
- citations: string[]
- evidence: { path: string }[]

Rules:
- The dataset provided is the ONLY source of truth.
- Do NOT invent metrics or pages.
- If the question cannot be answered from the data, set insufficientData=true.
- Always include citations and evidence arrays (can be empty).
- Do not wrap JSON in markdown.
`.trim();

  const userPrompt = `
DATASET (source of truth):
${JSON.stringify(SAMPLE_DATA, null, 2)}

QUESTION:
${question}
`.trim();

  // -------- OPENAI --------
  if (provider === "openai") {
    if (!hasOpenAiKey()) {
      if (fallback === "demo") return demoAnswer(question);
      return providerErrorAnswer({
        provider: "openai",
        message:
          "OpenAI provider selected but OPENAI_API_KEY is missing. Set OPENAI_API_KEY or switch LLM_PROVIDER.",
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    console.log("[askCopilot] Using OpenAI", {
      model,
      key: maskKey(process.env.OPENAI_API_KEY),
    });

    try {
      const response = await client.responses.create({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ask_response",
            schema: MODEL_JSON_SCHEMA,
            strict: true,
          },
        },
      });

      const raw = (response.output_text ?? "").trim();
      if (!raw) {
        if (fallback === "demo") return demoAnswer(question);
        return providerErrorAnswer({
          provider: "openai",
          message: "OpenAI returned an empty response.",
        });
      }

      let obj: unknown;
      try {
        obj = JSON.parse(raw);
      } catch {
        if (fallback === "demo") return demoAnswer(question);
        return providerErrorAnswer({
          provider: "openai",
          message: "OpenAI returned invalid JSON.",
        });
      }

      return normalizeProviderObject(obj as Record<string, unknown>, "openai");
    } catch (err: any) {
      const status = err?.status;
      const code = err?.code;
      const message = String(err?.message ?? "");

      console.log("[askCopilot] OpenAI error", { status, code, message });

      // quota/billing errors -> optional demo fallback
      if (fallback === "demo" && (status === 429 || code === "insufficient_quota")) {
        return demoAnswer(question);
      }

      // if demo fallback enabled, use it for any OpenAI failure
      if (fallback === "demo") return demoAnswer(question);

      if (status === 429 || code === "insufficient_quota") {
        return providerErrorAnswer({
          provider: "openai",
          message:
            "OpenAI quota/billing is unavailable for this key/project. Check billing or switch provider.",
        });
      }

      return providerErrorAnswer({
        provider: "openai",
        message: "OpenAI provider failed to respond. Please try again.",
      });
    }
  }

  // -------- OLLAMA --------
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 12000);

  console.log("[askCopilot] Using Ollama (local)", {
    baseUrl: ollamaBaseUrl,
    model: ollamaModel,
  });

  try {
    const raw = await askOllama({
      baseUrl: ollamaBaseUrl,
      model: ollamaModel,
      systemPrompt,
      userPrompt,
      timeoutMs,
    });

    if (!raw) {
      if (fallback === "demo") return demoAnswer(question);
      return providerErrorAnswer({
        provider: "ollama",
        message: "Ollama returned an empty response.",
      });
    }

    let obj: unknown;
    try {
      obj = JSON.parse(raw);
    } catch {
      if (fallback === "demo") return demoAnswer(question);
      return providerErrorAnswer({
        provider: "ollama",
        message:
          "Ollama returned non-JSON output. Ensure ollamaClient uses format:'json' and your prompt forbids extra text.",
      });
    }

    return normalizeProviderObject(obj as Record<string, unknown>, "ollama");
  } catch (err: any) {
    const message = String(err?.message ?? "");
    console.log("[askCopilot] Ollama error", { message });

    if (fallback === "demo") return demoAnswer(question);

    const lower = message.toLowerCase();
    const isTimeout =
      lower.includes("aborted") || lower.includes("timeout") || lower.includes("abort");

    return providerErrorAnswer({
      provider: "ollama",
      message: isTimeout
        ? "Ollama timed out. Try again or increase LLM_TIMEOUT_MS."
        : "Ollama provider is unavailable. Is Ollama running locally?",
    });
  }
}