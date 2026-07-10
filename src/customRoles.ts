/**
 * User-created role blueprints — title + dashboard layout prefs.
 * Stored client-side; linked from session.customRoleId.
 */
import type { AppTab } from "./routing";
import type { PersonaId } from "./userPersonas";
import type { UserRole } from "./types";

export interface CustomRole {
  id: string;
  /** Display title, e.g. "Parents' flat manager" */
  title: string;
  /** One-line description */
  summary?: string;
  /** Persona template that seeds defaults */
  basePersona: PersonaId;
  /** Optional preset role this was cloned from */
  baseRole?: UserRole;
  /** Full module order for nav + deck launcher */
  moduleOrder: AppTab[];
  hiddenModules: AppTab[];
  defaultDeckView: "life" | "graphs" | "dataset";
  createdAt: string;
  updatedAt: string;
}

const KEY = "rv_custom_roles_v1";

export function loadCustomRoles(): CustomRole[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) => r && typeof r.id === "string" && typeof r.title === "string"
    ) as CustomRole[];
  } catch {
    return [];
  }
}

export function saveCustomRoles(list: CustomRole[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getCustomRole(id: string | undefined | null): CustomRole | null {
  if (!id) return null;
  return loadCustomRoles().find((r) => r.id === id) || null;
}

export function upsertCustomRole(
  input: Omit<CustomRole, "id" | "createdAt" | "updatedAt"> & { id?: string }
): CustomRole {
  const list = loadCustomRoles();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = list.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const next: CustomRole = {
        ...list[idx],
        ...input,
        id: input.id,
        updatedAt: now,
      };
      list[idx] = next;
      saveCustomRoles(list);
      return next;
    }
  }
  const created: CustomRole = {
    id: input.id || `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: input.title.trim() || "My custom role",
    summary: input.summary,
    basePersona: input.basePersona,
    baseRole: input.baseRole,
    moduleOrder: input.moduleOrder || [],
    hiddenModules: input.hiddenModules || [],
    defaultDeckView: input.defaultDeckView || "life",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(created);
  saveCustomRoles(list);
  return created;
}

export function deleteCustomRole(id: string) {
  saveCustomRoles(loadCustomRoles().filter((r) => r.id !== id));
}
