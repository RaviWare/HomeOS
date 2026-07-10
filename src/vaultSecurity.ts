/**
 * Vault security helpers — Web Crypto (open web standard, no npm deps).
 * - Recovery codes (hashed at rest with SHA-256)
 * - Optional vault passphrase gate for sensitive exports
 * - AES-256-GCM via existing crypto.ts for backups
 */

const CODES_KEY = "rv_mfa_recovery_hashes_v1";
const VAULT_SALT_KEY = "rv_vault_pass_salt_v1";
const VAULT_VERIFY_KEY = "rv_vault_pass_verify_v1";
const VAULT_UNLOCKED_KEY = "rv_vault_unlocked_session";

function b64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(dig))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate 8 recovery codes; store only SHA-256 hashes. Returns plain codes once. */
export async function generateRecoveryCodes(): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const num = Array.from(bytes)
      .map((b) => (b % 36).toString(36))
      .join("")
      .toUpperCase();
    // Format ABCD-EFGH
    codes.push(`${num.slice(0, 4)}-${num.slice(4, 8)}`);
  }
  const hashes = await Promise.all(codes.map((c) => sha256Hex(c.replace(/-/g, "").toUpperCase())));
  try {
    localStorage.setItem(
      CODES_KEY,
      JSON.stringify({ at: new Date().toISOString(), hashes })
    );
  } catch {
    /* ignore */
  }
  return codes;
}

export function hasRecoveryCodes(): boolean {
  try {
    const raw = localStorage.getItem(CODES_KEY);
    if (!raw) return false;
    const j = JSON.parse(raw) as { hashes?: string[] };
    return Array.isArray(j.hashes) && j.hashes.length > 0;
  } catch {
    return false;
  }
}

export function recoveryCodesMeta(): { count: number; at?: string } {
  try {
    const raw = localStorage.getItem(CODES_KEY);
    if (!raw) return { count: 0 };
    const j = JSON.parse(raw) as { hashes?: string[]; at?: string };
    return { count: j.hashes?.length || 0, at: j.at };
  } catch {
    return { count: 0 };
  }
}

/** Consume a recovery code (one-time). */
export async function consumeRecoveryCode(code: string): Promise<boolean> {
  const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) return false;
  const hash = await sha256Hex(normalized);
  try {
    const raw = localStorage.getItem(CODES_KEY);
    if (!raw) return false;
    const j = JSON.parse(raw) as { at?: string; hashes: string[] };
    const idx = j.hashes.indexOf(hash);
    if (idx < 0) return false;
    j.hashes.splice(idx, 1);
    localStorage.setItem(CODES_KEY, JSON.stringify(j));
    return true;
  } catch {
    return false;
  }
}

async function deriveVerifyKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Set or update vault passphrase (for gated exports / lock preference). */
export async function setVaultPassphrase(passphrase: string): Promise<void> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Passphrase must be at least 8 characters.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVerifyKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode("homeos-vault-ok")
  );
  localStorage.setItem(VAULT_SALT_KEY, b64(salt.buffer));
  localStorage.setItem(
    VAULT_VERIFY_KEY,
    JSON.stringify({ iv: b64(iv.buffer), data: b64(ct) })
  );
  try {
    sessionStorage.setItem(VAULT_UNLOCKED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasVaultPassphrase(): boolean {
  return !!(localStorage.getItem(VAULT_SALT_KEY) && localStorage.getItem(VAULT_VERIFY_KEY));
}

export async function verifyVaultPassphrase(passphrase: string): Promise<boolean> {
  try {
    const saltB = localStorage.getItem(VAULT_SALT_KEY);
    const ver = localStorage.getItem(VAULT_VERIFY_KEY);
    if (!saltB || !ver) return false;
    const { iv, data } = JSON.parse(ver) as { iv: string; data: string };
    const key = await deriveVerifyKey(passphrase, fromB64(saltB));
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(iv) },
      key,
      fromB64(data)
    );
    const ok = new TextDecoder().decode(pt) === "homeos-vault-ok";
    if (ok) {
      try {
        sessionStorage.setItem(VAULT_UNLOCKED_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    return ok;
  } catch {
    return false;
  }
}

export function clearVaultPassphrase() {
  localStorage.removeItem(VAULT_SALT_KEY);
  localStorage.removeItem(VAULT_VERIFY_KEY);
  try {
    sessionStorage.removeItem(VAULT_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
}

export function isVaultUnlockedThisSession(): boolean {
  if (!hasVaultPassphrase()) return true;
  try {
    return sessionStorage.getItem(VAULT_UNLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function lockVaultSession() {
  try {
    sessionStorage.removeItem(VAULT_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether encrypted export should be required (pref + passphrase set). */
export function shouldForceEncryptedExport(e2eEnabled: boolean): boolean {
  return e2eEnabled && hasVaultPassphrase();
}
