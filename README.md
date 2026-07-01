# WAI Deck

WAI Deck is a local-first desktop interface for your own AI models and API keys.

## What it does

- Add Local AI or API AI
- Chat with selected AI providers
- Organize chats with user-created folders
- Search all chats or search inside one folder
- Pin, rename, move, and delete chats
- Rename and delete folders
- Run AI Challenge to send one prompt to multiple AIs
- Attach text/code files as local context before sending
- Render markdown-style code blocks and simple tables
- Light and dark mode

## Important behavior

WAI does not provide AI models, does not sell API access, and does not run a background AI service.

Provider requests are sent only when you explicitly:

1. Click **Test Connection**
2. Send a chat message
3. Start **AI Challenge**

## Run the web preview

```bash
npm install
npm run dev
```

The browser preview is only for UI review. Real provider calls should be tested inside Tauri to avoid browser CORS issues.

## Run the desktop app

```bash
npm run tauri dev
```

## Token-free local testing

Use this when you want to test the local-provider flow without installing Ollama or using paid API tokens.

Terminal 1:

```bash
npm run local:test-server
```

Terminal 2:

```bash
npm run tauri dev
```

Inside WAI Deck:

1. Click **Add AI**
2. Choose **Local AI**
3. Select **WAI Local Test**
4. Base URL should be `http://127.0.0.1:8787/v1`
5. Model should be `wai-local-test`
6. Click **Test Connection**
7. Save the AI
8. Send a message

The response should include a code block and a table, which also tests the message renderer.

## Real local model testing with Ollama

Install and start Ollama, then pull a model:

```bash
ollama pull llama3.2
```

Inside WAI Deck:

- Provider: **Ollama**
- Base URL: `http://localhost:11434`
- Model: `llama3.2`

Then click **Test Connection**, save the AI, and send a message.

## Tests

```bash
npm run test
npm run build
```

Optional live-provider tests should only run manually with secrets and `LIVE_AI_TESTS=true`.
