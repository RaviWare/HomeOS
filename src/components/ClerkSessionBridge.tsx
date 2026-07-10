import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  ensureAccountFromClerk,
  updateAccountProfile,
  type AccountRecord,
} from "../auth";
import type { UserSession } from "../types";
import { isPaidPlan, resolvePlanFromHas } from "../billing";

interface ClerkSessionBridgeProps {
  /** True when HomeOS local session is active */
  hasSession: boolean;
  sessionReady: boolean;
  onClerkAuth: (session: UserSession, isNew: boolean) => void;
  onClerkSignOut: () => void;
  /** Optional: push plan updates when Clerk subscription changes mid-session */
  onPlanSync?: (session: UserSession) => void;
  currentSession?: UserSession | null;
}

/**
 * Syncs Clerk signed-in state into the HomeOS local workspace session.
 * When the user signs in via Clerk, we create/link a vault account and call onClerkAuth.
 * When they sign out of Clerk, we clear the HomeOS session.
 * Paid plan is read from Clerk `has({ plan })` — never from localStorage alone.
 */
export default function ClerkSessionBridge({
  hasSession,
  sessionReady,
  onClerkAuth,
  onClerkSignOut,
  onPlanSync,
  currentSession,
}: ClerkSessionBridgeProps) {
  const { isLoaded, isSignedIn, has } = useAuth();
  const { user } = useUser();
  const lastClerkId = useRef<string | null>(null);
  const signedOutHandled = useRef(false);
  const lastPlanKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !sessionReady) return;

    if (isSignedIn && user) {
      signedOutHandled.current = false;
      const clerkUserId = user.id;
      if (lastClerkId.current === clerkUserId && hasSession) return;

      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        "";
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.fullName ||
        user.username ||
        email.split("@")[0] ||
        "HomeOS user";

      const { session, isNew } = ensureAccountFromClerk({
        clerkUserId,
        email,
        name,
      });

      // Apply Clerk Billing plan if already subscribed
      const clerkPlan = resolvePlanFromHas(has);
      let nextSession = session;
      if (clerkPlan && isPaidPlan(clerkPlan) && session.plan !== clerkPlan) {
        nextSession = {
          ...session,
          plan: clerkPlan,
          planStartedAt: session.planStartedAt || new Date().toISOString(),
        };
        if (session.accountId) {
          updateAccountProfile(session.accountId, { plan: clerkPlan });
        }
      }

      lastClerkId.current = clerkUserId;
      onClerkAuth(nextSession, isNew);
      return;
    }

    // Signed out of Clerk — clear local session if it was Clerk-linked
    if (!isSignedIn && hasSession && lastClerkId.current) {
      lastClerkId.current = null;
      if (!signedOutHandled.current) {
        signedOutHandled.current = true;
        onClerkSignOut();
      }
    }

    if (!isSignedIn) {
      lastClerkId.current = null;
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    has,
    hasSession,
    sessionReady,
    onClerkAuth,
    onClerkSignOut,
  ]);

  // Mid-session plan sync (after checkout without full re-auth)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hasSession || !currentSession || !onPlanSync) return;
    const clerkPlan = resolvePlanFromHas(has);
    if (!clerkPlan || !isPaidPlan(clerkPlan)) return;
    if (currentSession.plan === clerkPlan) return;
    const key = `${user?.id}:${clerkPlan}`;
    if (lastPlanKey.current === key) return;
    lastPlanKey.current = key;
    const next: UserSession = {
      ...currentSession,
      plan: clerkPlan,
      planStartedAt: currentSession.planStartedAt || new Date().toISOString(),
      planExpiresAt: undefined,
      autoRenew: true,
    };
    if (currentSession.accountId) {
      updateAccountProfile(currentSession.accountId, { plan: clerkPlan });
    }
    onPlanSync(next);
  }, [
    isLoaded,
    isSignedIn,
    has,
    hasSession,
    currentSession,
    onPlanSync,
    user?.id,
  ]);

  return null;
}

/** Type re-export helper for callers that need AccountRecord */
export type { AccountRecord };
