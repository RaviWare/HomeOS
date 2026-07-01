 import React from "react";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 
 interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  label?: string;
 }
 export default function Pagination({ page, total, pageSize, onPage, label = "items" }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (cur - 1) * pageSize + 1;
  const end = Math.min(cur * pageSize, total);
  const from = Math.max(1, Math.min(cur - 2, pageCount - 4));
  const to = Math.min(pageCount, from + 4);
  const nums: number[] = [];
  for (let i = from; i <= to; i++) nums.push(i);
  const btn = "min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center";
  return (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-1 border-t border-[#374151]/50">
  <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Showing {start}-{end} of {total.toLocaleString()} {label}</span>
  {pageCount > 1 && (
  <div className="flex items-center gap-1.5">
  <button onClick={() => onPage(cur - 1)} disabled={cur <= 1} className={btn + " bg-[#1F2937] border-[#374151] text-white hover:border-[#2563EB]"}><ChevronLeft className="w-4 h-4" /></button>
  {nums.map((n) => (
  <button key={n} onClick={() => onPage(n)} className={btn + (n === cur ? " bg-[#2563EB] border-[#2563EB] text-white" : " bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:text-white hover:border-[#2563EB]")}>{n}</button>
  ))}
  <button onClick={() => onPage(cur + 1)} disabled={cur >= pageCount} className={btn + " bg-[#1F2937] border-[#374151] text-white hover:border-[#2563EB]"}><ChevronRight className="w-4 h-4" /></button>
  </div>
  )}
  </div>
  );
 }
 
