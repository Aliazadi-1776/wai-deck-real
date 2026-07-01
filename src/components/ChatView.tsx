import { Check, ChevronDown, Circle, FileText, Paperclip, Send, Settings2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { buildPromptWithAttachments, formatFileSize, readTextAttachments } from "../lib/fileContext";
import { sendMessage } from "../lib/tauri";
import type { AIConnection, AttachedFile, ChatSummary, Message } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatViewProps {
  ais: AIConnection[];
  activeAiId: string | null;
  activeChat: ChatSummary | null;
  messages: Message[];
  onSelectAI: (aiId: string) => void;
  onOpenSettings: () => void;
  onNewMessage: (message: Message) => void;
}

function statusClass(status: AIConnection["status"]) {
  if (status === "connected") return "text-positive";
  if (status === "offline") return "text-danger";
  return "text-warning";
}

function AISelector({ ais, activeAI, onSelectAI }: { ais: AIConnection[]; activeAI: AIConnection; onSelectAI: (aiId: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex min-w-64 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left shadow-sm transition hover:border-ink">
        <div className="min-w-0">
          <div className="line-clamp-1 text-sm font-black">{activeAI.name}</div>
          <div className="line-clamp-1 text-xs text-muted">{activeAI.type.toUpperCase()} · {activeAI.model}</div>
        </div>
        <ChevronDown size={18} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-40 w-80 rounded-3xl border border-line bg-paper p-2 shadow-pop">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted">Choose AI</p>
          {ais.map((ai) => {
            const active = ai.id === activeAI.id;
            return (
              <button
                key={ai.id}
                onClick={() => {
                  onSelectAI(ai.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left transition ${active ? "bg-ink text-paper" : "hover:bg-soft"}`}
              >
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-black">{ai.name}</div>
                  <div className={`mt-1 line-clamp-1 text-xs ${active ? "text-paper/60" : "text-muted"}`}>{ai.provider} · {ai.model}</div>
                </div>
                {active ? <Check size={18} /> : <Circle size={12} className={statusClass(ai.status)} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttachmentPill({ file, onRemove }: { file: AttachedFile; onRemove?: () => void }) {
  return (
    <div className={`flex max-w-full items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${file.error ? "border-danger/25 bg-danger/5 text-danger" : "border-line bg-canvas text-muted"}`}>
      <FileText size={15} className="shrink-0" />
      <span className="min-w-0 truncate font-bold text-ink">{file.name}</span>
      <span className="shrink-0 text-muted">{formatFileSize(file.size)}</span>
      {file.truncated && <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 font-bold text-warning">truncated</span>}
      {file.error && <span className="min-w-0 truncate text-danger">{file.error}</span>}
      {onRemove && (
        <button type="button" onClick={onRemove} className="shrink-0 rounded-lg p-1 text-muted hover:bg-soft hover:text-ink" aria-label={`Remove ${file.name}`}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export function ChatView({ ais, activeAiId, activeChat, messages, onSelectAI, onOpenSettings, onNewMessage }: ChatViewProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAI = useMemo(() => ais.find((ai) => ai.id === activeAiId) ?? ais[0], [ais, activeAiId]);

  async function handleAttachFiles(files: FileList | null) {
    if (!files?.length) return;
    const nextFiles = await readTextAttachments(files);
    setAttachments((current) => [...current, ...nextFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if ((!prompt.trim() && attachments.length === 0) || !activeAI || !activeChat || loading) return;

    const safeAttachments = attachments.map(({ id, name, type, size, truncated, error }) => ({ id, name, type, size, truncated, error }));
    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId: activeChat.id,
      aiId: activeAI.id,
      role: "user",
      content: prompt.trim() || "Review the attached file context.",
      attachments: safeAttachments,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const payload = buildPromptWithAttachments(userMessage.content, attachments);
    onNewMessage(userMessage);
    setPrompt("");
    setAttachments([]);
    setLoading(true);

    try {
      const output = await sendMessage(activeAI, payload);
      onNewMessage({
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        aiId: activeAI.id,
        role: "assistant",
        content: output,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (error) {
      onNewMessage({
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        aiId: activeAI.id,
        role: "assistant",
        content: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } finally {
      setLoading(false);
    }
  }

  if (!activeChat || !activeAI) {
    return (
      <main className="flex flex-1 items-center justify-center bg-canvas p-8">
        <div className="card max-w-md p-8 text-center">
          <h2 className="text-2xl font-black tracking-tight">No chat selected</h2>
          <p className="mt-3 leading-7 text-muted">Create a new chat or select one from the sidebar.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-1 flex-col bg-canvas">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-canvas/90 px-6 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="section-label">Chat</p>
          <h2 className="mt-1 line-clamp-1 text-2xl font-black tracking-tight">{activeChat.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <AISelector ais={ais} activeAI={activeAI} onSelectAI={onSelectAI} />
          <button onClick={onOpenSettings} className="btn-secondary">
            <Settings2 size={16} /> AI Settings
          </button>
        </div>
      </header>

      <section className="nice-scroll flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {messages.length === 0 && (
            <div className="card p-8 text-center">
              <p className="section-label">Ready</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight">Start with {activeAI.name}</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">This chat only calls your provider when you press Send. No background token usage.</p>
            </div>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-[1.7rem] border p-5 ${message.role === "user" ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink shadow-soft"}`}>
                <div className={`mb-2 text-[11px] font-black uppercase tracking-[0.16em] ${message.role === "user" ? "text-paper/60" : "text-muted"}`}>
                  {message.role === "user" ? "You" : activeAI.name} · {message.createdAt}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {message.attachments.map((file) => <AttachmentPill key={file.id} file={file} />)}
                  </div>
                )}
                <MarkdownRenderer content={message.content} />
              </div>
            </article>
          ))}
          {loading && <div className="card inline-flex p-5 text-muted">Generating response...</div>}
        </div>
      </section>

      <footer className="border-t border-line bg-canvas p-4">
        <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-line bg-paper p-2.5 shadow-soft">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 px-1">
              {attachments.map((file) => (
                <AttachmentPill key={file.id} file={file} onRemove={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} />
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleAttachFiles(event.target.files)}
              accept=".txt,.md,.markdown,.csv,.json,.jsonl,.html,.htm,.xml,.css,.scss,.js,.jsx,.ts,.tsx,.py,.php,.rs,.go,.java,.c,.cpp,.cs,.rb,.sh,.sql,.yaml,.yml,.toml,.ini,.log,text/*,application/json"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary h-[52px] shrink-0 !rounded-[1.2rem] !px-4" title="Attach text or code file">
              <Paperclip size={17} />
            </button>
            <textarea
              value={prompt}
              rows={1}
              dir="auto"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Message your AI..."
              className="nice-scroll max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-7 text-ink outline-none placeholder:text-muted/50"
            />
            <button onClick={() => void handleSend()} disabled={loading || (!prompt.trim() && attachments.length === 0)} className="btn-primary h-[52px] shrink-0 !rounded-[1.2rem] px-5">
              <Send size={17} /> Send
            </button>
          </div>
        </div>
        <p className="mx-auto mt-2 max-w-4xl px-2 text-xs text-muted">Press Enter to send. Use Shift + Enter for a new line. Attached files are only sent when you press Send.</p>
      </footer>
    </main>
  );
}
