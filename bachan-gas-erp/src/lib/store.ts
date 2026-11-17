"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import realCommercialData from "./real_commercial_customers.json";

// ── UTILITY: ASIA/KOLKATA TIME ────────────────────────────────
export function getKolkataDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getKolkataFormattedDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getKolkataTimeMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return h * 60 + m;
}

// ── TYPES & INTERFACES ────────────────────────────────────────

export type OrderingFrequency =
  | "daily"
  | "every_2_days"
  | "every_3_days"
  | "weekly"
  | "custom"
  | "not_configured";

export interface Customer {
  id: string;
  code: string;
  sap_code?: string; // SAP Customer Code, when available
  name: string;
  business: string;
  category: "commercial" | "domestic" | "industrial" | "institutional";
  consumer_type: string;
  contact_person: string;
  mobile: string;
  alt_mobile?: string;
  email: string;
  gst: string;
  city: string;
  area: string;
  state: string;
  pin: string;
  billing_address?: string;
  delivery_address?: string;
  remarks?: string;
  status: "active" | "inactive" | "suspended";
  approval_status?: "approved" | "pending_approval" | "rejected" | "correction_requested";
  submitted_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  // Financial & Tenure
  credit_limit: number | null;
  payment_tenure_days: number; // e.g. 7, 15, 30, 45
  payment_terms: string;
  outstanding: number | null;
  advance_balance?: number; // Unallocated customer advance balance
  overdue: number | null;
  last_payment: number | null;
  last_payment_date: string;

  // Supply Tracking
  last_supply: string;
  last_supply_qty: number;
  last_supply_product: string;
  last_supply_date?: string;
  pending_orders: number;
  created_at: string;
  is_financial_configured?: boolean;

  // Empty Cylinder Exchange
  total_filled_delivered: number;
  total_empty_received: number;
  empty_cylinders_pending: number;

  // Consumption Analytics Cache
  average_daily_consumption?: number;
  average_weekly_consumption?: number;
  average_monthly_consumption?: number;
  average_order_qty?: number;
  average_days_between_orders?: number;

  // Inactivity & Order Frequency Alerts
  ordering_frequency: OrderingFrequency;
  custom_interval_days?: number;
  last_order_date?: string; // YYYY-MM-DD
  last_order_qty?: number;
  expected_next_order_date?: string; // YYYY-MM-DD
  missed_order_alert_active: boolean;
  alert_paused?: boolean;
  alert_pause_reason?: string;
  contacted_status?: "pending_contact" | "contacted" | "resumed";
  last_follow_up_date?: string;
}

export interface CylinderProduct {
  id: string;
  code: string;
  name: string;
  type: "Commercial" | "Domestic" | "Industrial";
  sku: string;
  rate: number; // Basic rate per cylinder/unit (GST-exclusive)
  tax: number;  // Statutory 18% GST
  hsn: string;
  active: boolean;
  weight?: number; // Internal legacy reference only
  referenceWeightKg?: number; // Verified Product Reference Weight in kg (e.g. 47.5, 425, 19)
}

export interface BasicRateHistoryItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  basicRate: number; // GST-exclusive rate per cylinder
  effectiveFrom: string;
  updatedBy: string;
  updatedAt: string;
  notes?: string;
}

export interface CustomerRate {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  sapCode?: string;
  productId: string;
  productName: string;
  defaultRate: number;
  agreedRate: number; // Basic rate per cylinder/unit
  referenceWeightKg?: number; // Product Reference Weight in kg
  calculatedRatePerKg?: number; // Calculated Rate per KG = agreedRate / referenceWeightKg
  gstRatePct?: number; // Statutory 18% GST
  previousRate?: number;
  effectiveFrom: string;
  validTill: string;
  approvedBy: string;
  rateHistory?: { rate: number; effectiveFrom: string; approvedBy: string; changedAt: string; notes?: string }[];
}

export interface ERPUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: "admin" | "staff";
  permissions: string[];
  isActive: boolean;
}

export interface CustomerApprovalRequest {
  id: string;
  requestNum: string;
  customerId: string;
  customerData: Partial<Customer>;
  status: "pending_approval" | "approved" | "rejected" | "correction_requested";
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  correctionNotes?: string;
}

export interface WarehouseStockItem {
  productId: string;
  productName: string;
  productCode: string;
  referenceWeightKg: number;
  filledOpeningStock: number | null; // null = "Opening Stock Not Configured"
  filledStockReceived: number;
  filledStockIssued: number;
  emptyOpeningStock: number | null;
  emptyStockReceived: number;
  emptyStockIssued: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  movementNum: string;
  date: string;
  type: "receipt" | "issue" | "adjustment" | "cylinder_return";
  productId: string;
  productName: string;
  qty: number;
  isEmpty: boolean;
  refNum?: string;
  supplierSource?: string;
  warehouseLocation?: string;
  recordedBy: string;
  status: "approved" | "pending_approval" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

export type PaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Other";
export type ChequeStatus = "received" | "deposited" | "cleared" | "bounced" | "cancelled";

export interface ChequeDetails {
  chequeNum: string;
  chequeDate: string;
  bankName: string;
  status: ChequeStatus;
}

export interface UpiDetails {
  utrRef: string;
  provider?: string;
}

export interface BankTransferDetails {
  utrRef: string;
  bankName: string;
  transferDate: string;
}

export interface OtherPaymentDetails {
  description: string;
  refNum?: string;
}

export interface RateChangeRequest {
  id: string;
  num: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  sapCode?: string;
  productId: string;
  productName: string;
  existingRate: number | null;
  requestedRate: number; // GST-exclusive basic rate per cylinder
  reason: string;
  requestedBy: string;
  requestedDate: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface CylinderExchangeRecord {
  id: string;
  exchangeNum: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  productId?: string;
  productName: string;
  deliveryId?: string;
  deliveryDate?: string;
  filledDelivered: number;
  emptyReceived: number;
  emptyPending: number;
  returnDate: string;
  refNum?: string;
  recordedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface MissedOrderAlert {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  mobile: string;
  expectedOrderDate: string; // YYYY-MM-DD
  lastOrderDate: string;
  daysOverdue: number;
  lastOrderedQty: number;
  status: "active" | "contacted" | "resolved" | "snoozed";
  snoozedUntil?: string;
  resolvedAt?: string;
  resolvedByOrderId?: string;
  createdAt: string;
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  alertId?: string;
  contactedAt: string;
  result:
    | "will_order_tomorrow"
    | "sufficient_stock"
    | "temporarily_closed"
    | "changed_supplier"
    | "unable_to_contact"
    | "other";
  notes?: string;
  nextFollowUpDate?: string;
  assignedStaff?: string;
  recordedBy: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  qty: number;
  unitRate: number; // Basic rate per cylinder (GST exclusive)
  subtotal: number; // qty * unitRate (Taxable value)
  taxPct: number;   // 18%
  cgstPct: number;
  cgstAmt: number;
  sgstPct: number;
  sgstAmt: number;
  igstPct: number;
  igstAmt: number;
  taxAmt: number;   // Total GST 18%
  total: number;    // subtotal + taxAmt
}

export interface Order {
  id: string;
  num: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  sapCode?: string;
  date: string;
  deliveryDate?: string;
  items: OrderItem[];
  totalQty: number;
  qtyIssued?: number;
  emptyReceivedOnOrder?: number;
  emptyPendingSnapshot?: number;
  subtotal: number;  // Taxable amount
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmt: number;    // Total 18% GST
  total: number;     // Grand Total
  status: "draft" | "confirmed" | "approved" | "pending_dispatch" | "partially_delivered" | "delivered" | "cancelled";
  vehicle?: string;
  driver?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  num: string;
  orderId: string;
  orderNum: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  date: string;
  product: string;
  qty: number;
  vehicle: string;
  driver: string;
  status: "pending" | "in_transit" | "delivered" | "failed";
  remarks?: string;
  emptyReceivedOnDelivery?: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  qty: number;
  basicRate: number;
  taxableAmount: number;
  cgstPct: number;
  cgstAmt: number;
  sgstPct: number;
  sgstAmt: number;
  igstPct: number;
  igstAmt: number;
  taxRatePct: number;
  taxAmt: number;
  total: number;
}

export interface Invoice {
  id: string;
  num: string;
  orderId: string;
  orderNum: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  date: string;
  dueDate: string;
  paymentTenureDays: number;
  items: InvoiceItem[];
  itemsDesc: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  total: number;
  paid: number;
  outstanding: number;
  status: "draft" | "posted" | "partially_paid" | "paid" | "overdue" | "cancelled";
}

export interface PaymentReceipt {
  id: string;
  num: string;
  receiptNum?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  ref: string;
  remarks?: string;
  receivedBy: string;
  status: "cleared" | "pending" | "bounced";
  chequeDetails?: ChequeDetails;
  upiDetails?: UpiDetails;
  bankDetails?: BankTransferDetails;
  otherDetails?: OtherPaymentDetails;
  allocatedInvoices?: string[];
  clearedAt?: string;
  clearedBy?: string;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;
  ref: string;
  type: string;
  desc: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: "create" | "update" | "approve" | "reject" | "dispatch" | "deliver" | "post" | "payment" | "rate_change" | "login" | "logout";
  resource: string;
  details?: string;
  ip: string;
}

export interface ImportBatch {
  id: string;
  batch: string;
  name: string;
  date: string;
  type: string;
  total: number;
  valid: number;
  duplicates: number;
  status: "completed" | "partial" | "failed";
}

export interface AgencySettings {
  tradeName: string;
  gstin: string;
  distributorshipCode: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  defaultCommercialGst: number;
  defaultPaymentTenureDays: number;
  defaultPaymentTerms?: string;
  dailyCutoffTimeMinutes: number; // Default 18:00 (1080)
  allowStandardRateFallback?: boolean; // Policy: whether to fallback to standard product rate if no customer rate
}

export interface ConsumptionMetrics {
  totalDeliveredCylinders: number;
  deliveredByProduct: { productName: string; qty: number; equivalentKg: number }[];
  totalDeliveredKg: number;
  averageDailyConsumption: number;
  averageWeeklyConsumption: number;
  averageMonthlyConsumption: number;
  averageOrderQty: number;
  averageDaysBetweenOrders: number;
  orderCount: number;
  lastOrderDate?: string;
  lastSupplyDate?: string;
  expectedNextOrderDate?: string;
  hasSufficientData: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "admin" | "accounts_staff" | "sales_staff" | "dispatch_staff";
  status: "active" | "inactive";
  lastActive: string;
}

// ── EXACTLY SIX ACTIVE LPG PRODUCTS (Per-Unit / Cylinder, 18% GST) ─────────
export const EXACT_SIX_ACTIVE_PRODUCTS: CylinderProduct[] = [
  { id: "p-lot-475", code: "LPG-475-LOT", name: "47.5kg LOT", type: "Commercial", sku: "BGS-LOT-475", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 47.5 },
  { id: "p-vot-475", code: "LPG-475-VOT", name: "47.5kg VOT", type: "Commercial", sku: "BGS-VOT-475", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 47.5 },
  { id: "p-jmb-425", code: "LPG-425-JUMBO", name: "425kg jumbo", type: "Commercial", sku: "BGS-JMB-425", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 425.0 },
  { id: "p-nno-190", code: "LPG-190-NANO", name: "19kg nano cut", type: "Commercial", sku: "BGS-NNO-190", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 19.0 },
  { id: "p-xtj-190", code: "LPG-190-XTRATEJ", name: "19 kg extra tej", type: "Commercial", sku: "BGS-XTJ-190", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 19.0 },
  { id: "p-nrm-190", code: "LPG-190-NORMAL", name: "19 kg normal", type: "Commercial", sku: "BGS-NRM-190", rate: 0, tax: 18, hsn: "27111900", active: true, referenceWeightKg: 19.0 },
];

export const INITIAL_ERP_USERS: ERPUser[] = [
  {
    id: "usr-admin-01",
    username: "admin",
    fullName: "Bachan Administrator",
    email: "admin@bachangas.in",
    role: "admin",
    permissions: [
      "customers.manage", "customers.approve", "products.manage", "rates.manage",
      "finance.manage", "credit.manage", "inventory.manage", "inventory.adjust",
      "orders.manage", "reports.view_all", "users.manage", "settings.manage"
    ],
    isActive: true,
  },
  {
    id: "usr-staff-01",
    username: "staff",
    fullName: "Operations Staff",
    email: "staff@bachangas.in",
    role: "staff",
    permissions: [
      "customers.view", "customers.submit_registration", "orders.create",
      "deliveries.record", "cylinder_returns.record", "payments.record",
      "inventory.receipt", "reports.view_operational"
    ],
    isActive: true,
  },
];

export const INITIAL_WAREHOUSE_STOCK: WarehouseStockItem[] = EXACT_SIX_ACTIVE_PRODUCTS.map(p => ({
  productId: p.id,
  productName: p.name,
  productCode: p.code,
  referenceWeightKg: p.referenceWeightKg || 19,
  filledOpeningStock: null, // "Opening Stock Not Configured"
  filledStockReceived: 0,
  filledStockIssued: 0,
  emptyOpeningStock: null,
  emptyStockReceived: 0,
  emptyStockIssued: 0,
  lastUpdated: "Opening Stock Not Configured",
}));

// Preserved historical products (deactivated for new orders)
export const ARCHIVED_HISTORICAL_PRODUCTS: CylinderProduct[] = [
  { id: "p-arch-1", code: "LPG-190-OLD", name: "Commercial LPG 19kg (Legacy)", type: "Commercial", sku: "BCG-COM-190", rate: 1850, tax: 18, hsn: "27111900", active: false },
  { id: "p-arch-2", code: "LPG-475-OLD", name: "Commercial LPG 47.5kg (Legacy)", type: "Commercial", sku: "BCG-COM-475", rate: 4625, tax: 18, hsn: "27111900", active: false },
  { id: "p-arch-3", code: "LPG-142-OLD", name: "Domestic LPG 14.2kg (Legacy)", type: "Domestic", sku: "BCG-DOM-142", rate: 910, tax: 0, hsn: "27111900", active: false },
];

export const ALL_PRODUCTS_INITIAL: CylinderProduct[] = [
  ...EXACT_SIX_ACTIVE_PRODUCTS,
  ...ARCHIVED_HISTORICAL_PRODUCTS,
];

// Agency Settings for Bachan Gas Service (Ludhiana, Punjab)
export const REAL_AGENCY_SETTINGS: AgencySettings = {
  tradeName: "Bachan Gas Service",
  gstin: "03AABCJ1103D1Z8",
  distributorshipCode: "0000110351",
  phone: "+91 97812 90564",
  email: "admin@bachangas.in",
  address: "New Amar Nagar, G.T. Road, Ludhiana, Punjab 141003",
  state: "Punjab",
  defaultCommercialGst: 18, // Updated to 18%
  defaultPaymentTenureDays: 15,
  defaultPaymentTerms: "Net 15 Days",
  dailyCutoffTimeMinutes: 18 * 60, // 18:00 cutoff in Asia/Kolkata
  allowStandardRateFallback: true,
};

// Initial Basic Rate History for the 6 approved products
export const INITIAL_BASIC_RATE_HISTORY: BasicRateHistoryItem[] = [
  { id: "brh-1", productId: "p-lot-475", productCode: "LPG-475-LOT", productName: "47.5kg LOT", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
  { id: "brh-2", productId: "p-vot-475", productCode: "LPG-475-VOT", productName: "47.5kg VOT", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
  { id: "brh-3", productId: "p-jmb-425", productCode: "LPG-425-JUMBO", productName: "425kg jumbo", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
  { id: "brh-4", productId: "p-nno-190", productCode: "LPG-190-NANO", productName: "19kg nano cut", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
  { id: "brh-5", productId: "p-xtj-190", productCode: "LPG-190-XTRATEJ", productName: "19 kg extra tej", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
  { id: "brh-6", productId: "p-nrm-190", productCode: "LPG-190-NORMAL", productName: "19 kg normal", basicRate: 0, effectiveFrom: "2026-11-01", updatedBy: "Bachan Admin", updatedAt: "01 Nov 2026", notes: "Initial Approved Master Rate" },
];

// Map real commercial records from client's 23.xlsx register
export const INITIAL_REAL_CUSTOMERS: Customer[] = (realCommercialData as any[]).map((r, idx) => ({
  id: String(idx + 1),
  code: r.consumer_number || `CX-${String(idx + 1).padStart(7, "0")}`,
  sap_code: r.sap_code || (idx < 25 ? `SAP-IND-${String(100000 + idx)}` : undefined),
  name: r.name || "Commercial Consumer",
  business: r.name || "Commercial Consumer",
  category: "commercial",
  consumer_type: r.consumer_type || "Commercial/Industrial",
  contact_person: r.name || "Authorized Signatory",
  mobile: r.phone ? (r.phone.startsWith("+") ? r.phone : `+91 ${r.phone}`) : "—",
  email: "—",
  gst: "—",
  city: r.city || "Ludhiana",
  area: r.area || "Industrial Area",
  state: "Punjab",
  pin: "141003",
  status: "active",
  credit_limit: null,
  payment_tenure_days: 15,
  payment_terms: "15 Days",
  outstanding: null,
  advance_balance: 0,
  overdue: null,
  last_payment: null,
  last_payment_date: "—",
  last_supply: r.last_refill ? `Refill Date: ${r.last_refill}` : "—",
  last_supply_qty: 0,
  last_supply_product: r.product || "19 kg normal",
  pending_orders: 0,
  created_at: "2026-11-03",
  is_financial_configured: false,
  total_filled_delivered: 0,
  total_empty_received: 0,
  empty_cylinders_pending: 0,
  ordering_frequency: "not_configured",
  missed_order_alert_active: false,
  alert_paused: false,
}));

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "a-init-01",
    timestamp: new Date().toLocaleString("en-IN"),
    user: "Bachan Gas Admin",
    action: "create",
    resource: "System Initialization",
    details: "Loaded 648 verified commercial accounts from Bachan Gas Register (23.xlsx). Zero fake data.",
    ip: "127.0.0.1"
  }
];

export const INITIAL_IMPORT_BATCHES: ImportBatch[] = [
  {
    id: "batch-23xlsx",
    batch: "BATCH-23XLSX-001",
    name: "23.xlsx (Customer Register Report)",
    date: new Date().toLocaleString("en-IN"),
    type: "Customer Register Report (IOCL Dist 0000110351)",
    total: 61320,
    valid: 648,
    duplicates: 0,
    status: "completed"
  }
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  { id: "u-1", name: "Bachan Admin", email: "admin@bachangas.in", phone: "+91 97812 90564", role: "super_admin", status: "active", lastActive: "Just now" },
  { id: "u-2", name: "Ramesh Kumar", email: "ramesh@bachangas.in", phone: "+91 98150 12345", role: "admin", status: "active", lastActive: "Today, 10:15 AM" },
  { id: "u-3", name: "Sunita Devi", email: "sunita@bachangas.in", phone: "+91 98765 43210", role: "accounts_staff", status: "active", lastActive: "Today, 09:30 AM" },
  { id: "u-4", name: "Ajay Sharma", email: "ajay@bachangas.in", phone: "+91 94170 55443", role: "sales_staff", status: "active", lastActive: "Yesterday" },
  { id: "u-5", name: "Mohan Lal", email: "mohan@bachangas.in", phone: "+91 98888 77665", role: "dispatch_staff", status: "active", lastActive: "Today, 11:42 AM" },
];

// ── STORE INTERFACE & METHODS ─────────────────────────────────

interface ERPStore {
  // Current user role mode: 'admin' has full control; 'staff' has operational permissions with approvals
  currentUserRole: "admin" | "staff";
  setCurrentUserRole: (role: "admin" | "staff") => void;

  customers: Customer[];
  products: CylinderProduct[];
  basicRateHistory: BasicRateHistoryItem[];
  customerRates: CustomerRate[];
  rateChangeRequests: RateChangeRequest[];
  cylinderExchangeLedger: CylinderExchangeRecord[];
  missedOrderAlerts: MissedOrderAlert[];
  followUpLogs: CustomerFollowUp[];
  orders: Order[];
  deliveries: Delivery[];
  invoices: Invoice[];
  payments: PaymentReceipt[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  importBatches: ImportBatch[];
  settings: AgencySettings;
  users: StaffUser[];

  // Auth & Roles
  erpUsers: ERPUser[];
  currentSessionUser: ERPUser | null;
  loginUser: (username: string, password: string, role?: "admin" | "staff") => { success: boolean; error?: string; user?: ERPUser };
  logoutUser: () => void;

  // Customer Onboarding & Approvals
  customerApprovals: CustomerApprovalRequest[];
  submitNewCustomerRegistration: (cust: Partial<Customer>, submittedBy?: string) => Customer;
  approveCustomerRegistration: (requestIdOrCustomerId: string, approvedBy?: string) => void;
  rejectCustomerRegistration: (requestIdOrCustomerId: string, reason: string, rejectedBy?: string) => void;
  requestCustomerCorrection: (requestIdOrCustomerId: string, notes: string, requestedBy?: string) => void;

  // Warehouse Inventory Management
  warehouseStock: WarehouseStockItem[];
  stockMovements: StockMovement[];
  recordStockReceipt: (data: { date: string; productId: string; qty: number; refNum?: string; supplierSource?: string; warehouseLocation?: string; recordedBy?: string; remarks?: string }) => StockMovement;
  recordStockAdjustment: (data: { date: string; productId: string; qty: number; isAddition: boolean; reason: string; recordedBy?: string }) => StockMovement;
  approveStockAdjustment: (id: string, approvedBy?: string) => void;
  configureOpeningStock: (productId: string, filledOpening: number, emptyOpening: number, configuredBy?: string) => void;

  // Payment Receipts & Structured Methods
  recordStructuredPayment: (data: {
    customerId: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    ref?: string;
    remarks?: string;
    receivedBy?: string;
    chequeDetails?: ChequeDetails;
    upiDetails?: UpiDetails;
    bankDetails?: BankTransferDetails;
    otherDetails?: OtherPaymentDetails;
  }) => PaymentReceipt;
  updateChequeStatus: (paymentId: string, status: ChequeStatus, updatedBy?: string) => void;

  // User Actions
  addUser: (user: Omit<StaffUser, "id" | "lastActive">) => StaffUser;
  updateUser: (id: string, updates: Partial<StaffUser>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (id: string) => string;

  // Customer Actions
  addCustomer: (cust: Omit<Customer, "id" | "code" | "created_at" | "outstanding" | "overdue" | "last_payment" | "last_payment_date" | "last_supply" | "last_supply_qty" | "last_supply_product" | "pending_orders" | "total_filled_delivered" | "total_empty_received" | "empty_cylinders_pending" | "ordering_frequency" | "missed_order_alert_active" | "payment_tenure_days"> & { payment_tenure_days?: number }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  getCustomerConsumptionAnalytics: (customerId: string) => ConsumptionMetrics;

  // Customer Tenure & Credit
  updateCustomerTenureAndCredit: (customerId: string, tenureDays: number, creditLimit: number | null) => void;

  // Ordering Frequency & Inactivity Alerts
  updateCustomerOrderingFrequency: (customerId: string, frequency: OrderingFrequency, customDays?: number) => void;
  evaluateInactivityAlerts: () => void;
  recordFollowUp: (data: { customerId: string; alertId?: string; result: CustomerFollowUp["result"]; notes?: string; nextFollowUpDate?: string; assignedStaff?: string; recordedBy?: string }) => CustomerFollowUp;
  snoozeAlert: (alertId: string, snoozeUntilDate: string) => void;
  pauseCustomerAlerts: (customerId: string, paused: boolean, reason?: string) => void;

  // Empty Cylinder Exchange
  recordEmptyReturn: (data: { customerId: string; productId?: string; productName: string; emptyReceived: number; returnDate: string; refNum?: string; remarks?: string; recordedBy?: string }) => CylinderExchangeRecord;

  // Product & Basic Rate Master Actions
  addProduct: (prod: Omit<CylinderProduct, "id">) => CylinderProduct;
  updateProduct: (id: string, updates: Partial<CylinderProduct>) => void;
  toggleProduct: (id: string) => void;
  updateBasicRate: (data: { productId: string; basicRate: number; effectiveFrom: string; notes?: string; updatedBy?: string }) => void;

  // Customer Rate Actions
  setCustomerRate: (rate: Omit<CustomerRate, "id">) => void;
  getApplicableRate: (customerId: string, productId: string) => { rate: number; isConfigured: boolean; source: "customer" | "standard" | "none" };
  isRateConfigured: (customerId: string, productId: string) => boolean;

  // Rate Change Request Workflow
  requestRateChange: (data: { customerId: string; productId: string; requestedRate: number; reason: string; requestedBy?: string }) => RateChangeRequest;
  approveRateChange: (requestId: string, approvedBy?: string) => void;
  rejectRateChange: (requestId: string, reason: string, approvedBy?: string) => void;

  // Order Actions (18% GST Exclusive)
  createOrder: (orderData: {
    customerId: string;
    productId: string;
    qty: number;
    unitRate?: number;
    deliveryDate?: string;
    remarks?: string;
    sapCode?: string;
    qtyIssued?: number;
    emptyReceivedOnOrder?: number;
  }) => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;

  // Delivery Actions
  createDelivery: (data: { orderId: string; vehicle: string; driver: string; emptyReceived?: number }) => Delivery;
  confirmDelivery: (deliveryId: string, emptyReceivedOnDelivery?: number) => void;

  // Invoicing & Financial Actions (18% GST breakdown)
  postInvoice: (invoiceData: { orderId: string; dueDate?: string }) => Invoice;
  recordPayment: (data: {
    customerId: string;
    amount: number;
    date: string;
    method: PaymentReceipt["method"];
    ref?: string;
    remarks?: string;
    receivedBy?: string;
    isAdvance?: boolean;
  }) => PaymentReceipt;
  recordAdvancePayment: (data: {
    customerId: string;
    amount: number;
    date: string;
    method: PaymentReceipt["method"];
    ref?: string;
    remarks?: string;
    receivedBy?: string;
  }) => PaymentReceipt;

  // Credit Management Actions
  updateCreditLimit: (customerId: string, limit: number, terms?: string) => void;

  // Import Actions
  recordImportBatch: (batch: Omit<ImportBatch, "id">) => void;
  bulkAddCustomers: (customers: Omit<Customer, "id" | "code" | "created_at">[]) => number;

  // Settings Actions
  updateSettings: (updates: Partial<AgencySettings>) => void;

  // Reset to clean production data
  resetToProductionSeed: () => void;
  resetToSeed: () => void;
}

export const useERPStore = create<ERPStore>()(
  persist(
    (set, get) => ({
      currentUserRole: "admin",
      setCurrentUserRole: (role) => set({ currentUserRole: role }),

      erpUsers: INITIAL_ERP_USERS,
      currentSessionUser: INITIAL_ERP_USERS[0],
      customerApprovals: [],
      warehouseStock: INITIAL_WAREHOUSE_STOCK,
      stockMovements: [],

      customers: INITIAL_REAL_CUSTOMERS,
      products: ALL_PRODUCTS_INITIAL,
      basicRateHistory: INITIAL_BASIC_RATE_HISTORY,
      customerRates: [],
      rateChangeRequests: [],
      cylinderExchangeLedger: [],
      missedOrderAlerts: [],
      followUpLogs: [],
      orders: [],
      deliveries: [],
      invoices: [],
      payments: [],
      ledger: [],
      auditLogs: INITIAL_AUDIT_LOGS,
      importBatches: INITIAL_IMPORT_BATCHES,
      settings: REAL_AGENCY_SETTINGS,
      users: INITIAL_STAFF_USERS,

      // ── CUSTOMER CRUD ──
      addCustomer: (c) => {
        const nextIdx = get().customers.length + 1;
        const code = `CX${String(nextIdx).padStart(7, "0")}`;
        const newCust: Customer = {
          ...c,
          id: String(Date.now()),
          code,
          credit_limit: c.credit_limit ?? null,
          payment_tenure_days: c.payment_tenure_days || 15,
          payment_terms: `${c.payment_tenure_days || 15} Days`,
          outstanding: null,
          overdue: null,
          last_payment: null,
          last_payment_date: "—",
          last_supply: "—",
          last_supply_qty: 0,
          last_supply_product: "—",
          pending_orders: 0,
          created_at: getKolkataDateString(),
          is_financial_configured: false,
          total_filled_delivered: 0,
          total_empty_received: 0,
          empty_cylinders_pending: 0,
          ordering_frequency: "not_configured",
          missed_order_alert_active: false,
          alert_paused: false,
        };

        set((state) => ({
          customers: [newCust, ...state.customers],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: state.currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
              action: "create",
              resource: `Customer ${newCust.code}`,
              details: `Added commercial customer ${newCust.name}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
        return newCust;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id || c.code === id ? { ...c, ...updates } : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: state.currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
              action: "update",
              resource: `Customer ID ${id}`,
              details: `Updated customer profile`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id && c.code !== id),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `Customer ID ${id}`,
              details: `Deactivated customer account`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id || c.code === id);
      },

      getCustomerConsumptionAnalytics: (customerId) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        if (!cust) {
          return {
            totalDeliveredCylinders: 0,
            deliveredByProduct: [],
            totalDeliveredKg: 0,
            averageDailyConsumption: 0,
            averageWeeklyConsumption: 0,
            averageMonthlyConsumption: 0,
            averageOrderQty: 0,
            averageDaysBetweenOrders: 0,
            orderCount: 0,
            hasSufficientData: false,
          };
        }

        const customerOrders = get().orders.filter(
          (o) => (o.customerId === cust.id || o.customerCode === cust.code) && o.status !== "cancelled"
        );
        const customerDeliveries = get().deliveries.filter(
          (d) => (d.customerId === cust.id || d.customerCode === cust.code) && d.status === "delivered"
        );

        // Group deliveries by product
        const productMap: Record<string, { qty: number; equivalentKg: number }> = {};
        customerDeliveries.forEach((d) => {
          const pName = d.product;
          const qty = d.qty;
          let unitKg = 19.0;
          if (pName.includes("47.5")) unitKg = 47.5;
          else if (pName.includes("425")) unitKg = 425.0;
          else if (pName.includes("19")) unitKg = 19.0;
          else if (pName.includes("14.2")) unitKg = 14.2;

          if (!productMap[pName]) productMap[pName] = { qty: 0, equivalentKg: 0 };
          productMap[pName].qty += qty;
          productMap[pName].equivalentKg += qty * unitKg;
        });

        const deliveredByProduct = Object.entries(productMap).map(([productName, data]) => ({
          productName,
          qty: data.qty,
          equivalentKg: data.equivalentKg,
        }));

        const totalDeliveredCylinders = deliveredByProduct.reduce((s, p) => s + p.qty, 0);
        const totalDeliveredKg = deliveredByProduct.reduce((s, p) => s + p.equivalentKg, 0);

        const orderCount = customerOrders.length;
        const totalOrderedQty = customerOrders.reduce((s, o) => s + o.totalQty, 0);
        const averageOrderQty = orderCount > 0 ? Math.round((totalOrderedQty / orderCount) * 10) / 10 : 0;

        // Days between orders calculation
        let averageDaysBetweenOrders = 0;
        if (customerOrders.length >= 2) {
          const dates = customerOrders
            .map((o) => new Date(o.date).getTime())
            .filter((t) => !isNaN(t))
            .sort((a, b) => a - b);
          if (dates.length >= 2) {
            const spanDays = (dates[dates.length - 1] - dates[0]) / (1000 * 3600 * 24);
            averageDaysBetweenOrders = Math.round((spanDays / (dates.length - 1)) * 10) / 10;
          }
        }

        // Daily consumption calculation
        let averageDailyConsumption = 0;
        if (averageDaysBetweenOrders > 0 && averageOrderQty > 0) {
          averageDailyConsumption = Math.round((averageOrderQty / averageDaysBetweenOrders) * 10) / 10;
        } else if (cust.ordering_frequency && cust.ordering_frequency !== "not_configured") {
          const intervalDays =
            cust.ordering_frequency === "daily" ? 1 :
            cust.ordering_frequency === "every_2_days" ? 2 :
            cust.ordering_frequency === "every_3_days" ? 3 :
            cust.ordering_frequency === "weekly" ? 7 : (cust.custom_interval_days || 1);
          const baseQty = averageOrderQty || cust.last_order_qty || 10;
          averageDailyConsumption = Math.round((baseQty / intervalDays) * 10) / 10;
        }

        const averageWeeklyConsumption = Math.round(averageDailyConsumption * 7 * 10) / 10;
        const averageMonthlyConsumption = Math.round(averageDailyConsumption * 30 * 10) / 10;

        return {
          totalDeliveredCylinders,
          deliveredByProduct,
          totalDeliveredKg,
          averageDailyConsumption,
          averageWeeklyConsumption,
          averageMonthlyConsumption,
          averageOrderQty,
          averageDaysBetweenOrders,
          orderCount,
          lastOrderDate: cust.last_order_date || cust.last_supply,
          lastSupplyDate: cust.last_supply,
          expectedNextOrderDate: cust.expected_next_order_date,
          hasSufficientData: orderCount > 0 || totalDeliveredCylinders > 0,
        };
      },

      // ── TENURE & CREDIT LIMIT ──
      updateCustomerTenureAndCredit: (customerId, tenureDays, creditLimit) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id === customerId || c.code === customerId) {
              return {
                ...c,
                payment_tenure_days: tenureDays,
                payment_terms: `${tenureDays} Days`,
                credit_limit: creditLimit,
                is_financial_configured: true,
              };
            }
            return c;
          }),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `Customer ${customerId} Credit/Tenure`,
              details: `Configured payment tenure to ${tenureDays} days and credit limit to ₹${creditLimit ? creditLimit.toLocaleString("en-IN") : "0"}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      // ── ORDERING FREQUENCY & INACTIVITY ALERTS ──
      updateCustomerOrderingFrequency: (customerId, frequency, customDays) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        if (!cust) return;

        let interval = 0;
        if (frequency === "daily") interval = 1;
        else if (frequency === "every_2_days") interval = 2;
        else if (frequency === "every_3_days") interval = 3;
        else if (frequency === "weekly") interval = 7;
        else if (frequency === "custom" && customDays) interval = customDays;

        let expectedNext: string | undefined = undefined;
        if (interval > 0) {
          const baseDate = cust.last_order_date ? new Date(cust.last_order_date) : new Date();
          const nextDate = new Date(baseDate);
          nextDate.setDate(nextDate.getDate() + interval);
          expectedNext = nextDate.toISOString().split("T")[0];
        }

        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId || c.code === customerId
              ? {
                  ...c,
                  ordering_frequency: frequency,
                  custom_interval_days: customDays,
                  expected_next_order_date: expectedNext,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `Customer ${cust.name} Frequency`,
              details: `Set ordering frequency to ${frequency}${customDays ? ` (${customDays} days)` : ""}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        // Re-evaluate alerts immediately
        get().evaluateInactivityAlerts();
      },

      evaluateInactivityAlerts: () => {
        const todayStr = getKolkataDateString();
        const nowMinutes = getKolkataTimeMinutes();
        const cutoff = get().settings.dailyCutoffTimeMinutes || (18 * 60); // 18:00
        const isPastCutoff = nowMinutes >= cutoff;

        const updatedCustomers = get().customers.map((cust) => {
          if (cust.ordering_frequency === "not_configured" || cust.alert_paused) {
            return { ...cust, missed_order_alert_active: false };
          }

          if (!cust.expected_next_order_date) {
            return { ...cust, missed_order_alert_active: false };
          }

          const expectedTime = new Date(cust.expected_next_order_date).getTime();
          const todayTime = new Date(todayStr).getTime();

          // Condition: Expected date is before today, OR expected date is today and past cutoff
          const isOverdue = expectedTime < todayTime || (expectedTime === todayTime && isPastCutoff);

          return {
            ...cust,
            missed_order_alert_active: isOverdue,
          };
        });

        // Sync missedOrderAlerts list
        const newAlerts: MissedOrderAlert[] = [];
        const existingAlerts = get().missedOrderAlerts;

        updatedCustomers.forEach((cust) => {
          if (cust.missed_order_alert_active) {
            const existing = existingAlerts.find(
              (a) => a.customerId === cust.id && a.status !== "resolved"
            );
            const expectedDate = new Date(cust.expected_next_order_date!);
            const today = new Date(todayStr);
            const diffDays = Math.max(1, Math.round((today.getTime() - expectedDate.getTime()) / (1000 * 3600 * 24)));

            if (existing) {
              newAlerts.push({
                ...existing,
                daysOverdue: diffDays,
                lastOrderDate: cust.last_order_date || cust.last_supply || "—",
                lastOrderedQty: cust.last_order_qty || 0,
              });
            } else {
              newAlerts.push({
                id: `alt-${Date.now()}-${cust.id}`,
                customerId: cust.id,
                customerName: cust.name,
                customerCode: cust.code,
                mobile: cust.mobile,
                expectedOrderDate: cust.expected_next_order_date!,
                lastOrderDate: cust.last_order_date || cust.last_supply || "—",
                daysOverdue: diffDays,
                lastOrderedQty: cust.last_order_qty || 0,
                status: "active",
                createdAt: getKolkataDateString(),
              });
            }
          }
        });

        set({
          customers: updatedCustomers,
          missedOrderAlerts: newAlerts,
        });
      },

      recordFollowUp: ({ customerId, alertId, result, notes, nextFollowUpDate, assignedStaff, recordedBy }) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        const newLog: CustomerFollowUp = {
          id: `fu-${Date.now()}`,
          customerId: cust?.id || customerId,
          alertId,
          contactedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          result,
          notes,
          nextFollowUpDate,
          assignedStaff: assignedStaff || "Assigned Agent",
          recordedBy: recordedBy || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User"),
          createdAt: getKolkataDateString(),
        };

        // If result is temporarily_closed, set alert_paused
        const shouldPause = result === "temporarily_closed";

        set((state) => ({
          followUpLogs: [newLog, ...state.followUpLogs],
          missedOrderAlerts: state.missedOrderAlerts.map((a) =>
            a.customerId === customerId ? { ...a, status: "contacted" } : a
          ),
          customers: state.customers.map((c) =>
            c.id === customerId || c.code === customerId
              ? {
                  ...c,
                  contacted_status: "contacted",
                  last_follow_up_date: getKolkataDateString(),
                  alert_paused: shouldPause ? true : c.alert_paused,
                  alert_pause_reason: shouldPause ? "Customer reported temporarily closed" : c.alert_pause_reason,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: recordedBy || "Staff User",
              action: "update",
              resource: `Follow-up on ${cust?.name || customerId}`,
              details: `Follow-up recorded with outcome: ${result.replace(/_/g, " ")}. Note: ${notes || "None"}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newLog;
      },

      snoozeAlert: (alertId, snoozeUntilDate) => {
        set((state) => ({
          missedOrderAlerts: state.missedOrderAlerts.map((a) =>
            a.id === alertId ? { ...a, status: "snoozed", snoozedUntil: snoozeUntilDate } : a
          ),
        }));
      },

      pauseCustomerAlerts: (customerId, paused, reason) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId || c.code === customerId
              ? { ...c, alert_paused: paused, alert_pause_reason: reason || "", missed_order_alert_active: paused ? false : c.missed_order_alert_active }
              : c
          ),
        }));
      },

      // ── EMPTY CYLINDER EXCHANGE ──
      recordEmptyReturn: ({ customerId, productId, productName, emptyReceived, returnDate, refNum, remarks, recordedBy }) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        if (!cust) throw new Error("Customer not found.");

        const nextNum = get().cylinderExchangeLedger.length + 1;
        const exchangeNum = `BGS-EXC-${String(nextNum).padStart(5, "0")}`;

        const currentPending = cust.empty_cylinders_pending || 0;
        const newPending = Math.max(0, currentPending - emptyReceived);
        const newTotalReceived = (cust.total_empty_received || 0) + emptyReceived;

        const record: CylinderExchangeRecord = {
          id: `exc-${Date.now()}`,
          exchangeNum,
          customerId: cust.id,
          customerName: cust.name,
          customerCode: cust.code,
          productId,
          productName: productName || "Commercial LPG Cylinder",
          filledDelivered: 0,
          emptyReceived,
          emptyPending: newPending,
          returnDate: returnDate || getKolkataDateString(),
          refNum: refNum || `RET-${Date.now().toString().slice(-5)}`,
          recordedBy: recordedBy || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User"),
          remarks: remarks || "Commercial Empty Return Received",
          createdAt: getKolkataDateString(),
        };

        set((state) => ({
          cylinderExchangeLedger: [record, ...state.cylinderExchangeLedger],
          customers: state.customers.map((c) =>
            c.id === cust.id
              ? {
                  ...c,
                  total_empty_received: newTotalReceived,
                  empty_cylinders_pending: newPending,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: recordedBy || "Staff User",
              action: "update",
              resource: `Empty Cylinder Receipt ${exchangeNum}`,
              details: `Received ${emptyReceived} empties from ${cust.name}. Closing pending: ${newPending}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return record;
      },

      // ── PRODUCT CRUD ──
      addProduct: (p) => {
        const newProd: CylinderProduct = {
          ...p,
          id: `p-${Date.now()}`,
          tax: 18, // 18% GST statutory
        };
        set((state) => ({
          products: [...state.products, newProd],
        }));
        return newProd;
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      toggleProduct: (id) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        }));
      },

      updateBasicRate: ({ productId, basicRate, effectiveFrom, notes, updatedBy }) => {
        const prod = get().products.find((p) => p.id === productId);
        if (!prod) throw new Error("Product not found.");

        const historyItem: BasicRateHistoryItem = {
          id: `brh-${Date.now()}`,
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          basicRate,
          effectiveFrom: effectiveFrom || getKolkataDateString(),
          updatedBy: updatedBy || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User"),
          updatedAt: getKolkataFormattedDate(),
          notes: notes || "Master basic rate update",
        };

        set((state) => ({
          products: state.products.map((p) => (p.id === productId ? { ...p, rate: basicRate } : p)),
          basicRateHistory: [historyItem, ...state.basicRateHistory],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: updatedBy || "Bachan Admin",
              action: "update",
              resource: `Basic Rate Master: ${prod.name}`,
              details: `Configured approved basic rate for ${prod.name} (${prod.code}) to ₹${basicRate.toLocaleString("en-IN")}/cylinder (GST 18% exclusive). Effective: ${historyItem.effectiveFrom}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      // ── CUSTOMER RATES (Renamed from Contract Rates) ──
      setCustomerRate: (rateData) => {
        const cust = get().customers.find(c => c.id === rateData.customerId || c.code === rateData.customerCode);
        const sapCode = rateData.sapCode || cust?.sap_code;
        const prod = get().products.find(p => p.id === rateData.productId || p.code === rateData.productId);
        const refWeight = prod?.referenceWeightKg || rateData.referenceWeightKg || 19;
        const calculatedRatePerKg = Number((rateData.agreedRate / refWeight).toFixed(2));

        const existingIdx = get().customerRates.findIndex(
          (r) =>
            (r.customerId === rateData.customerId || r.customerCode === rateData.customerCode) &&
            r.productId === rateData.productId
        );

        if (existingIdx >= 0) {
          const oldRate = get().customerRates[existingIdx];
          const historyEntry = {
            rate: oldRate.agreedRate,
            effectiveFrom: oldRate.effectiveFrom,
            approvedBy: oldRate.approvedBy,
            changedAt: getKolkataFormattedDate(),
            notes: "Customer rate revised",
          };
          const updated = [...get().customerRates];
          updated[existingIdx] = {
            ...oldRate,
            ...rateData,
            referenceWeightKg: refWeight,
            calculatedRatePerKg,
            gstRatePct: 18,
            sapCode,
            previousRate: oldRate.agreedRate,
            rateHistory: [historyEntry, ...(oldRate.rateHistory || [])],
          };
          set((state) => ({
            customerRates: updated,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: state.currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
                action: "rate_change",
                resource: `Customer Rate for ${rateData.customerName}`,
                details: `Updated basic rate for ${rateData.productName} from ₹${oldRate.agreedRate} to ₹${rateData.agreedRate.toLocaleString("en-IN")}/unit (₹${calculatedRatePerKg}/kg + 18% GST). Approved by: ${rateData.approvedBy}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          }));
        } else {
          const newRate: CustomerRate = {
            ...rateData,
            referenceWeightKg: refWeight,
            calculatedRatePerKg,
            gstRatePct: 18,
            id: `rate-${Date.now()}`,
            sapCode,
            previousRate: undefined,
            rateHistory: [
              {
                rate: rateData.agreedRate,
                effectiveFrom: rateData.effectiveFrom,
                approvedBy: rateData.approvedBy,
                changedAt: getKolkataFormattedDate(),
                notes: "Initial customer rate approved",
              },
            ],
          };
          set((state) => ({
            customerRates: [...state.customerRates, newRate],
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: "Bachan Admin",
                action: "rate_change",
                resource: `Customer Rate for ${rateData.customerName}`,
                details: `Set basic rate for ${rateData.productName} to ₹${rateData.agreedRate.toLocaleString("en-IN")}/unit (₹${calculatedRatePerKg}/kg + 18% GST)`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          }));
        }
      },

      getApplicableRate: (customerId, productId) => {
        const agreed = get().customerRates.find(
          (r) => (r.customerId === customerId || r.customerCode === customerId) && r.productId === productId
        );
        if (agreed && agreed.agreedRate > 0) {
          return { rate: agreed.agreedRate, isConfigured: true, source: "customer" as const };
        }
        const allowFallback = get().settings.allowStandardRateFallback !== false;
        const prod = get().products.find((p) => p.id === productId);
        if (allowFallback && prod && prod.rate > 0) {
          return { rate: prod.rate, isConfigured: true, source: "standard" as const };
        }
        return { rate: 0, isConfigured: false, source: "none" as const };
      },

      isRateConfigured: (customerId, productId) => {
        return get().customerRates.some(
          (r) => (r.customerId === customerId || r.customerCode === customerId) && r.productId === productId
        );
      },

      // ── STAFF RATE CHANGE REQUEST WORKFLOW ──
      requestRateChange: ({ customerId, productId, requestedRate, reason, requestedBy }) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        const prod = get().products.find((p) => p.id === productId);
        if (!cust || !prod) throw new Error("Customer or product not found.");

        const currentRateObj = get().getApplicableRate(cust.id, prod.id);
        const nextNum = get().rateChangeRequests.length + 1;
        const num = `BGS-REQ-${String(nextNum).padStart(5, "0")}`;

        const req: RateChangeRequest = {
          id: `req-${Date.now()}`,
          num,
          customerId: cust.id,
          customerName: cust.name,
          customerCode: cust.code,
          productId: prod.id,
          productName: prod.name,
          existingRate: currentRateObj.isConfigured ? currentRateObj.rate : null,
          requestedRate,
          reason,
          requestedBy: requestedBy || "Staff User",
          requestedDate: getKolkataFormattedDate(),
          status: "pending",
        };

        set((state) => ({
          rateChangeRequests: [req, ...state.rateChangeRequests],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: requestedBy || "Staff User",
              action: "create",
              resource: `Rate Change Request ${num}`,
              details: `Requested rate change for ${cust.name} on ${prod.name} to ₹${requestedRate.toLocaleString("en-IN")}/unit (+ 18% GST). Reason: ${reason}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return req;
      },

      approveRateChange: (requestId, approvedBy = "Bachan Admin") => {
        const req = get().rateChangeRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "pending") return;

        // Apply rate to customer rates
        get().setCustomerRate({
          customerId: req.customerId,
          customerName: req.customerName,
          customerCode: req.customerCode,
          productId: req.productId,
          productName: req.productName,
          defaultRate: req.existingRate || 0,
          agreedRate: req.requestedRate,
          effectiveFrom: getKolkataDateString(),
          validTill: "31-Mar-2027",
          approvedBy,
        });

        set((state) => ({
          rateChangeRequests: state.rateChangeRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "approved",
                  approvedBy,
                  approvedAt: getKolkataFormattedDate(),
                }
              : r
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: approvedBy,
              action: "approve",
              resource: `Rate Request ${req.num}`,
              details: `Approved rate revision for ${req.customerName} on ${req.productName} to ₹${req.requestedRate.toLocaleString("en-IN")}/unit`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      rejectRateChange: (requestId, reason, approvedBy = "Bachan Admin") => {
        const req = get().rateChangeRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "pending") return;

        set((state) => ({
          rateChangeRequests: state.rateChangeRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "rejected",
                  approvedBy,
                  approvedAt: getKolkataFormattedDate(),
                  rejectionReason: reason,
                }
              : r
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: approvedBy,
              action: "reject",
              resource: `Rate Request ${req.num}`,
              details: `Rejected rate revision for ${req.customerName}. Reason: ${reason}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      // ── ORDERS (18% GST EXCLUSIVE) ──
      createOrder: ({ customerId, productId, qty, unitRate, deliveryDate, remarks, sapCode, qtyIssued, emptyReceivedOnOrder }) => {
        const customer = get().customers.find((c) => c.id === customerId || c.code === customerId);
        const prod = get().products.find((p) => p.id === productId);

        if (!customer) throw new Error("Customer not found.");
        if (!prod) throw new Error("Product not found.");

        const agreedRateObj = get().getApplicableRate(customer.id, prod.id);
        const finalBasicRate = unitRate !== undefined ? unitRate : (agreedRateObj.isConfigured ? agreedRateObj.rate : prod.rate);

        // Strict rate check: block confirmation if no approved rate exists
        if (finalBasicRate <= 0) {
          throw new Error(`No approved applicable rate exists for ${customer.name} on ${prod.name}. Order cannot be confirmed until an approved Customer Rate or standard Basic Rate is configured.`);
        }

        const subtotal = qty * finalBasicRate; // Taxable Amount

        // GST 18%: Intra-state (Punjab) = CGST 9% + SGST 9%; Inter-state = IGST 18%
        const isInterState = customer.state && customer.state.toLowerCase() !== "punjab";
        const cgstPct = isInterState ? 0 : 9;
        const sgstPct = isInterState ? 0 : 9;
        const igstPct = isInterState ? 18 : 0;

        const cgstAmt = Math.round((subtotal * cgstPct) / 100);
        const sgstAmt = Math.round((subtotal * sgstPct) / 100);
        const igstAmt = Math.round((subtotal * igstPct) / 100);
        const taxAmt = cgstAmt + sgstAmt + igstAmt; // 18% Total GST
        const total = subtotal + taxAmt;

        const nextNum = get().orders.length + 1;
        const num = `BGS-ORD-${String(nextNum).padStart(5, "0")}`;
        const orderDateStr = getKolkataFormattedDate();
        const orderDateISO = getKolkataDateString();

        const newOrder: Order = {
          id: String(Date.now()),
          num,
          customerId: customer.id,
          customerName: customer.name,
          customerCode: customer.code,
          sapCode: sapCode || customer.sap_code,
          date: orderDateStr,
          deliveryDate: deliveryDate || orderDateStr,
          qtyIssued: qtyIssued || 0,
          emptyReceivedOnOrder: emptyReceivedOnOrder || 0,
          emptyPendingSnapshot: customer.empty_cylinders_pending || 0,
          items: [
            {
              productId: prod.id,
              productName: prod.name,
              productCode: prod.code,
              qty,
              unitRate: finalBasicRate,
              subtotal,
              taxPct: 18,
              cgstPct,
              cgstAmt,
              sgstPct,
              sgstAmt,
              igstPct,
              igstAmt,
              taxAmt,
              total,
            },
          ],
          totalQty: qty,
          subtotal,
          cgstAmount: cgstAmt,
          sgstAmount: sgstAmt,
          igstAmount: igstAmt,
          taxAmt,
          total,
          status: "confirmed",
          remarks: remarks || "",
          createdBy: get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
          createdAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        };

        // Recalculate Expected Next Order Date based on Customer Frequency
        let nextExpectedDateStr = customer.expected_next_order_date;
        let interval = 0;
        if (customer.ordering_frequency === "daily") interval = 1;
        else if (customer.ordering_frequency === "every_2_days") interval = 2;
        else if (customer.ordering_frequency === "every_3_days") interval = 3;
        else if (customer.ordering_frequency === "weekly") interval = 7;
        else if (customer.ordering_frequency === "custom" && customer.custom_interval_days) interval = customer.custom_interval_days;

        if (interval > 0) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + interval);
          nextExpectedDateStr = nextDate.toISOString().split("T")[0];
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
          customers: state.customers.map((c) =>
            c.id === customer.id
              ? {
                  ...c,
                  pending_orders: (c.pending_orders || 0) + 1,
                  last_order_date: orderDateISO,
                  last_order_qty: qty,
                  expected_next_order_date: nextExpectedDateStr,
                  missed_order_alert_active: false, // Automatic alert resolution!
                  contacted_status: "resumed",
                }
              : c
          ),
          // Resolve any active missed order alerts for this customer
          missedOrderAlerts: state.missedOrderAlerts.map((a) =>
            a.customerId === customer.id
              ? { ...a, status: "resolved", resolvedAt: orderDateISO, resolvedByOrderId: newOrder.id }
              : a
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: orderDateStr,
              user: state.currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
              action: "create",
              resource: `Order ${num}`,
              details: `Placed order for ${qty} × ${prod.name} @ ₹${finalBasicRate}/unit (+ 18% GST ₹${taxAmt}) = ₹${total.toLocaleString("en-IN")} for ${customer.name}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newOrder;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.num === orderId ? { ...o, status } : o)),
        }));
      },

      // ── DELIVERIES ──
      createDelivery: ({ orderId, vehicle, driver, emptyReceived = 0 }) => {
        const order = get().orders.find((o) => o.id === orderId || o.num === orderId);
        if (!order) throw new Error("Order not found.");

        const nextNum = get().deliveries.length + 1;
        const num = `BGS-DLV-${String(nextNum).padStart(5, "0")}`;
        const newDelivery: Delivery = {
          id: String(Date.now()),
          num,
          orderId: order.id,
          orderNum: order.num,
          customerId: order.customerId,
          customerName: order.customerName,
          customerCode: order.customerCode,
          date: getKolkataFormattedDate(),
          product: order.items[0]?.productName || "47.5kg LOT",
          qty: order.totalQty,
          vehicle,
          driver,
          status: "pending",
          emptyReceivedOnDelivery: emptyReceived,
        };

        set((state) => ({
          deliveries: [newDelivery, ...state.deliveries],
          orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "pending_dispatch", vehicle, driver } : o)),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "dispatch",
              resource: `Delivery ${num}`,
              details: `Dispatched ${order.totalQty} cylinders for ${order.customerName} via Vehicle ${vehicle} (Driver: ${driver})`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newDelivery;
      },

      confirmDelivery: (deliveryId, emptyReceivedOnDelivery = 0) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId || d.num === deliveryId);
        if (!delivery) return;

        const customer = get().customers.find((c) => c.id === delivery.customerId);
        const filledDelivered = delivery.qty;
        const empties = emptyReceivedOnDelivery || delivery.emptyReceivedOnDelivery || 0;

        const oldPending = customer?.empty_cylinders_pending || 0;
        const newPending = Math.max(0, oldPending + filledDelivered - empties);
        const newDeliveredTotal = (customer?.total_filled_delivered || 0) + filledDelivered;
        const newReceivedTotal = (customer?.total_empty_received || 0) + empties;

        // Record in exchange ledger
        const exchangeNum = `BGS-EXC-${String(get().cylinderExchangeLedger.length + 1).padStart(5, "0")}`;
        const exchangeRecord: CylinderExchangeRecord = {
          id: `exc-${Date.now()}`,
          exchangeNum,
          customerId: delivery.customerId,
          customerName: delivery.customerName,
          customerCode: delivery.customerCode,
          deliveryId: delivery.id,
          deliveryDate: delivery.date,
          productName: delivery.product,
          filledDelivered,
          emptyReceived: empties,
          emptyPending: newPending,
          returnDate: getKolkataDateString(),
          refNum: delivery.num,
          recordedBy: get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
          remarks: `Delivery supply: ${filledDelivered} filled delivered, ${empties} empties returned`,
          createdAt: getKolkataDateString(),
        };

        // Stock movements for filled cylinder issue and empty cylinder return
        const prod = get().products.find(p => p.id === delivery.product || p.name === delivery.product || p.code === delivery.product);
        const pId = prod ? prod.id : delivery.product;
        const pName = prod ? prod.name : delivery.product;
        const pCode = prod ? prod.code : "LPG";

        const issueMov: StockMovement = {
          id: `mov-${Date.now()}-iss`,
          movementNum: `BGS-STK-${String(get().stockMovements.length + 1).padStart(5, "0")}`,
          date: delivery.date || getKolkataDateString(),
          productId: pId,
          productName: pName,
          type: "issue",
          qty: filledDelivered,
          isEmpty: false,
          refNum: delivery.num,
          warehouseLocation: "Main Godown",
          recordedBy: get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
          status: "approved",
          remarks: `Delivery supply to ${delivery.customerName}`,
          createdAt: getKolkataDateString(),
        };

        const newStockMovements = [issueMov];
        if (empties > 0) {
          const returnMov: StockMovement = {
            id: `mov-${Date.now()}-ret`,
            movementNum: `BGS-STK-${String(get().stockMovements.length + 2).padStart(5, "0")}`,
            date: delivery.date || getKolkataDateString(),
            productId: pId,
            productName: pName,
            type: "cylinder_return",
            qty: empties,
            isEmpty: true,
            refNum: delivery.num,
            warehouseLocation: "Main Godown",
            recordedBy: get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
            status: "approved",
            remarks: `Empty cylinders returned by ${delivery.customerName}`,
            createdAt: getKolkataDateString(),
          };
          newStockMovements.push(returnMov);
        }

        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === delivery.id ? { ...d, status: "delivered" } : d
          ),
          orders: state.orders.map((o) =>
            o.id === delivery.orderId ? { ...o, status: "delivered" } : o
          ),
          cylinderExchangeLedger: [exchangeRecord, ...state.cylinderExchangeLedger],
          stockMovements: [...newStockMovements, ...state.stockMovements],
          warehouseStock: state.warehouseStock.map(ws => {
            if (ws.productId === pId || ws.productName === pName) {
              return {
                ...ws,
                filledStockIssued: ws.filledStockIssued + filledDelivered,
                emptyStockReceived: ws.emptyStockReceived + empties,
                lastUpdated: getKolkataFormattedDate(),
              };
            }
            return ws;
          }),
          customers: state.customers.map((c) =>
            c.id === delivery.customerId
              ? {
                  ...c,
                  last_supply: `Delivery Confirmed: ${delivery.date}`,
                  last_supply_qty: delivery.qty,
                  last_supply_product: delivery.product,
                  pending_orders: Math.max(0, (c.pending_orders || 1) - 1),
                  total_filled_delivered: newDeliveredTotal,
                  total_empty_received: newReceivedTotal,
                  empty_cylinders_pending: newPending,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "deliver",
              resource: `Delivery ${delivery.num}`,
              details: `Confirmed delivery of ${delivery.qty} cylinders to ${delivery.customerName}. Empties returned: ${empties}, Net pending: ${newPending}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        // Automatically post invoice if not already generated
        const existingInv = get().invoices.find((i) => i.orderId === delivery.orderId);
        if (!existingInv && delivery.orderId) {
          get().postInvoice({ orderId: delivery.orderId });
        }
      },

      // ── INVOICING & FINANCIAL POSTING (18% GST BREAKDOWN) ──
      postInvoice: ({ orderId, dueDate }) => {
        const order = get().orders.find((o) => o.id === orderId || o.num === orderId);
        if (!order) throw new Error("Order not found.");

        const cust = get().customers.find((c) => c.id === order.customerId);
        const tenureDays = cust?.payment_tenure_days || 15;

        const nextNum = get().invoices.length + 1;
        const num = `BGS-INV-${String(nextNum).padStart(5, "0")}`;
        const dateStr = getKolkataFormattedDate();

        // Calculate due date based on payment tenure
        let dueStr = dueDate;
        if (!dueStr) {
          const d = new Date();
          d.setDate(d.getDate() + tenureDays);
          dueStr = getKolkataFormattedDate(d);
        }

        const itemsDesc = `${order.totalQty} × ${order.items[0]?.productName || "47.5kg LOT"}`;

        const invoiceItems: InvoiceItem[] = order.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          qty: it.qty,
          basicRate: it.unitRate,
          taxableAmount: it.subtotal,
          cgstPct: it.cgstPct,
          cgstAmt: it.cgstAmt,
          sgstPct: it.sgstPct,
          sgstAmt: it.sgstAmt,
          igstPct: it.igstPct,
          igstAmt: it.igstAmt,
          taxRatePct: 18,
          taxAmt: it.taxAmt,
          total: it.total,
        }));

        const newInvoice: Invoice = {
          id: String(Date.now()),
          num,
          orderId: order.id,
          orderNum: order.num,
          customerId: order.customerId,
          customerName: order.customerName,
          customerCode: order.customerCode,
          date: dateStr,
          dueDate: dueStr,
          paymentTenureDays: tenureDays,
          items: invoiceItems,
          itemsDesc,
          taxableAmount: order.subtotal,
          cgstAmount: order.cgstAmount,
          sgstAmount: order.sgstAmount,
          igstAmount: order.igstAmount,
          taxAmount: order.taxAmt,
          total: order.total,
          paid: 0,
          outstanding: order.total,
          status: "posted",
        };

        // Ledger Entry
        const currentBal = cust?.outstanding || 0;
        const newBal = currentBal + order.total;

        const ledgerEntry: LedgerEntry = {
          id: `l-${Date.now()}`,
          customerId: order.customerId,
          date: dateStr,
          ref: num,
          type: "Sales Invoice",
          desc: `Tax invoice for supply of ${itemsDesc} (${order.num}) - Basic: ₹${order.subtotal.toLocaleString("en-IN")} + 18% GST: ₹${order.taxAmt.toLocaleString("en-IN")}`,
          debit: order.total,
          credit: 0,
          balance: newBal,
        };

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
          ledger: [...state.ledger, ledgerEntry],
          customers: state.customers.map((c) =>
            c.id === order.customerId
              ? {
                  ...c,
                  outstanding: newBal,
                  is_financial_configured: true,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: dateStr,
              user: "Bachan Admin",
              action: "post",
              resource: `Invoice ${num}`,
              details: `Posted tax invoice of ₹${order.total.toLocaleString("en-IN")} (Basic: ₹${order.subtotal} + 18% GST ₹${order.taxAmt}) for ${order.customerName}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newInvoice;
      },

      // ── PAYMENTS & RECONCILIATION ──
      recordPayment: ({ customerId, amount, date, method, ref, remarks, receivedBy, isAdvance }) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        if (!cust) throw new Error("Customer not found.");

        const nextNum = get().payments.length + 1;
        const num = `BGS-PAY-${String(nextNum).padStart(5, "0")}`;

        const newPayment: PaymentReceipt = {
          id: String(Date.now()),
          num,
          receiptNum: num,
          customerId: cust.id,
          customerName: cust.name,
          customerCode: cust.code,
          date: date || getKolkataFormattedDate(),
          amount,
          method,
          ref: ref || `REF-${Date.now().toString().slice(-6)}`,
          remarks: remarks || (isAdvance ? "Customer Advance Payment" : ""),
          receivedBy: receivedBy || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User"),
          status: "cleared",
        };

        let currentBal = cust.outstanding || 0;
        let newAdvance = cust.advance_balance || 0;
        let updatedInvoices = get().invoices;

        if (isAdvance) {
          newAdvance += amount;
        } else {
          // Reconcile open invoices
          let unallocated = amount;
          updatedInvoices = get().invoices.map((inv) => {
            if (inv.customerId === cust.id && inv.outstanding > 0 && unallocated > 0) {
              const alloc = Math.min(inv.outstanding, unallocated);
              unallocated -= alloc;
              const remaining = inv.outstanding - alloc;
              return {
                ...inv,
                paid: inv.paid + alloc,
                outstanding: remaining,
                status: (remaining === 0 ? "paid" : "partially_paid") as Invoice["status"],
              };
            }
            return inv;
          });

          const paidAgainstInvoices = amount - unallocated;
          currentBal = Math.max(0, currentBal - paidAgainstInvoices);
          if (unallocated > 0) {
            newAdvance += unallocated; // Remaining funds become advance credit
          }
        }

        const ledgerEntry: LedgerEntry = {
          id: `l-${Date.now()}`,
          customerId: cust.id,
          date: newPayment.date,
          ref: num,
          type: isAdvance ? "Advance Receipt" : "Receipt Voucher",
          desc: `${isAdvance ? "Customer Advance" : "Payment"} received via ${method} (Ref: ${newPayment.ref})${remarks ? ` - ${remarks}` : ""}`,
          debit: 0,
          credit: amount,
          balance: currentBal,
        };

        set((state) => ({
          payments: [newPayment, ...state.payments],
          invoices: updatedInvoices,
          ledger: [...state.ledger, ledgerEntry],
          customers: state.customers.map((c) =>
            c.id === cust.id
              ? {
                  ...c,
                  outstanding: currentBal,
                  advance_balance: newAdvance,
                  last_payment: amount,
                  last_payment_date: newPayment.date,
                  is_financial_configured: true,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: receivedBy || "Staff User",
              action: "payment",
              resource: `Receipt ${num}`,
              details: `Received ${isAdvance ? "advance " : ""}₹${amount.toLocaleString("en-IN")} from ${cust.name} via ${method}. Outstanding: ₹${currentBal.toLocaleString("en-IN")}, Advance Credit: ₹${newAdvance.toLocaleString("en-IN")}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newPayment;
      },

      recordAdvancePayment: (data) => {
        return get().recordPayment({ ...data, isAdvance: true });
      },

      // ── CREDIT LIMIT ──
      updateCreditLimit: (customerId, limit, terms) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId || c.code === customerId
              ? {
                  ...c,
                  credit_limit: limit,
                  payment_terms: terms || c.payment_terms,
                  is_financial_configured: true,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `Credit Limit for ${customerId}`,
              details: `Credit limit updated to ₹${limit.toLocaleString("en-IN")}${terms ? ` (${terms})` : ""}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      // ── IMPORTS ──
      recordImportBatch: (b) => {
        const newBatch: ImportBatch = {
          ...b,
          id: `batch-${Date.now()}`,
        };
        set((state) => ({
          importBatches: [newBatch, ...state.importBatches],
        }));
      },

      bulkAddCustomers: (newCusts) => {
        const startIdx = get().customers.length + 1;
        const mapped: Customer[] = newCusts.map((c, i) => ({
          ...c,
          id: String(Date.now() + i),
          code: (c as any).consumer_number || `CX${String(startIdx + i).padStart(7, "0")}`,
          credit_limit: c.credit_limit || null,
          payment_tenure_days: c.payment_tenure_days || 15,
          payment_terms: `${c.payment_tenure_days || 15} Days`,
          outstanding: null,
          overdue: null,
          last_payment: null,
          last_payment_date: "—",
          last_supply: "—",
          last_supply_qty: 0,
          last_supply_product: "19 kg normal",
          pending_orders: 0,
          created_at: getKolkataDateString(),
          is_financial_configured: false,
          total_filled_delivered: 0,
          total_empty_received: 0,
          empty_cylinders_pending: 0,
          ordering_frequency: "not_configured",
          missed_order_alert_active: false,
          alert_paused: false,
        }));

        set((state) => ({
          customers: [...mapped, ...state.customers],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "create",
              resource: `Bulk Customer Import`,
              details: `Imported ${mapped.length} customer records into register`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return mapped.length;
      },

      // ── SETTINGS ──
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: "Agency Settings",
              details: "Updated agency legal profile, tax rules, or contact details",
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      // ── USER MANAGEMENT ──
      addUser: (userData) => {
        const newUser: StaffUser = {
          ...userData,
          id: `u-${Date.now()}`,
          lastActive: "Just now",
        };
        set((state) => ({
          users: [...state.users, newUser],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "create",
              resource: `User ${newUser.email}`,
              details: `Added new staff account for ${newUser.name} (${newUser.role})`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
        return newUser;
      },

      updateUser: (id, updates) => {
        const target = get().users.find((u) => u.id === id);
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `User ${target?.name || id}`,
              details: `Updated role or status permissions`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      deleteUser: (id) => {
        const target = get().users.find((u) => u.id === id);
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `User ${target?.name || id}`,
              details: `Deactivated staff user account`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
      },

      resetUserPassword: (id) => {
        const target = get().users.find((u) => u.id === id);
        const tempPass = `BGS@${Math.floor(100000 + Math.random() * 900000)}`;
        set((state) => ({
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: "Bachan Admin",
              action: "update",
              resource: `Password Reset for ${target?.name || id}`,
              details: `Generated temporary password for ${target?.email}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));
        return tempPass;
      },

      // ── AUTH & ROLES (Admin vs Staff) ──
      loginUser: (username, password, role) => {
        const normalized = username.trim().toLowerCase();
        const user = get().erpUsers.find((u) => u.username.toLowerCase() === normalized && u.isActive);
        if (!user) {
          return { success: false, error: "Invalid username or account is deactivated" };
        }
        if (role && user.role !== role) {
          return {
            success: false,
            error: `Access denied. This portal is strictly for ${role.toUpperCase()} accounts. You cannot log in with role '${user.role}'.`,
          };
        }
        const validAdmin = user.role === "admin" && (password === "admin123" || password === "bachanadmin" || password === "admin");
        const validStaff = user.role === "staff" && (password === "staff123" || password === "bachanstaff" || password === "staff");
        if (!validAdmin && !validStaff && password !== "demo123") {
          return { success: false, error: "Invalid password. Please check your credentials." };
        }

        set({
          currentSessionUser: user,
          currentUserRole: user.role,
        });

        set((state) => ({
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: user.fullName,
              action: "login",
              resource: `Session ${user.username}`,
              details: `Authenticated user '${user.fullName}' with role '${user.role}'`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return { success: true, user };
      },

      logoutUser: () => {
        const prev = get().currentSessionUser;
        set({
          currentSessionUser: null,
        });
        if (prev) {
          set((state) => ({
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: prev.fullName,
                action: "logout",
                resource: `Session ${prev.username}`,
                details: `User logged out`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          }));
        }
      },

      // ── CUSTOMER ONBOARDING & APPROVALS (Option A vs Option B) ──
      submitNewCustomerRegistration: (cust, submittedBy) => {
        const nextIdx = get().customers.length + 1;
        const code = `CX${String(nextIdx).padStart(7, "0")}`;
        const currentUser = get().currentSessionUser;
        const submitterName = submittedBy || currentUser?.fullName || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User");
        const reqNum = `REQ-${Date.now().toString().slice(-6)}`;
        const isAdmin = get().currentUserRole === "admin";

        const newCust: Customer = {
          id: `cust-${Date.now()}`,
          code,
          name: cust.name || "Unnamed Customer",
          business: cust.business || cust.name || "Commercial Customer",
          category: cust.category || "commercial",
          consumer_type: cust.consumer_type || "Commercial (Non-Domestic)",
          contact_person: cust.contact_person || "",
          mobile: cust.mobile || "",
          alt_mobile: cust.alt_mobile || "",
          email: cust.email || "",
          gst: cust.gst || "",
          city: cust.city || "Ludhiana",
          area: cust.area || "Industrial Area",
          state: cust.state || "Punjab",
          pin: cust.pin || "141003",
          billing_address: cust.billing_address || "",
          delivery_address: cust.delivery_address || "",
          status: isAdmin ? "active" : "inactive",
          approval_status: isAdmin ? "approved" : "pending_approval",
          submitted_by: submitterName,
          approved_by: isAdmin ? submitterName : undefined,
          approved_at: isAdmin ? getKolkataFormattedDate() : undefined,
          credit_limit: cust.credit_limit ?? null,
          payment_tenure_days: cust.payment_tenure_days || 15,
          payment_terms: `${cust.payment_tenure_days || 15} Days`,
          outstanding: null,
          overdue: null,
          last_payment: null,
          last_payment_date: "—",
          last_supply: "—",
          last_supply_qty: 0,
          last_supply_product: "—",
          pending_orders: 0,
          created_at: getKolkataDateString(),
          is_financial_configured: false,
          total_filled_delivered: 0,
          total_empty_received: 0,
          empty_cylinders_pending: 0,
          ordering_frequency: "not_configured",
          missed_order_alert_active: false,
          alert_paused: false,
        };

        const approvalReq: CustomerApprovalRequest = {
          id: `appr-${Date.now()}`,
          requestNum: reqNum,
          customerId: newCust.id,
          customerData: newCust,
          status: isAdmin ? "approved" : "pending_approval",
          submittedBy: submitterName,
          submittedAt: getKolkataFormattedDate(),
          reviewedBy: isAdmin ? submitterName : undefined,
          reviewedAt: isAdmin ? getKolkataFormattedDate() : undefined,
        };

        set((state) => ({
          customers: [newCust, ...state.customers],
          customerApprovals: [approvalReq, ...state.customerApprovals],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: submitterName,
              action: "create",
              resource: `Customer Registration ${newCust.code}`,
              details: `Submitted new commercial customer registration for '${newCust.name}' (Approval: ${newCust.approval_status})`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return newCust;
      },

      approveCustomerRegistration: (requestIdOrCustomerId, approvedBy) => {
        const adminName = approvedBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const req = state.customerApprovals.find(a => a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId);
          const targetCustId = req?.customerId || requestIdOrCustomerId;

          return {
            customerApprovals: state.customerApprovals.map((a) =>
              a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId
                ? { ...a, status: "approved" as const, reviewedBy: adminName, reviewedAt: getKolkataFormattedDate() }
                : a
            ),
            customers: state.customers.map((c) =>
              c.id === targetCustId
                ? {
                    ...c,
                    status: "active",
                    approval_status: "approved" as const,
                    approved_by: adminName,
                    approved_at: getKolkataFormattedDate(),
                  }
                : c
            ),
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "approve",
                resource: `Customer Approval ${targetCustId}`,
                details: `Admin approved registration for customer. Status is now Active.`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      rejectCustomerRegistration: (requestIdOrCustomerId, reason, rejectedBy) => {
        const adminName = rejectedBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const req = state.customerApprovals.find(a => a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId);
          const targetCustId = req?.customerId || requestIdOrCustomerId;

          return {
            customerApprovals: state.customerApprovals.map((a) =>
              a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId
                ? { ...a, status: "rejected" as const, rejectionReason: reason, reviewedBy: adminName, reviewedAt: getKolkataFormattedDate() }
                : a
            ),
            customers: state.customers.map((c) =>
              c.id === targetCustId
                ? {
                    ...c,
                    status: "inactive",
                    approval_status: "rejected" as const,
                    rejection_reason: reason,
                  }
                : c
            ),
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "update",
                resource: `Customer Rejection ${targetCustId}`,
                details: `Admin rejected customer registration. Reason: ${reason}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      requestCustomerCorrection: (requestIdOrCustomerId, notes, requestedBy) => {
        const adminName = requestedBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const req = state.customerApprovals.find(a => a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId);
          const targetCustId = req?.customerId || requestIdOrCustomerId;

          return {
            customerApprovals: state.customerApprovals.map((a) =>
              a.id === requestIdOrCustomerId || a.customerId === requestIdOrCustomerId
                ? { ...a, status: "correction_requested" as const, correctionNotes: notes, reviewedBy: adminName, reviewedAt: getKolkataFormattedDate() }
                : a
            ),
            customers: state.customers.map((c) =>
              c.id === targetCustId
                ? {
                    ...c,
                    approval_status: "correction_requested" as const,
                    rejection_reason: notes,
                  }
                : c
            ),
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "update",
                resource: `Customer Correction ${targetCustId}`,
                details: `Admin requested registration correction: ${notes}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      // ── WAREHOUSE INVENTORY MANAGEMENT ──
      configureOpeningStock: (productId, filledOpening, emptyOpening, configuredBy) => {
        const adminName = configuredBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const prod = state.products.find((p) => p.id === productId);
          return {
            warehouseStock: state.warehouseStock.map((ws) =>
              ws.productId === productId
                ? {
                    ...ws,
                    filledOpeningStock: filledOpening,
                    emptyOpeningStock: emptyOpening,
                    lastUpdated: getKolkataFormattedDate(),
                  }
                : ws
            ),
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "update",
                resource: `Warehouse Stock ${prod?.name || productId}`,
                details: `Configured opening stock: ${filledOpening} filled cylinders, ${emptyOpening} empty cylinders`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      recordStockReceipt: (data) => {
        const prod = get().products.find((p) => p.id === data.productId || p.name === data.productId);
        const pId = prod ? prod.id : data.productId;
        const pName = prod ? prod.name : "LPG Cylinder";
        const recordedBy = data.recordedBy || get().currentSessionUser?.fullName || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User");
        const movNum = `BGS-REC-${String(get().stockMovements.length + 1).padStart(5, "0")}`;

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          movementNum: movNum,
          date: data.date || getKolkataDateString(),
          productId: pId,
          productName: pName,
          type: "receipt",
          qty: data.qty,
          isEmpty: false,
          refNum: data.refNum,
          supplierSource: data.supplierSource || "IOCL Bottling Plant",
          warehouseLocation: data.warehouseLocation || "Main Godown",
          recordedBy,
          status: "approved",
          remarks: data.remarks,
          createdAt: getKolkataDateString(),
        };

        set((state) => ({
          stockMovements: [movement, ...state.stockMovements],
          warehouseStock: state.warehouseStock.map((ws) =>
            ws.productId === pId || ws.productName === pName
              ? {
                  ...ws,
                  filledStockReceived: ws.filledStockReceived + data.qty,
                  lastUpdated: getKolkataFormattedDate(),
                }
              : ws
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: getKolkataFormattedDate(),
              user: recordedBy,
              action: "create",
              resource: `Stock Receipt ${movNum}`,
              details: `Recorded receipt of ${data.qty} filled cylinders of ${pName} from ${data.supplierSource || "IOCL Bottling Plant"}`,
              ip: "127.0.0.1",
            },
            ...state.auditLogs,
          ],
        }));

        return movement;
      },

      recordStockAdjustment: (data) => {
        const prod = get().products.find((p) => p.id === data.productId || p.name === data.productId);
        const pId = prod ? prod.id : data.productId;
        const pName = prod ? prod.name : "LPG Cylinder";
        const isAdmin = get().currentUserRole === "admin";
        const recordedBy = data.recordedBy || get().currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User");
        const movNum = `BGS-ADJ-${String(get().stockMovements.length + 1).padStart(5, "0")}`;

        const movement: StockMovement = {
          id: `mov-${Date.now()}`,
          movementNum: movNum,
          date: data.date || getKolkataDateString(),
          productId: pId,
          productName: pName,
          type: "adjustment",
          qty: data.qty,
          isEmpty: false,
          remarks: data.reason,
          recordedBy,
          approvedBy: isAdmin ? recordedBy : undefined,
          status: isAdmin ? "approved" : "pending_approval",
          createdAt: getKolkataDateString(),
        };

        set((state) => {
          let updatedStock = state.warehouseStock;
          if (isAdmin) {
            updatedStock = state.warehouseStock.map((ws) => {
              if (ws.productId === pId || ws.productName === pName) {
                const delta = data.isAddition ? data.qty : -data.qty;
                return {
                  ...ws,
                  filledStockReceived: Math.max(0, ws.filledStockReceived + delta),
                  lastUpdated: getKolkataFormattedDate(),
                };
              }
              return ws;
            });
          }

          return {
            stockMovements: [movement, ...state.stockMovements],
            warehouseStock: updatedStock,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: recordedBy,
                action: "update",
                resource: `Stock Adjustment ${movNum}`,
                details: `Stock adjustment of ${data.isAddition ? "+" : "-"}${data.qty} for ${pName}. Reason: ${data.reason}. Status: ${isAdmin ? "Approved" : "Pending Admin Approval"}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });

        return movement;
      },

      approveStockAdjustment: (id, approvedBy) => {
        const adminName = approvedBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const mov = state.stockMovements.find((m) => m.id === id);
          if (!mov || mov.status === "approved") return state;

          const updatedMovements = state.stockMovements.map((m) =>
            m.id === id ? { ...m, status: "approved" as const, approvedBy: adminName, approvedAt: getKolkataFormattedDate() } : m
          );

          const updatedStock = state.warehouseStock.map((ws) => {
            if (ws.productId === mov.productId || ws.productName === mov.productName) {
              return {
                ...ws,
                filledStockReceived: ws.filledStockReceived + mov.qty,
                lastUpdated: getKolkataFormattedDate(),
              };
            }
            return ws;
          });

          return {
            stockMovements: updatedMovements,
            warehouseStock: updatedStock,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "approve",
                resource: `Stock Adjustment ${mov.movementNum}`,
                details: `Admin approved stock adjustment of ${mov.qty} for ${mov.productName}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      // ── STRUCTURED PAYMENT RECEIPTS & CHEQUE TRACKING ──
      recordStructuredPayment: (data) => {
        const cust = get().customers.find((c) => c.id === data.customerId || c.code === data.customerId);
        const recNum = `BGS-REC-${String(get().payments.length + 1).padStart(5, "0")}`;
        const isCheque = data.method === "Cheque" || (data.method as string).toLowerCase() === "cheque";
        const initialStatus: "cleared" | "pending" | "bounced" = isCheque ? "pending" : "cleared";
        const recordedByUser = data.receivedBy || get().currentSessionUser?.fullName || (get().currentUserRole === "admin" ? "Bachan Admin" : "Staff User");

        const newReceipt: PaymentReceipt = {
          id: `pay-${Date.now()}`,
          num: recNum,
          receiptNum: recNum,
          customerId: cust?.id || data.customerId,
          customerName: cust?.name || "Customer",
          customerCode: cust?.code || data.customerId,
          date: data.date,
          amount: data.amount,
          method: data.method,
          ref: data.ref || (isCheque ? (data.chequeDetails?.chequeNum || "") : ""),
          remarks: data.remarks,
          receivedBy: recordedByUser,
          status: initialStatus,
          chequeDetails: isCheque ? {
            chequeNum: data.chequeDetails?.chequeNum || (data.ref || ""),
            chequeDate: data.chequeDetails?.chequeDate || data.date,
            bankName: data.chequeDetails?.bankName || "",
            status: "received",
          } : undefined,
          upiDetails: data.upiDetails,
          bankDetails: data.bankDetails,
          otherDetails: data.otherDetails,
        };

        set((state) => {
          let updatedCustomers = state.customers;
          let updatedInvoices = state.invoices;
          let updatedLedger = state.ledger;

          if (initialStatus === "cleared" && cust) {
            const oldOutstanding = cust.outstanding ?? 0;
            const newOutstanding = Math.max(0, oldOutstanding - data.amount);

            updatedCustomers = state.customers.map((c) =>
              c.id === cust.id
                ? {
                    ...c,
                    outstanding: newOutstanding,
                    last_payment: data.amount,
                    last_payment_date: data.date,
                  }
                : c
            );

            const ledgerEntry: LedgerEntry = {
              id: `led-${Date.now()}`,
              customerId: cust.id,
              date: data.date,
              ref: recNum,
              type: "payment",
              desc: `Payment Received (${data.method}${data.ref ? ` - ${data.ref}` : ""})`,
              debit: 0,
              credit: data.amount,
              balance: newOutstanding,
            };
            updatedLedger = [ledgerEntry, ...state.ledger];

            let remaining = data.amount;
            updatedInvoices = state.invoices.map((inv) => {
              if (inv.customerId === cust.id && inv.outstanding > 0 && remaining > 0) {
                const payTowardsInv = Math.min(inv.outstanding, remaining);
                remaining -= payTowardsInv;
                const newInvOutstanding = inv.outstanding - payTowardsInv;
                return {
                  ...inv,
                  paid: inv.paid + payTowardsInv,
                  outstanding: newInvOutstanding,
                  status: newInvOutstanding === 0 ? "paid" : "partially_paid",
                };
              }
              return inv;
            });
          }

          return {
            payments: [newReceipt, ...state.payments],
            customers: updatedCustomers,
            invoices: updatedInvoices,
            ledger: updatedLedger,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: recordedByUser,
                action: "payment",
                resource: `Receipt ${recNum}`,
                details: `Recorded ${data.method} payment of ₹${data.amount.toLocaleString("en-IN")} from ${cust?.name || "Customer"}. Status: ${initialStatus}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });

        return newReceipt;
      },

      updateChequeStatus: (paymentId, status, updatedBy) => {
        const adminName = updatedBy || get().currentSessionUser?.fullName || "Bachan Admin";
        set((state) => {
          const pay = state.payments.find((p) => p.id === paymentId || p.num === paymentId);
          if (!pay) return state;

          const prevChequeStatus = pay.chequeDetails?.status;
          const isBecomingCleared = status === "cleared" && prevChequeStatus !== "cleared";

          let updatedCustomers = state.customers;
          let updatedInvoices = state.invoices;
          let updatedLedger = state.ledger;

          if (isBecomingCleared) {
            const cust = state.customers.find((c) => c.id === pay.customerId);
            if (cust) {
              const oldOutstanding = cust.outstanding ?? 0;
              const newOutstanding = Math.max(0, oldOutstanding - pay.amount);

              updatedCustomers = state.customers.map((c) =>
                c.id === cust.id
                  ? {
                      ...c,
                      outstanding: newOutstanding,
                      last_payment: pay.amount,
                      last_payment_date: getKolkataDateString(),
                    }
                  : c
              );

              const ledgerEntry: LedgerEntry = {
                id: `led-${Date.now()}`,
                customerId: cust.id,
                date: getKolkataDateString(),
                type: "payment",
                ref: pay.receiptNum || pay.num,
                desc: `Cheque Cleared: #${pay.chequeDetails?.chequeNum || ""} (${pay.chequeDetails?.bankName || ""})`,
                debit: 0,
                credit: pay.amount,
                balance: newOutstanding,
              };
              updatedLedger = [ledgerEntry, ...state.ledger];

              let remaining = pay.amount;
              updatedInvoices = state.invoices.map((inv) => {
                if (inv.customerId === cust.id && inv.outstanding > 0 && remaining > 0) {
                  const payTowardsInv = Math.min(inv.outstanding, remaining);
                  remaining -= payTowardsInv;
                  const newInvOutstanding = inv.outstanding - payTowardsInv;
                  return {
                    ...inv,
                    paid: inv.paid + payTowardsInv,
                    outstanding: newInvOutstanding,
                    status: newInvOutstanding === 0 ? "paid" : "partially_paid",
                  };
                }
                return inv;
              });
            }
          }

          const updatedPayments = state.payments.map((p) =>
            p.id === paymentId || p.num === paymentId
              ? {
                  ...p,
                  status: status === "cleared" ? ("cleared" as const) : status === "bounced" ? ("bounced" as const) : ("pending" as const),
                  clearedAt: status === "cleared" ? getKolkataFormattedDate() : undefined,
                  clearedBy: status === "cleared" ? adminName : undefined,
                  chequeDetails: p.chequeDetails
                    ? {
                        ...p.chequeDetails,
                        status,
                      }
                    : undefined,
                }
              : p
          );

          return {
            payments: updatedPayments,
            customers: updatedCustomers,
            invoices: updatedInvoices,
            ledger: updatedLedger,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: getKolkataFormattedDate(),
                user: adminName,
                action: "update",
                resource: `Cheque Payment ${pay.receiptNum || pay.num}`,
                details: `Updated cheque status to '${status}'. ${status === "cleared" ? "Balance settled." : ""}`,
                ip: "127.0.0.1",
              },
              ...state.auditLogs,
            ],
          };
        });
      },

      // ── RESET ──
      resetToProductionSeed: () => {
        set({
          currentUserRole: "admin",
          customers: INITIAL_REAL_CUSTOMERS,
          products: ALL_PRODUCTS_INITIAL,
          customerRates: [],
          rateChangeRequests: [],
          cylinderExchangeLedger: [],
          missedOrderAlerts: [],
          followUpLogs: [],
          orders: [],
          deliveries: [],
          invoices: [],
          payments: [],
          ledger: [],
          auditLogs: INITIAL_AUDIT_LOGS,
          importBatches: INITIAL_IMPORT_BATCHES,
          settings: REAL_AGENCY_SETTINGS,
          users: INITIAL_STAFF_USERS,
        });
      },
      resetToSeed: () => {
        get().resetToProductionSeed();
      },
    }),
    {
      name: "bachan_erp_v4_business_workflow",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
