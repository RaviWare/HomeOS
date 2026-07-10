import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Cloud,
  Database,
  Home,
  Key,
  Lock,
  Scale,
  Sparkles,
  Wrench,
} from "lucide-react";
import { UserRole } from "../types";
import { BrandMark } from "./BrandLogo";
import {
  CATEGORY_FLOW,
  PERSONAS,
  type PersonaId,
  personaForRole,
  roleTitle,
} from "../userPersonas";
import {
  applyPersonaDeckDefaults,
  loadDeckPrefs,
  saveDeckPrefs,
} from "./deckPrefs";
import { upsertCustomRole } from "../customRoles";
import type { AppTab } from "../routing";

export type OnboardingExtras = {
  roleLabel?: string;
  customRoleId?: string;
  /** Vault data handling on finish */
  vaultData?: VaultDataChoice;
};

/** How vault records are handled when finishing setup / reconfigure */
export type VaultDataChoice = "keep" | "empty" | "sample";

export type OnboardingMode = "setup" | "reconfigure";

interface OnboardingProps {
  onComplete: (
    role: UserRole,
    workspaceName: string,
    userName: string,
    userEmail: string,
    importSample: boolean,
    security2FAEnabled?: boolean,
    extras?: OnboardingExtras
  ) => void;
  /** First-time setup vs re-run from Settings / deck (already signed in). */
  mode?: OnboardingMode;
  /** Leave wizard without wiping session (reconfigure). */
  onCancel?: () => void;
  /** First-time only: leave product (clears session from parent). */
  onBackToSite?: () => void;
  prefillName?: string;
  prefillEmail?: string;
  prefillWorkspace?: string;
  prefillRole?: UserRole;
  prefillRoleLabel?: string;
}

const CATEGORY_ICONS: Record<
  PersonaId,
  React.ComponentType<{ className?: string }>
> = {
  household: Home,
  owner: Building2,
  operator: Briefcase,
  advisor: Scale,
  field: Wrench,
};

const STEPS = [
  { n: 1, label: "You", full: "How you use HomeOS" },
  { n: 2, label: "Workspace", full: "Setup workspace" },
  { n: 3, label: "Vault", full: "Security & data" },
];

const inputClass =
  "w-full bg-[#121215] border border-[#1F1F23] focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-[#8E8E93]/60 font-semibold transition-all";

const WORKSPACE_DEFAULTS: Partial<Record<UserRole, string>> = {
  Tenant: "My Home Vault",
  Homeowner: "My Home Vault",
  "Family Member": "Our Home Vault",
  Landlord: "My Rental Book",
  "Property Owner": "Rental Business",
  "ShortStay Host": "Homestay Portfolio",
  "Property Manager": "Ops HQ",
  "Housing Society Admin": "Society Ops",
  Builder: "Project Inventory",
  "Enterprise Admin": "Business HomeOS",
  Accountant: "Client Books",
  "Legal Advisor": "Legal Desk",
  "Maintenance Vendor": "Field Jobs",
  "Government Inspector": "Inspection Desk",
  Custom: "My HomeOS",
};

function initialCategoryForRole(role?: UserRole): PersonaId {
  if (!role) return "household";
  return personaForRole(role).id;
}

export default function Onboarding({
  onComplete,
  mode = "setup",
  onCancel,
  onBackToSite,
  prefillName = "",
  prefillEmail = "",
  prefillWorkspace = "",
  prefillRole,
  prefillRoleLabel = "",
}: OnboardingProps) {
  const isReconfigure = mode === "reconfigure";
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<PersonaId>(() =>
    initialCategoryForRole(prefillRole)
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    () => prefillRole || "Tenant"
  );
  const [customTitle, setCustomTitle] = useState(prefillRoleLabel || "");
  const [useCustom, setUseCustom] = useState(!!prefillRoleLabel);
  const [workspaceName, setWorkspaceName] = useState(
    () => prefillWorkspace || WORKSPACE_DEFAULTS[prefillRole || "Tenant"] || "My Home Vault"
  );
  const [userName, setUserName] = useState(prefillName);
  const [userEmail, setUserEmail] = useState(prefillEmail);
  /** setup: empty | sample · reconfigure: keep | empty | sample */
  const [vaultData, setVaultData] = useState<VaultDataChoice>(
    isReconfigure ? "keep" : "empty"
  );
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [entering, setEntering] = useState(true);

  const category = useMemo(
    () => CATEGORY_FLOW.find((c) => c.id === selectedCategory) || CATEGORY_FLOW[0],
    [selectedCategory]
  );

  const roleMeta = useMemo(
    () =>
      category.roles.find((r) => r.role === selectedRole) || category.roles[0],
    [category, selectedRole]
  );

  const persona = useMemo(
    () => personaForRole(selectedRole),
    [selectedRole]
  );

  useEffect(() => {
    setEntering(true);
    const t = requestAnimationFrame(() => setEntering(false));
    return () => cancelAnimationFrame(t);
  }, [step, selectedCategory]);

  useEffect(() => {
    // Don't overwrite a user-typed workspace name (or prefilled custom name)
    if (isReconfigure && prefillWorkspace) return;
    const known = new Set([
      ...Object.values(WORKSPACE_DEFAULTS),
      "My HomeOS",
      ...CATEGORY_FLOW.map((c) => c.title + " vault"),
    ]);
    setWorkspaceName((current) =>
      known.has(current)
        ? WORKSPACE_DEFAULTS[selectedRole] || "My HomeOS"
        : current
    );
  }, [selectedRole, isReconfigure, prefillWorkspace]);

  const pickCategory = (id: PersonaId) => {
    setSelectedCategory(id);
    setUseCustom(false);
    const cat = CATEGORY_FLOW.find((c) => c.id === id) || CATEGORY_FLOW[0];
    setSelectedRole(cat.recommendedRole);
  };

  const progress = (step / STEPS.length) * 100;

  const validateStep2 = () => {
    if (!userName.trim()) {
      setEmailError("Enter your name.");
      return false;
    }
    const email = userEmail.trim();
    if (!email) {
      setEmailError("Email is required for your account.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !selectedRole) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }
    const activeName = userName.trim();
    const activeEmail = userEmail.trim();
    if (!activeName || !activeEmail) {
      setStep(2);
      setEmailError("Name and email are required.");
      return;
    }
    // Seed Command Deck from this category so first login feels custom-built
    const p = PERSONAS[selectedCategory] || personaForRole(selectedRole);
    let extras: OnboardingExtras | undefined;
    let roleForSession: UserRole = selectedRole;

    if (useCustom && customTitle.trim()) {
      const created = upsertCustomRole({
        title: customTitle.trim(),
        summary: `Based on ${roleTitle(selectedRole)}`,
        basePersona: p.id,
        baseRole: selectedRole,
        moduleOrder: p.modulePriority as AppTab[],
        hiddenModules: [],
        defaultDeckView: p.defaultDeckView,
      });
      roleForSession = selectedRole; // keep data model; display via label
      extras = {
        roleLabel: created.title,
        customRoleId: created.id,
      };
      applyPersonaDeckDefaults(p, {
        fullReset: true,
        hideSecondary: p.id === "field" || p.id === "operator",
      });
      const prefs = loadDeckPrefs();
      saveDeckPrefs({
        ...prefs,
        moduleOrder: created.moduleOrder,
        defaultDeckView: created.defaultDeckView,
      });
    } else {
      applyPersonaDeckDefaults(p, {
        fullReset: true,
        hideSecondary: p.id === "field" || p.id === "operator",
      });
    }

    if (
      isReconfigure &&
      (vaultData === "empty" || vaultData === "sample") &&
      !window.confirm(
        vaultData === "sample"
          ? "Replace your current vault with illustrative sample records? Your existing properties, payments, and Home Life data will be overwritten."
          : "Clear all vault records (properties, leases, payments, Home Life)? Your account stays signed in. This cannot be undone."
      )
    ) {
      return;
    }

    onComplete(
      roleForSession,
      workspaceName.trim() || "My HomeOS",
      activeName,
      activeEmail,
      vaultData === "sample",
      twoFactor,
      {
        ...extras,
        vaultData,
      }
    );
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else if (isReconfigure && onCancel) onCancel();
    else if (onBackToSite) onBackToSite();
  };

  const leaveLabel = isReconfigure
    ? "Cancel"
    : onBackToSite
      ? "Website"
      : "Back";

  return (
    <div className="min-h-screen bg-black text-[#FAFAFA] flex flex-col justify-center items-center p-4 selection:bg-white/20 mkt-grid-bg">
      {/* Soft ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] bg-white/[0.04] rounded-full blur-[120px] animate-mkt-glow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-[#8B5CF6]/[0.08] rounded-full blur-[100px] animate-mkt-glow"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Top brand strip outside card */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} className="shrink-0" />
            <span className="text-[15px] font-black text-white tracking-tight leading-none">
              HomeOS
            </span>
          </div>
          {(isReconfigure ? onCancel : onBackToSite) && (
            <button
              type="button"
              onClick={isReconfigure ? onCancel : onBackToSite}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8E8E93] hover:text-white border border-[#1F1F23] hover:border-white/20 px-3 py-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isReconfigure ? "Back to app" : "Website"}
            </button>
          )}
        </div>

        <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl shadow-2xl p-5 sm:p-7 flex flex-col gap-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1
                  id="onboard-title"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  {isReconfigure ? "Reconfigure your workspace" : "Set up your workspace"}
                </h1>
                <p className="text-xs text-[#8E8E93] mt-1.5 font-medium leading-relaxed">
                  {isReconfigure ? (
                    <>
                      Change path, role, workspace name, and deck defaults anytime.{" "}
                      <span className="text-white font-bold">Your records stay by default.</span>
                    </>
                  ) : (
                    <>
                      Start your{" "}
                      <span className="text-white font-bold">14-day free trial</span> — full access,
                      kept private.
                    </>
                  )}
                </p>
              </div>
              <div className="shrink-0 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                Free trial
              </div>
            </div>

            {/* Progress */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((s) => {
                  const active = step === s.n;
                  const done = step > s.n;
                  return (
                    <button
                      key={s.n}
                      type="button"
                      onClick={() => {
                        if (s.n < step) setStep(s.n);
                      }}
                      className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${
                        active
                          ? "text-white"
                          : done
                            ? "text-white/70 hover:text-white cursor-pointer"
                            : "text-[#8E8E93] cursor-default"
                      }`}
                      disabled={s.n > step}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                          done
                            ? "bg-white text-black border-white"
                            : active
                              ? "bg-white text-black border-white"
                              : "bg-transparent text-[#8E8E93] border-[#2E2E33]"
                        }`}
                      >
                        {done ? <Check className="w-3 h-3" /> : s.n}
                      </span>
                      <span className="hidden sm:inline">{s.full}</span>
                      <span className="sm:hidden">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="h-1 rounded-full bg-[#1F1F23] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step body */}
          <div
            key={step}
            className={`min-h-[320px] flex flex-col ${entering ? "opacity-0" : "animate-fadeInUp"}`}
          >
            {/* STEP 1 — Category → Role */}
            {step === 1 && (
              <div className="flex flex-col gap-3.5 flex-1 min-h-0">
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">
                    How will you use HomeOS?
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                    Pick the path that matches your work — we tune the Command Deck,
                    modules, and insights around it.
                  </p>
                </div>

                {/* Category chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {CATEGORY_FLOW.map((c) => {
                    const Icon = CATEGORY_ICONS[c.id] || Home;
                    const on = selectedCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCategory(c.id)}
                        className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                          on
                            ? "bg-white text-black border-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                            : "bg-[#121215] border-[#1F1F23] text-[#A1A1AA] hover:border-white/25 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[12px] font-black truncate">
                            {c.title}
                          </span>
                          {on && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                        </div>
                        <p
                          className={`text-[10px] font-medium mt-1 leading-snug line-clamp-2 ${
                            on ? "text-black/60" : "text-[#52525B]"
                          }`}
                        >
                          {c.blurb}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* What this customizes */}
                <div className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/35 mb-1.5">
                    Your deck will customize
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.customizes.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-white/70"
                      >
                        {chip}
                      </span>
                    ))}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300/90">
                      Default: {persona.defaultDeckView === "life" ? "Life OS" : persona.defaultDeckView === "graphs" ? "Trends" : "Datasets"}
                    </span>
                  </div>
                </div>

                {/* Exact role within category */}
                <div className="flex flex-col gap-1.5 flex-1 min-h-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/35 px-0.5">
                    Role · {category.title}
                  </p>
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px] pr-0.5 scrollbar-none">
                    {category.roles.map((r) => {
                      const isSel = !useCustom && selectedRole === r.role;
                      const isRec = r.role === category.recommendedRole;
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => {
                            setUseCustom(false);
                            setSelectedRole(r.role);
                          }}
                          onDoubleClick={() => {
                            setUseCustom(false);
                            setSelectedRole(r.role);
                            setStep(2);
                          }}
                          className={`group flex items-start text-left p-3 rounded-xl border transition-all ${
                            isSel
                              ? "bg-white/[0.07] border-white"
                              : "bg-[#121215]/80 border-[#1F1F23] hover:border-[#2E2E33]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-black text-white">
                                {r.title}
                              </span>
                              {isRec && (
                                <span className="text-[8px] font-black uppercase tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-1.5 py-0.5 rounded">
                                  Popular
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8E8E93] mt-0.5 leading-snug block font-medium">
                              {r.summary}
                            </span>
                          </div>
                          <div
                            className={`ml-2 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSel
                                ? "bg-white border-white text-black"
                                : "border-[#2E2E33] text-transparent"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom role */}
                  <div
                    className={`mt-1 rounded-xl border p-3 transition-all ${
                      useCustom
                        ? "border-white bg-white/[0.06]"
                        : "border-[#1F1F23] bg-[#0E0E11]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setUseCustom(true)}
                      className="w-full text-left flex items-center justify-between gap-2"
                    >
                      <span className="text-[12px] font-black text-white">
                        Create a custom role
                      </span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          useCustom
                            ? "bg-white border-white text-black"
                            : "border-[#2E2E33] text-transparent"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </span>
                    </button>
                    <p className="text-[10px] text-[#71717A] font-medium mt-1 mb-2">
                      e.g. “Parents’ flat manager” or “Co-living operator” — deck starts from the category above; rearrange modules anytime.
                    </p>
                    {useCustom && (
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Your custom role name"
                        className={inputClass + " text-[13px]"}
                        autoFocus
                        maxLength={80}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">
                    Name your vault
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                    <span className="text-white font-bold">{category.title}</span>
                    {" · "}
                    <span className="text-white/80 font-bold">{roleMeta.title}</span>
                    . Confirm your profile for this workspace.
                  </p>
                </div>

                <div className="flex flex-col gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-wider">
                      Workspace name
                    </span>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. My Rental Vault"
                      autoFocus
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-wider">
                        Your name <span className="text-[#F59E0B]">*</span>
                      </span>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => {
                          setUserName(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        className={inputClass}
                        placeholder="Your name"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-wider">
                        Email <span className="text-[#F59E0B]">*</span>
                      </span>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => {
                          setUserEmail(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        className={`${inputClass} ${emailError ? "border-red-500/50 focus:border-red-400" : ""}`}
                        placeholder="you@email.com"
                        required
                        readOnly={!!prefillEmail}
                      />
                    </label>
                  </div>
                  {emailError && (
                    <p className="text-[11px] font-bold text-red-400 -mt-1 animate-fadeIn">
                      {emailError}
                    </p>
                  )}

                  <div className="mkt-card p-3.5 flex gap-3 items-start">
                    <Cloud className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#8E8E93] leading-relaxed font-medium">
                      Your workspace lives in a{" "}
                      <span className="text-white font-bold">private vault</span> — available across
                      your devices after you finish setup.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <h2 className="text-base font-black text-white tracking-tight">
                    Security & starter data
                  </h2>
                  <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                    Choose how you want to enter HomeOS. You can change these later in Vault Settings.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTwoFactor((v) => !v)}
                    className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-all ${
                      twoFactor
                        ? "border-white/25 bg-white/[0.05]"
                        : "border-[#1F1F23] bg-[#121215]/60 hover:border-[#2E2E33]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">
                          Prefer multi-factor security
                        </span>
                        <span className="text-[11px] text-[#8E8E93] mt-0.5 block font-medium leading-relaxed">
                          Extra protection for lease renewals and financial records when 2FA is available.
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                        twoFactor ? "bg-white" : "bg-[#2E2E33]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform ${
                          twoFactor ? "translate-x-4 bg-black" : "translate-x-0 bg-[#8E8E93]"
                        }`}
                      />
                    </div>
                  </button>

                  {isReconfigure && (
                    <button
                      type="button"
                      onClick={() => setVaultData("keep")}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        vaultData === "keep"
                          ? "border-white/25 bg-white/[0.05]"
                          : "border-[#1F1F23] bg-[#121215]/60 hover:border-[#2E2E33]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          vaultData === "keep"
                            ? "bg-white border-white text-black"
                            : "border-[#2E2E33]"
                        }`}
                      >
                        {vaultData === "keep" && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block">
                            Keep my vault data
                          </span>
                          <span className="text-[11px] text-[#8E8E93] mt-0.5 block font-medium leading-relaxed">
                            Recommended. Only update role, workspace, and deck layout — records stay.
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setVaultData("sample")}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      vaultData === "sample"
                        ? "border-white/25 bg-white/[0.05]"
                        : "border-[#1F1F23] bg-[#121215]/60 hover:border-[#2E2E33]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        vaultData === "sample"
                          ? "bg-white border-white text-black"
                          : "border-[#2E2E33]"
                      }`}
                    >
                      {vaultData === "sample" && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">
                          {isReconfigure
                            ? "Replace with sample records"
                            : "Prefill illustrative records"}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] mt-0.5 block font-medium leading-relaxed">
                          {isReconfigure
                            ? "Overwrites current homes, payments, and Home Life with demo structure."
                            : "Optional starter records so charts and hubs have structure while you add your own."}
                        </span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVaultData("empty")}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      vaultData === "empty"
                        ? "border-white/25 bg-white/[0.05]"
                        : "border-[#1F1F23] bg-[#121215]/60 hover:border-[#2E2E33]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        vaultData === "empty"
                          ? "bg-white border-white text-black"
                          : "border-[#2E2E33]"
                      }`}
                    >
                      {vaultData === "empty" && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">
                          {isReconfigure ? "Clear vault & start empty" : "Start empty"}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] mt-0.5 block font-medium leading-relaxed">
                          {isReconfigure
                            ? "Wipes local records. Account stays signed in — you can re-enter real data."
                            : "Clean vault — add only your real properties, leases, and payments."}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed font-medium">
                    {isReconfigure ? (
                      <>
                        You can re-run this wizard anytime from{" "}
                        <span className="text-white font-bold">Settings → Account</span> or the
                        Command Deck help chip. Deck layout updates with your role.
                      </>
                    ) : (
                      <>
                        <span className="text-white font-bold">14-day free trial</span> includes full
                        Command Deck and Home Life access. Cancel anytime before the trial ends and
                        you won&apos;t be charged. Reconfigure later anytime from Settings.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-4 border-t border-[#1F1F23]">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-transparent border border-[#1F1F23] hover:border-[#2E2E33] hover:bg-white/[0.03] text-[#8E8E93] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? leaveLabel : "Back"}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[1.4] py-3.5 px-4 rounded-xl font-bold text-sm bg-white text-black hover:bg-[#EAEAEA] border border-white transition-all flex items-center justify-center gap-2 shadow-[0_0_0_4px_rgba(255,255,255,0.06)] active:scale-[0.98]"
            >
              {step === 3 ? (
                <>
                  {isReconfigure ? "Save & open deck" : "Launch Command Deck"}
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#8E8E93] font-medium mt-4 px-2">
          {isReconfigure
            ? "Cancel returns you to the app without saving wizard changes."
            : "By continuing you agree to the HomeOS Terms & Privacy"}
        </p>
      </div>
    </div>
  );
}
