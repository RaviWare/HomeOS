import React, { useState } from 'react';
import { Brain, ShieldCheck, Key, Radio, Building2, UserCircle, Users, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';

interface OnboardingProps {
  onComplete: (role: UserRole, workspaceName: string, userName: string, userEmail: string, importSample: boolean) => void;
}

const ROLES: Array<{ id: UserRole; title: string; desc: string; icon: any }> = [
  { id: 'Tenant', title: 'Tenant / Renter', desc: 'Manage your active rentals, leases, utility payments, receipts, and maintenance tickets.', icon: UserCircle },
  { id: 'Landlord', title: 'Property Landlord', desc: 'Administer rents, contracts, tenants, invoices, automated reminder notifications, and tax statements.', icon: Building2 },
  { id: 'Property Owner', title: 'Asset Owner', desc: 'Oversee property values, direct repairs, portfolios, builders, legal disclosures, and ROI tracking.', icon: ShieldCheck },
  { id: 'Property Manager', title: 'Property Manager', desc: 'Coordinate workflows, maintenance service vendors, tenant requests, and monthly reports.', icon: Users },
  { id: 'Housing Society Admin', title: 'Society Admin', desc: 'Direct common amenities, resident registries, society dues, and meter readings.', icon: Radio }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Tenant');
  const [workspaceName, setWorkspaceName] = useState('My HomeOS');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [importSample, setImportSample] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      // Complete
      const activeName = userName.trim() || (selectedRole === 'Tenant' ? 'Siddharth Roy' : 'Vikram Malhotra');
      const activeEmail = userEmail.trim() || (selectedRole === 'Tenant' ? 'siddharth@gmail.com' : 'vikram@gmail.com');
      onComplete(selectedRole, workspaceName, activeName, activeEmail, importSample);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col justify-center items-center p-4 selection:bg-[#374151]">
      <div className="max-w-xl w-full bg-[#111827] border border-[#374151] rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2563EB] rounded-full blur-[140px] opacity-15 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full blur-[140px] opacity-15 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#374151] pb-4">
          <div className="p-2.5 bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-xl text-[#2563EB]">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest">HomeOS</span>
            <h1 id="onboard-title" className="text-xl font-extrabold text-white tracking-tight">Property Lifecycle OS</h1><div className="mt-1 inline-flex items-center text-[8px] font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-1.5 py-0.5 rounded uppercase tracking-wider">MVP Testing Build - No Login Needed</div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-between items-center bg-[#1F2937]/50 border border-[#374151]/50 p-2 rounded-xl text-xs font-semibold text-[#9CA3AF]">
          <div className={`px-2 py-1 rounded-md ${step >= 1 ? 'bg-[#2563EB] text-white' : ''}`}>1. Choose Role</div>
          <div className="text-[#374151]">➔</div>
          <div className={`px-2 py-1 rounded-md ${step >= 2 ? 'bg-[#2563EB] text-white' : ''}`}>2. Setup Vault</div>
          <div className="text-[#374151]">➔</div>
          <div className={`px-2 py-1 rounded-md ${step >= 3 ? 'bg-[#2563EB] text-white' : ''}`}>3. Security & Import</div>
        </div>

        {/* STEP 1: CHOOSE ROLE */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-md font-bold text-white">Select your primary portfolio identity</h2>
              <p className="text-xs text-[#9CA3AF] mt-1">HomeOS adjusts dashboards, layouts, and tools based on your active role.</p>
            </div>
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
              {ROLES.map((r) => {
                const isSel = selectedRole === r.id;
                const IconComp = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`flex items-start text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#2563EB]/15 border-[#2563EB] text-[#F9FAFB]'
                        : 'bg-[#1F2937]/80 border-[#374151] hover:border-[#9CA3AF]/40 text-[#9CA3AF] hover:bg-[#1F2937]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${isSel ? 'bg-[#2563EB] text-white' : 'bg-[#111827] text-[#9CA3AF]'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block">{r.title}</span>
                      <span className="text-[10px] text-[#9CA3AF] mt-0.5 leading-relaxed block">{r.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: SETUP WORKSPACE */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-md font-bold text-white">Name your property workspace</h2>
              <p className="text-xs text-[#9CA3AF] mt-1">Workspaces coordinate properties, lease portfolios, documents, and expenses.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white placeholder-gray-500 font-semibold"
                  placeholder="e.g. Imperial Estates, Siddharth Portfolio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white placeholder-gray-500 font-semibold"
                    placeholder={selectedRole === 'Tenant' ? 'Siddharth Roy' : 'Vikram Malhotra'}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Your Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white placeholder-gray-500 font-semibold"
                    placeholder={selectedRole === 'Tenant' ? 'siddharth@gmail.com' : 'vikram@gmail.com'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SECURITY & IMPORT */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-md font-bold text-white">Privacy & Security Initialization</h2>
              <p className="text-xs text-[#9CA3AF] mt-1">HomeOS operates under privacy-first design paradigms with encrypted vault structures.</p>
            </div>
            
            <div className="flex flex-col gap-3 bg-[#1F2937]/60 p-4 rounded-xl border border-[#374151]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-[#8B5CF6]" />
                  <div>
                    <span className="text-xs font-bold text-white block">Multi-Factor Authenticator (2FA)</span>
                    <span className="text-[9px] text-[#9CA3AF] block">Secures lease renewals and financial receipts</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div className="border-t border-[#374151]/50 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <div>
                    <span className="text-xs font-bold text-white block">Import Core Seed Data</span>
                    <span className="text-[9px] text-[#9CA3AF] block">Pre-populate beautiful records (HSR Heights and Green Vista)</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={importSample}
                  onChange={(e) => setImportSample(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] accent-[#2563EB] cursor-pointer"
                />
              </div>
            </div>

            <div className="text-[10px] text-[#9CA3AF] leading-relaxed text-center">
              ⚠️ In sandboxed environments, vault keys are generated client-side and saved securely in local storage. Discharging browser cache will wipe offline files.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-2 border-t border-[#374151] pt-4">
          {step > 1 && (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] hover:bg-[#374151] text-[#9CA3AF] hover:text-white transition-all cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-lg shadow-[#2563EB]/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{step === 3 ? 'Launch HomeOS' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
