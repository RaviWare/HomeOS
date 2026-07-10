/**
 * Client helpers for linking HomeOS workspace snapshots to Telegram.
 * Server holds the snapshot; Telegram bot answers queries against it.
 */

const LS_KEY = "rv_telegram_link";

export interface TelegramLinkState {
  code: string;
  token: string;
  linked: boolean;
  chatId?: string;
  username?: string;
  lastSyncAt?: string;
  botUsername?: string;
}

export function loadTelegramLink(): TelegramLinkState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTelegramLink(state: TelegramLinkState | null) {
  if (!state) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export async function createTelegramLink(snapshot: {
  workspaceName: string;
  userName: string;
  role: string;
  properties: any[];
  leases: any[];
  transactions: any[];
  tickets: any[];
}): Promise<{ ok: boolean; state?: TelegramLinkState; botUsername?: string; error?: string }> {
  try {
    const res = await fetch("/api/telegram/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Failed to create link" };
    const state: TelegramLinkState = {
      code: data.code,
      token: data.token,
      linked: false,
      botUsername: data.botUsername,
      lastSyncAt: new Date().toISOString(),
    };
    saveTelegramLink(state);
    return { ok: true, state, botUsername: data.botUsername };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export async function syncTelegramSnapshot(
  token: string,
  snapshot: {
    workspaceName: string;
    userName: string;
    role: string;
    properties: any[];
    leases: any[];
    transactions: any[];
    tickets: any[];
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/telegram/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, snapshot }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Sync failed" };
    const prev = loadTelegramLink();
    if (prev && prev.token === token) {
      saveTelegramLink({ ...prev, lastSyncAt: new Date().toISOString(), linked: data.linked ?? prev.linked });
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export async function refreshTelegramStatus(token: string): Promise<TelegramLinkState | null> {
  try {
    const res = await fetch("/api/telegram/status?token=" + encodeURIComponent(token));
    if (!res.ok) return loadTelegramLink();
    const data = await res.json();
    const prev = loadTelegramLink();
    if (!prev) return null;
    const next = {
      ...prev,
      linked: !!data.linked,
      chatId: data.chatId,
      username: data.username,
      botUsername: data.botUsername || prev.botUsername,
    };
    saveTelegramLink(next);
    return next;
  } catch {
    return loadTelegramLink();
  }
}

export function telegramDeepLink(botUsername: string | undefined, code: string) {
  const bot = (botUsername || "HomeOSBot").replace(/^@/, "");
  return `https://t.me/${bot}?start=${encodeURIComponent(code)}`;
}

export async function unlinkTelegram(token: string) {
  try {
    await fetch("/api/telegram/unlink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* ignore */
  }
  saveTelegramLink(null);
}
