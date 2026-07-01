 import React, { useState } from "react";
 import { Plug, Bot, MessageCircle, LayoutDashboard, Cpu, Copy, Check } from "lucide-react";
 
 const CONFIG = `{\n "mcpServers": {\n "homeos": {\n "command": "npx",\n "args": ["homeos-mcp", "--workspace", "~/.homeos/workspace.json"]\n }\n }\n}`;
 const TOOLS = [
  { name: "ask_data", desc: "Natural-language questions: savings, taxes, rent appreciation, experience." },
  { name: "query_properties", desc: "Find homes by city, rent, type, or rating." },
  { name: "get_financial_ledger", desc: "Payments, deposits, utilities, and tax-eligible expenses." },
  { name: "read_lease_vault", desc: "Leases, clauses, renewals, and signatures." }
 ];
 const PLATFORMS = [
  { icon: Bot, title: "ChatGPT", body: "Add HomeOS as a connector or custom GPT action pointed at your MCP endpoint, then ask about your home right in chat." },
  { icon: Cpu, title: "Claude Desktop / Cursor", body: "Drop the config below into mcp.json and the HomeOS tools appear automatically in the assistant." },
  { icon: MessageCircle, title: "WhatsApp / Telegram", body: "Run a small bot that forwards your messages to the MCP server and replies with the answer, so you can query on the go." },
  { icon: LayoutDashboard, title: "Custom dashboard", body: "Call the same MCP tools from your own app or script to build widgets on top of your data." }
 ];
 export default function McpIntegrations() {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(CONFIG); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {} };
  return (
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
  <div className="flex items-center gap-2"><Plug className="w-4 h-4 text-[#2563EB]" /><h4 className="text-sm font-bold text-white">Connect HomeOS Anywhere</h4></div>
  <p className="text-[11px] text-[#9CA3AF] leading-relaxed -mt-2">Why MCP: it exposes your HomeOS data as a small set of tools any AI can call, so you can ask about your home from the apps you already use, without copy-pasting or sharing a password. You decide what the tools return.</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {PLATFORMS.map((p) => { const I = p.icon; return (
  <div key={p.title} className="bg-[#1F2937]/50 border border-[#374151]/50 rounded-xl p-3.5 flex flex-col gap-2">
  <div className="flex items-center gap-2"><I className="w-4 h-4 text-[#2563EB]" /><span className="text-xs font-bold text-white">{p.title}</span></div>
  <p className="text-[10px] text-[#9CA3AF] leading-relaxed">{p.body}</p>
  </div>
  ); })}
  </div>
  <div className="flex flex-col gap-2">
  <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">mcp.json config</span><button onClick={copy} className="flex items-center gap-1 text-[9px] font-bold bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-stone-200 px-2 py-1 rounded-md transition-all active:scale-[0.97]">{copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}{copied ? "Copied" : "Copy"}</button></div>
  <pre className="bg-[#0B1220] border border-[#374151] p-3 rounded-xl font-mono text-[10px] text-[#10B981] overflow-x-auto whitespace-pre">{CONFIG}</pre>
  </div>
  <div className="flex flex-col gap-2">
  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Tool catalog</span>
  <div className="flex flex-col gap-1.5">
  {TOOLS.map((t) => (<div key={t.name} className="flex items-start gap-2 text-[10px]"><span className="font-mono font-bold text-[#8B5CF6] shrink-0">{t.name}</span><span className="text-[#9CA3AF]">{t.desc}</span></div>))}
  </div>
  </div>
  <p className="text-[9px] text-[#6B7280] leading-relaxed border-t border-[#374151]/50 pt-3">MVP note: these tools run against your local data. To use them from other apps you run the HomeOS MCP server (or deploy it) and, for chat apps, add a bot with your platform token. The catalog and config here are the integration contract.</p>
  </div>
  );
 }
 
