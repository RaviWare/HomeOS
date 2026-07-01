import { Lease, Transaction } from "./types";

export type PayMethod = Transaction["paymentMethod"];
export type Category = Transaction["category"];

export interface ExpectedRent {
 key: string;
 leaseId: string;
 propertyId: string;
 propertyName: string;
 tenantName: string;
 amount: number;
 monthKey: string;
 dueDate: string;
 label: string;
}

export interface CsvRow {
 index: number;
 date: string;
 rawDate: string;
 description: string;
 amount: number;
 direction: "credit" | "debit" | "unknown";
}

export interface ReconMatch { expected: ExpectedRent; row: CsvRow; }

export interface ReconcileResult {
 matched: ReconMatch[];
 unmatchedExpected: ExpectedRent[];
 rows: CsvRow[];
 unmatchedRows: CsvRow[];
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad2(n: number): string { return n < 10 ? "0" + n : "" + n; }
function monthName(m: number): string { return MONTHS[(m - 1 + 12) % 12]; }
function ymdStr(y: number, m: number, d: number): string { return y + "-" + pad2(m) + "-" + pad2(d); }
function monthKeyOf(dateStr: string): string { return (dateStr || "").slice(0, 7); }
function ymNum(y: number, m: number): number { return y * 12 + (m - 1); }

function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
 var t = y * 12 + (m - 1) + delta;
 var yy = Math.floor(t / 12);
 var mm = t - yy * 12;
 return { y: yy, m: mm + 1 };
}

function parseYMDLoose(s: string): { y: number; m: number; d: number } | null {
 if (!s) return null;
 var v = ("" + s).slice(0, 10);
 var m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if (!m) return null;
 return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

function ymOfDate(s: string): { y: number; m: number } | null {
 var p = parseYMDLoose(s);
 return p ? { y: p.y, m: p.m } : null;
}

function isoToday(): string {
 var d = new Date();
 return ymdStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

var _seq = 0;
function newId(prefix: string): string {
 _seq = _seq + 1;
 return prefix + "-" + Date.now().toString(36) + _seq.toString(36) + Math.floor(Math.random() * 46656).toString(36);
}

export function expectedRentSchedule(
 leases: Lease[],
 transactions: Transaction[],
 opts?: { today?: string; back?: number; ahead?: number; dueDay?: number }
): ExpectedRent[] {
 var today = (opts && opts.today) || isoToday();
 var back = (opts && typeof opts.back === "number") ? opts.back : 3;
 var ahead = (opts && typeof opts.ahead === "number") ? opts.ahead : 2;
 var dueDay = (opts && opts.dueDay) || 5;
 var tp = parseYMDLoose(today);
 if (!tp) return [];
 var have: { [k: string]: boolean } = {};
 for (var i = 0; i < transactions.length; i++) {
 var tx = transactions[i];
 if (tx.category === "Rent") have[tx.propertyId + "|" + monthKeyOf(tx.date)] = true;
 }
 var out: ExpectedRent[] = [];
 for (var j = 0; j < leases.length; j++) {
 var l = leases[j];
 if (l.status !== "Active") continue;
 var rent = l.monthlyRent || 0;
 if (rent <= 0) continue;
 var ls = ymOfDate(l.startDate);
 var le = ymOfDate(l.endDate);
 for (var k = -back; k <= ahead; k++) {
 var ym = addMonths(tp.y, tp.m, k);
 var cur = ymNum(ym.y, ym.m);
 if (ls && cur < ymNum(ls.y, ls.m)) continue;
 if (le && cur > ymNum(le.y, le.m)) continue;
 var mk = ym.y + "-" + pad2(ym.m);
 if (have[l.propertyId + "|" + mk]) continue;
 out.push({ key: l.id + "|" + mk, leaseId: l.id, propertyId: l.propertyId, propertyName: l.propertyName, tenantName: l.tenantName, amount: rent, monthKey: mk, dueDate: ymdStr(ym.y, ym.m, dueDay), label: monthName(ym.m) + " " + ym.y });
 }
 }
 out.sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : (a.dueDate > b.dueDate ? 1 : 0); });
 return out;
}

export function expectedToTransaction(e: ExpectedRent, method?: PayMethod): Transaction {
 var m: PayMethod = method || "UPI";
 return {
 id: newId("tx"),
 propertyId: e.propertyId,
 propertyName: e.propertyName,
 category: "Rent",
 amount: e.amount,
 date: e.dueDate,
 status: "Paid",
 paymentMethod: m,
 invoiceNumber: "INV-" + e.dueDate.replace(/-/g, "") + "-" + (100 + Math.floor(Math.random() * 900)),
 description: "Rent received for " + e.label + " from " + e.tenantName
 };
}

export function guessCategory(desc: string, direction: string): Category {
 var d = (desc || "").toLowerCase();
 if (/rent/.test(d)) return "Rent";
 if (/electric|power|bescom|mseb|tneb|bses/.test(d)) return "Electricity";
 if (/water|sewage/.test(d)) return "Water";
 if (/\bgas\b|lpg|piped/.test(d)) return "Gas";
 if (/internet|broadband|wifi|fiber|fibre|airtel|jio|bsnl|hathway/.test(d)) return "Internet";
 if (/maintenance|society|association|upkeep/.test(d)) return "Maintenance";
 if (/repair|plumb|carpenter|paint|electrician/.test(d)) return "Repairs";
 if (/clean|housekeep/.test(d)) return "Cleaning";
 if (/\btax\b|tds|gst/.test(d)) return "Tax";
 if (/refund|cashback|reversal/.test(d)) return "Refund";
 if (/deposit|advance/.test(d)) return "Deposit";
 return "Other";
}

var DQ = String.fromCharCode(34);

function splitCsvLine(line: string, delim: string): string[] {
 var out: string[] = [];
 var cur = "";
 var inQ = false;
 for (var i = 0; i < line.length; i++) {
 var ch = line.charAt(i);
 if (inQ) {
 if (ch === DQ) { if (line.charAt(i + 1) === DQ) { cur = cur + DQ; i++; } else { inQ = false; } }
 else { cur = cur + ch; }
 } else {
 if (ch === DQ) { inQ = true; }
 else if (ch === delim) { out.push(cur); cur = ""; }
 else { cur = cur + ch; }
 }
 }
 out.push(cur);
 var res: string[] = [];
 for (var j = 0; j < out.length; j++) res.push(out[j].trim());
 return res;
}

function pickDelim(line: string): string {
 var c = (line.match(/,/g) || []).length;
 var t = (line.match(/\t/g) || []).length;
 var s = (line.match(/;/g) || []).length;
 if (t >= c && t >= s && t > 0) return "\t";
 if (s >= c && s > 0) return ";";
 return ",";
}

function toNumber(s: string): number {
 if (!s) return NaN;
 var neg = /^\s*-/.test(s) || /\(.*\)/.test(s) || /\bdr\b/i.test(s);
 var cleaned = s.replace(/,/g, "").replace(/[^0-9.]/g, "");
 if (cleaned === "" || cleaned === ".") return NaN;
 var n = parseFloat(cleaned);
 if (isNaN(n)) return NaN;
 return neg ? -n : n;
}

var MON3: { [k: string]: number } = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function normalizeDate(s: string): string {
 if (!s) return "";
 var v = ("" + s).trim();
 var m = v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
 if (m) return ymdStr(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
 m = v.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,})[-\/ ](\d{2,4})/);
 if (m) { var mo = MON3[m[2].slice(0, 3).toLowerCase()]; if (mo) { var yy = parseInt(m[3], 10); if (yy < 100) yy = 2000 + yy; return ymdStr(yy, mo, parseInt(m[1], 10)); } }
 m = v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
 if (m) { var d = parseInt(m[1], 10); var mm = parseInt(m[2], 10); var y = parseInt(m[3], 10); if (y < 100) y = 2000 + y; if (mm > 12 && d <= 12) { var tmp = d; d = mm; mm = tmp; } return ymdStr(y, mm, d); }
 return "";
}

function looksLikeDate(s: string): boolean { return normalizeDate(s) !== ""; }

function findIdx(header: string[], keys: string[]): number {
 for (var i = 0; i < header.length; i++) { for (var k = 0; k < keys.length; k++) { if (header[i].indexOf(keys[k]) >= 0) return i; } }
 return -1;
}

export function parseCsv(text: string): CsvRow[] {
 var clean = ("" + (text || "")).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
 var raw = clean.split("\n");
 var lines: string[] = [];
 for (var a = 0; a < raw.length; a++) { if (raw[a].trim().length > 0) lines.push(raw[a]); }
 if (lines.length === 0) return [];
 var delim = pickDelim(lines[0]);
 var header = splitCsvLine(lines[0], delim);
 var lowH: string[] = [];
 for (var h = 0; h < header.length; h++) lowH.push(header[h].toLowerCase());
 var hasHeader = false;
 for (var hh = 0; hh < lowH.length; hh++) { if (/date|amount|narration|description|particular|detail|credit|debit|withdraw|deposit|remark|balance|type/.test(lowH[hh])) { hasHeader = true; break; } }
 var dateIdx = findIdx(lowH, ["txn date", "transaction date", "value date", "date"]);
 var descIdx = findIdx(lowH, ["narration", "description", "particular", "details", "remark", "detail"]);
 var creditIdx = findIdx(lowH, ["deposit amt", "credit amount", "credit", "deposit"]);
 var debitIdx = findIdx(lowH, ["withdrawal amt", "debit amount", "debit", "withdrawal"]);
 var amountIdx = findIdx(lowH, ["transaction amount", "amount", "amt"]);
 var start = hasHeader ? 1 : 0;
 var rows: CsvRow[] = [];
 var idx = 0;
 for (var r = start; r < lines.length; r++) {
 var cells = splitCsvLine(lines[r], delim);
 if (cells.length === 0) continue;
 var rawDate = (dateIdx >= 0 && dateIdx < cells.length) ? cells[dateIdx] : "";
 if (!rawDate) { for (var c = 0; c < cells.length; c++) { if (looksLikeDate(cells[c])) { rawDate = cells[c]; break; } } }
 var date = normalizeDate(rawDate);
 var amount = NaN;
 var direction: CsvRow["direction"] = "unknown";
 if (creditIdx >= 0 && creditIdx < cells.length && toNumber(cells[creditIdx]) > 0) { amount = toNumber(cells[creditIdx]); direction = "credit"; }
 else if (debitIdx >= 0 && debitIdx < cells.length && toNumber(cells[debitIdx]) > 0) { amount = toNumber(cells[debitIdx]); direction = "debit"; }
 else if (amountIdx >= 0 && amountIdx < cells.length) { var av = toNumber(cells[amountIdx]); if (!isNaN(av)) { amount = Math.abs(av); direction = av < 0 ? "debit" : "credit"; } }
 if (isNaN(amount)) {
 var best = NaN;
 for (var cc = 0; cc < cells.length; cc++) { if (cc === dateIdx) continue; var nn = toNumber(cells[cc]); if (!isNaN(nn) && (isNaN(best) || Math.abs(nn) > Math.abs(best))) { best = nn; } }
 if (!isNaN(best)) { amount = Math.abs(best); direction = best < 0 ? "debit" : "unknown"; }
 }
 if (isNaN(amount)) continue;
 var description = (descIdx >= 0 && descIdx < cells.length) ? cells[descIdx] : "";
 if (!description) { var bestLen = -1; for (var dd = 0; dd < cells.length; dd++) { if (dd === dateIdx) continue; var cell = cells[dd]; if (/[a-zA-Z]/.test(cell) && cell.length > bestLen) { bestLen = cell.length; description = cell; } } }
 rows.push({ index: idx, date: date, rawDate: rawDate, description: description, amount: amount, direction: direction });
 idx++;
 }
 return rows;
}

export function rowToTransaction(row: CsvRow, opts?: { expected?: ExpectedRent | null; category?: Category; prop?: { id: string; name: string }; method?: PayMethod }): Transaction {
 var o = opts || {};
 var exp = o.expected || null;
 var cat: Category = o.category || (exp ? "Rent" : guessCategory(row.description, row.direction));
 var prop = o.prop || (exp ? { id: exp.propertyId, name: exp.propertyName } : { id: "", name: "Imported" });
 var method: PayMethod = o.method || "Bank Transfer";
 var date = (row.date && row.date.length === 10) ? row.date : isoToday();
 var desc = exp ? ("Rent received for " + exp.label + " from " + exp.tenantName) : (row.description || "Imported transaction");
 return {
 id: newId("tx"),
 propertyId: prop.id,
 propertyName: prop.name,
 category: cat,
 amount: row.amount,
 date: date,
 status: "Paid",
 paymentMethod: method,
 invoiceNumber: "INV-" + date.replace(/-/g, "") + "-" + (100 + Math.floor(Math.random() * 900)),
 description: desc
 };
}

export function reconcile(rows: CsvRow[], expected: ExpectedRent[], opts?: { tol?: number }): ReconcileResult {
 var tol = (opts && typeof opts.tol === "number") ? opts.tol : 1;
 var used: boolean[] = [];
 for (var i = 0; i < rows.length; i++) used.push(false);
 var rowFor: number[] = [];
 for (var e0 = 0; e0 < expected.length; e0++) rowFor.push(-1);
 for (var pass = 0; pass < 2; pass++) {
 for (var e = 0; e < expected.length; e++) {
 if (rowFor[e] >= 0) continue;
 var exp = expected[e];
 for (var r = 0; r < rows.length; r++) {
 if (used[r]) continue;
 var row = rows[r];
 if (row.direction === "debit") continue;
 if (Math.abs(row.amount - exp.amount) > tol) continue;
 if (pass === 0 && !(row.date && monthKeyOf(row.date) === exp.monthKey)) continue;
 used[r] = true; rowFor[e] = r; break;
 }
 }
 }
 var matched: ReconMatch[] = [];
 var unmatchedExpected: ExpectedRent[] = [];
 for (var g = 0; g < expected.length; g++) {
 if (rowFor[g] >= 0) matched.push({ expected: expected[g], row: rows[rowFor[g]] });
 else unmatchedExpected.push(expected[g]);
 }
 var unmatchedRows: CsvRow[] = [];
 for (var u = 0; u < rows.length; u++) if (!used[u]) unmatchedRows.push(rows[u]);
 return { matched: matched, unmatchedExpected: unmatchedExpected, rows: rows, unmatchedRows: unmatchedRows };
}
