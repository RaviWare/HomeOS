import React from "react";
import {
  ArrowRight,
  Cloud,
  Database,
  EyeOff,
  Lock,
  Server,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import Section from "../components/Section";

interface SecurityPageProps {
  onLaunch: () => void;
}

const PILLARS = [
  {
    icon: Cloud,
    title: "Secure infrastructure",
    body: "Your workspace is available securely across devices with modern platform security practices.",
  },
  {
    icon: Lock,
    title: "Encryption in transit & at rest",
    body: "Data is protected with encryption as it moves over the network and when stored in your workspace. Your home history is not treated as marketing inventory.",
  },
  {
    icon: EyeOff,
    title: "Data minimization",
    body: "Prefer amounts, dates, categories, and nicknames over full addresses, ID numbers, or original document scans. Less sensitive data means less harm if anything ever goes wrong.",
  },
  {
    icon: Server,
    title: "Access you control",
    body: "Your workspace is tied to your account. Export what you need, delete what you do not, and contact us for privacy requests at any time.",
  },
  {
    icon: Database,
    title: "No selling your data",
    body: "HomeOS does not sell your rental records. Product analytics, if enabled, are limited and never include the contents of your private vault as training material for sale.",
  },
  {
    icon: ShieldCheck,
    title: "Clear security posture",
    body: "We design for least privilege, careful handling of documents, and honest limits. Security is a continuous practice — not a checkbox on a landing page.",
  },
];

const CLASSIFICATION = [
  {
    tone: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
    label: "Green — safe to store",
    items: "Rent amounts, due dates, term lengths, escalation %, expense categories, custom labels.",
  },
  {
    tone: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
    label: "Yellow — mask when possible",
    items: "Property nicknames, last digits of accounts, display names you choose.",
  },
  {
    tone: "border-red-500/30 bg-red-500/10 text-red-400",
    label: "Red — avoid uploading",
    items: "Government IDs, full account numbers, signatures, and original title or identity scans.",
  },
];

export default function SecurityPage({ onLaunch }: SecurityPageProps) {
  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="Security & privacy"
        title="Private workspace. Privacy-first product."
        subtitle="HomeOS keeps your home records in a private workspace — multi-device access without treating your history as ad fuel."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="mkt-card p-5 flex flex-col gap-3">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white w-fit">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">{p.title}</h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">{p.body}</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow="Data classification"
        title="What belongs in the vault — and what does not."
        className="border-t border-[#1F1F23]"
      >
        <div className="flex flex-col gap-3">
          {CLASSIFICATION.map((c) => (
            <div key={c.label} className={`rounded-2xl border p-5 ${c.tone}`}>
              <h4 className="text-xs font-black uppercase tracking-wider mb-2">{c.label}</h4>
              <p className="text-sm font-medium opacity-90 leading-relaxed">{c.items}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 mkt-card p-5 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black text-white">Shared responsibility</h4>
            <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed font-medium">
              Use a strong password, enable available account protections, and avoid storing high-risk
              identity documents. Report security concerns to hello@homeos.pro.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button type="button" onClick={onLaunch} className="mkt-btn-primary text-sm px-6 py-3.5">
            Start 14-day free trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>
    </div>
  );
}
