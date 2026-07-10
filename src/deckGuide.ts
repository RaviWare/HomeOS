/**
 * First-run Command Deck guide — progress, deep-links into Home Life, dismiss state.
 */

export type LifeIntentTab =
  | "overview"
  | "income"
  | "assets"
  | "chores"
  | "budgets"
  | "goals";

export interface LifeNavIntent {
  tab: LifeIntentTab;
  openAdd?: boolean;
}

export type GuideStepId =
  | "income"
  | "assets"
  | "property"
  | "lease"
  | "payment"
  | "goal";

const GUIDE_DISMISS_KEY = "rv_deck_guide_dismissed";
const GUIDE_STEP_KEY = "rv_deck_guide_step";
const LIFE_INTENT_KEY = "rv_life_nav_intent";

export function isGuideDismissed(): boolean {
  try {
    return localStorage.getItem(GUIDE_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGuideDismissed(dismissed: boolean) {
  try {
    if (dismissed) localStorage.setItem(GUIDE_DISMISS_KEY, "1");
    else localStorage.removeItem(GUIDE_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

export function loadGuideStep(): number {
  try {
    const n = parseInt(localStorage.getItem(GUIDE_STEP_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveGuideStep(step: number) {
  try {
    localStorage.setItem(GUIDE_STEP_KEY, String(Math.max(0, step)));
  } catch {
    /* ignore */
  }
}

/** Queue Home Life hub to open a tab (and optionally the add form). */
export function setLifeNavIntent(intent: LifeNavIntent) {
  try {
    sessionStorage.setItem(LIFE_INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

/** Open Property Hub add-home modal after navigation. */
export function setPropertyNavIntent(intent: { openAdd?: boolean }) {
  try {
    sessionStorage.setItem("rv_property_nav_intent", JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

/** Open Payments add-entry form after navigation. */
export function setPaymentNavIntent(intent: { openAdd?: boolean }) {
  try {
    sessionStorage.setItem("rv_payment_nav_intent", JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

export function consumeLifeNavIntent(): LifeNavIntent | null {
  try {
    const raw = sessionStorage.getItem(LIFE_INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LIFE_INTENT_KEY);
    const parsed = JSON.parse(raw) as LifeNavIntent;
    if (!parsed?.tab) return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface VaultSetupSnapshot {
  hasIncome: boolean;
  hasAssets: boolean;
  hasProperty: boolean;
  hasLease: boolean;
  hasPayment: boolean;
  hasGoal: boolean;
  incomeMonthly: number;
  assetValue: number;
}

export function vaultSetupFrom(
  homeLife: {
    incomes?: { active?: boolean; amountMonthly?: number }[];
    assets?: { value?: number }[];
    goals?: unknown[];
  } | null | undefined,
  propertiesLen: number,
  leasesLen: number,
  transactionsLen: number
): VaultSetupSnapshot {
  const incomes = homeLife?.incomes || [];
  const assets = homeLife?.assets || [];
  const goals = homeLife?.goals || [];
  const incomeMonthly = incomes
    .filter((i) => i.active !== false)
    .reduce((s, i) => s + (Number(i.amountMonthly) || 0), 0);
  const assetValue = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  return {
    hasIncome: incomes.length > 0,
    hasAssets: assets.length > 0,
    hasProperty: propertiesLen > 0,
    hasLease: leasesLen > 0,
    hasPayment: transactionsLen > 0,
    hasGoal: goals.length > 0,
    incomeMonthly,
    assetValue,
  };
}

/** True when the vault still needs core life setup (income or assets). */
export function needsCoreSetup(s: VaultSetupSnapshot): boolean {
  return !s.hasIncome || !s.hasAssets;
}

/** Empty-ish vault: almost nothing entered yet. */
export function isSparseVault(s: VaultSetupSnapshot): boolean {
  const done = [
    s.hasIncome,
    s.hasAssets,
    s.hasProperty,
    s.hasLease,
    s.hasPayment,
    s.hasGoal,
  ].filter(Boolean).length;
  return done < 2;
}

export function setupProgress(s: VaultSetupSnapshot): { done: number; total: number; pct: number } {
  const flags = [
    s.hasIncome,
    s.hasAssets,
    s.hasProperty,
    s.hasLease,
    s.hasPayment,
    s.hasGoal,
  ];
  const done = flags.filter(Boolean).length;
  const total = flags.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}
