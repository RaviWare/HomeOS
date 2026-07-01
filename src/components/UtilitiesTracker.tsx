import React, { useState } from 'react';
import {
  Droplet,
  Flame,
  Zap,
  Wifi,
  Users,
  Plus,
  Clock,
  Activity,
  Award,
  CheckCircle2
} from 'lucide-react';
import { Utility } from '../types';
import Pagination from './Pagination';

interface UtilitiesTrackerProps {
  utilities: Utility[];
  onAddUtilityReading: (propId: string, type: string, reading: number, amount: number, dueDate: string) => void;
  properties: Array<{ id: string; name: string }>;
}

export default function UtilitiesTracker({
  utilities,
  onAddUtilityReading,
  properties
}: UtilitiesTrackerProps) {
  const [showLogReadingModal, setShowLogReadingModal] = useState(false);
 const [page, setPage] = useState(1);
  
  // Meter reading form state
  const [selPropId, setSelPropId] = useState(properties[0]?.id || '');
  const [selType, setSelType] = useState<'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Society Charges'>('Electricity');
  const [meterVal, setMeterVal] = useState('');
  const [amount, setAmount] = useState('1500');
  const [dueDate, setDueDate] = useState('2026-08-10');

  const getIcon = (type: string) => {
    switch (type) {
      case 'Electricity': return <Zap className="w-4 h-4 text-[#F59E0B]" />;
      case 'Water': return <Droplet className="w-4 h-4 text-[#2563EB]" />;
      case 'Gas': return <Flame className="w-4 h-4 text-red-400" />;
      case 'Internet': return <Wifi className="w-4 h-4 text-[#8B5CF6]" />;
      default: return <Users className="w-4 h-4 text-stone-400" />;
    }
  };

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selPropId || !meterVal) return;

    onAddUtilityReading(
      selPropId,
      selType,
      parseFloat(meterVal) || 0,
      parseFloat(amount) || 0,
      dueDate
    );
    setShowLogReadingModal(false);
    setMeterVal('');
  };

  // Render glowing line chart using SVG for beautiful consumption trends
  const renderLineChart = (util: Utility) => {
    const data = util.history || [];
    if (data.length === 0) return null;

    const maxVal = Math.max(...data.map((d) => d.usage));
    const width = 280;
    const height = 50;

    // Calculate coordinates
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 10) + 5;
      const y = height - (d.usage / maxVal) * (height - 10) - 5;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="mt-2 pt-2 border-t border-[#374151]/40 flex flex-col gap-1.5">
        <span className="text-[8px] font-bold text-[#9CA3AF] uppercase">Usage Trend (Last 4 Months)</span>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
            {/* Gradient under the line */}
            <defs>
              <linearGradient id={`grad-${util.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 5,${height} L ${points} L ${width - 5},${height} Z`}
              fill={`url(#grad-${util.id})`}
            />
            {/* Glowing path */}
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              points={points}
            />
            {/* Dots */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * (width - 10) + 5;
              const y = height - (d.usage / maxVal) * (height - 10) - 5;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#2563EB"
                  className="hover:r-4 transition-all"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-[8px] text-[#9CA3AF] font-bold mt-1 uppercase px-1">
            {data.map((d, i) => (
              <span key={i}>{d.month}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PAGE_SIZE = 9; const pageCount = Math.max(1, Math.ceil(utilities.length / PAGE_SIZE)); const curPage = Math.min(Math.max(1, page), pageCount); const pageItems = utilities.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
 return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Utilities Tracker</h2>
          <p className="text-xs text-[#9CA3AF]">Monitor provider accounts, log meter entries, and optimize monthly consumption.</p>
        </div>
        <button
          onClick={() => setShowLogReadingModal(true)}
          className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#2563EB]/15 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Meter Entry</span>
        </button>
      </div>

      {/* Grid displays of provider accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map((util) => (
          <div key={util.id} className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-3.5 hover:border-[#4B5563] transition-all shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#1F2937] border border-[#374151] rounded-xl">
                  {getIcon(util.type)}
                </div>
                <div>
                  <span className="text-[10px] text-[#9CA3AF] uppercase block font-bold">{util.type} Account</span>
                  <span className="text-xs font-extrabold text-white block mt-0.5">{util.provider}</span>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                util.status === 'Paid'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
              }`}>
                {util.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 bg-[#1F2937]/50 border border-[#374151]/40 p-3 rounded-xl">
              <div>
                <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Acct Number</span>
                <span className="text-[10px] font-bold text-white block mt-0.5 truncate">{util.accountNumber}</span>
              </div>
              <div>
                <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Pending Due</span>
                <span className="text-[10px] font-bold text-[#F59E0B] block mt-0.5">₹{util.amountDue.toLocaleString()}</span>
              </div>
              {util.currentReading !== undefined && (
                <>
                  <div>
                    <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Last Reading</span>
                    <span className="text-[10px] font-bold text-white block mt-0.5">{util.currentReading} units</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Net Usage</span>
                    <span className="text-[10px] font-bold text-[#2563EB] block mt-0.5">{util.usageValue} units</span>
                  </div>
                </>
              )}
            </div>

            {/* Glowing trends line chart */}
            {renderLineChart(util)}
          </div>
        ))}
      <Pagination page={curPage} total={utilities.length} pageSize={PAGE_SIZE} onPage={setPage} label="utility accounts" />
 </div>

      {/* LOG METER READING MODAL */}
      {showLogReadingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-white text-sm">Log New Utility Reading</h3>
              </div>
              <button onClick={() => setShowLogReadingModal(false)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleReadingSubmit} className="flex flex-col gap-4">
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
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Utility Provider Type</label>
                <select
                  value={selType}
                  onChange={(e: any) => setSelType(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                >
                  <option value="Electricity">Electricity Meter</option>
                  <option value="Water">Water Flow Meter</option>
                  <option value="Gas">Piped Gas Meter</option>
                  <option value="Internet">Internet Broadband Connection</option>
                  <option value="Society Charges">Society Common Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Current Reading</label>
                  <input
                    type="number"
                    required
                    value={meterVal}
                    onChange={(e) => setMeterVal(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                    placeholder="e.g. 5210"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Estimated Due (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex gap-3 border-t border-[#374151] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLogReadingModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  Log Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
