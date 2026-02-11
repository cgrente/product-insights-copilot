type OllamaChatResponse = {
  message?: { content?: string };
};

export type AskOllamaParams = {
  baseUrl?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function getEnvBaseUrl(): string {
  return normalizeBaseUrl(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
}

function getEnvModel(): string {
  return process.env.OLLAMA_MODEL ?? "llama3.1:8b";
}

export async function askOllama(params: AskOllamaParams): Promise<string> {
  const baseUrl = normalizeBaseUrl(params.baseUrl ?? getEnvBaseUrl());
  const model = params.model ?? getEnvModel();
  const timeoutMs =
    params.timeoutMs ?? Number(process.env.LLM_TIMEOUT_MS ?? 15000);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,

        // Best-effort JSON discipline (supported by many Ollama models)
        format: "json",
        options: { temperature: 0 },

        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as OllamaChatResponse;
    const content = (json.message?.content ?? "").trim();

    // Help downstream debugging: empty content is a provider output issue.
    if (!content) {
      throw new Error("Ollama returned empty message.content");
    }

    return content;
  } catch (err: any) {
    // Make timeouts explicit (useful for your fallback logic)
    if (err?.name === "AbortError") {
      throw new Error(`Ollama request aborted (timeout after ${timeoutMs}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}