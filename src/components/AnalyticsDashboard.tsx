 import React from "react";
 import {
  Building2, CreditCard, Clock, Wrench, FileText, FolderOpen, ArrowRight, Sun, MapPin, TrendingUp,
  Home, Wallet, Zap, Wifi, RefreshCw, Star, LogOut, Archive, PenLine, Download, Share2,
  Image as ImageIcon, Sparkles, Bell, CalendarClock, Receipt, ShieldCheck, BadgeIndianRupee
 } from "lucide-react";
 import { Property, Lease, Transaction, MaintenanceTicket } from "../types";
 import { getDashboardData } from "../insights";
import WeatherTimeWidget from "./WeatherTimeWidget";
 
 interface AnalyticsDashboardProps {
  properties: Property[];
  leases: Lease[];
  transactions: Transaction[];
  tickets: MaintenanceTicket[];
  userName: string;
  userRole: string;
  onNavigate: (tab: any) => void;
 }
 
 const inr = (n: number) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
 const num = (n: number) => Number(n || 0).toLocaleString("en-IN");
 const ICONS: any = { home: Home, file: FileText, wallet: Wallet, zap: Zap, wifi: Wifi, refresh: RefreshCw, trend: TrendingUp, wrench: Wrench, star: Star, logout: LogOut, archive: Archive, pen: PenLine, download: Download, share: Share2, image: ImageIcon };
 const Ico = ({ name, className }: { name: string; className?: string }) => { const C = ICONS[name] || FileText; return <C className={className} />; };
 
 export default function AnalyticsDashboard({ properties, leases, transactions, tickets, userName, userRole, onNavigate }: AnalyticsDashboardProps) {
  const demo = getDashboardData(properties, leases, transactions, tickets);
  const s = demo.stats;
  const firstName = (userName || "Ravi").split(" ")[0];
  const todayMs = new Date("2026-06-30").getTime();
  const recentDocs = demo.documents.slice().sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)).slice(0, 6);
  const recentTx = transactions.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  const renewals = leases.filter((l) => l.status === "Active").map((l) => ({ name: l.propertyName, end: l.endDate, days: Math.max(0, Math.round((new Date(l.endDate).getTime() - todayMs) / 86400000)), rent: l.monthlyRent }));
  const statCards = [
  { label: "Properties Lived In", value: num(s.propertiesLivedIn), icon: Building2 },
  { label: "Years of History", value: s.yearsHistory + " Years", icon: CalendarClock },
  { label: "Total Rent Paid", value: inr(s.totalRentPaid), icon: CreditCard },
  { label: "Security Deposits", value: inr(s.securityDeposits), icon: Wallet },
  { label: "Documents Stored", value: num(s.documentsStored), icon: FolderOpen },
  { label: "Lease Agreements", value: num(s.leaseAgreements), icon: FileText },
  { label: "Utility Bills", value: num(s.utilityBills), icon: Zap },
  { label: "Maintenance Requests", value: num(s.maintenanceRequests), icon: Wrench },
  { label: "Current Active Lease", value: num(s.currentActiveLease), icon: ShieldCheck },
  { label: "Completed Leases", value: num(s.completedLeases), icon: Archive },
  { label: "Cities Lived", value: num(s.citiesLived), icon: MapPin },
  { label: "Longest Stay", value: s.longestStay, icon: Clock },
  { label: "Average Monthly Rent", value: inr(s.averageMonthlyRent), icon: TrendingUp },
  { label: "Avg Monthly Expenses", value: inr(s.monthlyExpenses), icon: Receipt },
  { label: "Upcoming Renewals", value: num(s.upcomingRenewals), icon: RefreshCw },
  { label: "Pending Payments", value: inr(s.pendingPayments), icon: Clock },
  { label: "Digital Signatures", value: num(s.digitalSignatures), icon: PenLine },
  { label: "Owners Connected", value: num(s.ownersConnected), icon: Share2 },
  { label: "Timeline Events", value: num(s.timelineEvents), icon: Sparkles }
  ];
  const rg = demo.rentGrowth;
  const rgMax = Math.max(...rg.map((p) => p.rent), 1);
  const RGW = 620, RGH = 150;
  const rgPts = rg.map((p, i) => { const x = (i / Math.max(1, rg.length - 1)) * (RGW - 24) + 12; const y = RGH - (p.rent / rgMax) * (RGH - 34) - 12; return { x, y, year: p.year, rent: p.rent }; });
  const rgLine = rgPts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const expenses = demo.expenses.filter((e) => e.amount > 0).slice(0, 6);
  const expMax = Math.max(...expenses.map((e) => e.amount), 1);
 
  const activeProp = properties.find((p) => renewals[0] && p.name === renewals[0].name) || properties[0];
  const currentCity = (activeProp && activeProp.city) || "Bengaluru";
  return (
  <div className="flex-1 flex flex-col gap-6 p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
  {/* Welcome banner */}
  <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden shadow-2xl">
  <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-[90px] pointer-events-none"></div>
  <div className="flex items-start gap-4 relative">
  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white shrink-0">
  <Sun className="w-7 h-7 animate-spin" style={{ animationDuration: "40s" }} />
  </div>
  <div className="min-w-0">
  <span className="text-[10px] text-white font-bold uppercase tracking-widest block opacity-60">Command Deck</span>
  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Welcome back, {firstName} <span className="inline-block">&#128075;</span></h1>
  <p className="text-xs text-[#9CA3AF] mt-1.5 max-w-2xl leading-relaxed">Your complete rental history, documents, finances, and property experiences are organised securely in one place.</p>
  <p className="text-xs text-[#9CA3AF] mt-1 max-w-2xl leading-relaxed">Track every home you have lived in, every agreement you have signed, every payment you have made, and every memory you have created.</p>
  </div>
  </div>
  <div className="flex items-center gap-3 relative shrink-0">
  <div className="flex flex-col items-center bg-[#111827]/65 border border-[#374151]/50 px-4 py-2.5 rounded-xl">
  <span className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-wider">Member Since</span>
  <span className="text-sm font-black text-white">2001</span>
  </div>
  <WeatherTimeWidget city={currentCity} />
  </div>
  </div>
  {/* Lifetime stats grid */}
  <div className="flex flex-col gap-3">
  <div className="flex items-center justify-between px-1">
  <h2 className="text-sm font-black text-white tracking-tight">Lifetime Portfolio Snapshot</h2>
  <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">25 Years of Rental History</span>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
  {statCards.map((c, i) => {
  const Cm = c.icon as any;
  return (
  <div key={i} className="bg-[#111827] border border-[#374151] rounded-xl p-4 flex flex-col gap-2 hover:border-[#4B5563] transition-all">
  <div className="flex items-center justify-between">
  <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-wider leading-tight">{c.label}</span>
  <div className="p-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[#9CA3AF]"><Cm className="w-3.5 h-3.5" /></div>
  </div>
  <span className="text-lg font-black text-white tracking-tight">{c.value}</span>
  </div>
  );
  })}
  </div>
  </div>
 
  {/* Charts: rent growth + expense overview */}
  <div className="flex flex-col lg:flex-row gap-6">
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex-1 flex flex-col gap-4 min-w-0">
  <div className="flex justify-between items-center border-b border-[#374151]/50 pb-2.5">
  <div>
  <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Rent Growth</span>
  <h4 className="text-sm font-bold text-white mt-0.5">Average Monthly Rent Over Time</h4>
  </div>
  <span className="text-[9px] text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded-md border border-[#10B981]/30">2001 - 2026</span>
  </div>
  <div className="relative">
  <svg viewBox={`0 0 ${RGW} ${RGH}`} className="w-full h-36 overflow-visible">
  <defs>
  <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
  </linearGradient>
  </defs>
  <path d={`M ${rgPts[0].x.toFixed(1)},${RGH} ${rgPts.map((p) => "L " + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ")} L ${rgPts[rgPts.length - 1].x.toFixed(1)},${RGH} Z`} fill="url(#rentGrad)" />
  <polyline fill="none" stroke="#2563EB" strokeWidth="2.5" points={rgLine} />
  {rgPts.filter((_, i) => i % 4 === 0 || i === rgPts.length - 1).map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563EB" />))}
  </svg>
  <div className="flex justify-between text-[8px] text-[#9CA3AF] font-bold uppercase mt-1 px-1">
  {rgPts.filter((_, i) => i % 5 === 0 || i === rgPts.length - 1).map((p, i) => (<span key={i}>{p.year}</span>))}
  </div>
  </div>
  <div className="flex items-center gap-4 pt-1">
  <div className="flex flex-col"><span className="text-[9px] text-[#9CA3AF] uppercase font-bold">First Rent</span><span className="text-sm font-black text-white">{inr(rg[0].rent)}</span></div>
  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
  <div className="flex flex-col"><span className="text-[9px] text-[#9CA3AF] uppercase font-bold">Latest Rent</span><span className="text-sm font-black text-[#10B981]">{inr(rg[rg.length - 1].rent)}</span></div>
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 lg:w-[22rem] shrink-0 flex flex-col gap-4">
  <div className="border-b border-[#374151]/50 pb-2.5">
  <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Expense Overview</span>
  <h4 className="text-sm font-bold text-white mt-0.5">Lifetime Spending by Category</h4>
  </div>
  <div className="flex flex-col gap-3">
  {expenses.map((e, i) => (
  <div key={i} className="flex flex-col gap-1">
  <div className="flex justify-between items-center text-xs">
  <span className="font-bold text-white">{e.category}</span>
  <span className="font-bold text-[#9CA3AF]">{inr(e.amount)} <span className="text-[#6B7280]">({e.pct}%)</span></span>
  </div>
  <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
  <div className="h-full rounded-full" style={{ width: Math.max(4, (e.amount / expMax) * 100) + "%", backgroundColor: e.color }}></div>
  </div>
  </div>
  ))}
  </div>
  </div>
  </div>
 
  {/* Timeline + AI suggestions */}
  <div className="flex flex-col lg:flex-row gap-6">
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex-1 flex flex-col gap-4 min-w-0">
  <div className="flex justify-between items-center border-b border-[#374151]/50 pb-2.5">
  <div>
  <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider block">Rental Timeline</span>
  <h4 className="text-sm font-bold text-white mt-0.5">Your Recent Property Journey</h4>
  </div>
  <CalendarClock className="w-4 h-4 text-[#9CA3AF]" />
  </div>
  <div className="flex flex-col">
  {demo.timeline.slice(0, 8).map((t, i) => (
  <div key={t.id} className="flex gap-3 group">
  <div className="flex flex-col items-center">
  <div className="p-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#2563EB] group-hover:border-[#2563EB] transition-all"><Ico name={t.icon} className="w-3.5 h-3.5" /></div>
  {i < 7 ? <div className="w-px flex-1 bg-[#374151] my-1"></div> : null}
  </div>
  <div className="pb-4 min-w-0">
  <span className="text-xs font-bold text-white block truncate">{t.title}</span>
  <span className="text-[10px] text-[#9CA3AF] block mt-0.5 truncate">{t.propertyName}</span>
  <span className="text-[9px] text-[#6B7280] font-bold block mt-0.5">{t.date}</span>
  </div>
  </div>
  ))}
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 lg:w-[24rem] shrink-0 flex flex-col gap-4">
  <div className="flex items-center gap-2 border-b border-[#374151]/50 pb-2.5">
  <div className="p-1.5 bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 rounded-lg text-[#8B5CF6]"><Sparkles className="w-3.5 h-3.5" /></div>
  <div>
  <span className="text-[10px] text-[#8B5CF6] font-bold uppercase tracking-wider block">AI Suggestions</span>
  <h4 className="text-sm font-bold text-white mt-0.5">Smart Insights For You</h4>
  </div>
  </div>
  <div className="flex flex-col gap-2.5">
  {demo.suggestions.map((sg, i) => (
  <div key={i} className="flex items-start gap-2.5 p-3 bg-[#1F2937]/50 border border-[#374151]/50 rounded-xl hover:border-[#8B5CF6]/40 transition-all">
  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] mt-0.5 shrink-0" />
  <span className="text-[11px] text-[#D1D5DB] leading-relaxed font-medium">{sg}</span>
  </div>
  ))}
  </div>
  </div>
  </div>
 
  {/* Activity + Documents + Renewals */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
  <div className="flex items-center gap-2 border-b border-[#374151]/50 pb-2.5">
  <Bell className="w-4 h-4 text-[#2563EB]" />
  <h4 className="text-sm font-bold text-white">Recent Activity</h4>
  </div>
  <div className="flex flex-col gap-2">
  {demo.activity.map((a) => (
  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#1F2937]/50 transition-all">
  <div className="p-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#2563EB] shrink-0"><Ico name={a.icon} className="w-3.5 h-3.5" /></div>
  <div className="min-w-0 flex-1">
  <span className="text-xs font-bold text-white block truncate">{a.action}</span>
  <span className="text-[10px] text-[#9CA3AF] block truncate">{a.detail}</span>
  </div>
  <span className="text-[9px] text-[#6B7280] font-bold shrink-0">{a.date.slice(5)}</span>
  </div>
  ))}
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
  <div className="flex items-center justify-between border-b border-[#374151]/50 pb-2.5">
  <div className="flex items-center gap-2"><FolderOpen className="w-4 h-4 text-[#2563EB]" /><h4 className="text-sm font-bold text-white">Recent Documents</h4></div>
  <button onClick={() => onNavigate("documents")} className="text-[10px] text-[#2563EB] font-extrabold uppercase flex items-center gap-0.5">View<ArrowRight className="w-3 h-3" /></button>
  </div>
  <div className="flex flex-col gap-2">
  {recentDocs.map((d) => (
  <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#1F2937]/50 transition-all">
  <div className="p-2 bg-[#1F2937] border border-[#374151] rounded-lg text-[#F59E0B] shrink-0 text-[9px] font-black uppercase w-9 text-center">{d.fileType}</div>
  <div className="min-w-0 flex-1">
  <span className="text-xs font-bold text-white block truncate">{d.name}</span>
  <span className="text-[10px] text-[#9CA3AF] block">{d.category} • {d.size}</span>
  </div>
  <span className="text-[9px] text-[#6B7280] font-bold shrink-0">{d.uploadedAt}</span>
  </div>
  ))}
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
  <div className="flex items-center gap-2 border-b border-[#374151]/50 pb-2.5">
  <RefreshCw className="w-4 h-4 text-[#F59E0B]" />
  <h4 className="text-sm font-bold text-white">Upcoming Renewals</h4>
  </div>
  {renewals.length === 0 ? (
  <p className="text-xs text-[#9CA3AF]">No active leases are nearing renewal right now.</p>
  ) : (
  <div className="flex flex-col gap-3">
  {renewals.map((r, i) => (
  <div key={i} className="p-3.5 bg-[#1F2937]/50 border border-[#374151]/50 rounded-xl flex flex-col gap-2">
  <span className="text-xs font-bold text-white truncate">{r.name}</span>
  <div className="flex items-center justify-between">
  <span className="text-[10px] text-[#9CA3AF] font-bold">Expires {r.end}</span>
  <span className="text-[9px] font-black px-2 py-0.5 rounded-md border bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 uppercase">{r.days} days left</span>
  </div>
  <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]"><BadgeIndianRupee className="w-3 h-3" /><span className="font-bold text-white">{inr(r.rent)}</span> per month</div>
  </div>
  ))}
  <button onClick={() => onNavigate("leases")} className="mt-1 w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5">Review Lease Vault <ArrowRight className="w-3.5 h-3.5" /></button>
  </div>
  )}
  </div>
  </div>
 
  {/* Recent transactions + quick launchpad */}
  <div className="flex flex-col lg:flex-row gap-6">
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex-1 flex flex-col gap-4 min-w-0">
  <div className="flex justify-between items-center border-b border-[#374151]/50 pb-2.5">
  <div>
  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider block">Audits Ledger</span>
  <h4 className="text-sm font-bold text-white mt-0.5">Recent Transactions and Events</h4>
  </div>
  <button onClick={() => onNavigate("payments")} className="text-[10px] text-[#2563EB] font-extrabold flex items-center gap-0.5 uppercase">View Ledger <ArrowRight className="w-3.5 h-3.5" /></button>
  </div>
  <div className="flex flex-col gap-2.5">
  {recentTx.map((tx) => (
  <div key={tx.id} className="flex justify-between items-center p-3.5 bg-[#1F2937]/30 border border-[#374151]/30 rounded-xl text-xs font-semibold hover:border-[#374151] transition-all">
  <div className="flex items-center gap-3 min-w-0">
  <div className="p-2 bg-[#111827] border border-[#374151] rounded-lg text-sm shrink-0">{tx.category === "Rent" ? "🏠" : tx.category === "Repairs" || tx.category === "Maintenance" || tx.category === "Cleaning" ? "🔧" : tx.category === "Deposit" || tx.category === "Refund" ? "💰" : tx.category === "Water" ? "💧" : "⚡"}</div>
  <div className="min-w-0"><span className="text-white block font-bold truncate">{tx.propertyName}</span><span className="text-[10px] text-[#9CA3AF] block mt-0.5">{tx.category} • {tx.date}</span></div>
  </div>
  <div className="text-right shrink-0">
  <span className="text-white block font-black">{inr(tx.amount)}</span>
  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase inline-block mt-1 ${tx.status === "Paid" ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30" : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"}`}>{tx.status}</span>
  </div>
  </div>
  ))}
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 lg:w-[22rem] shrink-0 flex flex-col gap-4">
  <div><span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Launchpad</span><h4 className="text-sm font-bold text-white mt-0.5">Quick Actions</h4></div>
  <div className="grid grid-cols-2 gap-3">
  <button onClick={() => onNavigate("properties")} className="group relative bg-[#1F2937]/50 border border-[#374151]/50 hover:border-[#2563EB] hover:bg-[#2563EB]/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-lg hover:shadow-[#2563EB]/10 cursor-pointer p-3.5 rounded-xl flex flex-col gap-3 text-left transition-all"><ArrowRight className="w-4 h-4 -rotate-45 text-[#4B5563] group-hover:text-[#2563EB] group-hover:-translate-y-0.5 transition-all absolute top-3 right-3" /><Building2 className="w-5 h-5 text-[#2563EB]" /><span className="text-xs font-bold text-white">Add Property</span></button>
  <button onClick={() => onNavigate("leases")} className="group relative bg-[#1F2937]/50 border border-[#374151]/50 hover:border-[#2563EB] hover:bg-[#2563EB]/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-lg hover:shadow-[#2563EB]/10 cursor-pointer p-3.5 rounded-xl flex flex-col gap-3 text-left transition-all"><ArrowRight className="w-4 h-4 -rotate-45 text-[#4B5563] group-hover:text-[#2563EB] group-hover:-translate-y-0.5 transition-all absolute top-3 right-3" /><FileText className="w-5 h-5 text-[#2563EB]" /><span className="text-xs font-bold text-white">Sign Lease</span></button>
  <button onClick={() => onNavigate("maintenance")} className="group relative bg-[#1F2937]/50 border border-[#374151]/50 hover:border-[#2563EB] hover:bg-[#2563EB]/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-lg hover:shadow-[#2563EB]/10 cursor-pointer p-3.5 rounded-xl flex flex-col gap-3 text-left transition-all"><ArrowRight className="w-4 h-4 -rotate-45 text-[#4B5563] group-hover:text-[#2563EB] group-hover:-translate-y-0.5 transition-all absolute top-3 right-3" /><Wrench className="w-5 h-5 text-[#2563EB]" /><span className="text-xs font-bold text-white">File Repair</span></button>
  <button onClick={() => onNavigate("documents")} className="group relative bg-[#1F2937]/50 border border-[#374151]/50 hover:border-[#2563EB] hover:bg-[#2563EB]/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] hover:shadow-lg hover:shadow-[#2563EB]/10 cursor-pointer p-3.5 rounded-xl flex flex-col gap-3 text-left transition-all"><ArrowRight className="w-4 h-4 -rotate-45 text-[#4B5563] group-hover:text-[#2563EB] group-hover:-translate-y-0.5 transition-all absolute top-3 right-3" /><FolderOpen className="w-5 h-5 text-[#2563EB]" /><span className="text-xs font-bold text-white">OCR Import</span></button>
  </div>
  <div className="mt-1 p-3.5 bg-[#2563EB]/10 border border-[#2563EB]/25 rounded-xl flex items-center gap-3">
  <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
  <span className="text-[10px] text-[#D1D5DB] leading-relaxed">Your vault is encrypted end to end. {num(s.documentsStored)} documents are stored securely.</span>
  </div>
  </div>
  </div>
  </div>
  );
 }
 
