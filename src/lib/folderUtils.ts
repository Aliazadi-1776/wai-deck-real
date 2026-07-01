import type { ChatSummary, Folder } from "../types";

export function deleteFolderAndUnassignChats(folders: Folder[], chats: ChatSummary[], folderId: string) {
  return {
    folders: folders.filter((folder) => folder.id !== folderId),
    chats: chats.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: null } : chat)),
  };
}

export function renameFolderById(folders: Folder[], folderId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return folders;
  return folders.map((folder) => (folder.id === folderId ? { ...folder, name: trimmed } : folder));
}
