import React from "react";
import { ArrowRight, Brain, Heart, ShieldCheck, Target } from "lucide-react";
import Section from "../components/Section";

interface AboutPageProps {
  onLaunch: () => void;
}

export default function AboutPage({ onLaunch }: AboutPageProps) {
  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="About"
        title="HomeOS is the operating system for your rental life."
        subtitle="We believe every renter and property professional deserves a private, structured record of homes, leases, payments, and documents — without handing their history to an ad network."
      >
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              title: "The problem",
              body: "Receipts get lost. Landlords change. Leases expire. Years of rent leave no usable timeline when you need proof, tax context, or simply peace of mind.",
            },
            {
              icon: Brain,
              title: "Our approach",
              body: "A Command Deck that feels like a product, not a spreadsheet: portfolio stats, hubs for every record type, and an assistant that answers from your own data.",
            },
            {
              icon: ShieldCheck,
              title: "Our principles",
              body: "Privacy-first. Clear USD pricing with a 14-day free trial. You control what you store and when you delete it.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="mkt-card p-5 flex flex-col gap-3">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white w-fit">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 mkt-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-white/50 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-black text-white tracking-tight">Built for people who keep receipts</h4>
              <p className="text-sm text-[#8E8E93] mt-1.5 max-w-xl leading-relaxed font-medium">
                HomeOS  is product-led and commercially supported so we can invest in
                security, sync, exports, and support — without selling your rental history.
              </p>
            </div>
          </div>
          <button type="button" onClick={onLaunch} className="mkt-btn-primary text-sm px-5 py-3.5 shrink-0">
            Start free trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>
    </div>
  );
}
