import React, { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Show, UserButton } from "@clerk/react";
import type { MarketingNavItem, MarketingPage } from "../types";
import BrandLogo from "../../components/BrandLogo";
import {
  LOGIN_PATH,
  MARKETING_PATH,
  SIGNUP_PATH,
  shouldHandleSpaClick,
} from "../../routing";

interface NavbarProps {
  page: MarketingPage;
  items: MarketingNavItem[];
  onNavigate: (page: MarketingPage) => void;
  onLaunch: () => void;
  onLogin?: () => void;
}

const HAS_CLERK = Boolean(
  (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
    .VITE_CLERK_PUBLISHABLE_KEY
);

export default function Navbar({ page, items, onNavigate, onLaunch, onLogin }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [page]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const goPage = (
    id: MarketingPage,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!shouldHandleSpaClick(e)) return;
    e.preventDefault();
    onNavigate(id);
    setOpen(false);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 safe-top ${
        scrolled || open
          ? "bg-black/90 backdrop-blur-xl border-b border-[#1F1F23]"
          : "bg-black/40 backdrop-blur-md border-b border-transparent sm:bg-transparent sm:backdrop-blur-none"
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <a
          href={MARKETING_PATH.home}
          onClick={(e) => goPage("home", e)}
          className="flex items-center gap-2 group shrink-0 min-w-0"
          aria-label="HomeOS home"
        >
          <BrandLogo
            size="md"
            markClassName="transition-transform group-hover:scale-105"
          />
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {items.map((item) => {
            const active = page === item.id;
            return (
              <a
                key={item.id}
                href={MARKETING_PATH[item.id] || `/${item.id}`}
                onClick={(e) => goPage(item.id, e)}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? "text-white bg-white/10"
                    : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {HAS_CLERK ? (
            <>
              <Show when="signed-out">
                <a
                  href={LOGIN_PATH}
                  onClick={(e) => {
                    if (!shouldHandleSpaClick(e)) return;
                    e.preventDefault();
                    onLogin?.();
                  }}
                  className="mkt-btn-ghost text-xs px-3 py-2.5 hidden sm:inline-flex"
                >
                  Log in
                </a>
                <a
                  href={SIGNUP_PATH}
                  onClick={(e) => {
                    if (!shouldHandleSpaClick(e)) return;
                    e.preventDefault();
                    onLaunch();
                  }}
                  className="mkt-btn-primary text-xs px-3.5 py-2.5 hidden sm:inline-flex"
                >
                  Sign up
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Show>
              <Show when="signed-in">
                <button
                  type="button"
                  onClick={onLaunch}
                  className="mkt-btn-primary text-xs px-3.5 py-2.5 hidden sm:inline-flex"
                >
                  Open vault
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="hidden sm:flex items-center pl-0.5">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </Show>
            </>
          ) : (
            <>
              {onLogin && (
                <a
                  href={LOGIN_PATH}
                  onClick={(e) => {
                    if (!shouldHandleSpaClick(e)) return;
                    e.preventDefault();
                    onLogin();
                  }}
                  className="mkt-btn-ghost text-xs px-3 py-2.5 hidden sm:inline-flex"
                >
                  Log in
                </a>
              )}
              <a
                href={SIGNUP_PATH}
                onClick={(e) => {
                  if (!shouldHandleSpaClick(e)) return;
                  e.preventDefault();
                  onLaunch();
                }}
                className="mkt-btn-primary text-xs px-3.5 py-2.5 hidden sm:inline-flex"
              >
                Sign up
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-xl text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#1F1F23] bg-black/98 backdrop-blur-xl animate-fadeIn max-h-[calc(100dvh-3.5rem)] overflow-y-auto safe-bottom">
          <nav className="max-w-6xl mx-auto px-3 py-3 flex flex-col gap-1" aria-label="Marketing">
            {items.map((item) => {
              const active = page === item.id;
              return (
                <a
                  key={item.id}
                  href={MARKETING_PATH[item.id] || `/${item.id}`}
                  onClick={(e) => goPage(item.id, e)}
                  aria-current={active ? "page" : undefined}
                  className={`text-left px-3 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[48px] ${
                    active
                      ? "bg-white text-black"
                      : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            {HAS_CLERK ? (
              <>
                <Show when="signed-out">
                  <a
                    href={LOGIN_PATH}
                    onClick={(e) => {
                      if (!shouldHandleSpaClick(e)) return;
                      e.preventDefault();
                      onLogin?.();
                    }}
                    className="mkt-btn-ghost text-sm px-4 py-3.5 mt-1 w-full min-h-[48px]"
                  >
                    Log in
                  </a>
                  <a
                    href={SIGNUP_PATH}
                    onClick={(e) => {
                      if (!shouldHandleSpaClick(e)) return;
                      e.preventDefault();
                      onLaunch();
                    }}
                    className="mkt-btn-primary text-sm px-4 py-3.5 mt-1 w-full min-h-[48px]"
                  >
                    Sign up free
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center justify-between gap-3 mt-2 px-1 py-2">
                    <button
                      type="button"
                      onClick={onLaunch}
                      className="mkt-btn-primary text-sm px-4 py-3.5 flex-1 min-h-[48px]"
                    >
                      Open vault
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </Show>
              </>
            ) : (
              <>
                {onLogin && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="mkt-btn-ghost text-sm px-4 py-3.5 mt-1 w-full min-h-[48px]"
                  >
                    Log in
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLaunch}
                  className="mkt-btn-primary text-sm px-4 py-3.5 mt-1 w-full min-h-[48px]"
                >
                  Sign up free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
