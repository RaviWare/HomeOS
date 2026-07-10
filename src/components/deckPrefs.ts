import type { AppTab } from "../routing";
import type { PersonaId } from "../userPersonas";

export type ModulesLayout = "grouped" | "grid";
export type DeckViewPref = "life" | "graphs" | "dataset";

export interface DeckPrefs {
  greeting: "auto" | "hello" | "welcome" | "good_day";
  showWeather: boolean;
  animate: boolean;
  modulesLayout: ModulesLayout;
  showModuleCounts: boolean;
  /** Follow role → persona defaults when true */
  usePersonaDefaults: boolean;
  /** Optional override of persona (null = from role) */
  personaOverride: PersonaId | null;
  /**
   * Full user-defined module order for sidebar + All modules.
   * Empty = use persona modulePriority.
   */
  moduleOrder: AppTab[];
  /** User-pinned modules (shown first within groups) */
  pinnedModules: AppTab[];
  /** User-hidden modules (still reachable via “Show all”) */
  hiddenModules: AppTab[];
  /** Show secondary modules for persona */
  showSecondaryModules: boolean;
  defaultDeckView: DeckViewPref;
}

const PREFS_KEY = "rv_deck_prefs";

export function defaultDeckPrefs(): DeckPrefs {
  return {
    greeting: "auto",
    showWeather: true,
    animate: true,
    modulesLayout: "grouped",
    showModuleCounts: true,
    usePersonaDefaults: true,
    personaOverride: null,
    moduleOrder: [],
    pinnedModules: [],
    hiddenModules: [],
    showSecondaryModules: true,
    defaultDeckView: "life",
  };
}

export function loadDeckPrefs(): DeckPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultDeckPrefs(), ...pickKnown(parsed) };
    }
  } catch {
    /* ignore */
  }
  return defaultDeckPrefs();
}

function pickKnown(p: Record<string, unknown>): Partial<DeckPrefs> {
  const out: Partial<DeckPrefs> = {};
  if (
    p.greeting === "auto" ||
    p.greeting === "hello" ||
    p.greeting === "welcome" ||
    p.greeting === "good_day"
  )
    out.greeting = p.greeting;
  if (typeof p.showWeather === "boolean") out.showWeather = p.showWeather;
  if (typeof p.animate === "boolean") out.animate = p.animate;
  if (p.modulesLayout === "grouped" || p.modulesLayout === "grid")
    out.modulesLayout = p.modulesLayout;
  if (typeof p.showModuleCounts === "boolean") out.showModuleCounts = p.showModuleCounts;
  if (typeof p.usePersonaDefaults === "boolean")
    out.usePersonaDefaults = p.usePersonaDefaults;
  if (
    p.personaOverride === null ||
    p.personaOverride === "household" ||
    p.personaOverride === "owner" ||
    p.personaOverride === "operator" ||
    p.personaOverride === "advisor" ||
    p.personaOverride === "field"
  )
    out.personaOverride = p.personaOverride as DeckPrefs["personaOverride"];
  if (Array.isArray(p.moduleOrder))
    out.moduleOrder = p.moduleOrder.filter((x) => typeof x === "string") as AppTab[];
  if (Array.isArray(p.pinnedModules))
    out.pinnedModules = p.pinnedModules.filter((x) => typeof x === "string") as AppTab[];
  if (Array.isArray(p.hiddenModules))
    out.hiddenModules = p.hiddenModules.filter((x) => typeof x === "string") as AppTab[];
  if (typeof p.showSecondaryModules === "boolean")
    out.showSecondaryModules = p.showSecondaryModules;
  if (
    p.defaultDeckView === "life" ||
    p.defaultDeckView === "graphs" ||
    p.defaultDeckView === "dataset"
  )
    out.defaultDeckView = p.defaultDeckView;
  return out;
}

export function saveDeckPrefs(p: DeckPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("homeos-deck-prefs-change", { detail: p }));
  } catch {
    /* ignore */
  }
}

export function resetDeckPrefs(): DeckPrefs {
  const d = defaultDeckPrefs();
  saveDeckPrefs(d);
  return d;
}

/**
 * Seed / re-seed deck prefs from a persona (role category).
 * Clears manual persona override so role → persona stays the source of truth.
 * Keeps greeting / weather / pin prefs unless opts.fullReset.
 */
export function applyPersonaDeckDefaults(
  persona: {
    id: PersonaId;
    defaultDeckView: DeckViewPref;
    secondaryModules?: AppTab[];
  },
  opts?: { fullReset?: boolean; hideSecondary?: boolean }
): DeckPrefs {
  const base = opts?.fullReset ? defaultDeckPrefs() : loadDeckPrefs();
  const next: DeckPrefs = {
    ...base,
    usePersonaDefaults: true,
    personaOverride: null,
    defaultDeckView: persona.defaultDeckView,
    showSecondaryModules: opts?.hideSecondary
      ? false
      : base.showSecondaryModules,
    // When switching category, clear layout overrides so persona seeds the deck
    moduleOrder: opts?.fullReset ? [] : base.moduleOrder,
    hiddenModules: opts?.fullReset ? [] : base.hiddenModules,
    pinnedModules: opts?.fullReset ? [] : base.pinnedModules,
  };
  if (opts?.hideSecondary && persona.secondaryModules?.length) {
    // Optionally start with secondary modules hidden for field/operator polish
    next.showSecondaryModules = false;
  }
  saveDeckPrefs(next);
  return next;
}
