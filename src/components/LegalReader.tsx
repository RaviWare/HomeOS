import React, { useState } from "react";
import {
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Send,
  Upload,
  Sparkles,
  Info,
  Circle,
} from "lucide-react";
import { analyzeLegalText, answerLegalQuestion, LegalAnalysis } from "../legal";

const SAMPLE =
  "This Rental Agreement is made on 01/06/2026 between the Lessor and the Tenant. The monthly rent is Rs 45,000 payable by the 5th of each month. The security deposit is Rs 1,50,000 and is refundable within 30 days of vacating after deductions. The lock-in period is 11 months. A notice period of 2 months is required to vacate. Rent shall be subject to a 8% escalation on renewal. A late payment fee of Rs 1,000 applies after the 10th. Subletting is not permitted without written consent. Pets are not allowed. Maintenance charges are borne by the tenant. This agreement may be terminated by either party with notice.";

interface LegalReaderProps {
  /** When true, omit outer card chrome (parent already provides shell). */
  embedded?: boolean;
}

export default function LegalReader({ embedded = false }: LegalReaderProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<LegalAnalysis | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    if (/\.(txt|md|csv|json|rtf)$/i.test(file.name) || (file.type || "").includes("text")) {
      const t = await file.text();
      setText(t);
    } else {
      alert(
        "For now, paste the document text below. PDF and scanned files need OCR, which can be added next."
      );
    }
  };

  const analyze = () => {
    if (!text.trim()) return;
    setAnalysis(analyzeLegalText(text));
    setAnswer("");
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis || !question.trim()) return;
    setAnswer(answerLegalQuestion(question, text, analysis));
  };

  const sevColor = (s: string) =>
    s === "risk"
      ? "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10"
      : s === "watch"
        ? "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10"
        : "text-white/80 border-white/15 bg-white/5";

  const shell = embedded
    ? "flex flex-col gap-4"
    : "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 flex flex-col gap-4";

  return (
    <div className={shell}>
      {!embedded && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <FileSearch className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-black text-sm">Legal document reader</h3>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-[#8E8E93] border border-white/10 font-bold">
                Beta
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-relaxed">
              Reads a lease on your device, explains it in plain English, and flags risks. Nothing leaves
              your browser.
            </p>
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your lease or agreement text here, or upload a .txt / .md file below."
        className="w-full h-32 bg-[#121215] border border-[#1F1F23] rounded-xl p-3 text-sm text-white/85 placeholder:text-[#6B7280] resize-y focus:outline-none focus:border-white/25"
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-[12px] font-semibold text-white/80 hover:border-white/20 cursor-pointer transition">
          <Upload className="w-3.5 h-3.5" />
          <span className="truncate max-w-[140px]">{fileName || "Upload text file"}</span>
          <input type="file" accept=".txt,.md,.csv,.json,.rtf" onChange={onFile} className="hidden" />
        </label>
        <button
          type="button"
          onClick={() => {
            setText(SAMPLE);
            setAnalysis(null);
            setAnswer("");
          }}
          className="h-9 px-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-[12px] font-semibold text-white/80 hover:border-white/20 cursor-pointer transition"
        >
          Use sample
        </button>
        <button
          type="button"
          onClick={analyze}
          disabled={!text.trim()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-black text-[12px] font-black hover:bg-white/90 transition ml-auto disabled:opacity-40 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Analyze
        </button>
      </div>

      {analysis && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#121215] border border-[#1F1F23] rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#8E8E93] font-bold mb-2">
              {analysis.docType}
            </div>
            <ul className="space-y-1.5">
              {analysis.summary.map((s, i) => (
                <li key={i} className="text-[13px] text-white/80 flex gap-2">
                  <span className="text-white/30 shrink-0">▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[12px] font-bold text-white mb-2">Key terms</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.terms.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[#121215] border border-[#1F1F23] rounded-lg px-3 py-2"
                >
                  {t.found ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/25 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] text-[#8E8E93] font-bold uppercase">{t.label}</div>
                    <div className={`text-[13px] truncate ${t.found ? "text-white" : "text-white/40"}`}>
                      {t.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analysis.clauses.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-white mb-2">Clauses in plain English</div>
              <div className="space-y-2">
                {analysis.clauses.map((c, i) => (
                  <div key={i} className={`rounded-xl border px-3 py-2.5 ${sevColor(c.severity)}`}>
                    <div className="text-[13px] font-bold text-white">{c.title}</div>
                    <div className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{c.plain}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.risks.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Things to watch
              </div>
              <ul className="space-y-1.5">
                {analysis.risks.map((r, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.missing.length > 0 && (
            <div>
              <div className="text-[12px] font-bold text-white mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                Possibly missing
              </div>
              <ul className="space-y-1.5">
                {analysis.missing.map((m, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-amber-100 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex gap-2"
                  >
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{m} — confirm with your landlord.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={ask} className="bg-[#121215] border border-[#1F1F23] rounded-xl p-4">
            <div className="text-[12px] font-bold text-white mb-2">Ask about this document</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What is the notice period?"
                className="flex-1 h-10 bg-[#0A0A0C] border border-[#1F1F23] rounded-lg px-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-white/25"
              />
              <button
                type="submit"
                className="h-10 inline-flex items-center justify-center gap-1.5 px-4 rounded-lg bg-white text-black text-[12px] font-black cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Ask
              </button>
            </div>
            {answer && (
              <div className="mt-3 text-[13px] text-white/85 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
                {answer}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
