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

async function bootstrap() {
 if (process.env.NODE_ENV !== "production") {
 console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
 const { createServer: createViteServer } = await import("vite");
 const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
 app.use(vite.middlewares);
 } else {
 console.log("Starting server in PRODUCTION mode, serving dist static assets...");
 const distPath = __dirname;
 app.use(express.static(distPath));
 app.get("*", (req: Request, res: Response) => { res.sendFile(path.join(distPath, "index.html")); });
 }
 const PORT = Number(process.env.PORT) || 3000;
 app.listen(PORT, "0.0.0.0", () => { console.log("Server is running at http://localhost:" + PORT); });
}

bootstrap().catch((err) => { console.error("Failed to bootstrap server:", err); process.exit(1); });
