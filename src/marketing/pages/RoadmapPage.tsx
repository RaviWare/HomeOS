import React from "react";
import { ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import Section from "../components/Section";

interface RoadmapPageProps {
  onLaunch: () => void;
}

const ITEMS = [
  {
    status: "done" as const,
    title: "Command Deck & lifetime stats",
    body: "Portfolio snapshot, rent growth, expenses, timeline, weather widget.",
  },
  {
    status: "done" as const,
    title: "Full record hubs",
    body: "Properties, leases, payments, utilities, maintenance, documents, finances.",
  },
  {
    status: "done" as const,
    title: "Ask Your Data",
    body: "Natural-language aggregates and search over your encrypted workspace without a key.",
  },
  {
    status: "done" as const,
    title: "Home Life modules",
    body: "Income, side hustles, assets, household chores, and travel budgets.",
  },
  {
    status: "done" as const,
    title: "Production auth & workspace setup",
    body: "Account sign-up, sign-in, and guided workspace configuration.",
  },
  {
    status: "now" as const,
    title: "Cloud production & billing",
    body: "Encrypted workspaces, trials, and USD plans for Personal, Pro, and Team.",
  },
  {
    status: "next" as const,
    title: "Deeper multi-device & team sync",
    body: "Richer collaboration, seats, and real-time portfolio coordination for Team plans.",
  },
  {
    status: "next" as const,
    title: "Export center",
    body: "Excel, PDF, tax packs, and optional Telegram delivery for reports.",
  },
  {
    status: "next" as const,
    title: "Multiple workspaces",
    body: "Multi-vault switcher with clean isolation between contexts.",
  },
  {
    status: "next" as const,
    title: "Richer document preview",
    body: "Privacy-aware file handling and previews across devices.",
  },
];

const badge = {
  done: {
    icon: CheckCircle2,
    label: "Shipped",
    className: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
  },
  now: {
    icon: Clock,
    label: "In progress",
    className: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  },
  next: {
    icon: Circle,
    label: "Planned",
    className: "text-[#8E8E93] bg-white/5 border-white/10",
  },
};

export default function RoadmapPage({ onLaunch }: RoadmapPageProps) {
  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="Roadmap"
        title="Honest about where we are — and where we are going."
        subtitle="What is live today versus what we are building next."
      >
        <div className="flex flex-col gap-3">
          {ITEMS.map((item) => {
            const meta = badge[item.status];
            const Icon = meta.icon;
            return (
              <div key={item.title} className="mkt-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-black text-white tracking-tight">{item.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.className}`}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button type="button" onClick={onLaunch} className="mkt-btn-primary text-sm px-6 py-3.5">
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>
    </div>
  );
}
