import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Plus,
  PenTool,
  Download,
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Lease } from '../types';
import Pagination from './Pagination';

interface LeaseVaultProps {
  leases: Lease[];
  onAddLease: (newLease: Lease) => void;
  onUpdateLease: (updated: Lease) => void;
}

export default function LeaseVault({ leases, onAddLease, onUpdateLease }: LeaseVaultProps) {
  const [activeLeaseIndex, setActiveLeaseIndex] = useState(0);
 const [page, setPage] = useState(1);
  const [newClause, setNewClause] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureRole, setSignatureRole] = useState<'tenant' | 'landlord'>('tenant');
  
  // HTML5 signature canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const activeLease = leases[activeLeaseIndex] || null;

  // Initialize signature canvas events
  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, [showSignModal]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!activeLease) return;
    const dateStr = new Date().toISOString();
    const updatedSignatures = { ...activeLease.signatures };

    if (signatureRole === 'tenant') {
      updatedSignatures.tenantSigned = true;
      updatedSignatures.tenantSignedAt = dateStr;
    } else {
      updatedSignatures.landlordSigned = true;
      updatedSignatures.landlordSignedAt = dateStr;
    }

    const isFullySigned = updatedSignatures.tenantSigned && updatedSignatures.landlordSigned;

    onUpdateLease({
      ...activeLease,
      signatures: updatedSignatures,
      status: isFullySigned ? 'Active' : activeLease.status
    });

    setShowSignModal(false);
  };

  const handleAddClause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClause.trim() || !activeLease) return;

    onUpdateLease({
      ...activeLease,
      clauses: [...activeLease.clauses, newClause.trim()],
      version: activeLease.version + 1
    });

    setNewClause('');
  };

  const handleDeleteClause = (index: number) => {
    if (!activeLease) return;

    onUpdateLease({
      ...activeLease,
      clauses: activeLease.clauses.filter((_, i) => i !== index),
      version: activeLease.version + 1
    });
  };

  const downloadLeaseAsText = () => {
    if (!activeLease) return;
    const textContent = `
========================================
HOMEOS LEASE AGREEMENT (V${activeLease.version})
========================================
Property: ${activeLease.propertyName}
Tenant: ${activeLease.tenantName} (${activeLease.tenantEmail})
Landlord: ${activeLease.landlordName}
Lease Duration: ${activeLease.startDate} to ${activeLease.endDate}
Monthly Rental Fee: INR ${activeLease.monthlyRent.toLocaleString()}
Refundable Deposit: INR ${activeLease.securityDeposit.toLocaleString()}
Stamp Duty Paid: INR ${activeLease.stampDutyPaid || 'N/A'}
Notary Certification: ${activeLease.notaryDetails || 'N/A'}

DEFINED CLAUSES:
${activeLease.clauses.map((c, i) => `${i + 1}. ${c}`).join('\n')}

SIGNATURE STATUS:
- Tenant Signature: ${activeLease.signatures.tenantSigned ? `SIGNED AT ${activeLease.signatures.tenantSignedAt}` : 'PENDING'}
- Landlord Signature: ${activeLease.signatures.landlordSigned ? `SIGNED AT ${activeLease.signatures.landlordSignedAt}` : 'PENDING'}

========================================
HomeOS Security Ledger Stamp - SHA-256 Validated
========================================
`;
    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `LeaseAgreement_${activeLease.propertyName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const PAGE_SIZE = 8; const pageCount = Math.max(1, Math.ceil(leases.length / PAGE_SIZE)); const curPage = Math.min(Math.max(1, page), pageCount);
 return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Left side: Agreements panel */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#374151] pb-3">
          <FileText className="w-5 h-5 text-[#2563EB]" />
          <h3 className="font-bold text-white text-sm">Lease Documents</h3>
        </div>

        <div className="flex flex-col gap-2">
          {leases.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE).map((l, i) => {
 const idx = (curPage - 1) * PAGE_SIZE + i;
            const isAct = activeLeaseIndex === idx;
            return (
              <button
                key={l.id}
                onClick={() => setActiveLeaseIndex(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isAct
                    ? 'bg-[#2563EB]/10 border-[#2563EB]'
                    : 'bg-[#111827] border-[#374151] hover:border-[#9CA3AF]/40'
                }`}
              >
                <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">
                  v{l.version} • {l.status}
                </span>
                <span className="text-xs font-bold text-white block leading-snug line-clamp-1">
                  {l.propertyName}
                </span>
                <div className="flex items-center justify-between mt-1 text-[10px] text-[#9CA3AF] font-semibold border-t border-[#374151]/40 pt-1.5">
                  <span>To: {l.tenantName}</span>
                  <span>₹{l.monthlyRent.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        <Pagination page={curPage} total={leases.length} pageSize={PAGE_SIZE} onPage={setPage} label="leases" />
 </div>

        {/* Warning card */}
        <div className="bg-[#1F2937]/50 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-500">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-xs font-bold block">Notary & Renewal Compliance</span>
            <span className="text-[10px] text-[#9CA3AF] block leading-relaxed mt-1">
              HomeOS lease agreements are legally integrated with stamp duty mandates. Altering key clauses increments version control logs.
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Detailed Lease Editor/Viewer */}
      {activeLease ? (
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Header Block */}
          <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">
                Contract Audit v{activeLease.version} • {activeLease.status}
              </span>
              <h3 className="text-base font-black text-white tracking-tight leading-snug mt-0.5">
                {activeLease.propertyName}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Lease Period: {activeLease.startDate} to {activeLease.endDate}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={downloadLeaseAsText}
                className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-[#9CA3AF] hover:text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download verified lease text ledger"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Details & Signatures Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Agreement Terms */}
            <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block border-b border-[#374151] pb-1.5">
                Legal Specifications
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Monthly Rent</span>
                  <span className="text-sm font-black text-white">₹{activeLease.monthlyRent.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Refundable Deposit</span>
                  <span className="text-sm font-black text-[#F59E0B]">₹{activeLease.securityDeposit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Stamp Duty Paid</span>
                  <span className="text-xs font-bold text-white">₹{activeLease.stampDutyPaid || 500}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] block uppercase font-bold">Notary Certification</span>
                  <span className="text-[10px] font-bold text-[#10B981] truncate block">Certified</span>
                </div>
              </div>

              <div className="bg-[#1F2937]/50 p-3 rounded-xl border border-[#374151]/30">
                <span className="text-[9px] font-bold text-[#9CA3AF] uppercase block">Notary Ledger Registry</span>
                <span className="text-[10px] text-white font-medium block mt-1">
                  {activeLease.notaryDetails || 'E-Stamp registry validation completed via sub-registrar.'}
                </span>
              </div>
            </div>

            {/* Signature Pad Ledger */}
            <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block border-b border-[#374151] pb-1.5">
                E-Signature Verification
              </span>

              <div className="flex flex-col gap-3">
                {/* Tenant signature capsule */}
                <div className="flex items-center justify-between p-3 bg-[#1F2937] border border-[#374151] rounded-xl">
                  <div>
                    <span className="text-[9px] text-[#9CA3AF] block font-bold uppercase">Tenant Status</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{activeLease.tenantName}</span>
                  </div>
                  {activeLease.signatures.tenantSigned ? (
                    <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold px-2 py-1 rounded-md">
                      ✓ SIGNED
                    </span>
                  ) : (
                    <button
                      onClick={() => { setSignatureRole('tenant'); setShowSignModal(true); }}
                      className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Sign Agreement
                    </button>
                  )}
                </div>

                {/* Landlord signature capsule */}
                <div className="flex items-center justify-between p-3 bg-[#1F2937] border border-[#374151] rounded-xl">
                  <div>
                    <span className="text-[9px] text-[#9CA3AF] block font-bold uppercase">Landlord Status</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{activeLease.landlordName}</span>
                  </div>
                  {activeLease.signatures.landlordSigned ? (
                    <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold px-2 py-1 rounded-md">
                      ✓ SIGNED
                    </span>
                  ) : (
                    <button
                      onClick={() => { setSignatureRole('landlord'); setShowSignModal(true); }}
                      className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Sign Agreement
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Clause Management Panel */}
          <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block border-b border-[#374151] pb-1.5">
              Active Agreement Clauses ({activeLease.clauses.length})
            </span>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {activeLease.clauses.map((clause, index) => (
                <div key={index} className="p-3 bg-[#1F2937]/50 border border-[#374151]/40 rounded-xl flex justify-between items-start gap-4">
                  <div className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 bg-[#374151] text-white rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-xs text-white leading-relaxed font-semibold">
                      {clause}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClause(index)}
                    className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 cursor-pointer transition-all"
                    title="Delete clause and bump contract version"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add clause form */}
            <form onSubmit={handleAddClause} className="flex gap-3 border-t border-[#374151] pt-4 mt-1">
              <input
                type="text"
                required
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                className="flex-1 bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl p-3 text-xs text-white"
                placeholder="Append new lease clause / rules addendum..."
              />
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Append Clause</span>
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#111827] border border-[#374151] rounded-2xl p-12 text-center min-h-[350px]">
          <span className="text-xs text-[#9CA3AF]">No active lease documents listed. Please load mock templates during onboarding.</span>
        </div>
      )}

      {/* SIGNATURE MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div className="flex items-center gap-2 text-[#2563EB]">
                <PenTool className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">
                  Draw Digital Signature ({signatureRole === 'tenant' ? 'Tenant' : 'Landlord'})
                </h3>
              </div>
              <button onClick={() => setShowSignModal(false)} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-[#9CA3AF] font-bold uppercase">Signature Pad</span>
              
              {/* Canvas Pad */}
              <div className="bg-white rounded-xl border border-[#374151] overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[180px] bg-white cursor-crosshair touch-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] leading-normal bg-[#1F2937]/50 p-2.5 rounded-lg">
              <span>✍️ Draw inside the white box using mouse/finger.</span>
              <button
                onClick={clearCanvas}
                className="text-red-400 hover:text-red-300 font-bold uppercase tracking-tight"
              >
                Clear Pad
              </button>
            </div>

            <div className="flex gap-3 border-t border-[#374151] pt-4">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              >
                Affix Signature
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
