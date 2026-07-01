import { describe, expect, it } from "vitest";

declare const process: { env: Record<string, string | undefined> };

describe("optional live provider tests", () => {
  it("only runs when LIVE_AI_TESTS=true", () => {
    expect(process.env.LIVE_AI_TESTS).toBe("true");
  });

  // Add real provider smoke tests here later.
  // These tests must never run on normal pull requests.
});
