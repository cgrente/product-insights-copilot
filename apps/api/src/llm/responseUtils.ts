import { AskResponse } from "@copilot/shared";
import { demoAnswer } from "./demo/demoAnswer.js";
import { Provider, Fallback } from "./types.js";
import { normalizeProviderObject } from "./utils/normalize.js";
import { providerErrorAnswer } from "./utils/providerErrors.js";

export function parseProviderJson(
  raw: string,
  provider: Provider,
  fallback: Fallback,
  question: string
): AskResponse {
  if (!raw.trim()) {
    if (fallback === "demo") return demoAnswer(question);
    return providerErrorAnswer({ provider, message: `${provider} returned an empty response.` });
  }

  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return normalizeProviderObject(obj, provider);
  } catch {
    if (fallback === "demo") return demoAnswer(question);
    return providerErrorAnswer({ provider, message: `${provider} returned invalid JSON.` });
  }
}