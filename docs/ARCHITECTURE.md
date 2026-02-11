# Architecture

## High-level flow

UI → API → provider → validated response

1) **React UI (apps/web)** sends `POST /ask` with `{ "question": "..." }`.
2) **Fastify API (apps/api)** validates request with `AskRequestSchema`, then calls `askCopilot(question)`.
3) **askCopilot** selects provider from env:
   - `openai` → OpenAI Responses API (strict JSON schema)
   - `ollama` → Ollama `/api/chat` (JSON mode)
4) Provider output is parsed to JSON and validated with `AskResponseSchema`.
5) API returns a normalized `AskResponse` for the UI to render.

## Provider selection rules

- `DEMO_MODE=true` → always deterministic demo answer.
- Otherwise:
  - `LLM_PROVIDER=openai|ollama` decides the provider.
  - `FALLBACK_PROVIDER=demo` (optional) can fallback to demo on provider failure.
  - In a “real system”, prefer returning a structured error response over silent demo fallback.

## Guardrails

- Dataset is the only source of truth (included in the prompt).
- JSON-only output requested from the model.
- Zod validation is the final gate before returning to the UI.
