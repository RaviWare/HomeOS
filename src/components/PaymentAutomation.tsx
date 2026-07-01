import React, { useMemo, useState } from "react";
import { Lease, Transaction } from "../types";
import { expectedRentSchedule, expectedToTransaction, parseCsv, reconcile, rowToTransaction, guessCategory, ExpectedRent, CsvRow, ReconcileResult, Category } from "../payments";
import { CalendarClock, CheckCircle2, Upload, Sparkles, Wallet, Plus, Info, FileText } from "lucide-react";

interface Props {
 leases: Lease[];
 transactions: Transaction[];
 onAddTransactions: (ts: Transaction[]) => void;
}

const CATS: Category[] = ["Rent", "Deposit", "Maintenance", "Electricity", "Water", "Gas", "Internet", "Repairs", "Cleaning", "Tax", "Refund", "Other"];

export default function PaymentAutomation({ leases, transactions, onAddTransactions }: Props) {
 const schedule = useMemo(() => expectedRentSchedule(leases, transactions, { back: 3, ahead: 2 }), [leases, transactions]);
 const [csvText, setCsvText] = useState("");
 const [fileName, setFileName] = useState("");
 const [recon, setRecon] = useState<ReconcileResult | null>(null);
 const [rowCats, setRowCats] = useState<Record<number, Category>>({});
 const [added, setAdded] = useState<Record<number, boolean>>({});
 const [matchedDone, setMatchedDone] = useState(false);

 const defaultProp = useMemo(() => {
 const a = leases.find((l) => l.status === "Active");
 if (a) return { id: a.propertyId, name: a.propertyName };
 if (transactions[0]) return { id: transactions[0].propertyId, name: transactions[0].propertyName };
 return { id: "", name: "Imported" };
 }, [leases, transactions]);

 const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

 const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const f = e.target.files && e.target.files[0];
 if (!f) return;
 setFileName(f.name);
 const t = await f.text();
 setCsvText(t);
 };
 const doParse = () => {
 if (!csvText.trim()) return;
 const rows = parseCsv(csvText);
 setRecon(reconcile(rows, schedule));
 setRowCats({});
 setAdded({});
 setMatchedDone(false);
 };
 const markReceived = (ex: ExpectedRent) => onAddTransactions([expectedToTransaction(ex)]);
 const markAll = () => { if (schedule.length) onAddTransactions(schedule.map((e) => expectedToTransaction(e))); };
 const importMatched = () => { if (recon && recon.matched.length) { onAddTransactions(recon.matched.map((m) => rowToTransaction(m.row, { expected: m.expected }))); setMatchedDone(true); } };
 const catFor = (row: CsvRow): Category => (rowCats[row.index] !== undefined ? rowCats[row.index] : guessCategory(row.description, row.direction));
 const importRow = (row: CsvRow) => { onAddTransactions([rowToTransaction(row, { category: catFor(row), prop: defaultProp })]); setAdded((m) => ({ ...m, [row.index]: true })); };

 return (
 <div className="mb-6 animate-fadeIn">
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 mb-5">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-[#60A5FA]" /></div>
 <div className="flex-1">
 <div className="flex items-center gap-2"><h3 className="text-white font-bold">Payment automation</h3><span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30">On-device</span></div>
 <p className="text-xs text-[#9CA3AF] mt-0.5">Auto-schedule rent and import a bank or UPI statement. No bank login, and nothing leaves your device. UPI apps do not expose history, so use a downloaded statement file (CSV).</p>
 </div>
 </div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 mb-5">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Rent schedule</h4></div>
 {schedule.length > 0 && <button onClick={markAll} className="text-xs font-bold text-[#60A5FA] hover:text-white transition-all cursor-pointer">Mark all received</button>}
 </div>
 {schedule.length === 0 ? (
 <div className="flex items-center gap-2 text-sm text-[#9CA3AF] bg-[#1F2937]/40 border border-[#374151] rounded-xl p-3"><CheckCircle2 className="w-4 h-4 text-[#22C55E]" />You are all caught up on rent. New due months will appear here automatically.</div>
 ) : (
 <div className="space-y-2">
 {schedule.map((e) => (
 <div key={e.key} className="flex items-center gap-3 bg-[#1F2937]/40 border border-[#374151] rounded-xl p-3">
 <Wallet className="w-4 h-4 text-[#60A5FA] shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="text-sm font-semibold text-white truncate">{e.propertyName} <span className="text-[#9CA3AF] font-normal">- {e.label}</span></div>
 <div className="text-[11px] text-[#6B7280]">Due {e.dueDate} . {e.tenantName}</div>
 </div>
 <div className="text-sm font-bold text-white shrink-0">{inr(e.amount)}</div>
 <button onClick={() => markReceived(e)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-all cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" />Received</button>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Import bank or UPI statement (CSV)</h4></div>
 <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="Paste CSV rows here, or upload a .csv file. Example header: Date, Narration, Debit, Credit, Balance" className="w-full h-24 bg-[#0B1220] border border-[#374151] rounded-xl p-3 text-xs text-white/80 placeholder:text-[#6B7280] resize-y focus:outline-none focus:border-[#2563EB]/60" />
 <div className="flex flex-wrap items-center gap-2 mt-3">
 <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1F2937] border border-[#374151] text-sm text-[#D1D5DB] hover:bg-[#374151]/60 cursor-pointer transition-all"><Upload className="w-4 h-4" /><span>{fileName || "Upload CSV"}</span><input type="file" accept=".csv,.txt" onChange={onFile} className="hidden" /></label>
 <button onClick={doParse} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-all cursor-pointer ml-auto"><Sparkles className="w-4 h-4" />Match and preview</button>
 </div>
 {recon && (
 <div className="mt-4 space-y-4 animate-fadeIn">
 <div>
 <div className="flex items-center justify-between mb-2">
 <div className="text-xs font-bold text-white">Matched to rent ({recon.matched.length})</div>
 {recon.matched.length > 0 && (matchedDone ? <span className="text-[11px] text-[#22C55E] font-bold">Imported</span> : <button onClick={importMatched} className="text-xs font-bold text-[#60A5FA] hover:text-white cursor-pointer transition-all">Import all matched</button>)}
 </div>
 {recon.matched.length === 0 ? (
 <div className="text-[11px] text-[#6B7280]">No statement rows matched the expected rent amounts.</div>
 ) : (
 <div className="space-y-1.5">
 {recon.matched.map((m, i) => (
 <div key={i} className="flex items-center gap-2 text-xs bg-[#1F2937]/40 border border-[#374151] rounded-lg px-3 py-2">
 <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
 <span className="text-white font-semibold shrink-0">{m.expected.label}</span>
 <span className="text-[#6B7280] shrink-0">matched</span>
 <span className="text-[#9CA3AF] truncate flex-1">{m.row.description || m.row.rawDate}</span>
 <span className="text-white font-bold shrink-0">{inr(m.row.amount)}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 {recon.unmatchedRows.length > 0 && (
 <div>
 <div className="text-xs font-bold text-white mb-2">Other transactions ({recon.unmatchedRows.length})</div>
 <div className="space-y-1.5">
 {recon.unmatchedRows.map((row) => (
 <div key={row.index} className="flex items-center gap-2 bg-[#1F2937]/40 border border-[#374151] rounded-lg px-3 py-2">
 <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 " + (row.direction === "credit" ? "bg-[#22C55E]/15 text-[#4ADE80]" : "bg-[#EF4444]/15 text-[#F87171]")}>{row.direction === "credit" ? "IN" : "OUT"}</span>
 <div className="min-w-0 flex-1">
 <div className="text-xs text-white truncate">{row.description || "Transaction"}</div>
 <div className="text-[10px] text-[#6B7280]">{row.date || row.rawDate}</div>
 </div>
 <span className="text-xs font-bold text-white shrink-0">{inr(row.amount)}</span>
 <select value={catFor(row)} onChange={(ev) => setRowCats((m) => ({ ...m, [row.index]: ev.target.value as Category }))} className="text-[11px] bg-[#0B1220] border border-[#374151] rounded-lg px-2 py-1 text-[#D1D5DB] focus:outline-none focus:border-[#2563EB]/60 cursor-pointer">
 {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
 </select>
 {added[row.index] ? <span className="text-[11px] text-[#22C55E] font-bold shrink-0 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Added</span> : <button onClick={() => importRow(row)} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-[#D1D5DB] text-[11px] font-bold hover:bg-[#374151]/60 transition-all cursor-pointer"><Plus className="w-3 h-3" />Add</button>}
 </div>
 ))}
 </div>
 </div>
 )}
 <div className="flex items-start gap-2 text-[11px] text-[#6B7280]"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />Matching is best effort by amount and month. Review before importing. All parsing happens on your device.</div>
 </div>
 )}
 </div>
 </div>
 );
}
