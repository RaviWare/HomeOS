 import { Property, Lease, Transaction, Utility, MaintenanceTicket, Document } from "./types";
 import { DashboardStats, RentPoint, ExpenseSlice, TimelineEvent, ActivityItem } from "./seedData";
 
 export interface QueryResult {
  matched: boolean;
  title: string;
  lines: string[];
  columns?: string[];
  rows?: (string | number)[][];
  text: string;
  csv?: string;
 suggestion?: { label: string; tab: string };
 }
 export interface DashboardData {
  stats: DashboardStats; rentGrowth: RentPoint[]; expenses: ExpenseSlice[];
  timeline: TimelineEvent[]; activity: ActivityItem[]; suggestions: string[]; documents: Document[];
 }
 
 const NOW = new Date("2026-06-30").getTime();
 export const fmtINR = (n: number) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
 const yearOf = (d: string) => parseInt((d || "").slice(0, 4), 10);
 const sum = (arr: Transaction[]) => arr.reduce((s, t) => s + (t.amount || 0), 0);
 function readLS(key: string, fallback: any) {
  try { if (typeof localStorage === "undefined") return fallback; const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
 }
 
 export function deriveRentGrowth(transactions: Transaction[]): RentPoint[] {
  const by: Record<number, { s: number; c: number }> = {};
  transactions.forEach((t) => { if (t.category === "Rent" && t.status === "Paid") { const y = yearOf(t.date); if (!y) return; (by[y] = by[y] || { s: 0, c: 0 }); by[y].s += t.amount; by[y].c++; } });
  const pts = Object.keys(by).map((k) => ({ year: +k, rent: Math.round(by[+k].s / by[+k].c) })).sort((a, b) => a.year - b.year);
  return pts.length ? pts : [{ year: 2026, rent: 0 }];
 }
 export function deriveExpenses(transactions: Transaction[]): ExpenseSlice[] {
  const g: Record<string, number> = { Rent: 0, Electricity: 0, Water: 0, Internet: 0, Gas: 0, Maintenance: 0, Other: 0 };
  transactions.forEach((t) => {
  if (t.status !== "Paid") return;
  if (t.category === "Deposit" || t.category === "Refund") return;
  const key = (t.category === "Repairs" || t.category === "Cleaning" || t.category === "Maintenance") ? "Maintenance" : t.category === "Tax" ? "Other" : (g[t.category] !== undefined ? t.category : "Other");
  g[key] += t.amount;
  });
  const palette = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#9CA3AF"];
  const total = Object.values(g).reduce((s, x) => s + x, 0) || 1;
  return Object.keys(g).map((k, i) => ({ category: k, amount: g[k], pct: Math.round((g[k] / total) * 100), color: palette[i % palette.length] })).filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
 }
 export function deriveStats(properties: Property[], leases: Lease[], transactions: Transaction[], utilities: Utility[], documents: Document[], tickets: MaintenanceTicket[]): DashboardStats {
  const rentTx = transactions.filter((t) => t.category === "Rent" && t.status === "Paid");
  const totalRentPaid = sum(rentTx);
  const spans: Record<string, { min: string; max: string }> = {};
  leases.forEach((l) => { const sp = spans[l.propertyId] = spans[l.propertyId] || { min: l.startDate, max: l.endDate }; if (l.startDate < sp.min) sp.min = l.startDate; if (l.endDate > sp.max) sp.max = l.endDate; });
  let maxMonths = 0;
  Object.values(spans).forEach((sp) => { const m = (yearOf(sp.max) - yearOf(sp.min)) * 12 + (parseInt(sp.max.slice(5, 7), 10) - parseInt(sp.min.slice(5, 7), 10)); if (m > maxMonths) maxMonths = m; });
  const startYears = leases.map((l) => yearOf(l.startDate)).filter(Boolean);
  const minYear = startYears.length ? Math.min(...startYears) : 2026;
  const last12 = transactions.filter((t) => t.status === "Paid" && t.date >= "2025-07-01" && t.category !== "Deposit" && t.category !== "Refund");
  const cities = Array.from(new Set(properties.map((p) => p.city)));
  const owners = Array.from(new Set(properties.map((p) => p.ownerName)));
  return {
  propertiesLivedIn: properties.length,
  yearsHistory: Math.max(0, 2026 - minYear),
  totalRentPaid,
  securityDeposits: sum(transactions.filter((t) => t.category === "Deposit")),
  documentsStored: documents.length,
  leaseAgreements: leases.length,
  utilityBills: utilities.reduce((s, u) => s + (u.history ? u.history.length : 0), 0),
  maintenanceRequests: tickets.length,
  currentActiveLease: leases.filter((l) => l.status === "Active").length,
  completedLeases: leases.filter((l) => l.status !== "Active").length,
  citiesLived: cities.length,
  longestStay: Math.floor(maxMonths / 12) + " Years " + (maxMonths % 12) + " Months",
  averageMonthlyRent: rentTx.length ? Math.round(totalRentPaid / rentTx.length) : 0,
  monthlyExpenses: Math.round(sum(last12) / 12),
  upcomingRenewals: leases.filter((l) => l.status === "Active").length,
  pendingPayments: sum(transactions.filter((t) => t.status !== "Paid")),
  digitalSignatures: leases.filter((l) => l.signatures && l.signatures.tenantSigned && l.signatures.landlordSigned).length,
  sharedProperties: Math.max(0, Math.round(properties.length * 0.28)),
  ownersConnected: owners.length,
  timelineEvents: transactions.length + documents.length + tickets.length
  };
 }
 
 let _uid = 0;
 const uid = (p: string) => p + "-" + (++_uid).toString(36);
 export function deriveTimeline(leases: Lease[], transactions: Transaction[], tickets: MaintenanceTicket[]): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  leases.forEach((l) => ev.push({ id: uid("tl"), date: l.startDate, kind: "lease", title: "Signed lease for " + l.propertyName, propertyName: l.propertyName, icon: "file" }));
  transactions.filter((t) => t.category === "Deposit").forEach((t) => ev.push({ id: uid("tl"), date: t.date, kind: "deposit", title: "Paid security deposit", propertyName: t.propertyName, icon: "wallet" }));
  transactions.filter((t) => t.category === "Refund").forEach((t) => ev.push({ id: uid("tl"), date: t.date, kind: "refund", title: "Security deposit returned", propertyName: t.propertyName, icon: "wallet" }));
  tickets.filter((t) => t.status === "Resolved").slice(0, 24).forEach((t) => ev.push({ id: uid("tl"), date: t.createdAt, kind: "maintenance", title: "Resolved " + t.title, propertyName: t.propertyName, icon: "wrench" }));
  return ev.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
 }
 export function deriveActivity(transactions: Transaction[], documents: Document[], tickets: MaintenanceTicket[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  documents.slice().sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)).slice(0, 5).forEach((d) => items.push({ id: uid("act"), date: d.uploadedAt, action: "Uploaded document", detail: d.name, icon: d.fileType === "image" ? "image" : "file" }));
  transactions.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5).forEach((t) => items.push({ id: uid("act"), date: t.date, action: t.category === "Rent" ? "Paid monthly rent" : "Paid " + t.category, detail: t.propertyName, icon: "wallet" }));
  return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 9);
 }
 export function deriveSuggestions(properties: Property[], leases: Lease[], transactions: Transaction[]): string[] {
  const out: string[] = [];
  const active = leases.find((l) => l.status === "Active");
  if (active) { const days = Math.round((new Date(active.endDate).getTime() - NOW) / 86400000); out.push("Your lease for " + active.propertyName + " expires in " + days + " days. Plan the renewal early."); }
  const top = properties.slice().sort((a, b) => b.rating - a.rating)[0];
  if (top) out.push(top.name + " earned your highest satisfaction rating at " + top.rating + " stars.");
  const spendY = (yr: number) => sum(transactions.filter((t) => t.status === "Paid" && yearOf(t.date) === yr && t.category !== "Deposit" && t.category !== "Refund"));
  const cur = spendY(2026), prev = spendY(2025);
  if (prev > 0) { const d = Math.round(((cur - prev) / prev) * 100); out.push("Your tracked spending this year is " + (d >= 0 ? "up " : "down ") + Math.abs(d) + "% versus last year."); }
  const pend = sum(transactions.filter((t) => t.status !== "Paid"));
  if (pend > 0) out.push("You have " + fmtINR(pend) + " in pending payments awaiting settlement.");
  out.push("Ask the assistant about taxes, savings, rent appreciation, or your experience in any year.");
  return out.slice(0, 6);
 }
 export function getDashboardData(properties: Property[], leases: Lease[], transactions: Transaction[], tickets: MaintenanceTicket[]): DashboardData {
  const documents: Document[] = readLS("rv_documents", []);
  const utilities: Utility[] = readLS("rv_utilities", []);
  const stats = deriveStats(properties, leases, transactions, utilities, documents, tickets);
  const rentGrowth = deriveRentGrowth(transactions);
  const expenses = deriveExpenses(transactions);
  let timeline: TimelineEvent[] = readLS("rv_timeline", []);
  if (!timeline || !timeline.length) timeline = deriveTimeline(leases, transactions, tickets);
  let activity: ActivityItem[] = readLS("rv_activity", []);
  if (!activity || !activity.length) activity = deriveActivity(transactions, documents, tickets);
  let suggestions: string[] = readLS("rv_suggestions", []);
  if (!suggestions || !suggestions.length) suggestions = deriveSuggestions(properties, leases, transactions);
  return { stats, rentGrowth, expenses, timeline, activity, suggestions, documents };
 }
 
 
 function extractYears(q: string): number[] {
  const m = q.match(/(19|20)\d{2}/g) || [];
  return Array.from(new Set(m.map(Number))).filter((y) => y >= 1990 && y <= 2026).sort((a, b) => a - b);
 }
 function matchProperty(q: string, properties: Property[]): Property | null {
  const lq = q.toLowerCase();
  for (const p of properties) {
  const tokens = p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && w !== "unit");
  if (tokens.some((w) => lq.includes(w))) return p;
  }
  return null;
 }
 function buildResult(title: string, lines: string[], columns?: string[], rows?: (string | number)[][], sugg?: { label: string; tab: string }): QueryResult {
  let text = title + "\n\n" + lines.join("\n");
  if (columns && rows && rows.length) {
  text += "\n\n" + columns.join(" | ") + "\n" + rows.map((r) => r.join(" | ")).join("\n");
  }
  text += "\n\nGenerated by HomeOS MVP demo on 2026-06-30.";
  const csv = (columns && rows && rows.length) ? [columns.join(",")].concat(rows.map((r) => r.map((c) => (String(c).indexOf(",") >= 0 ? String(c).replace(/,/g, " ") : String(c))).join(","))).join("\n") : undefined;
  return { matched: true, title, lines, columns, rows, text, csv, suggestion: sugg };
 }
 const spendIn = (txs: Transaction[], yr: number | null, cats?: string[]) => txs.filter((t) => t.status === "Paid" && (yr === null || yearOf(t.date) === yr) && (!cats || cats.indexOf(t.category) >= 0));
 
 export function answerQuery(question: string, ctx: any): QueryResult {
  const q = (question || "").toLowerCase();
  const properties: Property[] = (ctx && ctx.properties) || [];
  const leases: Lease[] = (ctx && ctx.leases) || [];
  const transactions: Transaction[] = (ctx && ctx.transactions) || [];
  const tickets: MaintenanceTicket[] = (ctx && ctx.tickets) || [];
  const years = extractYears(q);
 if (/last year/.test(q)) years.push(2025);
 if (/this year|current year/.test(q)) years.push(2026);
 years.sort((a, b) => a - b);
  const none: QueryResult = { matched: false, title: "", lines: [], text: "" };
  if (!transactions.length && !properties.length) return none;
 const _enh = enhancedIntents(q, years, properties, leases, transactions, tickets, ctx);
 if (_enh) return _enh;
 const _deep = deepIntents(q, years, properties, leases, transactions, tickets, ctx);
 if (_deep) return _deep;
 
  if (/experience|rating|liked|enjoy|satisfaction|best home|favou?rite/.test(q)) {
  const p = matchProperty(q, properties);
  if (p) {
  const paidHere = Math.round(spendIn(transactions, null, ["Rent"]).filter((t) => t.propertyId === p.id).reduce((s, t) => s + t.amount, 0));
  const mc = tickets.filter((t) => t.propertyId === p.id).length;
  const sp = leases.filter((l) => l.propertyId === p.id);
  const span = sp.length ? (sp.map((l) => l.startDate).sort()[0] + " to " + sp.map((l) => l.endDate).sort().slice(-1)[0]) : "unknown";
  return buildResult("Your experience at " + p.name, [
  "Rating: " + p.rating + " out of 5 stars in " + p.city + ".",
  "Tenancy span: " + span + ".",
  "Total rent paid here: " + fmtINR(paidHere) + " across the stay.",
  "Maintenance requests raised: " + mc + ".",
  "Amenities: " + (p.amenities || []).slice(0, 5).join(", ") + ".",
  "Notes: " + (p.notes || "No notes recorded.")
  ]);
  }
  const yr = years.length ? years[years.length - 1] : null;
  const lived = properties.filter((pp) => leases.some((l) => l.propertyId === pp.id && (!yr || (yearOf(l.startDate) <= yr && yearOf(l.endDate) >= yr))));
  const list = (lived.length ? lived : properties).slice().sort((a, b) => b.rating - a.rating);
  const rows = list.slice(0, 8).map((pp) => [pp.name, pp.city, pp.rating + "/5"]);
  return buildResult("Your living experience" + (yr ? " in " + yr : " overall"), [
  (yr ? "You were living across " + lived.length + " home(s) during " + yr + "." : "You have lived in " + properties.length + " homes overall."),
  "Top rated: " + (list[0] ? list[0].name + " at " + list[0].rating + " stars." : "n/a"),
  "Average rating across homes: " + (properties.length ? (properties.reduce((s, x) => s + x.rating, 0) / properties.length).toFixed(1) : "0") + " out of 5."
  ], ["Property", "City", "Rating"], rows);
  }
 
  if (/appreciat/.test(q) || (/rent/.test(q) && /(grow|growth|increase|rise|risen|trend|over time|over the|appreciation)/.test(q))) {
  const g = deriveRentGrowth(transactions);
  let pts = g;
  if (years.length >= 2) pts = g.filter((p) => p.year >= years[0] && p.year <= years[years.length - 1]);
  else if (years.length === 1) pts = g.filter((p) => p.year >= years[0]);
  if (pts.length < 2) pts = g;
  const first = pts[0], last = pts[pts.length - 1];
  const span = Math.max(1, last.year - first.year);
  const pct = first.rent ? Math.round(((last.rent - first.rent) / first.rent) * 100) : 0;
  const cagr = first.rent ? ((Math.pow(last.rent / first.rent, 1 / span) - 1) * 100).toFixed(1) : "0";
  return buildResult("Rent appreciation " + first.year + " to " + last.year, [
  "Average monthly rent moved from " + fmtINR(first.rent) + " in " + first.year + " to " + fmtINR(last.rent) + " in " + last.year + ".",
  "That is a " + pct + "% increase over " + span + " years, about " + cagr + "% per year.",
  "Figures are the average monthly rent you paid each year."
  ], ["Year", "Avg Monthly Rent"], pts.map((p) => [p.year, fmtINR(p.rent)]));
  }
 
  if (/saving|savings|hra/.test(q)) {
  const yr = years.length ? years[years.length - 1] : null;
  const rentPaid = Math.round(spendIn(transactions, yr, ["Rent"]).reduce((s, t) => s + t.amount, 0));
  const saving = Math.round(rentPaid * 0.3);
  const refunds = Math.round(spendIn(transactions, yr, ["Refund"]).reduce((s, t) => s + t.amount, 0));
  const label = yr ? "in " + yr : "across all years";
  return buildResult("Indicative rental savings " + label, [
  "Rent paid " + label + ": " + fmtINR(rentPaid) + ".",
  "Indicative HRA / tax saving at a 30% slab: about " + fmtINR(saving) + ".",
  (refunds > 0 ? "Security deposits refunded " + label + ": " + fmtINR(refunds) + "." : "No deposit refunds recorded " + label + "."),
  "This is an indicative estimate only. Confirm eligibility with a tax advisor."
  ]);
  }
 
 
  if (/tax|taxes|tds/.test(q)) {
  const taxTx = transactions.filter((t) => t.category === "Tax" && t.status === "Paid");
  if (years.length) {
  const yr = years[years.length - 1];
  const inY = taxTx.filter((t) => yearOf(t.date) === yr);
  const total = Math.round(inY.reduce((s, t) => s + t.amount, 0));
  if (total > 0) return buildResult("Taxes paid in " + yr, ["You paid " + fmtINR(total) + " in taxes and TDS during " + yr + " across " + inY.length + " entries."], ["Date", "Property", "Amount"], inY.map((t) => [t.date, t.propertyName, fmtINR(t.amount)]));
  const ywt = Array.from(new Set(taxTx.map((t) => yearOf(t.date)))).sort();
  return buildResult("Taxes paid in " + yr, ["No tax or TDS payments are recorded for " + yr + ".", (ywt.length ? "Years with recorded tax payments: " + ywt.join(", ") + "." : "No tax payments are recorded in any year.")], undefined, undefined, { label: "Record it in Ledger & Payments", tab: "payments" });
  }
  const by: Record<number, number> = {};
  taxTx.forEach((t) => { const y = yearOf(t.date); by[y] = (by[y] || 0) + t.amount; });
  const rows = Object.keys(by).sort().map((k) => [+k, fmtINR(Math.round(by[+k]))]);
  return buildResult("Taxes paid over time", ["Total tax and TDS recorded: " + fmtINR(Math.round(taxTx.reduce((s, t) => s + t.amount, 0))) + " across " + taxTx.length + " payments."], ["Year", "Amount"], rows);
  }
 
  if (/utilit|electric|water|internet|gas|broadband|bill/.test(q)) {
  const cats = ["Electricity", "Water", "Gas", "Internet"];
  const yr = years.length ? years[years.length - 1] : null;
  const inSel = spendIn(transactions, yr, cats);
  const by: Record<string, number> = {};
  inSel.forEach((t) => { by[t.category] = (by[t.category] || 0) + t.amount; });
  const label = yr ? "in " + yr : "across all years";
  return buildResult("Utility spending " + label, ["Total utilities " + label + ": " + fmtINR(Math.round(inSel.reduce((s, t) => s + t.amount, 0))) + " across " + inSel.length + " bills."], ["Utility", "Amount"], cats.filter((c) => by[c]).map((c) => [c, fmtINR(Math.round(by[c]))]));
  }
 
  if (/deposit/.test(q)) {
  const yr = years.length ? years[years.length - 1] : null;
  const dep = Math.round(spendIn(transactions, yr, ["Deposit"]).reduce((s, t) => s + t.amount, 0));
  const ref = Math.round(spendIn(transactions, yr, ["Refund"]).reduce((s, t) => s + t.amount, 0));
  const label = yr ? "in " + yr : "across all years";
  return buildResult("Security deposits " + label, ["Deposits paid " + label + ": " + fmtINR(dep) + ".", "Deposits refunded " + label + ": " + fmtINR(ref) + "."]);
  }
 
  if (/rent/.test(q)) {
  const yr = years.length ? years[years.length - 1] : null;
  const rt = spendIn(transactions, yr, ["Rent"]);
  const total = Math.round(rt.reduce((s, t) => s + t.amount, 0));
  const label = yr ? "in " + yr : "across all years";
  return buildResult("Rent paid " + label, ["You paid " + fmtINR(total) + " in rent " + label + " across " + rt.length + " monthly payments.", (rt.length ? "Average monthly rent " + label + ": " + fmtINR(Math.round(total / rt.length)) + "." : "No rent payments found.")]);
  }
 
  if (/spend|spent|expense|expenses|cost|outflow|how much|total|paid/.test(q)) {
  const yr = years.length ? years[years.length - 1] : null;
  const paid = spendIn(transactions, yr).filter((t) => t.category !== "Deposit" && t.category !== "Refund");
  const by: Record<string, number> = {};
  paid.forEach((t) => { const k = (t.category === "Repairs" || t.category === "Cleaning" || t.category === "Maintenance") ? "Maintenance" : t.category; by[k] = (by[k] || 0) + t.amount; });
  const label = yr ? "in " + yr : "across all years";
  return buildResult("Total spending " + label, ["You spent " + fmtINR(Math.round(paid.reduce((s, t) => s + t.amount, 0))) + " " + label + " across " + paid.length + " transactions."], ["Category", "Amount"], Object.keys(by).sort((a, b) => by[b] - by[a]).map((k) => [k, fmtINR(Math.round(by[k]))]));
  }
 
  const sr = searchWorkspace(q, ctx); return sr || workspaceOverview(ctx);
 }
 
 
 function searchWorkspace(question: string, ctx: any): QueryResult | null {
  const lq = (question || "").toLowerCase();
  const properties: Property[] = (ctx && ctx.properties) || [];
  const leases: Lease[] = (ctx && ctx.leases) || [];
  const transactions: Transaction[] = (ctx && ctx.transactions) || [];
  const tickets: MaintenanceTicket[] = (ctx && ctx.tickets) || [];
  const documents: Document[] = (ctx && ctx.documents) || readLS("rv_documents", []);
  const years = extractYears(lq);
  const yr = years.length ? years[years.length - 1] : null;
  const cityList = Array.from(new Set(properties.map((p) => p.city)));
  const city = cityList.find((c) => lq.indexOf(c.toLowerCase()) >= 0) || null;
  const prop = matchProperty(lq, properties);
  const pendingOnly = /pending|overdue|unpaid|due|outstanding/.test(lq);
  if (/document|receipt|invoice|certificate|aadhaar|pan card|passport|insurance|warranty|police|inspection|checklist|photo|paperwork/.test(lq)) {
  let docs = documents.slice();
  const kw = ["aadhaar", "passport", "insurance", "warranty", "police", "inspection", "lease", "electricity", "water", "internet", "deposit", "tenant", "owner", "rent"].find((k) => lq.indexOf(k) >= 0);
  if (kw) docs = docs.filter((d) => (d.name + " " + d.category).toLowerCase().indexOf(kw) >= 0);
  if (yr) docs = docs.filter((d) => yearOf(d.uploadedAt) === yr);
  docs.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  return buildResult("Documents" + (kw ? " matching " + kw : "") + (yr ? " from " + yr : ""), ["Found " + docs.length + " matching document(s) in your vault."], ["Name", "Category", "Date", "Size"], docs.slice(0, 15).map((d) => [d.name, d.category, d.uploadedAt, d.size]));
  }
  if (/maintenance|repair|ticket|complaint|plumb|leak|air con|painting|pest|electrical|carpenter|lift|broken|vendor/.test(lq)) {
  let ts = tickets.slice();
  if (prop) ts = ts.filter((t) => t.propertyId === prop.id);
  if (yr) ts = ts.filter((t) => yearOf(t.createdAt) === yr);
  if (pendingOnly) ts = ts.filter((t) => t.status !== "Resolved");
  ts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return buildResult("Maintenance" + (prop ? " at " + prop.name : "") + (yr ? " in " + yr : ""), ["Found " + ts.length + " maintenance ticket(s)" + (pendingOnly ? " still open." : "."), "Total cost recorded: " + fmtINR(ts.reduce((s, t) => s + (t.actualCost || t.estimatedCost || 0), 0)) + "."], ["Issue", "Property", "Status", "Cost", "Date"], ts.slice(0, 15).map((t) => [t.title, t.propertyName, t.status, fmtINR(t.actualCost || t.estimatedCost || 0), t.createdAt]));
  }
  if (/lease|agreement|clause|renewal|notary|stamp duty|tenancy|contract/.test(lq)) {
  let ls = leases.slice();
  if (prop) ls = ls.filter((l) => l.propertyId === prop.id);
  if (/active|current/.test(lq)) ls = ls.filter((l) => l.status === "Active");
  if (yr) ls = ls.filter((l) => yearOf(l.startDate) <= yr && yearOf(l.endDate) >= yr);
  ls.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return buildResult("Lease agreements" + (prop ? " for " + prop.name : ""), ["Found " + ls.length + " lease agreement(s)."], ["Property", "Landlord", "Start", "End", "Rent", "Status"], ls.slice(0, 15).map((l) => [l.propertyName, l.landlordName, l.startDate, l.endDate, fmtINR(l.monthlyRent), l.status]));
  }
  if (city || /propert|home|house|flat|apartment|villa|lived|stayed|address|amenit|bedroom|rated|best home|favou/.test(lq)) {
  let ps = properties.slice();
  if (city) ps = ps.filter((p) => p.city === city);
  if (/best|top|highest|favou/.test(lq)) ps.sort((a, b) => b.rating - a.rating);
  return buildResult("Properties" + (city ? " in " + city : ""), ["Found " + ps.length + " propert" + (ps.length === 1 ? "y" : "ies") + (city ? " in " + city : " in your history") + "."], ["Property", "City", "Rent", "Rating", "Type"], ps.slice(0, 15).map((p) => [p.name, p.city, fmtINR(p.rentAmount), p.rating + "/5", p.type]));
  }
  const catWords: any[] = [["electricity", "Electricity"], ["water", "Water"], ["internet", "Internet"], ["gas", "Gas"], ["deposit", "Deposit"], ["refund", "Refund"], ["rent", "Rent"]];
  const catHit = catWords.find((cw) => lq.indexOf(cw[0]) >= 0);
  if (pendingOnly || /payment|transaction|ledger|spent|receipt/.test(lq) || catHit) {
  let tx = transactions.slice();
  if (catHit) tx = tx.filter((t) => t.category === catHit[1]);
  if (yr) tx = tx.filter((t) => yearOf(t.date) === yr);
  if (prop) tx = tx.filter((t) => t.propertyId === prop.id);
  if (pendingOnly) tx = tx.filter((t) => t.status !== "Paid");
  tx.sort((a, b) => (a.date < b.date ? 1 : -1));
  return buildResult("Payments" + (catHit ? " (" + catHit[1] + ")" : "") + (pendingOnly ? " pending" : "") + (yr ? " in " + yr : ""), ["Found " + tx.length + " matching transaction(s) totalling " + fmtINR(tx.reduce((s, t) => s + t.amount, 0)) + "."], ["Date", "Property", "Category", "Amount", "Status"], tx.slice(0, 15).map((t) => [t.date, t.propertyName, t.category, fmtINR(t.amount), t.status]));
  }
  const toks = lq.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  if (toks.length) {
  const hitTx = transactions.filter((t) => toks.some((w) => (t.description + " " + t.propertyName + " " + t.category).toLowerCase().indexOf(w) >= 0)).slice(0, 12);
  const hitProp = properties.filter((p) => toks.some((w) => (p.name + " " + p.city + " " + p.ownerName).toLowerCase().indexOf(w) >= 0)).slice(0, 6);
  if (hitTx.length || hitProp.length) {
  const lines: string[] = [];
  if (hitProp.length) lines.push("Matching properties: " + hitProp.map((p) => p.name).join("; ") + ".");
  if (hitTx.length) lines.push("Matching transactions: " + hitTx.length + " found.");
  return buildResult("Search results", lines, hitTx.length ? ["Date", "Property", "Category", "Amount", "Status"] : undefined, hitTx.length ? hitTx.map((t) => [t.date, t.propertyName, t.category, fmtINR(t.amount), t.status]) : undefined);
  }
  }
  return null;
 }
 function workspaceOverview(ctx: any): QueryResult {
  const properties: Property[] = (ctx && ctx.properties) || [];
  const leases: Lease[] = (ctx && ctx.leases) || [];
  const transactions: Transaction[] = (ctx && ctx.transactions) || [];
  const tickets: MaintenanceTicket[] = (ctx && ctx.tickets) || [];
  const documents: Document[] = (ctx && ctx.documents) || readLS("rv_documents", []);
  return buildResult("Workspace overview", ["I could not find an exact match, so here is a snapshot of your workspace.", "Try a year (2008), a city, a property name, or words like taxes, savings, rent, utilities, documents, payments, or maintenance."], ["Records", "Count"], [["Properties", properties.length], ["Leases", leases.length], ["Transactions", transactions.length], ["Documents", documents.length], ["Maintenance tickets", tickets.length]]);
 }
 
 
 function enhancedIntents(q: string, years: number[], properties: Property[], leases: Lease[], transactions: Transaction[], tickets: MaintenanceTicket[], ctx: any): QueryResult | null {
  const w0 = q.trim().split(/[^a-z]+/)[0];
  const greet = ["hi", "hii", "hey", "hello", "yo", "help", "start", "hola", "namaste", "good"].indexOf(w0) >= 0 || /what can you|what do you do|who are you|how do you work|capabilit|what are you/.test(q);
  const dataish = /(rent|tax|saving|hra|deposit|utilit|electric|water|gas|internet|document|propert|home|house|flat|lease|agreement|maintenance|repair|spend|spent|expense|payment|landlord|owner|city|highest|lowest|cheapest|how many|appreciat|experience|[0-9])/.test(q);
  if (greet && !dataish) {
  return buildResult("HomeOS Assistant", ["I answer instantly from your own records, right here on your device. No internet, no waiting.", "Try things like:", "- Tell me about 2015", "- Highest electricity bill", "- How many homes have I lived in", "- Taxes I paid last year", "- Rent appreciation from 2001 to 2026", "- Show my documents from 2019", "Every answer can be downloaded as text or CSV, or shared to Telegram."]);
  }
  if (years.length && /(summary|summarise|summarize|overview|recap|tell me about|how was|how were|what about|breakdown|review)/.test(q) && !/experience|rating|liked|enjoy|satisfaction/.test(q)) {
  const yr = years[years.length - 1];
  const paidIn = (cats?: string[]) => Math.round(transactions.filter((t) => t.status === "Paid" && yearOf(t.date) === yr && (!cats || cats.indexOf(t.category) >= 0)).reduce((s, t) => s + t.amount, 0));
  const rentY = paidIn(["Rent"]); const utilY = paidIn(["Electricity", "Water", "Gas", "Internet"]); const maintY = paidIn(["Repairs", "Maintenance", "Cleaning"]); const depY = paidIn(["Deposit"]);
  const totalY = Math.round(transactions.filter((t) => t.status === "Paid" && yearOf(t.date) === yr && t.category !== "Deposit" && t.category !== "Refund").reduce((s, t) => s + t.amount, 0));
  const homesY = properties.filter((p) => leases.some((l) => l.propertyId === p.id && yearOf(l.startDate) <= yr && yearOf(l.endDate) >= yr));
  const ticketsY = tickets.filter((t) => yearOf(t.createdAt) === yr).length;
  return buildResult("Your " + yr + " in review", ["Homes: " + (homesY.map((p) => p.name).join(", ") || "none on record"), "Rent paid: " + fmtINR(rentY), "Utilities: " + fmtINR(utilY), "Maintenance: " + fmtINR(maintY) + " across " + ticketsY + " tickets", "Total spend excluding deposits: " + fmtINR(totalY)], ["Category", "Amount"], [["Rent", fmtINR(rentY)], ["Utilities", fmtINR(utilY)], ["Maintenance", fmtINR(maintY)], ["Deposits", fmtINR(depY)]]);
  }
  if (/how many|number of|count of/.test(q)) {
  const cityCount = Array.from(new Set(properties.map((p) => p.city))).length;
  if (/propert|home|house|flat/.test(q)) return buildResult("Homes", ["You have lived in " + properties.length + " homes across " + cityCount + " cities."]);
  if (/lease|agreement/.test(q)) return buildResult("Leases", ["You have " + leases.length + " lease agreements on record."]);
  if (/document|file|paper/.test(q)) { const d = ((ctx && ctx.documents) || readLS("rv_documents", [])).length; return buildResult("Documents", ["You have " + d + " documents stored in your vault."]); }
  if (/maintenance|repair|ticket/.test(q)) return buildResult("Maintenance", ["You have raised " + tickets.length + " maintenance tickets."]);
  if (/payment|transaction|receipt/.test(q)) return buildResult("Transactions", ["You have " + transactions.length + " transactions on record."]);
  if (/city|cities/.test(q)) return buildResult("Cities", ["You have lived in " + cityCount + " cities."]);
  return buildResult("Your records at a glance", ["Homes: " + properties.length, "Lease agreements: " + leases.length, "Transactions: " + transactions.length, "Maintenance tickets: " + tickets.length, "Cities: " + cityCount]);
  }
  if (/highest|most expensive|biggest|largest|maximum|lowest|cheapest|smallest|minimum/.test(q)) {
  const wantMax = /highest|most|biggest|largest|maximum|expensive|priciest/.test(q);
  const cmap: any[] = [["electricity", "Electricity"], ["water", "Water"], ["internet", "Internet"], ["gas", "Gas"], ["rent", "Rent"], ["deposit", "Deposit"], ["maintenance", "Repairs"], ["repair", "Repairs"]];
  const ch = cmap.find((c) => q.indexOf(c[0]) >= 0);
  let pool = transactions.filter((t) => t.status === "Paid");
  if (ch) pool = pool.filter((t) => ch[1] === "Repairs" ? (t.category === "Repairs" || t.category === "Maintenance" || t.category === "Cleaning") : t.category === ch[1]);
  if (years.length) pool = pool.filter((t) => yearOf(t.date) === years[years.length - 1]);
  if (!pool.length) return buildResult("No match", ["I could not find any matching payments to compare."]);
  pool.sort((a, b) => (wantMax ? b.amount - a.amount : a.amount - b.amount));
  const top = pool[0];
  const label = (wantMax ? "Highest " : "Lowest ") + (ch ? ch[1] + " " : "") + "payment" + (years.length ? " in " + years[years.length - 1] : "");
  return buildResult(label, ["The " + (wantMax ? "highest" : "lowest") + " was " + fmtINR(top.amount) + " on " + top.date + " for " + top.propertyName + " (" + top.category + ")."], ["Date", "Property", "Category", "Amount"], pool.slice(0, 8).map((t) => [t.date, t.propertyName, t.category, fmtINR(t.amount)]));
  }
  return null;
 }
 
 
 function tabLabel(tab: string): string {
  const m: any = { payments: "Ledger & Payments", properties: "Property Hub", leases: "Lease & Clauses", utilities: "Utilities Tracker", maintenance: "Maintenance Ops", documents: "Document Vault" };
  return m[tab] || "the dashboard";
 }
 function dataGaps(properties: Property[], leases: Lease[], transactions: Transaction[], utilities: Utility[], tickets: MaintenanceTicket[]): { lines: string[]; tab: string } {
  const lines: string[] = [];
  let tab = "dashboard";
  const pend = transactions.filter((t) => t.status !== "Paid");
  if (pend.length) { lines.push(pend.length + " payments are pending or overdue (" + fmtINR(sum(pend)) + "). Settle them in Ledger & Payments."); tab = "payments"; }
  const noContact = properties.filter((p) => !p.ownerContact || p.ownerContact === "N/A" || p.ownerContact.length < 4);
  if (noContact.length) { lines.push(noContact.length + " home(s) are missing the owner contact. Add it in Property Hub."); if (tab === "dashboard") tab = "properties"; }
  const unsigned = leases.filter((l) => !(l.signatures && l.signatures.tenantSigned && l.signatures.landlordSigned));
  if (unsigned.length) { lines.push(unsigned.length + " lease(s) are not fully signed. Review them in Lease & Clauses."); if (tab === "dashboard") tab = "leases"; }
  const unpaidU = utilities.filter((u) => u.status === "Unpaid");
  if (unpaidU.length) { lines.push(unpaidU.length + " utility account(s) have an unpaid bill. Check Utilities Tracker."); if (tab === "dashboard") tab = "utilities"; }
  const openT = tickets.filter((t) => t.status !== "Resolved");
  if (openT.length) { lines.push(openT.length + " maintenance ticket(s) are still open."); if (tab === "dashboard") tab = "maintenance"; }
  if (!lines.length) lines.push("Your records look complete. Nothing needs updating right now.");
  return { lines, tab };
 }
 function deepIntents(q: string, years: number[], properties: Property[], leases: Lease[], transactions: Transaction[], tickets: MaintenanceTicket[], ctx: any): QueryResult | null {
  if (/missing|incomplete|complete|validate|verify|to.?do|gaps?|clean ?up|what.*(add|update|fix)|needs? updating|outstanding/.test(q)) {
  const utilities: Utility[] = (ctx && ctx.utilities) || readLS("rv_utilities", []);
  const g = dataGaps(properties, leases, transactions, utilities, tickets);
  return buildResult("Data check", g.lines, undefined, undefined, g.tab !== "dashboard" ? { label: "Open " + tabLabel(g.tab), tab: g.tab } : undefined);
  }
  if (/compare|versus| vs |difference between/.test(q) && years.length >= 2) {
  const a = years[0], b = years[years.length - 1];
  const spendY = (yr: number) => Math.round(transactions.filter((t) => t.status === "Paid" && yearOf(t.date) === yr && t.category !== "Deposit" && t.category !== "Refund").reduce((s, t) => s + t.amount, 0));
  const rentY = (yr: number) => Math.round(transactions.filter((t) => t.status === "Paid" && yearOf(t.date) === yr && t.category === "Rent").reduce((s, t) => s + t.amount, 0));
  return buildResult("Comparing " + a + " and " + b, ["Total spend: " + fmtINR(spendY(a)) + " in " + a + " vs " + fmtINR(spendY(b)) + " in " + b + ".", "Rent: " + fmtINR(rentY(a)) + " vs " + fmtINR(rentY(b)) + "."], ["Metric", "" + a, "" + b], [["Total spend", fmtINR(spendY(a)), fmtINR(spendY(b))], ["Rent", fmtINR(rentY(a)), fmtINR(rentY(b))]]);
  }
  if (/average|avg|mean/.test(q)) {
  const cmap: any[] = [["electricity", "Electricity"], ["water", "Water"], ["internet", "Internet"], ["gas", "Gas"], ["rent", "Rent"]];
  const ch = cmap.find((c) => q.indexOf(c[0]) >= 0);
  const cat = ch ? ch[1] : "Rent";
  const pool = transactions.filter((t) => t.status === "Paid" && t.category === cat);
  if (!pool.length) return buildResult("Average " + cat, ["No " + cat + " payments are on record yet."]);
  const avg = Math.round(pool.reduce((s, t) => s + t.amount, 0) / pool.length);
  return buildResult("Average " + cat + " payment", ["Across " + pool.length + " " + cat + " payments, your average is " + fmtINR(avg) + "."]);
  }
  if (/landlord|owner|who owns|contact number|phone number|whom.*rent/.test(q)) {
  const p = matchProperty(q, properties);
  if (p) {
  const missing = !p.ownerContact || p.ownerContact === "N/A" || p.ownerContact.length < 4;
  return buildResult("Landlord for " + p.name, ["Owner: " + p.ownerName + ".", missing ? "Contact: not on record." : "Contact: " + p.ownerContact + "."], undefined, undefined, missing ? { label: "Add the contact in Property Hub", tab: "properties" } : undefined);
  }
  return buildResult("Your landlords and owners", ["Owners across your " + properties.length + " homes:"], ["Property", "Owner", "Contact"], properties.slice(0, 15).map((pp) => [pp.name, pp.ownerName, pp.ownerContact || "not on record"]));
  }
  if (/when did|how long|duration|move in|moved in|move out|moved out|move-in|move-out/.test(q)) {
  const p = matchProperty(q, properties);
  if (p) {
  const ls = leases.filter((l) => l.propertyId === p.id);
  if (ls.length) {
  const ins = ls.map((l) => l.startDate).sort()[0];
  const outs = ls.map((l) => l.endDate).sort();
  const out = outs[outs.length - 1];
  const months = (yearOf(out) - yearOf(ins)) * 12 + (parseInt(out.slice(5, 7), 10) - parseInt(ins.slice(5, 7), 10));
  return buildResult("Your time at " + p.name, ["Moved in: " + ins + ".", "Tenancy runs through: " + out + ".", "Duration: about " + Math.floor(months / 12) + " years " + (months % 12) + " months."]);
  }
  }
  const rows = properties.slice(0, 15).map((pp) => { const sd = leases.filter((l) => l.propertyId === pp.id).map((l) => l.startDate).sort()[0]; return [pp.name, pp.city, sd || "n/a"]; });
  return buildResult("Your move-in history", ["Here is when each tenancy began."], ["Property", "City", "Moved In"], rows);
  }
  if (/where did i live|where have i lived|which home|which house|which city|which homes/.test(q)) {
  const yr = years.length ? years[years.length - 1] : null;
  const lived = properties.filter((pp) => leases.some((l) => l.propertyId === pp.id && (!yr || (yearOf(l.startDate) <= yr && yearOf(l.endDate) >= yr))));
  const list = lived.length ? lived : properties;
  return buildResult("Where you lived" + (yr ? " in " + yr : ""), [(yr ? "During " + yr + " you were in " + lived.length + " home(s)." : "You have lived in " + properties.length + " homes.")], ["Property", "City", "Type"], list.slice(0, 15).map((pp) => [pp.name, pp.city, pp.type]));
  }
  return null;
 }
 
