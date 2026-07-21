import {
  Archive,
  Bot,
  Edit3,
  Folder,
  FolderPlus,
  Moon,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  Swords,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AIConnection, ChatSummary, Folder as FolderType } from "../types";

const ConfirmDialog = lazy(() => import("./ConfirmDialog").then((module) => ({ default: module.ConfirmDialog })));
const TextInputDialog = lazy(() => import("./TextInputDialog").then((module) => ({ default: module.TextInputDialog })));

interface SidebarProps {
  ais: AIConnection[];
  folders: FolderType[];
  chats: ChatSummary[];
  activeChatId: string | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNewChat: () => void;
  onNewFolder: () => void;
  onAddAI: () => void;
  onChallenge: () => void;
  onSelectChat: (chatId: string) => void;
  onTogglePin: (chatId: string) => void;
  onMoveChat: (chatId: string, folderId: string | null) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

function DialogBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />}>{children}</Suspense>;
}

export function Sidebar({
  ais,
  folders,
  chats,
  activeChatId,
  theme,
  onToggleTheme,
  onNewChat,
  onNewFolder,
  onAddAI,
  onChallenge,
  onSelectChat,
  onTogglePin,
  onMoveChat,
  onRenameChat,
  onDeleteChat,
  onRenameFolder,
  onDeleteFolder,
}: SidebarProps) {
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);
  const [renameChat, setRenameChat] = useState<ChatSummary | null>(null);
  const [deleteChat, setDeleteChat] = useState<ChatSummary | null>(null);
  const [renameFolder, setRenameFolder] = useState<FolderType | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<FolderType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeFolderId !== "all" && !folders.some((folder) => folder.id === activeFolderId)) {
      setActiveFolderId("all");
    }
  }, [activeFolderId, folders]);

  const aiById = useMemo(() => new Map(ais.map((ai) => [ai.id, ai])), [ais]);
  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    chats.forEach((chat) => {
      if (chat.folderId) map.set(chat.folderId, (map.get(chat.folderId) ?? 0) + 1);
    });
    return map;
  }, [chats]);

  const visibleChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = chats.filter((chat) => {
      const inActiveFolder = activeFolderId === "all" || chat.folderId === activeFolderId;
      if (!inActiveFolder) return false;
      if (!query) return true;

      const ai = aiById.get(chat.aiId);
      const folder = chat.folderId ? folderById.get(chat.folderId) : undefined;
      const searchableText = [chat.title, ai?.name, ai?.model, folder?.name, chat.updatedAt].filter(Boolean).join(" ").toLowerCase();
      return searchableText.includes(query);
    });
    return [...list].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [activeFolderId, aiById, chats, folderById, searchQuery]);

  return (
    <aside className="flex h-screen w-[324px] shrink-0 flex-col border-r border-line bg-paper p-4">
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight">WAI Deck</h1>
            <p className="text-xs font-medium text-muted">Your AI control center</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleTheme} className="btn-ghost !p-2.5" title={theme === "light" ? "Switch to dark" : "Switch to light"}>
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button onClick={onAddAI} className="btn-ghost !p-2.5" title="Add AI">
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onNewChat} className="btn-primary !rounded-2xl">
          <Plus size={16} /> New Chat
        </button>
        <button onClick={onNewFolder} className="btn-secondary !rounded-2xl">
          <FolderPlus size={16} /> Folder
        </button>
      </div>

      <button onClick={onChallenge} className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-ink bg-paper px-4 py-3 text-sm font-black text-ink transition hover:bg-ink hover:text-paper">
        <Swords size={17} /> AI Challenge
      </button>

      <div className="mt-6">
        <p className="section-label mb-3 px-2">Folders</p>
        <div className="space-y-1">
          <button
            onClick={() => setActiveFolderId("all")}
            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${activeFolderId === "all" ? "bg-ink text-paper" : "text-muted hover:bg-soft hover:text-ink"}`}
          >
            <span className="flex items-center gap-2"><Archive size={16} /> All chats</span>
            <span className={activeFolderId === "all" ? "text-paper/60" : "text-muted"}>{chats.length}</span>
          </button>

          {folders.map((folder) => {
            const active = activeFolderId === folder.id;
            return (
              <div key={folder.id} className="relative flex items-center gap-1">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${active ? "bg-ink text-paper" : "text-muted hover:bg-soft hover:text-ink"}`}
                >
                  <span className="flex min-w-0 items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2"><Folder size={16} className="shrink-0" /> <span className="truncate">{folder.name}</span></span>
                    <span className={active ? "text-paper/60" : "text-muted"}>{folderCounts.get(folder.id) ?? 0}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenMenuFolderId((current) => (current === folder.id ? null : folder.id))}
                  className={`rounded-xl p-2 transition ${active ? "text-ink hover:bg-soft" : "text-muted hover:bg-soft hover:text-ink"}`}
                  aria-label="Folder actions"
                >
                  <MoreHorizontal size={17} />
                </button>

                {openMenuFolderId === folder.id && (
                  <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-line bg-paper p-2 text-ink shadow-pop">
                    <button
                      type="button"
                      onClick={() => {
                        setRenameFolder(folder);
                        setOpenMenuFolderId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-muted hover:bg-soft hover:text-ink"
                    >
                      <Edit3 size={15} /> Rename folder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteFolder(folder);
                        setOpenMenuFolderId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={15} /> Delete folder
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {folders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-canvas px-3 py-3 text-xs leading-5 text-muted">
              No folders yet. Create folders only when you need them.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={activeFolderId === "all" ? "Search all chats..." : "Search in this folder..."}
            className="h-11 w-full rounded-2xl border border-line bg-canvas pl-9 pr-9 text-sm font-semibold text-ink outline-none transition placeholder:text-muted/50 focus:border-ink focus:bg-paper focus:ring-4 focus:ring-ink/5"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-muted hover:bg-soft hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <div className="nice-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="section-label">Chats</p>
          {searchQuery && <span className="text-xs font-bold text-muted">{visibleChats.length} found</span>}
        </div>
        <div className="space-y-2">
          {visibleChats.map((chat) => {
            const active = activeChatId === chat.id;
            const ai = aiById.get(chat.aiId);
            const folder = chat.folderId ? folderById.get(chat.folderId) : undefined;
            return (
              <div key={chat.id} className={`group relative rounded-3xl border p-3 transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-canvas hover:border-ink hover:bg-paper"}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => onSelectChat(chat.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-start gap-2">
                      {chat.isPinned && <Pin size={13} className={active ? "mt-1 shrink-0 text-paper" : "mt-1 shrink-0 text-ink"} />}
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-black">{chat.title}</div>
                        <div className={`mt-1 line-clamp-1 text-xs ${active ? "text-paper/60" : "text-muted"}`}>
                          {ai?.name ?? "Unknown AI"} · {folder?.name ?? "No folder"} · {chat.updatedAt}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setOpenMenuChatId((current) => (current === chat.id ? null : chat.id))}
                    className={`rounded-xl p-2 transition ${active ? "text-paper/70 hover:bg-paper/10 hover:text-paper" : "text-muted hover:bg-soft hover:text-ink"}`}
                    aria-label="Chat actions"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {openMenuChatId === chat.id && (
                  <div className="absolute right-3 top-12 z-20 w-60 rounded-2xl border border-line bg-paper p-2 text-ink shadow-pop">
                    <button
                      onClick={() => {
                        setRenameChat(chat);
                        setOpenMenuChatId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-muted hover:bg-soft hover:text-ink"
                    >
                      <Edit3 size={15} /> Rename chat
                    </button>

                    <button
                      onClick={() => {
                        onTogglePin(chat.id);
                        setOpenMenuChatId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-muted hover:bg-soft hover:text-ink"
                    >
                      {chat.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                      {chat.isPinned ? "Unpin chat" : "Pin chat"}
                    </button>

                    <button
                      onClick={() => {
                        setDeleteChat(chat);
                        setOpenMenuChatId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={15} /> Delete chat
                    </button>

                    <div className="my-2 h-px bg-line" />
                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted">Move to folder</p>
                    <button
                      onClick={() => {
                        onMoveChat(chat.id, null);
                        setOpenMenuChatId(null);
                        setActiveFolderId("all");
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold text-muted hover:bg-soft hover:text-ink"
                    >
                      <span className="flex items-center gap-2"><Archive size={15} /> No folder</span>
                      {!chat.folderId && <span>✓</span>}
                    </button>
                    {folders.map((folderItem) => (
                      <button
                        key={folderItem.id}
                        onClick={() => {
                          onMoveChat(chat.id, folderItem.id);
                          setOpenMenuChatId(null);
                          setActiveFolderId(folderItem.id);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold text-muted hover:bg-soft hover:text-ink"
                      >
                        <span className="flex min-w-0 items-center gap-2"><Folder size={15} className="shrink-0" /> <span className="truncate">{folderItem.name}</span></span>
                        {chat.folderId === folderItem.id && <span>✓</span>}
                      </button>
                    ))}
                    {folders.length === 0 && (
                      <p className="px-3 py-2 text-xs leading-5 text-muted">Create a folder first to move chats into it.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visibleChats.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line bg-canvas p-5 text-center text-sm leading-6 text-muted">
              {searchQuery ? "No chats match your search." : "No chats here yet."}
            </div>
          )}
        </div>
      </div>

      {renameChat && (
        <DialogBoundary>
          <TextInputDialog
            title="Rename chat"
            description="Give this conversation a clearer title."
            label="Chat title"
            initialValue={renameChat.title}
            confirmLabel="Rename"
            onCancel={() => setRenameChat(null)}
            onConfirm={(value) => {
              onRenameChat(renameChat.id, value);
              setRenameChat(null);
            }}
          />
        </DialogBoundary>
      )}

      {deleteChat && (
        <DialogBoundary>
          <ConfirmDialog
            title="Delete chat?"
            description={`This will remove “${deleteChat.title}” and all messages inside it. This action cannot be undone.`}
            confirmLabel="Delete chat"
            danger
            onCancel={() => setDeleteChat(null)}
            onConfirm={() => {
              onDeleteChat(deleteChat.id);
              setDeleteChat(null);
            }}
          />
        </DialogBoundary>
      )}

      {renameFolder && (
        <DialogBoundary>
          <TextInputDialog
            title="Rename folder"
            description="Update the folder name. Chats inside it will stay there."
            label="Folder name"
            initialValue={renameFolder.name}
            confirmLabel="Rename"
            onCancel={() => setRenameFolder(null)}
            onConfirm={(value) => {
              onRenameFolder(renameFolder.id, value);
              setRenameFolder(null);
            }}
          />
        </DialogBoundary>
      )}

      {deleteFolder && (
        <DialogBoundary>
          <ConfirmDialog
            title="Delete folder?"
            description={`This will delete “${deleteFolder.name}”. Chats inside it will not be deleted; they will move back to All chats.`}
            confirmLabel="Delete folder"
            danger
            onCancel={() => setDeleteFolder(null)}
            onConfirm={() => {
              onDeleteFolder(deleteFolder.id);
              setDeleteFolder(null);
              setActiveFolderId("all");
            }}
          />
        </DialogBoundary>
      )}
    </aside>
  );
}
