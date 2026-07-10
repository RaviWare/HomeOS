import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Wallet,
  Landmark,
  ListChecks,
  Plane,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  TrendingUp,
  Sparkles,
  Download,
  X,
  Target,
  LayoutGrid,
  Table2,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import {
  type HomeLifeState,
  type IncomeStream,
  type AssetItem,
  type ChoreItem,
  type BudgetEnvelope,
  type DreamGoal,
  type DreamGoalKind,
  type IncomeType,
  type AssetCategory,
  type BudgetCategory,
  summarizeHomeLife,
  newIncome,
  newAsset,
  newChore,
  newBudget,
  newDreamGoal,
  DREAM_GOAL_KINDS,
  goalKindLabel,
} from "../homeLife";
import { downloadCsv } from "../exportKit";
import { consumeLifeNavIntent } from "../deckGuide";
import {
  CURRENCIES,
  type CurrencyCode,
  convertAmount,
  formatMoney,
  formatNative,
  loadCurrencyPrefs,
  ratesFooter,
} from "../currency";

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";

type Tab = "overview" | "income" | "assets" | "chores" | "budgets" | "goals";

interface HomeLifeHubProps {
  state: HomeLifeState;
  onChange: (next: HomeLifeState) => void;
}

export default function HomeLifeHub({ state, onChange }: HomeLifeHubProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [fxTick, setFxTick] = useState(0);

  useEffect(() => {
    const onFx = () => setFxTick((n) => n + 1);
    window.addEventListener("homeos-currency-change", onFx);
    window.addEventListener("storage", onFx);
    return () => {
      window.removeEventListener("homeos-currency-change", onFx);
      window.removeEventListener("storage", onFx);
    };
  }, []);

  const displayCurrency = useMemo(
    () => loadCurrencyPrefs().displayCurrency,
    [fxTick]
  );
  const stats = useMemo(
    () => summarizeHomeLife(state, displayCurrency),
    [state, displayCurrency, fxTick]
  );
  const goals = state.goals || [];
  const money = (n: number, code?: CurrencyCode) =>
    formatMoney(n, code || displayCurrency);

  // Deep-link from Command Deck guide / ribbon (income, assets, goals + open Add)
  useEffect(() => {
    const intent = consumeLifeNavIntent();
    if (!intent) return;
    const next = intent.tab as Tab;
    if (
      next === "overview" ||
      next === "income" ||
      next === "assets" ||
      next === "chores" ||
      next === "budgets" ||
      next === "goals"
    ) {
      setTab(next);
      if (intent.openAdd && next !== "overview") setShowAdd(true);
    }
  }, []);

  const patch = (partial: Partial<HomeLifeState>) => onChange({ ...state, ...partial });

  const exportAll = () => {
    downloadCsv(
      `homeos-life-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Section", "Name", "Detail", "Amount", "Status"],
      [
        ...state.incomes.map((i) => [
          "Income",
          i.name,
          i.type,
          i.amountMonthly,
          i.active ? "Active" : "Paused",
        ]),
        ...state.assets.map((a) => ["Asset", a.name, a.category, a.value, "—"]),
        ...state.chores.map((c) => ["Chore", c.title, c.assignee, c.frequency, c.status]),
        ...state.budgets.map((b) => [
          "Budget",
          b.name,
          b.category,
          b.limit,
          `Spent ${b.spent}`,
        ]),
        ...goals.map((g) => [
          "Goal",
          g.name,
          goalKindLabel(g),
          g.targetAmount,
          `Saved ${g.savedAmount}`,
        ]),
      ]
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "income", label: "Income", icon: Wallet },
    { id: "assets", label: "Assets", icon: Landmark },
    { id: "chores", label: "Chores", icon: ListChecks },
    { id: "budgets", label: "Budgets", icon: Plane },
    { id: "goals", label: "Dream savings", icon: Target },
  ];

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 sm:p-5 overflow-y-auto max-w-7xl w-full mx-auto pb-24 safe-bottom">
      <header className={`${panel} px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight">Home Life</h1>
            <p className="text-[11px] text-[#8E8E93] font-medium truncate">
              Income · assets · chores · travel & budgets — totals in{" "}
              <span className="text-white/70 font-bold">{displayCurrency}</span>
              {stats.multiCurrency ? " · multi-currency converted" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportAll}
            className="h-10 px-3 rounded-xl border border-[#1F1F23] bg-[#121215] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          {tab !== "overview" && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="h-10 px-3 rounded-xl bg-white text-black text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>
      </header>

      {/* Stats — converted to display currency */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          {
            l: "Monthly income",
            v: money(stats.monthlyIncome),
            h: stats.multiCurrency
              ? `Converted · ${displayCurrency}`
              : `All active streams · ${displayCurrency}`,
          },
          { l: "Side hustle", v: money(stats.sideIncome), h: "Freelance + hustle" },
          {
            l: "Assets",
            v: money(stats.totalAssets),
            h: stats.assetsByCurrency.length > 1
              ? `${stats.assetsByCurrency.length} currencies → ${displayCurrency}`
              : `Tracked value · ${displayCurrency}`,
          },
          { l: "Open chores", v: String(stats.openChores), h: "Household tasks" },
          {
            l: "Dream savings",
            v: `${stats.goalsPct}%`,
            h: `${money(stats.goalsSaved)} of ${money(stats.goalsTarget)}`,
          },
        ].map((s) => (
          <div key={s.l} className={`${panel} px-3.5 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">{s.l}</p>
            <p className="text-xl font-black text-white tabular-nums mt-0.5">{s.v}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">{s.h}</p>
          </div>
        ))}
      </div>
      {stats.multiCurrency && (
        <p className="text-[10px] text-[#71717A] font-medium px-0.5 -mt-1">
          Cross-currency totals use your display currency ({displayCurrency}).{" "}
          {ratesFooter()}. Change in Settings → Currency.
        </p>
      )}

      {/* Tabs */}
      <div className={`${panel} p-1.5 flex flex-wrap gap-1`}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setShowAdd(false);
              }}
              className={`h-9 px-3 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                active
                  ? "bg-white text-black"
                  : "text-[#8E8E93] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Where numbers live — always visible for empty vaults */}
          {(!state.incomes.length || !state.assets.length) && (
            <div className={`${panel} p-4 lg:col-span-2 border border-amber-500/20 bg-amber-500/[0.04]`}>
              <div className="flex items-start gap-2.5 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-black text-white">Start here — enter your numbers</h2>
                  <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5 leading-relaxed">
                    Command Deck net worth and income come from these lists. There is no separate
                    “net worth” form — add <strong className="text-white/80">assets</strong> and{" "}
                    <strong className="text-white/80">income streams</strong> below.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "income" as Tab,
                    icon: Wallet,
                    t: "Monthly income",
                    d: "Salary, freelance, side hustles — each stream with amount/mo",
                    done: state.incomes.length > 0,
                  },
                  {
                    id: "assets" as Tab,
                    icon: Landmark,
                    t: "Assets → net worth",
                    d: "Property equity, vehicles, investments, cash reserves",
                    done: state.assets.length > 0,
                  },
                  {
                    id: "goals" as Tab,
                    icon: Target,
                    t: "Dream savings",
                    d: "Targets that fund % on the deck and add to net worth",
                    done: goals.length > 0,
                  },
                ].map(({ id, icon: Icon, t, d, done }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTab(id);
                      if (!done) setShowAdd(true);
                    }}
                    className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                      done
                        ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                        : "border-white/10 bg-black/30 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-[12px] font-black text-white">{t}</span>
                      {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                    </div>
                    <p className="text-[10px] text-[#8E8E93] font-medium leading-snug">{d}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-white/55">
                      {done ? "Manage" : "Add now"}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white">Cash flow snapshot</h2>
            </div>
            <p className="text-xs text-[#8E8E93] leading-relaxed mb-3">
              Active income streams total{" "}
              <span className="text-white font-bold">{money(stats.monthlyIncome)}/mo</span>. Side
              hustles contribute{" "}
              <span className="text-white font-bold">{money(stats.sideIncome)}/mo</span>.
            </p>
            <div className="space-y-2">
              {state.incomes
                .filter((i) => i.active)
                .slice(0, 5)
                .map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between gap-2 py-2 border-t border-[#1F1F23]"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{i.name}</p>
                      <p className="text-[10px] text-[#8E8E93]">{i.type}</p>
                    </div>
                    <span className="text-[12px] font-black text-white tabular-nums shrink-0">
                      {formatNative(i.amountMonthly, i.currency || displayCurrency)}
                    </span>
                  </div>
                ))}
              {!state.incomes.length && (
                <p className="text-[11px] text-[#71717A] font-medium py-2 border-t border-[#1F1F23]">
                  No streams yet — add salary or side income to feed the Command Deck.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setTab("income");
                setShowAdd(true);
              }}
              className="mt-3 h-9 px-3 rounded-xl bg-white text-black text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {state.incomes.length ? "Add another stream" : "Add income stream"}
            </button>
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-black text-white">Budgets & travel</h2>
            </div>
            <p className="text-xs text-[#8E8E93] mb-3">
              <span className="text-white font-bold">{money(stats.budgetSpent)}</span> spent of{" "}
              <span className="text-white font-bold">{money(stats.budgetLimit)}</span> across
              envelopes ·{" "}
              <span className="text-emerald-400 font-bold">{money(stats.budgetLeft)}</span> left
            </p>
            <div className="space-y-3">
              {state.budgets.slice(0, 4).map((b) => {
                const pct = b.limit > 0 ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0;
                const over = b.spent > b.limit;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-white">{b.name}</span>
                      <span className={`tabular-nums font-bold ${over ? "text-red-400" : "text-[#8E8E93]"}`}>
                        {money(b.spent)} / {money(b.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#121215] border border-[#1F1F23] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${over ? "bg-red-400" : "bg-white/70"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setTab("budgets")}
              className="mt-3 text-[11px] font-bold text-white/60 hover:text-white cursor-pointer"
            >
              Manage budgets →
            </button>
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-white" />
              <h2 className="text-sm font-black text-white">Asset base</h2>
            </div>
            <p className="text-2xl font-black text-white tabular-nums mb-2">
              {money(stats.totalAssets)}
            </p>
            <div className="space-y-2">
              {state.assets.slice(0, 4).map((a) => (
                <div key={a.id} className="flex justify-between gap-2 text-[12px] border-t border-[#1F1F23] pt-2">
                  <span className="text-white font-semibold truncate">{a.name}</span>
                  <span className="text-[#8E8E93] tabular-nums shrink-0">
                    {formatNative(a.value, a.currency || displayCurrency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-white" />
              <h2 className="text-sm font-black text-white">Household board</h2>
            </div>
            <div className="space-y-2">
              {state.chores.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    patch({
                      chores: state.chores.map((x) =>
                        x.id === c.id
                          ? { ...x, status: x.status === "Done" ? "Todo" : "Done" }
                          : x
                      ),
                    });
                  }}
                  className="w-full flex items-center gap-2.5 text-left py-2 border-t border-[#1F1F23] cursor-pointer hover:bg-white/[0.02] rounded-lg"
                >
                  {c.status === "Done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#6B7280] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[12px] font-bold truncate ${
                        c.status === "Done" ? "text-[#6B7280] line-through" : "text-white"
                      }`}
                    >
                      {c.title}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">
                      {c.assignee} · {c.frequency}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white" />
                <h2 className="text-sm font-black text-white">Dream savings</h2>
              </div>
              <button
                type="button"
                onClick={() => setTab("goals")}
                className="text-[11px] font-bold text-white/60 hover:text-white"
              >
                Open →
              </button>
            </div>
            <p className="text-xs text-[#8E8E93] mb-3">
              <span className="text-white font-bold">{money(stats.goalsSaved)}</span> saved of{" "}
              <span className="text-white font-bold">{money(stats.goalsTarget)}</span> ·{" "}
              <span className="text-white font-bold">{money(stats.goalsMonthly)}/mo</span> pledged
            </p>
            <div className="space-y-2.5">
              {goals.slice(0, 4).map((g) => {
                const pct =
                  g.targetAmount > 0
                    ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                    : 0;
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-white truncate">
                        {g.name}{" "}
                        <span className="text-[#6B7280] font-semibold">· {goalKindLabel(g)}</span>
                      </span>
                      <span className="tabular-nums text-[#8E8E93] shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#121215] border border-[#1F1F23] overflow-hidden">
                      <div className="h-full bg-white/75 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <p className="text-[11px] text-[#6B7280]">
                  Add land, bike, car, wedding, or retirement goals for accountability.
                </p>
              )}
            </div>
          </div>

          <div className={`${panel} p-4 lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 justify-between`}>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-white">This is HomeOS — not rent-only</p>
                <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed max-w-xl">
                  Pair Home Life with Property Hub, Ledger, Utilities, and Document Vault. One
                  operating system for housing, money, assets, travel, dream purchases, and household ops.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "goals" && (
        <GoalsPanel
          items={goals}
          customOptions={state.customOptions || []}
          viewMode={viewMode}
          onViewMode={setViewMode}
          displayCurrency={displayCurrency}
          onChange={(nextGoals) => patch({ goals: nextGoals })}
          onAddCustomKind={(label) =>
            patch({
              customOptions: [
                ...(state.customOptions || []),
                {
                  id: `opt-${Date.now()}`,
                  domain: "goal_kind",
                  label,
                },
              ],
            })
          }
          showAdd={showAdd}
          onOpenAdd={() => setShowAdd(true)}
          onCloseAdd={() => setShowAdd(false)}
        />
      )}

      {tab === "income" && (
        <IncomePanel
          items={state.incomes}
          displayCurrency={displayCurrency}
          onChange={(incomes) => patch({ incomes })}
          showAdd={showAdd}
          onOpenAdd={() => setShowAdd(true)}
          onCloseAdd={() => setShowAdd(false)}
        />
      )}
      {tab === "assets" && (
        <AssetsPanel
          items={state.assets}
          displayCurrency={displayCurrency}
          onChange={(assets) => patch({ assets })}
          showAdd={showAdd}
          onOpenAdd={() => setShowAdd(true)}
          onCloseAdd={() => setShowAdd(false)}
        />
      )}
      {tab === "chores" && (
        <ChoresPanel
          items={state.chores}
          onChange={(chores) => patch({ chores })}
          showAdd={showAdd}
          onOpenAdd={() => setShowAdd(true)}
          onCloseAdd={() => setShowAdd(false)}
        />
      )}
      {tab === "budgets" && (
        <BudgetsPanel
          items={state.budgets}
          displayCurrency={displayCurrency}
          onChange={(budgets) => patch({ budgets })}
          showAdd={showAdd}
          onOpenAdd={() => setShowAdd(true)}
          onCloseAdd={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
  className = "",
}: {
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
  className?: string;
}) {
  return (
    <select
      className={className || inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.label}
        </option>
      ))}
    </select>
  );
}

function IncomePanel({
  items,
  displayCurrency,
  onChange,
  showAdd,
  onOpenAdd,
  onCloseAdd,
}: {
  items: IncomeStream[];
  displayCurrency: CurrencyCode;
  onChange: (v: IncomeStream[]) => void;
  showAdd: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "Salary" as IncomeType,
    amount: "",
    currency: displayCurrency as CurrencyCode,
  });

  useEffect(() => {
    setForm((f) =>
      !f.amount && !f.name ? { ...f, currency: displayCurrency } : f
    );
  }, [displayCurrency]);

  const types: IncomeType[] = [
    "Salary",
    "Side hustle",
    "Freelance",
    "Investment",
    "Rental income",
    "Gift",
    "Other",
  ];

  const add = () => {
    const amount = Number(form.amount);
    if (!form.name.trim() || !amount || amount < 0) return;
    onChange([
      newIncome({
        name: form.name.trim(),
        type: form.type,
        amountMonthly: amount,
        currency: form.currency,
      }),
      ...items,
    ]);
    setForm({ name: "", type: "Salary", amount: "", currency: displayCurrency });
    onCloseAdd();
  };

  return (
    <div className="space-y-2.5">
      <div className={`${panel} px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2`}>
        <p className="text-[11px] text-[#8E8E93] font-medium leading-snug max-w-lg">
          Each stream can be in its own currency (salary in INR, freelance in USD…). Deck totals
          convert to <span className="text-white/80 font-bold">{displayCurrency}</span>.
        </p>
        {!showAdd && (
          <button type="button" onClick={onOpenAdd} className={primaryBtn + " !w-auto !px-3 !h-9 !text-[11px]"}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            Add stream
          </button>
        )}
      </div>
      <AnimatePresence>
        {showAdd && (
          <AddShell title="Add income stream" onClose={onCloseAdd}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Source name
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Primary salary, US client retainer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Type
            </label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as IncomeType })}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Monthly amount
                </label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="e.g. 75000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Currency
                </label>
                <CurrencySelect
                  value={form.currency}
                  onChange={(c) => setForm({ ...form, currency: c })}
                />
              </div>
            </div>
            <button type="button" onClick={add} className={primaryBtn}>
              Save income stream
            </button>
          </AddShell>
        )}
      </AnimatePresence>
      {items.map((i) => {
        const code = (i.currency || displayCurrency) as CurrencyCode;
        const converted =
          code !== displayCurrency
            ? formatMoney(
                convertAmount(i.amountMonthly, code, displayCurrency),
                displayCurrency
              )
            : null;
        return (
          <div key={i.id} className={`${panel} p-3.5 flex items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate">{i.name}</p>
              <p className="text-[10px] text-[#8E8E93]">
                {i.type} · {code} · {i.active ? "Active" : "Paused"}
                {converted ? ` · ≈ ${converted}/mo` : ""}
              </p>
            </div>
            <span className="text-sm font-black text-white tabular-nums">
              {formatNative(i.amountMonthly, code)}
            </span>
            <button
              type="button"
              onClick={() =>
                onChange(items.map((x) => (x.id === i.id ? { ...x, active: !x.active } : x)))
              }
              className="h-8 px-2 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white cursor-pointer"
            >
              {i.active ? "Pause" : "Activate"}
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x.id !== i.id))}
              className="h-8 w-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      {!items.length && !showAdd && (
        <Empty
          label="No income streams yet"
          hint="Add salary or side hustles in any currency — converted on the Command Deck."
          cta="Add income stream"
          onCta={onOpenAdd}
        />
      )}
    </div>
  );
}

function AssetsPanel({
  items,
  displayCurrency,
  onChange,
  showAdd,
  onOpenAdd,
  onCloseAdd,
}: {
  items: AssetItem[];
  displayCurrency: CurrencyCode;
  onChange: (v: AssetItem[]) => void;
  showAdd: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "Investment" as AssetCategory,
    value: "",
    currency: displayCurrency as CurrencyCode,
  });

  useEffect(() => {
    setForm((f) =>
      !f.value && !f.name ? { ...f, currency: displayCurrency } : f
    );
  }, [displayCurrency]);

  const cats: AssetCategory[] = [
    "Property",
    "Vehicle",
    "Electronics",
    "Investment",
    "Furniture",
    "Collectible",
    "Other",
  ];

  const add = () => {
    if (!form.name.trim() || form.value === "") return;
    const value = Number(form.value);
    if (!Number.isFinite(value) || value < 0) return;
    if (value === 0) {
      // Zero-value assets confuse setup progress — require a real number
      return;
    }
    onChange([
      newAsset({
        name: form.name.trim(),
        category: form.category,
        value,
        currency: form.currency,
      }),
      ...items,
    ]);
    setForm({ name: "", category: "Investment", value: "", currency: displayCurrency });
    onCloseAdd();
  };

  return (
    <div className="space-y-2.5">
      <div className={`${panel} px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2`}>
        <p className="text-[11px] text-[#8E8E93] font-medium leading-snug max-w-lg">
          Hold assets in different currencies (US stocks, local home equity). Net worth* on the deck
          converts everything to <span className="text-white/80 font-bold">{displayCurrency}</span>.
        </p>
        {!showAdd && (
          <button type="button" onClick={onOpenAdd} className={primaryBtn + " !w-auto !px-3 !h-9 !text-[11px]"}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            Add asset
          </button>
        )}
      </div>
      <AnimatePresence>
        {showAdd && (
          <AddShell title="Add asset (feeds net worth)" onClose={onCloseAdd}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Asset name
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Home equity, US brokerage, Car"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Category
            </label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as AssetCategory })}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Estimated value
                </label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  placeholder="e.g. 2500000"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  Currency
                </label>
                <CurrencySelect
                  value={form.currency}
                  onChange={(c) => setForm({ ...form, currency: c })}
                />
              </div>
            </div>
            <button type="button" onClick={add} className={primaryBtn}>
              Save asset
            </button>
          </AddShell>
        )}
      </AnimatePresence>
      {items.map((a) => {
        const code = (a.currency || displayCurrency) as CurrencyCode;
        return (
          <div key={a.id} className={`${panel} p-3.5 flex items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white truncate">{a.name}</p>
              <p className="text-[10px] text-[#8E8E93]">
                {a.category} · {code}
              </p>
            </div>
            <span className="text-sm font-black text-white tabular-nums text-right">
              {formatNative(a.value, code)}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x.id !== a.id))}
              className="h-8 w-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      {!items.length && !showAdd && (
        <Empty
          label="No assets tracked yet"
          hint="Add property equity, investments, vehicles in any currency — values build Net worth*."
          cta="Add first asset"
          onCta={onOpenAdd}
        />
      )}
    </div>
  );
}

function ChoresPanel({
  items,
  onChange,
  showAdd,
  onOpenAdd,
  onCloseAdd,
}: {
  items: ChoreItem[];
  onChange: (v: ChoreItem[]) => void;
  showAdd: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    assignee: "You",
    frequency: "Weekly" as ChoreItem["frequency"],
    priority: "Medium" as ChoreItem["priority"],
  });

  const add = () => {
    if (!form.title.trim()) return;
    onChange([
      newChore({
        title: form.title.trim(),
        assignee: form.assignee.trim() || "You",
        frequency: form.frequency,
        priority: form.priority,
      }),
      ...items,
    ]);
    setForm({ title: "", assignee: "You", frequency: "Weekly", priority: "Medium" });
    onCloseAdd();
  };

  return (
    <div className="space-y-2.5">
      <AnimatePresence>
        {showAdd && (
          <AddShell title="Add household chore" onClose={onCloseAdd}>
            <input
              className={inputCls}
              placeholder="Chore title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Assignee"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            />
            <select
              className={inputCls}
              value={form.frequency}
              onChange={(e) =>
                setForm({ ...form, frequency: e.target.value as ChoreItem["frequency"] })
              }
            >
              {["Daily", "Weekly", "Monthly", "Once"].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as ChoreItem["priority"] })
              }
            >
              {["High", "Medium", "Low"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="button" onClick={add} className={primaryBtn}>
              Save chore
            </button>
          </AddShell>
        )}
      </AnimatePresence>
      {items.map((c) => (
        <div key={c.id} className={`${panel} p-3.5 flex items-center gap-3`}>
          <button
            type="button"
            onClick={() =>
              onChange(
                items.map((x) =>
                  x.id === c.id ? { ...x, status: x.status === "Done" ? "Todo" : "Done" } : x
                )
              )
            }
            className="shrink-0 cursor-pointer"
            aria-label="Toggle done"
          >
            {c.status === "Done" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-[#6B7280]" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[13px] font-bold truncate ${
                c.status === "Done" ? "text-[#6B7280] line-through" : "text-white"
              }`}
            >
              {c.title}
            </p>
            <p className="text-[10px] text-[#8E8E93]">
              {c.assignee} · {c.frequency} · {c.priority}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((x) => x.id !== c.id))}
            className="h-8 w-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-red-400 inline-flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {!items.length && !showAdd && (
        <Empty
          label="No chores on the board"
          hint="Assign household tasks with cadence and priority."
          cta="Add a chore"
          onCta={onOpenAdd}
        />
      )}
    </div>
  );
}

function BudgetsPanel({
  items,
  displayCurrency,
  onChange,
  showAdd,
  onOpenAdd,
  onCloseAdd,
}: {
  items: BudgetEnvelope[];
  displayCurrency: CurrencyCode;
  onChange: (v: BudgetEnvelope[]) => void;
  showAdd: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "Travel" as BudgetCategory,
    limit: "",
    spent: "0",
    period: "Monthly" as BudgetEnvelope["period"],
    currency: displayCurrency as CurrencyCode,
  });
  const cats: BudgetCategory[] = [
    "Travel",
    "Groceries",
    "Entertainment",
    "Home",
    "Health",
    "Education",
    "Side hustle",
    "Other",
  ];

  const add = () => {
    const limit = Number(form.limit);
    const spent = Number(form.spent) || 0;
    if (!form.name.trim() || !limit || limit < 0) return;
    onChange([
      newBudget({
        name: form.name.trim(),
        category: form.category,
        limit,
        spent,
        period: form.period,
        currency: form.currency,
      }),
      ...items,
    ]);
    setForm({
      name: "",
      category: "Travel",
      limit: "",
      spent: "0",
      period: "Monthly",
      currency: displayCurrency,
    });
    onCloseAdd();
  };

  return (
    <div className="space-y-2.5">
      <AnimatePresence>
        {showAdd && (
          <AddShell title="Add budget envelope" onClose={onCloseAdd}>
            <input
              className={inputCls}
              placeholder="Name (e.g. Bali trip)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={form.period}
              onChange={(e) =>
                setForm({ ...form, period: e.target.value as BudgetEnvelope["period"] })
              }
            >
              {["Monthly", "Trip", "Yearly"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                type="number"
                min={0}
                placeholder="Budget limit"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
              />
              <CurrencySelect
                value={form.currency}
                onChange={(c) => setForm({ ...form, currency: c })}
              />
            </div>
            <input
              className={inputCls}
              type="number"
              min={0}
              placeholder="Already spent"
              value={form.spent}
              onChange={(e) => setForm({ ...form, spent: e.target.value })}
            />
            <button type="button" onClick={add} className={primaryBtn}>
              Save budget
            </button>
          </AddShell>
        )}
      </AnimatePresence>
      {items.map((b) => {
        const code = (b.currency || displayCurrency) as CurrencyCode;
        const pct = b.limit > 0 ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0;
        const over = b.spent > b.limit;
        return (
          <div key={b.id} className={`${panel} p-3.5`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white">{b.name}</p>
                <p className="text-[10px] text-[#8E8E93]">
                  {b.category} · {b.period} · {code}
                </p>
              </div>
              <span className={`text-sm font-black tabular-nums ${over ? "text-red-400" : "text-white"}`}>
                {formatMoney(b.spent, code)}/{formatMoney(b.limit, code)}
              </span>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x.id !== b.id))}
                className="h-8 w-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-red-400 inline-flex items-center justify-center cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-[#121215] border border-[#1F1F23] overflow-hidden">
              <div
                className={`h-full rounded-full ${over ? "bg-red-400" : "bg-[#F59E0B]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    items.map((x) =>
                      x.id === b.id ? { ...x, spent: Math.max(0, x.spent - 50) } : x
                    )
                  )
                }
                className="h-8 px-2 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white cursor-pointer"
              >
                −50
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(items.map((x) => (x.id === b.id ? { ...x, spent: x.spent + 50 } : x)))
                }
                className="h-8 px-2 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white cursor-pointer"
              >
                +50 spent
              </button>
            </div>
          </div>
        );
      })}
      {!items.length && !showAdd && (
        <Empty
          label="No budget envelopes yet"
          hint="Add travel, groceries, or home envelopes — multi-currency supported."
          cta="Add a budget"
          onCta={onOpenAdd}
        />
      )}
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-white/25";
const primaryBtn =
  "w-full h-11 rounded-xl bg-white text-black text-xs font-black cursor-pointer";

function AddShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`${panel} p-4 space-y-2.5`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg border border-[#1F1F23] inline-flex items-center justify-center text-[#8E8E93] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function GoalsPanel({
  items,
  customOptions,
  viewMode,
  onViewMode,
  onChange,
  onAddCustomKind,
  showAdd,
  onOpenAdd,
  onCloseAdd,
  displayCurrency = loadCurrencyPrefs().displayCurrency,
}: {
  items: DreamGoal[];
  customOptions: { id: string; domain: string; label: string }[];
  viewMode: "cards" | "table";
  onViewMode: (v: "cards" | "table") => void;
  onChange: (v: DreamGoal[]) => void;
  onAddCustomKind: (label: string) => void;
  showAdd: boolean;
  onOpenAdd?: () => void;
  onCloseAdd: () => void;
  displayCurrency?: CurrencyCode;
}) {
  const [form, setForm] = useState({
    name: "",
    kind: "Wedding" as DreamGoalKind,
    customKindLabel: "",
    targetAmount: "10000",
    savedAmount: "0",
    monthlyContribution: "500",
    targetDate: "",
    notes: "",
    currency: displayCurrency as CurrencyCode,
  });
  const [newKind, setNewKind] = useState("");
  const money = (n: number, code?: CurrencyCode) =>
    formatMoney(n, code || displayCurrency);

  const kindOptions = [
    ...DREAM_GOAL_KINDS.filter((k) => k !== "Custom"),
    ...customOptions.filter((o) => o.domain === "goal_kind").map((o) => o.label),
    "Custom",
  ];

  const add = () => {
    if (!form.name.trim()) return;
    const kind: DreamGoalKind =
      DREAM_GOAL_KINDS.includes(form.kind as DreamGoalKind) && form.kind !== "Custom"
        ? form.kind
        : kindOptions.includes(form.kind) && form.kind !== "Custom"
          ? "Custom"
          : form.kind === "Custom"
            ? "Custom"
            : (form.kind as DreamGoalKind);
    const isPreset = DREAM_GOAL_KINDS.includes(form.kind as DreamGoalKind);
    onChange([
      ...items,
      newDreamGoal({
        name: form.name.trim(),
        kind: isPreset ? (form.kind as DreamGoalKind) : "Custom",
        customKindLabel: !isPreset || form.kind === "Custom" ? form.customKindLabel || form.kind : undefined,
        targetAmount: parseFloat(form.targetAmount) || 0,
        savedAmount: parseFloat(form.savedAmount) || 0,
        monthlyContribution: parseFloat(form.monthlyContribution) || 0,
        currency: form.currency,
        targetDate: form.targetDate || undefined,
        notes: form.notes || undefined,
      }),
    ]);
    onCloseAdd();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#8E8E93] font-medium max-w-xl">
          Accountability for dream purchases — land, bike, car, wedding, retirement, or your own
          labels. Update saved amounts as you contribute.
        </p>
        <div className="inline-flex p-0.5 rounded-xl border border-[#1F1F23] bg-[#121215]">
          <button
            type="button"
            onClick={() => onViewMode("cards")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
              viewMode === "cards" ? "bg-white text-black" : "text-[#8E8E93]"
            }`}
          >
            <LayoutGrid className="w-3 h-3" /> Cards
          </button>
          <button
            type="button"
            onClick={() => onViewMode("table")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
              viewMode === "table" ? "bg-white text-black" : "text-[#8E8E93]"
            }`}
          >
            <Table2 className="w-3 h-3" /> Table
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddShell title="New dream goal" onClose={onCloseAdd}>
            <input
              className={inputCls}
              placeholder="Goal name (e.g. Plot near hometown)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              Currency
            </label>
            <CurrencySelect
              value={form.currency}
              onChange={(c) => setForm({ ...form, currency: c })}
            />
            <select
              className={inputCls}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as DreamGoalKind })}
            >
              {kindOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            {(form.kind === "Custom" ||
              !DREAM_GOAL_KINDS.includes(form.kind as DreamGoalKind)) && (
              <input
                className={inputCls}
                placeholder="Custom category label"
                value={form.customKindLabel}
                onChange={(e) => setForm({ ...form, customKindLabel: e.target.value })}
              />
            )}
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                type="number"
                placeholder="Target"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
              <input
                className={inputCls}
                type="number"
                placeholder="Saved"
                value={form.savedAmount}
                onChange={(e) => setForm({ ...form, savedAmount: e.target.value })}
              />
              <input
                className={inputCls}
                type="number"
                placeholder="$ / mo"
                value={form.monthlyContribution}
                onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
              />
            </div>
            <input
              className={inputCls}
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="New custom category (e.g. Startup fund)"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
              />
              <button
                type="button"
                className="shrink-0 h-11 px-3 rounded-xl border border-[#1F1F23] text-xs font-bold text-white"
                onClick={() => {
                  if (newKind.trim()) {
                    onAddCustomKind(newKind.trim());
                    setForm({ ...form, kind: "Custom", customKindLabel: newKind.trim() });
                    setNewKind("");
                  }
                }}
              >
                Add category
              </button>
            </div>
            <button type="button" onClick={add} className={primaryBtn}>
              Save goal
            </button>
          </AddShell>
        )}
      </AnimatePresence>

      {/* Graph strip */}
      {items.length > 0 && viewMode === "cards" && (
        <div className={`${panel} p-4`}>
          <p className="text-[10px] font-bold uppercase text-[#6B7280] mb-2">Progress chart</p>
          <div className="flex items-end gap-2 h-24">
            {items.map((g) => {
              const pct =
                g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full h-20 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-white/80"
                      style={{ height: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-[#6B7280] truncate w-full text-center">
                    {goalKindLabel(g)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "table" ? (
        <div className={`${panel} p-3 overflow-x-auto`}>
          <table className="w-full text-left text-[11px] min-w-[560px]">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#1F1F23]">
                <th className="py-2 font-bold">Goal</th>
                <th className="py-2 font-bold">Kind</th>
                <th className="py-2 font-bold text-right">Saved</th>
                <th className="py-2 font-bold text-right">Target</th>
                <th className="py-2 font-bold text-right">Monthly</th>
                <th className="py-2 font-bold text-right">%</th>
                <th className="py-2 font-bold" />
              </tr>
            </thead>
            <tbody>
              {items.map((g) => {
                const pct =
                  g.targetAmount > 0
                    ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                    : 0;
                return (
                  <tr key={g.id} className="border-b border-[#1F1F23]/60 text-white">
                    <td className="py-2 font-semibold">{g.name}</td>
                    <td className="py-2 text-[#8E8E93]">{goalKindLabel(g)}</td>
                    <td className="py-2 text-right tabular-nums">
                      <input
                        type="number"
                        className="w-20 bg-transparent border border-[#1F1F23] rounded-md px-1 py-0.5 text-right"
                        value={g.savedAmount}
                        onChange={(e) =>
                          onChange(
                            items.map((x) =>
                              x.id === g.id
                                ? { ...x, savedAmount: parseFloat(e.target.value) || 0 }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {money(g.targetAmount, g.currency)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[#8E8E93]">
                      {money(g.monthlyContribution, g.currency)}
                    </td>
                    <td className="py-2 text-right font-bold">{pct}%</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onChange(items.filter((x) => x.id !== g.id))}
                        className="text-[#8E8E93] hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!items.length && !showAdd && (
            <Empty
              label="No dream goals yet"
              hint="Land, wedding, car, retirement — set a target and track saved amounts."
              cta="Add a dream goal"
              onCta={onOpenAdd}
            />
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {items.map((g) => {
            const pct =
              g.targetAmount > 0
                ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                : 0;
            return (
              <div key={g.id} className={`${panel} p-4 flex flex-col gap-2`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-white/40">
                      {goalKindLabel(g)}
                    </p>
                    <h3 className="text-sm font-black text-white truncate">{g.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((x) => x.id !== g.id))}
                    className="text-[#6B7280] hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[12px] font-bold text-white tabular-nums">
                  {money(g.savedAmount, g.currency)}{" "}
                  <span className="text-[#6B7280] font-semibold">
                    of {money(g.targetAmount, g.currency)}
                  </span>
                </p>
                <div className="h-2 rounded-full bg-[#121215] border border-[#1F1F23] overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-[#8E8E93] font-medium">
                  <span>{pct}% funded</span>
                  {g.monthlyContribution > 0 && (
                    <span>+{money(g.monthlyContribution, g.currency)}/mo</span>
                  )}
                  {g.targetDate && <span>Target {g.targetDate}</span>}
                </div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">
                  Update saved
                  <input
                    type="number"
                    className={`${inputCls} mt-1`}
                    value={g.savedAmount}
                    onChange={(e) =>
                      onChange(
                        items.map((x) =>
                          x.id === g.id
                            ? { ...x, savedAmount: parseFloat(e.target.value) || 0 }
                            : x
                        )
                      )
                    }
                  />
                </label>
              </div>
            );
          })}
          {!items.length && !showAdd && (
            <Empty
              label="No dream goals yet"
              hint="Add wedding, land, car, retirement…"
              cta="Add a dream goal"
              onCta={onOpenAdd}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Empty({
  label,
  hint,
  cta,
  onCta,
}: {
  label: string;
  hint?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className={`${panel} px-6 py-10 text-center flex flex-col items-center gap-2`}>
      <p className="text-sm font-black text-white">{label}</p>
      {hint && (
        <p className="text-[11px] text-[#8E8E93] font-medium max-w-sm leading-relaxed">{hint}</p>
      )}
      {cta && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-2 h-10 px-4 rounded-xl bg-white text-black text-[12px] font-black inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {cta}
        </button>
      )}
    </div>
  );
}
