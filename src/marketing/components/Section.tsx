import React from "react";

interface SectionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  align?: "left" | "center";
}

export default function Section({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  id,
  align = "left",
}: SectionProps) {
  return (
    <section id={id} className={`py-8 sm:py-12 md:py-16 ${className}`}>
      <div className={`mb-6 sm:mb-8 md:mb-10 max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
        {eyebrow && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-2">
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 sm:mt-3 text-sm text-[#8E8E93] leading-relaxed font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
