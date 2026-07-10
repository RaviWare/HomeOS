/**
 * HomeOS SaaS billing helpers (Clerk Billing).
 *
 * Plans are configured in Clerk Dashboard / `clerk config` and rendered via
 * <PricingTable />. Local session.plan is a mirror for UI — never grant a
 * paid plan from localStorage alone.
 */

export type PaidPlanId = "personal" | "pro" | "team";
export type HomeOsPlan = "trial" | PaidPlanId;

export const PAID_PLAN_IDS: PaidPlanId[] = ["personal", "pro", "team"];

/** Clerk plan slugs — must match Dashboard → Billing → Plans */
export const CLERK_PLAN_SLUGS = {
  free: "free_user",
  personal: "personal",
  pro: "pro",
  team: "team",
} as const;

export const PLAN_DISPLAY: Record<
  HomeOsPlan,
  { name: string; tagline: string; monthlyUsd: number }
> = {
  trial: { name: "Trial", tagline: "14-day full access", monthlyUsd: 0 },
  personal: {
    name: "Personal",
    tagline: "Individuals & households",
    monthlyUsd: 4.99,
  },
  pro: {
    name: "Pro",
    tagline: "Landlords & power users",
    monthlyUsd: 14.99,
  },
  team: {
    name: "Team",
    tagline: "Managers & small firms",
    monthlyUsd: 39.99,
  },
};

/** Feature slugs attached to plans in Clerk (for has({ feature })) */
export const BILLING_FEATURES = {
  exports: "exports",
  unlimitedProperties: "unlimited_properties",
  expenseTax: "expense_tax",
  financeHub: "finance_hub",
  teamSeats: "team_seats",
  prioritySupport: "priority_support",
} as const;

export type HasFn = (params: { plan?: string; feature?: string }) => boolean;

/**
 * Resolve HomeOS plan from Clerk session entitlements.
 * Prefer highest tier when multiple plan claims exist.
 */
export function resolvePlanFromHas(has: HasFn | undefined | null): HomeOsPlan | null {
  if (!has) return null;
  try {
    if (has({ plan: CLERK_PLAN_SLUGS.team })) return "team";
    if (has({ plan: CLERK_PLAN_SLUGS.pro })) return "pro";
    if (has({ plan: CLERK_PLAN_SLUGS.personal })) return "personal";
    // free_user is the default free plan — treat as trial for HomeOS UI
    if (has({ plan: CLERK_PLAN_SLUGS.free })) return "trial";
  } catch {
    /* has() can throw if billing claims missing */
  }
  return null;
}

export function isPaidPlan(plan?: string | null): plan is PaidPlanId {
  return plan === "personal" || plan === "pro" || plan === "team";
}

export function planLabel(plan?: string | null): string {
  if (!plan) return "Trial";
  const key = plan as HomeOsPlan;
  return PLAN_DISPLAY[key]?.name ?? plan.replace(/^./, (c) => c.toUpperCase());
}

/** localStorage key kept only as a soft marketing preference (not payment proof) */
export const CHECKOUT_PREFERENCE_KEY = "homeos_checkout_intent";

export type CheckoutPreference = {
  plan?: string;
  billing?: "monthly" | "annual";
  bonusMonths?: number;
  at?: string;
  /** Marks that this is only a preference, not a paid grant */
  preferenceOnly?: boolean;
};

export function readCheckoutPreference(): CheckoutPreference | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_PREFERENCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutPreference;
  } catch {
    return null;
  }
}

export function clearCheckoutPreference() {
  try {
    localStorage.removeItem(CHECKOUT_PREFERENCE_KEY);
  } catch {
    /* ignore */
  }
}

export function writeCheckoutPreference(pref: CheckoutPreference) {
  try {
    localStorage.setItem(
      CHECKOUT_PREFERENCE_KEY,
      JSON.stringify({ ...pref, preferenceOnly: true, at: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}
