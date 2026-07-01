 // Local, deterministic legal-document reader for HomeOS. No API key, runs on-device.
 // Reads lease / rental / agreement text, extracts key terms, explains clauses,
 // flags risks, and detects missing standard clauses.
 export interface LegalTerm { label: string; value: string; found: boolean; }
 export interface LegalClause { category: string; title: string; plain: string; severity: string; }
 export interface LegalAnalysis {
  docType: string;
  summary: string[];
  terms: LegalTerm[];
  clauses: LegalClause[];
  risks: string[];
  missing: string[];
  wordCount: number;
 }
 const inr = (s: string | null) => (s ? "₹" + Number(s).toLocaleString("en-IN") : "");
 export function analyzeLegalText(raw: string): LegalAnalysis {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const words = lower.split(" ").filter(Boolean);
  const has = (re: RegExp) => re.test(lower);
  const grabNum = (re: RegExp) => { const m = lower.match(re); return m ? m[1].replace(/[, ]/g, "") : null; };
  const rent = grabNum(/(?:monthly rent|rent of|rent is|rent shall be|rent amount|rent[:\-])\s*(?:rs\.?|inr|₹)?\s*([\d, ]{3,})/);
  const deposit = grabNum(/(?:security deposit|interest free deposit|deposit of|deposit is|deposit amount|deposit[:\-])\s*(?:rs\.?|inr|₹)?\s*([\d, ]{3,})/);
  const noticeM = lower.match(/notice period (?:of|is|shall be|:)?\s*([\d]+)\s*(months|month|days|day)/) || lower.match(/([\d]+)\s*(months|month|days|day)[^.]{0,12}?notice/);
  const notice = noticeM ? noticeM[1] + " " + noticeM[2] : null;
  const lockM = lower.match(/lock[\s\-]?in(?:\s*period)?(?:\s*(?:of|is|shall be|will be|:))?\s*([\d]+)\s*(months|month|years|year)/);
  const lockin = lockM ? lockM[1] + " " + lockM[2] : null;
  const lockMonths = lockM ? parseInt(lockM[1], 10) * (/year/.test(lockM[2]) ? 12 : 1) : 0;
  const escM = lower.match(/([\d]+)\s*(?:%|percent|per cent)\s*(?:escalation|increase|increment|hike)/) || lower.match(/(?:escalation|increase|increment|hike)[^.]{0,24}?([\d]+)\s*(?:%|percent|per cent)/);
  const escalation = escM ? escM[1] + "%" : null;
  const escPct = escM ? parseInt(escM[1], 10) : 0;
  const lateM = lower.match(/late\s*(?:payment\s*)?(?:fee|charge|penalty)[^.]{0,40}?(?:rs\.?|inr|₹)?\s*([\d, ]{2,})/);
  const lateFee = lateM ? lateM[1].replace(/[, ]/g, "") : null;
  const dateMatches = text.match(/\b([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+[0-9]{4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b/g) || [];
  const startDate = dateMatches[0] || null;
  const endDate = dateMatches[1] || null;
  const sublet = has(/sub[\s\-]?let/);
  const pets = has(/\bpets?\b/);
  const maintenance = has(/maintenance|repairs?/);
  const termination = has(/terminat/);
  const refund = has(/refund/);
  const nonRefundable = has(/non[\s\-]?refundable/);
  const autoRenew = has(/auto(?:matic\w*)?[\s\-]?renew|renew\w*\s*automatically/);
  const forfeit = has(/forfeit/);
  const dispute = has(/arbitration|dispute|jurisdiction|court of/);
  const docType = /lease|rental|tenancy|leave and licen/.test(lower) ? "Rental / Lease Agreement" : (/agreement|contract|deed/.test(lower) ? "Legal Agreement" : "Document");
 
  const terms: LegalTerm[] = [
  { label: "Monthly Rent", value: rent ? inr(rent) : "not specified", found: !!rent },
  { label: "Security Deposit", value: deposit ? inr(deposit) : "not specified", found: !!deposit },
  { label: "Start Date", value: startDate || "not specified", found: !!startDate },
  { label: "End Date", value: endDate || "not specified", found: !!endDate },
  { label: "Notice Period", value: notice || "not specified", found: !!notice },
  { label: "Lock-in Period", value: lockin || "not specified", found: !!lockin },
  { label: "Rent Escalation", value: escalation || "not specified", found: !!escalation },
  { label: "Late Fee", value: lateFee ? inr(lateFee) : "not specified", found: !!lateFee }
  ];
  const clauses: LegalClause[] = [];
  if (lockin) clauses.push({ category: "Lock-in", title: "Lock-in of " + lockin, plain: "You are committed to stay for at least " + lockin + ". Leaving earlier may forfeit your deposit or require paying the balance.", severity: lockMonths >= 11 ? "risk" : "watch" });
  if (escalation) clauses.push({ category: "Escalation", title: "Rent rises " + escalation + " on renewal", plain: "Your rent increases by about " + escalation + " each renewal, which compounds over the years.", severity: escPct >= 10 ? "risk" : "watch" });
  if (notice) clauses.push({ category: "Notice", title: notice + " notice to vacate", plain: "You must inform the landlord " + notice + " before leaving, or you may lose part of your deposit.", severity: "info" });
  if (deposit) clauses.push({ category: "Deposit", title: "Security deposit " + inr(deposit), plain: refund ? "The deposit is refundable, usually after deductions for damages." : "The text does not clearly state how or when the deposit is refunded.", severity: refund ? "info" : "watch" });
  if (sublet) clauses.push({ category: "Subletting", title: "Subletting clause present", plain: "There are rules about subletting. Usually it is not allowed without written consent from the owner.", severity: "info" });
  if (pets) clauses.push({ category: "Pets", title: "Pet clause present", plain: "The agreement mentions pets. Check whether they are allowed and under what conditions.", severity: "info" });
  if (maintenance) clauses.push({ category: "Maintenance", title: "Maintenance terms present", plain: "There are maintenance and repair responsibilities. Confirm which side pays for what.", severity: "info" });
  if (termination) clauses.push({ category: "Termination", title: "Termination clause present", plain: "There are conditions under which either party can end the agreement early.", severity: "info" });
  if (autoRenew) clauses.push({ category: "Auto-renewal", title: "Automatic renewal", plain: "The agreement may renew automatically. Set a reminder so you are not committed to another term unintentionally.", severity: "watch" });
  const risks: string[] = [];
  if (lockMonths >= 11) risks.push("Long lock-in (" + lockin + "). You cannot leave early without a penalty.");
  if (escPct >= 10) risks.push("High rent escalation (" + escalation + ") on renewal.");
  if (deposit && !refund) risks.push("Deposit refund terms are not clearly stated.");
  if (nonRefundable) risks.push("A non-refundable amount is mentioned. Confirm exactly what is non-refundable.");
  if (forfeit) risks.push("The agreement mentions forfeiture. Read those conditions carefully.");
  if (autoRenew) risks.push("Automatic renewal clause. Give notice in time or you may be locked into another term.");
  if (!notice) risks.push("No clear notice period found. Clarify how much notice you must give before leaving.");
  const missing: string[] = [];
  if (!notice) missing.push("Notice period (warning before vacating)");
  if (!deposit) missing.push("Security deposit amount");
  if (!refund) missing.push("Security deposit refund timeline");
  if (!maintenance) missing.push("Maintenance and repair responsibility");
  if (!escalation) missing.push("Rent escalation on renewal");
  if (!termination) missing.push("Termination conditions");
  if (!dispute) missing.push("Dispute resolution / jurisdiction");
  const summary: string[] = [];
  summary.push("This appears to be a " + docType.toLowerCase() + " (" + words.length + " words read).");
  if (rent || deposit) summary.push("Rent: " + (rent ? inr(rent) : "not specified") + " per month. Deposit: " + (deposit ? inr(deposit) : "not specified") + ".");
  if (startDate || endDate) summary.push("Term: " + (startDate || "?") + " to " + (endDate || "?") + ".");
  if (notice || lockin) summary.push("Notice: " + (notice || "not specified") + ". Lock-in: " + (lockin || "none found") + ".");
  summary.push(risks.length ? "Top thing to watch: " + risks[0] : "No major red flags detected in the text, but always read the full document.");
  return { docType, summary, terms, clauses, risks, missing, wordCount: words.length };
 }
 
 export function answerLegalQuestion(q: string, raw: string, a: LegalAnalysis): string {
  const lq = (q || "").toLowerCase();
  const term = (label: string) => a.terms.find((t) => t.label.toLowerCase().indexOf(label) >= 0);
  const clause = (cat: string) => a.clauses.find((c) => c.category === cat);
  if (/notice/.test(lq)) { const t = term("notice"); return t && t.found ? "Notice period: " + t.value + "." : "No clear notice period is stated. Confirm it with your landlord."; }
  if (/deposit/.test(lq)) { const t = term("deposit"); const r = a.risks.find((x) => /refund/i.test(x)); return (t && t.found ? "Security deposit: " + t.value + ". " : "Deposit amount is not clearly stated. ") + (r ? "Refund terms are unclear." : "Refund terms appear to be covered."); }
  if (/rent/.test(lq) && !/escalat|increase|hike/.test(lq)) { const t = term("monthly rent"); return t && t.found ? "Monthly rent: " + t.value + "." : "Rent is not clearly stated in the text."; }
  if (/lock/.test(lq)) { const t = term("lock-in"); return t && t.found ? "Lock-in period: " + t.value + "." : "No lock-in period found in the text."; }
  if (/escalat|increase|hike/.test(lq)) { const t = term("escalation"); return t && t.found ? "Rent escalation: " + t.value + " on renewal." : "No rent escalation clause found."; }
  if (/sublet/.test(lq)) { const c = clause("Subletting"); return c ? c.plain : "No subletting clause found in the text."; }
  if (/pet/.test(lq)) { const c = clause("Pets"); return c ? c.plain : "No pet clause found in the text."; }
  if (/terminat|cancel|end the/.test(lq)) { const c = clause("Termination"); return c ? c.plain : "No explicit termination clause found in the text."; }
  if (/risk|red flag|concern|watch|problem|is it safe|fair/.test(lq)) return a.risks.length ? "Things to watch:\n- " + a.risks.join("\n- ") : "No major red flags detected, but read the full document.";
  if (/missing|absent|not (?:mentioned|covered)|should.*add|incomplete/.test(lq)) return a.missing.length ? "These standard terms seem missing or unclear:\n- " + a.missing.join("\n- ") + "\nConfirm them with your landlord and add them." : "All standard terms appear to be covered.";
  if (/summary|overview|explain|tldr|gist|what is this/.test(lq)) return a.summary.join("\n");
  const kw = lq.split(/[^a-z0-9]+/).filter((w) => w.length >= 4)[0];
  if (kw) { const idx = raw.toLowerCase().indexOf(kw); if (idx >= 0) { const snippet = raw.slice(Math.max(0, idx - 60), idx + 200).replace(/\s+/g, " ").trim(); return "Here is the relevant part of the document:\n..." + snippet + "..."; } }
  return "I could not find that in the document. Ask about rent, deposit, notice, lock-in, escalation, termination, red flags, or what is missing.";
 }
 
