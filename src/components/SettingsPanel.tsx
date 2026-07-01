import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Trash2,
  HardDrive,
  User,
  Activity,
  CheckCircle2,
  RefreshCw,
  Bell
} from 'lucide-react';
import { UserSession } from '../types';
import AccountData from './AccountData';

interface SettingsPanelProps {
  session: UserSession;
  onUpdateSession: (updated: UserSession) => void;
  onWipeData: () => void;
}

export default function SettingsPanel({
  session,
  onUpdateSession,
  onWipeData
}: SettingsPanelProps) {
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 6 }, () =>
      Math.floor(100000 + Math.random() * 900000).toString()
    );
    setBackupCodes(codes);
    triggerSuccess('New backup recovery seeds generated successfully.');
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Mock Active Device Session list
  const activeSessions = [
    { device: 'macOS Chrome (Active Session)', location: 'Bengaluru, India', ip: '106.51.84.23', date: 'Just now' },
    { device: 'iPhone 15 Pro Max', location: 'Bengaluru, India', ip: '106.51.84.99', date: 'June 29, 2026' },
    { device: 'Android Pixel 8 Fold', location: 'Mumbai, India', ip: '182.15.112.4', date: 'June 25, 2026' }
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Left side: Settings controls */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Title bar */}
        <div className="border-b border-[#374151] pb-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Vault Settings</h2>
          <p className="text-xs text-[#9CA3AF]">Configure client-side E2E encryption, audit connected devices, and manage local storage volumes.</p>
        </div>

        <AccountData session={session} onUpdateSession={onUpdateSession} />
 {/* Success Alert */}
        {successMsg && (
          <div className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* E2E and 2FA settings */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vault Cryptography & MFA</h4>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[10px] text-[#F59E0B] leading-relaxed bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-lg p-2.5">HomeOS currently runs with no login and no cloud sync, so the switches below are saved preferences and are not enforced yet. Encryption today applies to backups you export from Account and Data.</p>
 {/* E2E Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#1F2937]/50 rounded-xl border border-[#374151]/30">
              <div>
                <span className="text-xs font-bold text-white block">Client-Side E2E Encryption</span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5 leading-relaxed">
                  Your exported backups can be encrypted with AES-256-GCM. Note: data saved in this browser is not encrypted at rest, and there is no cloud sync yet.
                </span>
              </div>
              <input
                type="checkbox"
                checked={session.e2eEncryptionEnabled}
                onChange={(e) => {
                  onUpdateSession({ ...session, e2eEncryptionEnabled: e.target.checked });
                  triggerSuccess(`Client-Side Cryptography ${e.target.checked ? 'Enabled' : 'Disabled'}.`);
                }}
                className="w-4 h-4 accent-[#2563EB]"
              />
            </div>

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#1F2937]/50 rounded-xl border border-[#374151]/30">
              <div>
                <span className="text-xs font-bold text-white block">Multi-Factor Authenticator (MFA)</span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5 leading-relaxed">
                  A saved preference only. HomeOS runs with no login, so this is not enforced yet. It will apply when optional cloud accounts arrive.
                </span>
              </div>
              <input
                type="checkbox"
                checked={session.security2FAEnabled}
                onChange={(e) => {
                  onUpdateSession({ ...session, security2FAEnabled: e.target.checked });
                  triggerSuccess(`MFA Protection state synchronized.`);
                }}
                className="w-4 h-4 accent-[#2563EB]"
              />
            </div>

            {/* Notification Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-[#1F2937]/50 rounded-xl border border-[#374151]/30">
              <div>
                <span className="text-xs font-bold text-white block">Push Reminders & Dues Alerts</span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5 leading-relaxed">
                  A saved preference. Scheduled reminders are not delivered yet, so due items surface inside the app for now.
                </span>
              </div>
              <input
                type="checkbox"
                checked={session.notificationsEnabled}
                onChange={(e) => {
                  onUpdateSession({ ...session, notificationsEnabled: e.target.checked });
                  triggerSuccess(`Automated push reminders state updated.`);
                }}
                className="w-4 h-4 accent-[#2563EB]"
              />
            </div>
          </div>
        </div>

        {/* Security Audit Log */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#374151]/50 pb-2">
            <Activity className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device Log & Session Auditing</h4>
          </div>

          <div className="flex flex-col gap-3">
            {activeSessions.map((s, idx) => (
              <div key={idx} className="flex justify-between items-start p-3 bg-[#1F2937]/30 border border-[#374151]/30 rounded-xl text-xs font-semibold">
                <div>
                  <span className="text-white block font-bold">{s.device}</span>
                  <span className="text-[10px] text-[#9CA3AF] block mt-0.5">{s.location} • IP: {s.ip}</span>
                </div>
                <span className="text-[10px] text-[#2563EB] font-bold">{s.date}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right side: Storage, seeds, and wipe actions */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-5">
        
        {/* Storage utilisation */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Storage Cap</h4>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] text-[#9CA3AF] font-bold">
              <span>Hashed Vault Volume</span>
              <span className="text-white">4.4 MB / 100 MB</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#1F2937] rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '4.4%' }}></div>
            </div>
          </div>

          <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
            Vault space accounts for contract PDFs, OCR text caches, transaction receipt logs, and custom profiles.
          </p>
        </div>

        {/* 2FA backup codes generator */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">MFA Backup Seeds</h4>
          </div>

          <button
            onClick={generateBackupCodes}
            className="w-full bg-[#1F2937] hover:bg-[#374151] text-white border border-[#374151] py-2.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Recovery Codes</span>
          </button>

          <p className="text-[10px] text-[#9CA3AF] leading-relaxed">These are sample codes for a future account system. HomeOS has no login yet, so they do not protect anything today.</p>
 {backupCodes.length > 0 && (
            <div className="grid grid-cols-2 gap-2 bg-[#0B1220] border border-[#374151] p-3 rounded-xl font-mono text-[10px] text-[#10B981] text-center">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
          )}
        </div>

        {/* Reset / Wipe out data */}
        <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-5 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Wipe Vault Data</span>
          <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
            Danger: Wiping local vault registers clears all properties, lease agreements, transactions, and settings. This operation is irreversible.
          </p>
          <button
            onClick={() => {
              if (confirm('Are you absolutely sure you want to clear your local HomeOS data?')) {
                onWipeData();
              }
            }}
            className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-2.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Vault Registers</span>
          </button>
        </div>

      </div>

    </div>
  );
}
