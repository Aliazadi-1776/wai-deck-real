import { AlertCircle, Check, Loader2, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { testAIConnection } from "../lib/tauri";
import type { AIConnection } from "../types";

interface AISettingsProps {
  ai: AIConnection;
  onClose: () => void;
  onDelete: (aiId: string) => void;
  onSave: (ai: AIConnection) => void;
}

type Tab = "profile" | "connection" | "parameters" | "danger";
type TestState = { status: "idle" | "testing" | "ok" | "error"; message: string };

export function AISettings({ ai, onClose, onDelete, onSave }: AISettingsProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [draft, setDraft] = useState<AIConnection>(ai);
  const [testState, setTestState] = useState<TestState>({ status: "idle", message: "" });

  function updateDraft(patch: Partial<AIConnection>) {
    setDraft((current) => ({ ...current, ...patch }));
    setTestState({ status: "idle", message: "" });
  }

  async function handleTestConnection() {
    setTestState({ status: "testing", message: "Testing provider connection without sending a normal chat prompt..." });
    try {
      const tested = await testAIConnection(draft);
      setDraft(tested);
      if (tested.status === "connected") {
        setTestState({ status: "ok", message: "Connection passed." });
      } else {
        setTestState({ status: "error", message: "Provider is offline or rejected the request." });
      }
    } catch (error) {
      setTestState({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-line bg-paper text-ink shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <p className="section-label">AI Settings</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{draft.name}</h2>
            <p className="mt-2 text-sm text-muted">Edit the role, connection, and behavior for this AI.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !rounded-2xl !p-3" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[220px,1fr] overflow-hidden">
          <nav className="border-r border-line bg-canvas p-4">
            {[
              ["profile", "Profile"],
              ["connection", "Connection"],
              ["parameters", "Model Parameters"],
              ["danger", "Danger Zone"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                onClick={() => setTab(id as Tab)}
                className={`mb-2 flex w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition ${tab === id ? "bg-ink text-paper" : "text-muted hover:bg-soft hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="nice-scroll min-h-0 overflow-y-auto p-6">
            {tab === "profile" && (
              <div className="space-y-5">
                <label className="space-y-2">
                  <span className="text-sm font-bold">AI Name</span>
                  <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} className="field" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">Purpose</span>
                  <textarea value={draft.purpose} onChange={(event) => updateDraft({ purpose: event.target.value })} className="textarea-field min-h-28" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold">System Instructions</span>
                  <textarea value={draft.systemInstructions} onChange={(event) => updateDraft({ systemInstructions: event.target.value })} className="textarea-field min-h-44" />
                </label>
              </div>
            )}

            {tab === "connection" && (
              <div className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold">Type</span>
                    <input className="field bg-canvas" value={draft.type} disabled />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold">Provider</span>
                    <input className="field bg-canvas" value={draft.provider} disabled />
                  </label>
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Base URL</span>
                  <input value={draft.baseUrl} onChange={(event) => updateDraft({ baseUrl: event.target.value })} className="field" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Model</span>
                  <input value={draft.model} onChange={(event) => updateDraft({ model: event.target.value })} className="field" />
                </label>
                {(draft.type === "api" || draft.provider !== "ollama") && (
                  <label className="space-y-2">
                    <span className="text-sm font-bold">API Key</span>
                    <input value={draft.apiKey ?? ""} onChange={(event) => updateDraft({ apiKey: event.target.value })} type="password" className="field" placeholder="Optional for some local servers" />
                  </label>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handleTestConnection} disabled={testState.status === "testing"} className="btn-secondary w-fit">
                    {testState.status === "testing" ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                    Test Connection
                  </button>
                  {testState.status !== "idle" && (
                    <span className={`inline-flex items-center gap-2 text-sm ${testState.status === "ok" ? "text-positive" : testState.status === "error" ? "text-danger" : "text-muted"}`}>
                      {testState.status === "error" && <AlertCircle size={16} />}
                      {testState.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            {tab === "parameters" && (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold">Temperature</span>
                  <input className="field" defaultValue="0.7" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Max Tokens</span>
                  <input className="field" defaultValue="2048" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Timeout</span>
                  <input className="field" defaultValue="60s" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold">Streaming</span>
                  <input className="field" defaultValue="Disabled in this build" />
                </label>
                <p className="md:col-span-2 text-sm leading-7 text-muted">Parameters are prepared for the next build. This version sends normal non-streaming requests.</p>
              </div>
            )}

            {tab === "danger" && (
              <div className="rounded-[2rem] border border-danger/20 bg-danger/5 p-5">
                <h3 className="text-xl font-black text-danger">Delete this AI</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
                  This removes the AI connection from WAI. It does not delete local models from your computer and does not cancel any API account.
                </p>
                <button type="button" onClick={() => onDelete(ai.id)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-black text-paper hover:bg-red-700">
                  <Trash2 size={16} /> Delete AI
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-paper p-4">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button className="btn-primary"><Save size={16} /> Save Changes</button>
        </div>
      </form>
    </div>
  );
}
