import { Transaction } from "./types";

export type FinanceFlow = "in" | "out";

export const INCOME_CATEGORIES = ["Salary", "Business", "Rental Income", "Freelance", "Interest", "Gift", "Other Income"];
export const EXPENSE_CATEGORIES = ["Housing", "Food", "Transport", "Utilities", "EMI / Loan", "Insurance", "Health", "Education", "Shopping", "Entertainment", "Travel", "Other Expense"];

export interface FinanceEntry { id: string; date: string; flow: FinanceFlow; category: string; amount: number; note: string; ruleId?: string; }
export interface RecurringRule { id: string; name: string; flow: FinanceFlow; category: string; amount: number; dayOfMonth: number; active: boolean; }
export type GoalKind = "Land" | "Flat" | "House" | "Car" | "Renovation" | "Other";
export interface Goal { id: string; name: string; kind: GoalKind; targetAmount: number; savedAmount: number; targetDate: string; note: string; }
export interface CashflowMonth { monthKey: string; label: string; inflow: number; outflow: number; net: number; }

const FMN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fp2(n: number): string { return n < 10 ? "0" + n : "" + n; }
function fMonthKey(dateStr: string): string { return (dateStr || "").slice(0, 7); }
function fToday(): string { var d = new Date(); return d.getFullYear() + "-" + fp2(d.getMonth() + 1) + "-" + fp2(d.getDate()); }
function fAddMonths(y: number, m: number, delta: number): { y: number; m: number } { var t = y * 12 + (m - 1) + delta; var yy = Math.floor(t / 12); var mm = t - yy * 12; return { y: yy, m: mm + 1 }; }

var _fseq = 0;
export function newFinanceId(prefix: string): string { _fseq = _fseq + 1; return prefix + "-" + Date.now().toString(36) + _fseq.toString(36) + Math.floor(Math.random() * 46656).toString(36); }

export function isIncomeCategory(cat: string): boolean { for (var i = 0; i < INCOME_CATEGORIES.length; i++) { if (INCOME_CATEGORIES[i] === cat) return true; } return false; }
export function flowOfFinanceCategory(cat: string): FinanceFlow { return isIncomeCategory(cat) ? "in" : "out"; }
export function flowOfRentalTx(category: string, role: string): FinanceFlow {
 var owner = role !== "Tenant";
 if (category === "Rent" || category === "Deposit") return owner ? "in" : "out";
 if (category === "Refund") return owner ? "out" : "in";
 return "out";
}

export function deriveMonthlyCashflow(entries: FinanceEntry[], transactions: Transaction[], role: string, opts?: { months?: number; today?: string; includeRental?: boolean }): CashflowMonth[] {
 var months = (opts && opts.months) || 6;
 var includeRental = !opts || opts.includeRental !== false;
 var anchor = (opts && opts.today) || "";
 if (!anchor) {
 var mx = "";
 for (var i = 0; i < entries.length; i++) { if (entries[i].date > mx) mx = entries[i].date; }
 if (includeRental) { for (var j = 0; j < transactions.length; j++) { if (transactions[j].date > mx) mx = transactions[j].date; } }
 anchor = mx || fToday();
 }
 var ay = parseInt(anchor.slice(0, 4), 10) || 2026;
 var am = parseInt(anchor.slice(5, 7), 10) || 6;
 var buckets: CashflowMonth[] = [];
 var index: { [k: string]: CashflowMonth } = {};
 for (var k = months - 1; k >= 0; k--) {
 var ym = fAddMonths(ay, am, -k);
 var mk = ym.y + "-" + fp2(ym.m);
 var b: CashflowMonth = { monthKey: mk, label: FMN[ym.m - 1] + " " + ym.y, inflow: 0, outflow: 0, net: 0 };
 buckets.push(b);
 index[mk] = b;
 }
 for (var e = 0; e < entries.length; e++) {
 var en = entries[e];
 var b1 = index[fMonthKey(en.date)];
 if (!b1) continue;
 if (en.flow === "in") b1.inflow += en.amount; else b1.outflow += en.amount;
 }
 if (includeRental) {
 for (var t = 0; t < transactions.length; t++) {
 var tx = transactions[t];
 var b2 = index[fMonthKey(tx.date)];
 if (!b2) continue;
 if (flowOfRentalTx(tx.category, role) === "in") b2.inflow += tx.amount; else b2.outflow += tx.amount;
 }
 }
 for (var q = 0; q < buckets.length; q++) { buckets[q].net = buckets[q].inflow - buckets[q].outflow; }
 return buckets;
}

export function savingsRate(m: CashflowMonth): number { return m.inflow > 0 ? Math.round((m.net / m.inflow) * 100) : 0; }

export function dueRecurring(rules: RecurringRule[], entries: FinanceEntry[], monthKey: string): RecurringRule[] {
 var logged: { [k: string]: boolean } = {};
 for (var i = 0; i < entries.length; i++) { var en = entries[i]; if (en.ruleId && fMonthKey(en.date) === monthKey) logged[en.ruleId] = true; }
 var out: RecurringRule[] = [];
 for (var r = 0; r < rules.length; r++) { if (rules[r].active && !logged[rules[r].id]) out.push(rules[r]); }
 return out;
}

export function recurringToEntry(rule: RecurringRule, monthKey: string): FinanceEntry {
 var day = rule.dayOfMonth || 1; if (day < 1) day = 1; if (day > 28) day = 28;
 return { id: newFinanceId("fe"), date: monthKey + "-" + fp2(day), flow: rule.flow, category: rule.category, amount: rule.amount, note: rule.name, ruleId: rule.id };
}

export function goalProgress(goal: Goal, today?: string): { pct: number; remaining: number; monthsLeft: number; monthlyNeeded: number } {
 var t = today || fToday();
 var pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
 var remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
 var ty = parseInt(t.slice(0, 4), 10) || 0;
 var tm = parseInt(t.slice(5, 7), 10) || 0;
 var gy = parseInt((goal.targetDate || "").slice(0, 4), 10) || ty;
 var gm = parseInt((goal.targetDate || "").slice(5, 7), 10) || tm;
 var monthsLeft = (gy * 12 + gm) - (ty * 12 + tm);
 if (monthsLeft < 0) monthsLeft = 0;
 var monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;
 return { pct: pct, remaining: remaining, monthsLeft: monthsLeft, monthlyNeeded: monthlyNeeded };
}

function loadArr(key: string): any[] { try { var raw = localStorage.getItem(key); if (!raw) return []; var v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function saveArr(key: string, v: any): void { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

export var FIN_KEYS = { entries: "rv_finance_entries", rules: "rv_recurring", goals: "rv_goals" };
export function loadEntries(): FinanceEntry[] { return loadArr(FIN_KEYS.entries); }
export function saveEntries(v: FinanceEntry[]): void { saveArr(FIN_KEYS.entries, v); }
export function loadRules(): RecurringRule[] { return loadArr(FIN_KEYS.rules); }
export function saveRules(v: RecurringRule[]): void { saveArr(FIN_KEYS.rules, v); }
export function loadGoals(): Goal[] { return loadArr(FIN_KEYS.goals); }
export function saveGoals(v: Goal[]): void { saveArr(FIN_KEYS.goals, v); }
