# 🤖 WAI Deck

Your AI. Your Workspace. Your Control.

---

## ✨ Description

WAI Deck is a local-first AI desktop workspace that lets you connect and manage multiple AI providers in a single clean interface.

It supports both **local models** and **API-based models**, allowing you to chat, compare outputs, and organize all your AI interactions in one place.

---

## 🧠 Core Idea

You don't use one AI.  
You connect ALL your AIs.  
WAI Deck orchestrates them.

---

## ⚙️ Features

- Multi-AI chat system
- Local AI support (Ollama, LM Studio, Jan)
- API AI support (OpenAI, Anthropic, Gemini, OpenAI-compatible)
- AI Challenge (run one prompt across multiple AIs)
- Folder-based chat organization
- Pin / Move / Rename / Delete chats
- Search chats and folders
- Markdown + code block rendering
- File attachment support (text/code)
- Light / Dark mode
- Local test provider (no token usage)

---

## 🏗️ Tech Stack

- Tauri v2
- React
- TypeScript
- Vite
- TailwindCSS
- Rust backend

---

## 🔌 AI Provider Example

```ts
{
  name: "Ollama",
  type: "local",
  endpoint: "http://localhost:11434",
  model: "llama3.2"
}
```

---

## 🔒 Privacy

- No background API calls
- No data tracking
- Everything runs locally unless explicitly triggered
- BYO-AI (Bring Your Own AI)

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Run desktop app:

```bash
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

---

## 📦 Platforms

- Windows (.exe)
- Linux (.AppImage / .deb)

---

## 📜 License

MIT
