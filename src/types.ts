export type AIType = "local" | "api";

export type ProviderKind =
  | "ollama"
  | "local-test"
  | "lmstudio"
  | "jan"
  | "openai-compatible"
  | "openai"
  | "anthropic"
  | "gemini"
  | "custom";

export interface AIConnection {
  id: string;
  name: string;
  type: AIType;
  provider: ProviderKind;
  baseUrl: string;
  model: string;
  purpose: string;
  systemInstructions: string;
  status: "connected" | "offline" | "untested";
  apiKey?: string;
}

export interface Folder {
  id: string;
  name: string;
  chatCount?: number;
}

export interface ChatSummary {
  id: string;
  folderId: string | null;
  aiId: string;
  title: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  truncated?: boolean;
  error?: string;
}

export interface Message {
  id: string;
  chatId: string;
  aiId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachments?: AttachedFile[];
}

export interface ChallengeOutput {
  id: string;
  aiId: string;
  aiName: string;
  status: "completed" | "failed" | "running";
  output: string;
  latencyMs: number;
}
