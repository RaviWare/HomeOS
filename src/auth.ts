/**
 * Client-side account registry for HomeOS.
 * Production-shaped auth for SPA deploy (email + password, local vault).
 * Passwords are salted SHA-256 hashes — never stored in plain text.
 */

import type { UserRole, UserSession } from "./types";
import {
  recordSignupAttempt,
  validateSignupInput,
} from "./antiSpam";

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  trialStartedAt: string;
  plan: "trial" | "personal" | "pro" | "team";
  role?: UserRole;
  workspaceName?: string;
  lastLoginAt?: string;
  /** Linked Clerk user id when signed in via Clerk */
  clerkUserId?: string;
}

const ACCOUNTS_KEY = "rv_accounts_v1";
const SESSION_KEY = "rv_session";

function loadAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(list: AccountRecord[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

export function findAccountByEmail(email: string): AccountRecord | null {
  const e = normalizeEmail(email);
  return loadAccounts().find((a) => a.email === e) || null;
}

export function findAccountByClerkId(clerkUserId: string): AccountRecord | null {
  if (!clerkUserId) return null;
  return loadAccounts().find((a) => a.clerkUserId === clerkUserId) || null;
}

/**
 * Link or create a local HomeOS workspace account for a Clerk-authenticated user.
 * Clerk owns password/session; we still keep a local vault profile.
 */
export function ensureAccountFromClerk(input: {
  clerkUserId: string;
  email: string;
  name: string;
}): { account: AccountRecord; session: UserSession; isNew: boolean } {
  const email = normalizeEmail(input.email);
  const name = (input.name || email.split("@")[0] || "HomeOS user").trim();
  const clerkUserId = input.clerkUserId;

  let account = findAccountByClerkId(clerkUserId) || (email ? findAccountByEmail(email) : null);
  let isNew = false;

  if (!account) {
    isNew = true;
    const salt = randomSalt();
    const now = new Date().toISOString();
    // Unusable local password — auth is via Clerk only for this account
    account = {
      id: `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      email: email || `${clerkUserId}@clerk.local`,
      name,
      passwordHash: "clerk-managed",
      salt,
      createdAt: now,
      trialStartedAt: now,
      plan: "trial",
      lastLoginAt: now,
      clerkUserId,
    };
    const list = loadAccounts();
    list.push(account);
    saveAccounts(list);
  } else {
    const list = loadAccounts();
    const idx = list.findIndex((a) => a.id === account!.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        clerkUserId,
        name: name || list[idx].name,
        email: email || list[idx].email,
        lastLoginAt: new Date().toISOString(),
      };
      account = list[idx];
      saveAccounts(list);
    }
  }

  return { account, session: sessionFromAccount(account), isNew };
}

export function listAccounts(): Pick<AccountRecord, "id" | "email" | "name" | "createdAt" | "plan">[] {
  return loadAccounts().map(({ id, email, name, createdAt, plan }) => ({
    id,
    email,
    name,
    createdAt,
    plan,
  }));
}

export type AuthResult =
  | { ok: true; account: AccountRecord; session: UserSession }
  | { ok: false; error: string };

export async function signupAccount(input: {
  name: string;
  email: string;
  password: string;
  /** Anti-bot: hidden honeypot must be empty */
  honeypot?: string;
  /** Anti-bot: timestamp when form was first shown */
  formStartedAt?: number;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const password = input.password;

  const anti = validateSignupInput({
    name,
    email,
    password,
    honeypot: input.honeypot,
    formStartedAt: input.formStartedAt ?? 0,
  });
  if (anti.ok === false) return { ok: false, error: anti.error };

  if (findAccountByEmail(email)) {
    return { ok: false, error: "An account with this email already exists. Log in instead." };
  }

  // Count attempt after validation — rate-limits bot & human spam from this device
  const rate = recordSignupAttempt();
  if (rate.ok === false) return { ok: false, error: rate.error };

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();
  const account: AccountRecord = {
    id: `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    name,
    passwordHash,
    salt,
    createdAt: now,
    trialStartedAt: now,
    plan: "trial",
    lastLoginAt: now,
  };

  const list = loadAccounts();
  list.push(account);
  saveAccounts(list);

  const session = sessionFromAccount(account);
  return { ok: true, account, session };
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const account = findAccountByEmail(email);
  if (!account) return { ok: false, error: "No account found for that email. Create one to start." };

  const hash = await hashPassword(input.password, account.salt);
  if (hash !== account.passwordHash) return { ok: false, error: "Incorrect password. Try again." };

  account.lastLoginAt = new Date().toISOString();
  const list = loadAccounts().map((a) => (a.id === account.id ? account : a));
  saveAccounts(list);

  const session = sessionFromAccount(account);
  return { ok: true, account, session };
}

export function sessionFromAccount(account: AccountRecord, extras?: Partial<UserSession>): UserSession {
  return {
    role: extras?.role || account.role || "Tenant",
    workspaceName: extras?.workspaceName || account.workspaceName || "My HomeOS",
    userName: extras?.userName || account.name,
    userEmail: account.email,
    notificationsEnabled: extras?.notificationsEnabled ?? true,
    security2FAEnabled: extras?.security2FAEnabled ?? false,
    e2eEncryptionEnabled: extras?.e2eEncryptionEnabled ?? true,
    accountId: account.id,
    plan: account.plan,
    trialStartedAt: account.trialStartedAt,
  };
}

export function updateAccountProfile(
  accountId: string,
  patch: Partial<Pick<AccountRecord, "name" | "role" | "workspaceName" | "plan">>
) {
  const list = loadAccounts();
  const idx = list.findIndex((a) => a.id === accountId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  saveAccounts(list);
}

export function saveSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function trialDaysLeft(trialStartedAt?: string): number {
  if (!trialStartedAt) return 14;
  const start = new Date(trialStartedAt).getTime();
  const end = start + 14 * 24 * 60 * 60 * 1000;
  const left = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}
