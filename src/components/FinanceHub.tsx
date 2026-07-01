import React, { useMemo, useState } from "react";
import { Transaction } from "../types";
import { FinanceEntry, RecurringRule, Goal, FinanceFlow, GoalKind, INCOME_CATEGORIES, EXPENSE_CATEGORIES, deriveMonthlyCashflow, savingsRate, dueRecurring, recurringToEntry, goalProgress, newFinanceId, loadEntries, saveEntries, loadRules, saveRules, loadGoals, saveGoals } from "../finance";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Plus, Trash2, Repeat, CheckCircle2, Landmark } from "lucide-react";

interface Props { role: string; transactions: Transaction[]; }

const GOAL_KINDS: GoalKind[] = ["Land", "Flat", "House", "Car", "Renovation", "Other"];
function todayISO(): string { var d = new Date(); var p = (n: number) => (n < 10 ? "0" + n : "" + n); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

export default function FinanceHub({ role, transactions }: Props) {
 const [entries, setEntries] = useState<FinanceEntry[]>(() => loadEntries());
 const [rules, setRules] = useState<RecurringRule[]>(() => loadRules());
 const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
 const putEntries = (v: FinanceEntry[]) => { setEntries(v); saveEntries(v); };
 const putRules = (v: RecurringRule[]) => { setRules(v); saveRules(v); };
 const putGoals = (v: Goal[]) => { setGoals(v); saveGoals(v); };

 const cashflow = useMemo(() => deriveMonthlyCashflow(entries, transactions, role, { months: 6 }), [entries, transactions, role]);
 const current = cashflow[cashflow.length - 1] || { monthKey: "", label: "", inflow: 0, outflow: 0, net: 0 };
 const rate = savingsRate(current);
 const due = useMemo(() => dueRecurring(rules, entries, current.monthKey), [rules, entries, current.monthKey]);
 const maxFlow = Math.max(...cashflow.map((c) => Math.max(c.inflow, c.outflow)), 1);
 const inr = (n: number) => "\u20B9" + Math.round(n).toLocaleString("en-IN");

 const [eFlow, setEFlow] = useState<FinanceFlow>("out");
 const [eCat, setECat] = useState("Food");
 const [eAmt, setEAmt] = useState("");
 const [eDate, setEDate] = useState(todayISO());
 const [eNote, setENote] = useState("");
 const cats = eFlow === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
 const setFlow = (f: FinanceFlow) => { setEFlow(f); setECat(f === "in" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); };
 const addEntry = () => { var amt = parseFloat(eAmt); if (!amt || amt <= 0) return; putEntries([{ id: newFinanceId("fe"), date: eDate || todayISO(), flow: eFlow, category: eCat, amount: amt, note: eNote }, ...entries]); setEAmt(""); setENote(""); };
 const delEntry = (id: string) => putEntries(entries.filter((x) => x.id !== id));
 const logRule = (r: RecurringRule) => putEntries([recurringToEntry(r, current.monthKey), ...entries]);
 const logAllDue = () => { if (due.length) putEntries(due.map((r) => recurringToEntry(r, current.monthKey)).concat(entries)); };

 const [rName, setRName] = useState("");
 const [rFlow, setRFlow] = useState<FinanceFlow>("out");
 const [rCat, setRCat] = useState("Utilities");
 const [rAmt, setRAmt] = useState("");
 const [rDay, setRDay] = useState("5");
 const rCats = rFlow === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
 const setRFlowCat = (f: FinanceFlow) => { setRFlow(f); setRCat(f === "in" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); };
 const addRule = () => { var amt = parseFloat(rAmt); if (!rName.trim() || !amt || amt <= 0) return; putRules([{ id: newFinanceId("rr"), name: rName.trim(), flow: rFlow, category: rCat, amount: amt, dayOfMonth: parseInt(rDay, 10) || 1, active: true }, ...rules]); setRName(""); setRAmt(""); };
 const delRule = (id: string) => putRules(rules.filter((x) => x.id !== id));

 const [gName, setGName] = useState("");
 const [gKind, setGKind] = useState<GoalKind>("Land");
 const [gTarget, setGTarget] = useState("");
 const [gSaved, setGSaved] = useState("");
 const [gDate, setGDate] = useState("");
 const addGoal = () => { var tgt = parseFloat(gTarget); if (!gName.trim() || !tgt || tgt <= 0) return; putGoals([{ id: newFinanceId("goal"), name: gName.trim(), kind: gKind, targetAmount: tgt, savedAmount: parseFloat(gSaved) || 0, targetDate: gDate || "", note: "" }, ...goals]); setGName(""); setGTarget(""); setGSaved(""); setGDate(""); };
 const addSaved = (g: Goal) => { var s = window.prompt("Add how much to " + g.name + "?"); var a = parseFloat(s || ""); if (a && a > 0) putGoals(goals.map((x) => x.id === g.id ? { ...x, savedAmount: x.savedAmount + a } : x)); };
 const delGoal = (id: string) => putGoals(goals.filter((x) => x.id !== id));

 return (
 <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
 <div className="border-b border-[#374151] pb-4">
 <h2 className="text-xl font-extrabold text-white tracking-tight">Finances</h2>
 <p className="text-xs text-[#9CA3AF]">Your full money picture: income, expenses, savings, and dream-purchase goals. Fully on-device. Rental payments are included automatically ({role === "Tenant" ? "rent is counted as an expense" : "rent is counted as income"}).</p>
 </div>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4">
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#9CA3AF]"><TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />Income</div>
 <div className="text-xl font-black text-white mt-1">{inr(current.inflow)}</div>
 <div className="text-[10px] text-[#6B7280] mt-0.5">{current.label}</div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4">
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#9CA3AF]"><TrendingDown className="w-3.5 h-3.5 text-[#F87171]" />Expenses</div>
 <div className="text-xl font-black text-white mt-1">{inr(current.outflow)}</div>
 <div className="text-[10px] text-[#6B7280] mt-0.5">{current.label}</div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4">
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#9CA3AF]"><Wallet className="w-3.5 h-3.5 text-[#60A5FA]" />Net</div>
 <div className={"text-xl font-black mt-1 " + (current.net >= 0 ? "text-[#4ADE80]" : "text-[#F87171]")}>{inr(current.net)}</div>
 <div className="text-[10px] text-[#6B7280] mt-0.5">Income minus expenses</div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4">
 <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#9CA3AF]"><PiggyBank className="w-3.5 h-3.5 text-[#60A5FA]" />Savings rate</div>
 <div className={"text-xl font-black mt-1 " + (rate >= 0 ? "text-white" : "text-[#F87171]")}>{rate}%</div>
 <div className="text-[10px] text-[#6B7280] mt-0.5">of income kept</div>
 </div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Cash flow (last 6 months)</h4></div>
 <div className="flex items-end justify-between gap-3 h-[150px]">
 {cashflow.map((c) => (
 <div key={c.monthKey} className="flex-1 flex flex-col items-center gap-1.5">
 <div className="flex items-end gap-1 h-[120px]">
 <div className="w-3 bg-[#22C55E] rounded-t" style={{ height: Math.max((c.inflow / maxFlow) * 120, 2) + "px" }} title={"In " + inr(c.inflow)}></div>
 <div className="w-3 bg-[#EF4444] rounded-t" style={{ height: Math.max((c.outflow / maxFlow) * 120, 2) + "px" }} title={"Out " + inr(c.outflow)}></div>
 </div>
 <span className="text-[9px] text-[#9CA3AF] font-bold">{c.label.slice(0, 3)}</span>
 </div>
 ))}
 </div>
 <div className="flex items-center gap-4 mt-3 text-[10px] text-[#9CA3AF]"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#22C55E]"></span>Money in</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#EF4444]"></span>Money out</span></div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center gap-2 mb-3"><Plus className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Add income or expense</h4></div>
 <div className="flex flex-wrap items-center gap-2">
 <div className="flex rounded-lg overflow-hidden border border-[#374151]">
 <button onClick={() => setFlow("in")} className={"px-3 py-2 text-xs font-bold cursor-pointer " + (eFlow === "in" ? "bg-[#22C55E]/20 text-[#4ADE80]" : "bg-[#1F2937] text-[#9CA3AF]")}>Income</button>
 <button onClick={() => setFlow("out")} className={"px-3 py-2 text-xs font-bold cursor-pointer " + (eFlow === "out" ? "bg-[#EF4444]/20 text-[#F87171]" : "bg-[#1F2937] text-[#9CA3AF]")}>Expense</button>
 </div>
 <select value={eCat} onChange={(e) => setECat(e.target.value)} className="bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white cursor-pointer focus:outline-none focus:border-[#2563EB]/60">{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
 <input value={eAmt} onChange={(e) => setEAmt(e.target.value)} type="number" placeholder="Amount" className="w-28 bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <input value={eDate} onChange={(e) => setEDate(e.target.value)} type="date" className="bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2563EB]/60" />
 <input value={eNote} onChange={(e) => setENote(e.target.value)} placeholder="Note (optional)" className="flex-1 min-w-[120px] bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <button onClick={addEntry} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] cursor-pointer transition-all"><Plus className="w-4 h-4" />Add</button>
 </div>
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center gap-2 mb-3"><Landmark className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Recent entries</h4></div>
 {entries.length === 0 ? (
 <div className="text-xs text-[#6B7280]">No income or expense entries yet. Add one above, or set up a recurring rule below.</div>
 ) : (
 <div className="space-y-1.5">
 {entries.slice(0, 12).map((en) => (
 <div key={en.id} className="flex items-center gap-2 bg-[#1F2937]/40 border border-[#374151] rounded-lg px-3 py-2">
 <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 " + (en.flow === "in" ? "bg-[#22C55E]/15 text-[#4ADE80]" : "bg-[#EF4444]/15 text-[#F87171]")}>{en.flow === "in" ? "IN" : "OUT"}</span>
 <div className="min-w-0 flex-1"><div className="text-xs text-white truncate">{en.category}{en.note ? " . " + en.note : ""}</div><div className="text-[10px] text-[#6B7280]">{en.date}</div></div>
 <span className={"text-xs font-bold shrink-0 " + (en.flow === "in" ? "text-[#4ADE80]" : "text-white")}>{inr(en.amount)}</span>
 <button onClick={() => delEntry(en.id)} className="text-[#6B7280] hover:text-[#F87171] cursor-pointer shrink-0" title="Delete entry"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2"><Repeat className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Fixed monthly (recurring)</h4></div>
 {due.length > 0 && <button onClick={logAllDue} className="text-xs font-bold text-[#60A5FA] hover:text-white cursor-pointer transition-all">Log all due ({due.length})</button>}
 </div>
 {due.length > 0 && (
 <div className="space-y-1.5 mb-3">
 {due.map((r) => (
 <div key={r.id} className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-lg px-3 py-2">
 <span className="text-[10px] font-bold text-[#FCD34D] shrink-0">DUE</span>
 <div className="flex-1 min-w-0"><div className="text-xs text-white truncate">{r.name}</div><div className="text-[10px] text-[#6B7280]">{r.category} . day {r.dayOfMonth}</div></div>
 <span className="text-xs font-bold text-white shrink-0">{inr(r.amount)}</span>
 <button onClick={() => logRule(r)} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2563EB] text-white text-[10px] font-bold hover:bg-[#1D4ED8] cursor-pointer transition-all"><CheckCircle2 className="w-3 h-3" />Log this month</button>
 </div>
 ))}
 </div>
 )}
 <div className="flex flex-wrap items-center gap-2 border-t border-[#374151]/50 pt-3">
 <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Name (e.g. Netflix, EMI)" className="flex-1 min-w-[130px] bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <div className="flex rounded-lg overflow-hidden border border-[#374151]">
 <button onClick={() => setRFlowCat("out")} className={"px-3 py-2 text-xs font-bold cursor-pointer " + (rFlow === "out" ? "bg-[#EF4444]/20 text-[#F87171]" : "bg-[#1F2937] text-[#9CA3AF]")}>Expense</button>
 <button onClick={() => setRFlowCat("in")} className={"px-3 py-2 text-xs font-bold cursor-pointer " + (rFlow === "in" ? "bg-[#22C55E]/20 text-[#4ADE80]" : "bg-[#1F2937] text-[#9CA3AF]")}>Income</button>
 </div>
 <select value={rCat} onChange={(e) => setRCat(e.target.value)} className="bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white cursor-pointer focus:outline-none focus:border-[#2563EB]/60">{rCats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
 <input value={rAmt} onChange={(e) => setRAmt(e.target.value)} type="number" placeholder="Amount" className="w-24 bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <input value={rDay} onChange={(e) => setRDay(e.target.value)} type="number" placeholder="Day" title="Day of month" className="w-16 bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <button onClick={addRule} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#1F2937] border border-[#374151] text-white text-sm font-bold hover:bg-[#374151]/60 cursor-pointer transition-all"><Plus className="w-4 h-4" />Add rule</button>
 </div>
 {rules.length > 0 && (
 <div className="space-y-1.5 mt-3">
 {rules.map((r) => (
 <div key={r.id} className="flex items-center gap-2 bg-[#1F2937]/40 border border-[#374151] rounded-lg px-3 py-2">
 <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 " + (r.flow === "in" ? "bg-[#22C55E]/15 text-[#4ADE80]" : "bg-[#EF4444]/15 text-[#F87171]")}>{r.flow === "in" ? "IN" : "OUT"}</span>
 <div className="flex-1 min-w-0"><div className="text-xs text-white truncate">{r.name}</div><div className="text-[10px] text-[#6B7280]">{r.category} . day {r.dayOfMonth}</div></div>
 <span className="text-xs font-bold text-white shrink-0">{inr(r.amount)}</span>
 <button onClick={() => delRule(r.id)} className="text-[#6B7280] hover:text-[#F87171] cursor-pointer shrink-0" title="Delete rule"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 ))}
 </div>
 )}
 </div>
 <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5">
 <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-[#60A5FA]" /><h4 className="text-sm font-bold text-white">Dream purchases and goals</h4></div>
 <div className="flex flex-wrap items-center gap-2 border-b border-[#374151]/50 pb-3 mb-3">
 <input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Goal (e.g. Plot in Mysuru)" className="flex-1 min-w-[140px] bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <select value={gKind} onChange={(e) => setGKind(e.target.value as GoalKind)} className="bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white cursor-pointer focus:outline-none focus:border-[#2563EB]/60">{GOAL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
 <input value={gTarget} onChange={(e) => setGTarget(e.target.value)} type="number" placeholder="Target" className="w-28 bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <input value={gSaved} onChange={(e) => setGSaved(e.target.value)} type="number" placeholder="Saved" className="w-24 bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#2563EB]/60" />
 <input value={gDate} onChange={(e) => setGDate(e.target.value)} type="month" title="Target date" className="bg-[#0B1220] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2563EB]/60" />
 <button onClick={addGoal} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] cursor-pointer transition-all"><Plus className="w-4 h-4" />Add goal</button>
 </div>
 {goals.length === 0 ? (
 <div className="text-xs text-[#6B7280]">No goals yet. Add a dream purchase like land, a flat, or a car and track your progress.</div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {goals.map((g) => { var pr = goalProgress(g); return (
 <div key={g.id} className="bg-[#1F2937]/40 border border-[#374151] rounded-xl p-4">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0"><div className="text-sm font-bold text-white truncate">{g.name}</div><div className="text-[10px] text-[#6B7280] uppercase font-bold">{g.kind}{g.targetDate ? " . by " + g.targetDate : ""}</div></div>
 <button onClick={() => delGoal(g.id)} className="text-[#6B7280] hover:text-[#F87171] cursor-pointer shrink-0" title="Delete goal"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 <div className="w-full bg-[#111827] rounded-full h-2 overflow-hidden mt-3"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: pr.pct + "%" }}></div></div>
 <div className="flex justify-between text-[11px] mt-1.5"><span className="text-[#9CA3AF]">{inr(g.savedAmount)} of {inr(g.targetAmount)}</span><span className="text-white font-bold">{pr.pct}%</span></div>
 <div className="flex items-center justify-between mt-2 gap-2">
 <div className="text-[10px] text-[#6B7280]">{pr.remaining > 0 ? inr(pr.remaining) + " to go" + (pr.monthsLeft > 0 ? " . " + inr(pr.monthlyNeeded) + "/mo for " + pr.monthsLeft + " mo" : "") : "Goal reached"}</div>
 <button onClick={() => addSaved(g)} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1F2937] border border-[#374151] text-[#D1D5DB] text-[10px] font-bold hover:bg-[#374151]/60 cursor-pointer transition-all"><PiggyBank className="w-3 h-3" />Add to savings</button>
 </div>
 </div>
 ); })}
 </div>
 )}
 </div>
 </div>
 );
}
