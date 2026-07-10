import React from "react";

type Size = "sm" | "md" | "lg";

interface BrandLogoProps {
  size?: Size;
  /** Show wordmark next to mark */
  withWordmark?: boolean;
  /**
   * Optional secondary line (e.g. workspace name).
   * Do not pass "Home OS" / brand taglines — the wordmark alone is enough.
   */
  subtitle?: string;
  className?: string;
  markClassName?: string;
}

const SIZES: Record<Size, { box: string; icon: number; word: string }> = {
  sm: { box: "w-8 h-8", icon: 28, word: "text-sm" },
  md: { box: "w-9 h-9", icon: 34, word: "text-[15px] sm:text-base" },
  lg: { box: "w-11 h-11", icon: 42, word: "text-lg" },
};

/** Metallic house + C mark (transparent — no app-tile background) */
const MARK_SRC = "/brand-mark-256.png";

/**
 * HomeOS mark — silver house with open C-curve + 4-pane window.
 * Icon only (no dark rounded tile).
 */
export function BrandMark({
  size = 28,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={MARK_SRC}
      width={size}
      height={size}
      alt={title || ""}
      draggable={false}
      className={`select-none object-contain ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={title ? undefined : true}
    />
  );
}

export default function BrandLogo({
  size = "md",
  withWordmark = true,
  subtitle,
  className = "",
  markClassName = "",
}: BrandLogoProps) {
  const s = SIZES[size];
  // Ignore redundant brand subtitles that repeat HomeOS
  const cleanSub =
    subtitle &&
    !/^\s*home\s*os\s*$/i.test(subtitle.trim()) &&
    !/^\s*homeos\s*$/i.test(subtitle.trim())
      ? subtitle
      : undefined;

  return (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
      <span
        className={`${s.box} shrink-0 flex items-center justify-center ${markClassName}`}
      >
        <BrandMark size={s.icon} />
      </span>
      {withWordmark && (
        <span
          className={`min-w-0 flex flex-col justify-center ${
            cleanSub ? "gap-0.5" : ""
          }`}
        >
          <span
            className={`${s.word} font-black text-white tracking-tight leading-none block`}
          >
            HomeOS
          </span>
          {cleanSub ? (
            <span className="text-[10px] font-medium text-white/45 tracking-wide block leading-none truncate max-w-[12rem]">
              {cleanSub}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
