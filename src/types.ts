/**
 * Internal role IDs (stable for storage / APIs).
 * UI labels via roleTitle() in userPersonas — e.g. Tenant → "Home renter".
 */
export type UserRole =
  | 'Tenant'
  | 'Homeowner'
  | 'Family Member'
  | 'Landlord'
  | 'Property Owner'
  /** Multi-unit short-stay / Airbnb / homestay operator */
  | 'ShortStay Host'
  | 'Property Manager'
  | 'Builder'
  | 'Housing Society Admin'
  | 'Accountant'
  | 'Legal Advisor'
  | 'Maintenance Vendor'
  | 'Government Inspector'
  | 'Enterprise Admin'
  | 'Custom';

/** How a unit is monetized */
export type RentalModel = 'long_term' | 'short_term' | 'mixed' | 'own_occupy';

/** Booking / listing channels (Airbnb-style + offline) */
export type ListingChannel =
  | 'Airbnb'
  | 'Booking.com'
  | 'MakeMyTrip'
  | 'Agoda'
  | 'VRBO'
  | 'OYO'
  | 'Direct'
  | 'Broker'
  | 'Other';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type:
    | 'Residential'
    | 'Commercial'
    | 'Co-Living'
    | 'Student Housing'
    | 'Holiday Home'
    | 'Serviced Apartment'
    | 'PG / Hostel'
    | 'Society Unit';
  status: 'Occupied' | 'Vacant' | 'Under Maintenance' | 'Listed';
  image: string;
  /** Typical monthly rent (LTR) or avg monthly yield (STR) */
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
  /** long_term lease vs short-term / Airbnb-style / both */
  rentalModel?: RentalModel;
  /** Where this unit is listed (multi-select) */
  listingChannels?: ListingChannel[];
  /** External listing IDs / URLs for ops notes */
  listingRef?: string;
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
  category:
    | 'Rent'
    | 'Deposit'
    | 'Maintenance'
    | 'Electricity'
    | 'Water'
    | 'Gas'
    | 'Internet'
    | 'Repairs'
    | 'Cleaning'
    | 'Tax'
    | 'Refund'
    | 'Channel income'
    | 'Platform fee'
    | 'Management fee'
    | 'Furnishings'
    | 'Society dues'
    | 'Other';
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod: 'UPI' | 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Platform payout';
  invoiceNumber: string;
  description: string;
  /** Optional channel for STR payouts (Airbnb, Booking.com, …) */
  channel?: ListingChannel | string;
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
  /** Display label override for custom roles. Falls back to roleTitle(role). */
  roleLabel?: string;
  /** Links to a saved custom role blueprint in localStorage */
  customRoleId?: string;
  workspaceName: string;
  userName: string;
  userEmail: string;
  notificationsEnabled: boolean;
  security2FAEnabled: boolean;
  e2eEncryptionEnabled: boolean;
  /** Linked account id from auth registry */
  accountId?: string;
  plan?: "trial" | "personal" | "pro" | "team";
  trialStartedAt?: string;
  /** Billing preferences (client-side plan management) */
  billingCycle?: "monthly" | "annual";
  autoRenew?: boolean;
  /** Extra months granted at annual checkout (e.g. 3) */
  bonusMonths?: number;
  planStartedAt?: string;
  planExpiresAt?: string;
  /** Custom uploaded profile photo (optimized data URL). Falls back to Gravatar via email. */
  avatarUrl?: string;
}
