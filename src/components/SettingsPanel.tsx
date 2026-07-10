import React, { useEffect, useState } from "react";
import {
  Shield,
  Key,
  Trash2,
  HardDrive,
  Activity,
  CheckCircle2,
  RefreshCw,
  Bell,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Monitor,
  LogOut,
  Lock,
  ShieldCheck,
  ExternalLink,
  Copy,
  Download,
} from "lucide-react";
import { UserSession, Property, Lease, Transaction, MaintenanceTicket } from "../types";
import AccountData from "./AccountData";
import TelegramConnect from "./TelegramConnect";
import {
  estimateLocalStorageBytes,
  formatBytes,
  formatSessionWhen,
  listDeviceSessions,
  revokeDeviceSession,
  revokeOtherSessions,
  touchDeviceSession,
  type DeviceSession,
} from "../sessionAudit";
import {
  clearVaultPassphrase,
  generateRecoveryCodes,
  hasRecoveryCodes,
  hasVaultPassphrase,
  lockVaultSession,
  recoveryCodesMeta,
  setVaultPassphrase,
  verifyVaultPassphrase,
} from "../vaultSecurity";
import { encryptText } from "../crypto";

const HAS_CLERK = Boolean(
  typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env
      ?.VITE_CLERK_PUBLISHABLE_KEY
);

interface SettingsPanelProps {
  session: UserSession;
  onUpdateSession: (updated: UserSession) => void;
  onWipeData: () => void;
  onReconfigureWorkspace?: () => void;
  properties?: Property[];
  leases?: Lease[];
  transactions?: Transaction[];
  tickets?: MaintenanceTicket[];
}

export default function SettingsPanel({
  session,
  onUpdateSession,
  onWipeData,
  onReconfigureWorkspace,
  properties = [],
  leases = [],
  transactions = [],
  tickets = [],
}: SettingsPanelProps) {
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [passInput, setPassInput] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [unlockInput, setUnlockInput] = useState("");
  const [secBusy, setSecBusy] = useState(false);
  const [storage, setStorage] = useState(() => estimateLocalStorageBytes());
  const codesMeta = recoveryCodesMeta();
  const vaultPassSet = hasVaultPassphrase();

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSessionsLoading(true);
      try {
        const list = await touchDeviceSession();
        if (!cancelled) setSessions(list);
      } catch {
        if (!cancelled) setSessions(listDeviceSessions());
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
      if (!cancelled) setStorage(estimateLocalStorageBytes());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const storagePct = Math.min(
    100,
    Math.round((storage.used / Math.max(1, storage.quota)) * 100)
  );

  const openClerkSecurity = () => {
    try {
      const clerk = (
        window as unknown as {
          Clerk?: { openUserProfile?: (opts?: { appearance?: unknown }) => void };
        }
      ).Clerk;
      if (clerk?.openUserProfile) {
        clerk.openUserProfile();
        triggerSuccess("Opened Clerk account security (MFA, password, devices).");
        return;
      }
    } catch {
      /* fall through */
    }
    triggerSuccess(
      "Clerk profile unavailable in this session. Sign in with Clerk and enable MFA under Account security."
    );
  };

  const onGenerateCodes = async () => {
    setSecBusy(true);
    try {
      const codes = await generateRecoveryCodes();
      setBackupCodes(codes);
      triggerSuccess("Recovery codes generated — store them offline. Shown once.");
    } catch {
      triggerSuccess("Could not generate codes (Web Crypto required).");
    } finally {
      setSecBusy(false);
    }
  };

  const downloadCodes = () => {
    if (!backupCodes.length) return;
    const body = [
      "HomeOS recovery codes",
      `Generated: ${new Date().toISOString()}`,
      `Account: ${session.userEmail || session.userName}`,
      "",
      ...backupCodes,
      "",
      "Each code works once. Keep offline.",
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homeos-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCodes = async () => {
    if (!backupCodes.length) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      triggerSuccess("Codes copied to clipboard.");
    } catch {
      triggerSuccess("Could not copy — download the file instead.");
    }
  };

  const savePassphrase = async () => {
    if (passInput.length < 8) {
      triggerSuccess("Passphrase must be at least 8 characters.");
      return;
    }
    if (passInput !== passConfirm) {
      triggerSuccess("Passphrase and confirmation do not match.");
      return;
    }
    setSecBusy(true);
    try {
      await setVaultPassphrase(passInput);
      setPassInput("");
      setPassConfirm("");
      onUpdateSession({ ...session, e2eEncryptionEnabled: true });
      triggerSuccess("Vault passphrase set. Encrypted exports use AES-256-GCM (Web Crypto).");
    } catch (e) {
      triggerSuccess(e instanceof Error ? e.message : "Could not set passphrase.");
    } finally {
      setSecBusy(false);
    }
  };

  const unlockVault = async () => {
    setSecBusy(true);
    try {
      const ok = await verifyVaultPassphrase(unlockInput);
      setUnlockInput("");
      triggerSuccess(ok ? "Vault unlocked for this browser session." : "Incorrect passphrase.");
    } finally {
      setSecBusy(false);
    }
  };

  const testEncrypt = async () => {
    if (!passInput && !vaultPassSet) {
      triggerSuccess("Set a passphrase first to test encryption.");
      return;
    }
    setSecBusy(true);
    try {
      const pass = passInput || unlockInput;
      if (!pass) {
        triggerSuccess("Enter passphrase to run encryption self-test.");
        return;
      }
      const sample = JSON.stringify({ ping: "HomeOS", t: Date.now() });
      const env = await encryptText(sample, pass);
      if (!env.includes("AES-GCM")) throw new Error("bad envelope");
      triggerSuccess("Encryption self-test OK — AES-256-GCM + PBKDF2 (Web Crypto API).");
    } catch {
      triggerSuccess("Encryption self-test failed in this browser.");
    } finally {
      setSecBusy(false);
    }
  };

  const panel =
    "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-4 sm:p-5 flex flex-col gap-3";

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto pb-24 safe-bottom">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="border-b border-[#1F1F23] pb-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Vault Settings</h2>
          <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
            Account, cryptography (Web Crypto), sessions, and workspace controls.
          </p>
        </div>

        {onReconfigureWorkspace && (
          <div className="bg-[#0A0A0C] border border-white/12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-emerald-500/[0.05]" />
            <div className="relative flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">
                  Workspace setup
                </p>
                <h3 className="text-sm font-black text-white tracking-tight">
                  Reconfigure dashboard &amp; role
                </h3>
                <p className="text-[11px] text-[#8E8E93] font-medium mt-1 leading-relaxed">
                  Re-run setup: path, role, workspace, deck defaults. Data kept unless you choose
                  otherwise.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onReconfigureWorkspace}
              className="relative h-11 px-4 rounded-xl bg-white text-black text-[12px] font-black inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open setup wizard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <AccountData
          session={session}
          onUpdateSession={onUpdateSession}
          onReconfigureWorkspace={onReconfigureWorkspace}
        />

        <TelegramConnect
          workspaceName={session.workspaceName}
          userName={session.userName}
          userRole={session.role}
          properties={properties}
          leases={leases}
          transactions={transactions}
          tickets={tickets}
          variant="full"
        />

        {successMsg && (
          <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Cryptography & MFA (real Web Crypto + Clerk) ── */}
        <section className={panel}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white/70" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Vault Cryptography &amp; MFA
            </h4>
          </div>
          <p className="text-[11px] text-[#8E8E93] font-medium leading-relaxed -mt-1">
            Built on open web standards:{" "}
            <span className="text-white/70">Web Crypto API</span> (AES-256-GCM, PBKDF2, SHA-256).
            Account MFA is managed via{" "}
            <span className="text-white/70">Clerk</span> when auth is connected.
          </p>

          {/* E2E / passphrase */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3.5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-black text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Encrypted backups &amp; vault passphrase
                </p>
                <p className="text-[10px] text-[#71717A] font-medium mt-1 leading-snug">
                  {vaultPassSet
                    ? "Passphrase is set. Use it for encrypted JSON backups (Account → export)."
                    : "Set a passphrase to enable AES-GCM protected exports and session lock."}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer">
                <span className="text-[10px] font-bold text-[#8E8E93]">Prefer E2E export</span>
                <input
                  type="checkbox"
                  checked={session.e2eEncryptionEnabled}
                  onChange={(e) => {
                    onUpdateSession({ ...session, e2eEncryptionEnabled: e.target.checked });
                    triggerSuccess(
                      e.target.checked
                        ? "Encrypted export preferred — use Account → encrypted backup."
                        : "Encrypted export preference off."
                    );
                  }}
                  className="w-4 h-4 accent-white"
                />
              </label>
            </div>

            {!vaultPassSet ? (
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New passphrase (8+ chars)"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="h-10 rounded-xl bg-black/40 border border-[#1F1F23] px-3 text-xs text-white font-semibold"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm passphrase"
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                  className="h-10 rounded-xl bg-black/40 border border-[#1F1F23] px-3 text-xs text-white font-semibold"
                />
                <button
                  type="button"
                  disabled={secBusy}
                  onClick={savePassphrase}
                  className="sm:col-span-2 h-10 rounded-xl bg-white text-black text-[11px] font-black cursor-pointer disabled:opacity-50"
                >
                  Set vault passphrase
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Unlock this session"
                  value={unlockInput}
                  onChange={(e) => setUnlockInput(e.target.value)}
                  className="h-10 flex-1 rounded-xl bg-black/40 border border-[#1F1F23] px-3 text-xs text-white font-semibold"
                />
                <button
                  type="button"
                  disabled={secBusy}
                  onClick={unlockVault}
                  className="h-10 px-3 rounded-xl border border-white/15 text-[11px] font-bold text-white cursor-pointer"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    lockVaultSession();
                    triggerSuccess("Vault locked for this session.");
                  }}
                  className="h-10 px-3 rounded-xl border border-[#1F1F23] text-[11px] font-bold text-[#8E8E93] cursor-pointer"
                >
                  Lock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Remove vault passphrase? Encrypted backups will still need the old phrase to decrypt."
                      )
                    ) {
                      clearVaultPassphrase();
                      triggerSuccess("Vault passphrase cleared.");
                    }
                  }}
                  className="h-10 px-3 rounded-xl border border-red-500/30 text-[11px] font-bold text-red-300 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={secBusy}
              onClick={testEncrypt}
              className="text-[10px] font-bold text-white/50 hover:text-white text-left cursor-pointer"
            >
              Run encryption self-test (Web Crypto)
            </button>
          </div>

          {/* MFA */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3.5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-black text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Multi-factor authentication
                </p>
                <p className="text-[10px] text-[#71717A] font-medium mt-1 leading-snug">
                  {HAS_CLERK
                    ? "Enable TOTP / SMS MFA in your Clerk account security profile. HomeOS respects that sign-in."
                    : "Connect Clerk (VITE_CLERK_PUBLISHABLE_KEY) for production MFA, or use recovery codes below for vault recovery hygiene."}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer">
                <span className="text-[10px] font-bold text-[#8E8E93]">MFA preferred</span>
                <input
                  type="checkbox"
                  checked={session.security2FAEnabled}
                  onChange={(e) => {
                    onUpdateSession({ ...session, security2FAEnabled: e.target.checked });
                    triggerSuccess(
                      e.target.checked
                        ? "MFA preferred — complete setup in Clerk security if available."
                        : "MFA preference off."
                    );
                  }}
                  className="w-4 h-4 accent-white"
                />
              </label>
            </div>
            {HAS_CLERK && (
              <button
                type="button"
                onClick={openClerkSecurity}
                className="h-10 px-3 rounded-xl bg-white text-black text-[11px] font-black inline-flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              >
                Manage MFA in Clerk
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#1F1F23] bg-[#121215]">
            <div>
              <p className="text-[12px] font-black text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                In-app dues &amp; reminders
              </p>
              <p className="text-[10px] text-[#71717A] font-medium mt-0.5">
                Surfaces due items on the Command Deck. Push delivery is preference-only today.
              </p>
            </div>
            <input
              type="checkbox"
              checked={session.notificationsEnabled}
              onChange={(e) => {
                onUpdateSession({ ...session, notificationsEnabled: e.target.checked });
                triggerSuccess("Notification preference saved.");
              }}
              className="w-4 h-4 accent-white"
            />
          </div>
        </section>

        {/* ── Device sessions (real) ── */}
        <section className={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/70" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Device log &amp; sessions
              </h4>
            </div>
            <button
              type="button"
              onClick={async () => {
                setSessions(await touchDeviceSession());
                triggerSuccess("Session list refreshed.");
              }}
              className="text-[10px] font-bold text-white/50 hover:text-white inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <p className="text-[11px] text-[#8E8E93] font-medium leading-relaxed -mt-1">
            Live sessions for this vault (browser fingerprint + last active). IP/place via open{" "}
            <span className="text-white/60">geojs.io</span> when network allows — not mock data.
          </p>

          {sessionsLoading ? (
            <p className="text-[11px] text-[#71717A] font-medium py-4">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-[11px] text-[#71717A] font-medium py-4">No sessions recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${
                    s.current
                      ? "border-white/20 bg-white/[0.04]"
                      : "border-[#1F1F23] bg-[#121215]"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Monitor className="w-4 h-4 text-white/45 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-white flex flex-wrap items-center gap-1.5">
                        {s.device}
                        {s.current && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-1.5 py-0.5 rounded-md">
                            This device
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5">
                        {s.location}
                        {s.ip ? ` · ${s.ip}` : ""} · active {formatSessionWhen(s.lastActiveAt)}
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessions(revokeDeviceSession(s.id));
                        triggerSuccess("Session revoked on this vault.");
                      }}
                      className="h-8 px-2.5 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-red-300/90 hover:border-red-400/40 cursor-pointer shrink-0"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (confirm("Sign out all other devices from this vault’s session list?")) {
                setSessions(revokeOtherSessions());
                triggerSuccess("Other sessions revoked.");
              }
            }}
            className="h-10 px-3 rounded-xl border border-[#1F1F23] text-[11px] font-bold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Revoke other sessions
          </button>
        </section>
      </div>

      {/* Right column */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <div className={panel}>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-white/70" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Browser storage
            </h4>
          </div>
          <div className="flex justify-between text-[10px] text-[#8E8E93] font-bold">
            <span>Estimated use</span>
            <span className="text-white">
              {formatBytes(storage.used)} / {formatBytes(storage.quota)}
            </span>
          </div>
          <div className="w-full bg-[#121215] rounded-full h-2 overflow-hidden border border-[#1F1F23]">
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-[10px] text-[#71717A] font-medium leading-relaxed">
            Measured from localStorage keys (UTF-16 estimate). Includes vault JSON, prefs, and
            sessions.
          </p>
          <button
            type="button"
            onClick={() => setStorage(estimateLocalStorageBytes())}
            className="text-[10px] font-bold text-white/50 hover:text-white text-left cursor-pointer"
          >
            Recalculate
          </button>
        </div>

        <div className={panel}>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-white/70" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Recovery codes
            </h4>
          </div>
          <p className="text-[10px] text-[#71717A] font-medium leading-relaxed">
            One-time codes (SHA-256 hashed at rest via Web Crypto). Store offline — not shown again
            after you leave this screen.
            {codesMeta.count > 0 && !backupCodes.length
              ? ` ${codesMeta.count} active hash(es) on file.`
              : ""}
          </p>
          <button
            type="button"
            disabled={secBusy}
            onClick={onGenerateCodes}
            className="w-full h-10 bg-white text-black rounded-xl text-[11px] font-black cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {hasRecoveryCodes() ? "Regenerate codes" : "Generate recovery codes"}
          </button>
          {backupCodes.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-1.5 bg-black/40 border border-[#1F1F23] p-2.5 rounded-xl font-mono text-[10px] text-emerald-300/90 text-center">
                {backupCodes.map((code) => (
                  <span key={code}>{code}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCodes}
                  className="flex-1 h-9 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  type="button"
                  onClick={downloadCodes}
                  className="flex-1 h-9 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-[#0A0A0C] border border-red-500/25 rounded-2xl p-4 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            Wipe vault data
          </span>
          <p className="text-[10px] text-[#8E8E93] font-medium leading-relaxed">
            Clears properties, leases, payments, Home Life, and related vault keys on this browser.
            Irreversible without a backup.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all HomeOS vault data on this browser?")) {
                onWipeData();
              }
            }}
            className="w-full h-10 bg-red-500/10 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/25 rounded-xl text-[11px] font-black cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe vault registers
          </button>
        </div>
      </div>
    </div>
  );
}
