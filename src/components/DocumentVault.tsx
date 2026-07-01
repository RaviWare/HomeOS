import React, { useState } from 'react';
import {
  FolderOpen,
  Upload,
  FileText,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
  Building
} from 'lucide-react';
import { Document } from '../types';
import LegalReader from './LegalReader';
import Pagination from './Pagination';

interface DocumentVaultProps {
  documents: Document[];
  onUploadDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onImportOcrData: (ocrData: any) => void;
}

export default function DocumentVault({
  documents,
  onUploadDocument,
  onDeleteDocument,
  onImportOcrData
}: DocumentVaultProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzingOcr, setAnalyzingOcr] = useState<string | null>(null);
 const [page, setPage] = useState(1);

  // Filter and search
  const filteredDocs = documents.filter((doc) => {
    if (filterCategory !== 'All' && doc.category !== filterCategory) return false;
    if (searchTerm.trim() !== '' && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const PAGE_SIZE = 8;
 const pageCount = Math.max(1, Math.ceil(filteredDocs.length / PAGE_SIZE));
 const curPage = Math.min(Math.max(1, page), pageCount);
 const pageItems = filteredDocs.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
 // Mock template upload / AI OCR process
  const triggerAiOcrUpload = async (docType: 'lease' | 'utility') => {
    setUploading(true);
    
    // Simulate short network delay
    await new Promise((r) => setTimeout(r, 1200));

    let newDoc: Document;
    
    if (docType === 'lease') {
      newDoc = {
        id: `doc-${Date.now()}`,
        name: 'Prestige_Lake_Ridge_Flat_402_Lease.pdf',
        category: 'Lease',
        fileType: 'pdf',
        uploadedAt: new Date().toISOString().split('T')[0],
        size: '1.4 MB',
        url: '#ocr-lease',
        ocrExtractedData: {
          propertyName: 'Prestige Lake Ridge - Flat 402',
          address: '4th Floor, Block C, Prestige Lake Ridge, Subramanyapura, Bengaluru',
          rentAmount: 38000,
          depositAmount: 180000,
          tenantName: 'Rohit Sharma',
          landlordName: 'Sanjay Dutt',
          startDate: '2026-07-01',
          endDate: '2027-06-30',
          clauses: [
            'Rent to be paid by 5th of every month.',
            'No commercial alterations allowed.'
          ]
        }
      };
    } else {
      newDoc = {
        id: `doc-${Date.now()}`,
        name: 'BESCOM_ElectricityBill_July2026.pdf',
        category: 'Utility',
        fileType: 'pdf',
        uploadedAt: new Date().toISOString().split('T')[0],
        size: '280 KB',
        url: '#ocr-bill',
        ocrExtractedData: {
          propertyName: 'Metropolitan Heights - Unit 1402',
          category: 'Electricity',
          amount: 3450,
          dueDate: '2026-08-10',
          provider: 'BESCOM',
          accountNumber: '9284918239'
        }
      };
    }

    onUploadDocument(newDoc);
    setUploading(false);
    setAnalyzingOcr(newDoc.id);
  };

  const handleImportClick = (doc: Document) => {
    if (!doc.ocrExtractedData) return;
    onImportOcrData(doc.ocrExtractedData);
    setAnalyzingOcr(null);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Document Explorer Grid */}
      <div className="flex-1 flex flex-col gap-5">
 <LegalReader />
        
        {/* Top Header bar with search & filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-[#374151] p-4 rounded-2xl">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500"
              placeholder="Search contracts, bills, certificates..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#9CA3AF]" />
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="bg-[#1F2937] border border-[#374151] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Categories</option>
              <option value="Lease">Leases / Contracts</option>
              <option value="Receipt">Rent Receipts</option>
              <option value="Utility">Utility Statements</option>
              <option value="Maintenance">Maintenance Slips</option>
              <option value="Certificate">Property Titles</option>
            </select>
          </div>
        </div>

        {/* Upload box */}
        <div className="bg-[#111827] border border-dashed border-[#374151] hover:border-[#2563EB] rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-[#2563EB]/10 rounded-full border border-[#2563EB]/25 text-[#2563EB]">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Drag & drop files or click to upload</h4>
            <p className="text-[10px] text-[#9CA3AF] mt-1">Accepts PDF, JPG, PNG or DOC (E2E Encrypted & Hashed)</p>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={() => triggerAiOcrUpload('lease')}
              disabled={uploading}
              className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white font-bold text-[10px] py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1 uppercase"
            >
              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Simulate Lease OCR</span>
            </button>
            <button
              onClick={() => triggerAiOcrUpload('utility')}
              disabled={uploading}
              className="bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white font-bold text-[10px] py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1 uppercase"
            >
              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Simulate Utility OCR</span>
            </button>
          </div>
          {uploading && (
            <span className="text-[10px] text-[#2563EB] font-bold animate-pulse">Scanning document and processing AI vision model...</span>
          )}
        </div>

        {/* Files display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pageItems.map((doc) => (
            <div
              key={doc.id}
              className={`bg-[#111827] border rounded-2xl p-4 flex flex-col gap-3 transition-all ${
                analyzingOcr === doc.id ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-[#374151] hover:border-[#4B5563]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-[#1F2937] border border-[#374151] rounded-xl text-[#2563EB]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#2563EB] font-bold uppercase tracking-wider block">{doc.category}</span>
                    <span className="text-xs font-bold text-white block leading-snug line-clamp-1">{doc.name}</span>
                    <span className="text-[9px] text-[#9CA3AF] font-semibold block mt-0.5">{doc.size} • {doc.uploadedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {doc.ocrExtractedData && (
                    <button
                      onClick={() => setAnalyzingOcr(analyzingOcr === doc.id ? null : doc.id)}
                      className="p-1.5 bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/25 rounded-lg text-[9px] font-bold uppercase hover:bg-[#2563EB]/25 cursor-pointer"
                    >
                      AI OCR
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 bg-[#1F2937] hover:bg-red-500/10 rounded-lg text-[#9CA3AF] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Show Extracted OCR data panel */}
              {analyzingOcr === doc.id && doc.ocrExtractedData && (
                <div className="bg-[#1F2937] p-3.5 rounded-xl border border-[#374151]/50 flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center gap-1.5 border-b border-[#374151]/50 pb-1.5">
                    <Cpu className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-[10px] font-bold text-white uppercase">AI Vision OCR Extracted Fields</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#9CA3AF] font-semibold leading-relaxed">
                    {doc.category === 'Lease' ? (
                      <>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Property</span>
                          <span className="text-white block">{doc.ocrExtractedData.propertyName}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Monthly Rent</span>
                          <span className="text-white block">₹{doc.ocrExtractedData.rentAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Deposit</span>
                          <span className="text-white block">₹{doc.ocrExtractedData.depositAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Tenant Name</span>
                          <span className="text-white block">{doc.ocrExtractedData.tenantName}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Provider</span>
                          <span className="text-white block">{doc.ocrExtractedData.provider}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Utility Bill</span>
                          <span className="text-white block">₹{doc.ocrExtractedData.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Account No</span>
                          <span className="text-white block">{doc.ocrExtractedData.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-[#9CA3AF] block uppercase font-bold">Due Date</span>
                          <span className="text-white block">{doc.ocrExtractedData.dueDate}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleImportClick(doc)}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Sync Extracted data to workspace</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      <Pagination page={curPage} total={filteredDocs.length} pageSize={PAGE_SIZE} onPage={setPage} label="documents" />
 </div>

      {/* Right side: Security guidelines */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 flex flex-col gap-3">
          <FolderOpen className="w-5 h-5 text-[#2563EB]" />
          <div>
            <h4 className="text-xs font-bold text-white">E2E Secure Document Cabin</h4>
            <p className="text-[10px] text-[#9CA3AF] mt-1 leading-relaxed">
              HomeOS secures physical leases, utility bill statements, and property certificates with end-to-end client-side encryption.
            </p>
          </div>
          
          <div className="border-t border-[#374151] pt-3 flex flex-col gap-2 text-[10px] text-[#9CA3AF]">
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>SHA-256 validation seals on upload.</span>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span>Auto-OCR reads agreements and extracts financial ledgers immediately.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
