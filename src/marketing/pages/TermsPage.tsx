import React from "react";
import Section from "../components/Section";

const SECTIONS = [
  {
    h: "Acceptance",
    p: "By accessing HomeOS (website or product) you agree to these Terms of Service. If you do not agree, do not use the service.",
  },
  {
    h: "What HomeOS is",
    p: "HomeOS is software for organizing home life — housing, money, assets, budgets, chores, and documents. It is a productivity tool — not a law firm, accountant, bank, or property manager.",
  },
  {
    h: "Accounts & plans",
    p: "New workspaces may start with a 14-day free trial of full product access. Paid plans are billed in USD per the pricing page and billing cycle you choose. Cancel during the trial to avoid charges. Post-trial fees are generally non-refundable except where required by law.",
  },
  {
    h: "Cookies & privacy",
    p: "Use of cookies and similar technologies is described in our Privacy Policy. Strictly necessary storage is required to operate the service. Optional categories require your consent where applicable (including GDPR/ePrivacy and CCPA/CPRA).",
  },
  {
    h: "Acceptable use",
    p: "You may not misuse the service, attempt unauthorized access, reverse engineer beyond applicable law, or store unlawful content. You are responsible for the accuracy of records you enter.",
  },
  {
    h: "No professional advice",
    p: "Analytics, document helpers, and assistants produce automated, general information only. They are not legal, tax, or financial advice. Confirm important decisions with a qualified professional.",
  },
  {
    h: "Availability & changes",
    p: "We aim for high availability but do not guarantee uninterrupted service. Features may change as the product evolves.",
  },
  {
    h: "Limitation of liability",
    p: "To the fullest extent permitted by law, HomeOS and its operators are not liable for indirect, incidental, or consequential damages arising from use of the product. Liability is limited to fees paid in the twelve months preceding the claim where applicable.",
  },
  {
    h: "Contact",
    p: "Questions: hello@homeos.pro. Last updated 9 July 2026.",
  },
];

export default function TermsPage() {
  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="The rules that govern use of the HomeOS website and product."
      >
        <div className="max-w-3xl flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <article key={s.h} className="mkt-card p-5">
              <h3 className="text-sm font-black text-white mb-2">{s.h}</h3>
              <p className="text-sm text-[#8E8E93] leading-relaxed font-medium">{s.p}</p>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
