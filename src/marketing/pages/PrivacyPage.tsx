import React from "react";
import Section from "../components/Section";

const SECTIONS = [
  {
    h: "Overview",
    p: "HomeOS is privacy-first. This policy explains what we collect on the marketing site and in the product, how data is stored, how cookies and similar technologies work, and your rights under laws such as GDPR (EU/EEA/UK) and CCPA/CPRA (California and similar US state laws).",
  },
  {
    h: "Product data",
    p: "Core home records (housing, payments, Home Life data, document metadata, and related workspace data) are stored in your HomeOS workspace. Access is tied to your account and plan.",
  },
  {
    h: "Account & billing",
    p: "When you start a trial or subscribe, we process the minimum information needed for authentication, billing, and service delivery — such as email, plan, trial status, and payment status via our payment provider. We do not sell your home history.",
  },
  {
    h: "Cookies & similar technologies",
    p: "We use strictly necessary cookies and local storage for security, session, and consent. Optional categories — Preferences, Analytics, and Marketing — are off by default until you opt in via the cookie banner or Cookie preferences (footer). You can change choices anytime. Essential storage cannot be disabled without breaking the service.",
  },
  {
    h: "Categories we use",
    p: "Necessary: auth, security, consent record. Preferences: UI settings you choose. Analytics: aggregate product usage if you opt in. Marketing: campaign measurement only if you opt in. We do not sell personal information as defined under CCPA/CPRA. Where “share” for cross-context behavioral advertising would apply, we treat Marketing as opt-in only.",
  },
  {
    h: "Legal bases (GDPR)",
    p: "Necessary processing: legitimate interests / contract performance (run the product you request). Optional analytics/marketing: consent. You may withdraw consent via Cookie preferences without affecting essential service delivery.",
  },
  {
    h: "Your rights",
    p: "Depending on your region you may have rights to access, correct, delete, port, restrict, or object to certain processing, and to lodge a complaint with a supervisory authority. US residents may have rights to know, delete, correct, and opt out of sale/share of personal information. Contact us to exercise rights; verify identity when required.",
  },
  {
    h: "Retention",
    p: "Account and workspace data are retained while your account is active and as needed for legal, security, and billing purposes. Consent preferences are stored until you change them or clear site data. You may export or wipe workspace data from product settings where available.",
  },
  {
    h: "What we ask you not to store",
    p: "Avoid government IDs, full bank account numbers, signatures, and unredacted identity scans. Prefer amounts, dates, categories, and nicknames.",
  },
  {
    h: "Contact",
    p: "Privacy questions: hello@homeos.pro. Cookie preferences: use the banner or “Cookie preferences” in the site footer. Last updated 9 July 2026.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="Last updated 9 July 2026. Data minimization, encrypted workspace, and explicit cookie choices for EU and US users."
      >
        <div className="max-w-3xl flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <article key={s.h} className="mkt-card p-5">
              <h3 className="text-sm font-black text-white mb-2">{s.h}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed font-medium">{s.p}</p>
            </article>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("homeos-open-cookie-prefs"))}
            className="mkt-btn-ghost text-sm px-4 py-3 self-start min-h-[44px]"
          >
            Open cookie preferences
          </button>
        </div>
      </Section>
    </div>
  );
}
