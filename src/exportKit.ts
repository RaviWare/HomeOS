/**
 * Client-side export kit: CSV, Excel (SpreadsheetML), PDF (print HTML), invoices.
 * No extra npm dependencies.
 */

import { formatMoney as formatMoneyCurrency, loadCurrencyPrefs } from "./currency";

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadText(filename: string, content: string, mime: string) {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(columns: string[], rows: (string | number)[][]): string {
  const lines = [columns.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
}

export function downloadCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  downloadText(filename.endsWith(".csv") ? filename : `${filename}.csv`, toCsv(columns, rows), "text/csv;charset=utf-8");
}

/** Excel-compatible SpreadsheetML (.xls) — opens in Excel / Google Sheets / LibreOffice */
export function toExcelXml(sheetName: string, columns: string[], rows: (string | number)[][]): string {
  const esc = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const header = columns
    .map((c) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(c)}</Data></Cell>`)
    .join("");

  const body = rows
    .map((row) => {
      const cells = columns
        .map((_, i) => {
          const v = row[i];
          const isNum = typeof v === "number" && Number.isFinite(v);
          return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${esc(v)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("\n");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EAEAEA" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${esc(sheetName).slice(0, 31)}">
  <Table>
   <Row>${header}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadExcel(filename: string, sheetName: string, columns: string[], rows: (string | number)[][]) {
  const name = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  downloadText(name, toExcelXml(sheetName, columns, rows), "application/vnd.ms-excel");
}

export function openPrintableHtml(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups to generate PDF / print.");
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; line-height: 1.45; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .muted { color: #666; font-size: 11px; }
  .brand { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .logo { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; }
  th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  .right { text-align: right; }
  .total { font-weight: 800; font-size: 14px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #111; color: #fff; font-size: 10px; font-weight: 700; }
  .actions { margin-top: 24px; }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style></head><body>
${bodyHtml}
<div class="actions no-print">
  <p class="muted">Use your browser Print dialog → Save as PDF.</p>
  <button onclick="window.print()" style="padding:10px 18px;font-weight:700;border-radius:8px;border:none;background:#111;color:#fff;cursor:pointer">Print / Save PDF</button>
</div>
<script>setTimeout(function(){ try { window.print(); } catch(e){} }, 350);</script>
</body></html>`);
  win.document.close();
}

export function tableHtml(columns: string[], rows: (string | number)[][]): string {
  const th = columns.map((c) => `<th>${c}</th>`).join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => `<td class="${typeof c === "number" || columns[i]?.toLowerCase().includes("amount") ? "right" : ""}">${c ?? ""}</td>`).join("")}</tr>`
    )
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function downloadPdfReport(opts: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  footerNote?: string;
}) {
  const when = new Date().toLocaleString("en-IN");
  openPrintableHtml(
    opts.title,
    `<div class="brand">
      <div>
        <div class="logo">HomeOS</div>
        <div class="muted">HomeOS · Private home operating system</div>
      </div>
      <div class="right muted">${when}<br/><span class="badge">REPORT</span></div>
    </div>
    <h1>${opts.title}</h1>
    ${opts.subtitle ? `<p class="muted">${opts.subtitle}</p>` : ""}
    ${tableHtml(opts.columns, opts.rows)}
    <p class="muted" style="margin-top:16px">${opts.footerNote || "Generated from your HomeOS workspace."}</p>`
  );
}

export interface InvoiceInput {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  fromName: string;
  fromEmail?: string;
  toName: string;
  toMeta?: string;
  propertyName?: string;
  lineItems: Array<{ description: string; amount: number }>;
  notes?: string;
  currency?: string;
}

/** Format money in display or explicit currency (multi-currency). */
export function formatMoney(n: number, currency?: string) {
  const code = currency || loadCurrencyPrefs().displayCurrency;
  return formatMoneyCurrency(n, code);
}

export function downloadInvoicePdf(inv: InvoiceInput) {
  const total = inv.lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const rows = inv.lineItems.map((l, i) => [i + 1, l.description, formatMoney(l.amount, inv.currency)]);
  openPrintableHtml(
    `Invoice ${inv.invoiceNumber}`,
    `<div class="brand">
      <div>
        <div class="logo">HomeOS</div>
        <div class="muted">Invoice · HomeOS</div>
      </div>
      <div class="right">
        <span class="badge">INVOICE</span><br/>
        <strong>${inv.invoiceNumber}</strong><br/>
        <span class="muted">Issued ${inv.issueDate}${inv.dueDate ? ` · Due ${inv.dueDate}` : ""}</span>
      </div>
    </div>
    <div style="display:flex;gap:32px;margin:20px 0">
      <div style="flex:1">
        <div class="muted">From</div>
        <strong>${inv.fromName}</strong>
        ${inv.fromEmail ? `<div class="muted">${inv.fromEmail}</div>` : ""}
      </div>
      <div style="flex:1">
        <div class="muted">Bill to</div>
        <strong>${inv.toName}</strong>
        ${inv.toMeta ? `<div class="muted">${inv.toMeta}</div>` : ""}
        ${inv.propertyName ? `<div class="muted">${inv.propertyName}</div>` : ""}
      </div>
    </div>
    ${tableHtml(["#", "Description", "Amount"], rows)}
    <p class="total right" style="margin-top:12px">Total: ${formatMoney(total, inv.currency)}</p>
    ${inv.notes ? `<h2>Notes</h2><p class="muted">${inv.notes}</p>` : ""}
    <p class="muted" style="margin-top:24px">Generated with HomeOS. Not a tax-legal document unless you customize it with a professional.</p>`
  );
}

/** Build standard workspace export tables */
export function buildWorkspaceTables(data: {
  properties: any[];
  leases: any[];
  transactions: any[];
  tickets?: any[];
}) {
  const properties = {
    columns: ["Name", "City", "Status", "Rent", "Type"],
    rows: (data.properties || []).map((p) => [
      p.name,
      p.city,
      p.status,
      p.rentAmount ?? p.monthlyRent ?? "",
      p.type || p.propertyType || "",
    ]),
  };
  const leases = {
    columns: ["Property", "Tenant", "Start", "End", "Rent", "Status"],
    rows: (data.leases || []).map((l) => [
      l.propertyName,
      l.tenantName,
      l.startDate,
      l.endDate,
      l.monthlyRent,
      l.status,
    ]),
  };
  const transactions = {
    columns: ["Date", "Property", "Category", "Amount", "Status", "Invoice", "Method"],
    rows: (data.transactions || []).map((t) => [
      t.date,
      t.propertyName,
      t.category,
      t.amount,
      t.status,
      t.invoiceNumber || "",
      t.paymentMethod || "",
    ]),
  };
  const tickets = {
    columns: ["Property", "Title", "Status", "Priority"],
    rows: (data.tickets || []).map((t) => [t.propertyName, t.title, t.status, t.priority || ""]),
  };
  return { properties, leases, transactions, tickets };
}

export function exportFullWorkspace(
  format: "csv" | "excel" | "pdf",
  data: {
    properties: any[];
    leases: any[];
    transactions: any[];
    tickets?: any[];
    workspaceName?: string;
  }
) {
  const tables = buildWorkspaceTables(data);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `homeos-${(data.workspaceName || "workspace").replace(/\s+/g, "-").toLowerCase()}-${stamp}`;

  if (format === "csv") {
    downloadCsv(`${base}-transactions.csv`, tables.transactions.columns, tables.transactions.rows);
    setTimeout(() => downloadCsv(`${base}-properties.csv`, tables.properties.columns, tables.properties.rows), 200);
    setTimeout(() => downloadCsv(`${base}-leases.csv`, tables.leases.columns, tables.leases.rows), 400);
    return;
  }
  if (format === "excel") {
    // Multi-sheet via sequential files (simple & reliable without zip)
    downloadExcel(`${base}-transactions.xls`, "Transactions", tables.transactions.columns, tables.transactions.rows);
    setTimeout(
      () => downloadExcel(`${base}-properties.xls`, "Properties", tables.properties.columns, tables.properties.rows),
      200
    );
    setTimeout(() => downloadExcel(`${base}-leases.xls`, "Leases", tables.leases.columns, tables.leases.rows), 400);
    return;
  }
  // PDF summary of transactions (most useful ledger)
  downloadPdfReport({
    title: "HomeOS Workspace Export",
    subtitle: `${data.workspaceName || "Workspace"} · ${tables.transactions.rows.length} transactions · ${tables.properties.rows.length} properties`,
    columns: tables.transactions.columns,
    rows: tables.transactions.rows.slice(0, 200),
    footerNote:
      tables.transactions.rows.length > 200
        ? `Showing first 200 of ${tables.transactions.rows.length} transactions. Use CSV/Excel for full export.`
        : "Full transaction ledger from your HomeOS workspace.",
  });
}
