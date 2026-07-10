/**
 * Device / session audit trail for HomeOS vault settings.
 * Open-web stack only: Web Crypto IDs, navigator UA, optional geojs IP (same family as geoLocale).
 * No extra npm packages.
 */

export type DeviceSession = {
  id: string;
  /** Human device label, e.g. "Chrome on macOS" */
  device: string;
  browser: string;
  os: string;
  /** Approximate place if known */
  location: string;
  /** Best-effort IP (may be blank if fetch fails / offline) */
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

const SESSIONS_KEY = "rv_device_sessions_v1";
const CURRENT_ID_KEY = "rv_device_session_id";
const MAX_SESSIONS = 12;

function nid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function parseUa(ua: string): { browser: string; os: string; device: string } {
  const s = ua || "";
  let browser = "Browser";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) browser = "Chrome";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) browser = "Safari";
  else if (/OPR\//i.test(s) || /Opera/i.test(s)) browser = "Opera";

  let os = "Unknown OS";
  if (/Windows NT/i.test(s)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Linux/i.test(s)) os = "Linux";
  else if (/CrOS/i.test(s)) os = "ChromeOS";

  const mobile = /Mobile|Android|iPhone|iPad/i.test(s);
  const device = mobile ? `${browser} on ${os} (mobile)` : `${browser} on ${os}`;
  return { browser, os, device };
}

function loadAll(): DeviceSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DeviceSession[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(list: DeviceSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, MAX_SESSIONS)));
  } catch {
    /* ignore */
  }
}

async function fetchApproxIpPlace(): Promise<{ ip: string; location: string }> {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 3500);
    // geojs — free, no key (also used elsewhere in HomeOS geo stack)
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      signal: ctrl.signal,
    });
    window.clearTimeout(t);
    if (!res.ok) return { ip: "", location: "Unknown" };
    const j = (await res.json()) as {
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
    };
    const location = [j.city, j.region, j.country].filter(Boolean).join(", ") || "Unknown";
    return { ip: j.ip || "", location };
  } catch {
    return { ip: "", location: "Unknown" };
  }
}

/**
 * Ensure this browser has a tracked session row; refresh lastActive.
 * Call on app load / settings open.
 */
export async function touchDeviceSession(): Promise<DeviceSession[]> {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { browser, os, device } = parseUa(ua);
  let id = "";
  try {
    id = sessionStorage.getItem(CURRENT_ID_KEY) || "";
  } catch {
    /* ignore */
  }
  if (!id) {
    id = nid();
    try {
      sessionStorage.setItem(CURRENT_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }

  let list = loadAll().map((s) => ({ ...s, current: false }));
  const now = new Date().toISOString();
  const existing = list.find((s) => s.id === id);

  if (existing) {
    existing.lastActiveAt = now;
    existing.current = true;
    existing.userAgent = ua;
    existing.device = device;
    existing.browser = browser;
    existing.os = os;
  } else {
    const geo = await fetchApproxIpPlace();
    list.unshift({
      id,
      device,
      browser,
      os,
      location: geo.location,
      ip: geo.ip,
      userAgent: ua,
      createdAt: now,
      lastActiveAt: now,
      current: true,
    });
  }

  // Cap list
  list = list
    .sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? 1 : -1))
    .slice(0, MAX_SESSIONS);
  // Ensure only one current
  list.forEach((s) => {
    s.current = s.id === id;
  });
  saveAll(list);
  return list;
}

export function listDeviceSessions(): DeviceSession[] {
  let id = "";
  try {
    id = sessionStorage.getItem(CURRENT_ID_KEY) || "";
  } catch {
    /* ignore */
  }
  return loadAll()
    .map((s) => ({ ...s, current: s.id === id }))
    .sort((a, b) => (a.lastActiveAt < b.lastActiveAt ? 1 : -1));
}

/** Revoke a session row (cannot revoke current — sign out instead). */
export function revokeDeviceSession(sessionId: string): DeviceSession[] {
  let currentId = "";
  try {
    currentId = sessionStorage.getItem(CURRENT_ID_KEY) || "";
  } catch {
    /* ignore */
  }
  if (sessionId === currentId) return listDeviceSessions();
  const next = loadAll().filter((s) => s.id !== sessionId);
  saveAll(next);
  return listDeviceSessions();
}

/** Revoke all other devices. */
export function revokeOtherSessions(): DeviceSession[] {
  let currentId = "";
  try {
    currentId = sessionStorage.getItem(CURRENT_ID_KEY) || "";
  } catch {
    /* ignore */
  }
  const next = loadAll().filter((s) => s.id === currentId);
  saveAll(next);
  return listDeviceSessions();
}

export function formatSessionWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Rough localStorage usage in bytes (open estimate). */
export function estimateLocalStorageBytes(): { used: number; quota: number } {
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      const v = localStorage.getItem(k) || "";
      used += (k.length + v.length) * 2; // UTF-16
    }
  } catch {
    /* ignore */
  }
  // Common browser soft quota ~5–10MB; show 10MB cap for progress UX
  return { used, quota: 10 * 1024 * 1024 };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
