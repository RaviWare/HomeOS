export type UserRole =
  | 'Tenant'
  | 'Landlord'
  | 'Property Owner'
  | 'Property Manager'
  | 'Builder'
  | 'Housing Society Admin'
  | 'Family Member'
  | 'Accountant'
  | 'Legal Advisor'
  | 'Maintenance Vendor'
  | 'Government Inspector'
  | 'Enterprise Admin';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'Residential' | 'Commercial' | 'Co-Living' | 'Student Housing';
  status: 'Occupied' | 'Vacant' | 'Under Maintenance' | 'Listed';
  image: string;
  rentAmount: number;
  depositAmount: number;
  rooms: number;
  bathrooms: number;
  areaSqFt: number;
  parkingSpots: number;
  petFriendly: boolean;
  amenities: string[];
  ownerName: string;
  ownerContact: string;
  managerName?: string;
  yearBuilt: number;
  rating: number;
  notes?: string;
  tags: string[];
}

export interface Lease {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  tenantEmail: string;
  landlordName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Pending Signature' | 'Expired' | 'Terminated';
  signatures: {
    tenantSigned?: boolean;
    tenantSignedAt?: string;
    landlordSigned?: boolean;
    landlordSignedAt?: string;
  };
  clauses: string[];
  version: number;
  notaryDetails?: string;
  stampDutyPaid?: number;
}

export interface Transaction {
  id: string;
  propertyId: string;
  propertyName: string;
  category: 'Rent' | 'Deposit' | 'Maintenance' | 'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Repairs' | 'Cleaning' | 'Tax' | 'Refund' | 'Other';
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod: 'UPI' | 'Credit Card' | 'Bank Transfer' | 'Cash';
  invoiceNumber: string;
  description: string;
}

export interface Document {
  id: string;
  name: string;
  category: 'Lease' | 'Receipt' | 'Utility' | 'Maintenance' | 'Certificate' | 'Other';
  fileType: 'pdf' | 'image' | 'doc' | 'excel';
  uploadedAt: string;
  size: string;
  url: string;
  ocrExtractedData?: any;
}

export interface Utility {
  id: string;
  propertyId: string;
  propertyName: string;
  type: 'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Cable' | 'Society Charges';
  provider: string;
  accountNumber: string;
  currentReading?: number;
  previousReading?: number;
  amountDue: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid';
  usageValue: number; // in kWh, Litres, etc.
  history: Array<{ month: string; amount: number; usage: number }>;
}

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  description: string;
  priority: 'Urgent' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Resolved';
  vendorName: string;
  vendorPhone: string;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  timeline: Array<{ status: string; date: string; note: string }>;
  rating?: number;
}

export interface ExpenseBudget {
  monthlyLimit: number;
  categories: Record<string, number>; // Category name -> spent amount
}

export interface UserSession {
  role: UserRole;
  workspaceName: string;
  userName: string;
  userEmail: string;
  notificationsEnabled: boolean;
  security2FAEnabled: boolean;
  e2eEncryptionEnabled: boolean;
}
