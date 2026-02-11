import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildApp } from "../app.js";

// Mock askCopilot so tests don't hit OpenAI
vi.mock("../llm/askCopilot.js", () => {
  return {
    askCopilot: vi.fn(async () => ({
      answer: "Pricing page has lower bounce rate than blog in the provided dataset.",
      insufficientData: false,
      confidence: "medium",
      citations: ["pages[].bounceRate"],
    })),
  };
});

describe("POST /ask", () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = "http://localhost:5173";
  });

  it("validates input and returns response", async () => {
    const app = await buildApp();

    const res = await app.inject({
      method: "POST",
      url: "/ask",
      payload: { question: "Which page has the highest bounce rate?" },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body).toMatchObject({
      insufficientData: false,
      confidence: "medium",
    });
    expect(typeof body.answer).toBe("string");

    await app.close();
  });

  it("rejects invalid payload", async () => {
    const app = await buildApp();

    const res = await app.inject({
      method: "POST",
      url: "/ask",
      payload: { question: "" },
    });

    expect(res.statusCode).toBe(400);

    await app.close();
  });
});