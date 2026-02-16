/**
 * IMPORTANT:
 * OpenAI json_schema strict requires `required` to include every property at each level.
 * So we keep the model-output schema minimal and fully-required, with arrays allowed to be empty.
 */
const MODEL_JSON_SCHEMA = {
    type: "object",
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
                },
                required: ["path"],
            },
        },
    },
    required: ["answer", "insufficientData", "confidence", "citations", "evidence"],
} as const;

export default MODEL_JSON_SCHEMA;