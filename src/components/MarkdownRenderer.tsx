import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";

type Block =
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "text"; text: string };

function isFence(line: string) {
  return line.trim().startsWith("```");
}

function isTableSeparator(line: string) {
  const cleaned = line.trim();
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(cleaned);
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isFence(line)) {
      const language = line.trim().replace(/^```/, "").trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && isFence(lines[index])) index += 1;
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = parseTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const textLines: string[] = [];
    while (index < lines.length && !isFence(lines[index])) {
      if (lines[index].includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) break;
      textLines.push(lines[index]);
      index += 1;
    }

    const text = textLines.join("\n").trim();
    if (text) blocks.push({ type: "text", text });
  }

  return blocks;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-line bg-[#111] text-white shadow-soft">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">{language || "code"}</span>
        <button onClick={() => void copyCode()} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white/65 hover:bg-white/10 hover:text-white">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="nice-scroll overflow-x-auto p-4 text-sm leading-7" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="nice-scroll my-3 overflow-x-auto rounded-2xl border border-line bg-paper">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-soft text-ink">
          <tr>
            {headers.map((header, index) => (
              <th key={`${header}-${index}`} className="border-b border-line px-4 py-3 text-left font-black">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line last:border-b-0">
              {headers.map((_, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top text-muted">
                  {row[cellIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="space-y-2" dir="auto">
      {blocks.map((block, index) => {
        if (block.type === "code") return <CodeBlock key={index} code={block.code} language={block.language} />;
        if (block.type === "table") return <TableBlock key={index} headers={block.headers} rows={block.rows} />;
        return <p key={index} className="whitespace-pre-wrap leading-8" dir="auto">{block.text}</p>;
      })}
    </div>
  );
}
