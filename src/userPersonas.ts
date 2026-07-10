/**
 * User personas for HomeOS — maps every UserRole to a workstyle
 * that drives nav order, Command Deck defaults, and module emphasis.
 */
import type { UserRole } from "./types";
import type { AppTab } from "./routing";

/** High-level audience segments */
export type PersonaId =
  | "household" // rented or owned home, personal life + money
  | "owner" // landlord / property owner
  | "operator" // multi-home: society, builder, PM, enterprise
  | "advisor" // accountant / legal
  | "field"; // vendor / inspector

export interface UserPersona {
  id: PersonaId;
  /** Short label on deck */
  label: string;
  /** One-line pitch */
  tagline: string;
  /** Who this is for */
  audience: string;
  /** Primary jobs-to-be-done */
  jobs: string[];
  /** Modules ordered by importance for this persona */
  modulePriority: AppTab[];
  /** Modules de-emphasized (still available under “Show all”) */
  secondaryModules: AppTab[];
  /** Mobile quick chips (max 6) */
  mobileQuick: AppTab[];
  /** Default Command Deck tab */
  defaultDeckView: "life" | "graphs" | "dataset";
  /** Wealth ribbon emphasis keys */
  ribbonFocus: Array<
    | "netWorth"
    | "income"
    | "spend"
    | "savings"
    | "goals"
    | "rent"
    | "collection"
    | "occupancy"
    | "openBalance"
    | "tickets"
  >;
  /** Suggested default dataset tab */
  defaultDataTab:
    | "wealth"
    | "rent"
    | "cashflow"
    | "properties"
    | "leases"
    | "payments"
    | "goals"
    | "ops";
  /** Group blurb overrides */
  groupBlurbs?: Partial<
    Record<"housing" | "money" | "life" | "system", string>
  >;
}

export const PERSONAS: Record<PersonaId, UserPersona> = {
  household: {
    id: "household",
    label: "Household",
    tagline: "Your home, money & life in one vault",
    audience:
      "Professionals, families, and business owners in a rented or owned home who track rent, bills, savings, and life goals.",
    jobs: [
      "Track rent paid year-by-year",
      "See income vs expenses & savings rate",
      "Dream goals & net-worth pulse",
      "Utilities, maintenance, and documents",
      "Tax / HRA estimates",
    ],
    modulePriority: [
      "dashboard",
      "life",
      "finances",
      "expenses",
      "payments",
      "leases",
      "properties",
      "utilities",
      "documents",
      "maintenance",
      "activity",
      "settings",
    ],
    secondaryModules: ["activity"],
    mobileQuick: [
      "dashboard",
      "life",
      "finances",
      "expenses",
      "payments",
      "documents",
    ],
    defaultDeckView: "life",
    ribbonFocus: ["netWorth", "income", "spend", "savings", "goals", "rent"],
    defaultDataTab: "wealth",
    groupBlurbs: {
      housing: "Your home & agreements",
      money: "Cash, tax & runway",
      life: "Income · assets · dreams",
      system: "Proof & control",
    },
  },

  owner: {
    id: "owner",
    label: "Rentals & yield",
    tagline: "Long-term + short-stay income, expenses, occupancy",
    audience:
      "People who rent out one or many homes — long-term leases, Airbnb/homestay listings, or a mixed portfolio — and need income, platform fees, and property costs in one place.",
    jobs: [
      "Track multiple rental units & occupancy",
      "Long-term rent + short-stay (Airbnb / Booking) payouts",
      "Platform fees, cleaning, and property expenses",
      "Lease renewals & guest-ready ops",
      "Portfolio cashflow & tax-ready ledgers",
      "Deposits, docs, and maintenance",
    ],
    modulePriority: [
      "dashboard",
      "properties",
      "payments",
      "finances",
      "expenses",
      "leases",
      "maintenance",
      "utilities",
      "documents",
      "life",
      "activity",
      "settings",
    ],
    secondaryModules: ["life"],
    mobileQuick: [
      "dashboard",
      "properties",
      "payments",
      "finances",
      "expenses",
      "maintenance",
    ],
    defaultDeckView: "graphs",
    ribbonFocus: [
      "collection",
      "openBalance",
      "occupancy",
      "income",
      "spend",
      "tickets",
    ],
    defaultDataTab: "payments",
    groupBlurbs: {
      housing: "Units · listings · leases",
      money: "Rent · channel income · fees",
      life: "Personal (optional)",
      system: "Docs & trail",
    },
  },

  operator: {
    id: "operator",
    label: "Business · society · builder",
    tagline: "Multi-home ops for teams, societies, and projects",
    audience:
      "Property managers, society/HOA admins, builders/developers, and org teams running many homes or inventory units with tickets, dues, handovers, and audit trails.",
    jobs: [
      "Multi-property / society unit occupancy",
      "Maintenance SLAs & vendors",
      "Society dues, shared meters, compliance",
      "Builder inventory & handovers",
      "Lease pipeline & renewals",
      "Activity audit for teams",
    ],
    modulePriority: [
      "dashboard",
      "properties",
      "maintenance",
      "leases",
      "utilities",
      "payments",
      "documents",
      "activity",
      "finances",
      "expenses",
      "life",
      "settings",
    ],
    secondaryModules: ["life", "expenses"],
    mobileQuick: [
      "dashboard",
      "properties",
      "maintenance",
      "leases",
      "utilities",
      "activity",
    ],
    defaultDeckView: "graphs",
    ribbonFocus: [
      "occupancy",
      "tickets",
      "openBalance",
      "collection",
      "rent",
      "income",
    ],
    defaultDataTab: "ops",
    groupBlurbs: {
      housing: "Units · society · inventory",
      money: "Dues · collections · books",
      life: "Personal (optional)",
      system: "Compliance & audit",
    },
  },

  advisor: {
    id: "advisor",
    label: "Advisor",
    tagline: "Numbers, proof, and compliance at a glance",
    audience:
      "Accountants and legal advisors reviewing client housing money, tax, and agreements.",
    jobs: [
      "Expense & tax views",
      "Ledger integrity",
      "Lease clauses & versions",
      "Document vault",
      "Immutable activity log",
    ],
    modulePriority: [
      "dashboard",
      "expenses",
      "payments",
      "finances",
      "documents",
      "leases",
      "activity",
      "properties",
      "life",
      "utilities",
      "maintenance",
      "settings",
    ],
    secondaryModules: ["utilities", "maintenance", "life"],
    mobileQuick: [
      "dashboard",
      "expenses",
      "payments",
      "documents",
      "leases",
      "activity",
    ],
    defaultDeckView: "dataset",
    ribbonFocus: ["spend", "openBalance", "savings", "rent", "income", "goals"],
    defaultDataTab: "wealth",
    groupBlurbs: {
      housing: "Agreements & assets",
      money: "Tax · ledger · cash",
      life: "Client lifestyle (opt.)",
      system: "Evidence & log",
    },
  },

  field: {
    id: "field",
    label: "Field / Vendor",
    tagline: "Tickets, sites, and proof — nothing extra",
    audience:
      "Maintenance vendors and inspectors focused on jobs, sites, and documentation.",
    jobs: [
      "Open tickets & priority",
      "Property context",
      "Photos & documents",
      "Activity trail",
    ],
    modulePriority: [
      "dashboard",
      "maintenance",
      "properties",
      "documents",
      "activity",
      "utilities",
      "leases",
      "payments",
      "settings",
      "finances",
      "expenses",
      "life",
    ],
    secondaryModules: ["finances", "expenses", "life", "leases", "payments"],
    mobileQuick: [
      "dashboard",
      "maintenance",
      "properties",
      "documents",
      "activity",
      "utilities",
    ],
    defaultDeckView: "life",
    ribbonFocus: ["tickets", "occupancy", "openBalance", "spend", "rent", "income"],
    defaultDataTab: "ops",
    groupBlurbs: {
      housing: "Sites & jobs",
      money: "Optional billing",
      life: "Hidden by default",
      system: "Proof & settings",
    },
  },
};

/**
 * Map every product role → persona.
 * Note: IDs are storage keys — UI labels via roleTitle().
 */
export const ROLE_TO_PERSONA: Record<UserRole, PersonaId> = {
  Tenant: "household",
  Homeowner: "household",
  "Family Member": "household",
  Landlord: "owner",
  "Property Owner": "owner",
  "ShortStay Host": "owner",
  "Property Manager": "operator",
  Builder: "operator",
  "Housing Society Admin": "operator",
  "Enterprise Admin": "operator",
  Accountant: "advisor",
  "Legal Advisor": "advisor",
  "Maintenance Vendor": "field",
  "Government Inspector": "field",
  Custom: "household",
};

/**
 * Role display titles — clear product paths, not awkward “I rent my house” copy.
 * Storage IDs stay stable (e.g. Tenant); UI never forces self-labeling as “tenant.”
 */
export const ROLE_UI: Record<
  UserRole,
  { title: string; short: string; summary: string }
> = {
  Tenant: {
    title: "Home renter",
    short: "Renter",
    summary:
      "Rent paid, deposits, HRA, utilities, leases, and life goals — your side of the home story.",
  },
  Homeowner: {
    title: "Live-in homeowner",
    short: "Homeowner",
    summary:
      "Own-occupy home: EMI/taxes, maintenance, documents, savings, and household money in one vault.",
  },
  "Family Member": {
    title: "Shared household",
    short: "Household",
    summary:
      "Shared budgets, chores, documents, and money with people you live with.",
  },
  Landlord: {
    title: "Long-term rentals",
    short: "Long-term",
    summary:
      "One or many units on monthly leases — collections, vacancies, renewals, deposits, and repair costs.",
  },
  "Property Owner": {
    title: "Multi-property business",
    short: "Portfolio",
    summary:
      "Portfolio of rentals: occupancy, rent roll, expenses, ROI, and tax-ready books across many homes.",
  },
  "ShortStay Host": {
    title: "Short-stay & homestay host",
    short: "Short-stay",
    summary:
      "Airbnb, Booking.com, MakeMyTrip, and more — channel income, platform fees, cleaning, and property expenses.",
  },
  "Property Manager": {
    title: "Property manager",
    short: "Manager",
    summary:
      "Multi-unit ops for owners: tickets, renewals, utilities, reporting, and payouts.",
  },
  "Housing Society Admin": {
    title: "Society / HOA admin",
    short: "Society",
    summary:
      "Apartment association or society: units, vendors, shared meters, dues, amenities, compliance trail.",
  },
  Builder: {
    title: "Builder / developer",
    short: "Builder",
    summary:
      "Project inventory, handovers, buyer docs, snag tickets, and site maintenance.",
  },
  "Enterprise Admin": {
    title: "Business / enterprise housing",
    short: "Enterprise",
    summary:
      "Company housing, staff quarters, or multi-city inventory — controls, audit trail, bulk ops.",
  },
  Accountant: {
    title: "Books & tax",
    short: "Accountant",
    summary: "Ledger integrity, tax lab, exports, evidence packs.",
  },
  "Legal Advisor": {
    title: "Leases & legal",
    short: "Legal",
    summary: "Clauses, document vault, activity log.",
  },
  "Maintenance Vendor": {
    title: "Field service & repairs",
    short: "Field",
    summary: "Tickets, sites, priority, proof photos.",
  },
  "Government Inspector": {
    title: "Property inspector",
    short: "Inspector",
    summary: "Inspections, property context, official records.",
  },
  Custom: {
    title: "Custom role",
    short: "Custom",
    summary: "You define the label and which modules matter.",
  },
};

export function roleTitle(role: string | undefined | null, override?: string | null): string {
  if (override && override.trim()) return override.trim();
  if (role && ROLE_UI[role as UserRole]) return ROLE_UI[role as UserRole].title;
  return role || "My home";
}

export function roleShort(role: string | undefined | null, override?: string | null): string {
  if (override && override.trim()) return override.trim();
  if (role && ROLE_UI[role as UserRole]) return ROLE_UI[role as UserRole].short;
  return role || "Home";
}

export function roleSummary(role: string | undefined | null): string {
  if (role && ROLE_UI[role as UserRole]) return ROLE_UI[role as UserRole].summary;
  return "Your home operating system.";
}

/**
 * Category → role picker for onboarding & settings.
 * Order: Individuals first, then rentals/STR, societies/builders/business, advisors, field.
 */
export type CategoryOption = {
  id: PersonaId;
  title: string;
  blurb: string;
  /** What the Command Deck customizes for this category */
  customizes: string[];
  /** Popular / default role inside the category */
  recommendedRole: UserRole;
  roles: Array<{
    role: UserRole;
    title: string;
    summary: string;
  }>;
};

export const CATEGORY_FLOW: CategoryOption[] = [
  {
    id: "household",
    title: "Individuals",
    blurb:
      "Living in a home — rent or own. Money, bills, documents, and life goals in one vault.",
    customizes: [
      "Life OS first",
      "Home costs trail",
      "Income · spend · goals",
      "Tax / HRA lab",
    ],
    recommendedRole: "Tenant",
    roles: [
      {
        role: "Tenant",
        title: ROLE_UI.Tenant.title,
        summary: ROLE_UI.Tenant.summary,
      },
      {
        role: "Homeowner",
        title: ROLE_UI.Homeowner.title,
        summary: ROLE_UI.Homeowner.summary,
      },
      {
        role: "Family Member",
        title: ROLE_UI["Family Member"].title,
        summary: ROLE_UI["Family Member"].summary,
      },
    ],
  },
  {
    id: "owner",
    title: "Rentals & short-stays",
    blurb:
      "Long-term leases, Airbnb/homestay listings, or a multi-property rental business — income, fees, and expenses per unit.",
    customizes: [
      "Multi-unit occupancy",
      "Rent + channel income",
      "Platform fees & expenses",
      "Cashflow & tax lab",
    ],
    recommendedRole: "Landlord",
    roles: [
      {
        role: "Landlord",
        title: ROLE_UI.Landlord.title,
        summary: ROLE_UI.Landlord.summary,
      },
      {
        role: "ShortStay Host",
        title: ROLE_UI["ShortStay Host"].title,
        summary: ROLE_UI["ShortStay Host"].summary,
      },
      {
        role: "Property Owner",
        title: ROLE_UI["Property Owner"].title,
        summary: ROLE_UI["Property Owner"].summary,
      },
    ],
  },
  {
    id: "operator",
    title: "Societies · builders · businesses",
    blurb:
      "Communities, projects, and organizations running many homes — society ops, inventory, and team audit trails.",
    customizes: [
      "Trends-first deck",
      "Multi-unit / inventory",
      "Tickets, dues & utilities",
      "Audit-ready ops",
    ],
    recommendedRole: "Housing Society Admin",
    roles: [
      {
        role: "Housing Society Admin",
        title: ROLE_UI["Housing Society Admin"].title,
        summary: ROLE_UI["Housing Society Admin"].summary,
      },
      {
        role: "Builder",
        title: ROLE_UI.Builder.title,
        summary: ROLE_UI.Builder.summary,
      },
      {
        role: "Property Manager",
        title: ROLE_UI["Property Manager"].title,
        summary: ROLE_UI["Property Manager"].summary,
      },
      {
        role: "Enterprise Admin",
        title: ROLE_UI["Enterprise Admin"].title,
        summary: ROLE_UI["Enterprise Admin"].summary,
      },
    ],
  },
  {
    id: "advisor",
    title: "Advisors",
    blurb: "Tax, books, and legal proof for home and rental clients.",
    customizes: [
      "Datasets-first deck",
      "Tax lab & ledger",
      "Documents & clauses",
      "Immutable activity",
    ],
    recommendedRole: "Accountant",
    roles: [
      {
        role: "Accountant",
        title: ROLE_UI.Accountant.title,
        summary: ROLE_UI.Accountant.summary,
      },
      {
        role: "Legal Advisor",
        title: ROLE_UI["Legal Advisor"].title,
        summary: ROLE_UI["Legal Advisor"].summary,
      },
    ],
  },
  {
    id: "field",
    title: "On-site & field",
    blurb: "Tickets, inspections, and proof — focused field tools.",
    customizes: [
      "Maintenance-first nav",
      "Ticket pulse ribbon",
      "Site context",
      "Proof documents",
    ],
    recommendedRole: "Maintenance Vendor",
    roles: [
      {
        role: "Maintenance Vendor",
        title: ROLE_UI["Maintenance Vendor"].title,
        summary: ROLE_UI["Maintenance Vendor"].summary,
      },
      {
        role: "Government Inspector",
        title: ROLE_UI["Government Inspector"].title,
        summary: ROLE_UI["Government Inspector"].summary,
      },
    ],
  },
];

export function categoryForPersona(id: PersonaId | string): CategoryOption {
  return (
    CATEGORY_FLOW.find((c) => c.id === id) || CATEGORY_FLOW[0]
  );
}

export function categoryForRole(role: string | undefined | null): CategoryOption {
  return categoryForPersona(personaIdForRole(role));
}

export function personaForRole(role: string | undefined | null): UserPersona {
  if (role === "Custom") return PERSONAS.household;
  const id =
    (role && ROLE_TO_PERSONA[role as UserRole]) || ("household" as PersonaId);
  return PERSONAS[id] || PERSONAS.household;
}

export function personaIdForRole(role: string | undefined | null): PersonaId {
  return personaForRole(role).id;
}

/** Flat catalogue for settings / marketing */
export const ROLE_CATALOG: {
  role: UserRole;
  persona: PersonaId;
  summary: string;
}[] = (Object.keys(ROLE_UI) as UserRole[])
  .filter((r) => r !== "Custom")
  .map((role) => ({
    role,
    persona: ROLE_TO_PERSONA[role],
    summary: ROLE_UI[role].summary,
  }));

/** Order modules for a persona; optional hide secondary */
export function modulesForPersona(
  persona: UserPersona,
  opts?: { includeSecondary?: boolean; excludeDashboard?: boolean }
): AppTab[] {
  const includeSecondary = opts?.includeSecondary !== false;
  let tabs = [...persona.modulePriority];
  if (!includeSecondary) {
    const sec = new Set(persona.secondaryModules);
    tabs = tabs.filter((t) => !sec.has(t) || t === "settings" || t === "dashboard");
  }
  if (opts?.excludeDashboard) tabs = tabs.filter((t) => t !== "dashboard");
  return tabs;
}
