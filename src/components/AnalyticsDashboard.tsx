import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Building2,
  CreditCard,
  Clock,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileText,
  Droplet,
  Home,
  LayoutGrid,
  BarChart3,
  Table2,
  Minus,
  PiggyBank,
  Landmark,
  Target,
  Layers,
} from "lucide-react";
import {
  Property,
  Lease,
  Transaction,
  MaintenanceTicket,
} from "../types";
import { getDashboardData } from "../insights";
import WeatherTimeWidget from "./WeatherTimeWidget";
import DeckToolkit, { loadDeckPrefs, type DeckPrefs } from "./DeckToolkit";
import {
  greetingWithOptionalName,
  resolveDisplayName,
  initialsFromUser,
} from "../userDisplay";
import { resolveAvatarUrl } from "../avatar";
import {
  type HomeLifeState,
  summarizeHomeLife,
  goalKindLabel,
} from "../homeLife";
import { navGroupedForUser } from "../appNav";
import {
  deriveMonthlyCashflow,
  loadEntries,
  loadGoals as loadFinanceGoals,
  savingsRate,
} from "../finance";
import { PERSONAS, personaForRole, roleTitle } from "../userPersonas";
import { navigateView, pathForAppTab, shouldHandleSpaClick } from "../routing";
import {
  isGuideDismissed,
  isSparseVault,
  needsCoreSetup,
  setGuideDismissed,
  setLifeNavIntent,
  vaultSetupFrom,
} from "../deckGuide";
import DeckEmptyGuide, { DeckGuideHelpChip } from "./DeckEmptyGuide";
import {
  type CurrencyCode,
  formatMoney,
  loadCurrencyPrefs,
  ratesFooter,
  setDisplayCurrency,
  CURRENCIES,
} from "../currency";

interface AnalyticsDashboardProps {
  properties: Property[];
  leases: Lease[];
  transactions: Transaction[];
  tickets: MaintenanceTicket[];
  homeLife?: HomeLifeState;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;
  userRole: string;
  workspaceName?: string;
  onNavigate: (tab: any) => void;
  onHomeLifeChange?: (next: HomeLifeState) => void;
}

type DeckView = "life" | "graphs" | "dataset";
type DataTab =
  | "wealth"
  | "rent"
  | "cashflow"
  | "properties"
  | "leases"
  | "payments"
  | "goals"
  | "ops";

const num = (n: number) => Number(n || 0).toLocaleString("en-IN");
const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl min-w-0";

const C = {
  up: "#34D399",
  down: "#FB7185",
  warn: "#FBBF24",
  flat: "#A1A1AA",
  ink: "#FAFAFA",
} as const;

function yearOf(d: string) {
  return parseInt((d || "").slice(0, 4), 10) || 0;
}

/**
 * HomeOS Command Deck — full life OS pulse.
 * Income · expenses · savings · net worth · rent history · housing · ops.
 */
export default function AnalyticsDashboard({
  properties,
  leases,
  transactions,
  tickets,
  homeLife,
  userName,
  userEmail,
  avatarUrl,
  userRole,
  workspaceName = "HomeOS",
  onNavigate,
}: AnalyticsDashboardProps) {
  const [prefs, setPrefs] = useState<DeckPrefs>(() => loadDeckPrefs());
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => !isGuideDismissed());
  const [fxTick, setFxTick] = useState(0);

  useEffect(() => {
    const bump = () => setFxTick((n) => n + 1);
    window.addEventListener("homeos-currency-change", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("homeos-currency-change", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const currencyPrefs = useMemo(() => loadCurrencyPrefs(), [fxTick]);
  const displayCurrency = currencyPrefs.displayCurrency;
  const money = (n: number, code?: CurrencyCode) =>
    formatMoney(n, code || displayCurrency);
  const [showTools, setShowTools] = useState(false);

  const persona = useMemo(() => {
    if (prefs.usePersonaDefaults && prefs.personaOverride)
      return PERSONAS[prefs.personaOverride];
    return personaForRole(userRole);
  }, [userRole, prefs.usePersonaDefaults, prefs.personaOverride]);

  const [view, setView] = useState<DeckView>("life");
  const [dataTab, setDataTab] = useState<DataTab>("wealth");

  /** Switch Life OS / Trends / Datasets — pure state, no prefs side-effects that reset UI */
  const selectView = (next: DeckView) => {
    setView(next);
    try {
      sessionStorage.setItem("rv_deck_view", next);
    } catch {
      /* ignore */
    }
  };

  // Restore last surface once on mount (not on every prefs/persona tick)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rv_deck_view") as DeckView | null;
      if (saved === "life" || saved === "graphs" || saved === "dataset") {
        setView(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const fromPrefs = loadDeckPrefs().defaultDeckView;
    if (fromPrefs === "life" || fromPrefs === "graphs" || fromPrefs === "dataset") {
      setView(fromPrefs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const demo = getDashboardData(properties, leases, transactions, tickets);
  const s = demo.stats;
  const life = useMemo(
    () => (homeLife ? summarizeHomeLife(homeLife, displayCurrency) : null),
    [homeLife, displayCurrency, fxTick]
  );
  const goals = homeLife?.goals || [];
  const finEntries = useMemo(() => loadEntries(), []);
  const finGoals = useMemo(() => loadFinanceGoals(), []);

  const cashflow = useMemo(
    () =>
      deriveMonthlyCashflow(finEntries, transactions, userRole, {
        months: 12,
      }),
    [finEntries, transactions, userRole]
  );

  const realName = resolveDisplayName(userName, userEmail);
  const hello = greetingWithOptionalName(prefs.greeting, userName, userEmail);
  const photo = !avatarFailed
    ? resolveAvatarUrl(userEmail, avatarUrl, 96)
    : null;
  const initials = initialsFromUser(userName, userEmail);
  const todayMs = Date.now();
  const moduleGroups = useMemo(
    () =>
      navGroupedForUser({
        priority: persona.modulePriority,
        moduleOrder: prefs.moduleOrder,
        secondary: persona.secondaryModules,
        includeSecondary: prefs.showSecondaryModules,
        hidden: prefs.hiddenModules,
        pinned: prefs.pinnedModules,
        groupBlurbs: persona.groupBlurbs as any,
        excludeDashboard: true,
      }).filter((g) => g.group.id !== "core"),
    [
      persona,
      prefs.showSecondaryModules,
      prefs.hiddenModules,
      prefs.pinnedModules,
      prefs.moduleOrder,
    ]
  );

  // ── Master life model ──────────────────────────────────────────
  const lifeModel = useMemo(() => {
    // Resident perspective (pays rent / lives in home) — not "I rent out"
    const isTenant =
      userRole === "Tenant" ||
      userRole === "Family Member" ||
      userRole === "Homeowner";

    // Rent paid by year (tenant perspective / all rent txs)
    const rentByYear: Record<number, number> = {};
    const rentCountByYear: Record<number, number> = {};
    transactions.forEach((t) => {
      if (t.category !== "Rent" || t.status !== "Paid") return;
      const y = yearOf(t.date);
      if (!y) return;
      rentByYear[y] = (rentByYear[y] || 0) + t.amount;
      rentCountByYear[y] = (rentCountByYear[y] || 0) + 1;
    });
    const rentYears = Object.keys(rentByYear)
      .map(Number)
      .sort((a, b) => a - b);
    const rentHistory = rentYears.map((y) => ({
      year: y,
      total: rentByYear[y],
      payments: rentCountByYear[y],
      avg: Math.round(rentByYear[y] / Math.max(1, rentCountByYear[y])),
    }));
    const rentFirstYear = rentYears[0] || null;
    const rentLastYear = rentYears[rentYears.length - 1] || null;
    const rentLifetime = rentHistory.reduce((a, r) => a + r.total, 0);
    const rentMaxYear = Math.max(...rentHistory.map((r) => r.total), 1);

    // Expense by year (all paid non-deposit)
    const expByYear: Record<number, number> = {};
    transactions.forEach((t) => {
      if (t.status !== "Paid") return;
      if (t.category === "Deposit" || t.category === "Refund") return;
      const y = yearOf(t.date);
      if (!y) return;
      expByYear[y] = (expByYear[y] || 0) + t.amount;
    });
    finEntries
      .filter((e) => e.flow === "out")
      .forEach((e) => {
        const y = yearOf(e.date);
        if (!y) return;
        expByYear[y] = (expByYear[y] || 0) + e.amount;
      });
    const expYears = Object.keys(expByYear)
      .map(Number)
      .sort((a, b) => a - b);
    const expenseHistory = expYears.map((y) => ({
      year: y,
      total: expByYear[y],
    }));
    const expMax = Math.max(...expenseHistory.map((e) => e.total), 1);

    // Income streams (Home Life) + finance entries in + owner rent
    const monthlyIncomeLife = life?.monthlyIncome || 0;
    const annualIncomeEst = monthlyIncomeLife * 12;
    let rentalIncomeYtd = 0;
    if (!isTenant) {
      transactions.forEach((t) => {
        if (t.category === "Rent" && t.status === "Paid")
          rentalIncomeYtd += t.amount;
      });
    }
    const finIn = finEntries
      .filter((e) => e.flow === "in")
      .reduce((a, e) => a + e.amount, 0);
    const finOut = finEntries
      .filter((e) => e.flow === "out")
      .reduce((a, e) => a + e.amount, 0);

    // Last 12 months cashflow totals
    const cfIn = cashflow.reduce((a, c) => a + c.inflow, 0);
    const cfOut = cashflow.reduce((a, c) => a + c.outflow, 0);
    const cfNet = cfIn - cfOut;
    const curMonth = cashflow[cashflow.length - 1];
    const prevMonth = cashflow[cashflow.length - 2];
    const savRate = curMonth ? savingsRate(curMonth) : 0;

    // Payments status
    const paidAmt = transactions
      .filter((t) => t.status === "Paid")
      .reduce((a, t) => a + t.amount, 0);
    const pendingAmt = transactions
      .filter((t) => t.status === "Pending" || t.status === "Overdue")
      .reduce((a, t) => a + t.amount, 0);
    const overdueN = transactions.filter((t) => t.status === "Overdue").length;

    // Assets & net worth estimate
    const assetValue = life?.totalAssets || 0;
    const depositsHeld = transactions
      .filter((t) => t.category === "Deposit")
      .reduce((a, t) => a + t.amount, 0);
    // For tenant: deposits are "asset-like" (refundable); for owner: property rent book
    const propertyBook = properties.reduce(
      (a, p) => a + (p.rentAmount || 0) * 12,
      0
    ); // annual rent roll as rough value proxy
    const goalsSaved =
      (life?.goalsSaved || 0) +
      finGoals.reduce((a, g) => a + (g.savedAmount || 0), 0);
    const goalsTarget =
      (life?.goalsTarget || 0) +
      finGoals.reduce((a, g) => a + (g.targetAmount || 0), 0);

    // Net worth (simplified life OS model)
    // Assets + deposits + goals cash + rough equity proxy − open liabilities (pending)
    const netWorth =
      assetValue +
      (isTenant ? depositsHeld * 0.5 : 0) +
      goalsSaved +
      Math.max(0, cfNet) * 0.1 -
      pendingAmt;

    // Housing
    const leaseStatus = {
      Active: leases.filter((l) => l.status === "Active").length,
      Pending: leases.filter((l) => l.status === "Pending Signature").length,
      Expired: leases.filter((l) => l.status === "Expired").length,
      Terminated: leases.filter((l) => l.status === "Terminated").length,
    };
    const propStatus = {
      Occupied: properties.filter((p) => p.status === "Occupied").length,
      Vacant: properties.filter((p) => p.status === "Vacant").length,
      Maint: properties.filter((p) => p.status === "Under Maintenance")
        .length,
      Listed: properties.filter((p) => p.status === "Listed").length,
    };
    const renewals = leases
      .filter((l) => l.status === "Active")
      .map((l) => ({
        name: l.propertyName,
        days: Math.max(
          0,
          Math.round((new Date(l.endDate).getTime() - todayMs) / 86400000)
        ),
        rent: l.monthlyRent,
        end: l.endDate,
      }))
      .filter((r) => r.days <= 120)
      .sort((a, b) => a.days - b.days);

    // Category spend
    const catMap: Record<string, number> = {};
    transactions
      .filter((t) => t.status === "Paid" && t.category !== "Deposit")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
    const categories = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
    const catMax = Math.max(...categories.map((c) => c.amount), 1);

    // Cities / longevity
    const cities = Array.from(new Set(properties.map((p) => p.city)));
    const leaseYears = leases
      .flatMap((l) => [yearOf(l.startDate), yearOf(l.endDate)])
      .filter((y) => y > 1990);
    const housingFrom = leaseYears.length ? Math.min(...leaseYears) : null;
    const housingTo = leaseYears.length ? Math.max(...leaseYears) : null;

    // Tickets
    const openTickets = tickets.filter((t) => t.status !== "Resolved").length;
    const ticketStatus = {
      Pending: tickets.filter((t) => t.status === "Pending").length,
      InProgress: tickets.filter((t) => t.status === "In Progress").length,
      Resolved: tickets.filter((t) => t.status === "Resolved").length,
    };

    // Monthly expense avg (home life budgets + ledger)
    const monthlyExpEst =
      (life?.budgetSpent || 0) > 0
        ? life!.budgetSpent
        : cfOut / Math.max(1, cashflow.length);
    const monthlyNetEst = monthlyIncomeLife - monthlyExpEst;

    // Cashflow chart points
    const cfMax = Math.max(
      ...cashflow.map((c) => Math.max(c.inflow, c.outflow)),
      1
    );
    const cfNetMax = Math.max(...cashflow.map((c) => Math.abs(c.net)), 1);

    // YoY expense change
    const thisY = new Date().getFullYear();
    const expThis = expByYear[thisY] || expByYear[thisY - 0] || 0;
    // use last two years in history
    const lastTwo = expenseHistory.slice(-2);
    const expDeltaPct =
      lastTwo.length === 2 && lastTwo[0].total > 0
        ? ((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100
        : 0;

    const rentDeltaPct =
      rentHistory.length >= 2 && rentHistory[0].total > 0
        ? ((rentHistory[rentHistory.length - 1].total -
            rentHistory[0].total) /
            rentHistory[0].total) *
          100
        : 0;

    return {
      isTenant,
      rentHistory,
      rentFirstYear,
      rentLastYear,
      rentLifetime,
      rentMaxYear,
      expenseHistory,
      expMax,
      monthlyIncomeLife,
      annualIncomeEst,
      rentalIncomeYtd,
      finIn,
      finOut,
      cfIn,
      cfOut,
      cfNet,
      curMonth,
      prevMonth,
      savRate,
      paidAmt,
      pendingAmt,
      overdueN,
      assetValue,
      depositsHeld,
      propertyBook,
      goalsSaved,
      goalsTarget,
      goalsPct:
        goalsTarget > 0
          ? Math.min(100, Math.round((goalsSaved / goalsTarget) * 100))
          : 0,
      netWorth,
      leaseStatus,
      propStatus,
      renewals: renewals.slice(0, 6),
      categories,
      catMax,
      cities,
      housingFrom,
      housingTo,
      openTickets,
      ticketStatus,
      monthlyExpEst,
      monthlyNetEst,
      cashflow,
      cfMax,
      cfNetMax,
      expDeltaPct,
      rentDeltaPct,
      sideIncome: life?.sideIncome || 0,
      openChores: life?.openChores || 0,
      budgetLeft: life?.budgetLeft || 0,
      docs: demo.documents?.length ?? s.documentsStored,
    };
  }, [
    transactions,
    finEntries,
    finGoals,
    cashflow,
    life,
    properties,
    leases,
    tickets,
    userRole,
    todayMs,
    demo.documents,
    s.documentsStored,
  ]);

  const attention = useMemo(() => {
    const items: {
      tone: "up" | "warn" | "down";
      title: string;
      sub: string;
      tab: string;
    }[] = [];
    if (lifeModel.overdueN > 0)
      items.push({
        tone: "down",
        title: `${lifeModel.overdueN} overdue payment(s)`,
        sub: money(lifeModel.pendingAmt),
        tab: "payments",
      });
    else if (lifeModel.pendingAmt > 0)
      items.push({
        tone: "warn",
        title: `${money(lifeModel.pendingAmt)} still open`,
        sub: "Clear ledger",
        tab: "payments",
      });
    if (lifeModel.savRate < 0)
      items.push({
        tone: "down",
        title: "Spending above income",
        sub: `Savings rate ${lifeModel.savRate}%`,
        tab: "finances",
      });
    else if (lifeModel.savRate < 10 && lifeModel.monthlyIncomeLife > 0)
      items.push({
        tone: "warn",
        title: `Thin savings (${lifeModel.savRate}%)`,
        sub: "Aim for 20%+",
        tab: "expenses",
      });
    if (lifeModel.renewals[0])
      items.push({
        tone: lifeModel.renewals[0].days <= 30 ? "down" : "warn",
        title: lifeModel.renewals[0].name,
        sub: `Renews in ${lifeModel.renewals[0].days}d`,
        tab: "leases",
      });
    if (lifeModel.openTickets > 0)
      items.push({
        tone: "warn",
        title: `${lifeModel.openTickets} open tickets`,
        sub: "Maintenance",
        tab: "maintenance",
      });
    if (lifeModel.goalsTarget > 0 && lifeModel.goalsPct < 35)
      items.push({
        tone: "warn",
        title: `Dream goals ${lifeModel.goalsPct}%`,
        sub: money(lifeModel.goalsSaved) + " saved",
        tab: "life",
      });
    if (lifeModel.propStatus.Vacant > 0)
      items.push({
        tone: "warn",
        title: `${lifeModel.propStatus.Vacant} vacant`,
        sub: "Property Hub",
        tab: "properties",
      });
    if (!items.length)
      items.push({
        tone: "up",
        title: "Life OS looks balanced",
        sub: "No urgent flags",
        tab: "finances",
      });
    return items.slice(0, 6);
  }, [lifeModel]);

  const go = (tab: string) => {
    if (typeof onNavigate === "function") onNavigate(tab);
  };

  /** Prefer real /app/* hrefs; SPA-handle left click so the address bar stays in sync */
  const goLink = (tab: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleSpaClick(e)) return;
    e.preventDefault();
    go(tab);
  };

  const toneCol = (t: "up" | "warn" | "down" | "flat") =>
    t === "up" ? C.up : t === "down" ? C.down : t === "warn" ? C.warn : C.flat;

  /** Rich per-module cards for All modules launcher */
  type ModulePulse = {
    primary: string;
    secondary: string;
    badge?: string;
    tone: "up" | "warn" | "down" | "flat";
    /** 0–100 optional health bar */
    health?: number;
    tag?: string;
  };

  const modulePulse = useMemo((): Record<string, ModulePulse> => {
    const m = lifeModel;
    const leaseHealth =
      leases.length > 0
        ? Math.round((m.leaseStatus.Active / leases.length) * 100)
        : 0;
    const occ =
      properties.length > 0
        ? Math.round((m.propStatus.Occupied / properties.length) * 100)
        : 0;
    const signPct =
      leases.length > 0
        ? Math.round(
            (leases.filter(
              (l) => l.signatures?.tenantSigned && l.signatures?.landlordSigned
            ).length /
              leases.length) *
              100
          )
        : 0;
    const paidShare =
      m.paidAmt + m.pendingAmt > 0
        ? Math.round((m.paidAmt / (m.paidAmt + m.pendingAmt)) * 100)
        : 100;

    return {
      properties: {
        primary: `${properties.length} homes`,
        secondary: `${m.propStatus.Occupied} occupied · ${m.propStatus.Vacant} vacant · ${m.cities.length} cities`,
        badge: String(properties.length),
        tone: m.propStatus.Vacant > 0 ? "warn" : properties.length ? "up" : "flat",
        health: occ,
        tag: occ ? `${occ}% occupied` : "Empty vault",
      },
      leases: {
        primary: `${m.leaseStatus.Active} active`,
        secondary: `${leases.length} total · ${signPct}% dual-signed · ${m.renewals.length} renew ≤120d`,
        badge: String(leases.length),
        tone:
          m.renewals.some((r) => r.days <= 30) || m.leaseStatus.Pending > 0
            ? "warn"
            : m.leaseStatus.Active > 0
              ? "up"
              : "flat",
        health: leaseHealth,
        tag: m.renewals[0] ? `Next ${m.renewals[0].days}d` : "No renewals soon",
      },
      utilities: {
        primary: `${num(s.utilityBills)} bills`,
        secondary: "Meters · electricity · water · gas · net",
        badge: num(s.utilityBills),
        tone: s.utilityBills > 0 ? "flat" : "flat",
        tag: "Track reads",
      },
      maintenance: {
        primary: `${m.openTickets} open`,
        secondary: `${m.ticketStatus.Pending} pending · ${m.ticketStatus.InProgress} in progress · ${m.ticketStatus.Resolved} done`,
        badge: String(m.openTickets || tickets.length),
        tone: m.openTickets > 0 ? "warn" : tickets.length ? "up" : "flat",
        health:
          tickets.length > 0
            ? Math.round((m.ticketStatus.Resolved / tickets.length) * 100)
            : 100,
        tag: m.openTickets ? "Needs attention" : "All clear",
      },
      finances: {
        primary: money(m.cfNet),
        secondary: `12-mo net · rate ${m.savRate}% · in ${money(m.cfIn)}`,
        badge: `${m.savRate}%`,
        tone: m.savRate >= 20 ? "up" : m.savRate >= 0 ? "warn" : "down",
        health: Math.min(100, Math.max(0, m.savRate + 50)),
        tag: "Cashflow hub",
      },
      payments: {
        primary: money(m.pendingAmt),
        secondary: `Open · paid ${money(m.paidAmt)} · ${m.overdueN} overdue`,
        badge: m.overdueN > 0 ? String(m.overdueN) : undefined,
        tone: m.overdueN > 0 ? "down" : m.pendingAmt > 0 ? "warn" : "up",
        health: paidShare,
        tag: m.overdueN > 0 ? "Overdue" : m.pendingAmt > 0 ? "Pending" : "Settled",
      },
      expenses: {
        primary: money(m.monthlyExpEst),
        secondary: `Est. / mo · lifetime trail · FY tax lab`,
        badge: m.expDeltaPct
          ? `${m.expDeltaPct > 0 ? "+" : ""}${m.expDeltaPct.toFixed(0)}%`
          : undefined,
        tone: m.expDeltaPct > 8 ? "down" : m.expDeltaPct < -5 ? "up" : "flat",
        tag: "Day → FY views",
      },
      life: {
        primary: m.goalsTarget > 0 ? `${m.goalsPct}% goals` : "Home Life",
        secondary: `Income ${money(m.monthlyIncomeLife)}/mo · assets ${money(m.assetValue)} · ${m.openChores} chores`,
        badge: goals.length ? String(goals.length) : undefined,
        tone:
          m.goalsPct >= 50
            ? "up"
            : m.goalsTarget > 0 && m.goalsPct < 30
              ? "warn"
              : "flat",
        health: m.goalsTarget > 0 ? m.goalsPct : undefined,
        tag: m.goalsTarget > 0 ? money(m.goalsSaved) + " saved" : "Dream savings",
      },
      documents: {
        primary: `${num(m.docs)} files`,
        secondary: "Vault · OCR · proof packs",
        badge: num(m.docs),
        tone: m.docs > 0 ? "up" : "flat",
        tag: "Secure store",
      },
      activity: {
        primary: "Audit trail",
        secondary: `${num(s.timelineEvents || 0)} events logged`,
        tone: "flat",
        tag: "Immutable log",
      },
      settings: {
        primary: "Vault settings",
        secondary: "Profile · Telegram · export · wipe",
        tone: "flat",
        tag: "Controls",
      },
    };
  }, [lifeModel, properties.length, leases, tickets, goals.length, s.utilityBills, s.timelineEvents]);

  const views: { id: DeckView; label: string; icon: typeof LayoutGrid }[] = [
    { id: "life", label: "Life OS", icon: Layers },
    { id: "graphs", label: "Trends", icon: BarChart3 },
    { id: "dataset", label: "Datasets", icon: Table2 },
  ];

  const currentCity = properties[0]?.city || "Bengaluru";

  const vaultSetup = useMemo(
    () =>
      vaultSetupFrom(
        homeLife,
        properties.length,
        leases.length,
        transactions.length
      ),
    [homeLife, properties.length, leases.length, transactions.length]
  );
  const showFullGuide =
    guideOpen && (isSparseVault(vaultSetup) || needsCoreSetup(vaultSetup));
  const showCompactGuide =
    !guideOpen &&
    isGuideDismissed() &&
    (isSparseVault(vaultSetup) || needsCoreSetup(vaultSetup));

  // SVG helpers for cashflow net line (area + stroke)
  const chartW = 640;
  const chartH = 120;
  const netPts = lifeModel.cashflow.map((c, i) => {
    const n = Math.max(1, lifeModel.cashflow.length - 1);
    const x = (i / n) * (chartW - 28) + 14;
    const mid = chartH / 2;
    const amp = lifeModel.cfNetMax > 0 ? lifeModel.cfNetMax : 1;
    const y = mid - (c.net / amp) * (chartH * 0.38);
    return { x, y: Number.isFinite(y) ? y : mid, ...c };
  });
  const netLine = netPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const netArea =
    netPts.length > 0
      ? `M ${netPts[0].x.toFixed(1)},${(chartH / 2).toFixed(1)} ` +
        netPts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
        ` L ${netPts[netPts.length - 1].x.toFixed(1)},${(chartH / 2).toFixed(1)} Z`
      : "";

  const trendsKpis = [
    {
      label: "12-mo in",
      value: money(lifeModel.cfIn),
      color: C.up,
      sub: "Inflow",
    },
    {
      label: "12-mo out",
      value: money(lifeModel.cfOut),
      color: C.down,
      sub: "Outflow",
    },
    {
      label: "12-mo net",
      value: money(lifeModel.cfNet),
      color: lifeModel.cfNet >= 0 ? C.up : C.down,
      sub: lifeModel.cfNet >= 0 ? "Surplus" : "Deficit",
    },
    {
      label: "Savings",
      value: `${lifeModel.savRate}%`,
      color:
        lifeModel.savRate >= 20
          ? C.up
          : lifeModel.savRate >= 0
            ? C.warn
            : C.down,
      sub: "This month",
    },
    {
      label: lifeModel.isTenant ? "Rent life" : "Rent roll",
      value: money(lifeModel.rentLifetime || s.totalRentPaid),
      color: C.ink,
      sub: lifeModel.rentFirstYear
        ? `${lifeModel.rentFirstYear}–${lifeModel.rentLastYear}`
        : "No trail",
    },
    {
      label: "Goals",
      value: `${lifeModel.goalsPct}%`,
      color:
        lifeModel.goalsPct >= 50
          ? C.up
          : lifeModel.goalsTarget > 0
            ? C.warn
            : C.flat,
      sub: money(lifeModel.goalsSaved),
    },
  ];

  const occPct =
    properties.length > 0
      ? Math.round(
          (lifeModel.propStatus.Occupied / properties.length) * 100
        )
      : 0;
  const paidPct =
    lifeModel.paidAmt + lifeModel.pendingAmt > 0
      ? Math.round(
          (lifeModel.paidAmt / (lifeModel.paidAmt + lifeModel.pendingAmt)) *
            100
        )
      : 100;

  return (
    <div className="flex-1 w-full min-h-0 safe-bottom">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4 pb-28 sm:pb-10 flex flex-col gap-3">
        {/* Header */}
        <header className={`${panel} px-4 py-3.5 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-emerald-500/[0.04] pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="w-11 h-11 rounded-2xl object-cover border border-white/15 shrink-0"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="w-11 h-11 flex items-center justify-center bg-white/10 border border-white/15 rounded-2xl text-white font-black text-sm shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 truncate flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  Live report · {workspaceName} · {roleTitle(userRole)}
                </p>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {hello}
                  {realName ? " 👋" : ""}
                </h1>
                <p className="text-[11px] text-[#8E8E93] font-medium truncate">
                  <span className="text-white/55 font-bold">{persona.label}</span>
                  {" · "}
                  {persona.tagline}
                  {lifeModel.rentFirstYear
                    ? ` · rent ${lifeModel.rentFirstYear}–${lifeModel.rentLastYear}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {prefs.showWeather && (
                <WeatherTimeWidget preferredCity={currentCity} />
              )}
              <div className="inline-flex p-0.5 rounded-xl border border-[#1F1F23] bg-[#0C0C0F]">
                {views.map((v) => {
                  const Icon = v.icon;
                  const on = view === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={v.label}
                      onClick={() => selectView(v.id)}
                      className={`inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        on
                          ? "bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                          : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Wealth ribbon — persona-weighted, always live data */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {persona.ribbonFocus.map((key) => {
            const catalog: Record<
              string,
              {
                label: string;
                value: string;
                sub: string;
                tab: string;
                color: string;
                icon: typeof Landmark;
                lifeTab?: "income" | "assets" | "goals";
              }
            > = {
              netWorth: {
                label: "Net worth*",
                value: vaultSetup.hasAssets
                  ? money(lifeModel.netWorth)
                  : "Add assets",
                sub: vaultSetup.hasAssets
                  ? "Assets + goals − open"
                  : "Home Life → Assets",
                tab: "life",
                color: vaultSetup.hasAssets
                  ? lifeModel.netWorth >= 0
                    ? C.up
                    : C.down
                  : C.warn,
                icon: Landmark,
                lifeTab: "assets" as const,
              },
              income: {
                label: "Income / mo",
                value: vaultSetup.hasIncome
                  ? money(lifeModel.monthlyIncomeLife)
                  : "Add income",
                sub: vaultSetup.hasIncome
                  ? lifeModel.sideIncome > 0
                    ? `+${money(lifeModel.sideIncome)} side`
                    : "Home Life streams"
                  : "Home Life → Income",
                tab: "life",
                color: vaultSetup.hasIncome ? C.up : C.warn,
                icon: TrendingUp,
                lifeTab: "income" as const,
              },
              spend: {
                label: "Spend / mo est.",
                value: money(lifeModel.monthlyExpEst),
                sub:
                  lifeModel.expDeltaPct !== 0
                    ? `YoY ${lifeModel.expDeltaPct > 0 ? "+" : ""}${lifeModel.expDeltaPct.toFixed(0)}%`
                    : "Ledger + budgets",
                tab: "expenses",
                color: C.down,
                icon: TrendingDown,
              },
              savings: {
                label: "Savings rate",
                value: `${lifeModel.savRate}%`,
                sub:
                  lifeModel.savRate >= 20
                    ? "Healthy ≥20%"
                    : lifeModel.savRate >= 0
                      ? "Build toward 20%"
                      : "Overspending",
                tab: "finances",
                color:
                  lifeModel.savRate >= 20
                    ? C.up
                    : lifeModel.savRate >= 0
                      ? C.warn
                      : C.down,
                icon: PiggyBank,
              },
              goals: {
                label: "Dream goals",
                value: vaultSetup.hasGoal ? `${lifeModel.goalsPct}%` : "Set goal",
                sub: vaultSetup.hasGoal
                  ? `${money(lifeModel.goalsSaved)} of ${money(lifeModel.goalsTarget)}`
                  : "Home Life → Dream savings",
                tab: "life",
                color: vaultSetup.hasGoal
                  ? lifeModel.goalsPct >= 50
                    ? C.up
                    : lifeModel.goalsTarget > 0
                      ? C.warn
                      : C.flat
                  : C.warn,
                icon: Target,
                lifeTab: "goals" as const,
              },
              rent: {
                label: lifeModel.isTenant ? "Rent paid (all time)" : "Rent on ledger",
                value: money(lifeModel.rentLifetime || s.totalRentPaid),
                sub: lifeModel.rentFirstYear
                  ? `${lifeModel.rentFirstYear} → ${lifeModel.rentLastYear}`
                  : "No rent trail yet",
                tab: "payments",
                color: C.ink,
                icon: Home,
              },
              collection: {
                label: "Rent collected",
                value: money(lifeModel.rentLifetime || s.totalRentPaid),
                sub: lifeModel.rentFirstYear
                  ? `${lifeModel.rentFirstYear} → ${lifeModel.rentLastYear}`
                  : "Ledger rent",
                tab: "payments",
                color: C.up,
                icon: CreditCard,
              },
              occupancy: {
                label: "Occupancy",
                value:
                  properties.length > 0
                    ? `${Math.round(
                        (lifeModel.propStatus.Occupied / properties.length) * 100
                      )}%`
                    : "—",
                sub: `${lifeModel.propStatus.Occupied} occ · ${lifeModel.propStatus.Vacant} vac`,
                tab: "properties",
                color:
                  lifeModel.propStatus.Vacant > 0 ? C.warn : properties.length ? C.up : C.flat,
                icon: Building2,
              },
              openBalance: {
                label: "Open balance",
                value: money(lifeModel.pendingAmt),
                sub:
                  lifeModel.overdueN > 0
                    ? `${lifeModel.overdueN} overdue`
                    : "Pending + overdue",
                tab: "payments",
                color:
                  lifeModel.overdueN > 0
                    ? C.down
                    : lifeModel.pendingAmt > 0
                      ? C.warn
                      : C.up,
                icon: Clock,
              },
              tickets: {
                label: "Open tickets",
                value: String(lifeModel.openTickets),
                sub: `${lifeModel.ticketStatus.Resolved} resolved`,
                tab: "maintenance",
                color: lifeModel.openTickets > 0 ? C.warn : C.up,
                icon: Wrench,
              },
            };
            const k = catalog[key] || catalog.netWorth;
            const Icon = k.icon;
            const lifeTab = k.lifeTab;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (lifeTab) {
                    setLifeNavIntent({
                      tab: lifeTab,
                      openAdd:
                        (lifeTab === "income" && !vaultSetup.hasIncome) ||
                        (lifeTab === "assets" && !vaultSetup.hasAssets) ||
                        (lifeTab === "goals" && !vaultSetup.hasGoal),
                    });
                  }
                  go(k.tab);
                }}
                className={`${panel} p-3 text-left hover:border-white/25 transition-colors cursor-pointer min-h-[92px] flex flex-col justify-between relative overflow-hidden group`}
              >
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-90"
                  style={{ background: k.color }}
                />
                <div className="flex items-center justify-between gap-1 pl-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] line-clamp-1">
                    {k.label}
                  </span>
                  <Icon
                    className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110"
                    style={{ color: k.color }}
                  />
                </div>
                <div className="pl-1.5">
                  <p
                    className="text-[16px] sm:text-lg font-black tabular-nums tracking-tight truncate leading-none"
                    style={{ color: k.color }}
                  >
                    {k.value}
                  </p>
                  <p className="text-[10px] text-[#71717A] font-medium mt-1 line-clamp-1 group-hover:text-white/50">
                    {k.sub}
                    {lifeTab === "income" && !vaultSetup.hasIncome ? (
                      <span className="text-white/40"> · tap to add</span>
                    ) : lifeTab === "assets" && !vaultSetup.hasAssets ? (
                      <span className="text-white/40"> · tap to add</span>
                    ) : lifeTab === "goals" && !vaultSetup.hasGoal ? (
                      <span className="text-white/40"> · tap to add</span>
                    ) : null}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 -mt-1">
          <p className="text-[9px] text-[#52525B] font-medium flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Live vault
            </span>
            <span>· {persona.label}</span>
            <span>· Display {displayCurrency}</span>
            {life?.multiCurrency ? (
              <span className="text-amber-400/80">
                · multi-currency converted
              </span>
            ) : null}
            {persona.ribbonFocus.includes("netWorth")
              ? " · *Net worth = assets + goals − open (on-device estimate)."
              : ""}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="inline-flex items-center gap-1.5 h-8 px-2 rounded-xl border border-[#1F1F23] bg-[#0C0C0F] text-[10px] font-bold text-[#8E8E93]">
              <span className="hidden sm:inline text-white/40">Currency</span>
              <select
                value={displayCurrency}
                onChange={(e) => {
                  setDisplayCurrency(e.target.value as CurrencyCode);
                  setFxTick((n) => n + 1);
                }}
                className="bg-transparent text-white font-bold text-[10px] outline-none cursor-pointer max-w-[4.5rem]"
                aria-label="Display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#0A0A0C] text-white">
                    {c.code}
                  </option>
                ))}
              </select>
            </label>
            {!guideOpen && (
              <DeckGuideHelpChip
                onClick={() => {
                  setGuideDismissed(false);
                  setGuideOpen(true);
                }}
              />
            )}
            <button
              type="button"
              onClick={() => navigateView({ kind: "onboarding" })}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-[#1F1F23] bg-[#0C0C0F] text-[10px] font-bold text-[#8E8E93] hover:text-white hover:border-white/20 cursor-pointer"
              title="Re-run workspace setup wizard"
            >
              Reconfigure setup
            </button>
          </div>
        </div>

        {/* Multi-currency breakdown for net worth / income */}
        {life?.multiCurrency && (
          <div className={`${panel} p-3 sm:p-3.5 border border-amber-500/20 bg-amber-500/[0.03]`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
                  Cross-currency conversion
                </p>
                <p className="text-[12px] font-black text-white mt-0.5">
                  Full value in {displayCurrency}
                </p>
                <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5 leading-snug max-w-xl">
                  Assets and income streams keep their native currency. Deck KPIs convert to your
                  display currency so net worth and monthly income show the combined total.
                </p>
              </div>
              <p className="text-[9px] text-[#71717A] font-medium sm:text-right max-w-[14rem]">
                {ratesFooter(currencyPrefs)}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {life.assetsByCurrency.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Assets by currency
                  </p>
                  <ul className="space-y-1">
                    {life.assetsByCurrency.map((row) => (
                      <li
                        key={row.code}
                        className="flex items-center justify-between gap-2 text-[11px] font-medium"
                      >
                        <span className="text-[#8E8E93]">
                          {formatMoney(row.native, row.code)}{" "}
                          <span className="text-white/40">{row.code}</span>
                        </span>
                        <span className="text-white font-bold tabular-nums">
                          ≈ {formatMoney(row.converted, displayCurrency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] font-black text-white mt-2 pt-1.5 border-t border-white/[0.06]">
                    Assets total {formatMoney(life.totalAssets, displayCurrency)}
                  </p>
                </div>
              )}
              {life.incomeByCurrency.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Income / mo by currency
                  </p>
                  <ul className="space-y-1">
                    {life.incomeByCurrency.map((row) => (
                      <li
                        key={row.code}
                        className="flex items-center justify-between gap-2 text-[11px] font-medium"
                      >
                        <span className="text-[#8E8E93]">
                          {formatMoney(row.native, row.code)}{" "}
                          <span className="text-white/40">{row.code}</span>
                        </span>
                        <span className="text-white font-bold tabular-nums">
                          ≈ {formatMoney(row.converted, displayCurrency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] font-black text-white mt-2 pt-1.5 border-t border-white/[0.06]">
                    Income total {formatMoney(life.monthlyIncome, displayCurrency)}/mo
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* First-run instructions — empty / sparse vault */}
        {showFullGuide && (
          <DeckEmptyGuide
            setup={vaultSetup}
            onNavigate={(tab) => go(tab)}
            onDismiss={() => setGuideOpen(false)}
          />
        )}
        {showCompactGuide && (
          <DeckEmptyGuide
            setup={vaultSetup}
            onNavigate={(tab) => go(tab)}
            compact
            onExpand={() => {
              setGuideDismissed(false);
              setGuideOpen(true);
            }}
          />
        )}

        {/* Prominent surface switcher */}
        <div
          id="deck-surface"
          className="rounded-xl border border-[#1F1F23] bg-[#0C0C0F] p-1 flex flex-wrap gap-1 sticky top-0 z-10"
        >
          {views.map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={`bar-${v.id}`}
                type="button"
                aria-pressed={on}
                onClick={() => selectView(v.id)}
                className={`flex-1 min-w-[5.5rem] inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg text-[12px] font-black cursor-pointer transition-colors ${
                  on
                    ? "bg-white text-black"
                    : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* ════════ LIFE OS VIEW ════════ */}
        {view === "life" && (
          <>
            {/* ── At-a-glance: cashflow chart + health rings ── */}
            <div className="grid lg:grid-cols-12 gap-2.5">
              <div
                className={`${panel} p-3.5 lg:col-span-8 relative overflow-hidden`}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-transparent" />
                <div className="relative flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      12-month cashflow
                    </p>
                    <h2 className="text-sm font-black text-white tracking-tight">
                      Income vs spend · net trajectory
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                    <span className="inline-flex items-center gap-1.5 text-[#8E8E93]">
                      <span className="w-2 h-2 rounded-sm" style={{ background: C.up }} />
                      In {money(lifeModel.cfIn)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#8E8E93]">
                      <span className="w-2 h-2 rounded-sm" style={{ background: C.down }} />
                      Out {money(lifeModel.cfOut)}
                    </span>
                    <span
                      className="tabular-nums font-black"
                      style={{ color: lifeModel.cfNet >= 0 ? C.up : C.down }}
                    >
                      Net {money(lifeModel.cfNet)}
                    </span>
                  </div>
                </div>
                {/* Dual bars + net line overlay */}
                <div className="relative h-[132px] flex items-end gap-1 sm:gap-1.5">
                  {lifeModel.cashflow.map((c, i) => {
                    const inH = Math.max(2, Math.round((c.inflow / lifeModel.cfMax) * 100));
                    const outH = Math.max(2, Math.round((c.outflow / lifeModel.cfMax) * 100));
                    return (
                      <div
                        key={c.monthKey}
                        className="group flex-1 flex flex-col items-center justify-end h-full min-w-0 relative"
                        title={`${c.label}: In ${money(c.inflow)} · Out ${money(c.outflow)} · Net ${money(c.net)}`}
                      >
                        <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg border border-[#2A2A2E] bg-[#121215] px-2 py-1 text-[9px] font-bold text-white shadow-xl">
                          <span style={{ color: C.up }}>{money(c.inflow)}</span>
                          {" / "}
                          <span style={{ color: C.down }}>{money(c.outflow)}</span>
                        </div>
                        <div className="flex items-end gap-0.5 h-[108px] w-full justify-center">
                          <motion.div
                            className="w-[42%] max-w-[12px] rounded-t-[3px] origin-bottom"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.02 * i, duration: 0.4 }}
                            style={{
                              height: `${inH}%`,
                              background: `linear-gradient(180deg, ${C.up}, ${C.up}88)`,
                            }}
                          />
                          <motion.div
                            className="w-[42%] max-w-[12px] rounded-t-[3px] origin-bottom"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.02 * i + 0.03, duration: 0.4 }}
                            style={{
                              height: `${outH}%`,
                              background: `linear-gradient(180deg, ${C.down}, ${C.down}88)`,
                            }}
                          />
                        </div>
                        <span className="text-[8px] font-bold text-[#52525B] group-hover:text-[#A1A1AA] truncate w-full text-center mt-1">
                          {c.label.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => selectView("graphs")}
                  className="relative mt-2 text-[10px] font-bold text-[#8E8E93] hover:text-white"
                >
                  Open Trends for full graphs →
                </button>
              </div>

              {/* Health rings / glance scores */}
              <div className={`${panel} p-3.5 lg:col-span-4 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-bl from-white/[0.03] via-transparent to-amber-500/[0.04]" />
                <p className="relative text-[9px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Health at a glance
                </p>
                <h2 className="relative text-sm font-black text-white mb-3">
                  Pulse scores
                </h2>
                <div className="relative space-y-3">
                  {(
                    [
                      {
                        l: "Occupancy",
                        pct: occPct,
                        sub: `${lifeModel.propStatus.Occupied}/${properties.length || 0} homes`,
                        color: occPct >= 80 ? C.up : occPct >= 50 ? C.warn : C.down,
                        tab: "properties",
                      },
                      {
                        l: "Collection",
                        pct: paidPct,
                        sub: `${money(lifeModel.paidAmt)} settled`,
                        color: paidPct >= 85 ? C.up : paidPct >= 60 ? C.warn : C.down,
                        tab: "payments",
                      },
                      {
                        l: "Savings rate",
                        pct: Math.min(100, Math.max(0, lifeModel.savRate)),
                        sub: `${lifeModel.savRate}% this month`,
                        color:
                          lifeModel.savRate >= 20
                            ? C.up
                            : lifeModel.savRate >= 0
                              ? C.warn
                              : C.down,
                        tab: "finances",
                      },
                      {
                        l: "Goals funded",
                        pct: lifeModel.goalsPct,
                        sub: `${money(lifeModel.goalsSaved)} saved`,
                        color:
                          lifeModel.goalsPct >= 50
                            ? C.up
                            : lifeModel.goalsTarget > 0
                              ? C.warn
                              : C.flat,
                        tab: "life",
                      },
                    ] as const
                  ).map((g, i) => (
                    <button
                      key={g.l}
                      type="button"
                      onClick={() => go(g.tab)}
                      className="w-full text-left group"
                    >
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-white group-hover:text-white/90">
                          {g.l}
                        </span>
                        <span
                          className="font-black tabular-nums"
                          style={{ color: g.color }}
                        >
                          {g.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, Math.min(100, g.pct))}%` }}
                          transition={{
                            delay: 0.08 * i,
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{
                            background: `linear-gradient(90deg, ${g.color}99, ${g.color})`,
                            boxShadow: `0 0 10px ${g.color}33`,
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-[#52525B] font-medium mt-0.5">
                        {g.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Attention + Money + Housing */}
            <div className="grid lg:grid-cols-12 gap-2.5">
              <div className={`${panel} p-3.5 lg:col-span-4 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] via-transparent to-amber-500/[0.04]" />
                <div className="relative flex items-center gap-1.5 mb-2.5">
                  <Bell className="w-3.5 h-3.5 text-white/40" />
                  <h2 className="text-xs font-black text-white">Where you stand</h2>
                  <span className="ml-auto text-[9px] font-bold tabular-nums text-[#52525B]">
                    {attention.length} alerts
                  </span>
                </div>
                <div className="relative space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none">
                  {attention.map((a) => (
                    <button
                      key={a.title + a.sub}
                      type="button"
                      onClick={() => go(a.tab)}
                      className="w-full flex items-center gap-2.5 rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2 text-left hover:border-white/20 cursor-pointer transition-colors"
                    >
                      {a.tone === "up" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.up }} />
                      ) : (
                        <AlertTriangle
                          className="w-4 h-4 shrink-0"
                          style={{ color: toneCol(a.tone) }}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-white block truncate">
                          {a.title}
                        </span>
                        <span className="text-[10px] text-[#71717A]">{a.sub}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/25 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Money stack with bars */}
              <div className={`${panel} p-3.5 lg:col-span-4 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-rose-500/[0.03]" />
                <div className="relative flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-black text-white">Money stack</h2>
                  <button
                    type="button"
                    onClick={() => go("finances")}
                    className="text-[10px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Finances →
                  </button>
                </div>
                {/* Mini in/out compare */}
                <div className="relative mb-3 rounded-xl border border-[#1F1F23] bg-[#121215] p-2.5">
                  <div className="flex justify-between text-[10px] font-bold mb-1.5">
                    <span style={{ color: C.up }}>In {money(lifeModel.monthlyIncomeLife)}</span>
                    <span style={{ color: C.down }}>Out {money(lifeModel.monthlyExpEst)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/50 overflow-hidden flex">
                    {(() => {
                      const tot =
                        lifeModel.monthlyIncomeLife + lifeModel.monthlyExpEst || 1;
                      const inP = (lifeModel.monthlyIncomeLife / tot) * 100;
                      return (
                        <>
                          <div
                            className="h-full"
                            style={{
                              width: `${inP}%`,
                              background: C.up,
                            }}
                          />
                          <div
                            className="h-full flex-1"
                            style={{ background: C.down, opacity: 0.85 }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <p
                    className="text-[11px] font-black tabular-nums mt-2"
                    style={{
                      color: lifeModel.monthlyNetEst >= 0 ? C.up : C.down,
                    }}
                  >
                    Net {money(lifeModel.monthlyNetEst)}
                    <span className="text-[9px] font-bold text-[#52525B] ml-1.5">
                      / mo est.
                    </span>
                  </p>
                </div>
                <div className="relative space-y-1.5">
                  {(
                    [
                      ["12-mo cash in", lifeModel.cfIn, C.up],
                      ["12-mo cash out", lifeModel.cfOut, C.down],
                      ["12-mo net", lifeModel.cfNet, lifeModel.cfNet >= 0 ? C.up : C.down],
                      ["Open balance", lifeModel.pendingAmt, C.warn],
                      ["Assets tracked", lifeModel.assetValue, C.ink],
                    ] as const
                  ).map(([label, val, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="text-[#8E8E93] font-medium">{label}</span>
                      <span className="font-black tabular-nums" style={{ color }}>
                        {money(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Housing trail */}
              <div className={`${panel} p-3.5 lg:col-span-4 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
                <div className="relative flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-black text-white">Housing trail</h2>
                  <button
                    type="button"
                    onClick={() => {
                      selectView("dataset");
                      setDataTab("rent");
                    }}
                    className="text-[10px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Full table →
                  </button>
                </div>
                <div className="relative rounded-xl border border-[#1F1F23] bg-[#121215] p-3 mb-2.5">
                  <p className="text-[9px] font-bold uppercase text-[#71717A]">
                    {lifeModel.isTenant ? "Rent paid lifetime" : "Rent on ledger"}
                  </p>
                  <p className="text-xl font-black text-white tabular-nums mt-0.5 tracking-tight">
                    {money(lifeModel.rentLifetime || s.totalRentPaid)}
                  </p>
                  <p className="text-[11px] text-[#8E8E93] font-medium mt-1">
                    {lifeModel.rentFirstYear
                      ? `${lifeModel.rentFirstYear} → ${lifeModel.rentLastYear} · ${lifeModel.rentHistory.length} years`
                      : "Log rent to build your trail"}
                  </p>
                  {/* mini sparkline of last rent years */}
                  {lifeModel.rentHistory.length > 0 && (
                    <div className="flex items-end gap-0.5 h-8 mt-2">
                      {lifeModel.rentHistory.slice(-10).map((r) => (
                        <div
                          key={r.year}
                          className="flex-1 rounded-t-sm min-w-0"
                          style={{
                            height: `${Math.max(8, (r.total / lifeModel.rentMaxYear) * 100)}%`,
                            background: `linear-gradient(180deg, ${C.ink}, ${C.ink}55)`,
                          }}
                          title={`${r.year}: ${money(r.total)}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative grid grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    {
                      l: "Homes",
                      v: String(properties.length),
                      s: `${lifeModel.cities.length} cities`,
                    },
                    {
                      l: "Leases",
                      v: String(leases.length),
                      s: `${lifeModel.leaseStatus.Active} active`,
                    },
                    {
                      l: "Span",
                      v: lifeModel.housingFrom
                        ? `${lifeModel.housingFrom}–${lifeModel.housingTo}`
                        : "—",
                      s: "Housing years",
                    },
                    {
                      l: "Deposits",
                      v: money(lifeModel.depositsHeld || s.securityDeposits),
                      s: "On books",
                    },
                  ].map((x) => (
                    <div
                      key={x.l}
                      className="rounded-lg border border-[#1F1F23] bg-[#121215] p-2"
                    >
                      <p className="text-[9px] text-[#71717A] font-bold uppercase">{x.l}</p>
                      <p className="font-black text-white text-[12px] tabular-nums truncate">
                        {x.v}
                      </p>
                      <p className="text-[9px] text-[#52525B]">{x.s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rent by year — premium bars */}
            <div className={`${panel} p-4 relative overflow-hidden`}>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/[0.02] via-transparent to-emerald-500/[0.03]" />
              <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                    Housing cost history
                  </p>
                  <h3 className="text-sm font-black text-white">Rent by year</h3>
                  <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
                    Ledger totals · yearly comparison
                    {lifeModel.rentDeltaPct !== 0 && (
                      <span
                        className="ml-2 font-bold"
                        style={{
                          color: lifeModel.rentDeltaPct > 0 ? C.warn : C.up,
                        }}
                      >
                        {lifeModel.rentDeltaPct > 0 ? "+" : ""}
                        {lifeModel.rentDeltaPct.toFixed(0)}% first→latest
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => go("payments")}
                  className="text-[11px] font-bold text-[#8E8E93] hover:text-white"
                >
                  Open ledger →
                </button>
              </div>
              {lifeModel.rentHistory.length === 0 ? (
                <p className="relative text-[12px] text-[#71717A] py-8 text-center">
                  No paid rent yet — yearly bars appear once rent is logged.
                </p>
              ) : (
                <>
                  <div className="relative flex items-end gap-1 sm:gap-1.5 h-[148px]">
                    {lifeModel.rentHistory.map((r, i) => {
                      const h = Math.max(
                        8,
                        Math.round((r.total / lifeModel.rentMaxYear) * 100)
                      );
                      const isLast = i === lifeModel.rentHistory.length - 1;
                      return (
                        <div
                          key={r.year}
                          className="group flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0"
                          title={`${r.year}: ${money(r.total)} (${r.payments} pays, avg ${money(r.avg)})`}
                        >
                          <span className="text-[8px] sm:text-[9px] font-black tabular-nums text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                            {r.total >= 100000
                              ? `${(r.total / 100000).toFixed(1)}L`
                              : `${Math.round(r.total / 1000)}k`}
                          </span>
                          <motion.div
                            className="w-full max-w-[32px] rounded-t-md origin-bottom"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.02 * i, duration: 0.4 }}
                            style={{
                              height: `${h}%`,
                              background: isLast
                                ? `linear-gradient(180deg, ${C.up}, ${C.up}88)`
                                : `linear-gradient(180deg, rgba(250,250,250,0.9), rgba(250,250,250,0.35))`,
                              boxShadow: isLast ? `0 0 14px ${C.up}33` : undefined,
                            }}
                          />
                          <span className="text-[8px] sm:text-[9px] font-bold text-[#71717A] tabular-nums">
                            {String(r.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {lifeModel.rentHistory.slice(-4).map((r) => (
                      <div
                        key={`d-${r.year}`}
                        className="rounded-xl border border-[#1F1F23] bg-[#121215] p-2.5 hover:border-white/15 transition-colors"
                      >
                        <p className="text-[9px] font-bold text-[#71717A]">{r.year}</p>
                        <p className="text-[13px] font-black text-white tabular-nums">
                          {money(r.total)}
                        </p>
                        <p className="text-[9px] text-[#52525B]">
                          {r.payments} pays · avg {money(r.avg)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status grid with mini bars */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  {
                    title: "Properties",
                    tab: "properties",
                    link: "Property Hub →",
                    rows: [
                      ["Occupied", lifeModel.propStatus.Occupied, C.up],
                      ["Vacant", lifeModel.propStatus.Vacant, C.warn],
                      ["Maintenance", lifeModel.propStatus.Maint, C.down],
                      ["Listed", lifeModel.propStatus.Listed, C.flat],
                    ] as const,
                    total: properties.length || 1,
                  },
                  {
                    title: "Leases",
                    tab: "leases",
                    link: "Lease vault →",
                    rows: [
                      ["Active", lifeModel.leaseStatus.Active, C.up],
                      ["Pending sign", lifeModel.leaseStatus.Pending, C.warn],
                      ["Expired", lifeModel.leaseStatus.Expired, C.down],
                      ["Terminated", lifeModel.leaseStatus.Terminated, C.flat],
                    ] as const,
                    total: leases.length || 1,
                  },
                  {
                    title: "Ops & life",
                    tab: "life",
                    link: "Home Life →",
                    rows: [
                      ["Open tickets", lifeModel.openTickets, C.warn],
                      ["Open chores", lifeModel.openChores, C.flat],
                      ["Documents", lifeModel.docs, C.ink],
                      ["Utility bills", s.utilityBills, C.flat],
                    ] as const,
                    total: Math.max(
                      1,
                      lifeModel.openTickets +
                        lifeModel.openChores +
                        lifeModel.docs +
                        s.utilityBills
                    ),
                  },
                ] as const
              ).map((card) => (
                <div key={card.title} className={`${panel} p-3.5 relative overflow-hidden`}>
                  <p className="text-[9px] font-bold uppercase text-[#71717A] mb-2.5">
                    {card.title}
                  </p>
                  <div className="space-y-2">
                    {card.rows.map(([l, n, c]) => (
                      <div key={l}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-[#8E8E93] font-medium">{l}</span>
                          <span className="font-black tabular-nums" style={{ color: c }}>
                            {num(n)}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(3, Math.min(100, (Number(n) / card.total) * 100))}%`,
                              background: c,
                              opacity: 0.85,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => go(card.tab)}
                    className="mt-2.5 text-[10px] font-bold text-white/50 hover:text-white"
                  >
                    {card.link}
                  </button>
                </div>
              ))}

              <div className={`${panel} p-3.5 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent" />
                <p className="relative text-[9px] font-bold uppercase text-[#71717A] mb-2">
                  Renewals ≤120d
                </p>
                <div className="relative">
                  {lifeModel.renewals.length === 0 ? (
                    <p className="text-[11px] text-[#52525B] py-2">None upcoming</p>
                  ) : (
                    lifeModel.renewals.slice(0, 5).map((r) => (
                      <button
                        key={r.name + r.days}
                        type="button"
                        onClick={() => go("leases")}
                        className="w-full flex justify-between items-center text-[11px] py-1.5 cursor-pointer group border-b border-[#1F1F23]/40 last:border-0"
                      >
                        <span className="text-white font-bold truncate pr-2 group-hover:text-white/90">
                          {r.name}
                        </span>
                        <span
                          className="font-black tabular-nums shrink-0 px-1.5 py-0.5 rounded-md text-[10px]"
                          style={{
                            color: r.days <= 30 ? C.down : C.warn,
                            background:
                              r.days <= 30 ? `${C.down}18` : `${C.warn}18`,
                          }}
                        >
                          {r.days}d
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            

            

{/* All modules — roomy premium launcher */}
            <section aria-label="All modules">
              <motion.div
                className={`${panel} p-4 sm:p-5 overflow-hidden relative`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.03] via-transparent to-emerald-500/[0.04]" />

                <div className="relative flex flex-wrap items-end justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 mb-0.5">
                      Module launcher
                    </p>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      All modules
                    </h2>
                    <p className="text-[12px] text-[#71717A] font-medium mt-0.5">
                      <span className="text-white/70 font-bold">{persona.label}</span>
                      {" · "}
                      {persona.jobs[0]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-[#52525B]">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: C.up }}
                      />
                      Healthy
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.warn }} />
                      Watch
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.down }} />
                      Risk
                    </span>
                  </div>
                </div>

                <div className="relative space-y-5">
                  {moduleGroups.map(({ group, items }, gi) => {
                    const tones = items.map(
                      (it) => modulePulse[it.id]?.tone || "flat"
                    );
                    const groupTone = tones.includes("down")
                      ? "down"
                      : tones.includes("warn")
                        ? "warn"
                        : tones.includes("up")
                          ? "up"
                          : "flat";
                    const gAccent = toneCol(groupTone);

                    return (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.04 + gi * 0.05,
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-2.5 px-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: gAccent,
                              boxShadow: `0 0 8px ${gAccent}88`,
                            }}
                          />
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
                            {group.label}
                          </p>
                          <span className="text-[10px] text-[#52525B] font-medium">
                            {group.blurb}
                          </span>
                          <span className="text-[10px] text-[#3F3F46] font-bold tabular-nums ml-auto">
                            {items.length}
                          </span>
                          <div className="hidden sm:block w-16 h-px bg-gradient-to-r from-[#1F1F23] to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {items.map((hub, hi) => {
                            const Icon = hub.icon;
                            const pulse = modulePulse[hub.id] || {
                              primary: hub.desc,
                              secondary: "Open module",
                              tone: "flat" as const,
                            };
                            const accent = toneCol(pulse.tone);
                            return (
                              <motion.a
                                key={hub.id}
                                href={pathForAppTab(hub.id)}
                                onClick={(e) => goLink(hub.id, e)}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: 0.05 + gi * 0.04 + hi * 0.03,
                                  duration: 0.28,
                                }}
                                whileHover={{
                                  y: -3,
                                  transition: { duration: 0.15 },
                                }}
                                whileTap={{ scale: 0.99 }}
                                className="group relative text-left rounded-2xl border border-[#1F1F23] bg-[#0E0E11] hover:border-white/25 cursor-pointer p-3.5 flex flex-col gap-2.5 overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 min-h-[108px]"
                              >
                                <div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                                  style={{
                                    background: `radial-gradient(100% 80% at 100% 0%, ${accent}16, transparent 55%)`,
                                  }}
                                />
                                <span
                                  className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                                  style={{
                                    background: accent,
                                    boxShadow: `0 0 10px ${accent}55`,
                                  }}
                                />

                                <div className="relative flex items-start justify-between gap-2 pl-1">
                                  <span
                                    className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                                    style={{
                                      borderColor: `${accent}40`,
                                      background: `${accent}14`,
                                    }}
                                  >
                                    <Icon
                                      className="w-4.5 h-4.5"
                                      style={{ color: accent }}
                                    />
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {pulse.badge != null && (
                                      <span
                                        className="min-w-[22px] h-6 px-1.5 rounded-lg text-[10px] font-black tabular-nums flex items-center justify-center border"
                                        style={{
                                          color: accent,
                                          borderColor: `${accent}40`,
                                          background: `${accent}12`,
                                        }}
                                      >
                                        {pulse.badge}
                                      </span>
                                    )}
                                    <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                </div>

                                <div className="relative min-w-0 pl-1 flex-1">
                                  <p className="text-[13px] font-black text-white truncate">
                                    {hub.label}
                                  </p>
                                  <p
                                    className="text-[15px] font-black tabular-nums tracking-tight mt-0.5 truncate"
                                    style={{ color: accent }}
                                  >
                                    {pulse.primary}
                                  </p>
                                  <p className="text-[11px] text-[#8E8E93] font-medium leading-snug mt-1 line-clamp-2">
                                    {pulse.secondary}
                                  </p>
                                </div>

                                <div className="relative pl-1 mt-auto">
                                  {pulse.health != null && (
                                    <div className="h-1 rounded-full bg-black/50 overflow-hidden mb-1.5">
                                      <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${Math.max(4, Math.min(100, pulse.health))}%`,
                                        }}
                                        transition={{
                                          delay: 0.15 + gi * 0.04 + hi * 0.03,
                                          duration: 0.55,
                                          ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{ background: accent }}
                                      />
                                    </div>
                                  )}
                                  {pulse.tag && (
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#52525B] group-hover:text-[#71717A]">
                                      {pulse.tag}
                                    </span>
                                  )}
                                </div>
                              </motion.a>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </section>
          </>
        )}

        {/* ════════ TRENDS / GRAPHS ════════ */}
        {view === "graphs" && (
          <div className="flex flex-col gap-3">
            {/* Trends intro + KPI strip */}
            <div className={`${panel} p-4 sm:p-5 relative overflow-hidden`}>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-rose-500/[0.05]" />
              <div className="relative flex flex-wrap items-end justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                    Trends · {persona.label}
                  </p>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Live pulse across money, housing & goals
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1F1F23] bg-[#121215] text-[10px] font-bold text-[#8E8E93]">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: C.up }}
                  />
                  12-month window
                </span>
              </div>
              <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {trendsKpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.28 }}
                    className="rounded-2xl border border-[#1F1F23] bg-[#0E0E11] px-3 py-2.5 min-w-0 relative overflow-hidden"
                  >
                    <span
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                      style={{ background: k.color, boxShadow: `0 0 8px ${k.color}44` }}
                    />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#52525B] truncate pl-1.5">
                      {k.label}
                    </p>
                    <p
                      className="text-[15px] sm:text-base font-black tabular-nums tracking-tight truncate mt-1 pl-1.5"
                      style={{ color: k.color }}
                    >
                      {k.value}
                    </p>
                    <p className="text-[10px] text-[#52525B] font-medium truncate pl-1.5 mt-0.5">
                      {k.sub}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-3">
              {/* Income vs expenses — dual bars */}
              <div className={`${panel} p-4 sm:p-5 lg:col-span-7 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-rose-500/[0.03]" />
                <div className="relative flex items-start justify-between gap-2 mb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Cashflow
                    </p>
                    <h3 className="text-base font-black text-white">
                      Income vs expenses
                    </h3>
                    <p className="text-[11px] text-[#52525B] font-medium mt-0.5">
                      Monthly dual bars · hover for exact ₹
                    </p>
                  </div>
                  <div className="flex gap-3 text-[10px] font-bold text-[#8E8E93] shrink-0">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.up }} />
                      In
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.down }} />
                      Out
                    </span>
                  </div>
                </div>
                {lifeModel.cashflow.length === 0 ? (
                  <p className="relative text-[12px] text-[#52525B] py-10 text-center">
                    No monthly cashflow yet — add ledger or finance entries.
                  </p>
                ) : (
                  <div className="relative flex items-end gap-1.5 sm:gap-2 h-[180px]">
                    {lifeModel.cashflow.map((c, i) => {
                      const inH = Math.max(
                        3,
                        Math.round((c.inflow / lifeModel.cfMax) * 100)
                      );
                      const outH = Math.max(
                        3,
                        Math.round((c.outflow / lifeModel.cfMax) * 100)
                      );
                      const showVal =
                        i === lifeModel.cashflow.length - 1 ||
                        i === 0 ||
                        i === Math.floor(lifeModel.cashflow.length / 2);
                      return (
                        <div
                          key={c.monthKey}
                          className="group flex-1 flex flex-col items-center justify-end h-full min-w-0 relative"
                          title={`${c.label}: In ${money(c.inflow)} · Out ${money(c.outflow)} · Net ${money(c.net)}`}
                        >
                          <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg border border-[#2A2A2E] bg-[#121215] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl">
                            <span style={{ color: C.up }}>{money(c.inflow)}</span>
                            {" / "}
                            <span style={{ color: C.down }}>{money(c.outflow)}</span>
                            <span className="block text-center mt-0.5 text-[9px] text-[#8E8E93]">
                              Net {money(c.net)}
                            </span>
                          </div>
                          {showVal && c.inflow > 0 && (
                            <span
                              className="text-[8px] font-black tabular-nums mb-0.5 opacity-70"
                              style={{ color: C.up }}
                            >
                              {c.inflow >= 100000
                                ? `${(c.inflow / 100000).toFixed(1)}L`
                                : `${Math.round(c.inflow / 1000)}k`}
                            </span>
                          )}
                          <div className="flex items-end gap-0.5 h-[140px] w-full justify-center">
                            <motion.div
                              className="w-[44%] max-w-[16px] rounded-t-md origin-bottom"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                delay: 0.03 * i,
                                duration: 0.45,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{
                                height: `${inH}%`,
                                background: `linear-gradient(180deg, ${C.up}, ${C.up}88)`,
                                boxShadow: `0 0 14px ${C.up}28`,
                              }}
                            />
                            <motion.div
                              className="w-[44%] max-w-[16px] rounded-t-md origin-bottom"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                delay: 0.03 * i + 0.04,
                                duration: 0.45,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{
                                height: `${outH}%`,
                                background: `linear-gradient(180deg, ${C.down}, ${C.down}88)`,
                                boxShadow: `0 0 14px ${C.down}28`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-[#71717A] group-hover:text-[#A1A1AA] truncate w-full text-center mt-1.5">
                            {c.label.slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Net trajectory — area chart */}
              <div className={`${panel} p-4 sm:p-5 lg:col-span-5 relative overflow-hidden`}>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent" />
                <div className="relative flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Trajectory
                    </p>
                    <h3 className="text-base font-black text-white">Monthly net</h3>
                  </div>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: lifeModel.cfNet >= 0 ? C.up : C.down }}
                  >
                    {money(lifeModel.cfNet)}
                  </span>
                </div>
                {netPts.length === 0 ? (
                  <p className="relative text-[12px] text-[#52525B] py-10 text-center">
                    No data
                  </p>
                ) : (
                  <svg
                    viewBox={`0 0 ${chartW} ${chartH + 20}`}
                    className="relative w-full h-[148px]"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={lifeModel.cfNet >= 0 ? C.up : C.down}
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="100%"
                          stopColor={lifeModel.cfNet >= 0 ? C.up : C.down}
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <line
                      x1="14"
                      x2={chartW - 14}
                      y1={chartH / 2}
                      y2={chartH / 2}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="4 4"
                    />
                    {netArea && (
                      <path d={netArea} fill="url(#netFill)" stroke="none" />
                    )}
                    <polyline
                      fill="none"
                      stroke={lifeModel.cfNet >= 0 ? C.up : C.down}
                      strokeWidth="2.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={netLine}
                      style={{
                        filter: `drop-shadow(0 0 6px ${
                          lifeModel.cfNet >= 0 ? C.up : C.down
                        }66)`,
                      }}
                    />
                    {netPts.map((p, i) => (
                      <g key={p.monthKey}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={i === netPts.length - 1 ? 4.5 : 2.5}
                          fill={p.net >= 0 ? C.up : C.down}
                          stroke="#0A0A0C"
                          strokeWidth="1.2"
                        >
                          <title>
                            {p.label}: {money(p.net)}
                          </title>
                        </circle>
                      </g>
                    ))}
                  </svg>
                )}
                <div className="relative flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[#71717A] font-medium">
                  <span>
                    Rate{" "}
                    <strong style={{ color: lifeModel.savRate >= 0 ? C.up : C.down }}>
                      {lifeModel.savRate}%
                    </strong>
                  </span>
                  <span>
                    In <strong className="text-white/80">{money(lifeModel.cfIn)}</strong>
                  </span>
                  <span>
                    Out <strong className="text-white/80">{money(lifeModel.cfOut)}</strong>
                  </span>
                </div>
              </div>

              {/* Rent by year */}
              <div className={`${panel} p-4 sm:p-5 lg:col-span-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      {lifeModel.isTenant ? "Rent paid" : "Rent collected"}
                    </p>
                    <h3 className="text-base font-black text-white">By calendar year</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("payments")}
                    className="text-[11px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Ledger →
                  </button>
                </div>
                {lifeModel.rentHistory.length === 0 ? (
                  <p className="text-[12px] text-[#52525B] py-8 text-center">
                    No rent trail yet
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-[150px]">
                    {lifeModel.rentHistory.map((r, i) => {
                      const h = Math.max(
                        6,
                        Math.round((r.total / lifeModel.rentMaxYear) * 100)
                      );
                      const isLast = i === lifeModel.rentHistory.length - 1;
                      return (
                        <div
                          key={r.year}
                          className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group"
                          title={`${r.year}: ${money(r.total)} · ${r.payments} payments`}
                        >
                          <span className="text-[9px] font-black text-white/60 tabular-nums mb-1">
                            {r.total >= 100000
                              ? `${(r.total / 100000).toFixed(1)}L`
                              : `${Math.round(r.total / 1000)}k`}
                          </span>
                          <motion.div
                            className="w-full max-w-[36px] rounded-t-lg origin-bottom"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.05 * i, duration: 0.4 }}
                            style={{
                              height: `${h}%`,
                              background: isLast
                                ? `linear-gradient(180deg, ${C.up}, ${C.up}77)`
                                : `linear-gradient(180deg, #FAFAFA, #FAFAFA55)`,
                              boxShadow: isLast ? `0 0 12px ${C.up}33` : undefined,
                            }}
                          />
                          <span className="text-[10px] font-bold text-[#71717A] mt-1.5">
                            {String(r.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {lifeModel.rentDeltaPct !== 0 && (
                  <p className="text-[11px] text-[#71717A] font-medium mt-3">
                    First → last year{" "}
                    <strong
                      style={{
                        color: lifeModel.rentDeltaPct >= 0 ? C.warn : C.up,
                      }}
                    >
                      {lifeModel.rentDeltaPct > 0 ? "+" : ""}
                      {lifeModel.rentDeltaPct.toFixed(0)}%
                    </strong>
                  </p>
                )}
              </div>

              {/* Expense by year */}
              <div className={`${panel} p-4 sm:p-5 lg:col-span-4`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Lifetime spend
                    </p>
                    <h3 className="text-base font-black text-white">Expenses by year</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("expenses")}
                    className="text-[11px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Tax lab →
                  </button>
                </div>
                {lifeModel.expenseHistory.length === 0 ? (
                  <p className="text-[12px] text-[#52525B] py-8 text-center">
                    No expense years yet
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-[150px]">
                    {lifeModel.expenseHistory.map((e, i) => {
                      const h = Math.max(
                        6,
                        Math.round((e.total / lifeModel.expMax) * 100)
                      );
                      return (
                        <div
                          key={e.year}
                          className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group"
                          title={`${e.year}: ${money(e.total)}`}
                        >
                          <span className="text-[9px] font-black text-white/60 tabular-nums mb-1">
                            {e.total >= 100000
                              ? `${(e.total / 100000).toFixed(1)}L`
                              : `${Math.round(e.total / 1000)}k`}
                          </span>
                          <motion.div
                            className="w-full max-w-[36px] rounded-t-lg origin-bottom"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.05 * i, duration: 0.4 }}
                            style={{
                              height: `${h}%`,
                              background: `linear-gradient(180deg, ${C.down}, ${C.down}77)`,
                              boxShadow: `0 0 10px ${C.down}22`,
                            }}
                          />
                          <span className="text-[10px] font-bold text-[#71717A] mt-1.5">
                            {String(e.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {lifeModel.expDeltaPct !== 0 && (
                  <p className="text-[11px] text-[#71717A] font-medium mt-3">
                    YoY{" "}
                    <strong
                      style={{
                        color: lifeModel.expDeltaPct > 0 ? C.down : C.up,
                      }}
                    >
                      {lifeModel.expDeltaPct > 0 ? "+" : ""}
                      {lifeModel.expDeltaPct.toFixed(0)}%
                    </strong>
                  </p>
                )}
              </div>

              {/* Housing / ops gauges */}
              <div className={`${panel} p-4 sm:p-5 lg:col-span-4`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                  Housing & ops
                </p>
                <h3 className="text-base font-black text-white mb-4">Live health</h3>
                <div className="space-y-3.5">
                  {[
                    {
                      label: "Occupancy",
                      pct: occPct,
                      sub: `${lifeModel.propStatus.Occupied}/${properties.length || 0} homes`,
                      color: occPct >= 80 ? C.up : occPct >= 50 ? C.warn : C.down,
                      tab: "properties",
                    },
                    {
                      label: "Collection",
                      pct: paidPct,
                      sub: `${money(lifeModel.paidAmt)} settled`,
                      color:
                        paidPct >= 85 ? C.up : paidPct >= 60 ? C.warn : C.down,
                      tab: "payments",
                    },
                    {
                      label: "Tickets clear",
                      pct:
                        tickets.length > 0
                          ? Math.round(
                              (lifeModel.ticketStatus.Resolved / tickets.length) *
                                100
                            )
                          : 100,
                      sub: `${lifeModel.openTickets} open`,
                      color:
                        lifeModel.openTickets === 0
                          ? C.up
                          : lifeModel.openTickets <= 2
                            ? C.warn
                            : C.down,
                      tab: "maintenance",
                    },
                  ].map((g, i) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => go(g.tab)}
                      className="w-full text-left group"
                    >
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-white group-hover:text-white/90">
                          {g.label}
                        </span>
                        <span
                          className="font-black tabular-nums"
                          style={{ color: g.color }}
                        >
                          {g.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, g.pct)}%` }}
                          transition={{
                            delay: 0.1 + i * 0.08,
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          style={{ background: g.color }}
                        />
                      </div>
                      <p className="text-[9px] text-[#52525B] font-medium mt-0.5">
                        {g.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category mix */}
              <div className={`${panel} p-3 sm:p-4 lg:col-span-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Where money goes
                    </p>
                    <h3 className="text-sm font-black text-white">Top categories</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("expenses")}
                    className="text-[10px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Full lab →
                  </button>
                </div>
                {lifeModel.categories.length === 0 ? (
                  <p className="text-[12px] text-[#52525B] py-6 text-center">
                    No paid categories yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lifeModel.categories.slice(0, 6).map((c, i) => {
                      const share = Math.round(
                        (c.amount / lifeModel.catMax) * 100
                      );
                      return (
                        <div key={c.category}>
                          <div className="flex justify-between text-[11px] mb-0.5 gap-2">
                            <span className="font-bold text-white truncate">
                              {c.category}
                            </span>
                            <span className="tabular-nums text-[#8E8E93] font-bold shrink-0">
                              {money(c.amount)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${share}%` }}
                              transition={{
                                delay: 0.06 * i,
                                duration: 0.5,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{
                                background: `linear-gradient(90deg, rgba(250,250,250,${(
                                  0.85 -
                                  i * 0.08
                                ).toFixed(2)}), rgba(250,250,250,0.25))`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Goals */}
              <div className={`${panel} p-3 sm:p-4 lg:col-span-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Future self
                    </p>
                    <h3 className="text-sm font-black text-white">
                      Goals · {lifeModel.goalsPct}%
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("life")}
                    className="text-[10px] font-bold text-[#8E8E93] hover:text-white"
                  >
                    Manage →
                  </button>
                </div>
                {goals.length === 0 && finGoals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#1F1F23] bg-[#0E0E11] p-4 text-center">
                    <Target className="w-5 h-5 text-white/20 mx-auto mb-1.5" />
                    <p className="text-[11px] text-[#71717A] font-medium">
                      Add land, car, wedding, or retirement goals in Home Life.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-0.5">
                    {[
                      ...goals,
                      ...finGoals.map((g) => ({
                        id: g.id,
                        name: g.name,
                        kind: g.kind as any,
                        targetAmount: g.targetAmount,
                        savedAmount: g.savedAmount,
                        monthlyContribution: 0,
                      })),
                    ]
                      .slice(0, 5)
                      .map((g, i) => {
                        const pct =
                          g.targetAmount > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (g.savedAmount / g.targetAmount) * 100
                                )
                              )
                            : 0;
                        const color =
                          pct >= 70 ? C.up : pct >= 30 ? C.ink : C.warn;
                        return (
                          <div
                            key={g.id}
                            className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] px-2.5 py-2"
                          >
                            <div className="flex justify-between gap-2 mb-1">
                              <span className="text-[11px] font-bold text-white truncate">
                                {g.name}
                              </span>
                              <span
                                className="text-[11px] font-black tabular-nums shrink-0"
                                style={{ color }}
                              >
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-black/50 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  delay: 0.08 * i,
                                  duration: 0.5,
                                }}
                                style={{ background: color }}
                              />
                            </div>
                            <p className="text-[9px] text-[#52525B] tabular-nums mt-0.5">
                              {money(g.savedAmount)} / {money(g.targetAmount)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Insights + attention */}
              <div className={`${panel} p-3 sm:p-4 lg:col-span-3`}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-white/40" />
                  <h3 className="text-xs font-black text-white">Insights</h3>
                </div>
                <div className="space-y-1.5">
                  {attention.slice(0, 3).map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => go(a.tab)}
                      className="w-full text-left rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-2 hover:border-white/20 transition-colors"
                    >
                      <p
                        className="text-[11px] font-bold leading-snug"
                        style={{ color: toneCol(a.tone) }}
                      >
                        {a.title}
                      </p>
                      <p className="text-[9px] text-[#52525B] font-medium mt-0.5">
                        {a.sub}
                      </p>
                    </button>
                  ))}
                  {(demo.suggestions || []).slice(0, 2).map((sg, i) => (
                    <p
                      key={`sg-${i}`}
                      className="text-[10px] text-[#A1A1AA] font-medium leading-snug rounded-xl border border-[#1F1F23]/80 bg-[#0E0E11] p-2"
                    >
                      {sg}
                    </p>
                  ))}
                  {attention.length === 0 &&
                    !(demo.suggestions || []).length && (
                      <p className="text-[11px] text-[#52525B] py-4 text-center">
                        Looking balanced — keep logging data.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ DATASETS ════════ */}
        {view === "dataset" && (
          <div className={`${panel} flex flex-col overflow-hidden min-h-[440px]`}>
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 border-b border-[#1F1F23]">
              {(
                [
                  { id: "wealth" as const, label: "Wealth" },
                  { id: "rent" as const, label: "Rent years" },
                  { id: "cashflow" as const, label: "Cashflow" },
                  { id: "properties" as const, label: "Homes" },
                  { id: "leases" as const, label: "Leases" },
                  { id: "payments" as const, label: "Payments" },
                  { id: "goals" as const, label: "Goals" },
                  { id: "ops" as const, label: "Ops" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDataTab(t.id)}
                  className={`h-8 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    dataTab === t.id
                      ? "bg-white text-black"
                      : "text-[#8E8E93] hover:text-white bg-[#121215] border border-[#1F1F23]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {dataTab === "wealth" && (
                <table className="w-full text-left text-[11px] min-w-[480px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Metric</th>
                      <th className="py-2.5 px-3 font-bold text-right">Value</th>
                      <th className="py-2.5 px-3 font-bold">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Net worth (est.)", money(lifeModel.netWorth), "Assets + goals − open"],
                        ["Monthly income", money(lifeModel.monthlyIncomeLife), "Home Life"],
                        ["Side income", money(lifeModel.sideIncome), "Home Life"],
                        ["Assets", money(lifeModel.assetValue), "Home Life"],
                        ["Goals saved", money(lifeModel.goalsSaved), "Life + Finances"],
                        ["Goals target", money(lifeModel.goalsTarget), "Life + Finances"],
                        ["12-mo inflow", money(lifeModel.cfIn), "Cashflow model"],
                        ["12-mo outflow", money(lifeModel.cfOut), "Cashflow model"],
                        ["12-mo net", money(lifeModel.cfNet), "Cashflow model"],
                        ["Savings rate", `${lifeModel.savRate}%`, "Current month"],
                        ["Open balance", money(lifeModel.pendingAmt), "Ledger"],
                        ["Deposits on books", money(lifeModel.depositsHeld), "Ledger"],
                        ["Rent lifetime", money(lifeModel.rentLifetime), "Ledger rent"],
                        [
                          "Rent years",
                          lifeModel.rentFirstYear
                            ? `${lifeModel.rentFirstYear}–${lifeModel.rentLastYear}`
                            : "—",
                          "History",
                        ],
                      ] as const
                    ).map(([m, v, src]) => (
                      <tr key={m} className="border-b border-[#1F1F23]/50">
                        <td className="py-2 px-3 font-semibold text-white">{m}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-black text-white">
                          {v}
                        </td>
                        <td className="py-2 px-3 text-[#71717A]">{src}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dataTab === "rent" && (
                <table className="w-full text-left text-[11px] min-w-[520px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Year</th>
                      <th className="py-2.5 px-2 font-bold text-right">Total paid</th>
                      <th className="py-2.5 px-2 font-bold text-right">Payments</th>
                      <th className="py-2.5 px-2 font-bold text-right">Avg / payment</th>
                      <th className="py-2.5 px-3 font-bold text-right">vs prior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifeModel.rentHistory.map((r, i, arr) => {
                      const prev = i > 0 ? arr[i - 1].total : null;
                      const d =
                        prev && prev > 0
                          ? ((r.total - prev) / prev) * 100
                          : null;
                      return (
                        <tr
                          key={r.year}
                          className="border-b border-[#1F1F23]/50 hover:bg-white/[0.02]"
                        >
                          <td className="py-2.5 px-3 font-black text-white">{r.year}</td>
                          <td className="py-2.5 px-2 text-right tabular-nums font-black text-white">
                            {money(r.total)}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-[#8E8E93]">
                            {r.payments}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-[#8E8E93]">
                            {money(r.avg)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-right tabular-nums font-bold"
                            style={{
                              color:
                                d == null
                                  ? C.flat
                                  : d > 0
                                    ? C.down
                                    : d < 0
                                      ? C.up
                                      : C.flat,
                            }}
                          >
                            {d == null
                              ? "—"
                              : `${d > 0 ? "+" : ""}${d.toFixed(0)}%`}
                          </td>
                        </tr>
                      );
                    })}
                    {lifeModel.rentHistory.length > 0 && (
                      <tr className="border-t border-white/10">
                        <td className="py-2.5 px-3 font-black text-white">Total</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-black text-white">
                          {money(lifeModel.rentLifetime)}
                        </td>
                        <td colSpan={3} className="py-2.5 px-3 text-[#71717A]">
                          {lifeModel.rentFirstYear} → {lifeModel.rentLastYear}
                        </td>
                      </tr>
                    )}
                    {!lifeModel.rentHistory.length && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-[#71717A]">
                          No rent years yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {dataTab === "cashflow" && (
                <table className="w-full text-left text-[11px] min-w-[480px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Month</th>
                      <th className="py-2.5 px-2 font-bold text-right">In</th>
                      <th className="py-2.5 px-2 font-bold text-right">Out</th>
                      <th className="py-2.5 px-3 font-bold text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifeModel.cashflow.map((c) => (
                      <tr
                        key={c.monthKey}
                        className="border-b border-[#1F1F23]/50"
                      >
                        <td className="py-2 px-3 font-semibold text-white">
                          {c.label}
                        </td>
                        <td
                          className="py-2 px-2 text-right tabular-nums font-bold"
                          style={{ color: C.up }}
                        >
                          {money(c.inflow)}
                        </td>
                        <td
                          className="py-2 px-2 text-right tabular-nums font-bold"
                          style={{ color: C.down }}
                        >
                          {money(c.outflow)}
                        </td>
                        <td
                          className="py-2 px-3 text-right tabular-nums font-black"
                          style={{ color: c.net >= 0 ? C.up : C.down }}
                        >
                          {money(c.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dataTab === "properties" && (
                <table className="w-full text-left text-[11px] min-w-[520px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Name</th>
                      <th className="py-2.5 px-2 font-bold">City</th>
                      <th className="py-2.5 px-2 font-bold">Status</th>
                      <th className="py-2.5 px-3 font-bold text-right">Rent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => go("properties")}
                        className="border-b border-[#1F1F23]/50 hover:bg-white/[0.02] cursor-pointer"
                      >
                        <td className="py-2 px-3 font-semibold text-white">{p.name}</td>
                        <td className="py-2 px-2 text-[#8E8E93]">{p.city}</td>
                        <td className="py-2 px-2 text-[#8E8E93]">{p.status}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-black text-white">
                          {money(p.rentAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dataTab === "leases" && (
                <table className="w-full text-left text-[11px] min-w-[600px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Property</th>
                      <th className="py-2.5 px-2 font-bold">Tenant</th>
                      <th className="py-2.5 px-2 font-bold">Status</th>
                      <th className="py-2.5 px-2 font-bold text-right">Rent</th>
                      <th className="py-2.5 px-3 font-bold">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leases.slice(0, 40).map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => go("leases")}
                        className="border-b border-[#1F1F23]/50 hover:bg-white/[0.02] cursor-pointer"
                      >
                        <td className="py-2 px-3 font-semibold text-white truncate max-w-[140px]">
                          {l.propertyName}
                        </td>
                        <td className="py-2 px-2 text-[#8E8E93]">{l.tenantName}</td>
                        <td className="py-2 px-2 text-[#8E8E93]">{l.status}</td>
                        <td className="py-2 px-2 text-right tabular-nums font-black text-white">
                          {money(l.monthlyRent)}
                        </td>
                        <td className="py-2 px-3 text-[#8E8E93] tabular-nums text-[10px]">
                          {l.startDate.slice(0, 7)} → {l.endDate.slice(0, 7)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dataTab === "payments" && (
                <table className="w-full text-left text-[11px] min-w-[600px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Date</th>
                      <th className="py-2.5 px-2 font-bold">Category</th>
                      <th className="py-2.5 px-2 font-bold">Property</th>
                      <th className="py-2.5 px-2 font-bold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .slice()
                      .sort((a, b) => (a.date < b.date ? 1 : -1))
                      .slice(0, 40)
                      .map((t) => {
                        const color =
                          t.status === "Paid"
                            ? C.up
                            : t.status === "Overdue"
                              ? C.down
                              : C.warn;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => go("payments")}
                            className="border-b border-[#1F1F23]/50 hover:bg-white/[0.02] cursor-pointer"
                          >
                            <td className="py-2 px-3 text-[#8E8E93] tabular-nums">
                              {t.date}
                            </td>
                            <td className="py-2 px-2 font-semibold text-white">
                              {t.category}
                            </td>
                            <td className="py-2 px-2 text-[#8E8E93] truncate max-w-[120px]">
                              {t.propertyName}
                            </td>
                            <td
                              className="py-2 px-2 text-right tabular-nums font-black"
                              style={{ color }}
                            >
                              {money(t.amount)}
                            </td>
                            <td className="py-2 px-3 font-bold" style={{ color }}>
                              {t.status}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}

              {dataTab === "goals" && (
                <table className="w-full text-left text-[11px] min-w-[520px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Goal</th>
                      <th className="py-2.5 px-2 font-bold text-right">Saved</th>
                      <th className="py-2.5 px-2 font-bold text-right">Target</th>
                      <th className="py-2.5 px-3 font-bold text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((g) => {
                      const pct =
                        g.targetAmount > 0
                          ? Math.min(
                              100,
                              Math.round((g.savedAmount / g.targetAmount) * 100)
                            )
                          : 0;
                      return (
                        <tr
                          key={g.id}
                          onClick={() => go("life")}
                          className="border-b border-[#1F1F23]/50 cursor-pointer hover:bg-white/[0.02]"
                        >
                          <td className="py-2 px-3 font-semibold text-white">
                            {g.name}
                            <span className="text-[#71717A] font-medium">
                              {" "}
                              · {goalKindLabel(g)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums font-black text-white">
                            {money(g.savedAmount)}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-[#8E8E93]">
                            {money(g.targetAmount)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-black text-white">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                    {!goals.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#71717A]">
                          No Home Life goals yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {dataTab === "ops" && (
                <table className="w-full text-left text-[11px] min-w-[480px]">
                  <thead className="sticky top-0 bg-[#0A0A0C]">
                    <tr className="text-[#71717A] border-b border-[#1F1F23]">
                      <th className="py-2.5 px-3 font-bold">Ticket</th>
                      <th className="py-2.5 px-2 font-bold">Property</th>
                      <th className="py-2.5 px-2 font-bold">Priority</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.slice(0, 30).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => go("maintenance")}
                        className="border-b border-[#1F1F23]/50 cursor-pointer hover:bg-white/[0.02]"
                      >
                        <td className="py-2 px-3 font-semibold text-white">{t.title}</td>
                        <td className="py-2 px-2 text-[#8E8E93]">{t.propertyName}</td>
                        <td className="py-2 px-2 text-[#8E8E93]">{t.priority}</td>
                        <td className="py-2 px-3 text-[#8E8E93]">{t.status}</td>
                      </tr>
                    ))}
                    {!tickets.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#71717A]">
                          No maintenance tickets
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tools */}
        <div className={`${panel} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowTools((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02]"
          >
            <span>
              <span className="text-xs font-black text-white block">
                Export · Invoice · Customize
              </span>
              <span className="text-[10px] text-[#71717A] font-medium">
                Optional tools
              </span>
            </span>
            <span className="text-[11px] font-bold text-[#8E8E93]">
              {showTools ? "Hide" : "Show"}
            </span>
          </button>
          {showTools && (
            <div className="px-3 pb-3 border-t border-[#1F1F23]">
              <DeckToolkit
                userName={userName}
                userEmail={userEmail}
                userRole={userRole}
                workspaceName={workspaceName}
                properties={properties}
                leases={leases}
                transactions={transactions}
                tickets={tickets}
                prefs={prefs}
                onPrefsChange={setPrefs}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
