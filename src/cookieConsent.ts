/**
 * Cookie / storage consent — GDPR (EU/EEA/UK) + CCPA/CPRA (California/US) oriented.
 * Preference stored locally; non-essential categories default OFF until accepted.
 */

export type CookieCategory = "necessary" | "preferences" | "analytics" | "marketing";

export type CookiePreferences = Record<CookieCategory, boolean>;

export type ConsentRecord = {
  version: number;
  updatedAt: string;
  /** ISO region hint when known */
  region?: string;
  prefs: CookiePreferences;
  /** User chose Accept all / Reject non-essential / Custom */
  choice: "accept_all" | "reject_nonessential" | "custom";
};

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "homeos_cookie_consent_v1";

export const DEFAULT_PREFS: CookiePreferences = {
  necessary: true, // always on — security, session, load balancing
  preferences: false,
  analytics: false,
  marketing: false,
};

export function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed?.prefs || parsed.version !== CONSENT_VERSION) return null;
    return {
      ...parsed,
      prefs: { ...DEFAULT_PREFS, ...parsed.prefs, necessary: true },
    };
  } catch {
    return null;
  }
}

export function saveConsent(record: ConsentRecord) {
  const next: ConsentRecord = {
    ...record,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    prefs: { ...record.prefs, necessary: true },
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("homeos-cookie-consent", { detail: next }));
  return next;
}

export function acceptAll(): ConsentRecord {
  return saveConsent({
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    choice: "accept_all",
    prefs: {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    },
  });
}

export function rejectNonEssential(): ConsentRecord {
  return saveConsent({
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    choice: "reject_nonessential",
    prefs: { ...DEFAULT_PREFS },
  });
}

export function saveCustom(prefs: CookiePreferences): ConsentRecord {
  return saveConsent({
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    choice: "custom",
    prefs: { ...prefs, necessary: true },
  });
}

export function hasConsentDecision(): boolean {
  return loadConsent() != null;
}

export function isCategoryAllowed(cat: CookieCategory): boolean {
  if (cat === "necessary") return true;
  const c = loadConsent();
  if (!c) return false;
  return Boolean(c.prefs[cat]);
}

/** Open preference center from footer / settings */
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("homeos-open-cookie-prefs"));
}

export const CATEGORY_COPY: Record<
  CookieCategory,
  { title: string; body: string; required?: boolean }
> = {
  necessary: {
    title: "Strictly necessary",
    body: "Required for security, authentication, load balancing, and storing your consent choice. These cannot be turned off.",
    required: true,
  },
  preferences: {
    title: "Preferences",
    body: "Remembers UI choices such as billing toggle, deck layout, and language-related display settings.",
  },
  analytics: {
    title: "Analytics",
    body: "Helps us understand product usage in aggregate (page views, feature adoption). No sale of personal data. Off by default until you opt in.",
  },
  marketing: {
    title: "Marketing",
    body: "Used only if we run remarketing or campaign measurement. Off by default. We do not sell personal information as defined under CCPA/CPRA.",
  },
};
