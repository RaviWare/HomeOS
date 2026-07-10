import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Zap,
  Home,
  Users,
  Briefcase,
  Gift,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { PricingTable, useAuth } from "@clerk/react";
import Section from "../components/Section";
import TestimonialMarquee from "../components/TestimonialMarquee";
import type { MarketingPage } from "../types";
import { homeOsClerkAppearance } from "../../clerkTheme";
import {
  writeCheckoutPreference,
  type PaidPlanId,
} from "../../billing";

interface PricingPageProps {
  onLaunch: () => void;
  onNavigate?: (page: MarketingPage) => void;
}

type Billing = "monthly" | "annual";

const ANNUAL_BONUS_MONTHS = 3;

const PLANS = [
  {
    id: "personal" as const,
    name: "Personal",
    tagline: "Individuals & households",
    monthly: 4.99,
    annualDiscount: 0.3,
    blurb: "Full HomeOS for your home — housing, money, life modules, vault.",
    cta: "Get started",
    featured: false,
    icon: Home,
    limits: "1 workspace · up to 5 properties",
    features: [
      "Command Deck + Home Life",
      "Income, assets, chores, budgets",
      "Property, lease & payment hubs",
      "Utilities & maintenance",
      "Document vault",
      "Ask Your Data",
      "Exports · CSV / Excel / PDF",
      "Immutable activity log",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    tagline: "Landlords & power users",
    monthly: 14.99,
    annualDiscount: 0.3,
    blurb: "Unlimited housing scale, deeper finance tools, priority updates.",
    cta: "Get started",
    featured: true,
    icon: Briefcase,
    limits: "1 workspace · unlimited properties",
    features: [
      "Everything in Personal",
      "Unlimited properties & leases",
      "Expense & tax lab",
      "Finance hub",
      "Document OCR hooks",
      "Priority feature updates",
      "Email support",
    ],
  },
  {
    id: "team" as const,
    name: "Team",
    tagline: "Managers & small firms",
    monthly: 39.99,
    annualDiscount: 0.4,
    blurb: "Seats, roles, shared workflows — grow without losing the audit trail.",
    cta: "Get started",
    featured: false,
    icon: Users,
    limits: "Up to 5 seats · unlimited properties",
    features: [
      "Everything in Pro",
      "Up to 5 team seats",
      "Role-aware layouts",
      "Shared operational workflows",
      "Onboarding assistance",
      "Priority support",
      "Custom invoicing on request",
    ],
  },
];

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function annualPerMonth(monthly: number, discount: number) {
  return Math.round(monthly * (1 - discount) * 100) / 100;
}

function annualTotal(monthly: number, discount: number) {
  return Math.round(monthly * 12 * (1 - discount) * 100) / 100;
}

const pricingTableAppearance = {
  ...homeOsClerkAppearance,
  elements: {
    ...homeOsClerkAppearance.elements,
    header: "!block",
    headerTitle: "!text-white !text-lg !font-black",
    headerSubtitle: "!text-[#8E8E93] !text-sm",
    footer: "!block",
    card: "!bg-[#0A0A0C] !border !border-[#1F1F23] !rounded-2xl !shadow-none",
    cardBox: "!bg-transparent !shadow-none",
  },
};

function ClerkCheckoutSection({
  isSignedIn,
  onLaunch,
}: {
  isSignedIn: boolean;
  onLaunch: () => void;
}) {
  const checkoutRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={checkoutRef} id="checkout" className="scroll-mt-24">
      <div className="rounded-2xl border border-white/15 bg-[#0A0A0C] p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Secure checkout · Clerk Billing
            </p>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isSignedIn ? "Choose a plan and pay" : "Sign in, then subscribe"}
            </h3>
            <p className="text-[12px] text-[#8E8E93] font-medium mt-1.5 max-w-xl leading-relaxed">
              Card checkout is processed by Clerk (test gateway in development; Stripe in
              production). Plans below match Personal $4.99 · Pro $14.99 · Team $39.99.
            </p>
          </div>
          {!isSignedIn && (
            <button
              type="button"
              onClick={onLaunch}
              className="mkt-btn-primary text-sm px-4 py-3 min-h-[44px] shrink-0"
            >
              Sign in to checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSignedIn ? (
          <PricingTable
            for="user"
            newSubscriptionRedirectUrl="/app/settings"
            appearance={pricingTableAppearance}
            fallback={
              <p className="text-center text-sm text-[#8E8E93] py-12 font-medium">
                Loading live plans…
              </p>
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[#1F1F23] bg-black/40 px-4 py-10 text-center">
            <p className="text-sm font-bold text-white mb-2">
              Checkout unlocks after you create an account
            </p>
            <p className="text-[12px] text-[#8E8E93] font-medium max-w-md mx-auto leading-relaxed">
              We no longer grant paid plans from a fake “continue” button. Sign up for the
              14-day trial, then complete card checkout here or in Settings → Plan &amp; billing.
            </p>
            <button
              type="button"
              onClick={onLaunch}
              className="mkt-btn-primary text-sm px-5 py-3 mt-5 min-h-[44px]"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-[10px] text-[#6B7280] text-center font-medium mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          HomeOS never stores card numbers · cancel or change plan anytime in account billing
        </p>
      </div>
    </div>
  );
}

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function useClerkSignedIn(): boolean {
  // Must only be called when ClerkProvider is mounted
  const { isLoaded, isSignedIn } = useAuth();
  return Boolean(isLoaded && isSignedIn);
}

function PricingPageBody({
  onLaunch,
  onNavigate,
  signedIn,
}: PricingPageProps & { signedIn: boolean }) {
  const [billing, setBilling] = useState<Billing>("monthly");

  const scrollToCheckout = (planId?: PaidPlanId) => {
    if (planId) {
      writeCheckoutPreference({
        plan: planId,
        billing,
        bonusMonths: billing === "annual" ? ANNUAL_BONUS_MONTHS : 0,
      });
    }
    const el = document.getElementById("checkout");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!signedIn) onLaunch();
  };

  useEffect(() => {
    // Deep-link /pricing#checkout
    if (window.location.hash === "#checkout") {
      requestAnimationFrame(() => {
        document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  return (
    <div className="animate-pageEnter">
      <Section
        eyebrow="Pricing"
        title="Simple USD plans for every home."
        subtitle="Personal from $4.99/mo. Annual saves 30–40%. Real card checkout via Clerk Billing. New accounts get a 14-day full trial before you pay."
        align="center"
      >
        {/* Billing toggle — marketing comparison only; Clerk table has its own period toggle */}
        <div className="flex flex-col items-center gap-2.5 mb-8">
          <div className="inline-flex p-1 rounded-xl border border-[#1F1F23] bg-[#0A0A0C]">
            {(
              [
                { id: "monthly" as const, label: "Monthly" },
                { id: "annual" as const, label: "Annual" },
              ] as const
            ).map((opt) => {
              const active = billing === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBilling(opt.id)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all min-h-[40px] ${
                    active ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  {opt.label}
                  {opt.id === "annual" && (
                    <span
                      className={`ml-1.5 text-[9px] font-black ${
                        active ? "text-black/60" : "text-white/50"
                      }`}
                    >
                      save more
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] font-bold text-white/55 flex items-center gap-1.5 text-center px-2">
            <Gift className="w-3.5 h-3.5 shrink-0 text-white/70" />
            {billing === "annual"
              ? "Annual pricing below · complete payment in secure checkout"
              : "Flip to annual for discounted yearly rates"}
          </p>
        </div>

        {/* Marketing plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map((p, i) => {
            const isAnnual = billing === "annual";
            const perMonth = isAnnual
              ? annualPerMonth(p.monthly, p.annualDiscount)
              : p.monthly;
            const yearTotal = annualTotal(p.monthly, p.annualDiscount);
            const discountPct = Math.round(p.annualDiscount * 100);
            const Icon = p.icon;

            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`flex flex-col h-full rounded-2xl border p-5 sm:p-6 relative overflow-hidden ${
                  p.featured
                    ? "border-white/30 bg-[#0A0A0C] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.45)]"
                    : "border-[#1F1F23] bg-[#0A0A0C]"
                }`}
              >
                <div className="h-7 flex items-center justify-between gap-2 mb-3">
                  {p.featured ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-white text-black px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      Most popular
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8E8E93]">
                      <Icon className="w-3 h-3" />
                      {p.name}
                    </span>
                  )}
                  {isAnnual && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md shrink-0">
                      −{discountPct}%
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3.5 flex-1 min-h-0">
                  <div>
                    {p.featured && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/45 block mb-1">
                        {p.name}
                      </span>
                    )}
                    <p className="text-xs font-bold text-[#8E8E93]">{p.tagline}</p>
                    <div className="flex items-end gap-1.5 flex-wrap mt-3">
                      {isAnnual && (
                        <span className="text-base font-bold text-[#6B7280] line-through mb-1">
                          {formatUsd(p.monthly)}
                        </span>
                      )}
                      <span className="text-4xl font-black text-white tracking-tight leading-none tabular-nums">
                        {formatUsd(perMonth)}
                      </span>
                      <span className="text-xs font-bold text-[#8E8E93] mb-1">/ mo</span>
                    </div>
                    <p className="text-[11px] text-[#8E8E93] font-medium mt-2 leading-relaxed">
                      {isAnnual ? (
                        <>
                          {formatUsd(yearTotal)} / year
                          <span className="text-white/70 font-bold">
                            {" "}
                            · save {discountPct}%
                          </span>
                        </>
                      ) : (
                        <>Billed monthly · annual saves {discountPct}%</>
                      )}
                    </p>
                  </div>

                  <p className="text-[12px] text-[#A1A1AA] leading-relaxed font-medium">
                    {p.blurb}
                  </p>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 border border-[#1F1F23] rounded-lg px-3 py-2 bg-black/40">
                    {p.limits}
                  </div>

                  <ul className="flex flex-col gap-2 flex-1">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-[12px] text-white font-semibold"
                      >
                        <Check className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1F1F23]">
                  <button
                    type="button"
                    onClick={() => scrollToCheckout(p.id)}
                    className={
                      p.featured
                        ? "mkt-btn-primary text-sm px-4 py-3.5 w-full min-h-[48px]"
                        : "mkt-btn-ghost text-sm px-4 py-3.5 w-full min-h-[48px]"
                    }
                  >
                    {signedIn ? "Checkout" : p.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-4 sm:p-5 max-w-3xl mx-auto">
          <h4 className="text-[10px] font-black text-white/50 uppercase tracking-wider mb-3 text-center">
            Annual savings
          </h4>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            {PLANS.map((p) => {
              const saved = Math.round(p.monthly * 12 * p.annualDiscount * 100) / 100;
              return (
                <div
                  key={p.id}
                  className="bg-black/40 border border-[#1F1F23] rounded-xl p-2.5 sm:p-3"
                >
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#8E8E93] uppercase block">
                    {p.name}
                  </span>
                  <span className="text-sm font-black text-white block mt-1">
                    {Math.round(p.annualDiscount * 100)}% off
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-white/70 font-bold block mt-0.5">
                    Save {formatUsd(saved)}/yr
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-4xl mx-auto text-left">
          {[
            {
              t: "14-day free trial",
              d: "Full access while you evaluate. Pay only when you subscribe via secure checkout.",
            },
            {
              t: "Real card payments",
              d: "Clerk Billing + Stripe (production). No fake localStorage plan upgrades.",
            },
            {
              t: "You control renewal",
              d: "Manage plan, invoices, and cancel in Settings → Plan & billing anytime.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-4">
              <h4 className="text-xs font-black text-white mb-1">{c.t}</h4>
              <p className="text-[11px] text-[#8E8E93] leading-relaxed font-medium">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Live Clerk PricingTable checkout */}
        <div className="mt-10">
          <ClerkCheckoutSection isSignedIn={signedIn} onLaunch={onLaunch} />
        </div>
      </Section>

      <section className="py-10 sm:py-14 border-t border-[#1F1F23] -mx-3 sm:-mx-6 px-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 mb-6 sm:mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">
            Social proof
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Households and operators already running HomeOS
          </h2>
          <p className="mt-2 text-sm text-[#8E8E93] font-medium max-w-xl mx-auto">
            Thirty-two voices across renters, landlords, freelancers, and teams — same product, same
            vault.
          </p>
        </div>
        <TestimonialMarquee />
      </section>

      <div className="py-8 sm:py-10 text-center">
        <button
          type="button"
          onClick={onLaunch}
          className="mkt-btn-primary text-sm px-6 py-3.5 min-h-[48px]"
        >
          Start free trial
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[11px] text-[#6B7280] mt-4 max-w-lg mx-auto leading-relaxed">
          Prices in USD. Taxes may apply by region.{" "}
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate("contact");
              else window.location.pathname = "/contact";
            }}
            className="text-white font-bold underline underline-offset-2 hover:opacity-80 cursor-pointer"
          >
            Contact
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate("privacy");
              else window.location.pathname = "/privacy";
            }}
            className="text-white font-bold underline underline-offset-2 hover:opacity-80 cursor-pointer"
          >
            Privacy
          </button>
        </p>
      </div>
    </div>
  );
}

export default function PricingPage(props: PricingPageProps) {
  if (!CLERK_ENABLED) {
    return <PricingPageBody {...props} signedIn={false} />;
  }
  return <PricingPageWithClerk {...props} />;
}

function PricingPageWithClerk(props: PricingPageProps) {
  const signedIn = useClerkSignedIn();
  return <PricingPageBody {...props} signedIn={signedIn} />;
}
