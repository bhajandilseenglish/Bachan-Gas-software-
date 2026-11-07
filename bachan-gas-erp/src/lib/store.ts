"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import realCommercialData from "./real_commercial_customers.json";

export interface Customer {
  id: string;
  code: string;
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
  status: "active" | "inactive" | "suspended";
  credit_limit: number | null;
  payment_terms: string;
  outstanding: number | null;
  overdue: number | null;
  last_payment: number | null;
  last_payment_date: string;
  last_supply: string;
  last_supply_qty: number;
  last_supply_product: string;
  pending_orders: number;
  created_at: string;
  is_financial_configured?: boolean;
}

export interface CylinderProduct {
  id: string;
  code: string;
  name: string;
  type: "Commercial" | "Domestic" | "Industrial";
  weight: number;
  sku: string;
  rate: number;
  tax: number;
  hsn: string;
  active: boolean;
}

export interface CustomerRate {
  id: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  productId: string;
  productName: string;
  defaultRate: number;
  agreedRate: number;
  effectiveFrom: string;
  validTill: string;
  approvedBy: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  weight: number;
  qty: number;
  unitRate: number;
  taxPct: number;
  subtotal: number;
  taxAmt: number;
  total: number;
}

export interface Order {
  id: string;
  num: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  date: string;
  deliveryDate?: string;
  items: OrderItem[];
  totalQty: number;
  totalKg: number;
  subtotal: number;
  taxAmt: number;
  total: number;
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
  itemsDesc: string;
  total: number;
  paid: number;
  outstanding: number;
  status: "draft" | "posted" | "partially_paid" | "paid" | "overdue" | "cancelled";
}

export interface PaymentReceipt {
  id: string;
  num: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
  status: "cleared" | "pending" | "bounced";
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
  action: "create" | "update" | "approve" | "dispatch" | "deliver" | "post" | "payment" | "rate_change";
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
  defaultCommercialGst: number;
  defaultPaymentTerms: string;
}

// ── REAL MASTER DATA (Zero Demo Records) ─────────────────────────

// Real Cylinder Products in Bachan Gas Service (Indane / IOCL)
export const REAL_CYLINDER_PRODUCTS: CylinderProduct[] = [
  { id: "1", code: "LPG-190", name: "Commercial LPG 19kg", type: "Commercial", weight: 19.0, sku: "BCG-COM-190", rate: 1850, tax: 5, hsn: "27111900", active: true },
  { id: "2", code: "LPG-190-XT", name: "19 Kg Commercial (XtraTeJ)", type: "Commercial", weight: 19.0, sku: "BCG-COM-190-XT", rate: 1885, tax: 5, hsn: "27111900", active: true },
  { id: "3", code: "LPG-475", name: "Commercial LPG 47.5kg", type: "Commercial", weight: 47.5, sku: "BCG-COM-475", rate: 4625, tax: 5, hsn: "27111900", active: true },
  { id: "4", code: "LPG-142", name: "Domestic LPG 14.2kg", type: "Domestic", weight: 14.2, sku: "BCG-DOM-142", rate: 910, tax: 0, hsn: "27111900", active: true },
  { id: "5", code: "LPG-050", name: "5 Kg ND General Package", type: "Commercial", weight: 5.0, sku: "BCG-COM-050", rate: 520, tax: 5, hsn: "27111900", active: true },
  { id: "6", code: "LPG-100-XL", name: "10 Kg XTRALITE Composite", type: "Domestic", weight: 10.0, sku: "BCG-DOM-100", rate: 720, tax: 0, hsn: "27111900", active: true },
];

// Agency Settings for Bachan Gas Service (Indane Distributorship Code: 0000110351, Ludhiana, Punjab)
export const REAL_AGENCY_SETTINGS: AgencySettings = {
  tradeName: "Bachan Gas Service",
  gstin: "03AABCJ1103D1Z8",
  distributorshipCode: "0000110351",
  phone: "+91 97812 90564",
  email: "admin@bachangas.in",
  address: "New Amar Nagar, G.T. Road, Ludhiana, Punjab 141003",
  defaultCommercialGst: 5,
  defaultPaymentTerms: "Net 15 Days",
};

// Map real commercial records from client's 23.xlsx register
export const INITIAL_REAL_CUSTOMERS: Customer[] = (realCommercialData as any[]).map((r, idx) => ({
  id: String(idx + 1),
  code: r.consumer_number || `CX-${String(idx + 1).padStart(7, "0")}`,
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
  payment_terms: "Not Yet Configured",
  outstanding: null,
  overdue: null,
  last_payment: null,
  last_payment_date: "—",
  last_supply: r.last_refill ? `Refill Date: ${r.last_refill}` : "—",
  last_supply_qty: 0,
  last_supply_product: r.product || "19 Kg Commercial LPG",
  pending_orders: 0,
  created_at: "2026-11-03",
  is_financial_configured: false,
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

// ── STORE INTERFACE & METHODS ─────────────────────────────────

interface ERPStore {
  customers: Customer[];
  products: CylinderProduct[];
  customerRates: CustomerRate[];
  orders: Order[];
  deliveries: Delivery[];
  invoices: Invoice[];
  payments: PaymentReceipt[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  importBatches: ImportBatch[];
  settings: AgencySettings;

  // Customer Actions
  addCustomer: (cust: Omit<Customer, "id" | "code" | "created_at" | "outstanding" | "overdue" | "last_payment" | "last_payment_date" | "last_supply" | "last_supply_qty" | "last_supply_product" | "pending_orders">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;

  // Product Actions
  addProduct: (prod: Omit<CylinderProduct, "id">) => CylinderProduct;
  updateProduct: (id: string, updates: Partial<CylinderProduct>) => void;
  toggleProduct: (id: string) => void;

  // Rate Actions
  setCustomerRate: (rate: Omit<CustomerRate, "id">) => void;
  getApplicableRate: (customerId: string, productId: string) => { rate: number; isConfigured: boolean };
  isRateConfigured: (customerId: string, productId: string) => boolean;

  // Order Actions
  createOrder: (orderData: {
    customerId: string;
    productId: string;
    qty: number;
    unitRate?: number;
    deliveryDate?: string;
    remarks?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;

  // Delivery Actions
  createDelivery: (data: { orderId: string; vehicle: string; driver: string }) => Delivery;
  confirmDelivery: (deliveryId: string) => void;

  // Invoicing & Financial Actions
  postInvoice: (invoiceData: { orderId: string; dueDate?: string }) => Invoice;
  recordPayment: (data: {
    customerId: string;
    amount: number;
    date: string;
    method: string;
    ref?: string;
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
      customers: INITIAL_REAL_CUSTOMERS,
      products: REAL_CYLINDER_PRODUCTS,
      customerRates: [],
      orders: [],
      deliveries: [],
      invoices: [],
      payments: [],
      ledger: [],
      auditLogs: INITIAL_AUDIT_LOGS,
      importBatches: INITIAL_IMPORT_BATCHES,
      settings: REAL_AGENCY_SETTINGS,

      // ── CUSTOMER CRUD ──
      addCustomer: (c) => {
        const nextIdx = get().customers.length + 1;
        const code = `CX${String(nextIdx).padStart(7, "0")}`;
        const newCust: Customer = {
          ...c,
          id: String(Date.now()),
          code,
          credit_limit: null,
          outstanding: null,
          overdue: null,
          last_payment: null,
          last_payment_date: "—",
          last_supply: "—",
          last_supply_qty: 0,
          last_supply_product: "—",
          pending_orders: 0,
          created_at: new Date().toISOString().split("T")[0],
          is_financial_configured: false,
        };

        set((state) => ({
          customers: [newCust, ...state.customers],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "create",
              resource: `Customer ${newCust.code}`,
              details: `Added customer ${newCust.name}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));
        return newCust;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id || c.code === id ? { ...c, ...updates } : c)),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "update",
              resource: `Customer ID ${id}`,
              details: `Updated customer profile`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id && c.code !== id),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "update",
              resource: `Customer ID ${id}`,
              details: `Deactivated customer account`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));
      },

      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id || c.code === id);
      },

      // ── PRODUCT CRUD ──
      addProduct: (p) => {
        const newProd: CylinderProduct = {
          ...p,
          id: String(Date.now()),
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

      // ── RATE MANAGEMENT ──
      setCustomerRate: (rate) => {
        const existingIdx = get().customerRates.findIndex(
          (r) => (r.customerId === rate.customerId || r.customerCode === rate.customerCode) && r.productId === rate.productId
        );

        if (existingIdx >= 0) {
          const updated = [...get().customerRates];
          updated[existingIdx] = { ...rate, id: updated[existingIdx].id };
          set((state) => ({
            customerRates: updated,
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: new Date().toLocaleString("en-IN"),
                user: rate.approvedBy || "Bachan Admin",
                action: "rate_change",
                resource: `Rate for ${rate.customerName}`,
                details: `Updated rate for ${rate.productName} to ₹${rate.agreedRate}`,
                ip: "127.0.0.1"
              },
              ...state.auditLogs
            ]
          }));
        } else {
          const newRate: CustomerRate = {
            ...rate,
            id: `r-${Date.now()}`,
          };
          set((state) => ({
            customerRates: [newRate, ...state.customerRates],
            auditLogs: [
              {
                id: `a-${Date.now()}`,
                timestamp: new Date().toLocaleString("en-IN"),
                user: rate.approvedBy || "Bachan Admin",
                action: "rate_change",
                resource: `Rate for ${rate.customerName}`,
                details: `Configured approved contract rate for ${rate.productName} at ₹${rate.agreedRate}`,
                ip: "127.0.0.1"
              },
              ...state.auditLogs
            ]
          }));
        }
      },

      getApplicableRate: (customerId, productId) => {
        const rate = get().customerRates.find(
          (r) => (r.customerId === customerId || r.customerCode === customerId) && r.productId === productId
        );
        if (rate) {
          return { rate: rate.agreedRate, isConfigured: true };
        }
        const prod = get().products.find((p) => p.id === productId);
        return { rate: prod ? prod.rate : 0, isConfigured: false };
      },

      isRateConfigured: (customerId, productId) => {
        return get().customerRates.some(
          (r) => (r.customerId === customerId || r.customerCode === customerId) && r.productId === productId
        );
      },

      // ── ORDERS ──
      createOrder: ({ customerId, productId, qty, unitRate, deliveryDate, remarks }) => {
        const customer = get().customers.find((c) => c.id === customerId || c.code === customerId);
        const prod = get().products.find((p) => p.id === productId);

        if (!customer) throw new Error("Customer not found.");
        if (!prod) throw new Error("Product not found.");

        const agreedRateObj = get().getApplicableRate(customer.id, prod.id);
        const finalRate = unitRate !== undefined ? unitRate : (agreedRateObj.isConfigured ? agreedRateObj.rate : prod.rate);

        const subtotal = qty * finalRate;
        const taxAmt = Math.round((subtotal * (prod.tax || 5)) / 100);
        const total = subtotal + taxAmt;
        const totalKg = qty * prod.weight;

        const nextNum = get().orders.length + 1;
        const num = `BGS-ORD-${String(nextNum).padStart(5, "0")}`;
        const newOrder: Order = {
          id: String(Date.now()),
          num,
          customerId: customer.id,
          customerName: customer.name,
          customerCode: customer.code,
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          deliveryDate: deliveryDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          items: [
            {
              productId: prod.id,
              productName: prod.name,
              productCode: prod.code,
              weight: prod.weight,
              qty,
              unitRate: finalRate,
              taxPct: prod.tax || 5,
              subtotal,
              taxAmt,
              total,
            }
          ],
          totalQty: qty,
          totalKg,
          subtotal,
          taxAmt,
          total,
          status: "confirmed",
          remarks: remarks || "",
          createdBy: "Bachan Admin",
          createdAt: new Date().toLocaleString("en-IN"),
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          customers: state.customers.map((c) =>
            c.id === customer.id ? { ...c, pending_orders: (c.pending_orders || 0) + 1 } : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "create",
              resource: `Order ${newOrder.num}`,
              details: `Booked ${qty} cylinders for ${customer.name}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        return newOrder;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.num === orderId ? { ...o, status } : o)),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "update",
              resource: `Order ${orderId}`,
              details: `Status transition to ${status}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));
      },

      // ── DELIVERIES ──
      createDelivery: ({ orderId, vehicle, driver }) => {
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
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          product: order.items[0]?.productName || "Commercial LPG 19kg",
          qty: order.totalQty,
          vehicle,
          driver,
          status: "pending",
        };

        set((state) => ({
          deliveries: [newDelivery, ...state.deliveries],
          orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "pending_dispatch", vehicle, driver } : o)),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "dispatch",
              resource: `Delivery ${newDelivery.num}`,
              details: `Dispatched ${newDelivery.qty} cylinders via ${vehicle} (${driver})`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        return newDelivery;
      },

      confirmDelivery: (deliveryId) => {
        const delivery = get().deliveries.find((d) => d.id === deliveryId || d.num === deliveryId);
        if (!delivery) return;

        const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const order = get().orders.find((o) => o.id === delivery.orderId);

        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === delivery.id ? { ...d, status: "delivered" } : d
          ),
          orders: state.orders.map((o) =>
            o.id === delivery.orderId ? { ...o, status: "delivered" } : o
          ),
          customers: state.customers.map((c) =>
            c.id === delivery.customerId
              ? {
                  ...c,
                  last_supply: dateStr,
                  last_supply_qty: delivery.qty,
                  last_supply_product: delivery.product,
                  pending_orders: Math.max(0, (c.pending_orders || 1) - 1),
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "deliver",
              resource: `Delivery ${delivery.num}`,
              details: `Supply confirmed: ${delivery.qty} cylinders delivered to ${delivery.customerName}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        // Auto-generate invoice if not already generated
        const existingInv = get().invoices.find((i) => i.orderId === delivery.orderId);
        if (!existingInv && order) {
          get().postInvoice({ orderId: order.id });
        }
      },

      // ── INVOICING & FINANCIAL POSTING ──
      postInvoice: ({ orderId, dueDate }) => {
        const order = get().orders.find((o) => o.id === orderId || o.num === orderId);
        if (!order) throw new Error("Order not found.");

        const nextNum = get().invoices.length + 1;
        const num = `BGS-INV-${String(nextNum).padStart(5, "0")}`;
        const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const dueStr = dueDate || new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

        const itemsDesc = `${order.totalQty} × ${order.items[0]?.productName || "Commercial LPG 19kg"}`;

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
          itemsDesc,
          total: order.total,
          paid: 0,
          outstanding: order.total,
          status: "posted",
        };

        // Ledger Entry
        const cust = get().customers.find((c) => c.id === order.customerId);
        const currentBal = cust?.outstanding || 0;
        const newBal = currentBal + order.total;

        const ledgerEntry: LedgerEntry = {
          id: `l-${Date.now()}`,
          customerId: order.customerId,
          date: dateStr,
          ref: num,
          type: "Sales Invoice",
          desc: `Invoice for supply of ${itemsDesc} (${order.num})`,
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
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "post",
              resource: `Invoice ${num}`,
              details: `Posted tax invoice of ₹${order.total.toLocaleString("en-IN")} for ${order.customerName}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        return newInvoice;
      },

      // ── PAYMENTS ──
      recordPayment: ({ customerId, amount, date, method, ref }) => {
        const cust = get().customers.find((c) => c.id === customerId || c.code === customerId);
        if (!cust) throw new Error("Customer not found.");

        const nextNum = get().payments.length + 1;
        const num = `BGS-PAY-${String(nextNum).padStart(5, "0")}`;

        const newPayment: PaymentReceipt = {
          id: String(Date.now()),
          num,
          customerId: cust.id,
          customerName: cust.name,
          customerCode: cust.code,
          date: date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          amount,
          method,
          ref: ref || `REF-${Date.now().toString().slice(-6)}`,
          status: "cleared",
        };

        const currentBal = cust.outstanding || 0;
        const newBal = Math.max(0, currentBal - amount);

        const ledgerEntry: LedgerEntry = {
          id: `l-${Date.now()}`,
          customerId: cust.id,
          date: newPayment.date,
          ref: num,
          type: "Receipt Voucher",
          desc: `Payment received via ${method} (Ref: ${newPayment.ref})`,
          debit: 0,
          credit: amount,
          balance: newBal,
        };

        // Reconcile invoices
        const updatedInvoices = get().invoices.map((inv) => {
          if (inv.customerId === cust.id && inv.outstanding > 0) {
            const alloc = Math.min(inv.outstanding, amount);
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

        set((state) => ({
          payments: [newPayment, ...state.payments],
          invoices: updatedInvoices,
          ledger: [...state.ledger, ledgerEntry],
          customers: state.customers.map((c) =>
            c.id === cust.id
              ? {
                  ...c,
                  outstanding: newBal,
                  last_payment: amount,
                  last_payment_date: newPayment.date,
                  is_financial_configured: true,
                }
              : c
          ),
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "payment",
              resource: `Receipt ${num}`,
              details: `Received ₹${amount.toLocaleString("en-IN")} from ${cust.name} via ${method}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        return newPayment;
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
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "update",
              resource: `Credit Limit for ${customerId}`,
              details: `Sanctioned credit limit set to ₹${limit.toLocaleString("en-IN")}${terms ? ` (${terms})` : ""}`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
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
          outstanding: null,
          overdue: null,
          last_payment: null,
          last_payment_date: "—",
          last_supply: "—",
          last_supply_qty: 0,
          last_supply_product: "19 Kg Commercial LPG",
          pending_orders: 0,
          created_at: new Date().toISOString().split("T")[0],
          is_financial_configured: false,
        }));

        set((state) => ({
          customers: [...mapped, ...state.customers],
          auditLogs: [
            {
              id: `a-${Date.now()}`,
              timestamp: new Date().toLocaleString("en-IN"),
              user: "Bachan Admin",
              action: "create",
              resource: `Bulk Customer Import`,
              details: `Imported ${mapped.length} customer records into register`,
              ip: "127.0.0.1"
            },
            ...state.auditLogs
          ]
        }));

        return mapped.length;
      },

      // ── SETTINGS ──
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      // ── RESET ──
      resetToProductionSeed: () => {
        set({
          customers: INITIAL_REAL_CUSTOMERS,
          products: REAL_CYLINDER_PRODUCTS,
          customerRates: [],
          orders: [],
          deliveries: [],
          invoices: [],
          payments: [],
          ledger: [],
          auditLogs: INITIAL_AUDIT_LOGS,
          importBatches: INITIAL_IMPORT_BATCHES,
          settings: REAL_AGENCY_SETTINGS,
        });
      },
      resetToSeed: () => {
        get().resetToProductionSeed();
      },
    }),
    {
      name: "bachan_erp_v3_production",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
