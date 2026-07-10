/**
 * Multi-currency support for HomeOS.
 * - Display currency for dashboard totals
 * - Per-line currency on income / assets / goals
 * - Convert via USD intermediate using editable rates
 *
 * Rates are illustrative mid-market anchors (not live feeds).
 * Users can override in Settings → Currency.
 */

export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SGD"
  | "AUD"
  | "CAD"
  | "JPY"
  | "CHF"
  | "MYR"
  | "THB"
  | "HKD"
  | "NZD"
  | "SAR";

export type CurrencyMeta = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Locale for Intl formatting */
  locale: string;
};

/** How many units of this currency equal 1 USD (approx). */
export const DEFAULT_UNITS_PER_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  AED: 3.67,
  SGD: 1.34,
  AUD: 1.52,
  CAD: 1.36,
  JPY: 149,
  CHF: 0.88,
  MYR: 4.7,
  THB: 35.5,
  HKD: 7.82,
  NZD: 1.64,
  SAR: 3.75,
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", label: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ", locale: "en-AE" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM", locale: "en-MY" },
  { code: "THB", label: "Thai Baht", symbol: "฿", locale: "th-TH" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$", locale: "en-HK" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$", locale: "en-NZ" },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼", locale: "en-SA" },
];

const PREFS_KEY = "rv_currency_prefs";
const RATES_NOTE = "Illustrative rates vs USD · not live · edit anytime";

export type CurrencyPrefs = {
  displayCurrency: CurrencyCode;
  /** Override units-per-USD for any currency */
  unitsPerUsd: Partial<Record<CurrencyCode, number>>;
  updatedAt?: string;
};

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  if (typeof v !== "string") return false;
  const u = v.trim().toUpperCase();
  return CURRENCIES.some((c) => c.code === u);
}

/** Normalize free-form currency strings (e.g. "inr" → "INR"). */
export function normalizeCurrencyCode(
  v: unknown,
  fallback: CurrencyCode = "USD"
): CurrencyCode {
  if (typeof v !== "string") return fallback;
  const u = v.trim().toUpperCase();
  return isCurrencyCode(u) ? (u as CurrencyCode) : fallback;
}

export function currencyMeta(code: CurrencyCode | string | undefined): CurrencyMeta {
  const c = isCurrencyCode(code) ? code : "INR";
  return CURRENCIES.find((x) => x.code === c) || CURRENCIES[0];
}

export function loadCurrencyPrefs(): CurrencyPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<CurrencyPrefs>;
      const display = isCurrencyCode(p.displayCurrency) ? p.displayCurrency : defaultDisplayCurrency();
      return {
        displayCurrency: display,
        unitsPerUsd: p.unitsPerUsd && typeof p.unitsPerUsd === "object" ? p.unitsPerUsd : {},
        updatedAt: p.updatedAt,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    displayCurrency: defaultDisplayCurrency(),
    unitsPerUsd: {},
  };
}

export function saveCurrencyPrefs(prefs: CurrencyPrefs) {
  const next: CurrencyPrefs = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  // Notify same-tab listeners (dashboard, life hub)
  try {
    window.dispatchEvent(new CustomEvent("homeos-currency-change", { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function setDisplayCurrency(code: CurrencyCode) {
  const cur = loadCurrencyPrefs();
  return saveCurrencyPrefs({ ...cur, displayCurrency: code });
}

function defaultDisplayCurrency(): CurrencyCode {
  try {
    const loc = Intl.NumberFormat().resolvedOptions().locale || "";
    if (loc.includes("IN") || loc.endsWith("-IN")) return "INR";
    if (loc.includes("GB")) return "GBP";
    if (loc.includes("AE")) return "AED";
    if (loc.includes("SG")) return "SGD";
    if (loc.includes("AU")) return "AUD";
    if (loc.includes("CA")) return "CAD";
    if (loc.includes("JP")) return "JPY";
    if (loc.startsWith("de") || loc.startsWith("fr") || loc.startsWith("es") || loc.startsWith("it"))
      return "EUR";
  } catch {
    /* ignore */
  }
  return "INR";
}

export function unitsPerUsd(
  code: CurrencyCode,
  prefs?: CurrencyPrefs
): number {
  const p = prefs || loadCurrencyPrefs();
  const override = p.unitsPerUsd?.[code];
  if (typeof override === "number" && override > 0) return override;
  return DEFAULT_UNITS_PER_USD[code] || 1;
}

/** Convert amount from one currency to another. */
export function convertAmount(
  amount: number,
  from: CurrencyCode | string | undefined,
  to: CurrencyCode | string | undefined,
  prefs?: CurrencyPrefs
): number {
  const n = Number(amount) || 0;
  const p = prefs || loadCurrencyPrefs();
  const t = normalizeCurrencyCode(to, p.displayCurrency);
  const f = normalizeCurrencyCode(from, t);
  if (f === t) return n;
  const fromPerUsd = unitsPerUsd(f, p);
  const toPerUsd = unitsPerUsd(t, p);
  // n in `from` → USD → `to`
  const usd = n / fromPerUsd;
  return usd * toPerUsd;
}

export function formatMoney(
  amount: number,
  currency?: CurrencyCode | string,
  opts?: { compact?: boolean; maxFrac?: number }
): string {
  const code = isCurrencyCode(currency) ? currency : loadCurrencyPrefs().displayCurrency;
  const meta = currencyMeta(code);
  const n = Number(amount) || 0;
  try {
    if (opts?.compact && Math.abs(n) >= 1000) {
      return new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency: code,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);
    }
    // JPY has no minor units; others keep 0–2 fraction digits for readability
    const zeroDec = code === "JPY";
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: opts?.maxFrac ?? (zeroDec ? 0 : 2),
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${meta.symbol}${Math.round(n).toLocaleString()}`;
  }
}

/** Format native amount with code badge, e.g. "$1,200 USD" */
export function formatNative(
  amount: number,
  currency?: CurrencyCode | string
): string {
  const code = isCurrencyCode(currency) ? currency : loadCurrencyPrefs().displayCurrency;
  return `${formatMoney(amount, code)} ${code}`;
}

/**
 * Convert and format for display currency; if native differs, append note.
 * e.g. "₹1,00,200 · from $1,200 USD"
 */
export function formatConverted(
  amount: number,
  nativeCurrency: CurrencyCode | string | undefined,
  displayCurrency?: CurrencyCode,
  prefs?: CurrencyPrefs
): { display: string; converted: number; nativeCode: CurrencyCode; note?: string } {
  const p = prefs || loadCurrencyPrefs();
  const to = displayCurrency || p.displayCurrency;
  const from = isCurrencyCode(nativeCurrency) ? nativeCurrency : to;
  const converted = convertAmount(amount, from, to, p);
  const display = formatMoney(converted, to);
  if (from === to) {
    return { display, converted, nativeCode: from };
  }
  return {
    display,
    converted,
    nativeCode: from,
    note: `from ${formatMoney(amount, from)} ${from}`,
  };
}

export function ratesFooter(prefs?: CurrencyPrefs): string {
  const p = prefs || loadCurrencyPrefs();
  const when = p.updatedAt
    ? new Date(p.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "default table";
  return `${RATES_NOTE} · ${when}`;
}

/** Unique currencies present in a list of codes. */
export function uniqueCurrencies(
  codes: (CurrencyCode | string | undefined)[]
): CurrencyCode[] {
  const set = new Set<CurrencyCode>();
  codes.forEach((c) => {
    if (isCurrencyCode(c)) set.add(c);
  });
  return Array.from(set);
}

export { RATES_NOTE };
