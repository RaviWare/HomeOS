import React, { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import Section from "../components/Section";

interface FaqPageProps {
  onLaunch: () => void;
}

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan includes a 14-day free trial with full product access. Cancel anytime during the trial and you will not be charged.",
  },
  {
    q: "How much does HomeOS cost?",
    a: "Personal starts at $4.99/month, Pro at $14.99/month, and Team at $39.99/month (USD). Annual billing saves 30% on Personal & Pro, and 40% on Team. See the Pricing page for the full breakdown.",
  },
  {
    q: "Where is my data stored?",
    a: "Your workspace is kept private with encryption in transit and at rest. You can access HomeOS from the devices you use  — your home history is not sold as advertising data.",
  },
  {
    q: "Do I need an AI API key?",
    a: "No for core use. Ask Your Data works on your workspace records without a key. Optional cloud AI features only apply if you enable a provider key.",
  },
  {
    q: "Do I start with an empty workspace?",
    a: "Yes by default. During setup you can start clean and add your real homes, payments, and life data. You control what lives in your vault.",
  },
  {
    q: "Can landlords and tenants both use it?",
    a: "Yes. During setup pick a path — home renter, live-in owner, long-term rentals, short-stay host (Airbnb/homestay), society/HOA, builder, multi-property business, or a custom role. The deck and modules adapt; you can rearrange them anytime.",
  },
  {
    q: "Do you offer team or business plans?",
    a: "Yes. Team is designed for managers and small firms (multiple seats). Contact us for larger rollouts or custom invoicing.",
  },
  {
    q: "What should I not store?",
    a: "Avoid government IDs, full bank account numbers, signatures, and unredacted identity or title scans. Prefer amounts, dates, categories, and nicknames.",
  },
  {
    q: "How do I cancel or wipe data?",
    a: "Manage billing from your account settings (or contact support). Delete workspace data from Vault Settings, or request deletion via hello@homeos.pro.",
  },
];

export default function FaqPage({ onLaunch }: FaqPageProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="FAQ"
        title="Straight answers about HomeOS."
        subtitle="Still curious? Create your account, or reach us via Contact."
      >
        <div className="max-w-3xl flex flex-col gap-2">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="mkt-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-black text-white tracking-tight">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8E8E93] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 animate-fadeIn">
                    <p className="text-sm text-[#8E8E93] leading-relaxed font-medium border-t border-[#1F1F23] pt-4">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 mkt-card p-8 text-center">
          <h3 className="text-xl font-black text-white tracking-tight">Ready to run your home OS?</h3>
          <p className="text-sm text-[#8E8E93] mt-2 max-w-md mx-auto">
            Full access to the Command Deck and hubs during your trial. Upgrade only if it becomes part of how you manage home life.
          </p>
          <button type="button" onClick={onLaunch} className="mkt-btn-primary text-sm px-6 py-3.5 mt-6">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>
    </div>
  );
}
