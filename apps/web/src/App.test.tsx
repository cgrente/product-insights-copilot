import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("disables Ask button until question is long enough", () => {
    render(<App />);

    const input = screen.getByPlaceholderText(
      /which page has the highest bounce rate/i
    ) as HTMLInputElement;

    const button = screen.getByRole("button", { name: /ask/i });
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: "hi" } });
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: "hello" } });
    expect(button).not.toBeDisabled();
  });

  it("calls API and renders answer", async () => {
    const mockResponse = {
      answer: "Mocked answer",
      insufficientData: false,
      confidence: "low",
      citations: ["SAMPLE_DATA.pages[].bounceRate"],
      evidence: [{ path: "SAMPLE_DATA.pages[].bounceRate" }],
      demo: false,
      source: "openai",
      // errorCode is optional; omit for success
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    render(<App />);

    const input = screen.getByPlaceholderText(
      /which page has the highest bounce rate/i
    ) as HTMLInputElement;

    fireEvent.change(input, {
      target: { value: "Which page has the highest bounce rate?" },
    });

    const button = screen.getByRole("button", { name: /ask/i });
    fireEvent.click(button);

    // Verify UI shows response
    expect(await screen.findByText(/mocked answer/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence:/i)).toBeInTheDocument();
    expect(screen.getByText(/source:/i)).toBeInTheDocument();

    // Optional sections should render too
    expect(screen.getByText(/citations/i)).toBeInTheDocument();
    expect(screen.getByText(/evidence/i)).toBeInTheDocument();
  });
});