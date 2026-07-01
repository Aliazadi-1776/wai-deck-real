import { describe, expect, it } from "vitest";
import type { AttachedFile } from "../types";
import { buildPromptWithAttachments, formatFileSize } from "./fileContext";

const attachment: AttachedFile = {
  id: "file-1",
  name: "example.js",
  type: "text/javascript",
  size: 24,
  content: 'console.log("hello")',
};

describe("file context builder", () => {
  it("does not add file context when there are no usable attachments", () => {
    expect(buildPromptWithAttachments("Hello", [])).toBe("Hello");
    expect(buildPromptWithAttachments("Hello", [{ ...attachment, content: undefined, error: "Unsupported" }])).toBe("Hello");
  });

  it("adds text-like attachments only when the user sends a message", () => {
    const result = buildPromptWithAttachments("Review this file", [attachment]);
    expect(result).toContain("Review this file");
    expect(result).toContain("Attached file context");
    expect(result).toContain("File: example.js");
    expect(result).toContain('console.log("hello")');
  });

  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });
});
