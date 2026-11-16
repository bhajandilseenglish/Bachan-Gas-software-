"use client";
import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone, Mail, Building2, MapPin, Edit3, Plus, FileText,
  CreditCard, Truck, History, BookOpen, AlertCircle, CheckCircle,
  Receipt, ArrowUpRight, ArrowDownLeft, Download, Eye, ChevronRight,
  Printer, X, Check, RotateCcw, AlertTriangle, ShieldCheck, ShieldAlert,
  Clock, Calendar, UserCheck, MessageSquare, Shield, Tag
} from "lucide-react";
import {
  useERPStore,
  Customer,
  OrderingFrequency,
  CustomerFollowUp,
  getKolkataDateString
} from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Yet Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const LAKHS = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  if (n === 0) return "₹0";
  return n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${(n / 1000).toFixed(1)}k`;
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:             { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  confirmed:         { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" },
  approved:          { bg: "#ede9fe", color: "#6d28d9", label: "Approved" },
  pending_dispatch:  { bg: "#fef3c7", color: "#92400e", label: "Pending Dispatch" },
  delivered:         { bg: "#dcfce7", color: "#15803d", label: "Delivered" },
  cancelled:         { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams?.id || "1";

  const {
    customers,
    orders,
    deliveries,
    customerRates,
    cylinderExchangeLedger,
    payments,
    ledger,
    products,
    missedOrderAlerts,
    followUpLogs,
    currentUserRole,
    setCustomerRate,
    recordPayment,
    recordEmptyReturn,
    requestRateChange,
    updateCustomerOrderingFrequency,
    updateCustomerTenureAndCredit,
    recordFollowUp,
    pauseCustomerAlerts,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [showRateModal, setShowRateModal] = useState(false);
  const [showRequestRateModal, setShowRequestRateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmptyReturnModal, setShowEmptyReturnModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  // Rate Form
  const activeProducts = products.filter(p => p.active);
  const [rateProdId, setRateProdId] = useState(activeProducts[0]?.id || "");
  const [ratePrice, setRatePrice] = useState("");
  const [rateReason, setRateReason] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<any>("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

  // Empty Return Form
  const [emptyReturnQty, setEmptyReturnQty] = useState(1);
  const [emptyReturnProd, setEmptyReturnProd] = useState("47.5kg LOT");
  const [emptyReturnRef, setEmptyReturnRef] = useState("");

  // Follow-up Form
  const [followUpResult, setFollowUpResult] = useState<CustomerFollowUp["result"]>("will_order_tomorrow");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpNextDate, setFollowUpNextDate] = useState("");

  // Tenure & Credit Form
  const [editTenureDays, setEditTenureDays] = useState(15);
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [tenureSaved, setTenureSaved] = useState(false);

  // Ordering frequency Form
  const [selectedFreq, setSelectedFreq] = useState<OrderingFrequency>("not_configured");
  const [customDays, setCustomDays] = useState(2);

  const c = customers.find(cust => cust.id === id || cust.code === id) || customers[0];

  if (!c) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Customer Not Found</h2>
        <Link href="/customers" style={{ color: "#f97316" }}>Return to Customers Master</Link>
      </div>
    );
  }

  const isAdmin = currentUserRole === "admin";

  // Linked records
  const custOrders = orders.filter(o => o.customerId === c.id);
  const custDeliveries = deliveries.filter(d => d.customerId === c.id);
  const custRates = customerRates.filter(r => r.customerId === c.id);
  const custExchange = cylinderExchangeLedger.filter(e => e.customerId === c.id);
  const custPayments = payments.filter(p => p.customerId === c.id);
  const custLedger = ledger.filter(l => l.customerId === c.id);
  const custAlert = missedOrderAlerts.find(a => a.customerId === c.id && a.status !== "resolved");
  const custFollowUps = followUpLogs.filter(f => f.customerId === c.id);

  // Credit & Exposure
  const creditLimit = c.credit_limit;
  const currentOutstanding = c.outstanding || 0;
  const availableCredit = creditLimit !== null ? Math.max(0, creditLimit - currentOutstanding) : null;
  const isOverCredit = creditLimit !== null && creditLimit > 0 && currentOutstanding > creditLimit;

  // Inactivity status
  const isMissedOrder = c.missed_order_alert_active || !!custAlert;

  // 10 Tabs specified by user
  const TABS = [
    { id: "overview", label: "Overview", Icon: Building2 },
    { id: "orders", label: `Orders (${custOrders.length})`, Icon: FileText },
    { id: "deliveries", label: `Deliveries (${custDeliveries.length})`, Icon: Truck },
    { id: "empty_cylinders", label: `Empty Cylinders (${c.empty_cylinders_pending || 0})`, Icon: RotateCcw, badge: (c.empty_cylinders_pending || 0) > 0 ? c.empty_cylinders_pending : undefined },
    { id: "rates", label: `Customer Rates (${custRates.length})`, Icon: Receipt },
    { id: "payments", label: `Payments (${custPayments.length})`, Icon: CreditCard },
    { id: "ledger", label: `Ledger (${custLedger.length})`, Icon: BookOpen },
    { id: "credit_tenure", label: "Credit & Tenure", Icon: Shield },
    { id: "alerts", label: "Order Alerts", Icon: AlertTriangle, badge: isMissedOrder ? "ALERT" : undefined, badgeColor: "#dc2626" },
    { id: "followups", label: `Follow-up History (${custFollowUps.length})`, Icon: History },
  ];

  // Save Rate
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === rateProdId);
    if (!prod || !ratePrice) return;

    setCustomerRate({
      customerId: c.id,
      customerName: c.name,
      customerCode: c.code,
      productId: prod.id,
      productName: prod.name,
      defaultRate: prod.rate,
      agreedRate: Number(ratePrice),
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin"
    });

    setShowRateModal(false);
    setRatePrice("");
  };

  // Staff Request Rate
  const handleStaffRequestRate = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === rateProdId);
    if (!prod || !ratePrice || !rateReason) return;

    requestRateChange({
      customerId: c.id,
      productId: prod.id,
      requestedRate: Number(ratePrice),
      reason: rateReason,
      requestedBy: "Staff User",
    });

    setShowRequestRateModal(false);
    setRatePrice("");
    setRateReason("");
    alert("Rate change request submitted for Admin approval!");
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;

    recordPayment({
      customerId: c.id,
      amount: Number(payAmount),
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      method: payMethod,
      ref: payRef || `TXN-${Date.now().toString().slice(-6)}`,
      remarks: payRemarks,
    });

    setShowPaymentModal(false);
    setPayAmount("");
    setPayRef("");
    setPayRemarks("");
  };

  // Record Empty Return
  const handleRecordEmptyReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (emptyReturnQty <= 0) return;

    recordEmptyReturn({
      customerId: c.id,
      productName: emptyReturnProd,
      emptyReceived: emptyReturnQty,
      returnDate: new Date().toISOString().split("T")[0],
      refNum: emptyReturnRef,
      recordedBy: isAdmin ? "Bachan Admin" : "Staff User",
    });

    setShowEmptyReturnModal(false);
    setEmptyReturnQty(1);
    setEmptyReturnRef("");
  };

  // Record Follow-up
  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    recordFollowUp({
      customerId: c.id,
      alertId: custAlert?.id,
      result: followUpResult,
      notes: followUpNotes,
      nextFollowUpDate: followUpNextDate,
      assignedStaff: "Sales Representative",
      recordedBy: isAdmin ? "Bachan Admin" : "Staff User",
    });

    setShowFollowUpModal(false);
    setFollowUpNotes("");
  };

  // Save Tenure & Credit
  const handleSaveTenureCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const creditVal = editCreditLimit ? Number(editCreditLimit) : null;
    updateCustomerTenureAndCredit(c.id, Number(editTenureDays) || 15, creditVal);
    setTenureSaved(true);
    setTimeout(() => setTenureSaved(false), 2000);
  };

  // Save Ordering Frequency
  const handleSaveFrequency = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerOrderingFrequency(c.id, selectedFreq, selectedFreq === "custom" ? customDays : undefined);
    alert("Ordering frequency updated and next expected order date recalculated!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* ── TOP BREADCRUMB & ACTIONS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
          <Link href="/customers" style={{ color: "#1e3a8a", textDecoration: "none", fontWeight: 700 }}>
            Customers Master
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: "#1e293b", fontWeight: 600 }}>{c.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowPaymentModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#16a34a",
              color: "#fff", border: "none", cursor: "pointer"
            }}
          >
            <CreditCard size={14} /> Record Payment
          </button>
          <button
            onClick={() => setShowEmptyReturnModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a",
              color: "#fff", border: "none", cursor: "pointer"
            }}
          >
            <RotateCcw size={14} /> Record Empty Return
          </button>
          <Link
            href={`/orders/new?customerId=${c.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316",
              color: "#fff", textDecoration: "none"
            }}
          >
            <Plus size={14} /> Create Order
          </Link>
        </div>
      </div>

      {/* ── CENTRAL BUSINESS SCREEN SUMMARY HEADER ── */}
      <div style={{
        ...card(), padding: 22,
        borderTop: isMissedOrder ? "4px solid #dc2626" : "4px solid #1e3a8a"
      }}>
        {/* Row 1: Title, Code, Status & Inactivity Alert */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e293b", margin: 0 }}>
                {c.name}
              </h1>
              <span style={{ fontFamily: "monospace", fontSize: 12.5, fontWeight: 800, background: "#dbeafe", color: "#1e3a8a", padding: "2px 8px", borderRadius: 6 }}>
                {c.code}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 100 }}>
                {c.category} · {c.consumer_type}
              </span>

              {/* Order Alert Status: RED INDICATOR IF MISSED */}
              {isMissedOrder ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 100, fontSize: 11.5, fontWeight: 900, background: "#fee2e2", color: "#b91c1c", letterSpacing: ".04em" }}>
                  <AlertTriangle size={13} /> MISSED EXPECTED ORDER (ALERT ACTIVE)
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                  <Check size={12} /> Refill Cadence Normal
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span><Phone size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> {c.mobile}</span>
              <span>·</span>
              <span><MapPin size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> {c.area}, {c.city}, {c.state}</span>
              {c.gst && c.gst !== "—" && (
                <>
                  <span>·</span>
                  <span>GSTIN: <strong>{c.gst}</strong></span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href={`/customers/${c.id}/edit`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "#f1f5f9", color: "#475569", textDecoration: "none" }}
            >
              <Edit3 size={13} /> Edit Master Info
            </Link>
          </div>
        </div>

        {/* Row 2: Comprehensive Business KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, background: "#f8fafc", padding: 14, borderRadius: 10 }} className="metric-grid-6">
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Current Outstanding</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: currentOutstanding > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
              {INR(c.outstanding)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Credit Limit</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginTop: 2 }}>
              {c.credit_limit !== null ? INR(c.credit_limit) : "Not Configured"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Available Credit</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: availableCredit !== null && availableCredit < 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
              {availableCredit !== null ? INR(availableCredit) : "Not Configured"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Payment Tenure</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a", marginTop: 2 }}>
              {c.payment_tenure_days || 15} Days
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Empty Pending</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: (c.empty_cylinders_pending || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
              {c.empty_cylinders_pending || 0} units
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Expected Next Order</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: isMissedOrder ? "#dc2626" : "#1e3a8a", marginTop: 2 }}>
              {c.expected_next_order_date || "Not Set"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 10 TABS NAVIGATION ── */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", borderBottom: "1.5px solid #e2e8f0", paddingBottom: 2 }}>
        {TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px",
                border: "none", background: "transparent", cursor: "pointer",
                borderBottom: isActive ? "3px solid #f97316" : "3px solid transparent",
                color: isActive ? "#f97316" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: 13, whiteSpace: "nowrap", transition: "all .12s"
              }}
            >
              <t.Icon size={15} color={isActive ? "#f97316" : "#64748b"} />
              <span>{t.label}</span>
              {t.badge && (
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 100, background: t.badgeColor || "#f97316", color: "#fff", fontWeight: 800 }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Ordering Pattern Analytics */}
            <div style={{ ...card(), padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>
                Ordering Pattern Analytics & Cadence
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Configured Cadence</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", marginTop: 3, textTransform: "capitalize" }}>
                    {c.ordering_frequency.replace(/_/g, " ")}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Last Qualifying Order</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginTop: 3 }}>
                    {c.last_order_date || c.last_supply || "—"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Avg Cylinders per Order</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a", marginTop: 3 }}>
                    {c.last_supply_qty > 0 ? `${c.last_supply_qty} units` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Cylinder Exchange Summary */}
            <div style={{ ...card(), padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  Cylinder Return & Exchange Summary
                </h3>
                <button
                  onClick={() => setShowEmptyReturnModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  <RotateCcw size={12} /> Receive Empties
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Total Filled Delivered</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginTop: 4 }}>
                    {c.total_filled_delivered || 0} units
                  </div>
                </div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>Total Empty Received</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#1d4ed8", marginTop: 4 }}>
                    {c.total_empty_received || 0} units
                  </div>
                </div>
                <div style={{ background: (c.empty_cylinders_pending || 0) > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${(c.empty_cylinders_pending || 0) > 0 ? "#fecaca" : "#e2e8f0"}`, padding: 14, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: (c.empty_cylinders_pending || 0) > 0 ? "#991b1b" : "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Empty Pending
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: (c.empty_cylinders_pending || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
                    {c.empty_cylinders_pending || 0} units
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Contact & Financial Quick Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...card(), padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 12px" }}>Billing & Contact Master</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                <div>Contact: <strong>{c.contact_person}</strong></div>
                <div>Phone: <strong>{c.mobile}</strong></div>
                <div>City: <strong>{c.city}</strong> ({c.pin})</div>
                <div>Address: {c.area}</div>
                <div>GSTIN: <strong>{c.gst || "Unregistered"}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDERS ── */}
      {activeTab === "orders" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Order History ({custOrders.length})</span>
            <Link href={`/orders/new?customerId=${c.id}`} style={{ fontSize: 12, fontWeight: 700, color: "#f97316", textDecoration: "none" }}>
              + Create New Order
            </Link>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Order #", "Date", "Cylinder Product", "Quantity", "Taxable Subtotal", "GST 18%", "Grand Total", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No orders booked for this customer yet.
                  </td>
                </tr>
              ) : (
                custOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/orders/${o.id}`} style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", textDecoration: "none" }}>
                        {o.num}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{o.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{o.items[0]?.productName || "47.5kg LOT"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{o.totalQty} units</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>₹{o.subtotal.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#f97316" }}>₹{o.taxAmt.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 800, color: "#1e3a8a" }}>₹{o.total.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: STATUS_BADGE[o.status]?.bg || "#f1f5f9", color: STATUS_BADGE[o.status]?.color || "#475569", textTransform: "uppercase" }}>
                        {STATUS_BADGE[o.status]?.label || o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 3: DELIVERIES ── */}
      {activeTab === "deliveries" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", fontWeight: 800, fontSize: 14, color: "#1e293b" }}>
            Delivery & Dispatch Trips ({custDeliveries.length})
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Delivery #", "Order Ref", "Cylinder Product", "Quantity", "Vehicle", "Driver", "Delivery Date", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No fleet delivery trips logged for this customer.
                  </td>
                </tr>
              ) : (
                custDeliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a" }}>{d.num}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/orders/${d.orderId}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12.5 }}>{d.orderNum}</Link>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{d.product}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{d.qty} units</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5 }}>{d.vehicle || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5 }}>{d.driver || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{d.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: d.status === "delivered" ? "#dcfce7" : "#fef3c7", color: d.status === "delivered" ? "#15803d" : "#92400e", textTransform: "uppercase" }}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 4: EMPTY CYLINDERS ── */}
      {activeTab === "empty_cylinders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Exchange Summary Banner */}
          <div style={{ ...card(), padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: 0 }}>Customer Cylinder Exchange Ledger</h3>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                  Closing Pending = Opening Pending + Filled Delivered − Empty Received
                </p>
              </div>
              <button
                onClick={() => setShowEmptyReturnModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <RotateCcw size={14} /> + Record Empty Received
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Filled Supplied</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1e293b", marginTop: 4 }}>{c.total_filled_delivered || 0} units</div>
              </div>
              <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Total Empties Returned</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a", marginTop: 4 }}>{c.total_empty_received || 0} units</div>
              </div>
              <div style={{ background: (c.empty_cylinders_pending || 0) > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${(c.empty_cylinders_pending || 0) > 0 ? "#fecaca" : "#bbf7d0"}`, padding: 14, borderRadius: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: (c.empty_cylinders_pending || 0) > 0 ? "#991b1b" : "#166534", textTransform: "uppercase" }}>Unreturned Empties (Pending)</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: (c.empty_cylinders_pending || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
                  {c.empty_cylinders_pending || 0} units
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Exchange Ref", "Product", "Filled Supplied", "Empty Received", "Closing Pending", "Date", "Recorded By", "Remarks"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custExchange.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                      No cylinder exchange records logged yet.
                    </td>
                  </tr>
                ) : (
                  custExchange.map(e => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{e.exchangeNum}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{e.productName}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>{e.filledDelivered > 0 ? `${e.filledDelivered} units` : "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{e.emptyReceived} units</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: e.emptyPending > 0 ? "#dc2626" : "#16a34a" }}>{e.emptyPending} pending</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.returnDate}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>{e.recordedBy}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: CUSTOMER RATES ── */}
      {activeTab === "rates" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Approved Customer Rates</span>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Rate per cylinder/unit (GST 18% calculated separately)</p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => setShowRateModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <Plus size={14} /> + Add Customer Rate
              </button>
            ) : (
              <button
                onClick={() => setShowRequestRateModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
              >
                <Plus size={14} /> Request Rate Change
              </button>
            )}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["LPG Product Line", "Approved Basic Rate", "Statutory GST", "Effective From", "Valid Till", "Authorized By"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custRates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No customer-specific rate negotiated yet. Orders will require an approved rate prior to booking.
                  </td>
                </tr>
              ) : (
                custRates.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{r.productName}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                      ₹{r.agreedRate.toLocaleString("en-IN")} <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>/ unit</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#f97316", fontWeight: 600 }}>18% Exclusive</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{r.effectiveFrom}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{r.validTill}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#1e3a8a", fontWeight: 600 }}>{r.approvedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 6: PAYMENTS ── */}
      {activeTab === "payments" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Payment Collections ({custPayments.length})</span>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Total Collected: ₹{custPayments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <CreditCard size={14} /> Record Payment
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Receipt #", "Payment Date", "Amount Received", "Payment Method", "Reference #", "Received By", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No payment receipts logged for this account.
                  </td>
                </tr>
              ) : (
                custPayments.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a" }}>{p.num}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{p.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{p.amount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5 }}>{p.method}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>{p.ref}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>{p.receivedBy}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 7: LEDGER ── */}
      {activeTab === "ledger" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Account Statement & Running Ledger</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: currentOutstanding > 0 ? "#dc2626" : "#16a34a" }}>
              Closing Balance: {INR(c.outstanding)} Dr
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Date", "Voucher Ref", "Transaction Details", "Debit (+ ₹)", "Credit (- ₹)", "Balance (Dr ₹)"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No ledger transactions posted yet.
                  </td>
                </tr>
              ) : (
                custLedger.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{l.date}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a" }}>{l.ref}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#1e293b" }}>{l.desc}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: l.debit > 0 ? "#dc2626" : "#64748b" }}>
                      {l.debit > 0 ? `₹${l.debit.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: l.credit > 0 ? "#16a34a" : "#64748b" }}>
                      {l.credit > 0 ? `₹${l.credit.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 900, color: "#1e3a8a" }}>
                      ₹{l.balance.toLocaleString("en-IN")} Dr
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 8: CREDIT & TENURE ── */}
      {activeTab === "credit_tenure" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div style={{ ...card(), padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>
              Configure Payment Tenure & Credit Limit
            </h3>

            {tenureSaved && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                ✓ Credit limit and payment tenure updated successfully!
              </div>
            )}

            {isAdmin ? (
              <form onSubmit={handleSaveTenureCredit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Payment Tenure (Permitted Days) *
                  </label>
                  <select
                    value={editTenureDays}
                    onChange={e => setEditTenureDays(Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                    Used to automatically calculate due date on all future invoices: Due Date = Invoice Date + {editTenureDays} Days.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={editCreditLimit}
                    onChange={e => setEditCreditLimit(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                    Current Credit Exposure: {INR(c.outstanding)}. Available: {availableCredit !== null ? INR(availableCredit) : "Not Configured"}.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{ padding: "9px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                  >
                    Save Credit Settings
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, fontSize: 13, color: "#475569" }}>
                <p><strong>Staff View:</strong> Credit limits and payment tenures can only be modified by an authorized Administrator.</p>
                <div style={{ marginTop: 10 }}>Current Payment Tenure: <strong>{c.payment_tenure_days || 15} Days</strong></div>
                <div>Current Credit Limit: <strong>{c.credit_limit !== null ? INR(c.credit_limit) : "Not Configured"}</strong></div>
              </div>
            )}
          </div>

          <div style={{ ...card(), padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>
              Credit Exposure Summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Sanctioned Credit Limit:</span>
                <strong>{c.credit_limit !== null ? INR(c.credit_limit) : "Not Configured"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Current Debit Outstanding:</span>
                <strong style={{ color: currentOutstanding > 0 ? "#dc2626" : "#16a34a" }}>{INR(c.outstanding)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Available Credit Exposure:</span>
                <strong style={{ color: availableCredit !== null && availableCredit < 0 ? "#dc2626" : "#16a34a" }}>
                  {availableCredit !== null ? INR(availableCredit) : "Not Configured"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#64748b" }}>Payment Tenure Rule:</span>
                <strong>Net {c.payment_tenure_days || 15} Days</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: ORDER ALERTS & CADENCE ── */}
      {activeTab === "alerts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div style={{ ...card(), padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>
              Configure Expected Order Cadence
            </h3>
            <form onSubmit={handleSaveFrequency} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Customer Ordering Frequency *
                </label>
                <select
                  value={selectedFreq}
                  onChange={e => setSelectedFreq(e.target.value as any)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  <option value="not_configured">Not Configured (Monitoring Off)</option>
                  <option value="daily">Daily Refill</option>
                  <option value="every_2_days">Every 2 Days</option>
                  <option value="every_3_days">Every 3 Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Interval (Days)</option>
                </select>
              </div>

              {selectedFreq === "custom" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Custom Frequency (Number of Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={e => setCustomDays(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => pauseCustomerAlerts(c.id, !c.alert_paused, "Customer Requested Pause")}
                  style={{ padding: "8px 14px", borderRadius: 8, background: "#f1f5f9", color: c.alert_paused ? "#16a34a" : "#dc2626", border: "1px solid #cbd5e1", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  {c.alert_paused ? "▶ Resume Monitoring" : "⏸ Pause Monitoring"}
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  Update Cadence
                </button>
              </div>
            </form>
          </div>

          <div style={{ ...card(), padding: 22, borderLeft: isMissedOrder ? "4px solid #dc2626" : "4px solid #16a34a" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", margin: "0 0 12px" }}>
              Active Cadence Status
            </h3>
            {isMissedOrder ? (
              <div style={{ background: "#fee2e2", padding: 14, borderRadius: 8, color: "#991b1b" }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>⚠️ MISSED EXPECTED ORDER ALERT</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>
                  Expected Order Date: <strong>{c.expected_next_order_date}</strong>. The 18:00 Asia/Kolkata ordering cutoff has passed without a qualifying order.
                </div>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  style={{ marginTop: 10, padding: "6px 12px", borderRadius: 6, background: "#b91c1c", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Record Follow-up Call
                </button>
              </div>
            ) : (
              <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 8, color: "#166534", fontSize: 13 }}>
                ✓ No missed orders active for this customer account.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 10: FOLLOW-UP HISTORY ── */}
      {activeTab === "followups" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Documented Follow-up Calls & Interactions</span>
            <button
              onClick={() => setShowFollowUpModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <MessageSquare size={14} /> + Record Call
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Timestamp", "Call Outcome", "Conversation Notes", "Next Action Date", "Staff Member", "Recorded By"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No follow-up calls documented yet.
                  </td>
                </tr>
              ) : (
                custFollowUps.map(f => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{f.contactedAt}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", textTransform: "capitalize" }}>
                        {f.result.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#1e293b" }}>{f.notes || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5 }}>{f.nextFollowUpDate || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>{f.assignedStaff || "Sales Desk"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{f.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Admin Add Customer Rate Modal */}
      {showRateModal && isAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 440, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Assign Customer Rate</h3>
            <form onSubmit={handleSaveRate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Select Product Line</label>
                <select
                  value={rateProdId}
                  onChange={e => setRateProdId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Approved Basic Rate (₹ per Cylinder) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2680"
                  value={ratePrice}
                  onChange={e => setRatePrice(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>Statutory 18% GST will be added during invoicing.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowRateModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Save Customer Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Request Rate Modal */}
      {showRequestRateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 440, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Request Rate Change for {c.name}</h3>
            <form onSubmit={handleStaffRequestRate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Product Line</label>
                <select
                  value={rateProdId}
                  onChange={e => setRateProdId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Requested Basic Rate (₹ per Cylinder) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2650"
                  value={ratePrice}
                  onChange={e => setRatePrice(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Reason for Request *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily buyer of 4+ cylinders, competitor offering lower rate"
                  value={rateReason}
                  onChange={e => setRateReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowRequestRateModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 460, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Record Payment from {c.name}</h3>
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 12.5 }}>
                Current Outstanding Balance: <strong style={{ color: "#dc2626" }}>{INR(c.outstanding)}</strong>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Amount Received (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Reference #</label>
                  <input
                    placeholder="e.g. UTR-99214"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Remarks</label>
                <input
                  placeholder="e.g. Payment for invoice #0021"
                  value={payRemarks}
                  onChange={e => setPayRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Empty Return Modal */}
      {showEmptyReturnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 440, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Record Empty Cylinders Returned</h3>
            <form onSubmit={handleRecordEmptyReturn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, fontSize: 12.5 }}>
                Currently Pending Empties: <strong style={{ color: "#dc2626" }}>{c.empty_cylinders_pending || 0} units</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Cylinder Product</label>
                  <select
                    value={emptyReturnProd}
                    onChange={e => setEmptyReturnProd(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  >
                    <option value="47.5kg LOT">47.5kg LOT</option>
                    <option value="47.5kg VOT">47.5kg VOT</option>
                    <option value="425kg jumbo">425kg jumbo</option>
                    <option value="19kg nano cut">19kg nano cut</option>
                    <option value="19 kg extra tej">19 kg extra tej</option>
                    <option value="19 kg normal">19 kg normal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Empties Returned *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={emptyReturnQty}
                    onChange={e => setEmptyReturnQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Challan / Return Slip #</label>
                <input
                  placeholder="e.g. RET-0091"
                  value={emptyReturnRef}
                  onChange={e => setEmptyReturnRef(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEmptyReturnModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Record Empties</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Follow-up Modal */}
      {showFollowUpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 460, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 14px" }}>Record Follow-up Call for {c.name}</h3>
            <form onSubmit={handleFollowUpSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Call Outcome *</label>
                <select
                  value={followUpResult}
                  onChange={e => setFollowUpResult(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  <option value="will_order_tomorrow">Customer Will Order Tomorrow</option>
                  <option value="sufficient_stock">Customer Has Sufficient Stock</option>
                  <option value="temporarily_closed">Customer Temporarily Closed</option>
                  <option value="changed_supplier">Customer Has Changed Supplier</option>
                  <option value="unable_to_contact">Unable to Contact (Ringing / Switched Off)</option>
                  <option value="other">Other Commercial Reason</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Next Follow-up Date</label>
                <input
                  type="date"
                  value={followUpNextDate}
                  onChange={e => setFollowUpNextDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spoke to purchasing officer, order arriving tomorrow morning"
                  value={followUpNotes}
                  onChange={e => setFollowUpNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setShowFollowUpModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Save Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
