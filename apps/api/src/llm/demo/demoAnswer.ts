import { AskResponse, AskResponseSchema } from "@copilot/shared";
import { SAMPLE_DATA } from "../../data/sampleData.js";

/**
 * Demo-mode answer (always returns a valid AskResponse).
 */
export function demoAnswer(question: string): AskResponse {
  const pages = SAMPLE_DATA.pages;

  if (!pages?.length) {
    return AskResponseSchema.parse({
      answer: "Demo mode: dataset has no pages, so I can't compute an answer.",
      insufficientData: true,
      confidence: "low",
      citations: ["SAMPLE_DATA.pages"],
      evidence: [],
      demo: true,
      source: "demo",
    });
  }

  const maxBouce = pages.reduce(
    (best, page) => (page.bounceRate > best.bounceRate ? page : best),
    pages[0]
  );

  const q = question.toLowerCase();
  if (q.includes("highest") && q.includes("bounce")) {
    return AskResponseSchema.parse({
      answer: `Demo mode: "${maxBouce.path}" has the highest bounce rate (${(
        maxBouce.bounceRate * 100
      ).toFixed(1)}%).`,
      insufficientData: false,
      confidence: "low",
      citations: ["SAMPLE_DATA.pages[].bounceRate"],
      evidence: [{ path: "SAMPLE_DATA.pages[].bounceRate" }],
      demo: true,
      source: "demo",
    });
  }

  return AskResponseSchema.parse({
    answer: `Demo mode: I can answer questions about pages (views, bounce rate) for ${SAMPLE_DATA.period}. Try: "Which page has the highest bounce rate?"`,
    insufficientData: false,
    confidence: "low",
    citations: ["SAMPLE_DATA"],
    evidence: [],
    demo: true,
    source: "demo",
  });
}