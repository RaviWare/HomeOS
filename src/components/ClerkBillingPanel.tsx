/**
 * Real Clerk Billing UI: PricingTable checkout + subscription management.
 * Renders only when Clerk publishable key is present (parent wraps in ClerkProvider).
 */
import React, { useEffect, useRef } from "react";
import { PricingTable, useAuth, useClerk, useUser } from "@clerk/react";
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { homeOsClerkAppearance } from "../clerkTheme";
import {
  clearCheckoutPreference,
  isPaidPlan,
  planLabel,
  resolvePlanFromHas,
  type HomeOsPlan,
} from "../billing";
import type { UserSession } from "../types";
import { updateAccountProfile } from "../auth";

interface ClerkBillingPanelProps {
  session: UserSession;
  onUpdateSession: (s: UserSession) => void;
  /** Compact mode for settings; full for pricing page */
  variant?: "settings" | "pricing";
  className?: string;
}

const pricingTableAppearance = {
  ...homeOsClerkAppearance,
  elements: {
    ...homeOsClerkAppearance.elements,
    // Pricing table needs visible layout (auth shells hide headers)
    header: "!block",
    headerTitle: "!text-white !text-lg !font-black",
    headerSubtitle: "!text-[#8E8E93] !text-sm",
    footer: "!block",
    card: "!bg-[#0A0A0C] !border !border-[#1F1F23] !rounded-2xl !shadow-none",
    cardBox: "!bg-transparent !shadow-none",
  },
};

export default function ClerkBillingPanel({
  session,
  onUpdateSession,
  variant = "settings",
  className = "",
}: ClerkBillingPanelProps) {
  const { isLoaded, isSignedIn, has } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const lastSynced = useRef<string | null>(null);

  // Mirror Clerk paid plan into local session + account registry (UI only)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !has) return;
    const resolved = resolvePlanFromHas(has);
    if (!resolved) return;

    const key = `${user?.id || ""}:${resolved}`;
    if (lastSynced.current === key) return;

    // Upgrade local mirror when Clerk reports a paid plan
    if (isPaidPlan(resolved) && session.plan !== resolved) {
      lastSynced.current = key;
      const next: UserSession = {
        ...session,
        plan: resolved,
        planStartedAt: session.planStartedAt || new Date().toISOString(),
        planExpiresAt: undefined,
        autoRenew: true,
      };
      onUpdateSession(next);
      if (session.accountId) {
        updateAccountProfile(session.accountId, { plan: resolved });
      }
      clearCheckoutPreference();
      return;
    }

    // Paid local plan but Clerk free (cancelled / expired)
    if (isPaidPlan(session.plan) && resolved === "trial") {
      lastSynced.current = key;
      const next: UserSession = {
        ...session,
        plan: "trial",
        planExpiresAt: undefined,
      };
      onUpdateSession(next);
      if (session.accountId) {
        updateAccountProfile(session.accountId, { plan: "trial" });
      }
      return;
    }

    lastSynced.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on plan claim change only
  }, [isLoaded, isSignedIn, has, user?.id, session.plan, session.accountId]);

  const openBillingProfile = () => {
    try {
      if (clerk?.openUserProfile) {
        clerk.openUserProfile();
      }
    } catch {
      /* ignore */
    }
  };

  if (!isLoaded) {
    return (
      <div
        className={`rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-6 flex items-center justify-center gap-2 text-[#8E8E93] text-sm ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading billing…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        className={`rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-5 ${className}`}
      >
        <p className="text-sm font-bold text-white mb-1">Sign in to checkout</p>
        <p className="text-[12px] text-[#8E8E93] font-medium leading-relaxed">
          HomeOS uses Clerk Billing for card checkout. Create an account or sign in,
          then choose Personal, Pro, or Team — payment is processed securely (dev gateway
          in development; Stripe in production).
        </p>
      </div>
    );
  }

  const clerkPlan = resolvePlanFromHas(has) as HomeOsPlan | null;
  const displayPlan = isPaidPlan(clerkPlan)
    ? clerkPlan
    : isPaidPlan(session.plan)
      ? session.plan
      : "trial";

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {variant === "settings" && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
              Active plan (Clerk)
            </p>
            <p className="text-sm font-black text-white mt-1">
              {planLabel(displayPlan)}
            </p>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
              {isPaidPlan(displayPlan)
                ? "Paid subscription managed by Clerk"
                : "Trial / free — upgrade below to subscribe"}
            </p>
          </div>
          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3.5 flex flex-col justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                Payment methods & invoices
              </p>
              <p className="text-[11px] text-[#8E8E93] font-medium mt-1.5 leading-snug">
                Cards, invoices, and cancel/renew live in your Clerk account profile.
              </p>
            </div>
            <button
              type="button"
              onClick={openBillingProfile}
              className="mt-3 inline-flex items-center justify-center gap-1.5 bg-[#121215] hover:bg-[#1a1a1f] border border-[#1F1F23] text-white py-2 rounded-xl text-[11px] font-bold transition-all"
            >
              <CreditCard className="w-3.5 h-3.5 text-white/70" />
              Manage billing
              <ExternalLink className="w-3 h-3 text-white/40" />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-3 sm:p-4 overflow-x-auto">
        {variant === "settings" && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45 mb-3 px-1">
            Change plan · real checkout
          </p>
        )}
        <PricingTable
          for="user"
          newSubscriptionRedirectUrl="/app/settings"
          appearance={pricingTableAppearance}
          fallback={
            <div className="flex items-center justify-center gap-2 py-10 text-[#8E8E93] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading plans…
            </div>
          }
        />
      </div>

      <p className="text-[10px] text-[#6B7280] font-medium leading-relaxed flex items-start gap-1.5 px-0.5">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/40" />
        Checkout is handled by Clerk Billing. Development uses Clerk&apos;s test payment
        gateway; production requires a connected Stripe account in the Clerk Dashboard.
        HomeOS never stores your card number.
      </p>
    </div>
  );
}
