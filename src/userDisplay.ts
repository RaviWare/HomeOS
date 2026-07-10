/**
 * Resolve a display name for greetings / sidebar.
 * Never invent demo personas (Siddharth, Vikram, etc.).
 * Only use the logged-in session name when it looks intentional.
 */

const PLACEHOLDER_NAMES = new Set(
  [
    "homeos user",
    "siddharth",
    "siddharth roy",
    "vikram",
    "vikram malhotra",
    "ravi",
    "ravi teja",
    "user",
    "there",
    "demo",
    "test",
    "guest",
  ].map((s) => s.toLowerCase())
);

export function resolveDisplayName(userName?: string | null, userEmail?: string | null): string | null {
  const raw = (userName || "").trim();
  if (!raw) return null;
  if (PLACEHOLDER_NAMES.has(raw.toLowerCase())) return null;
  // Single token that is a known first-name placeholder
  const first = raw.split(/\s+/)[0];
  if (PLACEHOLDER_NAMES.has(first.toLowerCase()) && raw.split(/\s+/).length === 1) return null;
  // Prefer requiring email so onboarding-completed accounts with a real profile win
  if (!userEmail || !String(userEmail).trim()) {
    // Still allow a custom name without email if it is not a known demo label
    if (PLACEHOLDER_NAMES.has(raw.toLowerCase())) return null;
  }
  return first;
}

export function greetingWithoutName(style: "auto" | "hello" | "welcome" | "good_day" = "auto"): string {
  const hour = new Date().getHours();
  if (style === "hello") return "Hello";
  if (style === "welcome") return "Welcome back";
  if (style === "good_day") return "Good day";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function greetingWithOptionalName(
  style: "auto" | "hello" | "welcome" | "good_day",
  userName?: string | null,
  userEmail?: string | null
): string {
  const name = resolveDisplayName(userName, userEmail);
  const base = greetingWithoutName(style);
  return name ? `${base}, ${name}` : base;
}

export function initialsFromUser(userName?: string | null, userEmail?: string | null): string {
  const name = resolveDisplayName(userName, userEmail);
  if (name) return name.slice(0, 2).toUpperCase();
  const email = (userEmail || "").trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "HO";
}
