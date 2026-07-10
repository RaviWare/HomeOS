/**
 * Home Life domain — income, assets, chores, travel/budgets.
 * Client-persisted via App localStorage keys.
 * Amounts may carry a native `currency`; aggregates convert to display currency.
 */
import {
  type CurrencyCode,
  convertAmount,
  isCurrencyCode,
  loadCurrencyPrefs,
  uniqueCurrencies,
} from "./currency";

export type IncomeType =
  | "Salary"
  | "Side hustle"
  | "Freelance"
  | "Investment"
  | "Rental income"
  | "Gift"
  | "Other";

export type AssetCategory =
  | "Property"
  | "Vehicle"
  | "Electronics"
  | "Investment"
  | "Furniture"
  | "Collectible"
  | "Other";

export type ChoreFrequency = "Daily" | "Weekly" | "Monthly" | "Once";
export type ChoreStatus = "Todo" | "Done" | "Overdue";
export type BudgetCategory =
  | "Travel"
  | "Groceries"
  | "Entertainment"
  | "Home"
  | "Health"
  | "Education"
  | "Side hustle"
  | "Other";

export interface IncomeStream {
  id: string;
  name: string;
  type: IncomeType;
  amountMonthly: number;
  /** Native currency of amountMonthly (defaults to display currency when missing). */
  currency?: CurrencyCode;
  active: boolean;
  notes?: string;
}

export interface AssetItem {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  /** Native currency of value. */
  currency?: CurrencyCode;
  purchaseDate?: string;
  notes?: string;
}

export interface ChoreItem {
  id: string;
  title: string;
  assignee: string;
  frequency: ChoreFrequency;
  dueDate: string;
  status: ChoreStatus;
  priority: "High" | "Medium" | "Low";
}

export interface BudgetEnvelope {
  id: string;
  name: string;
  category: BudgetCategory;
  limit: number;
  spent: number;
  currency?: CurrencyCode;
  period: "Monthly" | "Trip" | "Yearly";
}

/** Dream purchases & long-term savings accountability */
export type DreamGoalKind =
  | "Land"
  | "Bike"
  | "Car"
  | "Wedding"
  | "Retirement"
  | "Home"
  | "Education"
  | "Travel"
  | "Emergency fund"
  | "Custom";

export interface DreamGoal {
  id: string;
  name: string;
  kind: DreamGoalKind;
  /** Label when kind is Custom or user renames */
  customKindLabel?: string;
  targetAmount: number;
  savedAmount: number;
  currency?: CurrencyCode;
  targetDate?: string;
  monthlyContribution: number;
  notes?: string;
}

/** User-defined labels for categories not in the default lists */
export interface CustomOption {
  id: string;
  domain: "income_type" | "asset_category" | "budget_category" | "goal_kind";
  label: string;
}

export interface HomeLifeState {
  incomes: IncomeStream[];
  assets: AssetItem[];
  chores: ChoreItem[];
  budgets: BudgetEnvelope[];
  goals: DreamGoal[];
  customOptions: CustomOption[];
}

const today = () => new Date().toISOString().slice(0, 10);
const nid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function createDefaultHomeLife(): HomeLifeState {
  return {
    incomes: [
      {
        id: nid("inc"),
        name: "Primary salary",
        type: "Salary",
        amountMonthly: 5200,
        active: true,
        notes: "Take-home estimate",
      },
      {
        id: nid("inc"),
        name: "Weekend freelancing",
        type: "Side hustle",
        amountMonthly: 800,
        active: true,
      },
      {
        id: nid("inc"),
        name: "Content / digital products",
        type: "Side hustle",
        amountMonthly: 350,
        active: true,
      },
    ],
    assets: [
      {
        id: nid("ast"),
        name: "Primary residence equity (est.)",
        category: "Property",
        value: 85000,
        notes: "Rough net equity",
      },
      {
        id: nid("ast"),
        name: "Family vehicle",
        category: "Vehicle",
        value: 12000,
        purchaseDate: "2022-06-01",
      },
      {
        id: nid("ast"),
        name: "Work laptop + kit",
        category: "Electronics",
        value: 2400,
      },
      {
        id: nid("ast"),
        name: "Emergency fund",
        category: "Investment",
        value: 15000,
      },
    ],
    chores: [
      {
        id: nid("chr"),
        title: "Take out recycling",
        assignee: "You",
        frequency: "Weekly",
        dueDate: today(),
        status: "Todo",
        priority: "Medium",
      },
      {
        id: nid("chr"),
        title: "Deep clean kitchen",
        assignee: "Household",
        frequency: "Weekly",
        dueDate: today(),
        status: "Todo",
        priority: "High",
      },
      {
        id: nid("chr"),
        title: "Pay society / HOA dues",
        assignee: "You",
        frequency: "Monthly",
        dueDate: today(),
        status: "Todo",
        priority: "High",
      },
      {
        id: nid("chr"),
        title: "Water plants",
        assignee: "Family",
        frequency: "Daily",
        dueDate: today(),
        status: "Done",
        priority: "Low",
      },
    ],
    budgets: [
      {
        id: nid("bud"),
        name: "Summer trip fund",
        category: "Travel",
        limit: 3000,
        spent: 850,
        period: "Trip",
      },
      {
        id: nid("bud"),
        name: "Groceries",
        category: "Groceries",
        limit: 600,
        spent: 412,
        period: "Monthly",
      },
      {
        id: nid("bud"),
        name: "Home upgrades",
        category: "Home",
        limit: 400,
        spent: 120,
        period: "Monthly",
      },
      {
        id: nid("bud"),
        name: "Side hustle tools",
        category: "Side hustle",
        limit: 200,
        spent: 75,
        period: "Monthly",
      },
    ],
    goals: [
      {
        id: nid("goal"),
        name: "Wedding fund",
        kind: "Wedding",
        targetAmount: 25000,
        savedAmount: 6200,
        targetDate: "2028-06-01",
        monthlyContribution: 800,
        notes: "Venue + travel buffer",
      },
      {
        id: nid("goal"),
        name: "Land purchase",
        kind: "Land",
        targetAmount: 80000,
        savedAmount: 12000,
        targetDate: "2030-12-01",
        monthlyContribution: 1500,
      },
      {
        id: nid("goal"),
        name: "Retirement nest",
        kind: "Retirement",
        targetAmount: 500000,
        savedAmount: 48000,
        monthlyContribution: 1200,
        notes: "Long-horizon compounding",
      },
    ],
    customOptions: [],
  };
}

function lineCurrency(
  c: CurrencyCode | string | undefined,
  fallback: CurrencyCode
): CurrencyCode {
  return isCurrencyCode(c) ? c : fallback;
}

/** Migrate older localStorage payloads missing goals / customOptions / currency */
export function normalizeHomeLife(raw: Partial<HomeLifeState> | null | undefined): HomeLifeState {
  if (!raw || typeof raw !== "object") {
    return { incomes: [], assets: [], chores: [], budgets: [], goals: [], customOptions: [] };
  }
  const fallback = loadCurrencyPrefs().displayCurrency;
  const incomes = (Array.isArray(raw.incomes) ? raw.incomes : []).map((i) => ({
    ...i,
    currency: lineCurrency(i.currency, fallback),
  }));
  const assets = (Array.isArray(raw.assets) ? raw.assets : []).map((a) => ({
    ...a,
    currency: lineCurrency(a.currency, fallback),
  }));
  const budgets = (Array.isArray(raw.budgets) ? raw.budgets : []).map((b) => ({
    ...b,
    currency: lineCurrency(b.currency, fallback),
  }));
  const goals = (Array.isArray(raw.goals) ? raw.goals : []).map((g) => ({
    ...g,
    currency: lineCurrency(g.currency, fallback),
  }));
  return {
    incomes,
    assets,
    chores: Array.isArray(raw.chores) ? raw.chores : [],
    budgets,
    goals,
    customOptions: Array.isArray(raw.customOptions) ? raw.customOptions : [],
  };
}

/**
 * Summarize Home Life in a target display currency (converts mixed native amounts).
 */
export function summarizeHomeLife(
  state: HomeLifeState,
  displayCurrency?: CurrencyCode
) {
  const prefs = loadCurrencyPrefs();
  const to = displayCurrency || prefs.displayCurrency;
  const cv = (amount: number, from?: CurrencyCode | string) =>
    convertAmount(amount, lineCurrency(from, to), to, prefs);

  const monthlyIncome = state.incomes
    .filter((i) => i.active)
    .reduce((s, i) => s + cv(Number(i.amountMonthly) || 0, i.currency), 0);
  const sideIncome = state.incomes
    .filter((i) => i.active && (i.type === "Side hustle" || i.type === "Freelance"))
    .reduce((s, i) => s + cv(Number(i.amountMonthly) || 0, i.currency), 0);
  const totalAssets = state.assets.reduce(
    (s, a) => s + cv(Number(a.value) || 0, a.currency),
    0
  );
  const openChores = state.chores.filter((c) => c.status !== "Done").length;
  const budgetLimit = state.budgets.reduce(
    (s, b) => s + cv(Number(b.limit) || 0, b.currency),
    0
  );
  const budgetSpent = state.budgets.reduce(
    (s, b) => s + cv(Number(b.spent) || 0, b.currency),
    0
  );
  const travelBudgets = state.budgets.filter((b) => b.category === "Travel");
  const goals = state.goals || [];
  const goalsTarget = goals.reduce(
    (s, g) => s + cv(Number(g.targetAmount) || 0, g.currency),
    0
  );
  const goalsSaved = goals.reduce(
    (s, g) => s + cv(Number(g.savedAmount) || 0, g.currency),
    0
  );
  const goalsMonthly = goals.reduce(
    (s, g) => s + cv(Number(g.monthlyContribution) || 0, g.currency),
    0
  );

  const currenciesUsed = uniqueCurrencies([
    ...state.incomes.map((i) => i.currency),
    ...state.assets.map((a) => a.currency),
    ...goals.map((g) => g.currency),
    ...state.budgets.map((b) => b.currency),
  ]);

  /** Asset value by native currency (before conversion) for breakdown UI */
  const assetsByCurrency: { code: CurrencyCode; native: number; converted: number }[] = [];
  const assetMap: Record<string, { native: number; converted: number }> = {};
  state.assets.forEach((a) => {
    const code = lineCurrency(a.currency, to);
    const native = Number(a.value) || 0;
    if (!assetMap[code]) assetMap[code] = { native: 0, converted: 0 };
    assetMap[code].native += native;
    assetMap[code].converted += cv(native, code);
  });
  Object.entries(assetMap).forEach(([code, v]) => {
    assetsByCurrency.push({
      code: code as CurrencyCode,
      native: v.native,
      converted: v.converted,
    });
  });

  const incomeByCurrency: { code: CurrencyCode; native: number; converted: number }[] = [];
  const incMap: Record<string, { native: number; converted: number }> = {};
  state.incomes
    .filter((i) => i.active)
    .forEach((i) => {
      const code = lineCurrency(i.currency, to);
      const native = Number(i.amountMonthly) || 0;
      if (!incMap[code]) incMap[code] = { native: 0, converted: 0 };
      incMap[code].native += native;
      incMap[code].converted += cv(native, code);
    });
  Object.entries(incMap).forEach(([code, v]) => {
    incomeByCurrency.push({
      code: code as CurrencyCode,
      native: v.native,
      converted: v.converted,
    });
  });

  return {
    monthlyIncome,
    sideIncome,
    totalAssets,
    openChores,
    budgetLimit,
    budgetSpent,
    budgetLeft: budgetLimit - budgetSpent,
    travelCount: travelBudgets.length,
    goalsCount: goals.length,
    goalsTarget,
    goalsSaved,
    goalsMonthly,
    goalsPct: goalsTarget > 0 ? Math.min(100, Math.round((goalsSaved / goalsTarget) * 100)) : 0,
    displayCurrency: to,
    currenciesUsed,
    multiCurrency: currenciesUsed.length > 1 || (currenciesUsed[0] && currenciesUsed[0] !== to),
    assetsByCurrency,
    incomeByCurrency,
  };
}

export function newDreamGoal(partial?: Partial<DreamGoal>): DreamGoal {
  const fallback = loadCurrencyPrefs().displayCurrency;
  return {
    id: nid("goal"),
    name: partial?.name || "New dream goal",
    kind: partial?.kind || "Custom",
    customKindLabel: partial?.customKindLabel,
    targetAmount: partial?.targetAmount ?? 10000,
    savedAmount: partial?.savedAmount ?? 0,
    currency: lineCurrency(partial?.currency, fallback),
    targetDate: partial?.targetDate,
    monthlyContribution: partial?.monthlyContribution ?? 0,
    notes: partial?.notes,
  };
}

export const DREAM_GOAL_KINDS: DreamGoalKind[] = [
  "Land",
  "Bike",
  "Car",
  "Wedding",
  "Retirement",
  "Home",
  "Education",
  "Travel",
  "Emergency fund",
  "Custom",
];

export function goalKindLabel(g: DreamGoal): string {
  if (g.kind === "Custom" && g.customKindLabel) return g.customKindLabel;
  return g.kind;
}

export function optionsForDomain(
  state: HomeLifeState,
  domain: CustomOption["domain"],
  defaults: string[]
): string[] {
  const custom = (state.customOptions || [])
    .filter((o) => o.domain === domain)
    .map((o) => o.label);
  return [...defaults, ...custom.filter((l) => !defaults.includes(l))];
}

export function newIncome(partial?: Partial<IncomeStream>): IncomeStream {
  const fallback = loadCurrencyPrefs().displayCurrency;
  return {
    id: nid("inc"),
    name: partial?.name || "New income stream",
    type: partial?.type || "Side hustle",
    amountMonthly: partial?.amountMonthly ?? 0,
    currency: lineCurrency(partial?.currency, fallback),
    active: partial?.active ?? true,
    notes: partial?.notes,
  };
}

export function newAsset(partial?: Partial<AssetItem>): AssetItem {
  const fallback = loadCurrencyPrefs().displayCurrency;
  return {
    id: nid("ast"),
    name: partial?.name || "New asset",
    category: partial?.category || "Other",
    value: partial?.value ?? 0,
    currency: lineCurrency(partial?.currency, fallback),
    purchaseDate: partial?.purchaseDate || today(),
    notes: partial?.notes,
  };
}

export function newChore(partial?: Partial<ChoreItem>): ChoreItem {
  return {
    id: nid("chr"),
    title: partial?.title || "New chore",
    assignee: partial?.assignee || "You",
    frequency: partial?.frequency || "Weekly",
    dueDate: partial?.dueDate || today(),
    status: partial?.status || "Todo",
    priority: partial?.priority || "Medium",
  };
}

export function newBudget(partial?: Partial<BudgetEnvelope>): BudgetEnvelope {
  const fallback = loadCurrencyPrefs().displayCurrency;
  return {
    id: nid("bud"),
    name: partial?.name || "New budget",
    category: partial?.category || "Other",
    limit: partial?.limit ?? 0,
    spent: partial?.spent ?? 0,
    currency: lineCurrency(partial?.currency, fallback),
    period: partial?.period || "Monthly",
  };
}
