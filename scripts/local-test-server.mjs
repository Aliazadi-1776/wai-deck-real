import http from "node:http";

const HOST = process.env.WAI_LOCAL_TEST_HOST || "127.0.0.1";
const PORT = Number(process.env.WAI_LOCAL_TEST_PORT || 8787);
const MODEL_ID = "wai-local-test";

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function extractPrompt(payload) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const lastUser = [...messages].reverse().find((message) => message?.role === "user");
  return typeof lastUser?.content === "string" ? lastUser.content : "";
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && (req.url === "/v1/models" || req.url === "/models")) {
    sendJson(res, 200, {
      object: "list",
      data: [
        {
          id: MODEL_ID,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "wai-local-test",
        },
      ],
    });
    return;
  }

  if (req.method === "POST" && (req.url === "/v1/chat/completions" || req.url === "/chat/completions")) {
    try {
      const raw = await readBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const prompt = extractPrompt(payload);
      const content = [
        "✅ WAI Local Test server is working.",
        "",
        "This response came from a local OpenAI-compatible mock server on your computer.",
        "No real AI provider was called and no tokens were used.",
        "",
        "```js",
        "console.log(\"Local WAI test passed\");",
        "```",
        "",
        "| Check | Result |",
        "| --- | --- |",
        "| Local endpoint | OK |",
        "| Chat adapter | OK |",
        "| Markdown rendering | OK |",
        "",
        prompt ? `Prompt received: ${prompt.slice(0, 400)}` : "Prompt received: empty",
      ].join("\n");

      sendJson(res, 200, {
        id: `chatcmpl-local-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: payload.model || MODEL_ID,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content,
            },
            finish_reason: "stop",
          },
        ],
      });
    } catch (error) {
      sendJson(res, 400, { error: String(error?.message || error) });
    }
    return;
  }

  sendJson(res, 404, {
    error: "Not found",
    routes: ["GET /v1/models", "POST /v1/chat/completions"],
  });
});

server.listen(PORT, HOST, () => {
  console.log(`WAI Local Test server running at http://${HOST}:${PORT}/v1`);
  console.log("Use Add AI → Local AI → WAI Local Test inside the desktop app.");
});
