import { invoke } from "@tauri-apps/api/core";
import type { AIConnection, ChallengeOutput } from "../types";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function testAIConnection(ai: AIConnection): Promise<AIConnection> {
  if (isTauri) {
    return invoke<AIConnection>("test_ai_connection", { ai });
  }

  await sleep(300);
  throw new Error("Real provider tests must run inside Tauri. Use `npm run tauri dev` to avoid browser CORS limits.");
}

export async function sendMessage(ai: AIConnection, prompt: string): Promise<string> {
  if (isTauri) {
    return invoke<string>("send_message", { ai, prompt });
  }

  await sleep(300);
  return `Browser preview mode only.\n\nRun \`npm run tauri dev\` to send this prompt to ${ai.name}.\n\nPrompt:\n${prompt}`;
}

export async function runChallenge(ais: AIConnection[], prompt: string): Promise<ChallengeOutput[]> {
  if (isTauri) {
    return invoke<ChallengeOutput[]>("run_challenge", { ais, prompt });
  }

  const outputs = await Promise.all(
    ais.map(async (ai, index) => {
      await sleep(300 + index * 120);
      return {
        id: `challenge-${ai.id}`,
        aiId: ai.id,
        aiName: ai.name,
        status: "failed" as const,
        output: `Browser preview mode. Run \`npm run tauri dev\` to send this challenge to real providers.\n\nPrompt:\n${prompt}`,
        latencyMs: 300 + index * 120,
      };
    }),
  );

  return outputs;
}
