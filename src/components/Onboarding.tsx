import { ArrowRight, Bot, Cloud, Cpu } from "lucide-react";

interface OnboardingProps {
  onAddLocal: () => void;
  onAddApi: () => void;
}

export function Onboarding({ onAddLocal, onAddApi }: OnboardingProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
      <section className="w-full max-w-5xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-ink text-paper shadow-pop">
            <Bot size={24} />
          </div>
          <p className="section-label">Bring your own AI</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] md:text-7xl">WAI Deck</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted">
            One clean desktop interface for your local models, API keys, chats, folders, and AI comparisons.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button onClick={onAddLocal} className="group card p-7 text-left transition hover:-translate-y-0.5 hover:border-ink">
            <div className="mb-10 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-ink">
                <Cpu size={23} />
              </div>
              <ArrowRight className="text-muted transition group-hover:translate-x-1 group-hover:text-ink" size={22} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Add Local AI</h2>
            <p className="mt-3 max-w-sm leading-7 text-muted">
              Connect Ollama, LM Studio, Jan, or any local OpenAI-compatible endpoint running on your computer.
            </p>
          </button>

          <button onClick={onAddApi} className="group card p-7 text-left transition hover:-translate-y-0.5 hover:border-ink">
            <div className="mb-10 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-paper">
                <Cloud size={23} />
              </div>
              <ArrowRight className="text-muted transition group-hover:translate-x-1 group-hover:text-ink" size={22} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Add API AI</h2>
            <p className="mt-3 max-w-sm leading-7 text-muted">
              Use your own API keys and endpoints. WAI is only the interface; your keys and data stay yours.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}
