import { describe, expect, it } from "vitest";
import type { ChatSummary, Folder } from "../types";
import { deleteFolderAndUnassignChats, renameFolderById } from "./folderUtils";

const folders: Folder[] = [
  { id: "folder-1", name: "SEO" },
  { id: "folder-2", name: "Coding" },
];

const chats: ChatSummary[] = [
  { id: "chat-1", folderId: "folder-1", aiId: "ai-1", title: "A", updatedAt: "Now" },
  { id: "chat-2", folderId: "folder-2", aiId: "ai-1", title: "B", updatedAt: "Now" },
  { id: "chat-3", folderId: null, aiId: "ai-1", title: "C", updatedAt: "Now" },
];

describe("folder utilities", () => {
  it("deletes a folder without deleting chats inside it", () => {
    const result = deleteFolderAndUnassignChats(folders, chats, "folder-1");

    expect(result.folders).toEqual([{ id: "folder-2", name: "Coding" }]);
    expect(result.chats.find((chat) => chat.id === "chat-1")?.folderId).toBeNull();
    expect(result.chats.find((chat) => chat.id === "chat-2")?.folderId).toBe("folder-2");
  });

  it("renames a folder", () => {
    const result = renameFolderById(folders, "folder-2", "Code Reviews");
    expect(result.find((folder) => folder.id === "folder-2")?.name).toBe("Code Reviews");
  });
});
