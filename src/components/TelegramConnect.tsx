import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Unlink,
  Bot,
  ShieldCheck,
  Database,
  Send,
} from "lucide-react";
import {
  createTelegramLink,
  loadTelegramLink,
  refreshTelegramStatus,
  syncTelegramSnapshot,
  telegramDeepLink,
  unlinkTelegram,
  type TelegramLinkState,
} from "../telegramBridge";
import { Lease, Property, Transaction, MaintenanceTicket } from "../types";

interface TelegramConnectProps {
  workspaceName: string;
  userName: string;
  userRole: string;
  properties: Property[];
  leases: Lease[];
  transactions: Transaction[];
  tickets: MaintenanceTicket[];
  /** compact = smaller card for settings; full = with setup guide */
  variant?: "full" | "compact";
}

export default function TelegramConnect({
  workspaceName,
  userName,
  userRole,
  properties,
  leases,
  transactions,
  tickets,
  variant = "full",
}: TelegramConnectProps) {
  const [tg, setTg] = useState<TelegramLinkState | null>(() => loadTelegramLink());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const snapshot = () => ({
    workspaceName,
    userName: userName || "User",
    role: userRole,
    properties,
    leases,
    transactions,
    tickets,
  });

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 4000);
  };

  useEffect(() => {
    if (!tg?.token) return;
    refreshTelegramStatus(tg.token).then((st) => {
      if (st) setTg(st);
    });
  }, []);

  const connect = async () => {
    setBusy(true);
    const res = await createTelegramLink(snapshot());
    setBusy(false);
    if (!res.ok || !res.state) {
      flash(res.error || "Could not create link");
      return;
    }
    setTg(res.state);
    flash("Link ready — open Telegram and tap Start");
  };

  const resync = async () => {
    if (!tg?.token) return;
    setBusy(true);
    const res = await syncTelegramSnapshot(tg.token, snapshot());
    setBusy(false);
    if (res.ok) {
      const st = await refreshTelegramStatus(tg.token);
      if (st) setTg(st);
      flash("Vault synced to Telegram");
    } else flash(res.error || "Sync failed");
  };

  const poll = async () => {
    if (!tg?.token) return;
    setBusy(true);
    const st = await refreshTelegramStatus(tg.token);
    setBusy(false);
    if (st) setTg(st);
    flash(st?.linked ? "Telegram linked successfully" : "Still waiting for /start in Telegram");
  };

  const deepLink = tg ? telegramDeepLink(tg.botUsername, tg.code) : "";

  const copyLink = async () => {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      flash("Copy failed");
    }
  };

  const steps = [
    {
      n: "1",
      icon: Bot,
      t: "Create a bot (one-time, for your HomeOS host)",
      d: "Open Telegram → search @BotFather → /newbot → copy the token. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME in your server .env, then restart npm run dev.",
    },
    {
      n: "2",
      icon: Link2,
      t: "Generate a personal link",
      d: "Tap “Connect Telegram” below. HomeOS uploads an encrypted-session snapshot of your vault and gives you a one-time code.",
    },
    {
      n: "3",
      icon: Send,
      t: "Open the bot and tap Start",
      d: "Use Open in Telegram. The bot receives /start CODE and links this chat to your vault.",
    },
    {
      n: "4",
      icon: Database,
      t: "Ask questions anytime",
      d: "Message things like “pending payments”, “rent 2024”, or “how many homes”. After you change data in the app, tap Sync vault so answers stay current.",
    },
  ];

  return (
    <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0088cc]/15 border border-[#0088cc]/30 rounded-xl text-[#29b6f6]">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white tracking-tight">Telegram vault access</h4>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
              Query your HomeOS data from chat — not stored in the Command Deck UI.
            </p>
          </div>
        </div>
        {msg && (
          <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-1 rounded-lg shrink-0">
            {msg}
          </span>
        )}
      </div>

      {variant === "full" && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="flex gap-2.5 p-3 rounded-xl bg-[#121215]/60 border border-[#1F1F23]"
              >
                <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center text-[10px] font-black shrink-0">
                  {s.n}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3 h-3 text-white/70 shrink-0" />
                    <span className="text-[11px] font-black text-white">{s.t}</span>
                  </div>
                  <p className="text-[10px] text-[#8E8E93] leading-relaxed font-medium">{s.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20">
        <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#8E8E93] leading-relaxed font-medium">
          Only people who open <strong className="text-white">your</strong> link can attach a chat.
          Unlink anytime. Sync pushes the latest properties, leases, payments, and tickets to the bot
          session.
        </p>
      </div>

      {!tg ? (
        <button
          type="button"
          disabled={busy}
          onClick={connect}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black text-sm font-bold min-h-[48px] disabled:opacity-60 w-full sm:w-auto"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Connect Telegram
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-xl border border-[#1F1F23] bg-[#121215]/60">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Connection</span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  tg.linked
                    ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30"
                    : "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
                }`}
              >
                {tg.linked ? "Linked" : "Awaiting /start"}
              </span>
            </div>
            {tg.username && <p className="text-xs font-bold text-white mb-1">@{tg.username}</p>}
            <p className="text-[11px] text-[#8E8E93] font-mono">Code: {tg.code}</p>
            {tg.lastSyncAt && (
              <p className="text-[10px] text-[#8E8E93] mt-1">
                Last sync: {new Date(tg.lastSyncAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white text-black text-xs font-bold min-h-[44px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Telegram
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#1F1F23] text-xs font-bold text-white min-h-[44px]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={resync}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#1F1F23] text-xs font-bold text-white min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
              Sync vault
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={poll}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#1F1F23] text-xs font-bold text-white min-h-[44px]"
            >
              Check status
            </button>
            <button
              type="button"
              onClick={async () => {
                if (tg.token) await unlinkTelegram(tg.token);
                setTg(null);
                flash("Telegram unlinked");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-500/30 text-xs font-bold text-red-400 min-h-[44px]"
            >
              <Unlink className="w-3.5 h-3.5" />
              Unlink
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
