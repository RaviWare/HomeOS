import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { MarketingNavItem, MarketingPage } from "../types";
import BrandLogo from "../../components/BrandLogo";
import { MARKETING_PATH, shouldHandleSpaClick } from "../../routing";

interface FooterProps {
  items: MarketingNavItem[];
  onNavigate: (page: MarketingPage) => void;
  onLaunch: () => void;
}

const PRODUCT: MarketingNavItem[] = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "pricing", label: "Pricing" },
  { id: "roles", label: "Roles" },
  { id: "roadmap", label: "Roadmap" },
];

const SOLUTIONS: MarketingNavItem[] = [
  { id: "roles", label: "For Tenants" },
  { id: "roles", label: "For Landlords" },
  { id: "roles", label: "For Managers" },
  { id: "roles", label: "For Society Admins" },
  { id: "features", label: "Full module list" },
];

const COMPANY: MarketingNavItem[] = [
  { id: "about", label: "About HomeOS" },
  { id: "contact", label: "Contact & FAQ" },
  { id: "roadmap", label: "Product roadmap" },
];

const LEGAL: MarketingNavItem[] = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
];

const FooterLink: React.FC<{
  label: string;
  href: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  delay?: number;
}> = ({ label, href, onClick, delay = 0 }) => (
  <li style={{ animationDelay: `${delay}ms` }} className="mkt-footer-link-item">
    <a href={href} onClick={onClick} className="mkt-footer-link group">
      <span className="mkt-footer-link-bar" aria-hidden />
      <span>{label}</span>
      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-white/50" />
    </a>
  </li>
);

const FooterColumn: React.FC<{
  title: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, children, delay = 0 }) => (
  <div className="mkt-footer-col" style={{ animationDelay: `${delay}ms` }}>
    <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45 mb-4">
      {title}
    </h4>
    <ul className="flex flex-col gap-1.5">{children}</ul>
  </div>
);

export default function Footer({ onNavigate, onLaunch }: FooterProps) {
  const goPage = (
    id: MarketingPage,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!shouldHandleSpaClick(e)) return;
    e.preventDefault();
    onNavigate(id);
  };

  return (
    <footer className="relative mt-auto border-t border-[#1F1F23] bg-[#050506] overflow-hidden">
      {/* Ambient motion layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-80 h-80 bg-white/[0.04] rounded-full blur-[100px] animate-mkt-glow" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/[0.06] rounded-full blur-[120px] animate-mkt-glow"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-mkt-shimmer-line" />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-10 safe-bottom">
        {/* Top CTA band */}
        <div className="mkt-card mkt-footer-cta mb-10 sm:mb-14 p-5 sm:p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 animate-mkt-border">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] animate-pulse" />
              14-day free trial · HomeOS
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Run your entire home life with HomeOS
            </h3>
            <p className="text-sm text-[#8E8E93] mt-2 max-w-lg leading-relaxed font-medium">
              Housing, income, assets, budgets, chores, documents, and an immutable trail — one
              private operating system for home, not another spreadsheet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={onLaunch}
              className="mkt-btn-primary text-sm px-5 py-3.5 mkt-footer-pulse min-h-[48px] w-full sm:w-auto"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={MARKETING_PATH.pricing}
              onClick={(e) => goPage("pricing", e)}
              className="mkt-btn-ghost text-sm px-5 py-3.5 min-h-[48px] w-full sm:w-auto text-center"
            >
              View plans
            </a>
          </div>
        </div>

        {/* Main link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 mkt-footer-col" style={{ animationDelay: "0ms" }}>
            <a
              href={MARKETING_PATH.home}
              onClick={(e) => goPage("home", e)}
              className="flex items-center gap-2.5 group mb-4"
            >
              <BrandLogo size="md" />
            </a>
            <p className="text-sm text-[#8E8E93] leading-relaxed max-w-xs font-medium">
              The operating system for home life — housing, money, assets, travel budgets,
              household chores, documents, and answers from your own data.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {[
                { icon: ShieldCheck, text: "Privacy-first by design" },
                { icon: Lock, text: "Private by design" },
                { icon: CheckCircle2, text: "14-day free trial" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[11px] font-bold text-[#8E8E93]">
                  <Icon className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Product" delay={80}>
              {PRODUCT.map((item, i) => (
                <FooterLink
                  key={item.id + item.label}
                  label={item.label}
                  href={MARKETING_PATH[item.id] || `/${item.id}`}
                  delay={100 + i * 40}
                  onClick={(e) => goPage(item.id, e)}
                />
              ))}
            </FooterColumn>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Solutions" delay={140}>
              {SOLUTIONS.map((item, i) => (
                <FooterLink
                  key={item.label}
                  label={item.label}
                  href={MARKETING_PATH[item.id] || `/${item.id}`}
                  delay={120 + i * 40}
                  onClick={(e) => goPage(item.id, e)}
                />
              ))}
            </FooterColumn>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Company" delay={200}>
              {COMPANY.map((item, i) => (
                <FooterLink
                  key={item.label}
                  label={item.label}
                  href={MARKETING_PATH[item.id] || `/${item.id}`}
                  delay={140 + i * 40}
                  onClick={(e) => goPage(item.id, e)}
                />
              ))}
            </FooterColumn>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <FooterColumn title="Legal" delay={260}>
              {LEGAL.map((item, i) => (
                <FooterLink
                  key={item.label}
                  label={item.label}
                  href={MARKETING_PATH[item.id] || `/${item.id}`}
                  delay={160 + i * 40}
                  onClick={(e) => goPage(item.id, e)}
                />
              ))}
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#1F1F23] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <p className="text-[11px] text-[#8E8E93] font-medium">
            © {new Date().getFullYear()} HomeOS. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL.map((item) => (
              <a
                key={item.label}
                href={MARKETING_PATH[item.id] || `/${item.id}`}
                onClick={(e) => goPage(item.id, e)}
                className="text-[11px] font-bold text-[#8E8E93] hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("homeos-open-cookie-prefs"));
              }}
              className="text-[11px] font-bold text-[#8E8E93] hover:text-white transition-colors"
            >
              Cookie preferences
            </button>
          </div>
          <p className="text-[11px] text-[#8E8E93] font-medium">
            The operating system for home life
          </p>
        </div>
      </div>
    </footer>
  );
}
