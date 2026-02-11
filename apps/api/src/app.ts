import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { AskRequestSchema, type AskRequest } from "@copilot/shared";
import { askCopilot } from "./llm/askCopilot.js";

export async function buildApp(): Promise<FastifyInstance> {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"), false);
    },
  });

  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  app.get("/health", async () => ({ ok: true }));

  app.post<{ Body: AskRequest }>("/ask", async (req, reply) => {
    const parsed = AskRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { question } = parsed.data;
    req.log.info({ len: question.length }, "ask request received");

    try {
      const result = await askCopilot(question);
      return reply.send(result);
    } catch (err) {
      // Only truly unexpected bugs should end up here.
      req.log.error({ err }, "ask request failed (unexpected)");
      return reply.status(500).send({ error: "Internal error" });
    }
  });

  return app;
}