import React, { useState } from 'react';
import {
  Brain,
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  Droplet,
  Wrench,
  TrendingUp,
  FolderOpen,
  Terminal,
  Settings,
  LogOut,
  User,
  Activity,
 ShieldCheck,
 Wallet,
 Menu,
 X
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  userName: string;
  userRole: UserRole;
  workspaceName: string;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userName,
  userRole,
  workspaceName,
  onLogout
}: SidebarProps) {
 const [open, setOpen] = useState(false);
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Command Deck', icon: LayoutDashboard },
    { id: 'properties', label: 'Property Hub', icon: Building2 },
    { id: 'leases', label: 'Lease & Clauses', icon: FileText },
    { id: 'payments', label: 'Ledger & Payments', icon: CreditCard },
    { id: 'utilities', label: 'Utilities Tracker', icon: Droplet },
    { id: 'maintenance', label: 'Maintenance Ops', icon: Wrench },
    { id: 'expenses', label: 'Expense & Tax', icon: TrendingUp },
 { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'documents', label: 'Document Vault', icon: FolderOpen },
    { id: 'mcp', label: 'Developer & MCP', icon: Terminal },
    { id: 'settings', label: 'Vault Settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#111827] border-b lg:border-b-0 lg:border-r border-[#374151] flex flex-col shrink-0">
      {/* Workspace identity */}
      <div className="p-5 border-b border-[#374151] flex items-center justify-between gap-2">
 <div onClick={() => { onTabChange("dashboard"); setOpen(false); }} className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-all min-w-0" title="Go to Command Deck (Home)">
 <div className="p-2 bg-white/10 border border-white/15 rounded-xl text-white shadow-inner shrink-0">
 <Brain className="w-4 h-4 text-white" />
 </div>
 <div className="min-w-0">
 <span className="text-[10px] font-bold text-white uppercase tracking-wider block opacity-70">HomeOS</span>
 <span className="text-xs font-bold text-white truncate block">{workspaceName}</span>
 </div>
 </div>
 <button onClick={() => setOpen(!open)} className="lg:hidden p-2 -mr-1 rounded-lg text-white hover:bg-white/10 transition-all cursor-pointer shrink-0" aria-label="Toggle menu">
 {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </button>
 </div>

 {/* User profile capsule */}
      <div className={(open ? "flex" : "hidden") + " lg:flex p-4 mx-3 my-3 bg-[#1F2937]/50 rounded-xl border border-[#374151]/50 items-center gap-3"}>
        <div className="w-8 h-8 rounded-full bg-white/10 text-white border border-white/25 flex items-center justify-center font-bold text-xs shrink-0">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white truncate">{userName}</div>
          <div className="text-[9px] text-[#9CA3AF] font-medium uppercase truncate mt-0.5 tracking-wider">{userRole}</div>
        </div>
      </div>

      {/* Navigation menu list */}
      <nav className={(open ? "flex" : "hidden") + " lg:flex flex-1 px-3 py-2 flex-col gap-1 lg:overflow-y-auto scrollbar-none"}>
        {MENU_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer shrink-0 lg:shrink-1 ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/10'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]/80'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Sign out */}
      <div className={(open ? "block" : "hidden") + " lg:block p-3 border-t border-[#374151]"}>
 <button onClick={() => { onTabChange("legal"); setOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl text-xs font-bold text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all cursor-pointer">
 <ShieldCheck className="w-4 h-4" />
 <span>Privacy and Terms</span>
 </button>
        <button
          onClick={() => { onLogout(); setOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Workspace</span>
        </button>
      </div>
    </aside>
  );
}
