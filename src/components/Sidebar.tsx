import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Globe,
} from "lucide-react";
import { UserRole } from "../types";
import { initialsFromUser, resolveDisplayName } from "../userDisplay";
import { resolveAvatarUrl } from "../avatar";
import { BrandMark } from "./BrandLogo";
import {
  APP_NAV,
  mobileQuickForUser,
  navGroupedForUser,
} from "../appNav";
import { loadDeckPrefs } from "./deckPrefs";
import { PERSONAS, personaForRole, roleTitle } from "../userPersonas";
import {
  APP_PATH,
  isAppTab,
  MARKETING_PATH,
  pathForAppTab,
  shouldHandleSpaClick,
  type AppTab,
} from "../routing";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  userName: string;
  userEmail?: string;
  avatarUrl?: string;
  userRole: UserRole;
  workspaceName: string;
  onLogout: () => void;
  /** Leave app shell → marketing website home (stays signed in) */
  onWebsiteHome?: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  avatarUrl,
  userRole,
  workspaceName,
  onLogout,
  onWebsiteHome,
}: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [logoMenu, setLogoMenu] = useState<"mobile" | "drawer" | "desktop" | null>(
    null
  );
  const [imgFailed, setImgFailed] = useState(false);
  /** Re-read prefs when role changes or menu opens (customization from deck) */
  const [prefsTick, setPrefsTick] = useState(0);
  const logoMenuRef = useRef<HTMLDivElement | null>(null);

  const { groups, quickItems, personaLabel } = useMemo(() => {
    const prefs = loadDeckPrefs();
    const p =
      prefs.usePersonaDefaults && prefs.personaOverride
        ? PERSONAS[prefs.personaOverride]
        : personaForRole(userRole);

    const groups = navGroupedForUser({
      priority: p.modulePriority,
      moduleOrder: prefs.moduleOrder,
      secondary: p.secondaryModules,
      includeSecondary: prefs.showSecondaryModules,
      hidden: prefs.hiddenModules,
      pinned: prefs.pinnedModules,
      groupBlurbs: p.groupBlurbs as any,
    });
    const quickItems = mobileQuickForUser(
      (prefs.moduleOrder?.length
        ? prefs.moduleOrder.filter((id) => id !== "dashboard" && id !== "settings")
        : p.mobileQuick
      ).slice(0, 6)
    );
    return { groups, quickItems, personaLabel: p.label };
  }, [userRole, prefsTick]);

  useEffect(() => {
    setPrefsTick((t) => t + 1);
  }, [userRole, open]);

  // Live-update nav when deck customize / persona prefs change (no reopen needed)
  useEffect(() => {
    const bump = () => setPrefsTick((t) => t + 1);
    window.addEventListener("homeos-deck-prefs-change", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("homeos-deck-prefs-change", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl, userEmail]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /** SPA navigate; leave cmd/ctrl/middle-click free for real /app/* URLs */
  const navTo = (tab: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleSpaClick(e)) return;
    e.preventDefault();
    onTabChange(tab);
    setOpen(false);
    setLogoMenu(null);
  };

  const goWebsiteHome = (e?: React.MouseEvent) => {
    if (e && !shouldHandleSpaClick(e as React.MouseEvent<HTMLAnchorElement>)) return;
    e?.preventDefault();
    setLogoMenu(null);
    setOpen(false);
    if (onWebsiteHome) {
      onWebsiteHome();
      return;
    }
    window.location.assign(MARKETING_PATH.home);
  };

  const goCommandDeck = (e?: React.MouseEvent) => {
    if (e && !shouldHandleSpaClick(e as React.MouseEvent<HTMLAnchorElement>)) return;
    e?.preventDefault();
    setLogoMenu(null);
    setOpen(false);
    onTabChange("dashboard");
  };

  // Close logo menu on outside click / Escape
  useEffect(() => {
    if (!logoMenu) return;
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (logoMenuRef.current && !logoMenuRef.current.contains(t)) {
        setLogoMenu(null);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setLogoMenu(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [logoMenu]);

  const LogoMenu = ({
    align = "left",
  }: {
    align?: "left" | "right";
  }) => (
    <div
      role="menu"
      className={`absolute top-full mt-1.5 z-[60] min-w-[11.5rem] rounded-xl border border-[#1F1F23] bg-[#0A0A0C] shadow-2xl py-1 overflow-hidden ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <a
        role="menuitem"
        href={APP_PATH.dashboard}
        onClick={goCommandDeck}
        className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-bold text-white hover:bg-white/10 transition-colors"
      >
        <LayoutDashboard className="w-3.5 h-3.5 text-white/60 shrink-0" />
        Command Deck
      </a>
      <a
        role="menuitem"
        href={MARKETING_PATH.home}
        onClick={goWebsiteHome}
        className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-bold text-white hover:bg-white/10 transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-white/60 shrink-0" />
        Website home
      </a>
    </div>
  );

  /** Brand control: click mark → deck if elsewhere, website if already on deck; caret opens both */
  const BrandHome = ({
    size = 28,
    menuId,
    className = "",
  }: {
    size?: number;
    menuId: "mobile" | "drawer" | "desktop";
    className?: string;
  }) => {
    const menuOpen = logoMenu === menuId;
    const onDeck = activeTab === "dashboard";

    const primaryClick = (e: React.MouseEvent) => {
      // Caret area is a separate button; this is the logo body
      e.preventDefault();
      if (onDeck) {
        goWebsiteHome();
      } else {
        goCommandDeck();
      }
    };

    return (
      <div
        ref={menuOpen ? logoMenuRef : undefined}
        className={`relative flex items-center min-w-0 ${className}`}
      >
        <button
          type="button"
          onClick={primaryClick}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
          title={
            onDeck
              ? "Go to website home (or open menu for Command Deck)"
              : "Go to Command Deck (or open menu for website home)"
          }
          aria-label={onDeck ? "Go to website home" : "Go to Command Deck"}
        >
          <BrandMark size={size} className="shrink-0" />
          <div className="min-w-0 flex flex-col justify-center gap-0.5">
            <span className="text-sm lg:text-[15px] font-black text-white tracking-tight leading-none">
              HomeOS
            </span>
            {workspaceName ? (
              <span className="text-[10px] lg:text-[11px] font-medium text-white/45 truncate block leading-none">
                {workspaceName}
              </span>
            ) : null}
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLogoMenu((cur) => (cur === menuId ? null : menuId));
          }}
          className="shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
          aria-label="Home destinations"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Command Deck or website home"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>
        {menuOpen && <LogoMenu />}
      </div>
    );
  };

  const displayName = resolveDisplayName(userName, userEmail) || null;
  const initials = initialsFromUser(userName, userEmail);
  const photo = !imgFailed ? resolveAvatarUrl(userEmail, avatarUrl, 96) : null;

  const Avatar = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const cls = size === "sm" ? "w-8 h-8 text-[10px]" : "w-9 h-9 text-xs";
    if (photo) {
      return (
        <img
          src={photo}
          alt=""
          className={`${cls} rounded-full object-cover border border-white/20 shrink-0 bg-white/10`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      );
    }
    return (
      <div
        className={`${cls} rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-black shrink-0`}
        aria-hidden
      >
        {initials}
      </div>
    );
  };

  const renderNavItem = (item: (typeof APP_NAV)[number], dense?: boolean) => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    const href = APP_PATH[item.id as AppTab] || pathForAppTab(item.id);
    return (
      <a
        key={item.id}
        href={href}
        onClick={(e) => navTo(item.id, e)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-xl font-bold transition-colors w-full ${
          dense
            ? "px-3 py-3 text-sm min-h-[48px]"
            : "px-2.5 py-2 text-[11px] leading-tight min-h-[36px]"
        } ${
          active
            ? "bg-white text-black shadow-sm"
            : "text-[#8E8E93] hover:text-white hover:bg-[#121215]"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-90" />
        <span className="truncate">{item.label}</span>
      </a>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-xl border-b border-[#1F1F23] safe-top">
        <div className="flex items-center justify-between gap-2 px-3 h-14">
          <BrandHome size={28} menuId="mobile" className="flex-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <Avatar size="sm" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="p-2.5 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 scrollbar-none -mt-0.5">
          {quickItems.map((item) => {
            if (!item) return null;
            const Icon = item.icon;
            const active = activeTab === item.id;
            const href = isAppTab(item.id)
              ? APP_PATH[item.id]
              : pathForAppTab(item.id);
            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => navTo(item.id, e)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all min-h-[36px] ${
                  active
                    ? "bg-white text-black"
                    : "bg-[#121215] text-[#8E8E93] border border-[#1F1F23]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.short}
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 bg-[#121215] text-[#8E8E93] border border-[#1F1F23] min-h-[36px]"
          >
            More
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative ml-auto w-[min(100%,20rem)] h-full bg-[#0A0A0C] border-l border-[#1F1F23] flex flex-col animate-fadeInUp shadow-2xl safe-bottom">
            <div className="flex items-center justify-between gap-2 p-4 border-b border-[#1F1F23]">
              <BrandHome size={32} menuId="drawer" className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2.5 rounded-xl text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-3 mt-3 p-3 bg-[#121215] rounded-xl border border-[#1F1F23] flex items-center gap-3">
              <Avatar size="md" />
              <div className="min-w-0">
                <div className="text-sm font-black text-white truncate">
                  {displayName || workspaceName || "Your vault"}
                </div>
                <div className="text-[10px] text-[#8E8E93] font-bold tracking-wide mt-0.5">
                  {roleTitle(userRole)}
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4" aria-label="Main">
              {groups.map(({ group, items }) => (
                <div key={group.id}>
                  <p className="px-3 mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => renderNavItem(item, true))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-[#1F1F23] space-y-1">
              <a
                href={APP_PATH.legal}
                onClick={(e) => navTo("legal", e)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-[#8E8E93] hover:text-white hover:bg-white/5 min-h-[48px]"
              >
                <ShieldCheck className="w-4 h-4" />
                Privacy and Terms
              </a>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 min-h-[48px]"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/*
        Desktop sidebar: participates in the h-dvh flex row (not position:fixed).
        Parent shell does not scroll — only main does — so the rail stays put.
        Header + profile + footer are fixed height; nav alone scrolls if needed.
      */}
      <aside
        className="hidden lg:flex w-[15.5rem] xl:w-64 shrink-0 flex-col h-full min-h-0 bg-[#0A0A0C] border-r border-[#1F1F23] z-20"
        aria-label="Workspace navigation"
      >
        {/* Brand — logo → Command Deck or website home */}
        <div className="shrink-0 px-3 pt-4 pb-3 border-b border-[#1F1F23]">
          <BrandHome size={30} menuId="desktop" className="w-full" />
        </div>

        {/* Profile chip */}
        <div className="shrink-0 px-3 pt-3 pb-2">
          <div className="px-2.5 py-2.5 rounded-xl bg-[#121215] border border-[#1F1F23] flex items-center gap-2.5">
            <Avatar size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-white truncate leading-tight">
                {displayName || workspaceName || "Your vault"}
              </div>
              <div className="text-[10px] text-[#8E8E93] font-medium truncate mt-0.5 leading-tight">
                {roleTitle(userRole)}
              </div>
              <div className="text-[9px] text-white/35 font-bold truncate mt-0.5 leading-tight">
                {personaLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable nav only */}
        <nav
          className="flex-1 min-h-0 px-2.5 pb-2 flex flex-col gap-3 overflow-y-auto overscroll-contain scrollbar-none"
          aria-label="Main"
        >
          {groups.map(({ group, items }) => (
            <div key={group.id} className="shrink-0">
              <p className="px-2.5 mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/28">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer actions — always visible */}
        <div className="shrink-0 mt-auto px-2.5 pb-3 pt-2 border-t border-[#1F1F23] space-y-0.5">
          <a
            href={APP_PATH.legal}
            onClick={(e) => navTo("legal", e)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-bold text-[#8E8E93] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Privacy and Terms
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

