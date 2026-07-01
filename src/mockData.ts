import type { AIConnection, ChatSummary, Folder, Message } from "./types";

export const initialAIs: AIConnection[] = [];

// No default folders. Users create folders only when they need them.
export const initialFolders: Folder[] = [];

export const initialChats: ChatSummary[] = [];

export const initialMessages: Message[] = [];
