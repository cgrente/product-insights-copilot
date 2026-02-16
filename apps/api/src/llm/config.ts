import { Provider } from "./types.js";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getProvider(): Provider {
  return process.env.LLM_PROVIDER === "ollama" ? "ollama" : "openai";
}

export function getFallbackProvider(): "demo" | "none" {
  // Explicit only. If not set, no demo fallback.
  return process.env.FALLBACK_PROVIDER === "demo" ? "demo" : "none";
}

export function getOllamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL ?? "llama3.1:8b",
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 12000),
  };
}

export function getOpenAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}