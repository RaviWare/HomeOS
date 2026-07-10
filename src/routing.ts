/**
 * HomeOS client-side routes (pathname-based).
 *
 * Marketing:  /  /features  /pricing  …
 * App:        /app  /app/properties  /app/settings  …
 * Onboarding: /app/onboarding
 */

export type AppTab =
  | "dashboard"
  | "properties"
  | "leases"
  | "payments"
  | "utilities"
  | "maintenance"
  | "expenses"
  | "documents"
  | "settings"
  | "legal"
  | "finances"
  | "activity"
  | "life";

export type MarketingPage =
  | "home"
  | "features"
  | "how-it-works"
  | "roles"
  | "security"
  | "pricing"
  | "roadmap"
  | "faq"
  | "about"
  | "contact"
  | "privacy"
  | "terms";

export type AuthMode = "login" | "signup";

export type RouteView =
  | { kind: "marketing"; page: MarketingPage }
  | { kind: "auth"; mode: AuthMode }
  | { kind: "onboarding" }
  | { kind: "app"; tab: AppTab };

const APP_TABS: AppTab[] = [
  "dashboard",
  "properties",
  "leases",
  "payments",
  "utilities",
  "maintenance",
  "expenses",
  "documents",
  "settings",
  "legal",
  "finances",
  "activity",
  "life",
];

const MARKETING_PAGES: MarketingPage[] = [
  "home",
  "features",
  "how-it-works",
  "roles",
  "security",
  "pricing",
  "roadmap",
  "faq",
  "about",
  "contact",
  "privacy",
  "terms",
];

const APP_TAB_SET = new Set<string>(APP_TABS);
const MARKETING_SET = new Set<string>(MARKETING_PAGES);

/** Public path for each app tab */
export const APP_PATH: Record<AppTab, string> = {
  dashboard: "/app",
  properties: "/app/properties",
  leases: "/app/leases",
  payments: "/app/payments",
  utilities: "/app/utilities",
  maintenance: "/app/maintenance",
  expenses: "/app/expenses",
  finances: "/app/finances",
  documents: "/app/documents",
  settings: "/app/settings",
  legal: "/app/legal",
  activity: "/app/activity",
  life: "/app/life",
};

/** Public path for each marketing page */
export const MARKETING_PATH: Record<MarketingPage, string> = {
  home: "/",
  features: "/features",
  "how-it-works": "/how-it-works",
  roles: "/roles",
  security: "/security",
  pricing: "/pricing",
  roadmap: "/roadmap",
  faq: "/faq",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
};

export const ONBOARDING_PATH = "/app/onboarding";
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";

export function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  let p = pathname.split("?")[0].split("#")[0];
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

/** Map old hash routes (#/features, #/dashboard) → path */
export function migrateHashToPath(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0].toLowerCase();
  if (!hash) return false;

  // App tabs used to live only in state; also accept #/app/...
  if (hash === "app" || hash === "dashboard" || hash === "command-deck") {
    window.history.replaceState(null, "", "/app");
    return true;
  }
  if (hash.startsWith("app/")) {
    window.history.replaceState(null, "", "/" + hash);
    return true;
  }
  if (APP_TAB_SET.has(hash)) {
    window.history.replaceState(null, "", APP_PATH[hash as AppTab]);
    return true;
  }
  if (hash === "onboarding") {
    window.history.replaceState(null, "", ONBOARDING_PATH);
    return true;
  }
  if (hash === "login") {
    window.history.replaceState(null, "", LOGIN_PATH);
    return true;
  }
  if (hash === "signup" || hash === "register") {
    window.history.replaceState(null, "", SIGNUP_PATH);
    return true;
  }
  if (hash === "home" || hash === "") {
    window.history.replaceState(null, "", "/");
    return true;
  }
  if (MARKETING_SET.has(hash)) {
    window.history.replaceState(null, "", MARKETING_PATH[hash as MarketingPage]);
    return true;
  }
  return false;
}

export function parseLocation(pathname?: string): RouteView {
  const path = normalizePath(pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/"));

  if (path === LOGIN_PATH || path === "/auth/login") {
    return { kind: "auth", mode: "login" };
  }
  if (path === SIGNUP_PATH || path === "/auth/signup" || path === "/register") {
    return { kind: "auth", mode: "signup" };
  }

  if (path === ONBOARDING_PATH || path === "/onboarding") {
    return { kind: "onboarding" };
  }

  if (path === "/app" || path === "/app/dashboard" || path === "/dashboard") {
    return { kind: "app", tab: "dashboard" };
  }

  // Developer / MCP is deferred until we have users — old bookmarks land on deck
  if (path === "/app/mcp" || path === "/mcp") {
    return { kind: "app", tab: "dashboard" };
  }

  if (path.startsWith("/app/")) {
    const seg = path.slice("/app/".length).split("/")[0];
    if (APP_TAB_SET.has(seg)) return { kind: "app", tab: seg as AppTab };
    // Unknown /app/* segment → deck (keep URL clean via ensureCanonicalPath)
    return { kind: "app", tab: "dashboard" };
  }

  // bare tab paths also work: /properties, /settings → treated as app tabs
  const bare = path.slice(1);
  if (APP_TAB_SET.has(bare) && bare !== "dashboard") {
    return { kind: "app", tab: bare as AppTab };
  }

  if (path === "/" || path === "") {
    return { kind: "marketing", page: "home" };
  }

  const m = path.slice(1).toLowerCase();
  // Retired marketing pages → stable destinations
  if (m === "security") {
    return { kind: "marketing", page: "privacy" };
  }
  // /faq is an alias of Contact + FAQ
  if (m === "faq") {
    return { kind: "marketing", page: "contact" };
  }
  if (MARKETING_SET.has(m)) {
    return { kind: "marketing", page: m as MarketingPage };
  }

  // Unknown → home marketing
  return { kind: "marketing", page: "home" };
}

export function pathForView(view: RouteView): string {
  if (view.kind === "onboarding") return ONBOARDING_PATH;
  if (view.kind === "auth") return view.mode === "signup" ? SIGNUP_PATH : LOGIN_PATH;
  if (view.kind === "app") return APP_PATH[view.tab];
  return MARKETING_PATH[view.page];
}

/** Canonical public path for an app module (always under /app). */
export function pathForAppTab(tab: AppTab | string): string {
  if (isAppTab(tab)) return APP_PATH[tab];
  return APP_PATH.dashboard;
}

/**
 * Rewrite non-canonical paths to the stable public URL
 * e.g. /properties → /app/properties, /app/dashboard → /app, /faq → /contact
 */
export function ensureCanonicalPath(): boolean {
  if (typeof window === "undefined") return false;
  const view = parseLocation();
  const expected = pathForView(view);
  const cur = normalizePath(window.location.pathname);
  if (cur === expected) return false;
  window.history.replaceState(null, "", expected);
  return true;
}

export function navigateTo(path: string, opts?: { replace?: boolean }) {
  const next = normalizePath(path);
  const cur = normalizePath(window.location.pathname);
  if (cur === next) return;
  if (opts?.replace) window.history.replaceState(null, "", next);
  else window.history.pushState(null, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigateView(view: RouteView, opts?: { replace?: boolean }) {
  navigateTo(pathForView(view), opts);
}

export function navigateAppTab(tab: AppTab | string, opts?: { replace?: boolean }) {
  navigateTo(pathForAppTab(tab), opts);
}

/**
 * True when a click should be handled as SPA navigation
 * (left-click without modifier keys). Middle-click / cmd-click use native href.
 */
export function shouldHandleSpaClick(e: {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  return true;
}

/** SPA-friendly anchor click: push path, leave new-tab / middle-click alone */
export function handleSpaNav(
  e: {
    preventDefault: () => void;
    defaultPrevented: boolean;
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  path: string,
  opts?: { replace?: boolean }
): void {
  if (!shouldHandleSpaClick(e)) return;
  e.preventDefault();
  navigateTo(path, opts);
}

export function isAppTab(v: string): v is AppTab {
  return APP_TAB_SET.has(v);
}

export function isMarketingPage(v: string): v is MarketingPage {
  return MARKETING_SET.has(v);
}

/** Page titles for document.title */
export function titleForView(view: RouteView): string {
  if (view.kind === "onboarding") return "Get started · HomeOS";
  if (view.kind === "auth") {
    return view.mode === "signup" ? "Sign up · HomeOS" : "Log in · HomeOS";
  }
  if (view.kind === "app") {
    const labels: Record<AppTab, string> = {
      dashboard: "Command Deck",
      properties: "Property Hub",
      leases: "Lease & Clauses",
      payments: "Ledger & Payments",
      utilities: "Utilities",
      maintenance: "Maintenance",
      expenses: "Expense & Tax",
      finances: "Finances",
      documents: "Document Vault",
      settings: "Vault Settings",
      legal: "Privacy & Terms",
      activity: "Activity Log",
      life: "Home Life",
    };
    return `${labels[view.tab]} · HomeOS`;
  }
  const m: Record<MarketingPage, string> = {
    home: "HomeOS — The operating system for home life",
    features: "Features · HomeOS",
    "how-it-works": "How it works · HomeOS",
    roles: "Roles · HomeOS",
    security: "Privacy Policy · HomeOS",
    pricing: "Pricing · HomeOS",
    roadmap: "Roadmap · HomeOS",
    faq: "Contact & FAQ · HomeOS",
    about: "About · HomeOS",
    contact: "Contact & FAQ · HomeOS",
    privacy: "Privacy Policy · HomeOS",
    terms: "Terms of Service · HomeOS",
  };
  return m[view.page];
}
