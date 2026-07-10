import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import RolesPage from "./pages/RolesPage";
import PricingPage from "./pages/PricingPage";
import RoadmapPage from "./pages/RoadmapPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import type { MarketingNavItem, MarketingPage } from "./types";
import { APP_PATH, MARKETING_PATH } from "../routing";

/** Primary nav (header) — high-traffic pages only */
const NAV: MarketingNavItem[] = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "roles", label: "Roles" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
];

interface MarketingSiteProps {
  page: MarketingPage;
  onNavigate: (page: MarketingPage) => void;
  onLaunch: () => void;
  onLogin?: () => void;
}

export default function MarketingSite({ page, onNavigate, onLaunch, onLogin }: MarketingSiteProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="min-h-dvh bg-black text-[#FAFAFA] flex flex-col selection:bg-white/20 font-sans antialiased mkt-grid-bg overflow-x-hidden">
      <Navbar
        page={page}
        items={NAV}
        onNavigate={onNavigate}
        onLaunch={onLaunch}
        onLogin={onLogin}
      />

      <main
        className={`flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-[3.75rem] sm:pt-20 ${
          page === "home" ? "pb-0" : "pb-6 sm:pb-8"
        }`}
      >
        {page === "home" && (
          <HomePage onNavigate={onNavigate} onLaunch={onLaunch} onLogin={onLogin} />
        )}
        {page === "features" && <FeaturesPage onLaunch={onLaunch} />}
        {page === "how-it-works" && <HowItWorksPage onLaunch={onLaunch} />}
        {page === "roles" && <RolesPage onLaunch={onLaunch} />}
        {page === "pricing" && <PricingPage onLaunch={onLaunch} onNavigate={onNavigate} />}
        {page === "roadmap" && <RoadmapPage onLaunch={onLaunch} />}
        {page === "about" && <AboutPage onLaunch={onLaunch} />}
        {(page === "contact" || page === "faq") && <ContactPage onLaunch={onLaunch} />}
        {(page === "privacy" || page === "security") && <PrivacyPage />}
        {page === "terms" && <TermsPage />}
      </main>

      <Footer items={NAV} onNavigate={onNavigate} onLaunch={onLaunch} />

      <CookieBanner onNavigate={onNavigate} />

      {/* Hidden SEO-friendly list of public URLs for crawlers / debugging */}
      <nav className="sr-only" aria-label="Site map">
        {Object.entries(MARKETING_PATH).map(([id, path]) => (
          <a key={id} href={path}>
            {id}
          </a>
        ))}
        {Object.entries(APP_PATH).map(([id, path]) => (
          <a key={`app-${id}`} href={path}>
            app/{id}
          </a>
        ))}
      </nav>
    </div>
  );
}
