import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TextInputDialogProps {
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export function TextInputDialog({
  title,
  description,
  label,
  placeholder,
  initialValue = "",
  confirmLabel = "Save",
  onCancel,
  onConfirm,
}: TextInputDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 20);
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-paper text-ink shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <h3 className="text-xl font-black tracking-tight">{title}</h3>
            {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onCancel} className="btn-ghost !rounded-2xl !p-2.5" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <label className="space-y-2">
            <span className="text-sm font-bold text-ink">{label}</span>
            <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} className="field" placeholder={placeholder} />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-canvas p-4">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={!value.trim()} className="btn-primary">{confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}
