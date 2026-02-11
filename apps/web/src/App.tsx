import { useMemo, useState } from "react";
import {
  AskRequestSchema,
  AskResponseSchema,
  type AskResponse,
} from "@copilot/shared";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => question.trim().length >= 3, [question]);

  async function onAsk() {
    if (!canSubmit || loading) return;

    setError(null);
    setResult(null);

    const parsed = AskRequestSchema.safeParse({ question });
    if (!parsed.success) {
      setError("Please enter a longer, more specific question.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? "Unable to answer right now");
        return;
      }

      // ✅ Validate + normalize response before rendering
      const safe = AskResponseSchema.safeParse(body);
      if (!safe.success) {
        setError("Server returned an invalid response.");
        return;
      }

      setResult(safe.data);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const citations = result?.citations ?? [];
  const evidence = result?.evidence ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1f1f1f",
        color: "#fff",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(820px, 92vw)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <h1
          style={{ margin: 0, textAlign: "center", fontSize: 34, fontWeight: 700 }}
        >
          Product Insights Copilot (Demo)
        </h1>

        <div
          style={{
            width: "100%",
            borderRadius: 14,
            padding: 18,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <p style={{ opacity: 0.8, margin: 0, fontSize: 14, lineHeight: 1.4 }}>
            This is an applied LLM demo. It uses a fixed dataset and guardrails
            (schema validation, fallbacks).
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAsk();
              }}
              placeholder='e.g. "Which page has the highest bounce rate and why?"'
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                outline: "none",
              }}
            />

            <button
              onClick={onAsk}
              disabled={!canSubmit || loading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
                opacity: !canSubmit || loading ? 0.55 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "rgba(255,255,255,0.9)",
                      display: "inline-block",
                      animation: "spin 0.9s linear infinite",
                    }}
                  />
                  Asking...
                </>
              ) : (
                "Ask"
              )}
            </button>
          </div>

          {/* simple inline keyframes (no deps) */}
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

          {result && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <strong>Answer</strong>
                <span style={{ opacity: 0.7 }}>
                  confidence: {result.confidence} • insufficientData:{" "}
                  {String(result.insufficientData)} • source:{" "}
                  <strong>{result.source}</strong>
                  {result.errorCode ? (
                    <>
                      {" "}
                      • errorCode: <strong>{result.errorCode}</strong>
                    </>
                  ) : null}
                </span>
              </div>

              <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>{result.answer}</p>

              {citations.length > 0 && (
                <>
                  <strong>Citations</strong>
                  <ul>
                    {citations.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </>
              )}

              {evidence.length > 0 && (
                <>
                  <strong>Evidence</strong>
                  <ul>
                    {evidence.map((e, i) => (
                      <li key={i}>{e.path}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}