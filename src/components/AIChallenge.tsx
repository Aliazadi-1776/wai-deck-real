import { Check, Play, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { runChallenge } from "../lib/tauri";
import type { AIConnection, ChallengeOutput } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AIChallengeProps {
  ais: AIConnection[];
  onClose: () => void;
}

export function AIChallenge({ ais, onClose }: AIChallengeProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(ais.map((ai) => ai.id));
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<ChallengeOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function startChallenge() {
    const selectedAIs = ais.filter((ai) => selectedIds.includes(ai.id));
    if (!prompt.trim() || selectedAIs.length === 0) return;
    setLoading(true);
    setOutputs([]);
    setSelectedOutputId(null);
    try {
      setOutputs(await runChallenge(selectedAIs, prompt));
    } finally {
      setLoading(false);
    }
  }

  async function retryOutput(aiId: string) {
    const ai = ais.find((item) => item.id === aiId);
    if (!ai || !prompt.trim()) return;
    setRetryingId(aiId);
    try {
      const [nextOutput] = await runChallenge([ai], prompt);
      if (!nextOutput) return;
      setOutputs((current) => current.map((output) => (output.aiId === aiId ? nextOutput : output)));
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <main className="flex h-screen flex-1 flex-col bg-canvas text-ink">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <p className="section-label">AI Challenge</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Send one prompt to multiple AIs</h2>
        </div>
        <button onClick={onClose} className="btn-secondary"><X size={16} /> Close</button>
      </header>

      <section className="grid flex-1 grid-rows-[auto,1fr] gap-5 overflow-hidden p-6">
        <div className="card p-5">
          <textarea
            value={prompt}
            dir="auto"
            onChange={(event) => setPrompt(event.target.value)}
            className="textarea-field min-h-28"
            placeholder="Write one prompt. WAI will send it to every selected AI only after you press Start Challenge."
          />

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {ais.map((ai) => {
              const active = selectedIds.includes(ai.id);
              return (
                <button
                  type="button"
                  key={ai.id}
                  onClick={() => {
                    setSelectedIds((current) => active ? current.filter((id) => id !== ai.id) : [...current, ai.id]);
                  }}
                  className={`rounded-3xl border p-4 text-left transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-canvas hover:border-ink"}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "bg-paper/10 text-paper/70" : "bg-paper text-muted"}`}>{ai.type}</span>
                    {active && <Check size={17} />}
                  </div>
                  <div className="font-black">{ai.name}</div>
                  <div className={`mt-1 line-clamp-1 text-xs ${active ? "text-paper/60" : "text-muted"}`}>{ai.model}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">Selected: {selectedIds.length} AI{selectedIds.length === 1 ? "" : "s"}. No provider is called before you press Start Challenge.</p>
            <button onClick={() => void startChallenge()} disabled={loading || !prompt.trim() || selectedIds.length === 0} className="btn-primary">
              <Play size={16} /> {loading ? "Running..." : "Start Challenge"}
            </button>
          </div>
        </div>

        <div className="nice-scroll min-h-0 overflow-auto">
          {outputs.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-line bg-paper text-center">
              <div>
                <p className="section-label">No outputs yet</p>
                <p className="mt-2 max-w-sm text-sm leading-7 text-muted">Start a challenge to compare responses. Failed AIs will show their own error card.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {outputs.map((output) => {
                const selected = selectedOutputId === output.id;
                const retrying = retryingId === output.aiId;
                return (
                  <article key={output.id} className={`rounded-[2rem] border bg-paper p-5 shadow-soft transition ${selected ? "border-ink ring-4 ring-ink/5" : "border-line"}`}>
                    <div className="mb-4 flex items-start justify-between gap-3 border-b border-line pb-4">
                      <div>
                        <h3 className="text-lg font-black tracking-tight">{output.aiName}</h3>
                        <p className="mt-1 text-xs font-medium text-muted">{output.status} · {output.latencyMs}ms</p>
                      </div>
                      {selected && <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-paper">Selected</span>}
                    </div>
                    <MarkdownRenderer content={retrying ? "Retrying..." : output.output} />
                    <div className="mt-5 flex gap-2">
                      <button onClick={() => setSelectedOutputId(output.id)} className="btn-secondary !py-2">Select</button>
                      <button onClick={() => void retryOutput(output.aiId)} disabled={retrying || loading} className="btn-secondary !py-2">
                        <RotateCcw size={15} /> {retrying ? "Retrying" : "Retry"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
