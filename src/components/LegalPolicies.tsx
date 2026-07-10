import React, { useState } from "react";
import {
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  EyeOff,
  Lock,
  Database,
  UserCheck,
  Cookie,
  Scale,
  ChevronDown,
} from "lucide-react";

type Section = { h: string; p: string; icon?: React.ComponentType<{ className?: string }> };

const UPDATED = "Last updated 10 July 2026";

/** Compact privacy — account/workspace model (no local-first positioning). */
const PRIVACY: Section[] = [
  {
    h: "In brief",
    icon: ShieldCheck,
    p: "HomeOS is privacy-first. We minimize what we collect, do not sell your home history, and keep workspace data tied to your account and plan. You control export, wipe, and cookie choices.",
  },
  {
    h: "What this covers",
    icon: Scale,
    p: "This policy applies to the HomeOS product and website: account authentication, workspace records, billing, cookies, and optional analytics. If a business self-hosts HomeOS, that operator is the data controller for its deployment.",
  },
  {
    h: "Product & workspace data",
    icon: Database,
    p: "Housing, payments, Home Life, documents metadata, and related vault data live in your private workspace. Access is gated by your signed-in account. Prefer amounts, dates, categories, and nicknames — avoid government IDs, full bank numbers, signatures, and unredacted identity scans.",
  },
  {
    h: "Account, auth & billing",
    icon: UserCheck,
    p: "We process the minimum needed to run the service: email, name, plan, trial status, and payment status via our payment provider when you subscribe. Authentication may use Clerk (or equivalent). We do not sell personal information under CCPA/CPRA.",
  },
  {
    h: "Security & encryption",
    icon: Lock,
    p: "Traffic is protected in transit (HTTPS). Passphrase-protected exports use AES-256-GCM (Web Crypto / PBKDF2). Optional vault passphrase and recovery codes strengthen export and settings controls. Protect your device and account password.",
  },
  {
    h: "Cookies & choices",
    icon: Cookie,
    p: "Necessary cookies and storage support security, session, and consent. Preferences, Analytics, and Marketing are off until you opt in via the cookie banner or footer “Cookie preferences.” Essential storage cannot be disabled without breaking the app.",
  },
  {
    h: "Analytics & models",
    icon: EyeOff,
    p: "Product analytics are opt-in and de-identified when enabled. We do not train models on your private vault contents. Improvements use synthetic data, public templates, and only opt-in aggregated signals.",
  },
  {
    h: "Your rights",
    icon: Scale,
    p: "Depending on region (e.g. GDPR, DPDP India, CCPA/CPRA) you may access, correct, delete, port, or object to certain processing. Export or wipe workspace data from Settings. Contact hello@homeos.pro for privacy requests.",
  },
  {
    h: "Not legal advice",
    icon: AlertTriangle,
    p: "Document tools and insights are convenience features, not legal, tax, or financial advice. Confirm important matters with a qualified professional.",
  },
];

const TERMS: Section[] = [
  {
    h: "Acceptance",
    p: "By using HomeOS you agree to these terms. If you do not agree, do not use the software.",
  },
  {
    h: "What HomeOS is",
    p: "HomeOS is software for organizing home, rental, and property information. It is a records tool — not a law firm, accountant, or property manager.",
  },
  {
    h: "No professional advice",
    p: "Legal readers, analytics, tax views, and the assistant produce automated general information that can be incomplete or wrong. Do not rely on them for important decisions without a qualified professional.",
  },
  {
    h: "Your responsibilities",
    p: "You are responsible for data accuracy, lawful use, device security, and backups. Do not upload content you lack rights to use, or highly sensitive identity documents the product is not designed to hold.",
  },
  {
    h: "Accounts, plans & data",
    p: "Access may require an account and plan. You can export or wipe workspace data from Settings. We are not responsible for loss from forgotten passphrases, device failure, or failed exports you initiate.",
  },
  {
    h: "Availability & third parties",
    p: "Hosted features, auth, billing, and third-party data (e.g. weather) are as-available and may change. Optional integrations run only when you connect them.",
  },
  {
    h: "Warranties & liability",
    p: "HomeOS is provided as-is and as-available, without warranties to the maximum extent allowed by law. Authors and operators are not liable for indirect or consequential damages or loss of data or profit arising from use of the product.",
  },
  {
    h: "Changes",
    p: "We may update these terms as the product evolves. Continued use after an update means you accept the revised terms. Questions: project repository or hello@homeos.pro.",
  },
];

const PILLS = [
  { icon: ShieldCheck, t: "Privacy-first", d: "Minimize · no sale of history" },
  { icon: Lock, t: "Encrypted exports", d: "AES-256-GCM · Web Crypto" },
  { icon: EyeOff, t: "Data care", d: "Low-sensitivity by design" },
  { icon: Database, t: "Your control", d: "Export · wipe · cookies" },
];

export default function LegalPolicies() {
  const [view, setView] = useState<"privacy" | "terms">("privacy");
  const [open, setOpen] = useState<number | null>(0);
  const data = view === "privacy" ? PRIVACY : TERMS;

  return (
    <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto p-3 sm:p-5 pb-24 safe-bottom animate-pageEnter">
      {/* Header */}
      <header className="rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-4 sm:p-5 mb-3 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-emerald-500/[0.05]" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
            {view === "privacy" ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ScrollText className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
              Legal · in-app
            </p>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {view === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </h1>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">{UPDATED}</p>
          </div>
        </div>

        <div className="relative mt-3 flex gap-1.5 p-0.5 rounded-xl border border-[#1F1F23] bg-black/40 w-full sm:w-auto sm:inline-flex">
          {(
            [
              { id: "privacy" as const, label: "Privacy" },
              { id: "terms" as const, label: "Terms" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setView(t.id);
                setOpen(0);
              }}
              className={`flex-1 sm:flex-none h-9 px-4 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
                view === t.id
                  ? "bg-white text-black"
                  : "text-[#8E8E93] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Compact pillars — privacy only */}
      {view === "privacy" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {PILLS.map(({ icon: Icon, t, d }) => (
            <div
              key={t}
              className="rounded-xl border border-[#1F1F23] bg-[#0A0A0C] p-2.5"
            >
              <Icon className="w-3.5 h-3.5 text-white/50 mb-1.5" />
              <p className="text-[11px] font-black text-white leading-tight">{t}</p>
              <p className="text-[9px] text-[#6B7280] font-medium mt-0.5 leading-snug">{d}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#FCD34D]/90 font-medium leading-snug">
          General information only — not legal, financial, or tax advice. Confirm important
          matters with a qualified professional.
        </p>
      </div>

      {/* Accordion sections — compact */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] overflow-hidden divide-y divide-[#1F1F23]">
        {data.map((sec, i) => {
          const isOpen = open === i;
          const Icon = sec.icon;
          return (
            <div key={sec.h}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-white/[0.02] cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-[10px] font-black font-mono text-white/30 w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {Icon ? (
                  <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
                ) : null}
                <span className="text-[13px] font-black text-white flex-1 min-w-0">
                  {sec.h}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-white/35 shrink-0 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 pl-11">
                  <p className="text-[12px] text-[#8E8E93] font-medium leading-relaxed">
                    {sec.p}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[#52525B] font-medium mt-4 leading-relaxed px-0.5">
        Self-hosted deployments: the operator is the data controller. This is a product notice,
        not a substitute for counsel. Cookie preferences: site footer or marketing banner.
      </p>
    </div>
  );
}
