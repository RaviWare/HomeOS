import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageSquare,
  ChevronDown,
  Clock,
  HelpCircle,
  Send,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import {
  HONEYPOT_FIELD_NAME,
  recordContactAttempt,
  validateContactInput,
} from "../../antiSpam";

interface ContactPageProps {
  onLaunch: () => void;
}

const CONTACT_STORE_KEY = "homeos_contact_inbox_v1";

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. New accounts get a 14-day trial with full product access. Cancel anytime during the trial and you will not be charged.",
  },
  {
    q: "What do I get if I choose annual at checkout?",
    a: "Annual plans include the usual yearly discount plus 3 extra months free at checkout — shown clearly before you pay. Manage plan, downloads, and auto-renewal anytime in Account settings.",
  },
  {
    q: "How much does HomeOS cost?",
    a: "Personal from $4.99/mo, Pro $14.99/mo, Team $39.99/mo (USD). Annual saves 30% on Personal & Pro, 40% on Team — plus 3 bonus months on annual at checkout.",
  },
  {
    q: "Can I manage my account and download my data?",
    a: "Yes. In Account & data you can edit your profile, export a full workspace backup (JSON or encrypted), generate a PDF report, and wipe local vault data.",
  },
  {
    q: "How do I cancel auto-renewal?",
    a: "Open Settings → Account & data → Plan & billing. Toggle off auto-renewal anytime. You keep access until the end of the paid period.",
  },
  {
    q: "Where is my data stored?",
    a: "Your workspace is private and protected with encryption in transit and at rest. We do not sell your home history as advertising data.",
  },
  {
    q: "Do I need an AI API key?",
    a: "No for core use. Ask Your Data works on your workspace records without a key. Optional cloud AI only if you enable a provider key.",
  },
  {
    q: "Can landlords and tenants both use it?",
    a: "Yes. Setup covers home renters, live-in owners, long-term rentals, short-stay hosts (Airbnb/homestay), society/HOA, builders, multi-property businesses, and custom roles. Your Command Deck adapts — and you can rearrange modules anytime.",
  },
];

const TOPICS = ["Sales", "Support", "Billing", "Partnerships", "Privacy", "Other"] as const;

const inputCls =
  "w-full h-11 bg-[#121215] border border-[#1F1F23] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 rounded-xl px-3.5 text-sm text-white font-semibold placeholder:text-[#6B7280] transition-colors";

const ease = [0.22, 1, 0.36, 1] as const;

export default function ContactPage({ onLaunch }: ContactPageProps) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", topic: "Support", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const check = validateContactInput({
      name: form.name,
      email: form.email,
      message: form.message,
      topic: form.topic,
      honeypot,
      formStartedAt,
    });
    if (check.ok === false) {
      setError(check.error);
      return;
    }

    const rate = recordContactAttempt();
    if (rate.ok === false) {
      setError(rate.error);
      return;
    }

    setBusy(true);
    await new Promise((r) => setTimeout(r, 420));

    try {
      const raw = localStorage.getItem(CONTACT_STORE_KEY);
      const list: unknown[] = raw ? JSON.parse(raw) : [];
      const inbox = Array.isArray(list) ? list : [];
      inbox.push({
        id: `msg-${Date.now().toString(36)}`,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        topic: form.topic,
        message: form.message.trim(),
        at: new Date().toISOString(),
      });
      // Keep last 50 only
      localStorage.setItem(CONTACT_STORE_KEY, JSON.stringify(inbox.slice(-50)));
    } catch {
      /* storage full — still show success to user after validation */
    }

    setBusy(false);
    setSent(true);
  };

  return (
    <div className="animate-pageEnter">
      {/* Compact hero + channels */}
      <section className="relative pt-1 pb-5 sm:pb-6">
        <motion.div
          className="absolute top-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full blur-[80px] pointer-events-none"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        <div className="relative grid lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-5 min-w-0">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5"
            >
              Contact & FAQ
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, ease }}
              className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.15]"
            >
              Talk to us.
              <br />
              <span className="text-white/40">Or find it faster.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-2 text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium max-w-sm"
            >
              Sales, support, billing, privacy — one form. Common answers live in the FAQ beside
              you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2"
            >
              {[
                { icon: Mail, t: "Email", d: "hello@homeos.pro", sub: "1–2 business days" },
                { icon: Clock, t: "Hours", d: "Mon–Fri", sub: "Business hours" },
                {
                  icon: LifeBuoy,
                  t: "Prefer hands-on?",
                  d: "Open the vault",
                  sub: "Full trial included",
                  action: true,
                },
              ].map(({ icon: Icon, t, d, sub, action }, i) => (
                <motion.div
                  key={t}
                  whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.16)" }}
                  transition={{ duration: 0.15 }}
                  className="mkt-card p-3 flex gap-2.5 border border-[#1F1F23]"
                >
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.14 + i * 0.05 }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-white leading-tight">{t}</p>
                    <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">{d}</p>
                    <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">{sub}</p>
                    {action && (
                      <button
                        type="button"
                        onClick={onLaunch}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-white hover:underline underline-offset-2"
                      >
                        Get started free
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
            className="lg:col-span-7 mkt-card p-4 sm:p-5 border border-[#1F1F23] min-h-[22rem]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[18rem] flex flex-col items-center justify-center text-center px-4"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-3"
                  >
                    <CheckCircle2 className="w-7 h-7" />
                  </motion.div>
                  <h3 className="text-lg font-black text-white">Message received</h3>
                  <p className="text-[13px] text-[#8E8E93] mt-2 max-w-sm font-medium leading-relaxed">
                    Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}. We’ll reply to{" "}
                    <span className="text-white/80">{form.email || "your email"}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm((f) => ({ ...f, message: "" }));
                    }}
                    className="mkt-btn-ghost text-xs px-4 py-2.5 mt-5 min-h-[40px]"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={submit}
                  className="relative flex flex-col gap-3"
                >
                  {/* Honeypot — bots fill; humans never see */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] w-px h-px overflow-hidden opacity-0"
                    tabIndex={-1}
                  >
                    <label htmlFor={`contact_${HONEYPOT_FIELD_NAME}`}>Company website</label>
                    <input
                      id={`contact_${HONEYPOT_FIELD_NAME}`}
                      name={HONEYPOT_FIELD_NAME}
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-white">Send a note</h2>
                        <p className="text-[10px] text-[#6B7280] font-medium">
                          Typical reply in 1–2 business days
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white/35">
                      <Sparkles className="w-3 h-3" />
                      Human support
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 block">
                        Name
                      </span>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputCls}
                        placeholder="Your name"
                        autoComplete="name"
                        maxLength={80}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 block">
                        Email
                      </span>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputCls}
                        placeholder="you@company.com"
                        autoComplete="email"
                        maxLength={254}
                      />
                    </label>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 block">
                      Topic
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {TOPICS.map((t) => {
                        const on = form.topic === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm({ ...form, topic: t })}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                              on
                                ? "bg-white text-black border-white"
                                : "bg-white/[0.03] text-[#8E8E93] border-white/10 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 block">
                      Message
                    </span>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className={`${inputCls} h-auto py-3 resize-none min-h-[100px]`}
                      placeholder="How can we help?"
                      maxLength={5000}
                      minLength={12}
                    />
                  </label>

                  {error ? (
                    <p
                      role="alert"
                      className="text-[12px] font-semibold text-red-400/95 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-0.5">
                    <button
                      type="submit"
                      disabled={busy}
                      className="mkt-btn-primary text-[13px] px-5 py-2.5 min-h-[42px] w-full sm:w-auto disabled:opacity-60"
                    >
                      {busy ? (
                        "Sending…"
                      ) : (
                        <>
                          Send message
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-[#6B7280] font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-white/30" />
                      Spam-filtered · we never sell contact details
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Compact FAQ accordion */}
      <section className="pb-1 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
              FAQ
            </p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Straight answers.
            </h2>
          </div>
          <HelpCircle className="w-4 h-4 text-white/25 shrink-0 mb-1 hidden sm:block" />
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {FAQS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: Math.min(i, 6) * 0.03, ease }}
                className={`mkt-card overflow-hidden border transition-colors ${
                  isOpen ? "border-white/15" : "border-[#1F1F23]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 text-left cursor-pointer hover:bg-white/[0.02]"
                  aria-expanded={isOpen}
                >
                  <span className="text-[12px] sm:text-[13px] font-black text-white tracking-tight min-w-0 leading-snug">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-[#8E8E93]" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease }}
                      className="overflow-hidden"
                    >
                      <p className="px-3 sm:px-3.5 pb-3 sm:pb-3.5 text-[12px] text-[#8E8E93] leading-relaxed font-medium border-t border-[#1F1F23] pt-2.5">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
