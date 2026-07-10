import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SignIn, SignUp, useAuth } from "@clerk/react";
import {
  ArrowLeft,
  Check,
  FileText,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { BrandMark } from "./BrandLogo";
import { homeOsClerkAppearance } from "../clerkTheme";

export type AuthMode = "login" | "signup";

interface AuthPageProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: (session: unknown, isNew: boolean) => void;
  onBackToSite?: () => void;
}

const BENEFITS = [
  {
    icon: LayoutDashboard,
    t: "Command Deck in minutes",
    d: "One HQ for homes, money, and life.",
  },
  {
    icon: Home,
    t: "Housing + Home Life",
    d: "Rent, leases, income, budgets, chores.",
  },
  {
    icon: FileText,
    t: "Proof when you need it",
    d: "Docs, exports, and activity trail.",
  },
  {
    icon: Wallet,
    t: "Your data, your rules",
    d: "Export anytime. Cancel when you want.",
  },
];

const TRUST = ["Private by design", "No card to start", "Export anytime"];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Clerk's public TS types only advertise path | hash, but the runtime
 * RoutingStrategy includes "virtual". Virtual keeps multi-step state in memory
 * and does not require the browser path to match — so we can keep BOTH
 * SignIn and SignUp mounted and switch instantly with CSS.
 */
const VIRTUAL = { routing: "virtual" as const } as unknown as { routing: "hash" };

const CROSSFADE_MS = 220;

function useCleanAuthUrl(mode: AuthMode) {
  useEffect(() => {
    const path = mode === "signup" ? "/signup" : "/login";
    if (window.location.pathname !== path || window.location.search) {
      window.history.replaceState(null, "", path);
    }
  }, [mode]);
}

/** Placeholder that matches Clerk field layout while JS hydrates */
function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-3.5 w-full animate-pulse" aria-hidden>
      <div className="h-11 w-full rounded-xl bg-white/[0.06] border border-white/[0.08]" />
      <div className="flex items-center gap-3 my-0.5">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <div className="h-2.5 w-8 rounded bg-white/[0.06]" />
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-12 rounded bg-white/[0.06]" />
        <div className="h-11 w-full rounded-xl bg-white/[0.06] border border-white/[0.08]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-white/[0.06]" />
        <div className="h-11 w-full rounded-xl bg-white/[0.06] border border-white/[0.08]" />
      </div>
      <div className="h-11 w-full rounded-xl bg-white/[0.12] mt-0.5" />
    </div>
  );
}

/**
 * Active panel is in normal flow (sets card height).
 * Inactive stays mounted but absolute so it never stretches the shell
 * or leaves a giant empty gap (Clerk was filling fixed height).
 */
function ClerkPanel({
  active,
  dir,
  children,
}: {
  active: boolean;
  /** Off-screen direction when inactive */
  dir: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="clerk-auth-fields will-change-[opacity,transform]"
      style={{
        position: active ? "relative" : "absolute",
        left: 0,
        right: 0,
        top: 0,
        width: "100%",
        height: "auto",
        opacity: active ? 1 : 0,
        transform: active ? "translate3d(0,0,0)" : `translate3d(${dir * 14}px,0,0)`,
        pointerEvents: active ? "auto" : "none",
        transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.22,1,0.36,1), transform ${CROSSFADE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
        zIndex: active ? 2 : 1,
      }}
      aria-hidden={!active}
      inert={!active || undefined}
    >
      {children}
    </div>
  );
}

export default function AuthPage({ mode, onModeChange, onBackToSite }: AuthPageProps) {
  const isSignup = mode === "signup";
  const dir = isSignup ? 1 : -1;
  const { isLoaded } = useAuth();
  const [formsReady, setFormsReady] = useState(false);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useCleanAuthUrl(mode);

  // Give Clerk UI a beat to paint both embeds after isLoaded
  useEffect(() => {
    if (!isLoaded) {
      setFormsReady(false);
      return;
    }
    // Double-rAF: wait for paint of both mounted embeds
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setFormsReady(true);
      });
    });
    // Fallback if rAF is delayed
    readyTimer.current = setTimeout(() => {
      if (!cancelled) setFormsReady(true);
    }, 400);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      if (readyTimer.current) clearTimeout(readyTimer.current);
    };
  }, [isLoaded]);

  return (
    <div className="h-dvh max-h-dvh bg-[#050505] text-[#FAFAFA] flex overflow-hidden">
      {/* Left — static marketing */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-[48%] flex-col border-r border-white/[0.07] h-full shrink-0 bg-[#070708]">
        <div className="pointer-events-none absolute inset-0 mkt-grid-bg opacity-25" />
        <div className="relative flex flex-col h-full px-10 xl:px-14 py-9">
          <div className="flex items-center gap-2.5 shrink-0">
            <BrandMark size={40} className="shrink-0" />
            <span className="text-[17px] font-black text-white tracking-tight leading-none">
              HomeOS
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-0 py-10">
            <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 mb-5">
              <Sparkles className="w-3 h-3 text-white/55" />
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                Free to start
              </span>
            </div>

            <h1 className="text-[1.85rem] xl:text-[2.15rem] font-black text-white tracking-tight leading-[1.12] max-w-md">
              Stop running home life
              <br />
              <span className="text-white/40">from ten different apps.</span>
            </h1>
            <p className="mt-4 text-[14px] text-[#8E8E93] leading-relaxed max-w-sm font-medium">
              Housing, money, and documents in one private vault — ready in minutes.
            </p>

            <ul className="mt-8 space-y-3.5 max-w-md">
              {BENEFITS.map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center shrink-0 text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[13px] font-black text-white leading-tight">{t}</p>
                    <p className="text-[12px] text-[#6B7280] font-medium mt-0.5 leading-snug">{d}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-2">
              {TRUST.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-[#8E8E93]"
                >
                  <Check className="w-3 h-3 text-white/45" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 pt-6 border-t border-white/[0.07]">
            <p className="text-[12px] text-[#5C5C66] font-medium leading-relaxed max-w-sm flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
              Private by design. We never sell your home history. Export and cancel anytime.
            </p>
          </div>
        </div>
      </aside>

      {/* Right */}
      <main className="relative flex-1 flex flex-col h-full min-w-0 bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 mkt-grid-bg opacity-20" />

        <header className="relative flex items-center justify-between gap-3 px-5 sm:px-8 h-14 shrink-0 z-10">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark size={28} className="shrink-0" />
            <span className="text-sm font-black text-white tracking-tight">HomeOS</span>
          </div>
          <div className="hidden lg:block" />
          {onBackToSite && (
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8E8E93] hover:text-white px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer ml-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </header>

        <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-none">
          <div className="min-h-full flex flex-col items-center px-5 sm:px-8 pt-[max(1.25rem,min(8vh,4.5rem))] pb-10">
            <div className="w-full max-w-[400px] shrink-0">
              {/* Segment control */}
              <div
                className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#0C0C0F] border border-white/[0.08] mb-5"
                role="tablist"
                aria-label="Auth mode"
              >
                <motion.div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_2px_16px_rgba(255,255,255,0.14)]"
                  animate={{ left: mode === "login" ? 4 : "calc(50% + 0px)" }}
                  transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.65 }}
                  aria-hidden
                />
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      if (m !== mode) onModeChange(m);
                    }}
                    className={`relative z-10 h-10 rounded-xl text-[13px] font-bold transition-colors duration-150 cursor-pointer ${
                      mode === m ? "text-black" : "text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    {m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <div className="lg:hidden mb-4 flex flex-wrap gap-1.5 justify-center">
                {TRUST.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-1 text-[10px] font-bold text-[#8E8E93]"
                  >
                    <Check className="w-2.5 h-2.5 text-white/40" />
                    {t}
                  </span>
                ))}
              </div>

              {/* Static card — motion only inside fixed slots */}
              <div className="clerk-auth-shell relative rounded-2xl border border-white/[0.1] bg-[#0A0A0C] p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
                {/* Title — fixed height crossfade */}
                <div className="relative h-[3.75rem] mb-5 overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      key={`title-${mode}`}
                      initial={{ opacity: 0, x: dir * 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: dir * -10 }}
                      transition={{ duration: CROSSFADE_MS / 1000, ease }}
                      className="absolute inset-0"
                    >
                      <h2 className="text-[1.35rem] font-black text-white tracking-tight">
                        {isSignup ? "Create your account" : "Welcome back"}
                      </h2>
                      <p className="text-[13px] text-[#8E8E93] font-medium mt-1.5 leading-snug">
                        {isSignup
                          ? "Open your private vault in under two minutes."
                          : "Sign in to open your Command Deck."}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/*
                  BOTH Clerk forms stay mounted (no reload lag on switch).
                  Active = relative (natural height). Inactive = absolute (hidden, warm).
                  No fixed shell height — that forced Clerk to stretch and left a giant gap.
                */}
                <div className="relative w-full min-h-[220px]">
                  {!formsReady && (
                    <div className="absolute inset-0 z-10 bg-[#0A0A0C]">
                      <AuthFormSkeleton />
                    </div>
                  )}

                  <ClerkPanel active={!isSignup} dir={-1}>
                    <SignIn
                      {...VIRTUAL}
                      signUpUrl="/signup"
                      fallbackRedirectUrl="/app/dashboard"
                      appearance={homeOsClerkAppearance}
                    />
                  </ClerkPanel>

                  <ClerkPanel active={isSignup} dir={1}>
                    <SignUp
                      {...VIRTUAL}
                      signInUrl="/login"
                      fallbackRedirectUrl="/app/dashboard"
                      appearance={homeOsClerkAppearance}
                    />
                  </ClerkPanel>
                </div>
              </div>

              {/* Footer */}
              <div className="relative mt-5 h-6 text-center overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.p
                    key={`footer-${mode}`}
                    initial={{ opacity: 0, x: dir * 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -8 }}
                    transition={{ duration: 0.18, ease }}
                    className="absolute inset-x-0 top-0 text-[12px] text-[#5C5C66] font-medium"
                  >
                    {isSignup ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => onModeChange("login")}
                          className="text-white font-bold hover:underline underline-offset-2 cursor-pointer"
                        >
                          Log in
                        </button>
                      </>
                    ) : (
                      <>
                        New to HomeOS?{" "}
                        <button
                          type="button"
                          onClick={() => onModeChange("signup")}
                          className="text-white font-bold hover:underline underline-offset-2 cursor-pointer"
                        >
                          Sign up free
                        </button>
                      </>
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="text-center text-[10px] text-[#3F3F46] font-medium mt-3">
                Secure authentication · Terms & Privacy apply
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
