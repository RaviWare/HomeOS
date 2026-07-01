import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  QrCode,
  ArrowRight,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
 Trash2
} from 'lucide-react';
import { Transaction, Lease } from '../types';
import Pagination from './Pagination';
import PaymentAutomation from './PaymentAutomation';

interface PaymentHubProps {
  transactions: Transaction[];
  onSettlePayment: (id: string, method: 'UPI' | 'Credit Card' | 'Bank Transfer') => void;
  onAddTransaction: (tx: Transaction) => void;
 leases: Lease[];
 onAddTransactions: (ts: Transaction[]) => void;
 onDeleteTransaction: (id: string) => void;
}

export default function PaymentHub({
  transactions,
  onSettlePayment,
  onAddTransaction,
 leases,
 onAddTransactions,
 onDeleteTransaction
}: PaymentHubProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');
 const [page, setPage] = useState(1);
  const [selectedTxForPay, setSelectedTxForPay] = useState<Transaction | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Credit Card' | 'Bank Transfer'>('UPI');

  const filteredTx = transactions.filter((tx) => {
    if (filterCategory !== 'All' && tx.category !== filterCategory) return false;
    return true;
  });

  const PAGE_SIZE = 12;
 const pageCount = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
 const curPage = Math.min(Math.max(1, page), pageCount);
 const pageItems = filteredTx.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
 const lifetimePaid = transactions
    .filter((t) => t.status === 'Paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOverdue = transactions
    .filter((t) => t.status === 'Overdue')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPaymentsCount = transactions.filter((t) => t.status !== 'Paid').length;

  const handleSettleSubmit = () => {
    if (!selectedTxForPay) return;
    onSettlePayment(selectedTxForPay.id, payMethod);
    setSelectedTxForPay(null);
  };

  // Generate simple, robust SVG bar graph for transaction trend
  const renderTrendChart = () => {
    // Group monthly expenses
    const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
 var anchor = transactions.length ? transactions.reduce((mx, t) => (t.date > mx ? t.date : mx), transactions[0].date) : "2026-06-01";
 var ay = parseInt(anchor.slice(0, 4), 10) || 2026;
 var am = parseInt(anchor.slice(5, 7), 10) || 6;
 const chartData: { month: string; amount: number }[] = [];
 for (var bi = 5; bi >= 0; bi--) {
 var tt = ay * 12 + (am - 1) - bi;
 var yy = Math.floor(tt / 12);
 var mm = tt - yy * 12;
 var key = yy + "-" + (mm + 1 < 10 ? "0" + (mm + 1) : "" + (mm + 1));
 var amt = transactions.filter((x) => x.date.slice(0, 7) === key && x.category !== "Refund").reduce((s2, r) => s2 + r.amount, 0);
 chartData.push({ month: mShort[mm], amount: amt });
 }
 const maxVal = Math.max(...chartData.map((d) => d.amount), 1);
 const chartHeight = 140;

    return (
      <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">Portfolio Outlay</span>
          <h4 className="text-sm font-bold text-white mt-0.5">Historical Cash Outflow</h4>
        </div>

        {/* SVG Graphic */}
        <div className="relative w-full h-[140px] flex items-end justify-between pt-4 gap-2">
          {chartData.map((d, idx) => {
            const pct = d.amount / maxVal;
            const barHeight = Math.max(pct * chartHeight, 15);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                {/* Hover value label */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-1 bg-[#1F2937] text-white text-[9px] font-black py-0.5 px-1.5 rounded-md border border-[#374151] transition-all z-10">
                  ₹{d.amount.toLocaleString()}
                </div>
                {/* Column block */}
                <div
                  className="w-full bg-[#2563EB] hover:bg-[#8B5CF6] rounded-t-md transition-all duration-300"
                  style={{ height: `${barHeight}px` }}
                ></div>
                <span className="text-[9px] text-[#9CA3AF] font-bold uppercase">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
 <PaymentAutomation leases={leases} transactions={transactions} onAddTransactions={onAddTransactions} />
      
      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Lifetime Settled</span>
            <span className="text-xl font-black text-white">₹{lifetimePaid.toLocaleString()}</span>
            <span className="text-[9px] text-[#10B981] font-bold mt-1">✓ Bank Verified Logs</span>
          </div>
          <div className="p-3 bg-[#10B981]/15 text-[#10B981] rounded-xl border border-[#10B981]/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-wider">Pending Dues</span>
            <span className="text-xl font-black text-white">₹{totalOverdue.toLocaleString()}</span>
            <span className="text-[9px] text-red-400 font-bold mt-1">⚠️ {pendingPaymentsCount} Billings Overdue</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {renderTrendChart()}

      </div>

      {/* Main Ledger Lists */}
      <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="font-extrabold text-white text-sm">Property Financial Ledger</h3>
              <p className="text-[10px] text-[#9CA3AF]">Complete rent registers, deposits, utilities, and tax eligible maintenance logs.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Filter className="w-4 h-4 text-[#9CA3AF]" />
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="bg-[#1F2937] border border-[#374151] text-xs text-white p-2 rounded-xl focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Rent">Rent</option>
              <option value="Deposit">Deposit</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Repairs">Repairs</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#374151]/60 text-[10px] text-[#9CA3AF] uppercase font-bold">
                <th className="py-3 px-2">Property Asset</th>
                <th className="py-3 px-2">Bill Category</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Billing Date</th>
                <th className="py-3 px-2">Method</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]/30">
              {pageItems.map((tx) => (
                <tr key={tx.id} className="text-xs text-white hover:bg-[#1F2937]/30 transition-all">
                  <td className="py-3 px-2 font-bold max-w-[180px] truncate">{tx.propertyName}</td>
                  <td className="py-3 px-2">
                    <span className="bg-[#1F2937] px-2 py-1 rounded-md border border-[#374151] text-[10px] font-bold uppercase">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-black">₹{tx.amount.toLocaleString()}</td>
                  <td className="py-3 px-2 font-semibold text-[#9CA3AF]">{tx.date}</td>
                  <td className="py-3 px-2 text-[#9CA3AF] font-bold">{tx.paymentMethod}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      tx.status === 'Paid'
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : tx.status === 'Pending'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                    }`}>
                      {tx.status === 'Paid' ? (
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Clock className="w-3 h-3 text-[#F59E0B]" />
                      )}
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-1.5">
 <button onClick={() => { if (window.confirm("Delete this transaction? This cannot be undone.")) onDeleteTransaction(tx.id); }} className="bg-[#1F2937] hover:bg-[#EF4444]/20 border border-[#374151] hover:border-[#EF4444]/40 text-[#9CA3AF] hover:text-[#F87171] p-1 rounded-md cursor-pointer transition-all" title="Delete transaction"><Trash2 className="w-4 h-4" /></button>
                      {tx.status !== 'Paid' ? (
                        <button
                          onClick={() => setSelectedTxForPay(tx)}
                          className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-[10px] px-2.5 py-1 rounded-md cursor-pointer transition-all uppercase"
                        >
                          Settle Now
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-[#9CA3AF] hover:text-white p-1 rounded-md cursor-pointer transition-all"
                          title="Generate tax invoice receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <Pagination page={curPage} total={filteredTx.length} pageSize={PAGE_SIZE} onPage={setPage} label="transactions" />
 </div>

      {/* UPI SETTLEMENT MODAL */}
      {selectedTxForPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 text-center">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <span className="text-xs font-bold text-white">HomeOS Unified Pay Gateway</span>
              <button onClick={() => setSelectedTxForPay(null)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow-md border border-[#374151]/10">
                <QrCode className="w-36 h-36 text-[#111827]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#9CA3AF]">Paying for: {selectedTxForPay.category}</span>
                <span className="text-lg font-black text-white">₹{selectedTxForPay.amount.toLocaleString()}</span>
                <span className="text-[10px] text-[#2563EB] font-bold">UPI ID: homeos@icici</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Settlement Channel</label>
              <select
                value={payMethod}
                onChange={(e: any) => setPayMethod(e.target.value)}
                className="bg-[#1F2937] border border-[#374151] rounded-lg p-2.5 text-xs text-white"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card (Ramp / Brex)</option>
                <option value="Bank Transfer">Direct IMPS / NEFT Transfer</option>
              </select>
            </div>

            <div className="flex gap-3 border-t border-[#374151] pt-4">
              <button
                onClick={() => setSelectedTxForPay(null)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#10B981] hover:bg-[#059669] text-white"
              >
                Confirm Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM INVOICE STATEMENT MODAL */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-stone-800 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative flex flex-col gap-6 printable-receipt">
            
            {/* Stamp Duty details */}
            <div className="flex justify-between items-start border-b-2 border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#2563EB] tracking-wider">HomeOS Ledger Receipt</span>
                <h3 className="text-md font-bold text-stone-900 mt-1">TAX COMPLIANT STATEMENT</h3>
                <span className="text-[9px] text-stone-500 block">Stamp Duty Reg: RV-928491</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase text-stone-500 block">Transaction Index</span>
                <span className="text-xs font-black text-stone-900 block">{selectedTxForReceipt.invoiceNumber}</span>
              </div>
            </div>

            {/* Core facts */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold leading-relaxed">
              <div>
                <span className="text-[9px] text-stone-400 block uppercase font-bold">Property Resource</span>
                <span className="text-stone-900 block">{selectedTxForReceipt.propertyName}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 block uppercase font-bold">Settled Date</span>
                <span className="text-stone-900 block">{selectedTxForReceipt.date}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 block uppercase font-bold">Billing Category</span>
                <span className="text-stone-900 block font-bold uppercase">{selectedTxForReceipt.category}</span>
              </div>
              <div>
                <span className="text-[9px] text-stone-400 block uppercase font-bold">Settlement Channel</span>
                <span className="text-stone-900 block">{selectedTxForReceipt.paymentMethod}</span>
              </div>
            </div>

            {/* Price section */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl flex justify-between items-center mt-2">
              <div>
                <span className="text-xs font-bold text-stone-700">Subtotal</span>
                <p className="text-[9px] text-stone-400 leading-none mt-0.5">Includes local taxes & society charges</p>
              </div>
              <span className="text-xl font-black text-stone-900">₹{selectedTxForReceipt.amount.toLocaleString()}</span>
            </div>

            {/* Stamp Graphic */}
            <div className="flex justify-between items-center border-t border-stone-200 pt-4 mt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  ✓ VERIFIED PAID
                </span>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs p-2 rounded-xl flex items-center gap-1 border border-stone-300 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

            <div className="absolute top-4 right-4 text-xs text-stone-400 hover:text-stone-600 cursor-pointer no-print" onClick={() => setSelectedTxForReceipt(null)}>
              ✕
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
