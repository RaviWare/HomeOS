 import React, { useState } from "react";
 import { FileSearch, AlertTriangle, CheckCircle2, Send, Upload, Sparkles, Info, Circle } from "lucide-react";
 import { analyzeLegalText, answerLegalQuestion, LegalAnalysis } from "../legal";
 
 const SAMPLE = "This Rental Agreement is made on 01/06/2026 between the Lessor and the Tenant. The monthly rent is Rs 45,000 payable by the 5th of each month. The security deposit is Rs 1,50,000 and is refundable within 30 days of vacating after deductions. The lock-in period is 11 months. A notice period of 2 months is required to vacate. Rent shall be subject to a 8% escalation on renewal. A late payment fee of Rs 1,000 applies after the 10th. Subletting is not permitted without written consent. Pets are not allowed. Maintenance charges are borne by the tenant. This agreement may be terminated by either party with notice.";
 
 export default function LegalReader() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  setFileName(file.name);
  if (/\.(txt|md|csv|json|rtf)$/i.test(file.name) || (file.type || "").indexOf("text") >= 0) { const t = await file.text(); setText(t); }
  else { alert("For now, paste the document text below. PDF and scanned files need pdf.js or OCR, which can be added next."); }
  };
  const analyze = () => { if (!text.trim()) return; setAnalysis(analyzeLegalText(text)); setAnswer(""); };
  const ask = (e: React.FormEvent) => { e.preventDefault(); if (!analysis || !question.trim()) return; setAnswer(answerLegalQuestion(question, text, analysis)); };
  const sevColor = (s: string) => s === "risk" ? "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10" : s === "watch" ? "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10" : "text-[#60A5FA] border-[#2563EB]/30 bg-[#2563EB]/10";
 
 return (
 <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 mb-5">
 <div className="flex items-start gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center shrink-0">
 <FileSearch className="w-5 h-5 text-[#60A5FA]" />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h3 className="text-white font-semibold">Legal Document Reader</h3>
 <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30">Beta</span>
 </div>
 <p className="text-xs text-white/50 mt-0.5">Reads a lease or agreement on your device, explains it in plain English, and flags risks. Nothing leaves your browser.</p>
 </div>
 </div>
 <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your lease or agreement text here, or upload a .txt or .md file below." className="w-full h-32 bg-[#0A0A0C] border border-white/10 rounded-xl p-3 text-sm text-white/80 placeholder:text-white/30 resize-y focus:outline-none focus:border-[#2563EB]/50" />
 <div className="flex flex-wrap items-center gap-2 mt-3">
 <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 cursor-pointer transition">
 <Upload className="w-4 h-4" />
 <span>{fileName || "Upload file"}</span>
 <input type="file" accept=".txt,.md,.csv,.json,.rtf" onChange={onFile} className="hidden" />
 </label>
 <button onClick={() => { setText(SAMPLE); setAnalysis(null); setAnswer(""); }} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition">Use sample</button>
 <button onClick={analyze} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition ml-auto">
 <Sparkles className="w-4 h-4" />
 Analyze document
 </button>
 </div>
 {analysis && (
 <div className="mt-5 space-y-5 animate-fadeIn">
 <div className="bg-[#0A0A0C] border border-white/10 rounded-xl p-4">
 <div className="text-xs uppercase tracking-wide text-white/40 mb-2">{analysis.docType}</div>
 <ul className="space-y-1.5">
 {analysis.summary.map((s, i) => (
 <li key={i} className="text-sm text-white/75 flex gap-2"><span className="text-[#60A5FA]">-</span><span>{s}</span></li>
 ))}
 </ul>
 </div>
 <div>
 <div className="text-sm font-medium text-white/80 mb-2">Key terms</div>
 <div className="grid grid-cols-2 gap-2">
 {analysis.terms.map((t, i) => (
 <div key={i} className="flex items-center gap-2 bg-[#0A0A0C] border border-white/10 rounded-lg px-3 py-2">
 {t.found ? <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" /> : <Circle className="w-4 h-4 text-white/25 shrink-0" />}
 <div className="min-w-0">
 <div className="text-[11px] text-white/40">{t.label}</div>
 <div className={"text-sm truncate " + (t.found ? "text-white/85" : "text-white/40")}>{t.value}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 {analysis.clauses.length > 0 && (
 <div>
 <div className="text-sm font-medium text-white/80 mb-2">Clauses in plain English</div>
 <div className="space-y-2">
 {analysis.clauses.map((c, i) => (
 <div key={i} className={"rounded-xl border px-3 py-2.5 " + sevColor(c.severity)}>
 <div className="text-sm font-medium">{c.title}</div>
 <div className="text-xs text-white/60 mt-0.5">{c.plain}</div>
 </div>
 ))}
 </div>
 </div>
 )}
 {analysis.risks.length > 0 && (
 <div>
 <div className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#EF4444]" />Things to watch</div>
 <ul className="space-y-1.5">
 {analysis.risks.map((r, i) => (
 <li key={i} className="text-sm text-[#FCA5A5] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{r}</span></li>
 ))}
 </ul>
 </div>
 )}
 {analysis.missing.length > 0 && (
 <div>
 <div className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-[#F59E0B]" />Possibly missing</div>
 <ul className="space-y-1.5">
 {analysis.missing.map((m, i) => (
 <li key={i} className="text-sm text-[#FCD34D] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2 flex gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /><span>{m} - confirm with your landlord.</span></li>
 ))}
 </ul>
 </div>
 )}
 <form onSubmit={ask} className="bg-[#0A0A0C] border border-white/10 rounded-xl p-4">
 <div className="text-sm font-medium text-white/80 mb-2">Ask about this document</div>
 <div className="flex gap-2">
 <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What is the notice period? Can I sublet?" className="flex-1 bg-[#0F0F12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#2563EB]/50" />
 <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition"><Send className="w-4 h-4" />Ask</button>
 </div>
 {answer && (
 <div className="mt-3 text-sm text-white/80 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg px-3 py-2.5 whitespace-pre-wrap">{answer}</div>
 )}
 </form>
 </div>
 )}
 </div>
 );
 }
