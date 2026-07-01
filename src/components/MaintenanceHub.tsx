import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Phone,
  DollarSign,
  User,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { MaintenanceTicket } from '../types';
import Pagination from './Pagination';

interface MaintenanceHubProps {
  tickets: MaintenanceTicket[];
  onAddTicket: (ticket: MaintenanceTicket) => void;
  onUpdateTicketStatus: (id: string, status: 'Pending' | 'In Progress' | 'Resolved', actualCost?: number) => void;
  properties: Array<{ id: string; name: string }>;
}

export default function MaintenanceHub({
  tickets,
  onAddTicket,
  onUpdateTicketStatus,
  properties
}: MaintenanceHubProps) {
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
 const [lanePage, setLanePage] = useState<Record<string, number>>({});
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  // New ticket state
  const [selPropId, setSelPropId] = useState(properties[0]?.id || '');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<'Urgent' | 'Medium' | 'Low'>('Medium');
  const [vendorName, setVendorName] = useState('Metro Electricals');
  const [vendorPhone, setVendorPhone] = useState('+91 90088 12345');
  const [estCost, setEstCost] = useState('2500');

  // Actual cost settlement state
  const [settlingCostId, setSettlingCostId] = useState<string | null>(null);
  const [actualCostVal, setActualCostVal] = useState('2500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selPropId || !title.trim() || !desc.trim()) return;

    const propName = properties.find((p) => p.id === selPropId)?.name || 'Unit Asset';

    const newTicket: MaintenanceTicket = {
      id: `maint-${Date.now()}`,
      propertyId: selPropId,
      propertyName: propName,
      title,
      description: desc,
      priority,
      status: 'Pending',
      vendorName,
      vendorPhone,
      estimatedCost: parseFloat(estCost) || 0,
      createdAt: new Date().toISOString().split('T')[0],
      timeline: [
        { status: 'Ticket Opened', date: new Date().toISOString().split('T')[0], note: 'Job logged in HomeOS system.' }
      ]
    };

    onAddTicket(newTicket);
    setShowAddTicketModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setPriority('Medium');
    setVendorName('Metro Electricals');
    setVendorPhone('+91 90088 12345');
    setEstCost('2500');
  };

  const handleSettleCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCostId) return;

    onUpdateTicketStatus(settlingCostId, 'Resolved', parseFloat(actualCostVal) || 0);
    setSettlingCostId(null);
  };

  const lanes = [
    { id: 'Pending', title: 'Pending Dispatch', icon: AlertOctagon, color: 'text-red-400 bg-red-500/10' },
    { id: 'In Progress', title: 'Work In Progress', icon: Clock, color: 'text-[#F59E0B] bg-[#F59E0B]/10' },
    { id: 'Resolved', title: 'Completed & Signed', icon: CheckCircle2, color: 'text-[#10B981] bg-[#10B981]/10' }
  ];

  const totalSpent = tickets
    .filter((t) => t.status === 'Resolved')
    .reduce((sum, t) => sum + (t.actualCost || t.estimatedCost), 0);

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Title & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Maintenance & Repair Ops</h2>
          <p className="text-xs text-[#9CA3AF]">Manage active work lanes, coordinate vendors, and audit mechanical expenditures.</p>
        </div>
        
        <div className="flex gap-3 items-center self-start md:self-auto">
          <div className="bg-[#111827] border border-[#374151] px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold">Maintenance Expenditure</span>
            <span className="text-xs font-extrabold text-white">₹{totalSpent.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowAddTicketModal(true)}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#2563EB]/15 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Service Ticket</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {lanes.map((lane) => {
          const laneTickets = tickets.filter((t) => t.status === lane.id);
 const LP = 6;
 const cp = Math.min(Math.max(1, lanePage[lane.id] || 1), Math.max(1, Math.ceil(laneTickets.length / LP)));
 const shown = laneTickets.slice((cp - 1) * LP, cp * LP);
          const LaneIcon = lane.icon;

          return (
            <div key={lane.id} className="bg-[#111827] border border-[#374151] rounded-2xl p-4 flex flex-col gap-4">
              
              {/* Lane Header */}
              <div className="flex justify-between items-center border-b border-[#374151]/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${lane.color}`}>
                    <LaneIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{lane.title}</h4>
                </div>
                <span className="bg-[#1F2937] text-[#9CA3AF] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#374151]/50">
                  {laneTickets.length}
                </span>
              </div>

              {/* Tickets List */}
              <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                {shown.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="bg-[#1F2937]/50 border border-[#374151]/40 hover:border-[#2563EB]/40 p-3.5 rounded-xl transition-all cursor-pointer flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${
                        t.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[9px] text-[#9CA3AF] font-bold">{t.createdAt}</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-extrabold text-white leading-snug line-clamp-1">{t.title}</h5>
                      <p className="text-[10px] text-[#9CA3AF] leading-relaxed line-clamp-2 mt-1">{t.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#374151]/50 pt-2 text-[10px] text-[#9CA3AF] font-bold">
                      <span className="truncate max-w-[130px]">{t.propertyName}</span>
                      <span className="text-white">Est: ₹{t.estimatedCost.toLocaleString()}</span>
                    </div>

                    {/* Simple quick actions based on lane */}
                    {t.status === 'Pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTicketStatus(t.id, 'In Progress');
                        }}
                        className="w-full bg-[#2563EB]/15 hover:bg-[#2563EB]/25 text-[#2563EB] border border-[#2563EB]/20 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 mt-1"
                      >
                        <span>Dispatch Vendor</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {t.status === 'In Progress' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettlingCostId(t.id);
                          setActualCostVal(t.estimatedCost.toString());
                        }}
                        className="w-full bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/20 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center justify-center gap-1 mt-1"
                      >
                        <span>Settle & Resolve</span>
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {laneTickets.length === 0 && (
                  <span className="text-[10px] text-[#9CA3AF] text-center block py-8">Lane clear</span>
                )}
              </div>
 <Pagination page={cp} total={laneTickets.length} pageSize={LP} onPage={(p) => setLanePage((m) => ({ ...m, [lane.id]: p }))} label="tickets" />

            </div>
          );
        })}
      </div>

      {/* DETAIL DRAWER / POPUP */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <span className="text-xs font-bold text-white">Ticket #{selectedTicket.id.slice(-5)}</span>
              <button onClick={() => setSelectedTicket(null)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5 items-center">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/20 uppercase">
                  {selectedTicket.priority} Priority
                </span>
                <span className="text-[9px] text-[#9CA3AF] font-bold">Status: {selectedTicket.status}</span>
              </div>

              <h4 className="text-sm font-extrabold text-white tracking-tight">{selectedTicket.title}</h4>
              <p className="text-xs text-[#9CA3AF] leading-relaxed bg-[#1F2937]/50 p-3 rounded-xl border border-[#374151]/40">
                {selectedTicket.description}
              </p>
            </div>

            {/* Vendor card */}
            <div className="bg-[#1F2937] p-3.5 rounded-xl border border-[#374151]/50 flex items-center justify-between gap-4">
              <div>
                <span className="text-[8px] text-[#9CA3AF] uppercase font-bold block">Assigned Contractor</span>
                <span className="text-xs font-extrabold text-white block mt-0.5">{selectedTicket.vendorName}</span>
                <span className="text-[9px] text-[#9CA3AF] font-bold block mt-0.5">{selectedTicket.vendorPhone}</span>
              </div>
              <a
                href={`tel:${selectedTicket.vendorPhone}`}
                className="p-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl shadow-lg transition-all"
                title="Initiate phone coordination"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            <div className="flex gap-3 border-t border-[#374151] pt-4 mt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE WITH COST SETTLEMENT MODAL */}
      {settlingCostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <span className="text-xs font-bold text-white">Settle Job Expenditures</span>
              <button onClick={() => setSettlingCostId(null)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSettleCostSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Actual Settlement Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={actualCostVal}
                  onChange={(e) => setActualCostVal(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex gap-3 border-t border-[#374151] pt-4">
                <button
                  type="button"
                  onClick={() => setSettlingCostId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#10B981] hover:bg-[#059669] text-white"
                >
                  Resolve Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SERVICE TICKET MODAL */}
      {showAddTicketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-white text-sm">Open Maintenance Ticket</h3>
              </div>
              <button onClick={() => setShowAddTicketModal(false)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Select Property Asset</label>
                <select
                  value={selPropId}
                  onChange={(e) => setSelPropId(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Ticket Subject / Issue</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                  placeholder="e.g. Toilet drainage clogging, balcony ceiling dampness"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Core Description</label>
                <textarea
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white h-20"
                  placeholder="Elaborate details for vendor diagnostics..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Priority Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                >
                  <option value="Low">Low (No rush, minor visual fix)</option>
                  <option value="Medium">Medium (Coordination needed within 48h)</option>
                  <option value="Urgent">Urgent (Plumbing leak, gas alert, active outage)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={estCost}
                    onChange={(e) => setEstCost(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Contractor Vendor</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#374151] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  Dispatch Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
