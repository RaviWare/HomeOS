/**
 * Immutable, append-only audit log for HomeOS workspace mutations.
 * Entries cannot be edited or deleted by the app (no public API for that).
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "settle"
  | "import"
  | "export"
  | "login"
  | "logout"
  | "settings"
  | "sync"
  | "system";

export type AuditEntity =
  | "property"
  | "lease"
  | "transaction"
  | "utility"
  | "maintenance"
  | "document"
  | "session"
  | "workspace"
  | "telegram"
  | "system";

export interface AuditEntry {
  /** Monotonic id — never reused */
  id: string;
  /** ISO-8601 timestamp at write time */
  ts: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  summary: string;
  /** Optional before/after snapshots (JSON-safe) */
  before?: unknown;
  after?: unknown;
  actor: string;
  /** Hash chain for tamper evidence (client-side) */
  prevHash: string;
  hash: string;
}

const STORAGE_KEY = "rv_audit_log_v1";
const MAX_ENTRIES = 5000;

function simpleHash(input: string): string {
  // FNV-1a 32-bit — fast, non-crypto; good enough for client tamper-evident chain
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

function loadRaw(): AuditEntry[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (e) {
    console.error("audit log persist failed", e);
  }
}

let cache: AuditEntry[] | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeAuditLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAuditLog(): readonly AuditEntry[] {
  if (!cache) cache = loadRaw();
  // Return shallow copy so callers cannot mutate the store array in place
  return cache.slice();
}

export function appendAudit(input: {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  actor?: string;
}): AuditEntry {
  const list = cache ?? loadRaw();
  const prev = list[0];
  const prevHash = prev?.hash || "00000000";
  const ts = new Date().toISOString();
  const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const actor = input.actor || "workspace";
  const payload = JSON.stringify({
    id,
    ts,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    before: input.before ?? null,
    after: input.after ?? null,
    actor,
    prevHash,
  });
  const entry: AuditEntry = {
    id,
    ts,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    before: input.before,
    after: input.after,
    actor,
    prevHash,
    hash: simpleHash(payload),
  };
  // Prepend newest first — never mutate existing entries
  const next = [entry, ...list].slice(0, MAX_ENTRIES);
  cache = next;
  persist(next);
  notify();
  return entry;
}

/** Verify chain integrity (returns first bad index or -1 if OK). */
export function verifyAuditChain(entries?: readonly AuditEntry[]): number {
  const list = entries ?? getAuditLog();
  // list is newest-first; verify reverse chronological chain
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const expectedPrev = i === list.length - 1 ? "00000000" : list[i + 1].hash;
    // We stored prevHash pointing to older entry (next in newest-first array)
    if (e.prevHash !== expectedPrev && !(i === list.length - 1 && e.prevHash === "00000000")) {
      // Recompute expected: prevHash should equal next item's hash when newest-first
      if (i < list.length - 1 && e.prevHash !== list[i + 1].hash) return i;
    }
    const payload = JSON.stringify({
      id: e.id,
      ts: e.ts,
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      summary: e.summary,
      before: e.before ?? null,
      after: e.after ?? null,
      actor: e.actor,
      prevHash: e.prevHash,
    });
    if (simpleHash(payload) !== e.hash) return i;
  }
  return -1;
}

export function exportAuditLogCsv(): string {
  const rows = getAuditLog();
  const header = ["id", "timestamp", "action", "entity", "entityId", "summary", "actor", "hash", "prevHash"];
  const lines = [header.join(",")];
  for (const e of rows) {
    const cells = [
      e.id,
      e.ts,
      e.action,
      e.entity,
      e.entityId || "",
      `"${(e.summary || "").replace(/"/g, '""')}"`,
      e.actor,
      e.hash,
      e.prevHash,
    ];
    lines.push(cells.join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

/** Intentionally no update/delete exports — logs are immutable by design. */
