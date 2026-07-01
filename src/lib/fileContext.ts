import type { AttachedFile } from "../types";

const MAX_FILE_CHARS = 120_000;

const textExtensions = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "jsonl",
  "html",
  "htm",
  "xml",
  "css",
  "scss",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "py",
  "php",
  "rs",
  "go",
  "java",
  "kt",
  "swift",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "rb",
  "sh",
  "bash",
  "zsh",
  "sql",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "log",
]);

function extensionOf(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

function languageFromName(name: string) {
  const extension = extensionOf(name);
  if (extension === "markdown") return "md";
  if (extension === "yml") return "yaml";
  if (extension === "htm") return "html";
  return extension || "text";
}

function isTextLike(file: File) {
  if (file.type.startsWith("text/")) return true;
  if (["application/json", "application/xml", "application/x-ndjson"].includes(file.type)) return true;
  return textExtensions.has(extensionOf(file.name));
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsText(file);
  });
}

export async function readTextAttachments(files: FileList | File[]): Promise<AttachedFile[]> {
  const list = Array.from(files);

  return Promise.all(
    list.map(async (file) => {
      const base: AttachedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || languageFromName(file.name),
        size: file.size,
      };

      if (!isTextLike(file)) {
        return {
          ...base,
          error: "This build supports text-like files only. Native PDF, DOCX, image, and provider file upload support will come later.",
        };
      }

      try {
        const raw = await readFileAsText(file);
        const truncated = raw.length > MAX_FILE_CHARS;
        return {
          ...base,
          content: truncated ? raw.slice(0, MAX_FILE_CHARS) : raw,
          truncated,
        };
      } catch (error) {
        return {
          ...base,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}

export function buildPromptWithAttachments(prompt: string, attachments: AttachedFile[]) {
  const usable = attachments.filter((file) => file.content && !file.error);
  if (usable.length === 0) return prompt;

  const files = usable
    .map((file) => {
      const language = languageFromName(file.name);
      const warning = file.truncated ? "\nNote: this file was truncated before sending to control token usage." : "";
      return `File: ${file.name}${warning}\n\n\`\`\`${language}\n${file.content}\n\`\`\``;
    })
    .join("\n\n---\n\n");

  return `${prompt.trim()}\n\nAttached file context:\n\n${files}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
