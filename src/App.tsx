import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_PROPERTIES,
  INITIAL_LEASES,
  INITIAL_TRANSACTIONS,
  INITIAL_UTILITIES,
  INITIAL_MAINTENANCE,
  INITIAL_DOCUMENTS
} from './initialData';
import {
  Property,
  Lease,
  Transaction,
  Utility,
  MaintenanceTicket,
  Document,
  UserSession,
  UserRole
} from './types';
import Onboarding from './components/Onboarding';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PropertyHub from './components/PropertyHub';
import LeaseVault from './components/LeaseVault';
import PaymentHub from './components/PaymentHub';
import DocumentVault from './components/DocumentVault';
import UtilitiesTracker from './components/UtilitiesTracker';
import MaintenanceHub from './components/MaintenanceHub';
import ExpenseLab from './components/ExpenseLab';
import SettingsPanel from './components/SettingsPanel';
import LegalPolicies from './components/LegalPolicies';
import FinanceHub from './components/FinanceHub';
import AiAssistant from './components/AiAssistant';
import MarketingSite from './marketing/MarketingSite';
import {
  type AppTab,
  type MarketingPage,
  type RouteView,
  parseLocation,
  migrateHashToPath,
  ensureCanonicalPath,
  navigateView,
  navigateAppTab,
  pathForView,
  titleForView,
  isAppTab,
  APP_PATH,
} from './routing';
import { appendAudit } from './auditLog';
import AuditLogPanel from './components/AuditLogPanel';
import HomeLifeHub from './components/HomeLifeHub';
import { createDefaultHomeLife, normalizeHomeLife, type HomeLifeState } from './homeLife';
import {
  saveSession,
  clearSession,
  updateAccountProfile,
  findAccountByEmail,
} from './auth';
import ClerkSessionBridge from './components/ClerkSessionBridge';

const HAS_CLERK = Boolean(
  (import.meta as ImportMeta & { env?: { VITE_CLERK_PUBLISHABLE_KEY?: string } }).env
    ?.VITE_CLERK_PUBLISHABLE_KEY
);

function initialRoute(): RouteView {
  if (typeof window === 'undefined') return { kind: 'marketing', page: 'home' };
  migrateHashToPath();
  return parseLocation();
}

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [route, setRoute] = useState<RouteView>(() => initialRoute());

  const activeTab: AppTab = route.kind === 'app' ? route.tab : 'dashboard';
  const showOnboarding = route.kind === 'onboarding';
  /** Pending workspace setup after signup/login without full profile */
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const goApp = useCallback((tab: AppTab) => {
    navigateAppTab(tab);
  }, []);

  const goMarketing = useCallback((page: MarketingPage = 'home') => {
    navigateView({ kind: 'marketing', page });
  }, []);

  const goOnboarding = useCallback(() => {
    navigateView({ kind: 'onboarding' });
  }, []);

  const goAuth = useCallback((mode: 'login' | 'signup' = 'signup') => {
    navigateView({ kind: 'auth', mode });
  }, []);

  // Core Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [homeLife, setHomeLife] = useState<HomeLifeState>(() => createDefaultHomeLife());

  // Load from LocalStorage — only restore sessions tied to a real account
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('rv_session');
      if (savedSession) {
        const s = JSON.parse(savedSession) as UserSession;
        const email = (s.userEmail || "").trim();
        const acc = email ? findAccountByEmail(email) : null;
        // Orphan / guest sessions cannot open the app without authenticating
        if (acc && s.accountId) {
          setSession({
            ...s,
            accountId: acc.id,
            userEmail: acc.email,
            userName: s.userName || acc.name,
            plan: acc.plan || s.plan,
            trialStartedAt: acc.trialStartedAt || s.trialStartedAt,
            workspaceName: acc.workspaceName || s.workspaceName,
            role: acc.role || s.role,
          });
          // Account never finished workspace setup
          if (!acc.workspaceName) setNeedsOnboarding(true);
        } else {
          clearSession();
          localStorage.removeItem('rv_session');
        }
      }
    } catch (e) {
      console.error(e);
      clearSession();
      localStorage.removeItem('rv_session');
    }

    const savedProps = localStorage.getItem('rv_properties');
    const savedLeases = localStorage.getItem('rv_leases');
    const savedTx = localStorage.getItem('rv_transactions');
    const savedUtils = localStorage.getItem('rv_utilities');
    const savedTickets = localStorage.getItem('rv_tickets');
    const savedDocs = localStorage.getItem('rv_documents');
    const savedLife = localStorage.getItem('rv_home_life');

    if (savedProps) setProperties(JSON.parse(savedProps));
    if (savedLeases) setLeases(JSON.parse(savedLeases));
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedUtils) setUtilities(JSON.parse(savedUtils));
    if (savedTickets) setTickets(JSON.parse(savedTickets));
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
    if (savedLife) {
      try {
        const parsed = JSON.parse(savedLife) as HomeLifeState;
        if (parsed && Array.isArray(parsed.incomes)) setHomeLife(normalizeHomeLife(parsed));
      } catch {
        /* keep default */
      }
    }

    setSessionReady(true);
    // Best-effort device session audit (Web Crypto + geojs)
    void import('./sessionAudit')
      .then((m) => m.touchDeviceSession())
      .catch(() => undefined);
  }, []);

  // Pathname routing (back/forward + external links + deep links)
  useEffect(() => {
    migrateHashToPath();
    ensureCanonicalPath();
    const sync = () => {
      ensureCanonicalPath();
      setRoute(parseLocation());
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  // Keep address bar on the canonical path for the active view
  // e.g. bare /properties → /app/properties, /app/dashboard → /app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const expected = pathForView(route);
    if (window.location.pathname !== expected) {
      window.history.replaceState(null, '', expected);
    }
  }, [route]);

  // Document title
  useEffect(() => {
    document.title = titleForView(route);
  }, [route]);

  // Guard: wait for session hydration, then enforce auth on /app/*
  useEffect(() => {
    if (!sessionReady) return;
    if (session) {
      // Incomplete workspace → always finish onboarding first
      if (needsOnboarding) {
        if (route.kind !== 'onboarding') {
          navigateView({ kind: 'onboarding' }, { replace: true });
        }
        return;
      }
      // Fully signed-in: auth URLs go to deck
      // Onboarding URL is allowed after setup so users can reconfigure anytime
      if (route.kind === 'auth') {
        navigateView({ kind: 'app', tab: 'dashboard' }, { replace: true });
        return;
      }
      return;
    }
    // No session: app / onboarding require authentication first
    if (route.kind === 'app' || route.kind === 'onboarding') {
      navigateView({ kind: 'auth', mode: 'login' }, { replace: true });
    }
  }, [session, sessionReady, route.kind, needsOnboarding]);

  // Sync state helpers
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleOnboardingComplete = (
    role: UserRole,
    workspaceName: string,
    userName: string,
    userEmail: string,
    importSample: boolean,
    security2FAEnabled: boolean = true,
    extras?: {
      roleLabel?: string;
      customRoleId?: string;
      vaultData?: 'keep' | 'empty' | 'sample';
    }
  ) => {
    const activeSession: UserSession = {
      ...session,
      role,
      roleLabel: extras?.roleLabel,
      customRoleId: extras?.customRoleId,
      workspaceName,
      userName,
      userEmail: userEmail || session?.userEmail || '',
      notificationsEnabled: session?.notificationsEnabled ?? true,
      security2FAEnabled,
      e2eEncryptionEnabled: session?.e2eEncryptionEnabled ?? true,
      accountId: session?.accountId,
      plan: session?.plan || 'trial',
      trialStartedAt: session?.trialStartedAt || new Date().toISOString(),
    };

    setSession(activeSession);
    saveSession(activeSession);
    saveState('rv_session', activeSession);
    if (activeSession.accountId) {
      updateAccountProfile(activeSession.accountId, {
        name: userName,
        role,
        workspaceName,
      });
    }
    setNeedsOnboarding(false);

    // keep = reconfigure without wiping · sample · empty (first setup or explicit wipe)
    const vaultData =
      extras?.vaultData || (importSample ? 'sample' : 'empty');

    if (vaultData === 'keep') {
      // Profile + deck only — leave properties / life / ledger untouched
      return;
    }

    if (vaultData === 'sample') {
      // Optional illustrative starter set (user-opted) — not auto-loaded for every visitor
      const nextProps = INITIAL_PROPERTIES;
      const nextLeases = INITIAL_LEASES;
      const nextTx = INITIAL_TRANSACTIONS;
      const nextUtils = INITIAL_UTILITIES;
      const nextTickets = INITIAL_MAINTENANCE;
      const nextDocs = INITIAL_DOCUMENTS;

      setProperties(nextProps);
      setLeases(nextLeases);
      setTransactions(nextTx);
      setUtilities(nextUtils);
      setTickets(nextTickets);
      setDocuments(nextDocs);
      const nextLife = createDefaultHomeLife();
      setHomeLife(nextLife);

      saveState('rv_properties', nextProps);
      saveState('rv_leases', nextLeases);
      saveState('rv_transactions', nextTx);
      saveState('rv_utilities', nextUtils);
      saveState('rv_tickets', nextTickets);
      saveState('rv_documents', nextDocs);
      saveState('rv_home_life', nextLife);
    } else {
      setProperties([]);
      setLeases([]);
      setTransactions([]);
      setUtilities([]);
      setTickets([]);
      setDocuments([]);
      const emptyLife: HomeLifeState = {
        incomes: [],
        assets: [],
        chores: [],
        budgets: [],
        goals: [],
        customOptions: [],
      };
      setHomeLife(emptyLife);

      saveState('rv_properties', []);
      saveState('rv_leases', []);
      saveState('rv_transactions', []);
      saveState('rv_utilities', []);
      saveState('rv_tickets', []);
      saveState('rv_documents', []);
      saveState('rv_home_life', emptyLife);
    }
  };

  const handleHomeLifeChange = (next: HomeLifeState) => {
    setHomeLife(next);
    saveState('rv_home_life', next);
  };

  const actorName = () => session?.userName || session?.userEmail || 'workspace';

  const handleUpdateSession = (updated: UserSession) => {
    appendAudit({
      action: 'settings',
      entity: 'session',
      summary: `Session settings updated for ${updated.userName || updated.workspaceName}`,
      before: session,
      after: updated,
      actor: actorName(),
    });
    setSession(updated);
    saveSession(updated);
    saveState('rv_session', updated);
    if (updated.accountId) {
      updateAccountProfile(updated.accountId, {
        name: updated.userName,
        role: updated.role,
        workspaceName: updated.workspaceName,
      });
    }
  };

  const handleAuthSuccess = useCallback((next: UserSession, isNew: boolean) => {
    // Source of truth: account registry (not seeded demo localStorage)
    const acc = next.userEmail ? findAccountByEmail(next.userEmail) : null;
    if (!acc) {
      // Should never happen after successful signup/login
      clearSession();
      setSession(null);
      navigateView({ kind: 'auth', mode: 'login' }, { replace: true });
      return;
    }

    const merged: UserSession = {
      ...next,
      accountId: acc.id,
      userEmail: acc.email,
      userName: next.userName || acc.name,
      workspaceName: acc.workspaceName || next.workspaceName || 'My HomeOS',
      role: acc.role || next.role || 'Tenant',
      plan: acc.plan || next.plan || 'trial',
      trialStartedAt: acc.trialStartedAt || next.trialStartedAt,
    };

    setSession(merged);
    saveSession(merged);
    saveState('rv_session', merged);
    appendAudit({
      action: 'login',
      entity: 'session',
      summary: isNew
        ? `Account created · ${merged.userEmail}`
        : `Logged in · ${merged.userEmail}`,
      after: { email: merged.userEmail, name: merged.userName },
      actor: merged.userName || merged.userEmail,
    });

    // New signups and accounts without a configured workspace must onboard
    const finishedSetup = !isNew && !!(acc.workspaceName && acc.workspaceName.trim());
    if (!finishedSetup) {
      setNeedsOnboarding(true);
      navigateView({ kind: 'onboarding' }, { replace: true });
    } else {
      setNeedsOnboarding(false);
      // Preserve deep links (/app/settings, /app/payments, …) on refresh / Clerk re-auth
      const current = parseLocation();
      if (current.kind === 'app') {
        // Stay on the tab the user opened; only sync route state if needed
        navigateView(current, { replace: true });
      } else {
        navigateView({ kind: 'app', tab: 'dashboard' }, { replace: true });
      }
    }
  }, []);

  const handleLogout = () => {
    appendAudit({
      action: 'logout',
      entity: 'session',
      summary: 'Signed out of HomeOS session',
      actor: actorName(),
    });
    clearSession();
    localStorage.removeItem('rv_session');
    setSession(null);
    setNeedsOnboarding(false);
    navigateView({ kind: 'marketing', page: 'home' }, { replace: true });
    if (HAS_CLERK) {
      try {
        const clerk = (
          window as unknown as {
            Clerk?: { signOut: (o?: { redirectUrl?: string }) => Promise<void> };
          }
        ).Clerk;
        if (clerk?.signOut) void clerk.signOut({ redirectUrl: '/' });
      } catch {
        /* ignore */
      }
    }
  };

  const handleClerkSignOut = useCallback(() => {
    clearSession();
    localStorage.removeItem('rv_session');
    setSession(null);
    setNeedsOnboarding(false);
    navigateView({ kind: 'marketing', page: 'home' }, { replace: true });
  }, []);

  const handleWipeData = () => {
    appendAudit({
      action: 'delete',
      entity: 'workspace',
      summary: 'Workspace wipe requested — vault data cleared',
      actor: actorName(),
    });
    const accounts = localStorage.getItem('rv_accounts_v1');
    localStorage.clear();
    if (accounts) localStorage.setItem('rv_accounts_v1', accounts);
    setSession(null);
    setNeedsOnboarding(false);
    setProperties([]);
    setLeases([]);
    setTransactions([]);
    setUtilities([]);
    setTickets([]);
    setDocuments([]);
    setHomeLife({
      incomes: [],
      assets: [],
      chores: [],
      budgets: [],
      goals: [],
      customOptions: [],
    });
    navigateView({ kind: 'marketing', page: 'home' }, { replace: true });
  };

  // Property Handlers
  const handleAddProperty = (p: Property) => {
    const list = [p, ...properties];
    setProperties(list);
    saveState('rv_properties', list);
    appendAudit({
      action: 'create',
      entity: 'property',
      entityId: p.id,
      summary: `Created property “${p.name}” (${p.city})`,
      after: p,
      actor: actorName(),
    });

    // Auto generate a dummy utility account for this property
    const newUtil: Utility = {
      id: `util-${Date.now()}`,
      propertyId: p.id,
      propertyName: p.name,
      type: 'Electricity',
      provider: 'BESCOM',
      accountNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
      currentReading: 100,
      previousReading: 0,
      amountDue: 0,
      dueDate: '2026-08-10',
      status: 'Paid',
      usageValue: 100,
      history: [{ month: 'Jun', amount: 1200, usage: 100 }]
    };
    const updatedUtils = [newUtil, ...utilities];
    setUtilities(updatedUtils);
    saveState('rv_utilities', updatedUtils);
    appendAudit({
      action: 'create',
      entity: 'utility',
      entityId: newUtil.id,
      summary: `Auto-created electricity account for “${p.name}”`,
      after: newUtil,
      actor: actorName(),
    });
  };

  const handleDeleteProperty = (id: string) => {
    const prev = properties.find((p) => p.id === id);
    const list = properties.filter((p) => p.id !== id);
    setProperties(list);
    saveState('rv_properties', list);
    appendAudit({
      action: 'delete',
      entity: 'property',
      entityId: id,
      summary: `Deleted property “${prev?.name || id}”`,
      before: prev,
      actor: actorName(),
    });
  };

  const handleDuplicateProperty = (p: Property) => {
    const copy: Property = {
      ...p,
      id: `prop-${Date.now()}`,
      name: `${p.name} (Copy)`,
      status: 'Vacant'
    };
    handleAddProperty(copy);
  };

  const handleUpdateProperty = (updated: Property) => {
    const prev = properties.find((p) => p.id === updated.id);
    const list = properties.map((p) => (p.id === updated.id ? updated : p));
    setProperties(list);
    saveState("rv_properties", list);
    appendAudit({
      action: 'update',
      entity: 'property',
      entityId: updated.id,
      summary: `Updated property “${updated.name}”`,
      before: prev,
      after: updated,
      actor: actorName(),
    });
  };
 // Lease Handlers
  const handleAddLease = (l: Lease) => {
    const list = [l, ...leases];
    setLeases(list);
    saveState('rv_leases', list);
    appendAudit({
      action: 'create',
      entity: 'lease',
      entityId: l.id,
      summary: `Created lease for “${l.propertyName}” (${l.tenantName})`,
      after: l,
      actor: actorName(),
    });
  };

  const handleUpdateLease = (updated: Lease) => {
    const prev = leases.find((l) => l.id === updated.id);
    const list = leases.map((l) => (l.id === updated.id ? updated : l));
    setLeases(list);
    saveState('rv_leases', list);
    appendAudit({
      action: 'update',
      entity: 'lease',
      entityId: updated.id,
      summary: `Updated lease for “${updated.propertyName}” → ${updated.status}`,
      before: prev,
      after: updated,
      actor: actorName(),
    });
  };

  // Payment Handlers
  const handleAddTransaction = (t: Transaction) => {
    const list = [t, ...transactions];
    setTransactions(list);
    saveState('rv_transactions', list);
    appendAudit({
      action: 'create',
      entity: 'transaction',
      entityId: t.id,
      summary: `Added ${t.category} ₹${t.amount} for “${t.propertyName}”`,
      after: t,
      actor: actorName(),
    });
  };

  const handleAddTransactions = (ts: Transaction[]) => {
    if (!ts || ts.length === 0) return;
    const list = [...ts, ...transactions];
    setTransactions(list);
    saveState('rv_transactions', list);
    appendAudit({
      action: 'import',
      entity: 'transaction',
      summary: `Imported ${ts.length} ledger entr${ts.length === 1 ? 'y' : 'ies'}`,
      after: { count: ts.length, ids: ts.map((t) => t.id) },
      actor: actorName(),
    });
  };
  const handleDeleteTransaction = (id: string) => {
    const prev = transactions.find((t) => t.id === id);
    const list = transactions.filter((t) => t.id !== id);
    setTransactions(list);
    saveState('rv_transactions', list);
    appendAudit({
      action: 'delete',
      entity: 'transaction',
      entityId: id,
      summary: `Deleted ${prev?.category || 'transaction'} ₹${prev?.amount ?? '—'} (${prev?.propertyName || id})`,
      before: prev,
      actor: actorName(),
    });
  };
  const handleSettlePayment = (id: string, method: 'UPI' | 'Credit Card' | 'Bank Transfer') => {
    const prev = transactions.find((t) => t.id === id);
    const list = transactions.map((t) => {
      if (t.id === id) {
        return { ...t, status: 'Paid' as const, paymentMethod: method };
      }
      return t;
    });
    setTransactions(list);
    saveState('rv_transactions', list);
    const after = list.find((t) => t.id === id);
    appendAudit({
      action: 'settle',
      entity: 'transaction',
      entityId: id,
      summary: `Settled ₹${prev?.amount ?? '—'} via ${method} · ${prev?.propertyName || id}`,
      before: prev,
      after,
      actor: actorName(),
    });
  };

  // Utility Handlers
  const handleAddUtilityReading = (
    propId: string,
    type: string,
    reading: number,
    amount: number,
    dueDate: string
  ) => {
    const propName = properties.find((p) => p.id === propId)?.name || 'Property';
    const list = utilities.map((u) => {
      if (u.propertyId === propId && u.type === type) {
        const prev = u.currentReading || 0;
        const diff = Math.max(reading - prev, 0);
        return {
          ...u,
          previousReading: prev,
          currentReading: reading,
          amountDue: amount,
          status: 'Unpaid' as const,
          dueDate,
          usageValue: diff,
          history: [...u.history, { month: 'Jul', amount, usage: diff }]
        };
      }
      return u;
    });
    setUtilities(list);
    saveState('rv_utilities', list);
    appendAudit({
      action: 'update',
      entity: 'utility',
      entityId: propId,
      summary: `Recorded ${type} reading ${reading} · ₹${amount} due ${dueDate}`,
      after: { propId, type, reading, amount, dueDate },
      actor: actorName(),
    });

    // Log corresponding ledger entry
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      propertyId: propId,
      propertyName: propName,
      category: type as any,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      paymentMethod: 'UPI',
      invoiceNumber: `INV-UTIL-${Date.now().toString().slice(-4)}`,
      description: `Pending ${type} bill entry`
    };
    handleAddTransaction(newTx);
  };

  // Maintenance Handlers
  const handleAddTicket = (ticket: MaintenanceTicket) => {
    const list = [ticket, ...tickets];
    setTickets(list);
    saveState('rv_tickets', list);
    appendAudit({
      action: 'create',
      entity: 'maintenance',
      entityId: ticket.id,
      summary: `Opened ticket “${ticket.title}” · ${ticket.priority}`,
      after: ticket,
      actor: actorName(),
    });
  };

  const handleUpdateTicketStatus = (
    id: string,
    status: 'Pending' | 'In Progress' | 'Resolved',
    actualCost?: number
  ) => {
    const prev = tickets.find((t) => t.id === id);
    const list = tickets.map((t) => {
      if (t.id === id) {
        const historyNote =
          status === 'In Progress' ? 'Contractor dispatched to site.' : 'Invoice settled. Job completed.';
        return {
          ...t,
          status,
          actualCost,
          timeline: [
            ...t.timeline,
            { status, date: new Date().toISOString().split('T')[0], note: historyNote }
          ]
        };
      }
      return t;
    });
    setTickets(list);
    saveState('rv_tickets', list);
    appendAudit({
      action: 'update',
      entity: 'maintenance',
      entityId: id,
      summary: `Ticket “${prev?.title || id}” → ${status}${actualCost != null ? ` · ₹${actualCost}` : ''}`,
      before: prev,
      after: list.find((t) => t.id === id),
      actor: actorName(),
    });

    // If resolved, register expense in main financial ledger automatically
    if (status === 'Resolved' && actualCost) {
      const targetTicket = tickets.find((t) => t.id === id);
      if (targetTicket) {
        const maintTx: Transaction = {
          id: `tx-maint-${Date.now()}`,
          propertyId: targetTicket.propertyId,
          propertyName: targetTicket.propertyName,
          category: 'Repairs',
          amount: actualCost,
          date: new Date().toISOString().split('T')[0],
          status: 'Paid',
          paymentMethod: 'Credit Card',
          invoiceNumber: `INV-MAINT-${Date.now().toString().slice(-4)}`,
          description: `Settled repairs for ${targetTicket.title}`
        };
        handleAddTransaction(maintTx);
      }
    }
  };

  // Document Handlers
  const handleUploadDocument = (doc: Document) => {
    const list = [doc, ...documents];
    setDocuments(list);
    saveState('rv_documents', list);
    appendAudit({
      action: 'create',
      entity: 'document',
      entityId: doc.id,
      summary: `Uploaded document “${doc.name}” (${doc.category})`,
      after: doc,
      actor: actorName(),
    });
  };

  const handleDeleteDocument = (id: string) => {
    const prev = documents.find((d) => d.id === id);
    const list = documents.filter((d) => d.id !== id);
    setDocuments(list);
    saveState('rv_documents', list);
    appendAudit({
      action: 'delete',
      entity: 'document',
      entityId: id,
      summary: `Deleted document “${prev?.name || id}”`,
      before: prev,
      actor: actorName(),
    });
  };

  // Live Import Extracted AI OCR Fields directly to Workspace!
  const handleImportOcrData = (ocr: any) => {
    if (!ocr) return;

    if (ocr.tenantName) {
      // Lease Type Import
      const newProp: Property = {
        id: `prop-ocr-${Date.now()}`,
        name: ocr.propertyName,
        address: ocr.address,
        city: 'Bengaluru',
        type: 'Residential',
        status: 'Occupied',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format&fit=crop&q=60',
        rentAmount: ocr.rentAmount,
        depositAmount: ocr.depositAmount,
        rooms: 3,
        bathrooms: 3,
        areaSqFt: 1800,
        parkingSpots: 1,
        petFriendly: true,
        amenities: ['Power Backup', 'Lift', 'Clubhouse'],
        ownerName: ocr.landlordName,
        ownerContact: '+91 99009 12345',
        yearBuilt: 2023,
        rating: 5.0,
        tags: ['OCR-Imported', 'NewListing']
      };

      const newLease: Lease = {
        id: `lease-ocr-${Date.now()}`,
        propertyId: newProp.id,
        propertyName: newProp.name,
        tenantName: ocr.tenantName,
        tenantEmail: 'rohit@gmail.com',
        landlordName: ocr.landlordName,
        startDate: ocr.startDate,
        endDate: ocr.endDate,
        monthlyRent: ocr.rentAmount,
        securityDeposit: ocr.depositAmount,
        status: 'Pending Signature',
        signatures: {
          tenantSigned: false,
          landlordSigned: false
        },
        clauses: ocr.clauses || ['Rent due on or before 5th of each calendar month.'],
        version: 1,
        notaryDetails: 'Draft OCR completed. Awaiting notary stamps.'
      };

      const depositTx: Transaction = {
        id: `tx-dep-${Date.now()}`,
        propertyId: newProp.id,
        propertyName: newProp.name,
        category: 'Deposit',
        amount: ocr.depositAmount,
        date: ocr.startDate,
        status: 'Pending',
        paymentMethod: 'Bank Transfer',
        invoiceNumber: `INV-DEP-${Date.now().toString().slice(-4)}`,
        description: 'Advance security deposit billing'
      };

      handleAddProperty(newProp);
      handleAddLease(newLease);
      handleAddTransaction(depositTx);
    } else if (ocr.provider) {
      // Utility Type Import
      const utilProp = properties[0] || INITIAL_PROPERTIES[0];
      const newTx: Transaction = {
        id: `tx-util-ocr-${Date.now()}`,
        propertyId: utilProp.id,
        propertyName: utilProp.name,
        category: ocr.category,
        amount: ocr.amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        paymentMethod: 'UPI',
        invoiceNumber: `INV-${ocr.provider}-${Date.now().toString().slice(-4)}`,
        description: `Imported ${ocr.category} statement`
      };
      handleAddTransaction(newTx);
    }
  };

  const clerkBridge =
    HAS_CLERK ? (
      <ClerkSessionBridge
        hasSession={!!session}
        sessionReady={sessionReady}
        onClerkAuth={handleAuthSuccess}
        onClerkSignOut={handleClerkSignOut}
        currentSession={session}
        onPlanSync={handleUpdateSession}
      />
    ) : null;

  // Marketing → auth → onboarding → workspace
  // While hydrating local session, do NOT mount AuthPage (it rewrites URL to /login
  // and would clobber deep links like /app/settings after login restore).
  if (!sessionReady) {
    return (
      <>
        {clerkBridge}
        <div className="min-h-dvh bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-3" />
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Loading HomeOS…
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    if (route.kind === 'auth' || route.kind === 'onboarding' || route.kind === 'app') {
      // Unauthenticated app/onboarding → auth (URL may still be /app/* until guard navigates)
      const mode = route.kind === 'auth' ? route.mode : 'login';
      return (
        <>
          {clerkBridge}
          <AuthPage
            mode={mode}
            onModeChange={(m) => navigateView({ kind: 'auth', mode: m })}
            onSuccess={handleAuthSuccess}
            onBackToSite={() => goMarketing('home')}
          />
        </>
      );
    }
    return (
      <>
        {clerkBridge}
        <MarketingSite
          page={route.kind === 'marketing' ? route.page : 'home'}
          onNavigate={(page) => goMarketing(page)}
          onLaunch={() => {
            goAuth('signup');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogin={() => {
            goAuth('login');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </>
    );
  }

  // First-time setup OR intentional reconfigure at /app/onboarding
  if (session && (needsOnboarding || route.kind === 'onboarding')) {
    const reconfigure = !needsOnboarding;
    return (
      <>
      {clerkBridge}
      <Onboarding
        mode={reconfigure ? 'reconfigure' : 'setup'}
        onCancel={
          reconfigure
            ? () => navigateView({ kind: 'app', tab: 'settings' }, { replace: true })
            : undefined
        }
        onBackToSite={
          reconfigure
            ? undefined
            : () => {
                clearSession();
                localStorage.removeItem('rv_session');
                setSession(null);
                setNeedsOnboarding(false);
                if (HAS_CLERK) {
                  try {
                    const clerk = (
                      window as unknown as {
                        Clerk?: { signOut: (o?: { redirectUrl?: string }) => Promise<void> };
                      }
                    ).Clerk;
                    if (clerk?.signOut) void clerk.signOut({ redirectUrl: '/' });
                  } catch {
                    /* ignore */
                  }
                }
                goMarketing('home');
              }
        }
        prefillName={session.userName}
        prefillEmail={session.userEmail}
        prefillWorkspace={session.workspaceName}
        prefillRole={session.role}
        prefillRoleLabel={session.roleLabel}
        onComplete={(role, workspaceName, userName, userEmail, importSample, security2FAEnabled, extras) => {
          handleOnboardingComplete(
            role,
            workspaceName,
            userName || session.userName,
            userEmail || session.userEmail,
            importSample,
            security2FAEnabled,
            extras
          );
          const roleShown = extras?.roleLabel || role;
          const dataNote =
            extras?.vaultData === 'keep'
              ? ' (kept vault data)'
              : extras?.vaultData === 'sample' || importSample
                ? ' with sample data'
                : extras?.vaultData === 'empty'
                  ? ' (empty vault)'
                  : '';
          appendAudit({
            action: reconfigure ? 'settings' : 'login',
            entity: 'workspace',
            summary: reconfigure
              ? `Workspace reconfigured as ${roleShown}${dataNote}`
              : `Workspace “${workspaceName}” configured as ${roleShown}${dataNote}`,
            after: {
              role,
              roleLabel: extras?.roleLabel,
              workspaceName,
              userName,
              userEmail,
              vaultData: extras?.vaultData,
            },
            actor: userName || session.userName || userEmail,
          });
          navigateView({ kind: 'app', tab: 'dashboard' }, { replace: true });
        }}
      />
      </>
    );
  }

  // Logged-in users can still browse marketing pages
  if (route.kind === 'marketing') {
    return (
      <>
      {clerkBridge}
      <MarketingSite
        page={route.page}
        onNavigate={(page) => goMarketing(page)}
        onLaunch={() => {
          // Fully onboarded → deck; otherwise finish setup
          if (needsOnboarding) {
            navigateView({ kind: 'onboarding' }, { replace: true });
          } else {
            goApp('dashboard');
          }
        }}
        onLogin={() => {
          if (needsOnboarding) {
            navigateView({ kind: 'onboarding' }, { replace: true });
          } else {
            goApp('dashboard');
          }
        }}
      />
      </>
    );
  }

  // Active Workspace Context Payload for context-aware AI assistant chatbot
  const workspaceContext = {
    workspaceName: session.workspaceName,
    activeRole: session.role,
    properties,
    leases,
    transactions,
    utilities,
    tickets
  };

  const changeTab = (tab: string) => {
    if (isAppTab(tab)) goApp(tab);
  };

  return (
    <>
    {clerkBridge}
    {/*
      Viewport shell: height locked to the screen.
      Sidebar is a non-scrolling flex column; only <main> scrolls.
      Avoids position:fixed + transform bugs that made the nav “move”.
    */}
    <div className="h-dvh max-h-dvh w-full bg-black text-[#FAFAFA] flex flex-col lg:flex-row selection:bg-white/20 font-sans antialiased overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={changeTab}
        userName={session.userName}
        userEmail={session.userEmail}
        avatarUrl={session.avatarUrl}
        userRole={session.role}
        workspaceName={session.workspaceName}
        onLogout={handleLogout}
        onWebsiteHome={() => goMarketing('home')}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-black relative overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {/* key=tab remounts shell so premium pageEnter runs on every module switch */}
        <div
          key={activeTab}
          className="flex-1 flex flex-col min-w-0 min-h-0 animate-pageEnter"
          data-route={APP_PATH[activeTab]}
        >
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            properties={properties}
            leases={leases}
            transactions={transactions}
            tickets={tickets}
            homeLife={homeLife}
            userName={session.userName}
            userEmail={session.userEmail}
            avatarUrl={session.avatarUrl}
            userRole={session.role}
            workspaceName={session.workspaceName}
            onNavigate={changeTab}
            onHomeLifeChange={handleHomeLifeChange}
          />
        )}

        {activeTab === 'properties' && (
          <PropertyHub
            properties={properties}
            onAddProperty={handleAddProperty}
            onDeleteProperty={handleDeleteProperty}
            onDuplicateProperty={handleDuplicateProperty}
            onUpdateProperty={handleUpdateProperty}
            userRole={session.role}
          />
        )}

        {activeTab === 'leases' && (
          <LeaseVault
            leases={leases}
            onAddLease={handleAddLease}
            onUpdateLease={handleUpdateLease}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentHub
            transactions={transactions}
            onSettlePayment={handleSettlePayment}
            onAddTransaction={handleAddTransaction}
            leases={leases}
            onAddTransactions={handleAddTransactions}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesTracker
            utilities={utilities}
            onAddUtilityReading={handleAddUtilityReading}
            properties={properties}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceHub
            tickets={tickets}
            onAddTicket={handleAddTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            properties={properties}
          />
        )}

        {activeTab === 'expenses' && <ExpenseLab transactions={transactions} />}

        {activeTab === 'documents' && (
          <DocumentVault
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onImportOcrData={handleImportOcrData}
          />
        )}

        {activeTab === 'finances' && <FinanceHub role={session.role} transactions={transactions} />}
        {activeTab === 'life' && (
          <HomeLifeHub state={homeLife} onChange={handleHomeLifeChange} />
        )}
        {activeTab === 'activity' && <AuditLogPanel />}
        {activeTab === 'legal' && <LegalPolicies />}
        {activeTab === 'settings' && (
          <SettingsPanel
            session={session}
            onUpdateSession={handleUpdateSession}
            onWipeData={handleWipeData}
            onReconfigureWorkspace={() => goOnboarding()}
            properties={properties}
            leases={leases}
            transactions={transactions}
            tickets={tickets}
          />
        )}

        </div>
        {/* State-aware AI Assistant Copilot */}
        <AiAssistant currentWorkspace={workspaceContext} onNavigate={changeTab} />
      </main>
    </div>
    </>
  );
}
