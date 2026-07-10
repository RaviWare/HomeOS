import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  Users,
  Check,
  Briefcase,
  Sparkles,
  Home,
  Wrench,
  Scale,
  LayoutDashboard,
  Layers,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import {
  CATEGORY_FLOW,
  ROLE_UI,
  PERSONAS,
  type PersonaId,
} from "../../userPersonas";

interface RolesPageProps {
  onLaunch: () => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  household: Home,
  owner: Building2,
  operator: Briefcase,
  advisor: Scale,
  field: Wrench,
};

const HIGHLIGHTS = [
  {
    icon: Home,
    t: "Individuals first",
    d: "Home renters and live-in owners lead the catalog — then rentals, societies, and businesses.",
  },
  {
    icon: Users,
    t: "Rentals to enterprises",
    d: "Long-term leases, short-stay channels, society dues, builder inventory — one product surface.",
  },
  {
    icon: LayoutDashboard,
    t: "Fully rearrangeable",
    d: "Pin, hide, and reorder modules. Custom roles seed a deck you can reshape.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

/** Marketing roles page — synced with How it works premium layout */
export default function RolesPage({ onLaunch }: RolesPageProps) {
  const [activeCat, setActiveCat] = useState<PersonaId | string>("household");
  const cat =
    CATEGORY_FLOW.find((c) => c.id === activeCat) || CATEGORY_FLOW[0];
  const [activeRole, setActiveRole] = useState(cat.roles[0]?.role || "Tenant");

  // When category changes externally, keep role valid
  const role =
    cat.roles.find((r) => r.role === activeRole) || cat.roles[0];
  const ui = role ? ROLE_UI[role.role] : ROLE_UI.Tenant;
  const persona = PERSONAS[cat.id as PersonaId] || PERSONAS.household;
  const Icon = ICONS[cat.id] || Home;
  const roleIdx = Math.max(
    0,
    cat.roles.findIndex((r) => r.role === role?.role)
  );

  const selectCategory = (id: string) => {
    const next = CATEGORY_FLOW.find((c) => c.id === id) || CATEGORY_FLOW[0];
    setActiveCat(next.id);
    setActiveRole(next.recommendedRole);
  };

  return (
    <div className="animate-pageEnter">
      {/* Hero + interactive role board */}
      <section className="relative pt-1 pb-5 sm:pb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-[90px] pointer-events-none" />

        <div className="relative grid lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-4 min-w-0 flex flex-col gap-3">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5"
              >
                Roles & paths
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04, ease }}
                className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.15]"
              >
                One home to a
                <br />
                <span className="text-white/40">rental business.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-2 text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium max-w-[19rem]"
              >
                Individuals, multi-property rentals, short-stays, societies, builders,
                and teams — pick a path or invent a custom role.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={onLaunch}
                className="mkt-btn-primary text-[13px] px-4 py-2.5 min-h-[42px]"
              >
                Start free trial
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap gap-1.5 mt-1"
            >
              {[
                { icon: Home, label: "Individuals first" },
                { icon: Building2, label: "Rentals · STR" },
                { icon: Layers, label: "Rearrange modules" },
                { icon: Sparkles, label: "Custom role" },
              ].map(({ icon: I, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#8E8E93]"
                >
                  <I className="w-3 h-3 text-white/50" />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Interactive path board */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
            className="lg:col-span-8 mkt-card p-3 sm:p-3.5 border border-[#1F1F23]"
          >
            {/* Category strip — fixed tile height, no shadow layout shift */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
              {CATEGORY_FLOW.map((c) => {
                const CIcon = ICONS[c.id] || Home;
                const on = c.id === cat.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCategory(c.id)}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 min-h-[4rem] transition-colors duration-200 border ${
                      on
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.03] text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                    aria-pressed={on}
                    aria-label={c.title}
                  >
                    <CIcon className={`w-3.5 h-3.5 ${on ? "text-black" : ""}`} />
                    <span
                      className={`text-[9px] font-bold leading-tight text-center px-0.5 line-clamp-1 ${
                        on ? "text-black/70" : "text-white/40"
                      }`}
                    >
                      {c.title.split("·")[0].trim().split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fixed row height so category/role switches don't resize the card */}
            <div className="grid sm:grid-cols-12 gap-2.5 sm:h-[19.5rem]">
              {/* Role list — reserved space for max roles (4) + custom */}
              <div className="sm:col-span-5 flex flex-col gap-1.5 min-h-0 sm:h-full">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/35 px-0.5 shrink-0 line-clamp-1">
                  {cat.title}
                </p>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                  {cat.roles.map((r) => {
                    const on = r.role === role?.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setActiveRole(r.role)}
                        className={`text-left rounded-xl border px-2.5 py-2 transition-colors duration-200 min-h-[3.25rem] ${
                          on
                            ? "border-white bg-white/[0.07]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-white leading-tight line-clamp-1">
                            {r.title}
                          </span>
                          {on && (
                            <Check className="w-3 h-3 text-white ml-auto shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5 leading-snug line-clamp-1">
                          {r.summary}
                        </p>
                      </button>
                    );
                  })}
                  {/* Spacer keeps height stable when a category has fewer roles */}
                  {Array.from({ length: Math.max(0, 4 - cat.roles.length) }).map((_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="hidden sm:block min-h-[3.25rem] rounded-xl border border-transparent"
                      aria-hidden
                    />
                  ))}
                </div>
                <div className="rounded-xl border border-dashed border-white/15 px-2.5 py-2 shrink-0">
                  <p className="text-[11px] font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-white/50" />
                    Custom role
                  </p>
                  <p className="text-[10px] text-[#6B7280] font-medium mt-0.5 leading-snug line-clamp-1">
                    Name it yourself and arrange modules after signup.
                  </p>
                </div>
              </div>

              {/* Detail panel — absolute fade, fixed box size */}
              <div className="sm:col-span-7 relative rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 h-[18rem] sm:h-full overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${cat.id}-${role?.role}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease }}
                    className="absolute inset-0 p-3.5 sm:p-4 flex flex-col"
                  >
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h2 className="text-sm sm:text-[15px] font-black text-white tracking-tight line-clamp-1">
                            {ui.title}
                          </h2>
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45">
                            <Clock className="w-2.5 h-2.5" />
                            {persona.defaultDeckView === "life"
                              ? "Life deck"
                              : persona.defaultDeckView === "graphs"
                                ? "Trends deck"
                                : "Data deck"}
                          </span>
                        </div>
                        <p className="text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium line-clamp-2">
                          {ui.summary}
                        </p>
                      </div>
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-wider text-white/35 mb-1.5">
                      Deck emphasizes
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.75rem]">
                      {cat.customizes.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/55"
                        >
                          <Check className="w-2.5 h-2.5 text-white/40" />
                          {c}
                        </span>
                      ))}
                    </div>

                    <ul className="space-y-1.5 mb-3.5">
                      {[
                        "Sidebar & mobile chips ordered for your day",
                        "Command Deck ribbon & default view tailored",
                        "Hide or rearrange every module anytime",
                        "Custom role label — you name how you show up",
                      ].map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-1.5 text-[11px] text-white/55 font-medium leading-snug"
                        >
                          <Check className="w-2.5 h-2.5 text-white/40 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{line}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={onLaunch}
                      className="mkt-btn-primary text-[12px] px-3.5 py-2 min-h-[36px] w-full sm:w-auto mt-auto"
                    >
                      Start free with this setup
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-white/[0.06] min-h-[2.25rem]">
              <div className="flex items-center gap-1 min-w-[5.5rem]">
                {cat.roles.map((r, i) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setActiveRole(r.role)}
                    className={`h-1 rounded-full transition-[width,background-color] duration-200 ${
                      i === roleIdx ? "w-5 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={r.title}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={roleIdx === 0}
                  onClick={() => {
                    const prev = cat.roles[roleIdx - 1];
                    if (prev) setActiveRole(prev.role);
                  }}
                  className="text-[11px] font-bold text-white/40 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2 py-1 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (roleIdx < cat.roles.length - 1) {
                      setActiveRole(cat.roles[roleIdx + 1].role);
                    } else {
                      onLaunch();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {roleIdx < cat.roles.length - 1 ? "Next role" : "Start trial"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Path map */}
      <section className="pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Who HomeOS is for
          </p>
          <p className="text-[10px] font-medium text-white/30 hidden sm:block">
            Tap a path to preview the deck
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {CATEGORY_FLOW.map((c, i) => {
            const CIcon = ICONS[c.id] || Home;
            const on = c.id === cat.id;
            return (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, ease }}
                whileHover={{ y: -2 }}
                onClick={() => selectCategory(c.id)}
                className={`mkt-card p-3 flex flex-col gap-1.5 border text-left transition-colors ${
                  on ? "border-white/20 bg-white/[0.03]" : "border-[#1F1F23]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    on
                      ? "bg-white text-black"
                      : "bg-white/5 border border-white/10 text-white"
                  }`}
                >
                  <CIcon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[12px] font-black text-white leading-tight line-clamp-2">
                  {c.title}
                </p>
                <p className="text-[10px] text-[#6B7280] font-medium line-clamp-2">
                  {c.roles.length} role{c.roles.length === 1 ? "" : "s"} ·{" "}
                  {PERSONAS[c.id]?.defaultDeckView === "life"
                    ? "Life"
                    : PERSONAS[c.id]?.defaultDeckView === "graphs"
                      ? "Trends"
                      : "Data"}{" "}
                  deck
                </p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Highlights */}
      <section className="pb-5 sm:pb-6 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
              How roles shape the product
            </p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Same OS. Different default.
            </h2>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium max-w-xs sm:text-right leading-snug">
            Switch roles later in Settings — or invent your own. Your data stays private.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {HIGHLIGHTS.map(({ icon: I, t, d }, i) => (
            <motion.article
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ease }}
              whileHover={{ y: -2 }}
              className={`mkt-card p-3.5 flex flex-col gap-2 border ${
                i === 2 ? "border-white/20 bg-white/[0.03]" : "border-[#1F1F23]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <I className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[13px] font-black text-white">{t}</h3>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-snug font-medium">{d}</p>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-2.5 mkt-card p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border border-white/12"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <SlidersHorizontal className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-black text-white">Command Deck is yours</p>
              <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5 leading-snug">
                Role sets the default order and ribbon. After signup you can pin, hide, and
                reorder every module — or create a custom role label that matches how you work.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLaunch}
            className="mkt-btn-primary text-[12px] px-4 py-2.5 min-h-[40px] shrink-0 w-full sm:w-auto"
          >
            Start trial
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="pb-1 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="mkt-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/12">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white tracking-tight">
              Ready to open your vault?
            </h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium leading-snug">
              14-day free trial · pick a role at signup · rearrange modules anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={onLaunch}
            className="mkt-btn-primary text-[13px] px-5 py-2.5 min-h-[42px] shrink-0 w-full sm:w-auto"
          >
            Start free trial
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
