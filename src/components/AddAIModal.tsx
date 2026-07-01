import { AlertCircle, Check, Cloud, Cpu, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { testAIConnection } from "../lib/tauri";
import type { AIConnection, AIType, ProviderKind } from "../types";

interface AddAIModalProps {
  initialType: AIType;
  onClose: () => void;
  onSave: (ai: AIConnection) => void;
}

interface ProviderOption {
  label: string;
  value: ProviderKind;
  baseUrl: string;
  model: string;
  description: string;
}

const localProviders: ProviderOption[] = [
  { label: "Ollama", value: "ollama", baseUrl: "http://localhost:11434", model: "llama3.2", description: "Connect to a running Ollama engine." },
  { label: "WAI Local Test", value: "local-test", baseUrl: "http://127.0.0.1:8787/v1", model: "wai-local-test", description: "Token-free local mock server for testing." },
  { label: "LM Studio", value: "lmstudio", baseUrl: "http://localhost:1234/v1", model: "local-model", description: "OpenAI-compatible local server." },
  { label: "Jan", value: "jan", baseUrl: "http://127.0.0.1:1337/v1", model: "local-model", description: "Local desktop AI server." },
  { label: "Custom", value: "custom", baseUrl: "http://localhost:8000/v1", model: "local-model", description: "Any local compatible endpoint." },
];

const apiProviders: ProviderOption[] = [
  { label: "OpenAI", value: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", description: "Official OpenAI API." },
  { label: "Anthropic", value: "anthropic", baseUrl: "https://api.anthropic.com", model: "claude-3-5-sonnet-latest", description: "Claude Messages API." },
  { label: "Gemini", value: "gemini", baseUrl: "https://generativelanguage.googleapis.com", model: "gemini-1.5-flash", description: "Google Gemini API." },
  { label: "Custom", value: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "model-name", description: "OpenAI-compatible API." },
];

type TestState = { status: "idle" | "testing" | "ok" | "error"; message: string };

export function AddAIModal({ initialType, onClose, onSave }: AddAIModalProps) {
  const [type, setType] = useState<AIType>(initialType);
  const providers = type === "local" ? localProviders : apiProviders;
  const [providerValue, setProviderValue] = useState<ProviderKind>(providers[0].value);
  const selected = useMemo(() => providers.find((item) => item.value === providerValue) ?? providers[0], [providerValue, providers]);

  const [name, setName] = useState("");
  const [model, setModel] = useState(selected.model);
  const [baseUrl, setBaseUrl] = useState(selected.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [purpose, setPurpose] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("You are a helpful AI assistant. Be clear, practical, and concise.");
  const [testState, setTestState] = useState<TestState>({ status: "idle", message: "" });

  useEffect(() => {
    setName("");
    setModel(selected.model);
    setBaseUrl(selected.baseUrl);
    setTestState({ status: "idle", message: "" });
  }, [selected]);

  function switchType(nextType: AIType) {
    setType(nextType);
    setProviderValue(nextType === "local" ? localProviders[0].value : apiProviders[0].value);
    setApiKey("");
    setPurpose("");
  }

  function buildAI(status: AIConnection["status"] = "untested"): AIConnection {
    return {
      id: crypto.randomUUID(),
      name: name.trim() || selected.label,
      type,
      provider: selected.value,
      baseUrl: baseUrl.trim() || selected.baseUrl,
      model: model.trim() || selected.model,
      purpose: purpose.trim() || "General assistant",
      systemInstructions: systemInstructions.trim() || "You are a helpful AI assistant.",
      status,
      apiKey: type === "api" || selected.value !== "ollama" ? apiKey.trim() || undefined : undefined,
    };
  }

  async function handleTestConnection() {
    setTestState({ status: "testing", message: "Testing provider connection without sending a normal chat prompt..." });
    try {
      const tested = await testAIConnection(buildAI());
      if (tested.status === "connected") {
        setTestState({ status: "ok", message: "Connection passed. You can save this AI." });
      } else {
        setTestState({ status: "error", message: "Provider is offline or rejected the request." });
      }
    } catch (error) {
      setTestState({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(buildAI(testState.status === "ok" ? "connected" : "untested"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-line bg-paper text-ink shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 md:p-7">
          <div className="min-w-0">
            <p className="section-label">Add AI</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Connect your AI</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Add a local engine or an API provider. WAI does not ping providers in the background; requests are sent only when you explicitly test or send a message.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !rounded-2xl !p-3" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
          <div className="mb-6 grid rounded-[1.5rem] border border-line bg-canvas p-1 md:w-[420px] md:grid-cols-2">
            <button
              type="button"
              onClick={() => switchType("local")}
              className={`flex items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-black transition ${type === "local" ? "bg-ink text-paper shadow-soft" : "text-muted hover:text-ink"}`}
            >
              <Cpu size={16} /> Local AI
            </button>
            <button
              type="button"
              onClick={() => switchType("api")}
              className={`flex items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-black transition ${type === "api" ? "bg-ink text-paper shadow-soft" : "text-muted hover:text-ink"}`}
            >
              <Cloud size={16} /> API AI
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {providers.map((provider) => {
              const active = provider.value === selected.value;
              return (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() => setProviderValue(provider.value)}
                  className={`rounded-3xl border p-4 text-left transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-canvas text-ink hover:border-ink hover:bg-paper"}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    {type === "local" ? <Cpu size={19} /> : <Cloud size={19} />}
                    {active && <Check size={18} />}
                  </div>
                  <div className="font-black">{provider.label}</div>
                  <p className={`mt-1 text-xs leading-5 ${active ? "text-paper/70" : "text-muted"}`}>{provider.description}</p>
                </button>
              );
            })}
          </div>

          {selected.value === "local-test" && (
            <div className="mt-4 rounded-3xl border border-line bg-canvas p-4 text-sm leading-6 text-muted">
              Start the local test server first: <code className="rounded-lg bg-soft px-2 py-1 font-black text-ink">npm run local:test-server</code>.
              Then run the desktop app with <code className="rounded-lg bg-soft px-2 py-1 font-black text-ink">npm run tauri dev</code> and test this provider.
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-ink">AI Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="field" placeholder={type === "local" ? "Local Coding AI" : "SEO Writer"} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-ink">Model</span>
              <input value={model} onChange={(event) => setModel(event.target.value)} className="field" placeholder={selected.model} />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-ink">Base URL</span>
              <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} className="field" placeholder={selected.baseUrl} />
            </label>

            {(type === "api" || selected.value === "lmstudio" || selected.value === "jan" || selected.value === "custom") && (
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-bold text-ink">API Key</span>
                <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" className="field" placeholder={type === "api" ? "Paste your API key" : "Optional for some local servers"} />
                <span className="block text-xs leading-5 text-muted">Dev build note: this is saved locally for testing. Secure OS keychain storage is the next step.</span>
              </label>
            )}

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-ink">Purpose</span>
              <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} className="textarea-field min-h-20" placeholder="What should this AI be used for?" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-ink">System Instructions</span>
              <textarea value={systemInstructions} onChange={(event) => setSystemInstructions(event.target.value)} className="textarea-field min-h-28" placeholder="You are a professional assistant..." />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-paper p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {testState.status !== "idle" && (
              <div className={`flex items-start gap-2 text-sm ${testState.status === "ok" ? "text-positive" : testState.status === "error" ? "text-danger" : "text-muted"}`}>
                {testState.status === "testing" ? <Loader2 className="mt-0.5 animate-spin" size={16} /> : testState.status === "ok" ? <Check className="mt-0.5" size={16} /> : <AlertCircle className="mt-0.5" size={16} />}
                <span className="leading-6">{testState.message}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleTestConnection} disabled={testState.status === "testing"} className="btn-secondary">
              {testState.status === "testing" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Test Connection
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button className="btn-primary">Save AI</button>
          </div>
        </div>
      </form>
    </div>
  );
}
