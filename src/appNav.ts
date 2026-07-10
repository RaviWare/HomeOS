/**
 * Single source of truth for app navigation order & grouping.
 * Used by Sidebar + Command Deck module launcher.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Droplet,
  Wrench,
  TrendingUp,
  FolderOpen,
  Settings,
  Wallet,
  ScrollText,
  Home,
} from "lucide-react";
import type { AppTab } from "./routing";

export type NavGroupId = "core" | "housing" | "money" | "life" | "system";

export interface NavGroup {
  id: NavGroupId;
  label: string;
  blurb: string;
}

export interface AppNavItem {
  id: AppTab;
  group: NavGroupId;
  label: string;
  short: string;
  desc: string;
  icon: LucideIcon;
}

/** Display order of groups in sidebar + deck */
export const NAV_GROUPS: NavGroup[] = [
  { id: "core", label: "Overview", blurb: "Your HQ" },
  { id: "housing", label: "Housing", blurb: "Homes & ops" },
  { id: "money", label: "Money", blurb: "Cash & goals" },
  { id: "life", label: "Home life", blurb: "Everyday" },
  { id: "system", label: "Vault", blurb: "Records & access" },
];

/**
 * Canonical module order:
 * Deck → Housing → Money (Finances first) → Life → Vault
 */
export const APP_NAV: AppNavItem[] = [
  {
    id: "dashboard",
    group: "core",
    label: "Command Deck",
    short: "Deck",
    desc: "Overview & insights",
    icon: LayoutDashboard,
  },
  {
    id: "properties",
    group: "housing",
    label: "Property Hub",
    short: "Homes",
    desc: "Homes, units & photos",
    icon: Building2,
  },
  {
    id: "leases",
    group: "housing",
    label: "Lease & Clauses",
    short: "Leases",
    desc: "Agreements & renewals",
    icon: FileText,
  },
  {
    id: "utilities",
    group: "housing",
    label: "Utilities Tracker",
    short: "Utils",
    desc: "Bills & meter reads",
    icon: Droplet,
  },
  {
    id: "maintenance",
    group: "housing",
    label: "Maintenance Ops",
    short: "Repair",
    desc: "Tickets & vendors",
    icon: Wrench,
  },
  {
    id: "finances",
    group: "money",
    label: "Finances",
    short: "Money",
    desc: "Cashflow & potential",
    icon: Wallet,
  },
  {
    id: "payments",
    group: "money",
    label: "Ledger & Payments",
    short: "Ledger",
    desc: "Rent & settlements",
    icon: CreditCard,
  },
  {
    id: "expenses",
    group: "money",
    label: "Expense & Tax",
    short: "Tax",
    desc: "Spend lab & categories",
    icon: TrendingUp,
  },
  {
    id: "life",
    group: "life",
    label: "Home Life",
    short: "Life",
    desc: "Income · assets · chores",
    icon: Home,
  },
  {
    id: "documents",
    group: "system",
    label: "Document Vault",
    short: "Docs",
    desc: "Files, OCR & proof",
    icon: FolderOpen,
  },
  {
    id: "activity",
    group: "system",
    label: "Activity Log",
    short: "Logs",
    desc: "Immutable trail",
    icon: ScrollText,
  },
  {
    id: "settings",
    group: "system",
    label: "Vault Settings",
    short: "Settings",
    desc: "Account · Telegram · data",
    icon: Settings,
  },
];

/** Flat list in nav order (for mobile chips, etc.) */
export function flatNav(excludeDashboard = false): AppNavItem[] {
  return excludeDashboard ? APP_NAV.filter((i) => i.id !== "dashboard") : APP_NAV;
}

/** Mobile top chips — highest-use modules (fallback) */
export const MOBILE_QUICK_NAV_IDS: AppTab[] = [
  "dashboard",
  "properties",
  "finances",
  "payments",
  "life",
  "documents",
];

export function navById(id: string): AppNavItem | undefined {
  return APP_NAV.find((i) => i.id === id);
}

export function navGrouped(): { group: NavGroup; items: AppNavItem[] }[] {
  return NAV_GROUPS.map((group) => ({
    group,
    items: APP_NAV.filter((i) => i.group === group.id),
  })).filter((g) => g.items.length > 0);
}

export interface NavFilterOpts {
  /** Ordered tab ids (persona priority) */
  priority?: AppTab[];
  /**
   * Full user-defined order (from Customize → drag).
   * When non-empty, overrides persona priority for ordering.
   */
  moduleOrder?: AppTab[];
  /** Hidden by user */
  hidden?: AppTab[];
  /** Pinned first within their group */
  pinned?: AppTab[];
  /** If false, drop persona secondary modules (except settings) */
  includeSecondary?: boolean;
  secondary?: AppTab[];
  /** Group blurb overrides */
  groupBlurbs?: Partial<Record<NavGroupId, string>>;
  excludeDashboard?: boolean;
}

/** Persona + user prefs → ordered, filtered nav items */
export function navItemsForUser(opts: NavFilterOpts = {}): AppNavItem[] {
  const hidden = new Set(opts.hidden || []);
  const secondary = new Set(opts.secondary || []);
  const includeSecondary = opts.includeSecondary !== false;
  const pinned = opts.pinned || [];
  const userOrder = (opts.moduleOrder || []).filter(Boolean);
  const priority =
    userOrder.length > 0
      ? userOrder
      : opts.priority || APP_NAV.map((i) => i.id);

  let ids = priority.filter((id) => {
    if (hidden.has(id)) return false;
    if (!includeSecondary && secondary.has(id) && id !== "settings" && id !== "dashboard")
      return false;
    return APP_NAV.some((n) => n.id === id);
  });

  // Ensure any non-listed modules still appear at end (except hidden)
  APP_NAV.forEach((n) => {
    if (!ids.includes(n.id) && !hidden.has(n.id)) {
      if (!includeSecondary && secondary.has(n.id) && n.id !== "settings") return;
      ids.push(n.id);
    }
  });

  // Pin: move pinned to front of their relative order (after dashboard)
  // Skip when full moduleOrder is in use (user already arranged everything)
  if (pinned.length && userOrder.length === 0) {
    const pinSet = pinned.filter((p) => ids.includes(p));
    const rest = ids.filter((id) => !pinSet.includes(id));
    const dash = rest.filter((id) => id === "dashboard");
    const body = rest.filter((id) => id !== "dashboard");
    ids = [...dash, ...pinSet, ...body.filter((id) => !pinSet.includes(id))];
  }

  if (opts.excludeDashboard) ids = ids.filter((id) => id !== "dashboard");

  return ids.map((id) => navById(id)!).filter(Boolean);
}

export function navGroupedForUser(
  opts: NavFilterOpts = {}
): { group: NavGroup; items: AppNavItem[] }[] {
  const items = navItemsForUser(opts);
  return NAV_GROUPS.map((group) => {
    const blurb = opts.groupBlurbs?.[group.id] || group.blurb;
    return {
      group: { ...group, blurb },
      items: items.filter((i) => i.group === group.id),
    };
  }).filter((g) => g.items.length > 0);
}

export function mobileQuickForUser(quick: AppTab[]): AppNavItem[] {
  return quick.map((id) => navById(id)).filter(Boolean) as AppNavItem[];
}
