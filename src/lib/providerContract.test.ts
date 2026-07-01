import { describe, expect, it } from "vitest";
import type { AIConnection } from "../types";
import { runChallenge, sendMessage, testAIConnection } from "./tauri";

const fixtureAI: AIConnection = {
  id: "ai-test",
  name: "Test AI",
  type: "api",
  provider: "openai-compatible",
  baseUrl: "https://api.example.com/v1",
  model: "test-model",
  purpose: "Testing",
  systemInstructions: "You are a test assistant.",
  status: "untested",
  apiKey: "test-key",
};

describe("provider bridge contract", () => {
  it("does not fake connection tests in browser preview mode", async () => {
    await expect(testAIConnection(fixtureAI)).rejects.toThrow("Tauri");
  });

  it("returns a safe browser preview response for chat", async () => {
    const result = await sendMessage(fixtureAI, "Hello");
    expect(result).toContain("Browser preview mode");
    expect(result).toContain("Hello");
  });

  it("returns separate challenge cards in browser preview mode", async () => {
    const outputs = await runChallenge([fixtureAI], "Compare this prompt");
    expect(outputs).toHaveLength(1);
    expect(outputs[0].status).toBe("failed");
    expect(outputs[0].output).toContain("Browser preview mode");
  });
});
