"use client";
import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone, Mail, Building2, MapPin, Edit3, Plus, FileText,
  CreditCard, Truck, History, BookOpen, AlertCircle, CheckCircle,
  Receipt, ArrowUpRight, ArrowDownLeft, Download, Eye, ChevronRight,
  Printer, X, Check
} from "lucide-react";
import { useERPStore, Customer } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Yet Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};
const LAKHS = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${(n/1000).toFixed(1)}k`;
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:             { bg:"#f1f5f9", color:"#475569", label:"Draft" },
  confirmed:         { bg:"#dbeafe", color:"#1d4ed8", label:"Confirmed" },
  approved:          { bg:"#ede9fe", color:"#6d28d9", label:"Approved" },
  pending_dispatch:  { bg:"#fef3c7", color:"#92400e", label:"Pending Dispatch" },
  delivered:         { bg:"#dcfce7", color:"#15803d", label:"Delivered" },
  cancelled:         { bg:"#fee2e2", color:"#991b1b", label:"Cancelled" },
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
    payments,
    ledger,
    products,
    setCustomerRate,
    recordPayment
  } = useERPStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [showRateModal, setShowRateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form states
  const [rateProdId, setRateProdId] = useState("1");
  const [ratePrice, setRatePrice] = useState("2710");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Bank Transfer (NEFT)");
  const [payRef, setPayRef] = useState("");

  const c = customers.find(cust => cust.id === id || cust.code === id) || customers[0];

  if (!c) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Customer Not Found</h2>
        <Link href="/customers" style={{ color: "#f97316" }}>Return to Customers List</Link>
      </div>
    );
  }

  // Filter linked customer records
  const custOrders = orders.filter(o => o.customerId === c.id);
  const custDeliveries = deliveries.filter(d => d.customerId === c.id);
  const custRates = customerRates.filter(r => r.customerId === c.id);
  const custPayments = payments.filter(p => p.customerId === c.id);
  const custLedger = ledger.filter(l => l.customerId === c.id);

  const utilized = (c.credit_limit || 0) > 0 ? (((c.outstanding || 0) / c.credit_limit!) * 100) : 0;
  const available = c.credit_limit !== null ? Math.max(0, (c.credit_limit || 0) - (c.outstanding || 0)) : null;

  const TABS = [
    { id: "overview", label: "Overview", Icon: Building2 },
    { id: "orders", label: `Orders (${custOrders.length})`, Icon: FileText },
    { id: "deliveries", label: `Deliveries (${custDeliveries.length})`, Icon: Truck },
    { id: "rates", label: `Assigned Rates (${custRates.length})`, Icon: Receipt },
    { id: "payments", label: `Payments (${custPayments.length})`, Icon: CreditCard },
    { id: "ledger", label: `Account Ledger (${custLedger.length})`, Icon: BookOpen },
  ];

  // Save Rate
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === rateProdId);
    if (!prod) return;

    setCustomerRate({
      customerId: c.id,
      customerName: c.name,
      customerCode: c.code,
      productId: prod.id,
      productName: prod.name,
      defaultRate: prod.rate,
      agreedRate: parseFloat(ratePrice) || prod.rate,
      effectiveFrom: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      validTill: "31 Mar 2027",
      approvedBy: "Super Admin"
    });
    setShowRateModal(false);
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;

    recordPayment({
      customerId: c.id,
      amount: amt,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      method: payMethod,
      ref: payRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    });
    setPayAmount("");
    setPayRef("");
    setShowPaymentModal(false);
  };

  // Export Ledger
  const handleDownloadLedger = () => {
    const headers = ["Date", "Voucher Ref", "Type", "Description", "Debit (Dr)", "Credit (Cr)", "Running Balance"];
    const rows = custLedger.map(l => [
      l.date,
      l.ref,
      `"${l.type}"`,
      `"${l.desc}"`,
      l.debit,
      l.credit,
      l.balance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_${c.code}_${c.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
        <Link href="/customers" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Customers</Link>
        <ChevronRight size={13} color="#94a3b8" />
        <span style={{ color: "#1e293b", fontWeight: 700 }}>{c.name}</span>
        <span style={{ background: "#dbeafe", color: "#1e3a8a", padding: "2px 8px", borderRadius: 6, fontFamily: "monospace", fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
          {c.code}
        </span>
      </div>

      {/* Profile Header Card */}
      <div style={{ ...card(), padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: "#1e3a8a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0,
            boxShadow: "0 4px 12px rgba(30,58,138,.2)"
          }}>
            {c.name[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>{c.name}</h1>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", background: c.status === "active" ? "#dcfce7" : "#f1f5f9", color: c.status === "active" ? "#15803d" : "#475569" }}>
                {c.status}
              </span>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", background: "#dbeafe", color: "#1d4ed8" }}>
                {c.category}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{c.business}</div>

            <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Phone size={13} color="#f97316" /> {c.mobile}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Mail size={13} color="#f97316" /> {c.email}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Building2 size={13} color="#f97316" /> GST: <strong style={{ color: "#1e293b" }}>{c.gst}</strong>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MapPin size={13} color="#f97316" /> {c.area}, {c.city}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
            <Link href={`/customers/${c.id}/edit`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", textDecoration: "none" }}>
              <Edit3 size={14} /> Edit Profile
            </Link>
            <button
              onClick={() => setShowPaymentModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}>
              <CreditCard size={14} /> Record Payment
            </button>
            <Link href={`/orders/new?customerId=${c.id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", textDecoration: "none" }}>
              <Plus size={14} /> Create Order
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", marginBottom: 8 }}>
            <Receipt size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Outstanding Due</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626" }}>{INR(c.outstanding)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Due across all posted invoices</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: (c.overdue || 0) > 0 ? "#dc2626" : "#16a34a", marginBottom: 8 }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Overdue Amount</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: (c.overdue || 0) > 0 ? "#dc2626" : "#16a34a" }}>{INR(c.overdue)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {(c.overdue || 0) > 0 ? "Exceeded payment terms" : "Zero overdue balance"}
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <CreditCard size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Available Borrowing Room</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>
            {available !== null ? INR(available) : "Not Configured"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {c.credit_limit !== null ? `Limit: ${INR(c.credit_limit)} (${utilized.toFixed(0)}% used)` : "Credit limit not yet sanctioned"}
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Last Payment Cleared</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>{INR(c.last_payment)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Received on {c.last_payment_date}</div>
        </div>
      </div>

      {/* Credit Utilization Meter */}
      <div style={{ ...card(), padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Credit Exposure Status ({c.payment_terms})
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: utilized >= 90 ? "#dc2626" : utilized >= 70 ? "#f97316" : "#16a34a" }}>
            {utilized.toFixed(1)}% utilized
          </span>
        </div>
        <div style={{ height: 8, background: "#f0f4fa", borderRadius: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(utilized, 100)}%`, borderRadius: 100, background: utilized >= 90 ? "#dc2626" : utilized >= 70 ? "#f97316" : "#16a34a", transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#64748b" }}>
          <span>₹0</span>
          <span>{INR(c.outstanding)} current debit</span>
          <span>Approved Limit: {INR(c.credit_limit)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 6, background: "#fff", padding: 6,
        borderRadius: 10, border: "1px solid #e2e8f0",
        overflowX: "auto", WebkitOverflowScrolling: "touch"
      }} className="tab-scroll-bar">
        {TABS.map(t => {
          const isAct = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: isAct ? 700 : 500,
                cursor: "pointer", transition: "all .15s", border: "none",
                background: isAct ? "#f97316" : "transparent",
                color: isAct ? "#fff" : "#64748b",
                whiteSpace: "nowrap"
              }}>
              <t.Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ ...card() }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
              Supply & Delivery Summary
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <KV k="Last Supply Date" v={c.last_supply} />
              <KV k="Last Supplied Qty" v={c.last_supply_qty > 0 ? `${c.last_supply_qty} Cylinders (${c.last_supply_product})` : "—"} />
              <KV k="Payment Terms" v={c.payment_terms} />
              <KV k="Active Orders in Pipeline" v={`${c.pending_orders} active order(s)`} />
              <KV k="Total Delivered Cylinders" v={`${custDeliveries.filter(d => d.status === "delivered").reduce((s, d) => s + d.qty, 0)} Cylinders`} />
            </div>
          </div>

          <div style={{ ...card() }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
              Registration & Tax Information
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <KV k="Consumer Identification Number" v={c.code} />
              <KV k="Consumer Type" v={c.consumer_type} />
              <KV k="Registered Phone" v={c.mobile} />
              <KV k="GSTIN" v={c.gst} />
              <KV k="Delivery & Billing Address" v={`${c.area}, ${c.city}, ${c.state}`} />
              <KV k="Primary Contact Person" v={c.contact_person} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === "orders" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Orders Placed for {c.name}</span>
            <Link href={`/orders/new?customerId=${c.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#f97316", color: "#fff", textDecoration: "none" }}>
              <Plus size={13} /> New Order
            </Link>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Order #","Date","Cylinders","Amount","Status",""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>No orders placed yet.</td></tr>
              ) : (
                custOrders.map(o => {
                  const s = STATUS_BADGE[o.status] ?? STATUS_BADGE.draft;
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{o.num}</span></td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.date}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{o.totalQty} cylinders ({o.totalKg} kg)</td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: 13, color: "#1e293b" }}>{INR(o.total)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/orders/${o.id}`} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#1e3a8a", background: "#dbeafe", textDecoration: "none" }}>
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Deliveries */}
      {activeTab === "deliveries" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Delivery #","Date","Order #","Product","Quantity","Vehicle","Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custDeliveries.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>No delivery records found.</td></tr>
              ) : (
                custDeliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{d.num}</span></td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{d.date}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{d.orderNum}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#1e293b" }}>{d.product}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: 13, color: "#1e293b" }}>{d.qty}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{d.vehicle}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: d.status === "delivered" ? "#dcfce7" : "#fef3c7", color: d.status === "delivered" ? "#15803d" : "#92400e" }}>
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

      {/* Tab 4: Assigned Rates */}
      {activeTab === "rates" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Customer-Specific Contract Rates</span>
            <button onClick={() => setShowRateModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus size={13} /> Update Customer Rate
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Product","Agreed Rate","Default Agency Rate","Difference","Effective Period"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custRates.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Default catalog rates apply. Click &quot;Update Customer Rate&quot; to set custom pricing.</td></tr>
              ) : (
                custRates.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{r.productName}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#16a34a", fontSize: 13 }}>{INR(r.agreedRate)}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>{INR(r.defaultRate)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                      -₹{r.defaultRate - r.agreedRate}/cyl
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{r.effectiveFrom} → {r.validTill}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Payments */}
      {activeTab === "payments" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Payment Receipts Cleared</span>
            <button onClick={() => setShowPaymentModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus size={13} /> Record Receipt
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Receipt #","Payment Date","Amount Received","Payment Method","Transaction Reference"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custPayments.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>No payments recorded yet.</td></tr>
              ) : (
                custPayments.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{p.num}</span></td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{p.date}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#16a34a", fontSize: 13 }}>{INR(p.amount)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "#dbeafe", color: "#1d4ed8" }}>
                        {p.method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{p.ref}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Ledger */}
      {activeTab === "ledger" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Statement of Account / Immutable Ledger</span>
            <button onClick={handleDownloadLedger} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
              <Download size={13} /> Export Ledger (CSV)
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Date","Particulars / Description","Voucher Ref #","Debit (Dr)","Credit (Cr)","Running Balance"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: h.includes("Balance") || h.includes("Dr") || h.includes("Cr") ? "right" : "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custLedger.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>No ledger transactions recorded.</td></tr>
              ) : (
                custLedger.map((e, i) => (
                  <tr key={e.id || i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{e.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#1e293b", fontWeight: e.debit > 0 ? 500 : 400 }}>{e.desc}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#1e3a8a" }}>{e.ref}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: e.debit > 0 ? "#dc2626" : "#94a3b8", fontSize: 13 }}>
                      {e.debit > 0 ? INR(e.debit) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: e.credit > 0 ? "#16a34a" : "#94a3b8", fontSize: 13 }}>
                      {e.credit > 0 ? INR(e.credit) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, fontSize: 13, color: "#1e293b" }}>{INR(e.balance)} Dr</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "2px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
              Net Closing Balance: <span style={{ color: "#dc2626" }}>{INR(c.outstanding)}</span> (Dr)
            </span>
          </div>
        </div>
      )}

      {/* ── Add/Edit Rate Modal ── */}
      {showRateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 440, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Configure Contract Rate</h3>
              <button onClick={() => setShowRateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Select Cylinder Product *</label>
                <select value={rateProdId} onChange={e => setRateProdId(e.target.value)} style={inp}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Base: ₹{p.rate})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Agreed Unit Rate (₹) *</label>
                <input type="number" required value={ratePrice} onChange={e => setRatePrice(e.target.value)} style={inp} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowRateModal(false)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>Save Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      {showPaymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 440, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Record Payment Receipt</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span style={{ fontSize: 12, color: "#64748b" }}>Current Outstanding:</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626" }}>{INR(c.outstanding)}</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Amount Received (₹) *</label>
                <input type="number" required placeholder="50000" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Payment Method *</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={inp}>
                  <option>Bank Transfer (NEFT)</option>
                  <option>Bank Transfer (RTGS)</option>
                  <option>UPI Payment</option>
                  <option>Cheque</option>
                  <option>Cash Receipt</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Transaction / Reference Ref</label>
                <input type="text" placeholder="NEFT-..." value={payRef} onChange={e => setPayRef(e.target.value)} style={inp} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}>✓ Confirm Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ color: "#64748b" }}>{k}</span>
      <span style={{ fontWeight: 600, color: "#1e293b" }}>{v}</span>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", boxSizing:"border-box" };
