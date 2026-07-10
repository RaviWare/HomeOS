import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Lease, Transaction } from "../types";
import {
  expectedRentSchedule,
  expectedToTransaction,
  parseCsv,
  reconcile,
  rowToTransaction,
  guessCategory,
  ExpectedRent,
  CsvRow,
  ReconcileResult,
  Category,
} from "../payments";
import { CalendarClock, CheckCircle2, Upload, Sparkles, Wallet, Plus } from "lucide-react";

interface Props {
  leases: Lease[];
  transactions: Transaction[];
  onAddTransactions: (ts: Transaction[]) => void;
}

const CATS: Category[] = [
  "Rent",
  "Channel income",
  "Deposit",
  "Maintenance",
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Repairs",
  "Cleaning",
  "Platform fee",
  "Management fee",
  "Furnishings",
  "Society dues",
  "Tax",
  "Refund",
  "Other",
];

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";

export default function PaymentAutomation({ leases, transactions, onAddTransactions }: Props) {
  const schedule = useMemo(
    () => expectedRentSchedule(leases, transactions, { back: 3, ahead: 2 }),
    [leases, transactions]
  );
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [recon, setRecon] = useState<ReconcileResult | null>(null);
  const [rowCats, setRowCats] = useState<Record<number, Category>>({});
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [matchedDone, setMatchedDone] = useState(false);
  const [openCsv, setOpenCsv] = useState(false);

  const defaultProp = useMemo(() => {
    const a = leases.find((l) => l.status === "Active");
    if (a) return { id: a.propertyId, name: a.propertyName };
    if (transactions[0]) return { id: transactions[0].propertyId, name: transactions[0].propertyName };
    return { id: "", name: "Imported" };
  }, [leases, transactions]);

  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    const t = await f.text();
    setCsvText(t);
    setOpenCsv(true);
  };
  const doParse = () => {
    if (!csvText.trim()) return;
    const rows = parseCsv(csvText);
    setRecon(reconcile(rows, schedule));
    setRowCats({});
    setAdded({});
    setMatchedDone(false);
  };
  const markReceived = (ex: ExpectedRent) => onAddTransactions([expectedToTransaction(ex)]);
  const markAll = () => {
    if (schedule.length) onAddTransactions(schedule.map((e) => expectedToTransaction(e)));
  };
  const importMatched = () => {
    if (recon && recon.matched.length) {
      onAddTransactions(recon.matched.map((m) => rowToTransaction(m.row, { expected: m.expected })));
      setMatchedDone(true);
    }
  };
  const catFor = (row: CsvRow): Category =>
    rowCats[row.index] !== undefined ? rowCats[row.index] : guessCategory(row.description, row.direction);
  const importRow = (row: CsvRow) => {
    onAddTransactions([rowToTransaction(row, { category: catFor(row), prop: defaultProp })]);
    setAdded((m) => ({ ...m, [row.index]: true }));
  };

  return (
    <div className="flex flex-col gap-2.5 h-full">
      <div className={`${panel} p-3.5`}>
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">Automation</h3>
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/10">
                On-device
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium leading-snug">
              Schedule rent & import bank/UPI CSV. Nothing leaves this vault.
            </p>
          </div>
        </div>
      </div>

      <div className={`${panel} p-3.5 flex-1 min-h-0 flex flex-col`}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-white/50" />
            <h4 className="text-[12px] font-black text-white">Rent schedule</h4>
          </div>
          <div className="flex gap-2">
            <label className="h-8 px-2.5 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white inline-flex items-center gap-1 cursor-pointer hover:border-white/25">
              <Upload className="w-3 h-3" />
              CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
            {schedule.length > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="h-8 px-2.5 rounded-lg bg-white text-black text-[10px] font-bold cursor-pointer"
              >
                Mark all
              </button>
            )}
          </div>
        </div>

        {schedule.length === 0 ? (
          <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] bg-[#121215] border border-[#1F1F23] rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            Caught up on rent. New dues appear automatically.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5">
            {schedule.map((e) => (
              <div
                key={e.key}
                className="flex items-center gap-2.5 bg-[#121215]/60 border border-[#1F1F23] rounded-xl px-3 py-2"
              >
                <Wallet className="w-3.5 h-3.5 text-white/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white truncate">
                    {e.propertyName}{" "}
                    <span className="text-[#8E8E93] font-medium">· {e.label}</span>
                  </div>
                  <div className="text-[10px] text-[#6B7280]">Due {e.dueDate}</div>
                </div>
                <div className="text-[12px] font-black text-white shrink-0 tabular-nums">
                  {inr(e.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => markReceived(e)}
                  className="h-7 px-2 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white hover:border-white/30 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(openCsv || fileName) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-[#1F1F23] space-y-2"
          >
            <p className="text-[11px] text-[#8E8E93] font-medium">
              File: <span className="text-white font-bold">{fileName || "pasted"}</span>
            </p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-[#121215] border border-[#1F1F23] p-2.5 text-[11px] text-white font-mono"
              placeholder="Paste CSV…"
            />
            <button
              type="button"
              onClick={doParse}
              className="h-9 px-3 rounded-xl bg-white text-black text-[11px] font-bold cursor-pointer"
            >
              Parse & reconcile
            </button>
            {recon && (
              <div className="text-[11px] text-[#8E8E93] space-y-1.5">
                <p>
                  Matched {recon.matched.length} · Unmatched {recon.unmatched.length}
                </p>
                {recon.matched.length > 0 && !matchedDone && (
                  <button
                    type="button"
                    onClick={importMatched}
                    className="h-8 px-2.5 rounded-lg border border-[#10B981]/30 text-[#10B981] text-[10px] font-bold cursor-pointer"
                  >
                    Import matched
                  </button>
                )}
                {recon.unmatched.slice(0, 4).map((row) => (
                  <div
                    key={row.index}
                    className="flex items-center gap-2 bg-[#121215] border border-[#1F1F23] rounded-lg px-2 py-1.5"
                  >
                    <span className="truncate flex-1 text-white font-semibold text-[10px]">
                      {row.description || "Row " + row.index}
                    </span>
                    <select
                      value={catFor(row)}
                      onChange={(e) =>
                        setRowCats((m) => ({ ...m, [row.index]: e.target.value as Category }))
                      }
                      className="h-7 rounded-md bg-black border border-[#1F1F23] text-[9px] text-white cursor-pointer"
                    >
                      {CATS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!!added[row.index]}
                      onClick={() => importRow(row)}
                      className="h-7 px-2 rounded-md bg-white text-black text-[9px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {added[row.index] ? "Added" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
