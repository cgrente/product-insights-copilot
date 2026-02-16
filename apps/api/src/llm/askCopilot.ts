import { type AskResponse } from "@copilot/shared";
import { askOllama } from "./providers/ollamaClient.js";
import { askOpenAi } from "./providers/openAIClient.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompt/buildPrompts.js";
import { demoAnswer } from "./demo/demoAnswer.js";
import MODEL_JSON_SCHEMA from "./schema/modelSchema.js";
import { isDemoMode, getProvider, getFallbackProvider, getOpenAiConfig, getOllamaConfig } from "./config.js";
import { providerErrorAnswer } from "./utils/providerErrors.js";
import { parseProviderJson } from "./responseUtils.js";

export async function askCopilot(question: string): Promise<AskResponse> {
  // Explicit demo mode always wins
  if (isDemoMode()) return demoAnswer(question);

  const provider = getProvider();
  const fallback = getFallbackProvider();
  
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(question);

  // -------- OPENAI --------
  if (provider === "openai") {
    const { apiKey, model } = getOpenAiConfig();

    if (!apiKey.trim()) {
      if (fallback === "demo")
        return demoAnswer(question);

      return providerErrorAnswer({
        provider: "openai",
        message: "OpenAI API key is not configured. Set OPENAI_API_KEY env variable.",
      });
    }

    try {
      const raw = await askOpenAi({
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        schema: MODEL_JSON_SCHEMA,
      });

      return parseProviderJson(raw, "openai", fallback, question);
    } catch (err: any) {
      const status = err?.status;
      const code = err?.code;

      // quota/billing errors -> optional demo fallback
      if (fallback === "demo" && (status === 429 || code === "insufficient_quota")) {
        return demoAnswer(question);
      }

      // if demo fallback enabled, use it for any OpenAI failure
      if (fallback === "demo")
        return demoAnswer(question);

      return providerErrorAnswer({
        provider: "openai",
        message:
          status === 429 || code === "insufficient_quota"
            ? "OpenAI is rate-limited or quota is exceeded. Check billing or switch provider."
            : "OpenAI provider failed to respond. Please try again.",
      });
    }
  }

  // -------- OLLAMA --------
  const { baseUrl, model, timeoutMs } = getOllamaConfig();
  try {
    const raw = await askOllama({
      baseUrl,
      model,
      systemPrompt,
      userPrompt,
      timeoutMs,
    });

    return parseProviderJson(raw, "ollama", fallback, question);
  } catch (err: any) {
    if (fallback === "demo") return demoAnswer(question);

    const msg = String(err?.message ?? "").toLowerCase();
    const isTimeout =
      msg.includes("aborted") || msg.includes("timeout") || msg.includes("abort");

    return providerErrorAnswer({
      provider: "ollama",
      message: isTimeout
        ? "Ollama timed out. Try again or increase LLM_TIMEOUT_MS."
        : "Ollama provider is unavailable. Is Ollama running locally?",
    });
  }
}