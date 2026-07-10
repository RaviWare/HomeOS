import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, Settings2, X } from "lucide-react";
import {
  type CookieCategory,
  type CookiePreferences,
  CATEGORY_COPY,
  DEFAULT_PREFS,
  acceptAll,
  rejectNonEssential,
  saveCustom,
  hasConsentDecision,
  loadConsent,
} from "../../cookieConsent";
import type { MarketingPage } from "../types";

interface CookieBannerProps {
  onNavigate?: (page: MarketingPage) => void;
}

/** Compact cookie notice — corner strip, not a full takeover. */
export default function CookieBanner({ onNavigate }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<"banner" | "prefs">("banner");
  const [prefs, setPrefs] = useState<CookiePreferences>({ ...DEFAULT_PREFS });

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!hasConsentDecision()) setVisible(true);
    }, 800);

    const onOpen = () => {
      const existing = loadConsent();
      if (existing) setPrefs({ ...existing.prefs, necessary: true });
      else setPrefs({ ...DEFAULT_PREFS });
      setPanel("prefs");
      setVisible(true);
    };
    window.addEventListener("homeos-open-cookie-prefs", onOpen);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("homeos-open-cookie-prefs", onOpen);
    };
  }, []);

  const close = () => {
    setVisible(false);
    setPanel("banner");
  };

  const goPrivacy = () => {
    if (onNavigate) onNavigate("privacy");
    else window.location.pathname = "/privacy";
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {/* Prefs: small centered sheet only when needed */}
      {panel === "prefs" && (
        <motion.div
          key="prefs-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3 safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && hasConsentDecision()) close();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#1F1F23]">
              <h2 id="cookie-prefs-title" className="text-[13px] font-black text-white">
                Cookie preferences
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (hasConsentDecision()) close();
                  else setPanel("banner");
                }}
                className="w-7 h-7 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-white inline-flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 max-h-[50dvh] overflow-y-auto space-y-1.5">
              {(Object.keys(CATEGORY_COPY) as CookieCategory[]).map((key) => {
                const meta = CATEGORY_COPY[key];
                const on = prefs[key];
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-[#1F1F23] bg-[#121215] px-2.5 py-2 flex items-center gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white">{meta.title}</span>
                        {meta.required && (
                          <span className="text-[8px] font-bold uppercase text-[#6B7280]">
                            required
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] leading-snug line-clamp-2 mt-0.5">
                        {meta.body}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={meta.required}
                      onClick={() =>
                        setPrefs((p) => ({ ...p, [key]: !p[key], necessary: true }))
                      }
                      className={`shrink-0 w-9 h-5 rounded-full relative transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        on ? "bg-white" : "bg-[#2E2E33]"
                      }`}
                      role="switch"
                      aria-checked={on}
                      aria-label={meta.title}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                          on ? "left-[18px] bg-black" : "left-0.5 bg-[#8E8E93]"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-3 pb-3 pt-1 flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  saveCustom(prefs);
                  close();
                }}
                className="flex-1 h-8 rounded-lg bg-white text-black text-[11px] font-black cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  acceptAll();
                  close();
                }}
                className="h-8 px-2.5 rounded-lg border border-[#1F1F23] text-[11px] font-bold text-white cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectNonEssential();
                  close();
                }}
                className="h-8 px-2.5 rounded-lg border border-[#1F1F23] text-[11px] font-bold text-[#8E8E93] cursor-pointer"
              >
                Essential
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Default: slim corner chip */}
      {panel === "banner" && (
        <motion.div
          key="banner-chip"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="fixed z-[80] bottom-3 right-3 left-3 sm:left-auto sm:bottom-4 sm:right-4 safe-bottom"
          role="dialog"
          aria-live="polite"
          aria-labelledby="cookie-banner-title"
        >
          <div className="sm:w-[min(100%,22rem)] mx-auto sm:mx-0 bg-[#0A0A0C]/95 backdrop-blur-xl border border-[#1F1F23] rounded-xl shadow-xl px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Cookie className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <p id="cookie-banner-title" className="text-[11px] text-[#A1A1AA] leading-snug font-medium">
                  We use essential cookies. Optional ones stay off until you opt in.{" "}
                  <button
                    type="button"
                    onClick={goPrivacy}
                    className="text-white/80 font-bold underline underline-offset-2 hover:text-white cursor-pointer"
                  >
                    Privacy
                  </button>
                </p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      acceptAll();
                      close();
                    }}
                    className="h-7 px-2.5 rounded-md bg-white text-black text-[10px] font-black cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      rejectNonEssential();
                      close();
                    }}
                    className="h-7 px-2.5 rounded-md border border-[#1F1F23] text-[10px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel("prefs")}
                    className="h-7 px-2 rounded-md text-[10px] font-bold text-[#6B7280] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                    aria-label="Manage cookie preferences"
                  >
                    <Settings2 className="w-3 h-3" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
