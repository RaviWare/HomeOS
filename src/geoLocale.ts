/**
 * Global locale / timezone / rough location helpers for HomeOS.
 *
 * Sources (all free / open-web, no API keys):
 * - IANA time zone via Intl (browser / OS) — always authoritative for clock
 * - Geolocation API + BigDataCloud reverse geocode (CORS-friendly)
 * - geojs.io IP geolocation (fallback, no permission prompt)
 * - Open-Meteo geocoding + weather (open source, https://open-meteo.com)
 */

export type UserLocaleInfo = {
  /** IANA zone e.g. America/New_York */
  timeZone: string;
  /** BCP 47 locale e.g. en-US */
  locale: string;
  /** Human city / area label */
  city: string;
  /** Region / state if known */
  region: string;
  /** ISO 3166-1 alpha-2 if known */
  countryCode: string;
  /** Full country name if known */
  country: string;
  latitude: number | null;
  longitude: number | null;
  /** How we resolved place */
  source: "geolocation" | "ip" | "timezone" | "preferred";
  /** e.g. PDT, IST, GMT+5:30 */
  tzAbbr: string;
  /** e.g. UTC+05:30 */
  utcOffset: string;
};

const CACHE_KEY = "homeos_geo_locale_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type CacheBlob = { at: number; info: UserLocaleInfo };

function readCache(): UserLocaleInfo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheBlob;
    if (!parsed?.info?.timeZone) return null;
    if (Date.now() - (parsed.at || 0) > CACHE_TTL_MS) return null;
    return parsed.info;
  } catch {
    return null;
  }
}

function writeCache(info: UserLocaleInfo) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), info } satisfies CacheBlob));
  } catch {
    /* ignore quota */
  }
}

/** Browser IANA time zone — never hardcode continents. */
export function getBrowserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && typeof tz === "string") return tz;
  } catch {
    /* fall through */
  }
  // Rare legacy environments
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${h}:${m}`;
}

export function getBrowserLocale(): string {
  if (typeof navigator !== "undefined") {
    return navigator.language || navigator.languages?.[0] || "en-US";
  }
  return "en-US";
}

/** Pretty label from IANA id: America/New_York → New York */
export function cityFromTimeZone(timeZone: string): string {
  if (!timeZone) return "Local";
  if (timeZone.startsWith("UTC") || timeZone === "Etc/UTC" || timeZone === "GMT") return "UTC";
  const parts = timeZone.split("/");
  const last = parts[parts.length - 1] || timeZone;
  return last.replace(/_/g, " ");
}

export function formatUtcOffset(date = new Date(), timeZone = getBrowserTimeZone()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name) {
      // "GMT+5:30" → "UTC+05:30" style
      const m = name.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
      if (m) {
        const sign = m[1];
        const h = m[2].padStart(2, "0");
        const min = (m[3] || "00").padStart(2, "0");
        return `UTC${sign}${h}:${min}`;
      }
      if (/GMT/i.test(name) && !/[+-]/.test(name)) return "UTC±00:00";
      return name.replace(/^GMT/, "UTC");
    }
  } catch {
    /* fall through */
  }
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export function formatTzAbbreviation(date = new Date(), timeZone = getBrowserTimeZone(), locale = getBrowserLocale()): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const abbr = parts.find((p) => p.type === "timeZoneName")?.value;
    if (abbr && !/^GMT/i.test(abbr) && !/^UTC/i.test(abbr)) return abbr;
    // Some locales only return GMT±n — use offset instead
    return formatUtcOffset(date, timeZone);
  } catch {
    return formatUtcOffset(date, timeZone);
  }
}

/** Local wall-clock time in the user's zone + locale. */
export function formatLocalTime(
  date = new Date(),
  opts?: { timeZone?: string; locale?: string; withSeconds?: boolean }
): string {
  const timeZone = opts?.timeZone || getBrowserTimeZone();
  const locale = opts?.locale || getBrowserLocale();
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: opts?.withSeconds ? "2-digit" : undefined,
      hour12: false, // 24-hour clock for global consistency
    }).format(date);
  } catch {
    return date.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit" });
  }
}

export function formatLocalDate(
  date = new Date(),
  opts?: { timeZone?: string; locale?: string }
): string {
  const timeZone = opts?.timeZone || getBrowserTimeZone();
  const locale = opts?.locale || getBrowserLocale();
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function countryName(code: string, locale = getBrowserLocale()): string {
  if (!code || code.length !== 2) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code.toUpperCase();
  }
}

function localeRegionCode(locale = getBrowserLocale()): string {
  try {
    // en-US → US, fr-CA → CA
    const parts = locale.replace("_", "-").split("-");
    const region = parts.find((p) => p.length === 2 && p === p.toUpperCase()) || parts[1];
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
  } catch {
    /* ignore */
  }
  return "";
}

function baseFromTimezone(preferredCity?: string): UserLocaleInfo {
  const timeZone = getBrowserTimeZone();
  const locale = getBrowserLocale();
  const cc = localeRegionCode(locale);
  const city = (preferredCity && preferredCity.trim()) || cityFromTimeZone(timeZone);
  return {
    timeZone,
    locale,
    city,
    region: "",
    countryCode: cc,
    country: countryName(cc, locale),
    latitude: null,
    longitude: null,
    source: preferredCity ? "preferred" : "timezone",
    tzAbbr: formatTzAbbreviation(new Date(), timeZone, locale),
    utcOffset: formatUtcOffset(new Date(), timeZone),
  };
}

async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<Partial<UserLocaleInfo> | null> {
  // BigDataCloud free client reverse geocode — CORS-friendly, no key
  // https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lon))}` +
    `&localityLanguage=en`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const d = await res.json();
    const city =
      d.city ||
      d.locality ||
      d.localityInfo?.administrative?.[0]?.name ||
      d.principalSubdivision ||
      "";
    const region = d.principalSubdivision || d.localityInfo?.administrative?.[1]?.name || "";
    const countryCode = (d.countryCode || "").toUpperCase();
    const country = d.countryName || countryName(countryCode);
    if (!city && !country) return null;
    return {
      city: city || region || country,
      region,
      countryCode,
      country,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return null;
  }
}

async function ipGeolocate(signal?: AbortSignal): Promise<Partial<UserLocaleInfo> | null> {
  // geojs.io — free, CORS, no key (https://www.geojs.io/)
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal });
    if (!res.ok) return null;
    const d = await res.json();
    const lat = d.latitude != null ? Number(d.latitude) : NaN;
    const lon = d.longitude != null ? Number(d.longitude) : NaN;
    const city = d.city || d.region || "";
    const countryCode = (d.country_code || "").toUpperCase();
    if (!city && !countryCode) return null;
    return {
      city: city || countryName(countryCode) || "Local",
      region: d.region || "",
      countryCode,
      country: d.country || countryName(countryCode),
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
    };
  } catch {
    return null;
  }
}

function geolocateOnce(timeoutMs = 8000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 30 * 60 * 1000,
      timeout: timeoutMs,
    });
  });
}

/**
 * Resolve where the user is (for weather + region chip).
 * Clock always uses browser timezone regardless of this result.
 */
export async function resolveUserLocale(opts?: {
  preferredCity?: string;
  signal?: AbortSignal;
  /** Skip geolocation permission prompt (IP + timezone only). */
  skipGeolocation?: boolean;
}): Promise<UserLocaleInfo> {
  const cached = readCache();
  if (cached) {
    // Refresh dynamic tz labels even when cached place is reused
    return {
      ...cached,
      timeZone: getBrowserTimeZone(),
      locale: getBrowserLocale(),
      tzAbbr: formatTzAbbreviation(),
      utcOffset: formatUtcOffset(),
    };
  }

  const base = baseFromTimezone(opts?.preferredCity);
  let merged: UserLocaleInfo = { ...base };

  // 1) Precise device location (optional permission)
  if (!opts?.skipGeolocation) {
    try {
      const pos = await geolocateOnce(7000);
      const { latitude, longitude } = pos.coords;
      const rev = await reverseGeocode(latitude, longitude, opts?.signal);
      if (rev) {
        merged = {
          ...merged,
          ...rev,
          city: rev.city || merged.city,
          source: "geolocation",
          latitude: rev.latitude ?? latitude,
          longitude: rev.longitude ?? longitude,
        };
        writeCache(merged);
        return withLiveTz(merged);
      }
      // reverse failed — still keep coords for weather
      merged = {
        ...merged,
        latitude,
        longitude,
        source: "geolocation",
        city: merged.city || cityFromTimeZone(merged.timeZone),
      };
      writeCache(merged);
      return withLiveTz(merged);
    } catch {
      /* denied / timeout — continue */
    }
  }

  // 2) IP geolocation (no permission, good for global default)
  try {
    const ip = await ipGeolocate(opts?.signal);
    if (ip?.city || ip?.countryCode) {
      merged = {
        ...merged,
        ...ip,
        city: ip.city || merged.city,
        source: "ip",
      };
      writeCache(merged);
      return withLiveTz(merged);
    }
  } catch {
    /* ignore */
  }

  // 3) Timezone-derived place; try Open-Meteo geocode for coords
  try {
    const q = encodeURIComponent(merged.city);
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`,
      { signal: opts?.signal }
    );
    if (res.ok) {
      const d = await res.json();
      const hit = d?.results?.[0];
      if (hit) {
        merged = {
          ...merged,
          city: hit.name || merged.city,
          region: hit.admin1 || merged.region,
          countryCode: (hit.country_code || merged.countryCode || "").toUpperCase(),
          country: hit.country || merged.country,
          latitude: hit.latitude ?? null,
          longitude: hit.longitude ?? null,
          // Prefer timezone from geocoder only if it matches browser tz roughly — keep browser tz always
          source: opts?.preferredCity ? "preferred" : "timezone",
        };
      }
    }
  } catch {
    /* ignore */
  }

  writeCache(merged);
  return withLiveTz(merged);
}

function withLiveTz(info: UserLocaleInfo): UserLocaleInfo {
  const timeZone = getBrowserTimeZone();
  const locale = getBrowserLocale();
  return {
    ...info,
    timeZone,
    locale,
    tzAbbr: formatTzAbbreviation(new Date(), timeZone, locale),
    utcOffset: formatUtcOffset(new Date(), timeZone),
  };
}

export function formatRegionLabel(info: Pick<UserLocaleInfo, "city" | "region" | "country" | "countryCode">): string {
  const city = (info.city || "").trim();
  const country = (info.country || info.countryCode || "").trim();
  if (city && country && !city.toLowerCase().includes(country.toLowerCase())) {
    // Compact: "Berlin · Germany" or "Austin · US" for longer names use code
    const shortCountry =
      country.length > 12 && info.countryCode ? info.countryCode.toUpperCase() : country;
    return `${city} · ${shortCountry}`;
  }
  return city || country || "Local";
}

export type WeatherNow = {
  tempC: number;
  weatherCode: number;
  isDay: boolean;
};

/** Open-Meteo current weather — open source, free, no key. */
export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<WeatherNow | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lon))}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&timezone=auto`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const d = await res.json();
    const cur = d?.current;
    if (!cur || cur.temperature_2m == null) return null;
    return {
      tempC: Math.round(Number(cur.temperature_2m)),
      weatherCode: Number(cur.weather_code ?? 0),
      isDay: Boolean(cur.is_day),
    };
  } catch {
    return null;
  }
}

/** Clear cached place (e.g. after user moves / wants refresh). */
export function clearGeoLocaleCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
