import { z } from "zod";

export const AskRequestSchema = z.object({
  question: z.string().min(3).max(800),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;

export const EvidenceSchema = z.object({
  path: z.string(), // e.g. "SAMPLE_DATA.pages[4].bounceRate"
  // NOTE: keep optional in shared schema (providers may omit it)
  note: z.string().optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const AskResponseSchema = z.object({
  answer: z.string().min(1),
  insufficientData: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
  citations: z.array(z.string()).max(10),
  evidence: z.array(EvidenceSchema).max(10),

  // demo is still useful for UI + interviews
  demo: z.boolean(),

  // show exactly who produced the answer
  source: z.enum(["demo", "openai", "ollama"]),

  // optional: stable way to surface failures without breaking schema
  errorCode: z
    .enum([
      "MISCONFIGURED",
      "PROVIDER_UNAVAILABLE",
      "TIMEOUT",
      "RATE_LIMITED",
      "QUOTA_EXCEEDED",
      "BAD_PROVIDER_OUTPUT",
      "UNKNOWN",
    ])
    .optional(),
});

export type AskResponse = z.infer<typeof AskResponseSchema>;