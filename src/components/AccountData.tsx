 import React, { useState } from "react";
 import { UserCog, Download, Upload, FileDown, Save, ShieldCheck, Lock, KeyRound } from "lucide-react";
 import { UserSession } from "../types";
 import { deriveStats } from "../insights";
 import { SEED_VERSION } from "../seedData";
 import { encryptText, decryptText, isEncryptedEnvelope } from "../crypto";
 
 interface AccountDataProps {
  session: UserSession;
  onUpdateSession: (s: UserSession) => void;
 }
 const ROLES = ["Tenant", "Landlord", "Property Owner", "Property Manager", "Housing Society Admin"];
 const DATA_KEYS = ["rv_session", "rv_properties", "rv_leases", "rv_transactions", "rv_utilities", "rv_tickets", "rv_documents", "rv_timeline", "rv_activity", "rv_suggestions", "rv_notifications", "rv_rentGrowth", "rv_expenses", "rv_stats", "rv_seed_version"];
 const readArr = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
 function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
 }
 const collectDump = () => { const dump: any = {}; DATA_KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) dump[k] = v; }); return JSON.stringify({ app: "HomeOS", version: SEED_VERSION, exportedAt: new Date().toISOString(), data: dump }); };
 const restoreDump = (json: string) => { const parsed = JSON.parse(json); const data = parsed.data || parsed; Object.keys(data).forEach((k) => { if (k.indexOf("rv_") === 0) { const val = data[k]; localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val)); } }); localStorage.setItem("rv_seed_version", SEED_VERSION); };
 
 export default function AccountData({ session, onUpdateSession }: AccountDataProps) {
  const [name, setName] = useState(session.userName);
  const [email, setEmail] = useState(session.userEmail);
  const [workspace, setWorkspace] = useState(session.workspaceName);
  const [msg, setMsg] = useState("");
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const saveAccount = () => {
  onUpdateSession({ ...session, userName: name.trim() || session.userName, userEmail: email.trim() || session.userEmail, workspaceName: workspace.trim() || session.workspaceName });
  flash("Account profile saved to this device.");
  };
  const switchRole = (r: string) => { onUpdateSession({ ...session, role: r as any }); flash("Active role switched to " + r + "."); };
  const exportBackup = () => { downloadFile("homeos-backup-" + new Date().toISOString().slice(0, 10) + ".json", collectDump(), "application/json"); flash("Workspace exported as a JSON backup."); };
  const exportEncrypted = async () => {
  const pass = window.prompt("Set a passphrase to encrypt this backup. You will need it to restore. There is no recovery if you lose it.");
  if (!pass) return;
  try { const envelope = await encryptText(collectDump(), pass); downloadFile("homeos-encrypted-backup-" + new Date().toISOString().slice(0, 10) + ".json", envelope, "application/json"); flash("Encrypted backup downloaded (AES-256-GCM)."); }
  catch (e) { flash("Encryption needs a secure context (HTTPS or localhost)."); }
  };
  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const text = await file.text();
  let json = text;
  if (isEncryptedEnvelope(text)) {
  const pass = window.prompt("This backup is encrypted. Enter its passphrase to restore.");
  if (!pass) return;
  try { json = await decryptText(text, pass); } catch (err) { alert("Wrong passphrase or corrupted backup."); return; }
  }
  try { restoreDump(json); alert("Backup restored. HomeOS will now reload."); window.location.reload(); }
  catch (err) { alert("That file could not be read as a HomeOS backup."); }
  };
 
  const downloadPdf = () => {
  const properties = readArr("rv_properties"), leases = readArr("rv_leases"), transactions = readArr("rv_transactions"), utilities = readArr("rv_utilities"), documents = readArr("rv_documents"), tickets = readArr("rv_tickets");
  const s = deriveStats(properties, leases, transactions, utilities, documents, tickets);
  const inr = (n: number) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  const recent = transactions.slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1)).slice(0, 18);
  const stats: any[] = [["Properties Lived In", s.propertiesLivedIn], ["Years of History", s.yearsHistory], ["Total Rent Paid", inr(s.totalRentPaid)], ["Security Deposits", inr(s.securityDeposits)], ["Documents Stored", s.documentsStored], ["Lease Agreements", s.leaseAgreements], ["Utility Bills", s.utilityBills], ["Maintenance Requests", s.maintenanceRequests], ["Cities Lived", s.citiesLived], ["Longest Stay", s.longestStay], ["Avg Monthly Rent", inr(s.averageMonthlyRent)], ["Pending Payments", inr(s.pendingPayments)]];
  const statHtml = stats.map((r) => `<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("");
  const rowHtml = recent.map((t: any) => `<tr><td>${t.date}</td><td>${t.propertyName}</td><td>${t.category}</td><td>${inr(t.amount)}</td><td>${t.status}</td></tr>`).join("");
  const css = "body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:28px;}h1{margin:0;font-size:22px;color:#2563EB;}h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #eee;padding-bottom:4px;}.muted{color:#64748b;font-size:12px;margin:2px 0 0;}.grid{display:flex;flex-wrap:wrap;gap:8px;}.stat{border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;min-width:150px;}.stat span{color:#64748b;font-size:10px;text-transform:uppercase;display:block;}.stat b{font-size:15px;}table{width:100%;border-collapse:collapse;margin-top:6px;}th,td{border:1px solid #e2e8f0;padding:6px 8px;font-size:11px;text-align:left;}th{background:#f1f5f9;text-transform:uppercase;font-size:9px;color:#475569;}@media print{body{margin:12mm;}}";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>HomeOS Report</title><style>${css}</style></head><body><h1>HomeOS</h1><p class="muted">Portfolio Report for ${session.workspaceName} &middot; ${session.userName} &middot; ${new Date().toLocaleDateString("en-IN")}</p><h2>Lifetime Snapshot</h2><div class="grid">${statHtml}</div><h2>Recent Transactions</h2><table><thead><tr><th>Date</th><th>Property</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead><tbody>${rowHtml}</tbody></table><p class="muted" style="margin-top:24px">Generated by HomeOS, your private home operating system. Use the print dialog to Save as PDF.</p></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { flash("Allow popups to download the PDF report."); return; }
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
  flash("PDF report opened. Use the print dialog to Save as PDF.");
  };
 
  const inputCls = "bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-2.5 text-xs text-white";
  const actionCls = "bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]";
  return (
  <div className="flex flex-col gap-4">
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
  <div className="flex items-center gap-2">
  <UserCog className="w-4 h-4 text-[#2563EB]" />
  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account & Local Data</h4>
  </div>
  <p className="text-[10px] text-[#9CA3AF] leading-relaxed -mt-2">No login needed. Your account and data live on this device. Switch your role anytime, and save a backup to keep your data safe or move it to another browser.</p>
  {msg ? (<div className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 p-2.5 rounded-lg text-[10px] font-bold flex items-center gap-2 animate-fadeIn"><ShieldCheck className="w-3.5 h-3.5" />{msg}</div>) : null}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Your Name</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Workspace</label><input value={workspace} onChange={(e) => setWorkspace(e.target.value)} className={inputCls} /></div>
  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-[#2563EB] uppercase">Active Role (switch anytime)</label><select value={session.role} onChange={(e) => switchRole(e.target.value)} className={inputCls + " cursor-pointer"}>{ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}</select></div>
  </div>
  <button onClick={saveAccount} className="self-start bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.97]"><Save className="w-3.5 h-3.5" />Save Profile</button>
  <div className="border-t border-[#374151]/50 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
  <button onClick={exportBackup} className={actionCls}><Download className="w-3.5 h-3.5 text-[#2563EB]" />Export</button>
  <button onClick={exportEncrypted} className={actionCls}><Lock className="w-3.5 h-3.5 text-[#10B981]" />Encrypted</button>
  <label className={actionCls + " cursor-pointer"}><Upload className="w-3.5 h-3.5 text-[#2563EB]" />Import<input type="file" accept="application/json,.json" onChange={importBackup} className="hidden" /></label>
  <button onClick={downloadPdf} className={actionCls}><FileDown className="w-3.5 h-3.5 text-[#8B5CF6]" />PDF</button>
  </div>
  </div>
  <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-2.5">
  <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#10B981]" /><h4 className="text-xs font-bold text-white uppercase tracking-wider">How Your Data Is Protected</h4></div>
  <ul className="flex flex-col gap-1.5 text-[10px] text-[#9CA3AF] leading-relaxed">
  <li>Local first: everything is stored in your browser on this device. Nothing is sent to any server by default.</li>
  <li>Encrypted backups: the Encrypted option seals your backup with AES-256-GCM using a key derived from your passphrase (PBKDF2, 150k iterations). Only your passphrase can open it.</li>
  <li>No recovery: if you lose the passphrase, the encrypted backup cannot be opened. Keep it somewhere safe.</li>
  <li>Private AI: the Ask Your Data assistant answers from your records locally, without sending them out.</li>
  </ul>
  </div>
  </div>
  );
 }
 
