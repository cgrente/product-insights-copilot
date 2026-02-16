import { AskResponse, AskResponseSchema } from "@copilot/shared";
import { Provider } from "../types.js";

type ProviderErrorParams = {
  provider: Provider;
  message: string;
  insufficientData?: boolean;
};

/**
 * Returns a valid AskResponse when provider fails AND demo fallback is disabled.
 * We keep it schema-valid by using answer + insufficientData=true, plus empty arrays.
 */
export function providerErrorAnswer(params: ProviderErrorParams): AskResponse {
  return AskResponseSchema.parse({
    answer: params.message,
    insufficientData: params.insufficientData ?? true,
    confidence: "low",
    citations: [],
    evidence: [],
    demo: false,
    source: params.provider,
  });
}
