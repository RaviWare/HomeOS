// HomeOS Cloudflare Worker: serves the built SPA and the Claude AI endpoints.
// Runtime-agnostic (uses fetch); this is the production source of truth for /api/ai/*.

interface Env {
 ASSETS: { fetch: (req: Request) => Promise<Response> };
 ANTHROPIC_API_KEY: string;
 ANTHROPIC_MODEL?: string;
 AI_ENABLED?: string;
 AI_ACCESS_TOKEN?: string;
 AI_DAILY_LIMIT?: string;
 AI_RATE_MAX?: string;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Per-isolate soft rate limiting. The hard cost cap is your Anthropic spend limit.
const rl: { [ip: string]: { count: number; reset: number } } = {};
let dailyCount = 0;
let dailyReset = Date.now() + 86400000;

function jsonResponse(obj: any, status: number): Response {
 return new Response(JSON.stringify(obj), { status: status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function clientIp(req: Request): string {
 return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
}

function guard(req: Request, env: Env): Response | null {
 if (env.AI_ENABLED === "false") return jsonResponse({ error: "AI features are currently disabled." }, 503);
 if (!env.ANTHROPIC_API_KEY) return jsonResponse({ error: "Server is missing ANTHROPIC_API_KEY." }, 500);
 const token = env.AI_ACCESS_TOKEN || "";
 if (token && req.headers.get("x-homeos-token") !== token) return jsonResponse({ error: "Unauthorized." }, 401);
 const now = Date.now();
 if (now > dailyReset) { dailyCount = 0; dailyReset = now + 86400000; }
 const dailyLimit = parseInt(env.AI_DAILY_LIMIT || "500", 10) || 500;
 if (dailyCount >= dailyLimit) return jsonResponse({ error: "Daily AI usage limit reached. Try again later." }, 429);
 const max = parseInt(env.AI_RATE_MAX || "20", 10) || 20;
 const ip = clientIp(req);
 const e = rl[ip];
 if (!e || now > e.reset) { rl[ip] = { count: 1, reset: now + 60000 }; }
 else { e.count++; if (e.count > max) return jsonResponse({ error: "Too many requests, please slow down." }, 429); }
 dailyCount++;
 return null;
}

async function anthropic(env: Env, body: any): Promise<any> {
 const res = await fetch(ANTHROPIC_URL, {
 method: "POST",
 headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
 body: JSON.stringify(body)
 });
 const data: any = await res.json();
 if (!res.ok) { throw new Error((data && data.error && data.error.message) || ("Anthropic error " + res.status)); }
 return data;
}

function textFrom(msg: any): string {
 const parts: string[] = [];
 const content = (msg && msg.content) || [];
 for (let i = 0; i < content.length; i++) { if (content[i] && content[i].type === "text") parts.push(content[i].text || ""); }
 return parts.join("\n").trim();
}

function sourcesFrom(msg: any): string[] {
 const out: string[] = [];
 const content = (msg && msg.content) || [];
 for (let i = 0; i < content.length; i++) {
 const b = content[i];
 if (b && b.type === "web_search_tool_result" && Array.isArray(b.content)) { for (let j = 0; j < b.content.length; j++) { const r = b.content[j]; if (r && r.url) out.push(r.url); } }
 if (b && b.type === "text" && Array.isArray(b.citations)) { for (let k = 0; k < b.citations.length; k++) { const c = b.citations[k]; if (c && c.url) out.push(c.url); } }
 }
 const seen: { [u: string]: boolean } = {}; const uniq: string[] = [];
 for (let i = 0; i < out.length; i++) { if (!seen[out[i]]) { seen[out[i]] = true; uniq.push(out[i]); } }
 return uniq;
}

async function handleChat(req: Request, env: Env): Promise<Response> {
 const blocked = guard(req, env); if (blocked) return blocked;
 let payload: any = {};
 try { payload = await req.json(); } catch (e) { return jsonResponse({ error: "Invalid JSON body." }, 400); }
 const message = payload.message;
 if (!message || typeof message !== "string" || !message.trim()) return jsonResponse({ error: "Message is required." }, 400);
 const ws: any = payload.workspace || {};
 const model = env.ANTHROPIC_MODEL || "claude-haiku-4-5";
 const props = ((ws.properties || []) as any[]).map((p) => "- " + p.name + " in " + p.city + " (Rent Rs " + p.rentAmount + "/mo, Status " + p.status + ")").join("\n");
 const leaseCtx = ((ws.leases || []) as any[]).map((l) => "- " + l.propertyName + " tenant " + l.tenantName + " (Rent Rs " + l.monthlyRent + "/mo, Status " + l.status + ")").join("\n");
 const txCtx = ((ws.transactions || []) as any[]).slice(0, 8).map((t) => "- " + t.date + " | " + t.propertyName + " | " + t.category + " | Rs " + t.amount + " [" + t.status + "]").join("\n");
 const system = "You are the HomeOS assistant, a property and finance copilot. Answer directly and concisely using the workspace context below. Use Markdown. Keep any financial or tax notes general and not professional advice.\n\nWorkspace: " + (ws.workspaceName || "Personal Vault") + "\nRole: " + (ws.activeRole || "Tenant") + "\n\nProperties:\n" + (props || "None yet.") + "\n\nLeases:\n" + (leaseCtx || "None yet.") + "\n\nRecent ledger:\n" + (txCtx || "None yet.");
 const priorMsgs = ((payload.history || []) as any[]).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: (m.parts && m.parts[0] && m.parts[0].text) || m.text || "" }));
 const messages = priorMsgs.concat([{ role: "user", content: message }]);
 const base: any = { model: model, max_tokens: 1024, system: system, messages: messages };
 let data: any;
 try { data = await anthropic(env, Object.assign({}, base, { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }] })); }
 catch (toolErr) { try { data = await anthropic(env, base); } catch (e2: any) { return jsonResponse({ error: (e2 && e2.message) || "Failed to process AI chat." }, 502); } }
 return jsonResponse({ reply: textFrom(data) || "I processed your request but could not form a text reply.", groundingSources: sourcesFrom(data) }, 200);
}

async function handleOcr(req: Request, env: Env): Promise<Response> {
 const blocked = guard(req, env); if (blocked) return blocked;
 let payload: any = {};
 try { payload = await req.json(); } catch (e) { return jsonResponse({ error: "Invalid JSON body." }, 400); }
 const documentType = payload.documentType;
 const base64Data = payload.base64Data;
 const filename: string = payload.filename || "";
 if (!documentType || !base64Data) return jsonResponse({ error: "documentType and base64Data are required." }, 400);
 const model = env.ANTHROPIC_MODEL || "claude-haiku-4-5";
 let prompt = "";
 let schema: any = {};
 if (documentType === "Lease") {
 prompt = "Analyze this rental lease agreement and extract the key fields precisely. If a field is unknown, use an empty string or 0.";
 schema = { type: "object", properties: { propertyName: { type: "string" }, address: { type: "string" }, rentAmount: { type: "number" }, depositAmount: { type: "number" }, startDate: { type: "string" }, endDate: { type: "string" }, landlordName: { type: "string" }, tenantName: { type: "string" }, clauses: { type: "array", items: { type: "string" } } }, required: ["propertyName", "address", "rentAmount", "depositAmount", "startDate", "endDate", "landlordName", "tenantName", "clauses"] };
 } else {
 prompt = "Analyze this utility bill, invoice, or receipt and extract the provider, category, amount, due date and meter readings if present.";
 schema = { type: "object", properties: { provider: { type: "string" }, category: { type: "string" }, amount: { type: "number" }, dueDate: { type: "string" }, currentReading: { type: "number" }, previousReading: { type: "number" } }, required: ["provider", "category", "amount", "dueDate"] };
 }
 const clean = base64Data.replace(/^data:[^;]+;base64,/, "");
 const pre = /^data:([^;]+);base64,/.exec(base64Data);
 const detected = pre ? pre[1] : "";
 const isPdf = detected === "application/pdf" || filename.toLowerCase().indexOf(".pdf") >= 0;
 let fileBlock: any;
 if (isPdf) { fileBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: clean } }; }
 else { let mt = "image/jpeg"; if (detected.indexOf("image/") === 0) mt = detected; else if (/\.png$/i.test(filename)) mt = "image/png"; else if (/\.webp$/i.test(filename)) mt = "image/webp"; fileBlock = { type: "image", source: { type: "base64", media_type: mt, data: clean } }; }
 const body: any = { model: model, max_tokens: 1500, tools: [{ name: "extract", description: "Return the extracted fields as structured data.", input_schema: schema }], tool_choice: { type: "tool", name: "extract" }, messages: [{ role: "user", content: [fileBlock, { type: "text", text: prompt }] }] };
 let data: any;
 try { data = await anthropic(env, body); } catch (e: any) { return jsonResponse({ error: (e && e.message) || "Failed to process AI OCR." }, 502); }
 const content = (data && data.content) || [];
 for (let i = 0; i < content.length; i++) { if (content[i] && content[i].type === "tool_use") return jsonResponse(content[i].input, 200); }
 return jsonResponse({ error: "The model did not return structured data." }, 502);
}

export default {
 async fetch(request: Request, env: Env): Promise<Response> {
 const url = new URL(request.url);
 const path = url.pathname;
 if (path === "/healthz") return jsonResponse({ ok: true, ai: env.AI_ENABLED !== "false" }, 200);
 if (path === "/api/ai/chat") { if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405); return handleChat(request, env); }
 if (path === "/api/ai/ocr") { if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405); return handleOcr(request, env); }
 return env.ASSETS.fetch(request);
 }
};
