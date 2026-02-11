# Schemas

Schemas live in `packages/shared` and are used by both API and Web.

## AskRequest

```json
{ "question": "Which page has the highest bounce rate?" }
```

## AskResponse (invariant shape)

To keep the UI simple, the API should return arrays even when empty:

- `citations: []`
- `evidence: []`

Example:

```json
{
  "answer": "…",
  "insufficientData": false,
  "confidence": "low",
  "citations": ["SAMPLE_DATA.pages[].bounceRate"],
  "evidence": [{ "path": "SAMPLE_DATA.pages[].bounceRate" }],
  "demo": false,
  "source": "openai",
  "errorCode": null
}
```

### Notes on provider strictness

- OpenAI strict JSON schema requires `required` to include every property at each level.
- Ollama JSON mode is best-effort; Zod validation remains mandatory.
