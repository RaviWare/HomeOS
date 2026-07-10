import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen,
  Upload,
  FileText,
  Search,
  Trash2,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  ShieldCheck,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  X,
  Eye,
  Sparkles,
  AlertCircle,
  CloudUpload,
  Lock,
} from "lucide-react";
import { Document } from "../types";
import LegalReader from "./LegalReader";
import Pagination from "./Pagination";
import { downloadCsv } from "../exportKit";

interface DocumentVaultProps {
  documents: Document[];
  onUploadDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
  onImportOcrData: (ocrData: any) => void;
}

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";
const CATEGORIES = ["All", "Lease", "Receipt", "Utility", "Maintenance", "Certificate", "Other"] as const;

type DocCategory = Document["category"];

function formatBytes(n: number): string {
  if (!n || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(file: File): Document["fileType"] {
  const t = (file.type || "").toLowerCase();
  const n = file.name.toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/i.test(n)) return "image";
  if (t.includes("sheet") || t.includes("excel") || /\.(xlsx?|csv)$/i.test(n)) return "excel";
  return "doc";
}

function guessCategory(name: string): DocCategory {
  const n = name.toLowerCase();
  if (/lease|agreement|rent.?deed|leave.?licen/.test(n)) return "Lease";
  if (/receipt|invoice|payment|ack/.test(n)) return "Receipt";
  if (/electric|water|gas|internet|utility|bescom|bill/.test(n)) return "Utility";
  if (/repair|maintenance|ticket|plumber|ac /.test(n)) return "Maintenance";
  if (/title|deed|certificate|khata|ec\b|registry/.test(n)) return "Certificate";
  return "Other";
}

function typeIcon(ft: Document["fileType"]) {
  if (ft === "image") return ImageIcon;
  if (ft === "excel") return FileSpreadsheet;
  if (ft === "pdf") return FileText;
  return File;
}

function typeBadge(ft: Document["fileType"]) {
  const map: Record<Document["fileType"], string> = {
    pdf: "PDF",
    image: "IMG",
    doc: "DOC",
    excel: "XLS",
  };
  return map[ft] || "FILE";
}

export default function DocumentVault({
  documents,
  onUploadDocument,
  onDeleteDocument,
  onImportOcrData,
}: DocumentVaultProps) {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzingOcr, setAnalyzingOcr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [preview, setPreview] = useState<Document | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const showToast = useCallback((type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const stats = useMemo(() => {
    const byCat: Record<string, number> = {};
    let withOcr = 0;
    for (const d of documents) {
      byCat[d.category] = (byCat[d.category] || 0) + 1;
      if (d.ocrExtractedData) withOcr += 1;
    }
    return {
      total: documents.length,
      leases: byCat.Lease || 0,
      utilities: byCat.Utility || 0,
      receipts: byCat.Receipt || 0,
      withOcr,
    };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return documents.filter((doc) => {
      if (filterCategory !== "All" && doc.category !== filterCategory) return false;
      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.fileType || "").toLowerCase().includes(q)
      );
    });
  }, [documents, filterCategory, searchTerm]);

  const PAGE_SIZE = 9;
  const pageCount = Math.max(1, Math.ceil(filteredDocs.length / PAGE_SIZE));
  const curPage = Math.min(Math.max(1, page), pageCount);
  const pageItems = filteredDocs.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const ingestFiles = async (files: FileList | File[]) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    const allowed = list.filter((f) => {
      const n = f.name.toLowerCase();
      const ok =
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.type.includes("word") ||
        f.type.includes("document") ||
        f.type.includes("sheet") ||
        f.type.includes("excel") ||
        f.type === "text/plain" ||
        f.type === "text/csv" ||
        /\.(pdf|png|jpe?g|gif|webp|heic|docx?|xlsx?|csv|txt|rtf)$/i.test(n);
      return ok;
    });

    if (!allowed.length) {
      showToast("err", "Unsupported file type. Use PDF, image, DOC, or spreadsheet.");
      return;
    }

    setUploading(true);
    try {
      for (const file of allowed) {
        // Small delay so UI feels deliberate when multi-uploading
        await new Promise((r) => setTimeout(r, 180));
        const url = URL.createObjectURL(file);
        const doc: Document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          category: guessCategory(file.name),
          fileType: detectFileType(file),
          uploadedAt: new Date().toISOString().slice(0, 10),
          size: formatBytes(file.size),
          url,
        };
        onUploadDocument(doc);
      }
      showToast(
        "ok",
        allowed.length === 1
          ? `“${allowed[0].name}” secured in vault`
          : `${allowed.length} files secured in vault`
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const triggerAiOcrUpload = async (docType: "lease" | "utility") => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 900));

    let newDoc: Document;
    if (docType === "lease") {
      newDoc = {
        id: `doc-${Date.now()}`,
        name: "Prestige_Lake_Ridge_Flat_402_Lease.pdf",
        category: "Lease",
        fileType: "pdf",
        uploadedAt: new Date().toISOString().slice(0, 10),
        size: "1.4 MB",
        url: "#ocr-lease",
        ocrExtractedData: {
          propertyName: "Prestige Lake Ridge - Flat 402",
          address: "4th Floor, Block C, Prestige Lake Ridge, Subramanyapura, Bengaluru",
          rentAmount: 38000,
          depositAmount: 180000,
          tenantName: "You",
          landlordName: "Property Owner",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          clauses: [
            "Rent to be paid by 5th of every month.",
            "No commercial alterations allowed.",
          ],
        },
      };
    } else {
      newDoc = {
        id: `doc-${Date.now()}`,
        name: "BESCOM_ElectricityBill_July2026.pdf",
        category: "Utility",
        fileType: "pdf",
        uploadedAt: new Date().toISOString().slice(0, 10),
        size: "280 KB",
        url: "#ocr-bill",
        ocrExtractedData: {
          propertyName: "Current home",
          category: "Electricity",
          amount: 3450,
          dueDate: "2026-08-10",
          provider: "BESCOM",
          accountNumber: "9284918239",
        },
      };
    }

    onUploadDocument(newDoc);
    setUploading(false);
    setAnalyzingOcr(newDoc.id);
    setPage(1);
    setFilterCategory("All");
    setSearchTerm("");
    showToast("ok", "OCR sample ready — review fields and sync to workspace");
  };

  const handleImportClick = (doc: Document) => {
    if (!doc.ocrExtractedData) return;
    onImportOcrData(doc.ocrExtractedData);
    setAnalyzingOcr(null);
    showToast("ok", "Extracted fields synced into your workspace");
  };

  const exportIndex = () => {
    downloadCsv(
      `homeos-documents-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Category", "Type", "Size", "Uploaded", "Has OCR"],
      filteredDocs.map((d) => [
        d.name,
        d.category,
        d.fileType,
        d.size,
        d.uploadedAt,
        d.ocrExtractedData ? "Yes" : "No",
      ])
    );
    showToast("ok", "Document index exported as CSV");
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragOver(false);
    if (e.dataTransfer.files?.length) void ingestFiles(e.dataTransfer.files);
  };

  const openDoc = (doc: Document) => {
    if (doc.url && !doc.url.startsWith("#") && !doc.url.startsWith("thumb://")) {
      window.open(doc.url, "_blank", "noopener,noreferrer");
      return;
    }
    setPreview(doc);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 sm:p-5 overflow-y-auto max-w-7xl w-full mx-auto pb-24 safe-bottom">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed top-16 right-4 z-50 max-w-sm px-4 py-3 rounded-xl border shadow-2xl flex items-start gap-2.5 ${
              toast.type === "ok"
                ? "bg-[#0A0A0C] border-emerald-500/30 text-white"
                : "bg-[#0A0A0C] border-red-500/30 text-white"
            }`}
          >
            {toast.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`${panel} px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight">Document Vault</h1>
            <p className="text-[11px] text-[#8E8E93] font-medium truncate">
              Encrypted cabin · OCR import · legal reader
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={exportIndex}
            className="h-10 px-3 rounded-xl border border-[#1F1F23] bg-[#121215] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-10 px-3 rounded-xl bg-white text-black text-xs font-black inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </motion.button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "In vault", value: stats.total, hint: "All files" },
          { label: "Leases", value: stats.leases, hint: "Agreements" },
          { label: "Utilities", value: stats.utilities, hint: "Bills" },
          { label: "OCR ready", value: stats.withOcr, hint: "Extractable" },
        ].map((s) => (
          <div key={s.label} className={`${panel} px-3.5 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">{s.label}</p>
            <p className="text-xl font-black text-white tabular-nums mt-0.5">{s.value}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        {/* Main column */}
        <div className="xl:col-span-8 flex flex-col gap-3 min-w-0">
          {/* Search + filters */}
          <div className={`${panel} p-3 sm:p-4 flex flex-col gap-3`}>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-11 bg-[#121215] border border-[#1F1F23] focus:border-white/25 focus:outline-none rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-[#6B7280]"
                  placeholder="Search contracts, bills, certificates…"
                  aria-label="Search documents"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = filterCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setFilterCategory(c);
                      setPage(1);
                    }}
                    className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      active
                        ? "bg-white text-black border-white"
                        : "bg-[#121215] text-[#8E8E93] border-[#1F1F23] hover:text-white hover:border-white/20"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drop zone — static icon, state via border/bg only */}
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`${panel} relative overflow-hidden p-6 sm:p-8 text-center cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
              dragOver
                ? "border-white/40 bg-white/[0.04]"
                : "hover:border-white/15 hover:bg-white/[0.02]"
            } ${uploading ? "pointer-events-none opacity-70" : ""}`}
            aria-label="Upload documents"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.heic,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void ingestFiles(e.target.files);
              }}
            />

            <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors duration-200 ${
                  dragOver
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-white/[0.04] border-white/10 text-white/80"
                }`}
              >
                <CloudUpload className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight">
                  {dragOver ? "Release to secure files" : "Drop files here"}
                </h3>
                <p className="text-[11px] text-[#8E8E93] mt-1 leading-relaxed">
                  or click to browse · PDF, JPG, PNG, DOC, XLS · client-side vault
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void triggerAiOcrUpload("lease");
                  }}
                  disabled={uploading}
                  className="h-9 px-3 rounded-lg border border-[#1F1F23] bg-[#121215] text-[11px] font-bold text-white inline-flex items-center gap-1.5 hover:border-white/20 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5 text-white/60" />
                  Sample lease OCR
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void triggerAiOcrUpload("utility");
                  }}
                  disabled={uploading}
                  className="h-9 px-3 rounded-lg border border-[#1F1F23] bg-[#121215] text-[11px] font-bold text-white inline-flex items-center gap-1.5 hover:border-white/20 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5 text-white/60" />
                  Sample utility OCR
                </button>
              </div>

              {uploading && (
                <p className="text-[11px] font-bold text-white/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Processing…
                </p>
              )}
            </div>
          </div>

          {/* File grid */}
          {pageItems.length === 0 ? (
            <div className={`${panel} px-6 py-14 text-center`}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="w-5 h-5 text-white/50" />
              </div>
              <p className="text-sm font-black text-white">No documents match</p>
              <p className="text-[11px] text-[#8E8E93] mt-1 max-w-xs mx-auto">
                {documents.length === 0
                  ? "Upload your first lease or bill to start the vault."
                  : "Try another search or category filter."}
              </p>
              {documents.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-4 h-10 px-4 rounded-xl bg-white text-black text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload file
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pageItems.map((doc) => {
                const Icon = typeIcon(doc.fileType);
                const expanded = analyzingOcr === doc.id;
                const ocrOpen = expanded && !!doc.ocrExtractedData;
                return (
                  <article
                    key={doc.id}
                    className={`${panel} p-3.5 flex flex-col gap-3 transition-colors ${
                      ocrOpen ? "border-white/25 ring-1 ring-white/10" : "hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#121215] border border-[#1F1F23] flex items-center justify-center shrink-0 relative">
                        <Icon className="w-4 h-4 text-white/80" />
                        <span className="absolute -bottom-1 -right-1 text-[8px] font-black uppercase tracking-wide bg-[#1F1F23] text-[#8E8E93] border border-[#2E2E33] rounded px-1 py-px">
                          {typeBadge(doc.fileType)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93]">
                          {doc.category}
                        </span>
                        <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-2 break-all">
                          {doc.name}
                        </h4>
                        <p className="text-[10px] text-[#6B7280] font-medium mt-0.5 tabular-nums">
                          {doc.size} · {doc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-auto pt-0.5">
                      <button
                        type="button"
                        onClick={() => openDoc(doc)}
                        className="flex-1 h-8 rounded-lg border border-[#1F1F23] bg-[#121215] text-[10px] font-bold text-white inline-flex items-center justify-center gap-1 hover:border-white/20 cursor-pointer"
                        title="Open / preview"
                      >
                        <Eye className="w-3 h-3" /> Open
                      </button>
                      {doc.ocrExtractedData && (
                        <button
                          type="button"
                          onClick={() => setAnalyzingOcr(expanded ? null : doc.id)}
                          className={`h-8 px-2.5 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                            expanded
                              ? "bg-white text-black border-white"
                              : "bg-[#121215] text-white border-[#1F1F23] hover:border-white/20"
                          }`}
                        >
                          <Sparkles className="w-3 h-3" /> OCR
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(doc.id)}
                        className="h-8 w-8 rounded-lg border border-[#1F1F23] bg-[#121215] text-[#8E8E93] hover:text-red-400 hover:border-red-500/30 inline-flex items-center justify-center cursor-pointer"
                        aria-label={`Delete ${doc.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {ocrOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3 flex flex-col gap-2.5">
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-white/60" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                                Extracted fields
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {doc.category === "Lease" ? (
                                <>
                                  <Field label="Property" value={doc.ocrExtractedData.propertyName} />
                                  <Field
                                    label="Monthly rent"
                                    value={`₹${Number(doc.ocrExtractedData.rentAmount || 0).toLocaleString("en-IN")}`}
                                  />
                                  <Field
                                    label="Deposit"
                                    value={`₹${Number(doc.ocrExtractedData.depositAmount || 0).toLocaleString("en-IN")}`}
                                  />
                                  <Field label="Tenant" value={doc.ocrExtractedData.tenantName} />
                                </>
                              ) : (
                                <>
                                  <Field label="Provider" value={doc.ocrExtractedData.provider} />
                                  <Field
                                    label="Amount"
                                    value={`₹${Number(doc.ocrExtractedData.amount || 0).toLocaleString("en-IN")}`}
                                  />
                                  <Field label="Account" value={doc.ocrExtractedData.accountNumber} />
                                  <Field label="Due" value={doc.ocrExtractedData.dueDate} />
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleImportClick(doc)}
                              className="w-full h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Database className="w-3.5 h-3.5" />
                              Sync to workspace
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          )}

          <div className={`${panel} px-3 sm:px-4 py-2`}>
            <Pagination
              page={curPage}
              total={filteredDocs.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
              label="documents"
            />
          </div>

          {/* Legal reader collapsible */}
          <div className={`${panel} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setLegalOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">Legal document reader</p>
                  <p className="text-[11px] text-[#8E8E93] truncate">
                    Paste a lease · plain-English risks · stays on device
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] shrink-0">
                {legalOpen ? "Hide" : "Open"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {legalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-[#1F1F23]"
                >
                  <div className="p-3 sm:p-4">
                    <LegalReader embedded />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side rail */}
        <aside className="xl:col-span-4 flex flex-col gap-3 xl:sticky xl:top-4">
          <div className={`${panel} p-4 flex flex-col gap-3`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Secure cabin</h3>
                <p className="text-[10px] text-[#8E8E93]">Client-side vault posture</p>
              </div>
            </div>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">
              Leases, bills, and titles stay in your HomeOS workspace. Prefer not to upload government
              ID scans — keep those offline.
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                "Files you pick are stored in this browser vault",
                "SHA-style integrity seal on every upload event",
                "OCR samples map fields into properties & ledger",
                "Export a clean index for accountants anytime",
              ].map((t) => (
                <li key={t} className="flex gap-2 items-start text-[11px] text-[#A1A1AA] leading-snug">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${panel} p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-2">
              Category mix
            </p>
            <div className="flex flex-col gap-2">
              {(["Lease", "Receipt", "Utility", "Maintenance", "Certificate", "Other"] as DocCategory[]).map(
                (c) => {
                  const count = documents.filter((d) => d.category === c).length;
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setFilterCategory(c);
                        setPage(1);
                      }}
                      className="text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-white group-hover:underline">{c}</span>
                        <span className="tabular-nums text-[#8E8E93]">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#121215] border border-[#1F1F23] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white/70 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className={`${panel} p-4 flex flex-col gap-2`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Quick tips</p>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Name files clearly (e.g. <span className="text-white font-semibold">2026_lease_home.pdf</span>) —
              the vault auto-suggests category from the name.
            </p>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Use <span className="text-white font-semibold">Sample lease OCR</span> to try the full import
              path into Property Hub and Ledger.
            </p>
          </div>
        </aside>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${panel} w-full max-w-sm p-5 shadow-2xl`}
            >
              <h3 className="text-base font-black text-white">Delete document?</h3>
              <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed">
                This removes the file from your vault. Workspace records created from OCR stay unless
                you delete those separately.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-10 rounded-xl border border-[#1F1F23] bg-[#121215] text-xs font-bold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDocument(confirmDelete);
                    if (analyzingOcr === confirmDelete) setAnalyzingOcr(null);
                    setConfirmDelete(null);
                    showToast("ok", "Document removed from vault");
                  }}
                  className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-black cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview modal for non-blob docs */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${panel} w-full max-w-md p-5 shadow-2xl`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    {preview.category} · {typeBadge(preview.fileType)}
                  </p>
                  <h3 className="text-base font-black text-white mt-0.5 break-all">{preview.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="w-8 h-8 rounded-lg border border-[#1F1F23] flex items-center justify-center text-[#8E8E93] hover:text-white cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <dt className="text-[#6B7280] font-bold uppercase text-[9px]">Size</dt>
                  <dd className="text-white font-semibold mt-0.5">{preview.size}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280] font-bold uppercase text-[9px]">Uploaded</dt>
                  <dd className="text-white font-semibold mt-0.5">{preview.uploadedAt}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#6B7280] font-bold uppercase text-[9px]">Reference</dt>
                  <dd className="text-white font-semibold mt-0.5 break-all font-mono text-[10px]">
                    {preview.url || "—"}
                  </dd>
                </div>
              </dl>
              {preview.ocrExtractedData && (
                <button
                  type="button"
                  onClick={() => {
                    setAnalyzingOcr(preview.id);
                    setPreview(null);
                  }}
                  className="mt-4 w-full h-10 rounded-xl bg-white text-black text-xs font-black cursor-pointer"
                >
                  View OCR fields
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="text-[9px] text-[#6B7280] block uppercase font-bold tracking-wide">{label}</span>
      <span className="text-[11px] text-white font-semibold block truncate mt-0.5">{value ?? "—"}</span>
    </div>
  );
}
