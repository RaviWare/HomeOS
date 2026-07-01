import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Award,
  Zap
} from 'lucide-react';
import { Transaction } from '../types';

interface ExpenseLabProps {
  transactions: Transaction[];
}

export default function ExpenseLab({ transactions }: ExpenseLabProps) {
  const [budgetLimit, setBudgetLimit] = useState<number>(() => { var v = Number(localStorage.getItem("rv_budget")); return v && v > 0 ? v : 60000; });
 const months = useMemo(() => { var set: Record<string, boolean> = {}; transactions.forEach((t) => { if (t.date && t.date.length >= 7) set[t.date.slice(0, 7)] = true; }); var arr = Object.keys(set).sort(); return arr.length ? arr : ["2026-06"]; }, [transactions]);
 const [selectedMonth, setSelectedMonth] = useState<string>("");
 const activeMonth = selectedMonth || months[months.length - 1];
 const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
 const monthLabel = (mk: string) => (MN[parseInt(mk.slice(5, 7), 10) - 1] || "") + " " + mk.slice(0, 4);
 const activeYear = activeMonth.slice(0, 4);
 const monthTx = useMemo(() => transactions.filter((t) => t.date.slice(0, 7) === activeMonth && t.category !== "Deposit" && t.category !== "Refund"), [transactions, activeMonth]);
 const monthExpenses = monthTx.reduce((sum, t) => sum + t.amount, 0);
 const categoriesMap: Record<string, number> = {};
 monthTx.forEach((t) => { categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount; });
 const pctSpent = budgetLimit > 0 ? (monthExpenses / budgetLimit) * 100 : 0;
 const rentSpentYearly = transactions.filter((t) => t.category === "Rent" && t.status === "Paid" && t.date.slice(0, 4) === activeYear).reduce((sum, t) => sum + t.amount, 0);
 const maintenancePaidYearly = transactions.filter((t) => (t.category === "Maintenance" || t.category === "Repairs") && t.date.slice(0, 4) === activeYear).reduce((sum, t) => sum + t.amount, 0);
 const estTaxSavings = (rentSpentYearly * 0.3) + (maintenancePaidYearly * 0.2);

 return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Overview Titles */}
      <div className="border-b border-[#374151] pb-4 flex items-start justify-between gap-4 flex-wrap"><div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Expense & Tax Lab</h2>
        <p className="text-xs text-[#9CA3AF]">Analyze spending thresholds, configure alarm limits, and estimate house rent allowance (HRA) tax offsets.</p></div><select value={activeMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-[#111827] border border-[#374151] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#2563EB]/60 cursor-pointer">{months.slice().reverse().map((mk) => <option key={mk} value={mk}>{monthLabel(mk)}</option>)}</select>
      </div>

      {/* Grid: Budget Limit Controller + Tax Savings Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Monthly Budget Gauge */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Budget Engine</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Configure Monthly Spending Cap</h4>
            </div>
            <Sliders className="w-5 h-5 text-[#9CA3AF]" />
          </div>

          <div className="flex items-end justify-between border-b border-[#374151]/50 pb-3">
            <div>
              <span className="text-[9px] text-[#9CA3AF] uppercase block font-bold">Spent in {monthLabel(activeMonth)}</span>
              <span className="text-lg font-black text-white">₹{monthExpenses.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#9CA3AF] uppercase block font-bold text-right">Alarm Threshold</span>
              <span className="text-sm font-black text-white block text-right">₹{budgetLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Slider trigger */}
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={30000}
              max={150000}
              step={5000}
              value={budgetLimit}
              onChange={(e) => { var v = parseFloat(e.target.value); setBudgetLimit(v); localStorage.setItem("rv_budget", String(v)); }}
              className="w-full h-1.5 bg-[#1F2937] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[9px] text-[#9CA3AF] font-bold">
              <span>₹30,000</span>
              <span>₹1,50,000</span>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] text-[#9CA3AF] font-bold">
              <span>Budget Utilized</span>
              <span className={pctSpent > 90 ? 'text-red-400' : 'text-[#10B981]'}>{pctSpent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-2 overflow-hidden border border-[#374151]/30">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pctSpent > 90 ? 'bg-red-500' : pctSpent > 70 ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'
                }`}
                style={{ width: `${Math.min(pctSpent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tax Savings Ledger */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
          {/* Ambient visual blur */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#10B981] rounded-full blur-[90px] opacity-10 pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider block">Section 10(13A) Calculator</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Estimated House Rent Allowance Savings</h4>
            </div>
            <Award className="w-5 h-5 text-[#10B981]" />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#1F2937]/50 border border-[#374151]/40 p-4 rounded-xl">
            <div>
              <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Rent Paid (HRA Eligible)</span>
              <span className="text-xs font-bold text-white block mt-0.5">₹{rentSpentYearly.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Repairs & Maintenance</span>
              <span className="text-xs font-bold text-white block mt-0.5">₹{maintenancePaidYearly.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-[#374151]/50 pt-3">
            <div>
              <span className="text-[9px] text-[#9CA3AF] uppercase block font-bold">Estimated Tax Rebate ({activeYear})</span>
              <span className="text-lg font-black text-[#10B981]">₹{estTaxSavings.toLocaleString()}</span>
            </div>
            <span className="text-[10px] text-[#9CA3AF] leading-relaxed text-right max-w-[150px]">
              Tax rebate computed under standard 30% HRA marginal tax bracket.
            </span>
          </div>
        </div>

      </div>

      {/* Category distribution outlay */}
      <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Cash Distribution</span>
          <h4 className="text-sm font-bold text-white mt-0.5">Portfolio Spending by Category</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {Object.entries(categoriesMap).map(([category, amt]) => {
            const pct = monthExpenses > 0 ? (amt / monthExpenses) * 100 : 0;
            return (
              <div key={category} className="bg-[#1F2937]/40 border border-[#374151]/40 p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white uppercase tracking-wider text-[10px]">{category}</span>
                  <span className="text-white">₹{amt.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
