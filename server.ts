import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
 if (!client) {
 const apiKey = process.env.ANTHROPIC_API_KEY;
 if (!apiKey) {
 throw new Error("ANTHROPIC_API_KEY is required. Set it in the .env file at the project root.");
 }
 client = new Anthropic({ apiKey });
 }
 return client;
}

function textFrom(msg: any): string {
 try {
 const parts = (msg.content || []).filter((b: any) => b && b.type === "text").map((b: any) => b.text || "");
 return parts.join("\n").trim();
 } catch (e) { return ""; }
}

function sourcesFrom(msg: any): string[] {
 const out: string[] = [];
 try {
 for (const b of (msg.content || [])) {
 if (b && b.type === "web_search_tool_result" && Array.isArray(b.content)) {
 for (const r of b.content) { if (r && r.url) out.push(r.url); }
 }
 if (b && b.type === "text" && Array.isArray(b.citations)) {
 for (const c of b.citations) { if (c && c.url) out.push(c.url); }
 }
 }
 } catch (e) {}
 return Array.from(new Set(out));
}

app.get("/healthz", (req: Request, res: Response) => { res.json({ ok: true, ai: process.env.AI_ENABLED !== "false" }); });

const AI_TOKEN = process.env.AI_ACCESS_TOKEN || "";
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 500;
const RL_MAX = Number(process.env.AI_RATE_MAX) || 20;
const RL_WINDOW_MS = 60000;
const rlMap = new Map<string, { count: number; reset: number }>();
let dailyCount = 0;
let dailyReset = Date.now() + 86400000;
function clientIp(req: Request): string {
 const fwd = (req.headers["x-forwarded-for"] || "").toString();
 if (fwd) return fwd.split(",")[0].trim();
 return (req.socket && req.socket.remoteAddress) || "unknown";
}
function aiGuard(req: Request, res: Response, next: any): void {
 if (process.env.AI_ENABLED === "false") { res.status(503).json({ error: "AI features are currently disabled." }); return; }
 if (AI_TOKEN && req.headers["x-homeos-token"] !== AI_TOKEN) { res.status(401).json({ error: "Unauthorized." }); return; }
 const now = Date.now();
 if (now > dailyReset) { dailyCount = 0; dailyReset = now + 86400000; }
 if (dailyCount >= AI_DAILY_LIMIT) { res.status(429).json({ error: "Daily AI usage limit reached. Try again later." }); return; }
 const ip = clientIp(req);
 let e = rlMap.get(ip);
 if (!e || now > e.reset) { e = { count: 0, reset: now + RL_WINDOW_MS }; rlMap.set(ip, e); }
 e.count++;
 if (e.count > RL_MAX) { res.status(429).json({ error: "Too many requests, please slow down." }); return; }
 dailyCount++;
 next();
}
app.use("/api/ai", aiGuard);

app.post("/api/ai/chat", async (req: Request, res: Response): Promise<void> => {
 try {
 const { message, history, workspace } = req.body;
 if (!message || typeof message !== "string" || !message.trim()) {
 res.status(400).json({ error: "Message is required." });
 return;
 }
 const ai = getClient();
 const props = (workspace?.properties || []).map((p: any) => "- " + p.name + " in " + p.city + " (Rent Rs " + p.rentAmount + "/mo, Status " + p.status + ")").join("\n");
 const leaseCtx = (workspace?.leases || []).map((l: any) => "- " + l.propertyName + " tenant " + l.tenantName + " (Rent Rs " + l.monthlyRent + "/mo, Status " + l.status + ")").join("\n");
 const txCtx = (workspace?.transactions || []).slice(0, 8).map((t: any) => "- " + t.date + " | " + t.propertyName + " | " + t.category + " | Rs " + t.amount + " [" + t.status + "]").join("\n");
 const system = "You are the HomeOS assistant, a property and finance copilot. Answer directly and concisely using the workspace context below. Use Markdown. Keep any financial or tax notes general and not professional advice.\n\nWorkspace: " + (workspace?.workspaceName || "Personal Vault") + "\nRole: " + (workspace?.activeRole || "Tenant") + "\n\nProperties:\n" + (props || "None yet.") + "\n\nLeases:\n" + (leaseCtx || "None yet.") + "\n\nRecent ledger:\n" + (txCtx || "None yet.");
 const priorMsgs = (history || []).map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: (m.parts && m.parts[0] && m.parts[0].text) || m.text || "" }));
 const messages: any[] = priorMsgs.concat([{ role: "user", content: message }]);
 const base: any = { model: MODEL, max_tokens: 1024, system: system, messages: messages };
 let response: any;
 try {
 response = await ai.messages.create(Object.assign({}, base, { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }] }));
 } catch (toolErr) {
 response = await ai.messages.create(base);
 }
 const reply = textFrom(response) || "I processed your request but could not form a text reply.";
 res.json({ reply: reply, groundingSources: sourcesFrom(response) });
 } catch (error: any) {
 console.error("Error in /api/ai/chat:", error);
 res.status(500).json({ error: error?.message || "Failed to process AI chat." });
 }
});

app.post("/api/ai/ocr", async (req: Request, res: Response): Promise<void> => {
 try {
 const { documentType, base64Data, filename } = req.body;
 if (!documentType || !base64Data) {
 res.status(400).json({ error: "documentType and base64Data are required." });
 return;
 }
 const ai = getClient();
 let prompt = "";
 let schema: any = {};
 if (documentType === "Lease") {
 prompt = "Analyze this rental lease agreement and extract the key fields precisely. If a field is unknown, use an empty string or 0.";
 schema = { type: "object", properties: { propertyName: { type: "string" }, address: { type: "string" }, rentAmount: { type: "number" }, depositAmount: { type: "number" }, startDate: { type: "string" }, endDate: { type: "string" }, landlordName: { type: "string" }, tenantName: { type: "string" }, clauses: { type: "array", items: { type: "string" } } }, required: ["propertyName", "address", "rentAmount", "depositAmount", "startDate", "endDate", "landlordName", "tenantName", "clauses"] };
 } else {
 prompt = "Analyze this utility bill, invoice, or receipt and extract the provider, category, amount, due date and meter readings if present.";
 schema = { type: "object", properties: { provider: { type: "string" }, category: { type: "string" }, amount: { type: "number" }, dueDate: { type: "string" }, currentReading: { type: "number" }, previousReading: { type: "number" } }, required: ["provider", "category", "amount", "dueDate"] };
 }
 const base64Clean = base64Data.replace(/^data:.*?;base64,/, "");
 const pre = /^data:([^;]+);base64,/.exec(base64Data);
 const detected = pre ? pre[1] : "";
 const isPdf = detected === "application/pdf" || (filename || "").toLowerCase().endsWith(".pdf");
 let filePart: any;
 if (isPdf) {
 filePart = { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Clean } };
 } else {
 let mt = "image/jpeg";
 if (detected.indexOf("image/") === 0) mt = detected;
 else if (/\.png$/i.test(filename || "")) mt = "image/png";
 else if (/\.webp$/i.test(filename || "")) mt = "image/webp";
 filePart = { type: "image", source: { type: "base64", media_type: mt, data: base64Clean } };
 }
 const response: any = await ai.messages.create({
 model: MODEL,
 max_tokens: 1500,
 tools: [{ name: "extract", description: "Return the extracted fields as structured data.", input_schema: schema }],
 tool_choice: { type: "tool", name: "extract" },
 messages: [{ role: "user", content: [filePart, { type: "text", text: prompt }] }]
 } as any);
 let data: any = null;
 for (const b of (response.content || [])) { if (b && b.type === "tool_use") { data = b.input; break; } }
 if (!data) throw new Error("The model did not return structured data.");
 res.json(data);
 } catch (error: any) {
 console.error("Error in /api/ai/ocr:", error);
 res.status(500).json({ error: error?.message || "Failed to process AI OCR." });
 }
});

// ---------------------------------------------------------------------------
// Telegram bridge: link codes → workspace snapshots; bot answers from data
// ---------------------------------------------------------------------------
type TgSnapshot = {
  workspaceName: string;
  userName: string;
  role: string;
  properties: any[];
  leases: any[];
  transactions: any[];
  tickets: any[];
};
type TgSession = {
  token: string;
  code: string;
  snapshot: TgSnapshot;
  chatId?: string;
  username?: string;
  createdAt: number;
  updatedAt: number;
};

const tgByToken = new Map<string, TgSession>();
const tgByCode = new Map<string, string>(); // code -> token
const tgByChat = new Map<string, string>(); // chatId -> token
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || "HomeOSBot").replace(/^@/, "");

function tgRand(n = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

async function tgApi(method: string, body: any) {
  if (!TG_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram API error");
  return data.result;
}

async function answerFromSnapshot(question: string, snap: TgSnapshot): Promise<string> {
  try {
    const { answerQuery } = await import("./src/insights.ts");
    const result = answerQuery(question, {
      workspaceName: snap.workspaceName,
      activeRole: snap.role,
      properties: snap.properties || [],
      leases: snap.leases || [],
      transactions: snap.transactions || [],
      utilities: [],
      tickets: snap.tickets || [],
    });
    if (result?.matched) {
      return (result.title ? result.title + "\n\n" : "") + (result.lines || []).join("\n");
    }
  } catch (e) {
    console.error("answerFromSnapshot failed", e);
  }
  // Fallback summary
  const props = snap.properties?.length || 0;
  const leases = snap.leases?.length || 0;
  const txs = snap.transactions?.length || 0;
  return (
    `I could not match that query in your vault yet.\n\n` +
    `Workspace: ${snap.workspaceName}\n` +
    `Properties: ${props} · Leases: ${leases} · Transactions: ${txs}\n\n` +
    `Try: "pending payments", "rent 2024", "how many homes", "savings", "taxes".`
  );
}

app.post("/api/telegram/link", (req: Request, res: Response) => {
  try {
    const snapshot = req.body?.snapshot as TgSnapshot;
    if (!snapshot || !Array.isArray(snapshot.properties)) {
      res.status(400).json({ error: "snapshot with properties is required" });
      return;
    }
    const token = tgRand(16) + tgRand(8);
    const code = tgRand(6);
    const session: TgSession = {
      token,
      code,
      snapshot,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tgByToken.set(token, session);
    tgByCode.set(code, token);
    res.json({
      ok: true,
      token,
      code,
      botUsername: TG_BOT_USERNAME,
      botConfigured: !!TG_BOT_TOKEN,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "link failed" });
  }
});

app.post("/api/telegram/sync", (req: Request, res: Response) => {
  try {
    const { token, snapshot } = req.body || {};
    const session = tgByToken.get(token);
    if (!session) {
      res.status(404).json({ error: "Unknown token. Generate a new link." });
      return;
    }
    if (!snapshot) {
      res.status(400).json({ error: "snapshot required" });
      return;
    }
    session.snapshot = snapshot;
    session.updatedAt = Date.now();
    res.json({ ok: true, linked: !!session.chatId });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "sync failed" });
  }
});

app.get("/api/telegram/status", (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  const session = tgByToken.get(token);
  if (!session) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({
    linked: !!session.chatId,
    chatId: session.chatId,
    username: session.username,
    botUsername: TG_BOT_USERNAME,
    botConfigured: !!TG_BOT_TOKEN,
    code: session.code,
  });
});

app.post("/api/telegram/unlink", (req: Request, res: Response) => {
  const token = req.body?.token;
  const session = tgByToken.get(token);
  if (session) {
    if (session.chatId) tgByChat.delete(String(session.chatId));
    tgByCode.delete(session.code);
    tgByToken.delete(token);
  }
  res.json({ ok: true });
});

app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
  // Always 200 quickly for Telegram
  res.json({ ok: true });
  try {
    const update = req.body;
    const msg = update?.message || update?.edited_message;
    if (!msg?.chat?.id) return;
    const chatId = String(msg.chat.id);
    const text = String(msg.text || "").trim();
    const username = msg.from?.username || msg.chat?.username;

    if (text.startsWith("/start")) {
      const code = text.replace(/^\/start\s*/i, "").trim().toUpperCase();
      if (!code) {
        if (TG_BOT_TOKEN) {
          await tgApi("sendMessage", {
            chat_id: chatId,
            text:
              "Welcome to HomeOS 🏠\n\nOpen the Command Deck → Telegram toolkit, generate a link, then tap Open in Telegram so I can attach to your vault.",
          });
        }
        return;
      }
      const token = tgByCode.get(code);
      const session = token ? tgByToken.get(token) : null;
      if (!session) {
        if (TG_BOT_TOKEN) {
          await tgApi("sendMessage", {
            chat_id: chatId,
            text: "That link code is invalid or expired. Generate a new one in HomeOS and try again.",
          });
        }
        return;
      }
      if (session.chatId && session.chatId !== chatId) {
        tgByChat.delete(session.chatId);
      }
      session.chatId = chatId;
      session.username = username;
      session.updatedAt = Date.now();
      tgByChat.set(chatId, session.token);
      if (TG_BOT_TOKEN) {
        await tgApi("sendMessage", {
          chat_id: chatId,
          text:
            `Linked to *${session.snapshot.workspaceName}* ✅\n` +
            `Ask me about your rent, payments, homes, or taxes.\n\n` +
            `Examples:\n• pending payments\n• how many homes\n• rent 2020\n• savings`,
          parse_mode: "Markdown",
        });
      }
      return;
    }

    const token = tgByChat.get(chatId);
    const session = token ? tgByToken.get(token) : null;
    if (!session) {
      if (TG_BOT_TOKEN) {
        await tgApi("sendMessage", {
          chat_id: chatId,
          text: "You are not linked yet. Open HomeOS → Command Deck → Telegram and connect with a fresh link.",
        });
      }
      return;
    }

    if (!text || text.startsWith("/")) {
      if (TG_BOT_TOKEN && text === "/help") {
        await tgApi("sendMessage", {
          chat_id: chatId,
          text: "Ask natural questions about your HomeOS vault. Sync data from the app after big changes.",
        });
      }
      return;
    }

    const answer = await answerFromSnapshot(text, session.snapshot);
    if (TG_BOT_TOKEN) {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: answer.slice(0, 3900),
      });
    }
  } catch (e) {
    console.error("telegram webhook error", e);
  }
});

/** Long-polling for local dev when a public webhook URL is not available */
async function startTelegramPolling() {
  if (!TG_BOT_TOKEN || process.env.TELEGRAM_POLLING === "false") return;
  console.log("Telegram bot polling enabled for @" + TG_BOT_USERNAME);
  let offset = 0;
  const port = Number(process.env.PORT) || 3000;
  const tick = async () => {
    for (;;) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates?timeout=25&offset=${offset}`
        );
        const data = await res.json();
        if (data.ok) {
          for (const u of data.result || []) {
            offset = Math.max(offset, (u.update_id || 0) + 1);
            try {
              await fetch(`http://127.0.0.1:${port}/api/telegram/webhook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(u),
              });
            } catch (err) {
              console.error(err);
            }
          }
        }
      } catch (e) {
        console.error("telegram poll error", e);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  };
  setTimeout(() => tick().catch(console.error), 2000);
}

async function bootstrap() {
 if (process.env.NODE_ENV !== "production") {
 console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
 const { createServer: createViteServer } = await import("vite");
 const fs = await import("fs");
 const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
 });
 // Serve public/ assets first so /favicon.ico, brand marks, etc. never hit SPA HTML
 const publicDir = path.resolve(__dirname, "public");
 app.use(express.static(publicDir, { fallthrough: true, maxAge: 0 }));
 app.use(vite.middlewares);
 // Clean URL SPA fallback after Vite (so /app/properties, /pricing, etc. load index.html)
 app.use(async (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const url = (req.originalUrl || "").split("?")[0];
  if (url.startsWith("/api")) return next();
  // Never SPA-fallback static asset extensions
  if (/\.(ico|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|map|txt|webmanifest)$/i.test(url)) {
   return next();
  }
  try {
   const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
   const html = await vite.transformIndexHtml(url, template);
   res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
   vite.ssrFixStacktrace(e as Error);
   next(e);
  }
 });
 } else {
 console.log("Starting server in PRODUCTION mode, serving dist static assets...");
 const distPath = __dirname;
 app.use(express.static(distPath));
 // SPA fallback — all non-file routes serve index.html so /app/*, /pricing, etc. work
 app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, "index.html"));
 });
 }
 const PORT = Number(process.env.PORT) || 3000;
 app.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running at http://localhost:" + PORT);
  if (TG_BOT_TOKEN) startTelegramPolling();
  else console.log("Telegram bot: set TELEGRAM_BOT_TOKEN to enable chat access to vaults.");
 });
}

bootstrap().catch((err) => { console.error("Failed to bootstrap server:", err); process.exit(1); });
