import { AskResponse, AskResponseSchema } from "@copilot/shared";
import { Provider } from "../types.js";

/**
 * Normalize provider output into the AskResponse shape we expect.
 * (Ollama may omit arrays; OpenAI strict won't, but we keep it defensive.)
 */
export function normalizeProviderObject(
  obj: Record<string, unknown>,
  provider: Provider
): AskResponse {
  const normalized: Record<string, unknown> = {
    ...obj,
    citations: Array.isArray(obj.citations) ? obj.citations : [],
    evidence: Array.isArray(obj.evidence) ? obj.evidence : [],
    demo: false,
    source: provider,
  };

  return AskResponseSchema.parse(normalized);
}