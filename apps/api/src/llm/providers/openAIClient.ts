import OpenAI from 'openai';

export type OpenAiJsonSchema = Record<string, unknown>;

export async function askOpenAi(params: {
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    schema: OpenAiJsonSchema;
}) : Promise<string> {
    const client = new OpenAI({ apiKey: params.apiKey });

    const response = await client.responses.create({
        model: params.model,
        input: [
            { role: "system", content: [{ type: "input_text", text: params.systemPrompt }] },
            { role: "user", content: [{ type: "input_text", text: params.userPrompt }] },
        ],
        text: {
            format: {
                type: "json_schema",
                name: "response",
                schema: params.schema,
                strict: true,
            },
        },
    });

    return (response.output_text ?? "").trim();
}