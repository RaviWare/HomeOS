/**
 * Client-side anti-spam / bot protection for signup + contact forms.
 * Layers: honeypot, timing, rate limits, disposable email, pattern heuristics.
 */

const RATE_SIGNUP_KEY = "homeos_rl_signup_v1";
const RATE_CONTACT_KEY = "homeos_rl_contact_v1";

/** Minimum time (ms) a human needs to complete the form after mount */
export const MIN_FORM_MS = 2800;

/** Rate limits (sliding window) */
const SIGNUP_MAX = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CONTACT_MAX = 4;
const CONTACT_WINDOW_MS = 60 * 60 * 1000;

/** Common disposable / throwaway email domains */
const DISPOSABLE_DOMAINS = new Set(
  [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "sharklasers.com",
    "grr.la",
    "tempmail.com",
    "temp-mail.org",
    "tempmailo.com",
    "throwaway.email",
    "yopmail.com",
    "yopmail.fr",
    "trashmail.com",
    "trashmail.me",
    "getnada.com",
    "nada.ltd",
    "10minutemail.com",
    "10minutemail.net",
    "minutemail.com",
    "maildrop.cc",
    "dispostable.com",
    "fakeinbox.com",
    "mailnesia.com",
    "spam4.me",
    "trash-mail.com",
    "moakt.com",
    "tempail.com",
    "emailondeck.com",
    "getairmail.com",
    "mohmal.com",
    "tempinbox.com",
    "discard.email",
    "discardmail.com",
    "mailcatch.com",
    "mytemp.email",
    "tmpmail.org",
    "tmpmail.net",
    "tmpeml.com",
    "emailfake.com",
    "crazymailing.com",
    "mailnull.com",
    "spamgourmet.com",
    "mailforspam.com",
    "inboxalias.com",
    "jetable.org",
    "mailtemp.info",
    "tempmailaddress.com",
    "burnermail.io",
    "guerrillamailblock.com",
    "pokemail.net",
    "spamfree24.org",
    "mt2015.com",
    "thankyou2010.com",
    "trashymail.com",
    "mailzilla.com",
    "spamspot.com",
    "spam.la",
    "binkmail.com",
    "bobmail.info",
    "chammy.info",
    "devnullmail.com",
    "mailin8r.com",
    "mailinator2.com",
    "notmailinator.com",
    "reallymymail.com",
    "safetymail.info",
    "sogetthis.com",
    "spamhereplease.com",
    "superrito.com",
    "thisisnotmyrealemail.com",
    "tradermail.info",
    "veryrealemail.com",
    "zippymail.info",
    "0-mail.com",
    "33mail.com",
    "mailsac.com",
    "harakirimail.com",
    "spamdecoy.net",
    "tempmail.dev",
  ].map((d) => d.toLowerCase())
);

const SPAM_MESSAGE_PATTERNS = [
  /\b(viagra|cialis|crypto\s*airdrop|forex\s*robot|seo\s*ranking|backlink\s*package)\b/i,
  /\b(buy\s+followers|instagram\s+growth|onlyfans)\b/i,
  /\b(https?:\/\/){2,}/i,
  /(https?:\/\/\S+\s*){4,}/i,
  /\b(casino|slots|betting\s+odds)\b/i,
  /\b(work\s+from\s+home\s+\$\d|make\s+\$\d{3,}\s*\/\s*day)\b/i,
  /[\u0400-\u04FF]{20,}/, // long cyrillic spam dumps mixed in EN forms
];

export type AntiSpamResult = { ok: true } | { ok: false; error: string };

function readTimestamps(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeTimestamps(key: string, times: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(times));
  } catch {
    /* ignore quota */
  }
}

function pruneAndCount(key: string, windowMs: number, max: number): AntiSpamResult {
  const now = Date.now();
  const recent = readTimestamps(key).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return {
      ok: false,
      error: "Too many attempts from this device. Please wait a while and try again.",
    };
  }
  recent.push(now);
  writeTimestamps(key, recent);
  return { ok: true };
}

export function recordSignupAttempt(): AntiSpamResult {
  return pruneAndCount(RATE_SIGNUP_KEY, SIGNUP_WINDOW_MS, SIGNUP_MAX);
}

export function recordContactAttempt(): AntiSpamResult {
  return pruneAndCount(RATE_CONTACT_KEY, CONTACT_WINDOW_MS, CONTACT_MAX);
}

/** Call before recording — peeks without writing */
export function canAttempt(key: "signup" | "contact"): AntiSpamResult {
  const now = Date.now();
  if (key === "signup") {
    const recent = readTimestamps(RATE_SIGNUP_KEY).filter((t) => now - t < SIGNUP_WINDOW_MS);
    if (recent.length >= SIGNUP_MAX) {
      return {
        ok: false,
        error: "Too many signup attempts. Please wait up to an hour and try again.",
      };
    }
  } else {
    const recent = readTimestamps(RATE_CONTACT_KEY).filter((t) => now - t < CONTACT_WINDOW_MS);
    if (recent.length >= CONTACT_MAX) {
      return {
        ok: false,
        error: "Too many messages sent. Please wait a while before contacting again.",
      };
    }
  }
  return { ok: true };
}

export function checkHoneypot(value: string | undefined | null): AntiSpamResult {
  if (value && String(value).trim().length > 0) {
    // Silent-looking rejection — bots filled the hidden field
    return { ok: false, error: "Unable to complete this request. Please try again later." };
  }
  return { ok: true };
}

export function checkFormTiming(startedAt: number, minMs = MIN_FORM_MS): AntiSpamResult {
  const elapsed = Date.now() - startedAt;
  if (!startedAt || elapsed < minMs) {
    return {
      ok: false,
      error: "Please take a moment to complete the form, then try again.",
    };
  }
  // Unrealistically long open tab + instant submit is fine; ignore upper bound
  return { ok: true };
}

export function isDisposableEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 0) return false;
  const domain = e.slice(at + 1);
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Subdomain of disposable (e.g. foo.mailinator.com)
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain.endsWith("." + d)) return true;
  }
  return false;
}

export function validateEmailAddress(email: string): AntiSpamResult {
  const e = email.trim().toLowerCase();
  if (!e || e.length > 254) return { ok: false, error: "Enter a valid email address." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  // Reject emails with consecutive dots, leading/trailing dots in local part
  const [local, domain] = e.split("@");
  if (!local || !domain) return { ok: false, error: "Enter a valid email address." };
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  // Random bot locals: long alphanumeric only
  if (local.length >= 24 && /^[a-z0-9]+$/.test(local) && !/[aeiou]{2}/i.test(local)) {
    return { ok: false, error: "Please use a real email address." };
  }
  if (isDisposableEmail(e)) {
    return {
      ok: false,
      error: "Temporary or disposable email addresses are not allowed. Use a permanent email.",
    };
  }
  // Block role spam patterns
  if (/^(test|asdf|qwerty|admin|root|noreply|no-reply)\d*@/i.test(e) && local.length <= 12) {
    // allow real people named test@company.com if domain looks real — only block obvious fakes on free domains
    const free = /^(gmail|yahoo|hotmail|outlook|icloud|proton|protonmail|aol|mail)\./i.test(domain);
    if (free && /^(test|asdf|qwerty)\d*@/i.test(e)) {
      return { ok: false, error: "Please use a real email address." };
    }
  }
  return { ok: true };
}

export function validatePersonName(name: string): AntiSpamResult {
  const n = name.trim();
  if (n.length < 2) return { ok: false, error: "Enter your full name (at least 2 characters)." };
  if (n.length > 80) return { ok: false, error: "Name is too long." };
  // Must contain at least one letter
  if (!/[\p{L}]/u.test(n)) {
    return { ok: false, error: "Enter a valid name." };
  }
  // Reject pure numbers / keyboard spam
  if (/^[0-9\s\-_.]+$/.test(n)) return { ok: false, error: "Enter a valid name." };
  if (/^(.)\1{4,}$/.test(n)) return { ok: false, error: "Enter a valid name." };
  if (/^(test|asdf|qwerty|admin|user|name|xxx|abc|aaaa)\d*$/i.test(n)) {
    return { ok: false, error: "Enter your real name." };
  }
  // High consonant density random strings (bot names)
  const letters = n.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 10) {
    const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
    if (vowels / letters.length < 0.12) {
      return { ok: false, error: "Enter a valid name." };
    }
  }
  // Excess URLs in name
  if (/https?:\/\//i.test(n) || /www\./i.test(n)) {
    return { ok: false, error: "Enter a valid name." };
  }
  return { ok: true };
}

export function validateContactMessage(message: string): AntiSpamResult {
  const m = message.trim();
  if (m.length < 12) {
    return { ok: false, error: "Please write a bit more so we can help (at least a short sentence)." };
  }
  if (m.length > 5000) return { ok: false, error: "Message is too long." };
  for (const re of SPAM_MESSAGE_PATTERNS) {
    if (re.test(m)) {
      return { ok: false, error: "Message could not be sent. Please revise and try again." };
    }
  }
  // Mostly non-latin mixed with links often spam
  const linkCount = (m.match(/https?:\/\//gi) || []).length;
  if (linkCount >= 3) {
    return { ok: false, error: "Too many links in one message. Please remove some and try again." };
  }
  return { ok: true };
}

export function validateSignupInput(input: {
  name: string;
  email: string;
  password: string;
  honeypot?: string;
  formStartedAt: number;
}): AntiSpamResult {
  const hp = checkHoneypot(input.honeypot);
  if (!hp.ok) return hp;

  const timing = checkFormTiming(input.formStartedAt);
  if (!timing.ok) return timing;

  const name = validatePersonName(input.name);
  if (!name.ok) return name;

  const email = validateEmailAddress(input.email);
  if (!email.ok) return email;

  if (!input.password || input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  // Block passwords that are only the email local-part or "password"
  const local = input.email.split("@")[0]?.toLowerCase() || "";
  if (input.password.toLowerCase() === local || /^password\d*$/i.test(input.password)) {
    return { ok: false, error: "Choose a stronger, unique password." };
  }

  const rate = canAttempt("signup");
  if (!rate.ok) return rate;

  return { ok: true };
}

export function validateContactInput(input: {
  name: string;
  email: string;
  message: string;
  topic?: string;
  honeypot?: string;
  formStartedAt: number;
}): AntiSpamResult {
  const hp = checkHoneypot(input.honeypot);
  if (!hp.ok) return hp;

  const timing = checkFormTiming(input.formStartedAt);
  if (!timing.ok) return timing;

  const name = validatePersonName(input.name);
  if (!name.ok) return name;

  const email = validateEmailAddress(input.email);
  if (!email.ok) return email;

  const msg = validateContactMessage(input.message);
  if (!msg.ok) return msg;

  const rate = canAttempt("contact");
  if (!rate.ok) return rate;

  return { ok: true };
}

/** Honeypot field props — visually hidden, not display:none (some bots skip display:none) */
export const HONEYPOT_FIELD_NAME = "company_website";
