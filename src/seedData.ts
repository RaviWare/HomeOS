 import { Property, Lease, Transaction, Utility, MaintenanceTicket, Document, UserSession } from "./types";
 
 export interface TimelineEvent { id: string; date: string; kind: string; title: string; propertyName: string; icon: string; }
 export interface ActivityItem { id: string; date: string; action: string; detail: string; icon: string; }
 export interface RentPoint { year: number; rent: number; }
 export interface ExpenseSlice { category: string; amount: number; pct: number; color: string; }
 export interface DashboardStats {
  propertiesLivedIn: number; yearsHistory: number; totalRentPaid: number; securityDeposits: number;
  documentsStored: number; leaseAgreements: number; utilityBills: number; maintenanceRequests: number;
  currentActiveLease: number; completedLeases: number; citiesLived: number; longestStay: string;
  averageMonthlyRent: number; monthlyExpenses: number; upcomingRenewals: number; pendingPayments: number;
  digitalSignatures: number; sharedProperties: number; ownersConnected: number; timelineEvents: number;
 }
 export interface DemoModel {
  session: UserSession;
  properties: Property[]; leases: Lease[]; transactions: Transaction[]; utilities: Utility[];
  tickets: MaintenanceTicket[]; documents: Document[]; timeline: TimelineEvent[]; activity: ActivityItem[];
  suggestions: string[]; notifications: string[]; rentGrowth: RentPoint[]; expenses: ExpenseSlice[];
  stats: DashboardStats;
 }
 
 // Deterministic seeded PRNG (mulberry32) so the demo is stable across reloads.
 function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
 }
 const R = mulberry32(20260630);
 const ri = (a: number, b: number) => Math.floor(a + R() * (b - a + 1));
 const pick = (arr: any[]) => arr[Math.floor(R() * arr.length)];
 const chance = (p: number) => R() < p;
 const round50 = (n: number) => Math.round(n / 50) * 50;
 const p2 = (n: number) => (n < 10 ? "0" + n : "" + n);
 const ymd = (y: number, m: number, d: number) => y + "-" + p2(m) + "-" + p2(d);
 const monthName = (m: number) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1];
 let uid = 0;
 const nid = (prefix: string) => prefix + "-" + (++uid).toString(36) + "-" + Math.floor(R() * 1e6).toString(36);
 
 
 const CITIES = [
  { name: "Bengaluru", areas: ["HSR Layout","Koramangala","Indiranagar","Whitefield","Sarjapur Road","Jayanagar"], elec: "BESCOM", water: "BWSSB", gas: "GAIL Gas", isp: "ACT Fibernet", mult: 1.15 },
  { name: "Mumbai", areas: ["Bandra West","Andheri East","Powai","Lower Parel","Goregaon West"], elec: "Adani Electricity", water: "BMC Water Works", gas: "Mahanagar Gas", isp: "Hathway", mult: 1.65 },
  { name: "Pune", areas: ["Koregaon Park","Baner","Hinjewadi","Viman Nagar","Kothrud"], elec: "MSEDCL", water: "PMC Water", gas: "MNGL", isp: "Excitel", mult: 0.95 },
  { name: "Hyderabad", areas: ["Gachibowli","Madhapur","Banjara Hills","Kondapur","Jubilee Hills"], elec: "TSSPDCL", water: "HMWSSB", gas: "Bhagyanagar Gas", isp: "ACT Fibernet", mult: 0.92 },
  { name: "Delhi", areas: ["Saket","Dwarka","Vasant Kunj","Hauz Khas","Rohini"], elec: "BSES Rajdhani", water: "Delhi Jal Board", gas: "IGL", isp: "Airtel Xstream", mult: 1.3 },
  { name: "Chennai", areas: ["Adyar","Velachery","T Nagar","OMR","Anna Nagar"], elec: "TANGEDCO", water: "CMWSSB", gas: "Indane Gas", isp: "Airtel Xstream", mult: 0.88 },
  { name: "Gurugram", areas: ["DLF Phase 2","Sohna Road","Golf Course Road","Sector 56","Cyber City"], elec: "DHBVN", water: "GMDA Water", gas: "Haryana City Gas", isp: "JioFiber", mult: 1.35 }
 ];
 const PREFIX = ["Skyline","Green Valley","Sunrise","Lake","Palm Grove","Silver Oak","Maple","Royal","Orchid","Emerald","Prestige","Brigade","Sobha","Lodha","Godrej","Purva","Adarsh","Mahindra"];
 const NOUN = ["Heights","Residency","Towers","Enclave","Greens","Meadows","Pinnacle","Vista","Habitat","Skyline","Crest","Gardens","Court","Terraces","Sanctuary","Horizon","Springs","Avenue"];
 const BUILDERS = ["Prestige Group","Brigade Enterprises","Sobha Limited","Lodha Group","Godrej Properties","Mahindra Lifespaces","Purva Realty","Adarsh Developers","DLF Limited","Embassy Group"];
 const FIRST = ["Rahul","Ananya","Vikram","Meera","Arjun","Priya","Karthik","Sneha","Rohan","Divya","Aditya","Nisha","Sanjay","Kavya","Manish","Pooja","Rajesh","Shreya","Amit","Deepa","Suresh","Lakshmi","Naveen","Ritu"];
 const LAST = ["Sharma","Rao","Malhotra","Krishnan","Nair","Reddy","Iyer","Gupta","Mehta","Desai","Verma","Pillai","Joshi","Kulkarni","Banerjee","Menon","Agarwal","Choudhary"];
 const AMEN = ["Gym","Swimming Pool","24/7 Security","Power Backup","Clubhouse","Covered Parking","Childrens Park","Lift","Rainwater Harvesting","Solar Panels","Tennis Court","Jogging Track","Indoor Games","Visitor Parking","CCTV Surveillance","Landscaped Garden","Intercom","Fire Safety"];
 const VENDORS = [
  { name: "CoolCare Engineers", phone: "+91 94488 23412", trade: "AC Repair" },
  { name: "AquaFix Plumbing", phone: "+91 98801 22311", trade: "Plumbing" },
 { name: "BrightSpark Electricals", phone: "+91 90192 55012", trade: "Electrical Repair" },
  { name: "PestShield Services", phone: "+91 97411 89234", trade: "Pest Control" },
  { name: "ProPaint Decorators", phone: "+91 99005 71234", trade: "Painting" },
  { name: "SparkleClean Crew", phone: "+91 96322 40012", trade: "Deep Cleaning" },
  { name: "FixIt Carpentry", phone: "+91 93412 66781", trade: "Furniture Assembly" },
  { name: "SecureHomes Systems", phone: "+91 90088 33445", trade: "Security Complaint" },
  { name: "GreenThumb Gardens", phone: "+91 91088 21090", trade: "Garden Maintenance" },
  { name: "LiftTech Solutions", phone: "+91 80471 99001", trade: "Lift Issue" }
 ];
 const PHOTOS = ["photo-1545324418-cc1a3fa10c00","photo-1605276374104-dee2a0ed3cd6","photo-1502672260266-1c1ef2d93688","photo-1493809842364-78817add7ffb","photo-1560448204-e02f11c3d0e2","photo-1522708323590-d24dbb6b0267","photo-1484154218962-a197022b5858","photo-1512917774080-9991f1c4c750","photo-1567496898669-ee935f5f647a","photo-1583608205776-bfd35f0d9f83","photo-1598928506311-c55ded91a20c","photo-1600585154340-be6161a56a0c","photo-1600566753086-00f18fb6b3ea","photo-1600607687939-ce8a6c25118c","photo-1600210492493-0946911123ea","photo-1600047509807-ba8f99d2cdde","photo-1560185007-cde436f6a4d0","photo-1502005229762-cf1b2da7c5d6"];
 const photoUrl = (i: number) => "https://images.unsplash.com/" + PHOTOS[i % PHOTOS.length] + "?w=640&auto=format&fit=crop&q=60";
 const fullName = () => pick(FIRST) + " " + pick(LAST);
 const phone = () => "+91 " + ri(70,99) + ri(100,999) + " " + ri(10000,99999);
 
 
 function buildModel(): DemoModel {
  uid = 0;
  const properties: Property[] = [];
  const leases: Lease[] = [];
  const transactions: Transaction[] = [];
  const utilities: Utility[] = [];
  const tickets: MaintenanceTicket[] = [];
  const documents: Document[] = [];
  const timeline: TimelineEvent[] = [];
  const TENANT = "Ravi Teja";
  const TENANT_EMAIL = "ravi.teja@gmail.com";
  const N = 18;
  const NOW_Y = 2026, NOW_M = 6, NOW_D = 30;
  const beyondNow = (y: number, m: number) => y > NOW_Y || (y === NOW_Y && m > NOW_M);
  const ymOf = (sy: number, sm: number, k: number) => { const t = (sm - 1) + k; return { y: sy + Math.floor(t / 12), m: (t % 12) + 1 }; };
  const addTx = (pid: string, pname: string, cat: any, amt: number, date: string, status: any, method: any, desc: string) => {
  transactions.push({ id: nid("tx"), propertyId: pid, propertyName: pname, category: cat, amount: amt, date, status, paymentMethod: method, invoiceNumber: "INV-" + date.replace(/-/g, "") + "-" + ri(100, 999), description: desc });
  };
  const ext = (ft: string) => ft === "image" ? ".jpg" : ft === "doc" ? ".docx" : ft === "excel" ? ".xlsx" : ".pdf";
  const addDoc = (label: string, cat: any, ft: any, date: string, short: string) => {
  documents.push({ id: nid("doc"), name: label + "_" + short + "_" + date + ext(ft), category: cat, fileType: ft, uploadedAt: date, size: ri(120, 980) + " KB", url: "thumb://" + label.toLowerCase() + "/" + short });
  };
  // ---- place 18 contiguous tenancies from Jan 2001 ----
  const currentElapsed = 30;
  const totalMonths = (NOW_Y - 2001) * 12 + NOW_M;
  const pastMonths = totalMonths - currentElapsed;
  const longIdx = ri(0, N - 2); const raw: number[] = [];
  for (let i = 0; i < N - 1; i++) raw.push(ri(8, 22));
  raw[longIdx] = 80;
  const rawSum = raw.reduce((s, x) => s + x, 0);
  const budget = pastMonths - 80; const others = (rawSum - 80) || 1; const scaled = raw.map((x, i) => i === longIdx ? 80 : Math.max(6, Math.round((x / others) * budget)));
  const fixI = longIdx === 0 ? 1 : 0; scaled[fixI] += pastMonths - scaled.reduce((s, x) => s + x, 0);
  if (scaled[fixI] < 6) scaled[fixI] = 6;
  const tens: any[] = [];
  let cy = 2001, cm = 1;
  for (let i = 0; i < N; i++) {
  const isCurrent = i === N - 1;
  const dur = isCurrent ? currentElapsed : scaled[i];
  tens.push({ idx: i, moveInY: cy, moveInM: cm, dur, isCurrent });
  const t = (cm - 1) + dur; cy = cy + Math.floor(t / 12); cm = (t % 12) + 1;
  }
 
  for (const tn of tens) {
  const i = tn.idx;
  const city = i < CITIES.length ? CITIES[i] : pick(CITIES);
  const area = pick(city.areas);
  const pname = pick(PREFIX) + " " + pick(NOUN) + " - Unit " + ri(2, 18) + String.fromCharCode(65 + ri(0, 3)) + ri(1, 9) + ri(0, 9);
  const short = pname.replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
  const rooms = ri(1, 4);
  const rentBase = round50((5400 + ri(0, 2100)) * city.mult * Math.pow(1.088, tn.moveInY - 2001) * (rooms <= 1 ? 0.72 : rooms === 2 ? 0.92 : 1.18));
  const depMonths = pick([2, 3, 3, 4, 5, 6, 10]);
  const deposit = round50(rentBase * depMonths);
  const pool = AMEN.slice();
  const am: string[] = [];
  const amN = ri(4, 7);
  for (let z = 0; z < amN && pool.length; z++) am.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  const ptype: any = rooms <= 1 && tn.moveInY < 2010 ? pick(["Co-Living", "Student Housing", "Residential"]) : "Residential";
  const prop: Property = {
  id: nid("prop"), name: pname, address: "Block " + String.fromCharCode(65 + ri(0, 6)) + ", " + area + ", " + city.name,
  city: city.name, type: ptype, status: tn.isCurrent ? "Occupied" : pick(["Occupied", "Occupied", "Vacant", "Listed"]),
  image: photoUrl(i + ri(0, 4)), rentAmount: rentBase, depositAmount: deposit, rooms, bathrooms: Math.max(1, rooms - ri(0, 1)),
  areaSqFt: 420 + rooms * ri(280, 460), parkingSpots: ri(0, 2), petFriendly: chance(0.45), amenities: am,
  ownerName: fullName(), ownerContact: phone(), managerName: chance(0.5) ? fullName() + " (PM)" : "Self Managed",
  yearBuilt: Math.max(1992, tn.moveInY - ri(0, 9)), rating: ri(36, 50) / 10,
  notes: "Comfortable " + rooms + "BHK home in " + area + " with good ventilation and reliable connectivity.",
  tags: [city.name, ptype, tn.moveInY < 2010 ? "Early Years" : "Recent"]
  };
  properties.push(prop);
  tn.prop = prop; tn.city = city; tn.short = short;
  const mkUtil = (utype: any, provider: string): Utility => ({ id: nid("util"), propertyId: prop.id, propertyName: prop.name, type: utype, provider, accountNumber: "" + ri(100000000, 999999999), amountDue: 0, dueDate: "", status: "Paid", usageValue: 0, currentReading: 0, previousReading: 0, history: [] });
  const elecU = mkUtil("Electricity", city.elec);
  const waterU = mkUtil("Water", city.water);
  const hasNet = tn.moveInY >= 2007;
  const internetU = hasNet ? mkUtil("Internet", city.isp) : null;
  let curRent = rentBase;
  let lastElecR = ri(1000, 5000), lastWaterR = ri(8000, 14000);
  for (let k = 0; k < tn.dur; k++) {
  const { y, m } = ymOf(tn.moveInY, tn.moveInM, k);
  if (tn.isCurrent && beyondNow(y, m)) break;
  if (k > 0 && k % 12 === 0) curRent = round50(curRent * 1.07);
  const willBeLast = tn.isCurrent && beyondNow(ymOf(tn.moveInY, tn.moveInM, k + 1).y, ymOf(tn.moveInY, tn.moveInM, k + 1).m);
  const summer = m >= 3 && m <= 6;
  const d5 = ymd(y, m, 5);
  addTx(prop.id, prop.name, "Rent", curRent, d5, "Paid", pick(["UPI", "Bank Transfer", "UPI", "Credit Card"]), monthName(m) + " " + y + " monthly house rent");
  addDoc("RentReceipt", "Receipt", "pdf", d5, short);
  const eAmt = round50((620 + (summer ? 680 : 120) + ri(0, 820)) * Math.pow(1.045, y - 2001));
  lastElecR += Math.round(eAmt / 8); const eUse = Math.round(eAmt / 8);
  elecU.history.push({ month: monthName(m) + " " + (y % 100), amount: eAmt, usage: eUse });
  addTx(prop.id, prop.name, "Electricity", eAmt, ymd(y, m, ri(9, 16)), willBeLast ? "Overdue" : "Paid", "UPI", city.elec + " electricity bill");
  addDoc("ElectricityBill", "Utility", "pdf", ymd(y, m, 12), short);
  const wAmt = round50((170 + ri(0, 520)) * Math.pow(1.04, y - 2001));
  lastWaterR += Math.round(wAmt / 20);
  waterU.history.push({ month: monthName(m) + " " + (y % 100), amount: wAmt, usage: Math.round(wAmt / 20) });
  addTx(prop.id, prop.name, "Water", wAmt, ymd(y, m, ri(12, 20)), willBeLast ? "Pending" : "Paid", "UPI", city.water + " water charges");
  addDoc("WaterBill", "Utility", "pdf", ymd(y, m, 14), short);
  if (internetU) {
  const nAmt = round50(720 + ri(0, 760)); const nUse = ri(220, 940);
  internetU.history.push({ month: monthName(m) + " " + (y % 100), amount: nAmt, usage: nUse });
  addTx(prop.id, prop.name, "Internet", nAmt, ymd(y, m, ri(2, 8)), willBeLast ? "Pending" : "Paid", "UPI", city.isp + " broadband plan");
  if (m % 3 === 0) addDoc("InternetBill", "Utility", "pdf", ymd(y, m, 4), short);
  }
  }
  tn.rent = curRent; tn.deposit = deposit;
  const finishUtil = (u: Utility | null) => { if (!u || !u.history.length) return; const last = u.history[u.history.length - 1]; u.amountDue = last.amount; u.usageValue = last.usage; u.dueDate = "2026-07-" + p2(ri(8, 26)); u.status = tn.isCurrent ? "Unpaid" : "Paid"; u.currentReading = u.type === "Electricity" ? lastElecR : u.type === "Water" ? lastWaterR : 0; u.previousReading = (u.currentReading || 0) - last.usage; utilities.push(u); };
  finishUtil(elecU); finishUtil(waterU); finishUtil(internetU);
  }
 
  const CLAUSES = [
  "Rent is payable on or before the 5th of each calendar month.",
  "A late fee of ₹1,000 applies to rent received after the 10th.",
  "The security deposit is refundable within 30 days of vacating after damage assessment.",
  "Quiet hours are observed between 10:00 PM and 6:00 AM daily.",
  "Subletting is not permitted without written consent from the owner.",
  "A notice period of 60 days is required for early termination.",
  "Routine maintenance up to ₹2,500 is borne by the tenant.",
  "Pets are allowed subject to a damage liability addendum.",
  "Annual rent escalation is capped at 8 percent on renewal.",
  "Society and covered parking charges are included in the monthly rent."
  ];
  for (const tn of tens) {
  const prop: Property = tn.prop;
  const lcount = Math.min(8, Math.max(1, Math.ceil(tn.dur / 11)));
  for (let v = 0; v < lcount; v++) {
  const s = ymOf(tn.moveInY, tn.moveInM, v * 12);
  const e = ymOf(tn.moveInY, tn.moveInM, (v + 1) * 12 - 1);
  const isLastV = v === lcount - 1;
  const active = tn.isCurrent && isLastV;
  const lr = round50(prop.rentAmount * Math.pow(1.07, v));
  const startStr = ymd(s.y, s.m, 1);
  const endStr = active ? "2026-08-12" : ymd(e.y, e.m, 28);
  const status: any = active ? "Active" : tn.isCurrent ? "Expired" : pick(["Expired", "Expired", "Terminated"]);
  const cl = CLAUSES.slice().sort(() => R() - 0.5).slice(0, ri(4, 6));
  leases.push({ id: nid("lease"), propertyId: prop.id, propertyName: prop.name, tenantName: TENANT, tenantEmail: TENANT_EMAIL, landlordName: prop.ownerName, startDate: startStr, endDate: endStr, monthlyRent: lr, securityDeposit: tn.deposit, status, signatures: { tenantSigned: true, tenantSignedAt: startStr + "T11:00:00Z", landlordSigned: true, landlordSignedAt: startStr + "T15:30:00Z" }, clauses: cl, version: v + 1, notaryDetails: "Registered at the Sub Registrar Office, " + tn.city.name + ". E-Stamp verified.", stampDutyPaid: pick([200, 500, 1000, 1500]) });
  addDoc("LeaseAgreement", "Lease", "pdf", startStr, tn.short);
  }
  const inStr = ymd(tn.moveInY, tn.moveInM, 2);
  addTx(prop.id, prop.name, "Deposit", tn.deposit, inStr, "Paid", "Bank Transfer", "Security deposit for " + prop.name);
  addTx(prop.id, prop.name, "Other", round50(prop.rentAmount * pick([0.5, 1])), ymd(tn.moveInY, tn.moveInM, 3), "Paid", "Bank Transfer", "Brokerage and agent commission");
  if (chance(0.5)) addTx(prop.id, prop.name, "Gas", round50(780 + ri(0, 640)), ymd(tn.moveInY, tn.moveInM, 8), "Paid", "UPI", "Piped gas connection and refill charges");
  if (!tn.isCurrent) {
  const mo = ymOf(tn.moveInY, tn.moveInM, tn.dur);
  const moStr = ymd(mo.y, mo.m, ri(15, 26));
  addTx(prop.id, prop.name, "Refund", round50(tn.deposit * (0.8 + R() * 0.2)), moStr, "Paid", "Bank Transfer", "Security deposit refund on move out");
  if (chance(0.4)) addTx(prop.id, prop.name, "Tax", round50(prop.rentAmount * pick([0.3, 0.5])), ymd(mo.y, 3, 25), "Paid", "Bank Transfer", "TDS on rent paid to landlord");
  addDoc("MoveOutChecklist", "Other", "doc", moStr, tn.short);
  addDoc("DepositRefundReceipt", "Receipt", "pdf", moStr, tn.short);
  addDoc("ExitInspectionReport", "Other", "image", moStr, tn.short);
  tn.moStr = moStr;
  }
  addDoc("PoliceVerification", "Certificate", "pdf", inStr, tn.short);
  addDoc("TenantVerification", "Certificate", "pdf", inStr, tn.short);
  addDoc("OwnerVerification", "Certificate", "pdf", inStr, tn.short);
  addDoc("MoveInInspection", "Other", "image", inStr, tn.short);
  addDoc("PropertyPhotos", "Other", "image", inStr, tn.short);
  if (chance(0.6)) addDoc("RentersInsurance", "Certificate", "pdf", inStr, tn.short);
  if (chance(0.4)) addDoc("ApplianceWarranty", "Certificate", "pdf", inStr, tn.short);
  }
 
  const MAINT_TYPES = ["AC Repair", "Water Leakage", "Painting", "Electrical Repair", "Plumbing", "Pest Control", "Internet Installation", "Furniture Assembly", "Deep Cleaning", "Window Repair", "Security Complaint", "Lift Issue", "Parking Issue", "Garden Maintenance"];
  for (const tn of tens) {
  const prop: Property = tn.prop;
  const nT = Math.min(20, Math.max(5, Math.round(tn.dur * 0.78)));
  for (let q = 0; q < nT; q++) {
  const k = ri(0, Math.max(0, tn.dur - 1));
  const { y, m } = ymOf(tn.moveInY, tn.moveInM, k);
  if (tn.isCurrent && beyondNow(y, m)) continue;
  const mtype = pick(MAINT_TYPES);
  const vend = pick(VENDORS);
  const created = ymd(y, m, ri(2, 26));
  const est = round50(ri(600, 18000));
  let status: any = "Resolved";
  if (tn.isCurrent) status = q === 0 ? "In Progress" : q === 1 ? "Pending" : pick(["Resolved", "Resolved", "In Progress"]);
  const resolved = status === "Resolved";
  const actual = resolved ? round50(est * (0.85 + R() * 0.3)) : undefined;
  const tl: any[] = [{ status: "Ticket Opened", date: created, note: "Tenant reported a " + mtype + " issue." }];
  if (status !== "Pending") tl.push({ status: "Vendor Assigned", date: created, note: vend.name + " was assigned to the job." });
  if (resolved) tl.push({ status: "Job Done", date: created, note: "Work completed and the invoice was settled." });
  tickets.push({ id: nid("maint"), propertyId: prop.id, propertyName: prop.name, title: mtype + " at " + prop.name, description: "Reported " + mtype + " requiring professional vendor attention.", priority: pick(["Urgent", "Medium", "Low", "Medium"]), status, vendorName: vend.name, vendorPhone: vend.phone, estimatedCost: est, actualCost: actual, createdAt: created, timeline: tl, rating: resolved ? ri(3, 5) : undefined });
  if (resolved && actual) {
  const cat: any = mtype === "Deep Cleaning" ? "Cleaning" : "Repairs";
  addTx(prop.id, prop.name, cat, actual, created, "Paid", pick(["Credit Card", "UPI", "Bank Transfer"]), mtype + " service settlement");
  addDoc("RepairInvoice", "Maintenance", "pdf", created, tn.short);
  }
  }
  }
  for (const tn of tens) {
  const prop: Property = tn.prop;
  const tpush = (k: number, kind: string, title: string, icon: string) => { const o = ymOf(tn.moveInY, tn.moveInM, Math.min(k, tn.dur)); timeline.push({ id: nid("tl"), date: ymd(o.y, o.m, ri(2, 26)), kind, title, propertyName: prop.name, icon }); };
  tpush(0, "move-in", "Moved into " + prop.name, "home");
  tpush(0, "lease", "Signed the lease agreement", "file");
  tpush(0, "deposit", "Paid security deposit of ₹" + tn.deposit.toLocaleString("en-IN"), "wallet");
  tpush(1, "utility", "First electricity bill cleared", "zap");
  if (tn.moveInY >= 2007) tpush(1, "internet", "Added Wi-Fi broadband", "wifi");
  const lc = Math.min(8, Math.max(1, Math.ceil(tn.dur / 11)));
  for (let v = 1; v < lc; v++) { tpush(v * 12, "renewal", "Renewed the lease for year " + (v + 1), "refresh"); tpush(v * 12, "rent", "Rent revised on renewal", "trend"); }
  tpush(Math.floor(tn.dur * 0.6), "maintenance", "Logged a maintenance complaint", "wrench");
  tpush(Math.max(1, tn.dur - 1), "rating", "Rated this home " + prop.rating + " stars", "star");
  if (!tn.isCurrent) { tpush(tn.dur, "move-out", "Moved out of " + prop.name, "logout"); tpush(tn.dur, "refund", "Security deposit returned", "wallet"); tpush(tn.dur, "archive", "Archived the property records", "archive"); }
  }
  timeline.sort((a, b) => (a.date < b.date ? 1 : -1));
  ["PANCard", "AadhaarCard"].forEach((d, ix) => addDoc(d, "Certificate", "image", ix === 0 ? "2003-04-10" : "2012-08-22", "RaviVerma"));
  addDoc("Passport", "Certificate", "pdf", "2018-02-15", "RaviVerma");
  [2009, 2015, 2021].forEach((yy) => addDoc("EmploymentLetter", "Other", "pdf", yy + "-06-01", "RaviVerma"));
 
  const sumWhere = (fn: (t: Transaction) => boolean) => transactions.filter(fn).reduce((s, t) => s + t.amount, 0);
  const totalRentPaid = sumWhere((t) => t.category === "Rent" && t.status === "Paid");
  const rentPaidCount = transactions.filter((t) => t.category === "Rent" && t.status === "Paid").length;
  const securityDeposits = sumWhere((t) => t.category === "Deposit");
  const pendingPayments = sumWhere((t) => t.status !== "Paid");
  const utilityBills = utilities.reduce((s, u) => s + u.history.length, 0);
  const cities = Array.from(new Set(properties.map((p) => p.city)));
  const owners = Array.from(new Set(properties.map((p) => p.ownerName)));
  const maxDur = tens.reduce((mx: number, t: any) => Math.max(mx, t.dur), 0);
  const longestStay = Math.floor(maxDur / 12) + " Years " + (maxDur % 12) + " Months";
  const last12 = transactions.filter((t) => t.status === "Paid" && t.date >= "2025-07-01" && t.category !== "Deposit" && t.category !== "Refund");
  const monthlyExpenses = Math.round(last12.reduce((s, t) => s + t.amount, 0) / 12);
  const activeLeases = leases.filter((l) => l.status === "Active");
  const expiry = new Date("2026-08-12").getTime();
  const nowMs = new Date("2026-06-30").getTime();
  const daysToExpiry = Math.round((expiry - nowMs) / 86400000);
  const upcomingRenewals = leases.filter((l) => l.status === "Active").length + 1;
  const rby: Record<number, { s: number; c: number }> = {};
  transactions.forEach((t) => { if (t.category === "Rent" && t.status === "Paid") { const y = +t.date.slice(0, 4); (rby[y] = rby[y] || { s: 0, c: 0 }); rby[y].s += t.amount; rby[y].c++; } });
  const rentGrowth: RentPoint[] = Object.keys(rby).map((k) => ({ year: +k, rent: Math.round(rby[+k].s / rby[+k].c) })).sort((a, b) => a.year - b.year);
  const groups: Record<string, number> = { Rent: 0, Electricity: 0, Water: 0, Internet: 0, Gas: 0, Maintenance: 0, Other: 0 };
  transactions.forEach((t) => { if (t.status !== "Paid") return; if (t.category === "Deposit" || t.category === "Refund") return; const key = t.category === "Repairs" || t.category === "Cleaning" || t.category === "Maintenance" ? "Maintenance" : t.category === "Tax" ? "Other" : (groups[t.category] !== undefined ? t.category : "Other"); groups[key] += t.amount; });
  const palette = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#9CA3AF"];
  const grandTotal = Object.values(groups).reduce((s, x) => s + x, 0) || 1;
  const expenses: ExpenseSlice[] = Object.keys(groups).map((k, ix) => ({ category: k, amount: groups[k], pct: Math.round((groups[k] / grandTotal) * 100), color: palette[ix % palette.length] })).sort((a, b) => b.amount - a.amount);
  const bestProp = properties.reduce((a, b) => (b.rating > a.rating ? b : a), properties[0]);
  const pastProp = (tens.find((t: any) => !t.isCurrent) || tens[0]).prop;
  const suggestions = [
  "You spent about 8% less on utilities this year than last year.",
  "Your current lease expires in " + daysToExpiry + " days. Plan the renewal early.",
  "A deposit refund is still being tracked from " + pastProp.name + ".",
  "Average monthly expenses rose about 6% over the last twelve months.",
  bestProp.name + " earned your highest satisfaction rating at " + bestProp.rating + " stars.",
  "You may be missing electricity bills from July 2018. Consider backfilling them."
  ];
  const notifications = ["Rent due tomorrow for your current home.", "Lease expires in " + daysToExpiry + " days.", "Electricity bill is overdue.", "Internet payment is pending.", "Maintenance request marked completed.", "Security deposit received.", "Lease agreement signed.", "Document shared with your accountant.", "Encrypted backup completed.", "AI portfolio summary is ready."];
  const actDays = ["2026-06-29", "2026-06-28", "2026-06-26", "2026-06-23", "2026-06-20", "2026-06-17", "2026-06-14", "2026-06-11", "2026-06-08"];
  const activity: ActivityItem[] = [
  { action: "Uploaded Rental Agreement", detail: tens[N - 1].prop.name, icon: "file" },
  { action: "Added Electricity Bill", detail: tens[N - 1].city.elec, icon: "zap" },
  { action: "Paid Internet Bill", detail: tens[N - 1].city.isp, icon: "wifi" },
  { action: "Signed Lease Renewal", detail: tens[N - 1].prop.name, icon: "pen" },
  { action: "Downloaded Tax Report", detail: "FY 2025-2026", icon: "download" },
  { action: "Shared Property with Accountant", detail: bestProp.name, icon: "share" },
  { action: "Updated Maintenance Ticket", detail: "Plumbing repair", icon: "wrench" },
  { action: "Added Property Photos", detail: tens[N - 1].prop.name, icon: "image" },
  { action: "Downloaded Annual Expense Report", detail: "25 year summary", icon: "download" }
  ].map((a, ix) => ({ id: nid("act"), date: actDays[ix], ...a }));
 
  const stats: DashboardStats = {
  propertiesLivedIn: properties.length,
  yearsHistory: 2026 - 2001,
  totalRentPaid,
  securityDeposits,
  documentsStored: documents.length,
  leaseAgreements: leases.length,
  utilityBills,
  maintenanceRequests: tickets.length,
  currentActiveLease: activeLeases.length,
  completedLeases: leases.filter((l) => l.status !== "Active").length,
  citiesLived: cities.length,
  longestStay,
  averageMonthlyRent: rentPaidCount ? Math.round(totalRentPaid / rentPaidCount) : 0,
  monthlyExpenses,
  upcomingRenewals,
  pendingPayments,
  digitalSignatures: leases.filter((l) => l.signatures.tenantSigned && l.signatures.landlordSigned).length,
  sharedProperties: Math.max(3, Math.round(properties.length * 0.28)),
  ownersConnected: owners.length,
  timelineEvents: timeline.length + transactions.length + documents.length
  };
  const session: UserSession = { role: "Tenant", workspaceName: "Ravi Teja Rental Vault", userName: "Ravi Teja", userEmail: TENANT_EMAIL, notificationsEnabled: true, security2FAEnabled: true, e2eEncryptionEnabled: true };
  return { session, properties, leases, transactions, utilities, tickets, documents, timeline, activity, suggestions, notifications, rentGrowth, expenses, stats };
 }
 
 let _model: DemoModel | null = null;
 export function generateDemoModel(): DemoModel {
  if (!_model) _model = buildModel();
  return _model;
 }
 // v3: seed demo records only — no auto-login session so the marketing site is the default landing.
 export const SEED_VERSION = "homeos-demo-25yr-v3";
 export function installDemoData(): void {
  try {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem("rv_seed_version") === SEED_VERSION) return;
  const m = generateDemoModel();
  const w = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));
  // Intentionally do not set rv_session — visitors land on the marketing site first.
  localStorage.removeItem("rv_session");
  w("rv_properties", m.properties); w("rv_leases", m.leases);
  w("rv_transactions", m.transactions); w("rv_utilities", m.utilities); w("rv_tickets", m.tickets);
  w("rv_documents", m.documents); w("rv_timeline", m.timeline); w("rv_activity", m.activity);
  w("rv_suggestions", m.suggestions); w("rv_notifications", m.notifications);
  w("rv_rentGrowth", m.rentGrowth); w("rv_expenses", m.expenses); w("rv_stats", m.stats);
  localStorage.setItem("rv_seed_version", SEED_VERSION);
  } catch (e) {
  console.error("Demo seed install failed", e);
  }
 }
 
