// ============================================================
// BACHAN GAS SERVICE ERP — Complete Type Definitions
// ============================================================

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "sales_staff"
  | "accounts_staff"
  | "dispatch_staff";

export type CustomerCategory =
  | "commercial"
  | "domestic"
  | "industrial"
  | "institutional"
  | "other";

export type CustomerStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "blacklisted";

export type ConsumerType = "regular" | "bulk" | "seasonal" | "spot";

export type PaymentTerms =
  | "immediate"
  | "net_7"
  | "net_15"
  | "net_30"
  | "net_45"
  | "net_60"
  | "advance";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "approved"
  | "pending_dispatch"
  | "partially_delivered"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export type InvoiceStatus =
  | "draft"
  | "posted"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "written_off";

export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "cheque" | "other";

export type PaymentStatus = "pending" | "cleared" | "bounced" | "cancelled";

export type LedgerEntryType =
  | "opening_balance"
  | "invoice"
  | "payment"
  | "credit_note"
  | "debit_note"
  | "adjustment"
  | "reversal";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "post"
  | "reverse"
  | "import"
  | "export";

// ============================================================
// DATABASE ENTITY TYPES
// ============================================================

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  existing_consumer_id?: string;
  consumer_number?: string;
  customer_name: string;
  business_name?: string;
  category: CustomerCategory;
  consumer_type: ConsumerType;
  status: CustomerStatus;
  contact_person?: string;
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  gst_number?: string;
  billing_address?: string;
  delivery_address?: string;
  city?: string;
  area?: string;
  state?: string;
  pin_code?: string;
  credit_limit: number;
  payment_terms: PaymentTerms;
  opening_receivable: number;
  notes?: string;
  is_portal_enabled: boolean;
  imported_from?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithFinancials extends Customer {
  outstanding_receivable: number;
  overdue_outstanding: number;
  available_credit: number;
  unallocated_advance: number;
  last_payment_amount?: number;
  last_payment_date?: string;
  total_invoiced: number;
  last_supply_date?: string;
  last_supply_qty?: number;
  pending_orders_count: number;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: string;
  address_line: string;
  city?: string;
  area?: string;
  state?: string;
  pin_code?: string;
  is_default: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  cylinder_type: string;
  net_weight_kg: number;
  sku?: string;
  default_rate: number;
  tax_rate_pct: number;
  hsn_code?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductRate {
  id: string;
  product_id: string;
  rate: number;
  effective_from: string;
  effective_to?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
}

export interface CustomerRate {
  id: string;
  customer_id: string;
  product_id: string;
  rate: number;
  effective_from: string;
  effective_to?: string;
  notes?: string;
  approved_by?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
  customer?: Customer;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  requested_delivery_date?: string;
  delivery_address?: string;
  vehicle_number?: string;
  confirmed_at?: string;
  approved_at?: string;
  approved_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  remarks?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_rate: number;
  tax_rate_pct: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  delivered_quantity: number;
  pending_quantity: number;
  remarks?: string;
  created_at: string;
  product?: Product;
}

export interface Delivery {
  id: string;
  delivery_number: string;
  order_id: string;
  customer_id: string;
  delivery_date: string;
  status: DeliveryStatus;
  vehicle_number?: string;
  driver_name?: string;
  remarks?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: Order;
  delivery_items?: DeliveryItem[];
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  order_item_id: string;
  product_id: string;
  ordered_quantity: number;
  delivered_quantity: number;
  remarks?: string;
  created_at: string;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  order_id?: string;
  invoice_date: string;
  due_date?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  notes?: string;
  posted_at?: string;
  posted_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  description?: string;
  quantity: number;
  unit_rate: number;
  tax_rate_pct: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  product?: Product;
}

export interface Payment {
  id: string;
  payment_number: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  method: PaymentMethod;
  reference_number?: string;
  status: PaymentStatus;
  allocated_amount: number;
  unallocated_amount: number;
  remarks?: string;
  recorded_by: string;
  cleared_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  payment_allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  allocated_amount: number;
  allocated_at: string;
  allocated_by?: string;
  notes?: string;
  invoice?: Invoice;
}

export interface LedgerEntry {
  id: string;
  customer_id: string;
  entry_date: string;
  entry_type: LedgerEntryType;
  order_id?: string;
  invoice_id?: string;
  payment_id?: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  description: string;
  reference_number?: string;
  is_reversed: boolean;
  reversed_by_entry_id?: string;
  reversed_at?: string;
  created_by?: string;
  created_at: string;
}

export interface OpeningBalance {
  id: string;
  customer_id: string;
  balance_date: string;
  amount: number;
  notes?: string;
  is_posted: boolean;
  posted_at?: string;
  posted_by?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: string;
  user?: UserProfile;
}

export interface ImportBatch {
  id: string;
  batch_name: string;
  import_type: string;
  file_name: string;
  file_size_bytes?: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  imported_rows: number;
  status: string;
  error_summary?: string;
  column_mapping?: Record<string, string>;
  started_at?: string;
  completed_at?: string;
  imported_by?: string;
  created_at: string;
}

export interface ImportError {
  id: string;
  batch_id: string;
  row_number: number;
  error_type: string;
  field_name?: string;
  raw_value?: string;
  error_message: string;
  raw_row_data?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// API / UI TYPES
// ============================================================

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TableFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export interface DashboardMetrics {
  // Financial
  total_receivables: number;
  overdue_receivables: number;
  payments_today: number;
  sales_today: number;
  total_credit_limits: number;
  available_credit: number;
  // Operational
  total_customers: number;
  active_commercial_customers: number;
  orders_today: number;
  orders_pending_approval: number;
  orders_pending_dispatch: number;
  deliveries_today: number;
  cylinders_ordered_today: number;
  cylinders_delivered_today: number;
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  collections: number;
  orders: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

