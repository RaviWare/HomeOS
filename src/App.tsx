import React, { useState, useEffect } from 'react';
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
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PropertyHub from './components/PropertyHub';
import LeaseVault from './components/LeaseVault';
import PaymentHub from './components/PaymentHub';
import DocumentVault from './components/DocumentVault';
import UtilitiesTracker from './components/UtilitiesTracker';
import MaintenanceHub from './components/MaintenanceHub';
import ExpenseLab from './components/ExpenseLab';
import McpConsole from './components/McpConsole';
import SettingsPanel from './components/SettingsPanel';
import LegalPolicies from './components/LegalPolicies';
import FinanceHub from './components/FinanceHub';
import AiAssistant from './components/AiAssistant';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'properties'
    | 'leases'
    | 'payments'
    | 'utilities'
    | 'maintenance'
    | 'expenses'
    | 'documents'
    | 'mcp'
    | 'settings'
  | 'legal' | 'finances' >('dashboard');

  // Core Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('rv_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        console.error(e);
      }
    }

    const savedProps = localStorage.getItem('rv_properties');
    const savedLeases = localStorage.getItem('rv_leases');
    const savedTx = localStorage.getItem('rv_transactions');
    const savedUtils = localStorage.getItem('rv_utilities');
    const savedTickets = localStorage.getItem('rv_tickets');
    const savedDocs = localStorage.getItem('rv_documents');

    if (savedProps) setProperties(JSON.parse(savedProps));
    if (savedLeases) setLeases(JSON.parse(savedLeases));
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedUtils) setUtilities(JSON.parse(savedUtils));
    if (savedTickets) setTickets(JSON.parse(savedTickets));
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
  }, []);

  // Sync state helpers
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleOnboardingComplete = (
    role: UserRole,
    workspaceName: string,
    userName: string,
    userEmail: string,
    importSample: boolean
  ) => {
    const activeSession: UserSession = {
      role,
      workspaceName,
      userName,
      userEmail,
      notificationsEnabled: true,
      security2FAEnabled: true,
      e2eEncryptionEnabled: true
    };

    setSession(activeSession);
    saveState('rv_session', activeSession);

    if (importSample) {
      setProperties(INITIAL_PROPERTIES);
      setLeases(INITIAL_LEASES);
      setTransactions(INITIAL_TRANSACTIONS);
      setUtilities(INITIAL_UTILITIES);
      setTickets(INITIAL_MAINTENANCE);
      setDocuments(INITIAL_DOCUMENTS);

      saveState('rv_properties', INITIAL_PROPERTIES);
      saveState('rv_leases', INITIAL_LEASES);
      saveState('rv_transactions', INITIAL_TRANSACTIONS);
      saveState('rv_utilities', INITIAL_UTILITIES);
      saveState('rv_tickets', INITIAL_MAINTENANCE);
      saveState('rv_documents', INITIAL_DOCUMENTS);
    } else {
      setProperties([]);
      setLeases([]);
      setTransactions([]);
      setUtilities([]);
      setTickets([]);
      setDocuments([]);

      saveState('rv_properties', []);
      saveState('rv_leases', []);
      saveState('rv_transactions', []);
      saveState('rv_utilities', []);
      saveState('rv_tickets', []);
      saveState('rv_documents', []);
    }
  };

  const handleUpdateSession = (updated: UserSession) => {
    setSession(updated);
    saveState('rv_session', updated);
  };

  const handleLogout = () => {
    localStorage.removeItem('rv_session');
    setSession(null);
  };

  const handleWipeData = () => {
    localStorage.clear();
    setSession(null);
    setProperties([]);
    setLeases([]);
    setTransactions([]);
    setUtilities([]);
    setTickets([]);
    setDocuments([]);
  };

  // Property Handlers
  const handleAddProperty = (p: Property) => {
    const list = [p, ...properties];
    setProperties(list);
    saveState('rv_properties', list);

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
  };

  const handleDeleteProperty = (id: string) => {
    const list = properties.filter((p) => p.id !== id);
    setProperties(list);
    saveState('rv_properties', list);
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
 const list = properties.map((p) => (p.id === updated.id ? updated : p));
 setProperties(list);
 saveState("rv_properties", list);
 };
 // Lease Handlers
  const handleAddLease = (l: Lease) => {
    const list = [l, ...leases];
    setLeases(list);
    saveState('rv_leases', list);
  };

  const handleUpdateLease = (updated: Lease) => {
    const list = leases.map((l) => (l.id === updated.id ? updated : l));
    setLeases(list);
    saveState('rv_leases', list);
  };

  // Payment Handlers
  const handleAddTransaction = (t: Transaction) => {
    const list = [t, ...transactions];
    setTransactions(list);
    saveState('rv_transactions', list);
  };

  const handleAddTransactions = (ts: Transaction[]) => { if (!ts || ts.length === 0) return; const list = [...ts, ...transactions]; setTransactions(list); saveState('rv_transactions', list); };
 const handleDeleteTransaction = (id: string) => { const list = transactions.filter((t) => t.id !== id); setTransactions(list); saveState('rv_transactions', list); };
 const handleSettlePayment = (id: string, method: 'UPI' | 'Credit Card' | 'Bank Transfer') => {
    const list = transactions.map((t) => {
      if (t.id === id) {
        return { ...t, status: 'Paid' as const, paymentMethod: method };
      }
      return t;
    });
    setTransactions(list);
    saveState('rv_transactions', list);
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
  };

  const handleUpdateTicketStatus = (
    id: string,
    status: 'Pending' | 'In Progress' | 'Resolved',
    actualCost?: number
  ) => {
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
  };

  const handleDeleteDocument = (id: string) => {
    const list = documents.filter((d) => d.id !== id);
    setDocuments(list);
    saveState('rv_documents', list);
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

  // Render Core Workspace Layout
  if (!session) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
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

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB] flex flex-col lg:flex-row selection:bg-[#374151] font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        userName={session.userName}
        userRole={session.role}
        workspaceName={session.workspaceName}
        onLogout={handleLogout}
      />

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B1220] relative">
 <div key={activeTab} className="flex-1 flex flex-col min-w-0 animate-pageEnter">
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard
            properties={properties}
            leases={leases}
            transactions={transactions}
            tickets={tickets}
            userName={session.userName}
            userRole={session.role}
            onNavigate={(tab) => setActiveTab(tab)}
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

        {activeTab === 'mcp' && (
          <McpConsole
            properties={properties}
            leases={leases}
            transactions={transactions}
          />
        )}

        {activeTab === 'finances' && <FinanceHub role={session.role} transactions={transactions} />}
 {activeTab === 'legal' && <LegalPolicies />}
 {activeTab === 'settings' && (
          <SettingsPanel
            session={session}
            onUpdateSession={handleUpdateSession}
            onWipeData={handleWipeData}
          />
        )}

        </div>
 {/* State-aware AI Assistant Copilot */}
        <AiAssistant currentWorkspace={workspaceContext} />
      </main>
    </div>
  );
}
