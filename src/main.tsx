import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App.tsx";
import { homeOsClerkAppearance } from "./clerkTheme";
import "./index.css";

// Production: do not auto-seed sample homes into every browser.
// Users start with an account + empty (or optionally prefilled) workspace via onboarding.

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!PUBLISHABLE_KEY) {
  console.warn(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Run `clerk env pull` or set it in .env for Clerk auth."
  );
}

const root = document.getElementById("root")!;

createRoot(root).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInUrl="/login"
        signUpUrl="/signup"
        signInFallbackRedirectUrl="/app/dashboard"
        signUpFallbackRedirectUrl="/app/dashboard"
        appearance={homeOsClerkAppearance}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
