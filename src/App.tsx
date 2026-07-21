import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Onboarding } from "./components/Onboarding";
import { initialAIs, initialChats, initialFolders, initialMessages } from "./mockData";
import { deleteFolderAndUnassignChats, renameFolderById } from "./lib/folderUtils";
import type { AIConnection, AIType, ChatSummary, Folder, Message } from "./types";

const AddAIModal = lazy(() => import("./components/AddAIModal").then((module) => ({ default: module.AddAIModal })));
const AIChallenge = lazy(() => import("./components/AIChallenge").then((module) => ({ default: module.AIChallenge })));
const AISettings = lazy(() => import("./components/AISettings").then((module) => ({ default: module.AISettings })));
const ChatView = lazy(() => import("./components/ChatView").then((module) => ({ default: module.ChatView })));
const Sidebar = lazy(() => import("./components/Sidebar").then((module) => ({ default: module.Sidebar })));
const TextInputDialog = lazy(() => import("./components/TextInputDialog").then((module) => ({ default: module.TextInputDialog })));

type ThemeMode = "light" | "dark";

const STORAGE_KEYS = {
  ais: "wai.ais",
  folders: "wai.folders",
  chats: "wai.chats",
  messages: "wai.messages",
  theme: "wai.theme",
  version: "wai.storageVersion",
};

const STORAGE_VERSION = "7";
const LEGACY_DEFAULT_FOLDER_IDS = new Set(["folder-inbox", "folder-seo", "folder-coding", "folder-research", "folder-security"]);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MainFallback() {
  return (
    <main className="flex h-screen flex-1 items-center justify-center bg-canvas p-8">
      <div className="card px-5 py-4 text-sm font-bold text-muted">Loading...</div>
    </main>
  );
}

function SidebarFallback() {
  return (
    <aside className="flex h-screen w-[324px] shrink-0 flex-col border-r border-line bg-paper p-4">
      <div className="h-11 w-44 rounded-2xl bg-soft" />
      <div className="mt-7 grid grid-cols-2 gap-2">
        <div className="h-11 rounded-2xl bg-soft" />
        <div className="h-11 rounded-2xl bg-soft" />
      </div>
      <div className="mt-8 space-y-2">
        <div className="h-10 rounded-2xl bg-soft" />
        <div className="h-10 rounded-2xl bg-soft" />
        <div className="h-10 rounded-2xl bg-soft" />
      </div>
    </aside>
  );
}

function ModalBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />}>{children}</Suspense>;
}

export default function App() {
  const [ais, setAIs] = useState<AIConnection[]>(() => readStorage(STORAGE_KEYS.ais, initialAIs));
  const [folders, setFolders] = useState<Folder[]>(() => readStorage(STORAGE_KEYS.folders, initialFolders));
  const [chats, setChats] = useState<ChatSummary[]>(() => readStorage(STORAGE_KEYS.chats, initialChats));
  const [messages, setMessages] = useState<Message[]>(() => readStorage(STORAGE_KEYS.messages, initialMessages));
  const [activeChatId, setActiveChatId] = useState<string | null>(() => readStorage<ChatSummary[]>(STORAGE_KEYS.chats, initialChats)[0]?.id ?? null);
  const [activeAiId, setActiveAiId] = useState<string | null>(() => readStorage<AIConnection[]>(STORAGE_KEYS.ais, initialAIs)[0]?.id ?? null);
  const [addType, setAddType] = useState<AIType | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => readStorage<ThemeMode>(STORAGE_KEYS.theme, "light"));
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  useEffect(() => {
    const storedVersion = window.localStorage.getItem(STORAGE_KEYS.version);
    if (storedVersion !== STORAGE_VERSION) {
      setFolders((current) => current.filter((folder) => !LEGACY_DEFAULT_FOLDER_IDS.has(folder.id)));
      setChats((current) =>
        current.map((chat) =>
          chat.folderId && LEGACY_DEFAULT_FOLDER_IDS.has(chat.folderId) ? { ...chat, folderId: null } : chat,
        ),
      );
      window.localStorage.setItem(STORAGE_KEYS.version, STORAGE_VERSION);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    writeStorage(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => writeStorage(STORAGE_KEYS.ais, ais), [ais]);
  useEffect(() => writeStorage(STORAGE_KEYS.folders, folders), [folders]);
  useEffect(() => writeStorage(STORAGE_KEYS.chats, chats), [chats]);
  useEffect(() => writeStorage(STORAGE_KEYS.messages, messages), [messages]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId) ?? null, [activeChatId, chats]);
  const activeAI = useMemo(() => ais.find((ai) => ai.id === activeAiId) ?? ais[0] ?? null, [activeAiId, ais]);
  const activeMessages = useMemo(() => messages.filter((message) => message.chatId === activeChatId), [messages, activeChatId]);

  function createChatForAI(ai: AIConnection) {
    const chat: ChatSummary = {
      id: crypto.randomUUID(),
      folderId: null,
      aiId: ai.id,
      title: `Chat with ${ai.name}`,
      updatedAt: "Now",
      isPinned: false,
    };
    setChats((current) => [chat, ...current]);
    setActiveChatId(chat.id);
    setActiveAiId(ai.id);
    setShowChallenge(false);
    return chat;
  }

  function handleAddAI(ai: AIConnection) {
    setAIs((current) => [...current, ai]);
    createChatForAI(ai);
    setAddType(null);
  }

  function handleUpdateAI(nextAI: AIConnection) {
    setAIs((current) => current.map((ai) => (ai.id === nextAI.id ? nextAI : ai)));
    setShowSettings(false);
  }

  function handleNewChat() {
    const ai = activeAI ?? ais[0];
    if (!ai) {
      setAddType("local");
      return;
    }
    createChatForAI(ai);
  }

  function handleNewFolder() {
    setShowFolderDialog(true);
  }

  function handleCreateFolder(folderName: string) {
    setFolders((current) => [...current, { id: crypto.randomUUID(), name: folderName.trim() }]);
    setShowFolderDialog(false);
  }

  function handleRenameFolder(folderId: string, name: string) {
    setFolders((current) => renameFolderById(current, folderId, name));
  }

  function handleDeleteFolder(folderId: string) {
    setFolders((currentFolders) => {
      const next = deleteFolderAndUnassignChats(currentFolders, chats, folderId);
      setChats(next.chats);
      return next.folders;
    });
  }

  function handleTogglePin(chatId: string) {
    setChats((current) => current.map((chat) => (chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat)));
  }

  function handleMoveChat(chatId: string, folderId: string | null) {
    setChats((current) => current.map((chat) => (chat.id === chatId ? { ...chat, folderId } : chat)));
  }

  function handleDeleteAI(aiId: string) {
    const remaining = ais.filter((ai) => ai.id !== aiId);
    setAIs(remaining);
    setChats((current) => current.filter((chat) => chat.aiId !== aiId));
    setMessages((current) => current.filter((message) => message.aiId !== aiId));
    setShowSettings(false);
    setActiveAiId(remaining[0]?.id ?? null);
    setActiveChatId((current) => {
      const stillExists = chats.some((chat) => chat.id === current && chat.aiId !== aiId);
      if (stillExists) return current;
      return chats.find((chat) => chat.aiId !== aiId)?.id ?? null;
    });
  }

  function handleRenameChat(chatId: string, title: string) {
    setChats((current) => current.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)));
  }

  function handleDeleteChat(chatId: string) {
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    setChats(remainingChats);
    setMessages((current) => current.filter((message) => message.chatId !== chatId));

    if (activeChatId === chatId) {
      const nextChat = remainingChats[0] ?? null;
      setActiveChatId(nextChat?.id ?? null);
      setActiveAiId(nextChat?.aiId ?? ais[0]?.id ?? null);
    }
  }

  function handleMessageCreated(message: Message) {
    setMessages((current) => [...current, message]);
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== message.chatId) return chat;
        const shouldRetitle = chat.title.startsWith("Chat with ") && message.role === "user";
        return {
          ...chat,
          updatedAt: nowLabel(),
          title: shouldRetitle ? message.content.slice(0, 48) || chat.title : chat.title,
        };
      }),
    );
  }

  if (ais.length === 0) {
    return (
      <>
        <Onboarding onAddLocal={() => setAddType("local")} onAddApi={() => setAddType("api")} />
        {addType && (
          <ModalBoundary>
            <AddAIModal initialType={addType} onClose={() => setAddType(null)} onSave={handleAddAI} />
          </ModalBoundary>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar
          ais={ais}
          folders={folders}
          chats={chats}
          activeChatId={activeChatId}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          onNewChat={handleNewChat}
          onNewFolder={handleNewFolder}
          onAddAI={() => setAddType("local")}
          onChallenge={() => setShowChallenge(true)}
          onSelectChat={(chatId) => {
            setActiveChatId(chatId);
            setShowChallenge(false);
            const chat = chats.find((item) => item.id === chatId);
            if (chat) setActiveAiId(chat.aiId);
          }}
          onTogglePin={handleTogglePin}
          onMoveChat={handleMoveChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </Suspense>

      {showChallenge ? (
        <Suspense fallback={<MainFallback />}>
          <AIChallenge ais={ais} onClose={() => setShowChallenge(false)} />
        </Suspense>
      ) : (
        <Suspense fallback={<MainFallback />}>
          <ChatView
            ais={ais}
            activeAiId={activeAiId}
            activeChat={activeChat}
            messages={activeMessages}
            onSelectAI={setActiveAiId}
            onOpenSettings={() => setShowSettings(true)}
            onNewMessage={handleMessageCreated}
          />
        </Suspense>
      )}

      {addType && (
        <ModalBoundary>
          <AddAIModal initialType={addType} onClose={() => setAddType(null)} onSave={handleAddAI} />
        </ModalBoundary>
      )}
      {showSettings && activeAI && (
        <ModalBoundary>
          <AISettings ai={activeAI} onClose={() => setShowSettings(false)} onDelete={handleDeleteAI} onSave={handleUpdateAI} />
        </ModalBoundary>
      )}
      {showFolderDialog && (
        <ModalBoundary>
          <TextInputDialog
            title="Create folder"
            description="Folders are optional. Create one when you want to organize related chats."
            label="Folder name"
            placeholder="Example: SEO projects"
            confirmLabel="Create folder"
            onCancel={() => setShowFolderDialog(false)}
            onConfirm={handleCreateFolder}
          />
        </ModalBoundary>
      )}
    </div>
  );
}
