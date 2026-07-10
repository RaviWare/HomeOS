import React, { useEffect, useState } from "react";
import {
  UserCog,
  Download,
  Upload,
  FileDown,
  Save,
  ShieldCheck,
  Lock,
  KeyRound,
  CreditCard,
  Gift,
  CheckCircle2,
  Camera,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { UserSession, UserRole } from "../types";
import { deriveStats } from "../insights";
import { SEED_VERSION } from "../seedData";
import { encryptText, decryptText, isEncryptedEnvelope } from "../crypto";
import { updateAccountProfile } from "../auth";
import { resolveAvatarUrl } from "../avatar";
import { optimizeImageFile, formatBytes } from "../imageOptimize";
import { initialsFromUser } from "../userDisplay";
import {
  CATEGORY_FLOW,
  personaForRole,
  roleTitle,
  roleSummary,
} from "../userPersonas";
import { applyPersonaDeckDefaults, saveDeckPrefs } from "./deckPrefs";
import {
  loadCustomRoles,
  upsertCustomRole,
  type CustomRole,
} from "../customRoles";
import {
  CURRENCIES,
  type CurrencyCode,
  loadCurrencyPrefs,
  ratesFooter,
  saveCurrencyPrefs,
  setDisplayCurrency,
  unitsPerUsd,
} from "../currency";
import {
  clearCheckoutPreference,
  planLabel as formatPlanLabel,
  readCheckoutPreference,
} from "../billing";
import ClerkBillingPanel from "./ClerkBillingPanel";

interface AccountDataProps {
  session: UserSession;
  onUpdateSession: (s: UserSession) => void;
  onReconfigureWorkspace?: () => void;
}

const DATA_KEYS = [
  "rv_session",
  "rv_properties",
  "rv_leases",
  "rv_transactions",
  "rv_utilities",
  "rv_tickets",
  "rv_documents",
  "rv_timeline",
  "rv_activity",
  "rv_suggestions",
  "rv_notifications",
  "rv_rentGrowth",
  "rv_expenses",
  "rv_stats",
  "rv_seed_version",
  "rv_home_life",
  "rv_accounts_v1",
];

const readArr = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
};

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const collectDump = () => {
  const dump: Record<string, string | null> = {};
  DATA_KEYS.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v !== null) dump[k] = v;
  });
  return JSON.stringify({
    app: "HomeOS",
    version: SEED_VERSION,
    exportedAt: new Date().toISOString(),
    data: dump,
  });
};

const restoreDump = (json: string) => {
  const parsed = JSON.parse(json);
  const data = parsed.data || parsed;
  Object.keys(data).forEach((k) => {
    if (k.indexOf("rv_") === 0) {
      const val = data[k];
      localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }
  });
  localStorage.setItem("rv_seed_version", SEED_VERSION);
};

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export default function AccountData({
  session,
  onUpdateSession,
  onReconfigureWorkspace,
}: AccountDataProps) {
  const [name, setName] = useState(session.userName);
  const [email, setEmail] = useState(session.userEmail);
  const [workspace, setWorkspace] = useState(session.workspaceName);
  const [avatarUrl, setAvatarUrl] = useState(session.avatarUrl || "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMeta, setAvatarMeta] = useState("");
  const [imgFailed, setImgFailed] = useState(false);
  const [msg, setMsg] = useState("");
  const [fxPrefs, setFxPrefs] = useState(() => loadCurrencyPrefs());
  const [showRates, setShowRates] = useState(false);
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3200);
  };

  const previewAvatar = !imgFailed
    ? resolveAvatarUrl(email, avatarUrl || undefined, 128)
    : null;
  const initials = initialsFromUser(name, email);

  // Soft preference from /pricing only — never grant paid plan without Clerk checkout
  useEffect(() => {
    try {
      const intent = readCheckoutPreference();
      if (!intent?.plan) return;
      if (session.plan && session.plan !== "trial") {
        clearCheckoutPreference();
        return;
      }
      // Keep preference for UI hint; paid upgrades come from ClerkBillingPanel only
      flash(
        `You selected ${formatPlanLabel(intent.plan)} on pricing. Complete secure checkout below to activate it.`
      );
    } catch {
      try {
        clearCheckoutPreference();
      } catch {
        /* ignore */
      }
    }
    // Apply once when Account settings mounts with a pending intent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAccount = () => {
    const next = {
      ...session,
      userName: name.trim() || session.userName,
      userEmail: email.trim() || session.userEmail,
      workspaceName: workspace.trim() || session.workspaceName,
      avatarUrl: avatarUrl || undefined,
    };
    onUpdateSession(next);
    if (session.accountId) {
      updateAccountProfile(session.accountId, {
        name: next.userName,
        workspaceName: next.workspaceName,
      });
    }
    flash("Account profile saved.");
  };

  const onAvatarFile = async (file: File | null) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const result = await optimizeImageFile(file, {
        maxEdge: 512,
        quality: 0.8,
        maxBytes: 80 * 1024,
        mime: "image/jpeg",
      });
      setAvatarUrl(result.dataUrl);
      setImgFailed(false);
      setAvatarMeta(`Optimized · ${formatBytes(result.bytes)}`);
      onUpdateSession({
        ...session,
        avatarUrl: result.dataUrl,
      });
      flash("Profile photo updated (auto-optimized).");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not process photo.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const switchRole = (r: string) => {
    const role = r as UserRole;
    onUpdateSession({
      ...session,
      role,
      roleLabel: undefined,
      customRoleId: undefined,
    });
    if (session.accountId) {
      updateAccountProfile(session.accountId, { role });
    }
    // Re-seed deck defaults for this category (nav, ribbon, default view)
    const persona = personaForRole(role);
    applyPersonaDeckDefaults(persona, {
      fullReset: true,
      hideSecondary: persona.id === "field" || persona.id === "operator",
    });
    flash(
      `Now: ${roleTitle(role)} · deck tuned for ${persona.label}. Sidebar order updates live.`
    );
  };

  const applyCustomRole = (cr: CustomRole) => {
    const base = (cr.baseRole || "Tenant") as UserRole;
    onUpdateSession({
      ...session,
      role: base,
      roleLabel: cr.title,
      customRoleId: cr.id,
    });
    const persona = personaForRole(base);
    const prefs = applyPersonaDeckDefaults(persona, { fullReset: true });
    saveDeckPrefs({
      ...prefs,
      moduleOrder: cr.moduleOrder,
      hiddenModules: cr.hiddenModules,
      defaultDeckView: cr.defaultDeckView,
    });
    flash(`Custom role “${cr.title}” applied. Customize further on the Command Deck.`);
  };

  const createCustomFromSettings = () => {
    const title = window.prompt(
      'Name your custom role (e.g. "Parents\' flat manager" or "Co-living operator"):'
    );
    if (!title || !title.trim()) return;
    const persona = personaForRole(session.role);
    const cr = upsertCustomRole({
      title: title.trim(),
      basePersona: persona.id,
      baseRole: session.role,
      moduleOrder: persona.modulePriority,
      hiddenModules: [],
      defaultDeckView: persona.defaultDeckView,
    });
    applyCustomRole(cr);
  };

  const exportBackup = () => {
    downloadFile(
      "homeos-backup-" + new Date().toISOString().slice(0, 10) + ".json",
      collectDump(),
      "application/json"
    );
    flash("All workspace data downloaded as JSON backup.");
  };

  const exportEncrypted = async () => {
    const pass = window.prompt(
      "Set a passphrase to encrypt this backup. You will need it to restore. There is no recovery if you lose it."
    );
    if (!pass) return;
    try {
      const envelope = await encryptText(collectDump(), pass);
      downloadFile(
        "homeos-encrypted-backup-" + new Date().toISOString().slice(0, 10) + ".json",
        envelope,
        "application/json"
      );
      flash("Encrypted backup downloaded (AES-256-GCM).");
    } catch {
      flash("Encryption needs a secure context (HTTPS or localhost).");
    }
  };

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    let json = text;
    if (isEncryptedEnvelope(text)) {
      const pass = window.prompt("This backup is encrypted. Enter its passphrase to restore.");
      if (!pass) return;
      try {
        json = await decryptText(text, pass);
      } catch {
        alert("Wrong passphrase or corrupted backup.");
        return;
      }
    }
    try {
      restoreDump(json);
      alert("Backup restored. HomeOS will now reload.");
      window.location.reload();
    } catch {
      alert("That file could not be read as a HomeOS backup.");
    }
  };

  const downloadPdf = () => {
    const properties = readArr("rv_properties"),
      leases = readArr("rv_leases"),
      transactions = readArr("rv_transactions"),
      utilities = readArr("rv_utilities"),
      documents = readArr("rv_documents"),
      tickets = readArr("rv_tickets");
    const s = deriveStats(properties, leases, transactions, utilities, documents, tickets);
    const inr = (n: number) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
    const recent = transactions
      .slice()
      .sort((a: { date: string }, b: { date: string }) => (a.date < b.date ? 1 : -1))
      .slice(0, 18);
    const stats: [string, string | number][] = [
      ["Properties Lived In", s.propertiesLivedIn],
      ["Years of History", s.yearsHistory],
      ["Total Rent Paid", inr(s.totalRentPaid)],
      ["Security Deposits", inr(s.securityDeposits)],
      ["Documents Stored", s.documentsStored],
      ["Lease Agreements", s.leaseAgreements],
      ["Utility Bills", s.utilityBills],
      ["Maintenance Requests", s.maintenanceRequests],
      ["Cities Lived", s.citiesLived],
      ["Longest Stay", s.longestStay],
      ["Avg Monthly Rent", inr(s.averageMonthlyRent)],
      ["Pending Payments", inr(s.pendingPayments)],
    ];
    const statHtml = stats
      .map((r) => `<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`)
      .join("");
    const rowHtml = recent
      .map(
        (t: {
          date: string;
          propertyName: string;
          category: string;
          amount: number;
          status: string;
        }) =>
          `<tr><td>${t.date}</td><td>${t.propertyName}</td><td>${t.category}</td><td>${inr(t.amount)}</td><td>${t.status}</td></tr>`
      )
      .join("");
    const css =
      "body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:28px;}h1{margin:0;font-size:22px;color:#111;}h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #eee;padding-bottom:4px;}.muted{color:#64748b;font-size:12px;margin:2px 0 0;}.grid{display:flex;flex-wrap:wrap;gap:8px;}.stat{border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;min-width:150px;}.stat span{color:#64748b;font-size:10px;text-transform:uppercase;display:block;}.stat b{font-size:15px;}table{width:100%;border-collapse:collapse;margin-top:6px;}th,td{border:1px solid #e2e8f0;padding:6px 8px;font-size:11px;text-align:left;}th{background:#f1f5f9;text-transform:uppercase;font-size:9px;color:#475569;}@media print{body{margin:12mm;}}";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>HomeOS Report</title><style>${css}</style></head><body><h1>HomeOS</h1><p class="muted">Portfolio Report for ${session.workspaceName} &middot; ${session.userName} &middot; ${new Date().toLocaleDateString()}</p><h2>Lifetime Snapshot</h2><div class="grid">${statHtml}</div><h2>Recent Transactions</h2><table><thead><tr><th>Date</th><th>Property</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead><tbody>${rowHtml}</tbody></table><p class="muted" style="margin-top:24px">Generated by HomeOS. Use the print dialog to Save as PDF.</p></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      flash("Allow popups to download the PDF report.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      try {
        w.print();
      } catch {
        /* ignore */
      }
    }, 500);
    flash("PDF report opened. Use the print dialog to Save as PDF.");
  };

  const preferred = readCheckoutPreference();

  const inputCls =
    "bg-[#121215] border border-[#1F1F23] focus:border-white/30 focus:outline-none rounded-xl p-2.5 text-xs text-white w-full";
  const actionCls =
    "bg-[#121215] hover:bg-[#1a1a1f] border border-[#1F1F23] text-white py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer";

  return (
    <div className="flex flex-col gap-4">
      {/* Currency & FX */}
      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/70" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Currency &amp; conversion
          </h4>
        </div>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed -mt-1">
          Choose the display currency for Command Deck totals. Income and assets can still be
          entered in other currencies — HomeOS converts them so net worth and monthly income show
          the full combined value.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">
              Display currency
            </label>
            <select
              value={fxPrefs.displayCurrency}
              onChange={(e) => {
                const code = e.target.value as CurrencyCode;
                const next = setDisplayCurrency(code);
                setFxPrefs(next);
                flash(`Dashboard display currency set to ${code}.`);
              }}
              className={inputCls + " cursor-pointer"}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-[10px] text-[#71717A] font-medium leading-snug">
              {ratesFooter(fxPrefs)}
            </p>
            <button
              type="button"
              onClick={() => setShowRates((v) => !v)}
              className="mt-1.5 text-[11px] font-bold text-white/70 hover:text-white text-left cursor-pointer"
            >
              {showRates ? "Hide rate table" : "Edit conversion rates (vs USD)"}
            </button>
          </div>
        </div>
        {showRates && (
          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3 max-h-56 overflow-y-auto">
            <p className="text-[10px] text-[#8E8E93] font-medium mb-2 leading-snug">
              Units of each currency per 1 USD. Adjust if you want a personal mid-market rate.
              Cross rates (e.g. INR ↔ EUR) go through USD.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CURRENCIES.map((c) => {
                const val = unitsPerUsd(c.code, fxPrefs);
                return (
                  <label key={c.code} className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-white/50 uppercase">
                      {c.code} / USD
                    </span>
                    <input
                      type="number"
                      min={0.0001}
                      step="any"
                      className={inputCls + " !py-1.5"}
                      value={val}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (!n || n <= 0) return;
                        const next = saveCurrencyPrefs({
                          ...fxPrefs,
                          unitsPerUsd: { ...fxPrefs.unitsPerUsd, [c.code]: n },
                        });
                        setFxPrefs(next);
                      }}
                    />
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const next = saveCurrencyPrefs({
                  ...fxPrefs,
                  unitsPerUsd: {},
                });
                setFxPrefs(next);
                flash("Rates reset to default table.");
              }}
              className="mt-2 text-[11px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
            >
              Reset rates to defaults
            </button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-white/70" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Personal account
          </h4>
        </div>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed -mt-2">
          Manage your profile and role. Changes save to this workspace and your account record.
        </p>
        {msg ? (
          <div className="bg-white/5 text-white border border-white/15 p-2.5 rounded-lg text-[10px] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-white/70" />
            {msg}
          </div>
        ) : null}

        {/* Profile photo — Gravatar from email by default, optional upload */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#1F1F23] bg-[#121215] p-3.5">
          {previewAvatar ? (
            <img
              src={previewAvatar}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border border-white/15 bg-white/10"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-black text-lg">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-black text-white">Profile picture</p>
            <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5 leading-snug">
              Uses the photo linked to your email (Gravatar) first. Upload a custom photo anytime —
              we auto-optimize it for speed.
            </p>
            {avatarMeta && (
              <p className="text-[10px] text-white/50 font-semibold mt-1">{avatarMeta}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-white text-black cursor-pointer hover:bg-[#EAEAEA]">
                {avatarBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                {avatarBusy ? "Optimizing…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={avatarBusy}
                  onChange={(e) => onAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl("");
                    setAvatarMeta("");
                    setImgFailed(false);
                    onUpdateSession({ ...session, avatarUrl: undefined });
                    flash("Using email profile picture again.");
                  }}
                  className="px-3 py-2 rounded-lg text-[11px] font-bold border border-[#1F1F23] text-[#8E8E93] hover:text-white"
                >
                  Use email photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Your Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Workspace</label>
            <input
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-white/50 uppercase">
              Role (drives your dashboard)
            </label>
            <select
              value={session.role}
              onChange={(e) => switchRole(e.target.value)}
              className={inputCls + " cursor-pointer"}
            >
              {CATEGORY_FLOW.map((cat) => (
                <optgroup key={cat.id} label={cat.title}>
                  {cat.roles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[10px] text-[#71717A] font-medium leading-snug">
              {(() => {
                const p = personaForRole(session.role);
                return (
                  <>
                    <span className="text-white/80 font-bold">
                      {roleTitle(session.role, session.roleLabel)}
                    </span>
                    {" · "}
                    {roleSummary(session.role)}
                    {" · deck "}
                    <span className="text-white/60">
                      {p.defaultDeckView === "life"
                        ? "Life OS"
                        : p.defaultDeckView === "graphs"
                          ? "Trends"
                          : "Datasets"}
                    </span>
                  </>
                );
              })()}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {onReconfigureWorkspace && (
                <button
                  type="button"
                  onClick={onReconfigureWorkspace}
                  className="text-[11px] font-bold text-black bg-white border border-white rounded-lg px-3 py-1.5 cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Full setup wizard
                </button>
              )}
              <button
                type="button"
                onClick={createCustomFromSettings}
                className="text-[11px] font-bold text-white/80 border border-[#1F1F23] hover:border-white/25 rounded-lg px-3 py-1.5 cursor-pointer"
              >
                + Custom role
              </button>
              {loadCustomRoles().slice(0, 4).map((cr) => (
                <button
                  key={cr.id}
                  type="button"
                  onClick={() => applyCustomRole(cr)}
                  className={`text-[11px] font-bold rounded-lg px-3 py-1.5 border cursor-pointer ${
                    session.customRoleId === cr.id
                      ? "bg-white text-black border-white"
                      : "text-[#8E8E93] border-[#1F1F23] hover:text-white"
                  }`}
                >
                  {cr.title}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#52525B] font-medium">
              Tip: rearrange modules anytime on Command Deck → Customize.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={saveAccount}
          className="self-start bg-white hover:bg-[#EAEAEA] text-black px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.97]"
        >
          <Save className="w-3.5 h-3.5" />
          Save profile
        </button>
      </div>

      {/* Plan & billing — real Clerk checkout (not localStorage) */}
      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/70" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Plan & billing
          </h4>
        </div>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed -mt-1">
          Subscribe with a real card via Clerk Billing. Local trial access does not mean a paid
          plan — only a completed checkout activates Personal, Pro, or Team.
        </p>
        {preferred?.plan && (session.plan === "trial" || !session.plan) && (
          <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 flex gap-2.5 items-start">
            <Gift className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8E8E93] font-medium leading-snug">
              <span className="text-white font-bold">
                Pricing preference: {formatPlanLabel(preferred.plan)}
              </span>
              {preferred.billing ? ` · ${preferred.billing}` : ""}. Pick that plan in the table
              below to complete payment.
            </p>
          </div>
        )}
        {CLERK_ENABLED ? (
          <ClerkBillingPanel
            session={session}
            onUpdateSession={onUpdateSession}
            variant="settings"
          />
        ) : (
          <p className="text-[12px] text-[#8E8E93] font-medium leading-relaxed">
            Set <code className="text-white/80">VITE_CLERK_PUBLISHABLE_KEY</code> and enable
            Billing in the Clerk Dashboard to accept card payments.
          </p>
        )}
      </div>

      {/* Download all data */}
      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-white/70" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Download all data
          </h4>
        </div>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed -mt-1">
          Export your full workspace — properties, leases, payments, documents metadata, home life,
          and settings. Your data leaves with you.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button type="button" onClick={exportBackup} className={actionCls}>
            <Download className="w-3.5 h-3.5 text-white/70" />
            Full export
          </button>
          <button type="button" onClick={exportEncrypted} className={actionCls}>
            <Lock className="w-3.5 h-3.5 text-white/70" />
            Encrypted
          </button>
          <label className={actionCls + " cursor-pointer"}>
            <Upload className="w-3.5 h-3.5 text-white/70" />
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={importBackup}
              className="hidden"
            />
          </label>
          <button type="button" onClick={downloadPdf} className={actionCls}>
            <FileDown className="w-3.5 h-3.5 text-white/70" />
            PDF report
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-white/70" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            How your data is protected
          </h4>
        </div>
        <ul className="flex flex-col gap-1.5 text-[10px] text-[#9CA3AF] leading-relaxed">
          <li className="flex gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/40" />
            Account-based access with a private workspace vault.
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/40" />
            Encrypted backups use AES-256-GCM (PBKDF2). Lose the passphrase and the file cannot be
            opened.
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/40" />
            Ask Your Data answers from your records without requiring an external API key for core
            use.
          </li>
        </ul>
      </div>
    </div>
  );
}
