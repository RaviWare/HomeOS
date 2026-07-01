 import React, { useState, useRef, useEffect } from "react";
 import { Brain, Send, Bot, User, X, Share2, FileText, Table, Zap, Copy, Check, MessageCircle, ArrowRight, Image as ImageIcon } from "lucide-react";
 import { answerQuery, QueryResult } from "../insights";
 import { renderShareCard } from "../shareCard";
 
 interface Message { role: "user" | "model"; text: string; result?: QueryResult; }
 interface AiAssistantProps { currentWorkspace: any; onNavigate?: (tab: string) => void; }
 
 const slug = (s: string) => (s || "answer").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
 function downloadFile(name: string, content: string, mime: string) {
  try {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) { console.error("download failed", e); }
 }
 function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1500);
 }
 const here = () => (typeof location !== "undefined" ? location.href : "https://homeos.app");
 const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 3) + "..." : s);
 function shareTelegram(text: string) { window.open("https://t.me/share/url?url=" + encodeURIComponent(here()) + "&text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer"); }
 function shareWhatsApp(text: string) { window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n\nvia HomeOS " + here()), "_blank", "noopener,noreferrer"); }
 function shareTweet(text: string) { window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(trunc(text, 250) + " - via HomeOS"), "_blank", "noopener,noreferrer"); }
 const CHIPS = ["Tell me about 2015", "Savings this year", "Highest electricity bill", "How many homes", "Taxes last year", "Rent appreciation"];
 
 export default function AiAssistant({ currentWorkspace, onNavigate }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
  { role: "model", text: "Hi! Ask me anything about your homes - rent, deposits, taxes, utilities, documents, leases, or maintenance - and I will answer instantly from your own records, right here on your device.\n\nTry:\n- Savings this year\n- Tell me about 2015\n- Highest electricity bill\n- How many homes have I lived in\n\nThen copy, share to WhatsApp / Telegram / X, or post it as a branded card." }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isOpen]);
  const handleSend = (e: React.FormEvent) => {
  e.preventDefault();
  const userMsg = input.trim();
  if (!userMsg) return;
  setInput("");
  const local = answerQuery(userMsg, currentWorkspace);
  const text = local.matched ? local.title + "\n\n" + local.lines.join("\n") : "I could not find that in your data yet. Try a year, a city, or words like savings, taxes, rent, utilities, documents, payments, or maintenance.";
  setMessages((prev) => [...prev, { role: "user", text: userMsg }, { role: "model", text, result: local.matched ? local : undefined }]);
  };
  const copyText = (text: string, idx: number) => { try { navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); } catch (e) {} };
  const nativeShare = (title: string, text: string) => { const n: any = navigator; if (n && n.share) { n.share({ title: "HomeOS", text: title + "\n\n" + text }).catch(() => {}); } else { copyText(text, -1); } };
  const shareImage = async (title: string, lines: string[]) => {
  try {
  const blob = await renderShareCard({ title, lines });
  if (!blob) return;
  const file = new File([blob], slug(title) + ".png", { type: "image/png" });
  const n: any = navigator;
  if (n && n.canShare && n.canShare({ files: [file] })) { n.share({ files: [file], title: "HomeOS", text: title }).catch(() => {}); }
  else { downloadBlob(slug(title) + "-homeos.png", blob); }
  } catch (e) { console.error("card failed", e); }
  };
  const setSampleQuery = (q: string) => setInput(q);
 
  const actBtn = "w-7 h-7 flex items-center justify-center rounded-md bg-[#111827] hover:bg-[#374151] border border-[#374151]/60 text-stone-300 text-[10px] font-black transition-all active:scale-90 cursor-pointer";
  return (
  <>
  {!isOpen && (
  <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-[#2563EB] hover:bg-[#1d4ed8] text-white p-4 rounded-full shadow-2xl shadow-[#2563EB]/30 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 z-40 border border-white/10" title="Ask HomeOS">
  <Brain className="w-6 h-6 animate-pulse text-white" />
  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10B981] border-2 border-[#0B1220]"></span></span>
  </button>
  )}
  {isOpen && (
  <div className="fixed bottom-5 right-5 w-[calc(100vw-2.5rem)] max-w-[400px] bg-[#0B1220] border border-[#374151] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden z-50 h-[560px] max-h-[calc(100vh-2.5rem)] animate-fadeInUp">
  <div className="bg-gradient-to-r from-[#1F2937] to-[#111827] px-4 py-3 flex items-center justify-between border-b border-[#374151]">
  <div className="flex items-center gap-2.5">
  <div className="p-2 bg-[#2563EB] rounded-xl text-white shadow-lg shadow-[#2563EB]/30"><Brain className="w-4 h-4" /></div>
  <div>
  <span className="text-xs font-black text-white block leading-tight">HomeOS Assistant</span>
  <span className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Instant - on device</span>
  </div>
  </div>
  <button onClick={() => setIsOpen(false)} className="text-[#9CA3AF] hover:text-white transition-all cursor-pointer p-1 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
  </div>
  <div ref={scrollRef} className="flex-1 p-4 flex flex-col gap-3.5 overflow-y-auto">
  {messages.map((m, idx) => {
  const isModel = m.role === "model";
  return (
  <div key={idx} className={`flex items-start gap-2.5 max-w-[90%] ${isModel ? "self-start" : "self-end flex-row-reverse"}`}>
  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isModel ? "bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/25" : "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/25"}`}>{isModel ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}</div>
  <div className={`flex flex-col gap-1 rounded-2xl p-3.5 text-xs leading-relaxed font-semibold ${isModel ? "bg-[#1F2937] border border-[#374151]/60 text-white rounded-tl-sm" : "bg-[#2563EB] text-white rounded-tr-sm"}`}>
  <span className="whitespace-pre-wrap">{m.text}</span>
  {m.result && m.result.rows && m.result.columns && m.result.rows.length > 0 && (
  <div className="mt-2 border border-[#374151]/60 rounded-lg overflow-hidden">
  <div className="grid" style={{ gridTemplateColumns: `repeat(${m.result.columns.length}, minmax(0,1fr))` }}>
  {m.result.columns.map((col, ci) => (<div key={"h" + ci} className="bg-[#111827] px-2 py-1 text-[9px] font-black text-[#9CA3AF] uppercase truncate">{col}</div>))}
  {m.result.rows.slice(0, 12).map((row, ri) => row.map((cell, cj) => (<div key={ri + "-" + cj} className="px-2 py-1 text-[10px] text-white border-t border-[#374151]/40 truncate">{cell}</div>)))}
  </div>
  {m.result.rows.length > 12 && (<div className="px-2 py-1 text-[9px] text-[#9CA3AF] bg-[#111827]">+{m.result.rows.length - 12} more rows in the download</div>)}
  </div>
  )}
  {m.result && (
  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#374151]/60">
  <button title="Copy to clipboard" onClick={() => copyText(m.result!.text, idx)} className={actBtn}>{copiedIdx === idx ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}</button>
  <button title="Share a branded HomeOS card" onClick={() => shareImage(m.result!.title, m.result!.lines)} className={actBtn}><ImageIcon className="w-3 h-3 text-[#8B5CF6]" /></button>
  <button title="Post to X" onClick={() => shareTweet(m.result!.text)} className={actBtn}>X</button>
  <button title="Share to WhatsApp" onClick={() => shareWhatsApp(m.result!.text)} className={actBtn}><MessageCircle className="w-3 h-3 text-[#10B981]" /></button>
  <button title="Share to Telegram" onClick={() => shareTelegram(m.result!.text)} className={actBtn}><Send className="w-3 h-3 text-[#60A5FA]" /></button>
  <button title="More share options" onClick={() => nativeShare(m.result!.title, m.result!.text)} className={actBtn}><Share2 className="w-3 h-3" /></button>
  <button title="Download as text" onClick={() => downloadFile(slug(m.result!.title) + ".txt", m.result!.text, "text/plain")} className={actBtn}><FileText className="w-3 h-3" /></button>
  {m.result.csv && (<button title="Download as CSV" onClick={() => downloadFile(slug(m.result!.title) + ".csv", m.result!.csv!, "text/csv")} className={actBtn}><Table className="w-3 h-3" /></button>)}
 {m.result.suggestion && onNavigate && (<button onClick={() => { onNavigate!(m.result!.suggestion!.tab); setIsOpen(false); }} className="basis-full w-full mt-1 bg-[#2563EB]/15 hover:bg-[#2563EB]/25 text-[#60A5FA] border border-[#2563EB]/30 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"><ArrowRight className="w-3 h-3" />{m.result!.suggestion!.label}</button>)}
  </div>
  )}
  </div>
  </div>
  );
  })}
  </div>
  <div className="px-3 py-2 border-t border-[#374151]/50 flex gap-1.5 overflow-x-auto bg-[#111827]/80 shrink-0 scrollbar-none">
  {CHIPS.map((chip) => (<button key={chip} onClick={() => setSampleQuery(chip)} className="text-[10px] bg-[#1F2937] hover:bg-[#2563EB] hover:text-white text-stone-300 font-bold px-2.5 py-1 rounded-full shrink-0 cursor-pointer border border-[#374151]/50 whitespace-nowrap transition-all">{chip}</button>))}
  </div>
  <form onSubmit={handleSend} className="p-3 bg-[#1F2937] border-t border-[#374151] flex gap-2 shrink-0">
  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-[#111827] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 font-semibold" placeholder="Ask anything about your home data..." />
  <button type="submit" className="p-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"><Send className="w-4 h-4 text-white" /></button>
  </form>
  </div>
  )}
  </>
  );
 }
 
