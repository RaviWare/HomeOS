import React, { useState } from "react";
import { ShieldCheck, ScrollText, AlertTriangle, Server, EyeOff, Lock, Database } from "lucide-react";

type Section = { h: string; p: string[] };

const UPDATED = "Last updated 30 June 2026";

const PRIVACY: Section[] = [
{ h: "Our approach in one line", p: [
"HomeOS is privacy-first and local-first. Your data stays on your device by default.",
"We practice data minimization: we ask only for information that, even if exposed, would not directly harm you. We do not want your most sensitive documents, and the app is built so that you do not need to share them."
] },
{ h: "What this policy covers", p: [
"This policy explains what HomeOS collects and does not collect, how information is stored, and the choices available to you.",
"HomeOS is open-source software that you can self-host. If you use a copy hosted by another person or business, that host is responsible for how they handle your data."
] },
{ h: "Local-first by default", p: [
"The individual HomeOS app runs in your browser and keeps your records in local storage on your own device. By default, your properties, payments, leases, and documents are not sent to any server that we control.",
"Clearing your browser storage or switching to another device means the data does not follow you unless you export it yourself."
] },
{ h: "Data minimization and what to store", p: [
"We deliberately build HomeOS around low-sensitivity data such as amounts, dates, durations, categories, and labels that you choose.",
"We strongly discourage uploading original identity or property documents. Please do not store Aadhaar numbers, PAN, full bank account numbers, signatures, or scans of original title or identity documents inside the app.",
"If you need to reference such a document, redact the sensitive parts first, or keep the original only on your own device. The aim is that, even in the unlikely event of exposure, the information is not enough to directly harm you or to impersonate you."
] },
{ h: "How we classify data", p: [
"Green, safe to store: rent amounts, due dates, term lengths, escalation percentages, expense categories, and labels that you pick.",
"Yellow, stored masked or kept on device: a property nickname instead of a full address, the last few digits of an account instead of the whole number, and a display name that you choose.",
"Red, never stored on a server we run: government identity numbers, full account numbers, signatures, and original document scans. These belong on your own device only."
] },
{ h: "Documents and on-device processing", p: [
"The Legal Document Reader and any optical character recognition features are designed to run on your device. Where a feature reads a document, it aims to extract only the structured fields it needs, such as rent, dates, and notice period, and to avoid keeping the original image.",
"You stay in control of the source file at all times."
] },
{ h: "Encryption", p: [
"Exports and backups can be protected with strong encryption, using AES-256-GCM with a key derived from your passphrase.",
"For any optional sync that we may offer in future, the intent is end-to-end encryption: data is encrypted on your device before it leaves, so a server only ever holds content that it cannot read.",
"To be honest about the limits: data kept in ordinary browser storage on your own device is not encrypted at rest by the browser, so please protect your device with a screen lock and a strong account password."
] },
{ h: "Analytics and product improvement", p: [
"HomeOS does not sell your data. Any analytics that help us improve the product are opt-in and turned off by default.",
"When you choose to turn them on, they are limited to de-identified and aggregated signals, for example that a long lock-in clause was flagged, and never include who you are, where your property is, or the contents of your documents."
] },
{ h: "How we train models", p: [
"We do not train models on your private data. To improve features we rely on synthetic data that we generate, publicly available standard templates, and, only if you explicitly opt in, de-identified and aggregated signals.",
"Training material is kept separate from any personal data, with a stated purpose and a retention limit."
] },
{ h: "Sharing and third parties", p: [
"Because the app is local-first, we generally have nothing to share, and we do not sell or rent your information.",
"When you use a share or export feature, such as saving a report or sending a summary to a messaging app, that action is started by you and sends only the content that you select."
] },
{ h: "Your choices and your rights", p: [
"You can view, edit, export, and delete your data at any time from inside the app. Because the data lives on your device, deleting it in the app or clearing your browser storage removes it.",
"Depending on where you live, you may have further rights under laws such as the India Digital Personal Data Protection Act, the European Union General Data Protection Regulation, or the California Consumer Privacy Act."
] },
{ h: "Children", p: [
"HomeOS is intended for adults managing property matters and is not directed at children."
] },
{ h: "Self-hosting and business use", p: [
"If a builder, broker, or business self-hosts HomeOS, that organization is the controller of the data it manages and is responsible for its own privacy notice, its agreements with tenants, and its security.",
"HomeOS provides the software, and the operator controls the data."
] },
{ h: "Changes and contact", p: [
"We may update this policy as the product changes. Material updates will appear here with a new date. You can raise questions through the project repository."
] },
{ h: "This is not legal advice", p: [
"HomeOS and its document features provide general information and convenience, not legal advice. Always confirm important matters with a qualified professional before you rely on them."
] }
];

const TERMS: Section[] = [
{ h: "Acceptance of these terms", p: [
"By using HomeOS you agree to these terms. If you do not agree, please do not use the software."
] },
{ h: "What HomeOS is", p: [
"HomeOS is open-source software for organizing rental and property information. It is a tool that helps you manage records. It is not a law firm, an accountant, or a property manager."
] },
{ h: "No professional advice", p: [
"Features such as the Legal Document Reader, the analytics, the tax summaries, and the assistant produce automated, general information only. They can be incomplete or wrong.",
"They are not legal, financial, or tax advice. Please do not rely on them for important decisions without checking with a qualified professional."
] },
{ h: "Your responsibilities and acceptable use", p: [
"You are responsible for the accuracy of what you enter and for keeping your device and your backups secure.",
"You agree not to upload content that you do not have the right to use, and not to upload highly sensitive identity documents, which the app is not designed to hold. You agree to use HomeOS only for lawful purposes."
] },
{ h: "Your data and backups", p: [
"Because HomeOS is local-first, your data lives on your device, and your backups are your responsibility.",
"We are not responsible for data lost through cleared browser storage, a lost or damaged device, a forgotten passphrase, or a failed export. If you lose the passphrase to an encrypted backup, we cannot recover it for you."
] },
{ h: "Open-source license", p: [
"The software is provided under the open-source license stated in the project repository. That license governs your right to use, modify, and self-host the code, while these terms cover your use of the application itself."
] },
{ h: "Self-hosting and operators", p: [
"If you run HomeOS for other people, you do so at your own risk and responsibility. You become the operator and the data controller for that deployment, including its security, its availability, and its compliance with the laws that apply to you and to the people whose data you manage."
] },
{ h: "Service availability", p: [
"Any hosted components, optional sync, and third-party data such as weather are provided on an as-available basis and may change or stop at any time without notice."
] },
{ h: "Disclaimer of warranties", p: [
"HomeOS is provided on an as-is and as-available basis, without warranties of any kind, whether express or implied, including any implied warranty of fitness for a particular purpose and of non-infringement, to the maximum extent allowed by law."
] },
{ h: "Limitation of liability", p: [
"To the maximum extent allowed by law, the authors and contributors are not liable for any indirect, incidental, or consequential damages, or for any loss of data, profit, or goodwill, that arises from your use of HomeOS."
] },
{ h: "Your content", p: [
"You keep responsibility for the information you add to HomeOS. You confirm that you are allowed to store and process that information for your own property management purposes."
] },
{ h: "Changes to these terms", p: [
"We may update these terms as the project changes. If you continue to use HomeOS after an update, that means you accept the revised terms."
] },
{ h: "Contact", p: [
"You can raise questions about these terms through the project repository."
] }
];

export default function LegalPolicies() {
 const [view, setView] = useState<"privacy" | "terms">("privacy");
 const data = view === "privacy" ? PRIVACY : TERMS;
 return (
 <div className="max-w-3xl mx-auto p-5 md:p-8 animate-fadeIn">
 <div className="flex items-start gap-3 mb-5">
 <div className="w-11 h-11 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center shrink-0">
 {view === "privacy" ? <ShieldCheck className="w-6 h-6 text-[#60A5FA]" /> : <ScrollText className="w-6 h-6 text-[#60A5FA]" />}
 </div>
 <div>
 <h1 className="text-xl font-bold text-white">{view === "privacy" ? "Privacy Policy" : "Terms of Service"}</h1>
 <p className="text-xs text-white/50 mt-0.5">{UPDATED}</p>
 </div>
 </div>
 <div className="flex gap-2 mb-5">
 <button onClick={() => setView("privacy")} className={"px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer " + (view === "privacy" ? "bg-[#2563EB] text-white" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10")}>Privacy Policy</button>
 <button onClick={() => setView("terms")} className={"px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer " + (view === "terms" ? "bg-[#2563EB] text-white" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10")}>Terms of Service</button>
 </div>
 <div className="flex items-start gap-3 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl p-4 mb-6">
 <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
 <p className="text-sm text-[#FCD34D]">HomeOS gives you general information and automation, not legal, financial, or tax advice. Please confirm important matters with a qualified professional.</p>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
 <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-3"><Server className="w-4 h-4 text-[#60A5FA] mb-1.5" /><div className="text-xs font-semibold text-white">Local-first</div><div className="text-[11px] text-white/45">Stays on your device</div></div>
 <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-3"><EyeOff className="w-4 h-4 text-[#60A5FA] mb-1.5" /><div className="text-xs font-semibold text-white">Data minimization</div><div className="text-[11px] text-white/45">Low-sensitivity only</div></div>
 <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-3"><Lock className="w-4 h-4 text-[#60A5FA] mb-1.5" /><div className="text-xs font-semibold text-white">Encrypted backups</div><div className="text-[11px] text-white/45">AES-256-GCM</div></div>
 <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-3"><Database className="w-4 h-4 text-[#60A5FA] mb-1.5" /><div className="text-xs font-semibold text-white">Never sold</div><div className="text-[11px] text-white/45">Opt-in analytics</div></div>
 </div>
 <div className="space-y-6">
 {data.map((sec, i) => (
 <section key={i}>
 <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><span className="text-[#2563EB]">{i + 1}.</span>{sec.h}</h2>
 <div className="space-y-2">
 {sec.p.map((para, j) => (
 <p key={j} className="text-sm text-white/65 leading-relaxed">{para}</p>
 ))}
 </div>
 </section>
 ))}
 </div>
 <p className="text-[11px] text-white/35 mt-8">HomeOS is open-source software. When self-hosted by a business, that operator is the data controller for its deployment. This document is a starting template, not a substitute for advice from a qualified professional.</p>
 </div>
 );
}
