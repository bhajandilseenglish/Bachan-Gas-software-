"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Clock, Truck, FileText,
  Printer, AlertCircle, Package, Calendar, User, ChevronRight, Plus
} from "lucide-react";
import { useERPStore } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:               { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  confirmed:           { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" },
  approved:            { bg: "#ede9fe", color: "#6d28d9", label: "Approved" },
  pending_dispatch:    { bg: "#fef3c7", color: "#92400e", label: "Pending Dispatch" },
  partially_delivered: { bg: "#cffafe", color: "#0e7490", label: "Part. Delivered" },
  delivered:           { bg: "#dcfce7", color: "#15803d", label: "Delivered" },
  cancelled:           { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams?.id || "";
  const router = useRouter();

  const { orders, updateOrderStatus, createDelivery, postInvoice, invoices } = useERPStore();
  const o = orders.find(ord => ord.id === id || ord.num === id) || orders[0];

  const [vehicle, setVehicle] = useState("PB-10-CZ-4102");
  const [driver, setDriver] = useState("Gurdeep Singh");
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  if (!o) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Package size={48} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ color: "#1e293b", margin: 0 }}>Order Not Found</h2>
        <p style={{ color: "#64748b", marginTop: 6 }}>The requested order could not be located in the database.</p>
        <Link href="/orders" style={{ display: "inline-block", marginTop: 16, color: "#f97316", fontWeight: 700 }}>
          ← Return to Orders
        </Link>
      </div>
    );
  }

  const existingInvoice = invoices.find(inv => inv.orderId === o.id || inv.orderNum === o.num);

  const steps = [
    { key: "draft", label: "Draft", done: true },
    { key: "confirmed", label: "Confirmed", done: true },
    { key: "approved", label: "Approved", done: o.status !== "draft" && o.status !== "confirmed" },
    { key: "pending_dispatch", label: "Dispatched", done: o.status === "pending_dispatch" || o.status === "delivered" },
    { key: "delivered", label: "Delivered", done: o.status === "delivered" },
  ];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    createDelivery({
      orderId: o.id,
      vehicle,
      driver,
    });
    setShowDispatchModal(false);
  };

  const handlePostInvoice = () => {
    postInvoice({ orderId: o.id });
    alert(`Tax Invoice posted successfully for Order ${o.num}!`);
  };

  const sMeta = STATUS_BADGE[o.status] || STATUS_BADGE.confirmed;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
            <ArrowLeft size={16} color="#64748b" />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                {o.num}
              </h1>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", background: sMeta.bg, color: sMeta.color }}>
                {sMeta.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>
              Created on {o.date} by {o.createdBy}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Printer size={14} /> Print Order Slip
          </button>

          {o.status === "confirmed" && (
            <button onClick={() => updateOrderStatus(o.id, "approved")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}>
              Approve for Dispatch
            </button>
          )}

          {(o.status === "approved" || o.status === "confirmed") && (
            <button onClick={() => setShowDispatchModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
              <Truck size={14} /> Assign Vehicle & Dispatch
            </button>
          )}

          {!existingInvoice && (
            <button onClick={handlePostInvoice}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}>
              <FileText size={14} /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div style={{ ...card(), padding: "18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {steps.map((st, idx) => (
            <div key={st.key} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : "initial" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: st.done ? "#16a34a" : "#f1f5f9",
                  color: st.done ? "#fff" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700
                }}>
                  {st.done ? "✓" : idx + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.done ? "#1e293b" : "#94a3b8" }}>{st.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ height: 2, background: st.done ? "#16a34a" : "#e2e8f0", flex: 1, margin: "0 10px 18px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Split */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        {/* Left: Items Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
              Cylinder Order Lines
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Product Description", "Qty", "Rate (₹)", "Tax (%)", "Subtotal (₹)", "Total (₹)"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {o.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{it.productName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>SKU: {it.productCode} ({it.weight} kg LPG)</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{it.qty}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>₹{it.unitRate.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{it.taxPct}%</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>₹{it.subtotal.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>₹{it.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {o.remarks && (
            <div style={{ ...card(), padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b", marginBottom: 6 }}>
                Gate & Delivery Remarks
              </div>
              <div style={{ fontSize: 13, color: "#1e293b" }}>{o.remarks}</div>
            </div>
          )}
        </div>

        {/* Right: Summary & Customer Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...card(), padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b", marginBottom: 12 }}>
              Customer Information
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{o.customerName}</div>
            <div style={{ fontSize: 12, color: "#1e3a8a", fontWeight: 700, fontFamily: "monospace", marginTop: 2 }}>{o.customerCode}</div>
            <div style={{ marginTop: 12 }}>
              <Link href={`/customers/${o.customerId}`} style={{ fontSize: 12, fontWeight: 700, color: "#f97316", textDecoration: "none" }}>
                View Customer Master Profile →
              </Link>
            </div>
          </div>

          <div style={{ ...card(), padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b", marginBottom: 12 }}>
              Financial Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Cylinders:</span>
                <strong>{o.totalQty} units ({o.totalKg} kg)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Subtotal:</span>
                <span>₹{o.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>GST Tax:</span>
                <span>₹{o.taxAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>
                <span>Total Amount:</span>
                <span>₹{o.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Dispatch Order #{o.num}</h3>
            <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Vehicle Number</label>
                <input type="text" required value={vehicle} onChange={e => setVehicle(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Driver Name</label>
                <input type="text" required value={driver} onChange={e => setDriver(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowDispatchModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Dispatch Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
