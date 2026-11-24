"use client";
import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Clock, Truck, FileText,
  Printer, AlertCircle, Package, Calendar, User, ChevronRight,
  ShieldCheck, ArrowRight, RotateCcw, CreditCard, DollarSign,
  Building2, Hash, Check
} from "lucide-react";
import { useERPStore, Delivery, Invoice } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  draft:               { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  confirmed:           { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" },
  approved:            { bg: "#ede9fe", color: "#6d28d9", label: "Approved" },
  pending_dispatch:    { bg: "#fef3c7", color: "#92400e", label: "Dispatched / In Transit" },
  partially_delivered: { bg: "#cffafe", color: "#0e7490", label: "Partially Delivered" },
  delivered:           { bg: "#dcfce7", color: "#15803d", label: "Delivered" },
  cancelled:           { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const PAYMENT_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  paid:           { bg: "#dcfce7", color: "#15803d", label: "Paid / Settled" },
  partially_paid: { bg: "#fef3c7", color: "#92400e", label: "Partially Paid" },
  unpaid:         { bg: "#fee2e2", color: "#991b1b", label: "Payment Pending" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams?.id || "";
  const router = useRouter();

  const {
    orders,
    customers,
    deliveries,
    invoices,
    customerAdvances,
    advanceAllocations,
    cylinderExchangeLedger,
    currentUserRole,
    updateOrderStatus,
    createDelivery,
    confirmDelivery,
    postInvoice,
    allocateAdvanceToInvoice,
    recordPayment,
  } = useERPStore();

  const o = orders.find(ord => ord.id === id || ord.num === id) || orders[0];
  const customer = customers.find(c => c.id === o?.customerId || c.code === o?.customerId || c.code === o?.customerCode);

  // Linked documents
  const linkedDelivery = deliveries.find(d => d.orderId === o?.id || d.orderNum === o?.num);
  const linkedInvoice = invoices.find(inv => inv.orderId === o?.id || inv.orderNum === o?.num);
  const linkedExchange = cylinderExchangeLedger.find(ex => ex.orderId === o?.id || ex.orderNum === o?.num);
  const linkedAllocations = advanceAllocations.filter(a => linkedInvoice && a.invoiceId === linkedInvoice.id);

  // Dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [vehicle, setVehicle] = useState("PB-10-CZ-4102");
  const [driver, setDriver] = useState("Gurdeep Singh");

  // Delivery confirmation modal with empties
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receiverName, setReceiverName] = useState(o?.customerName || "");
  const [emptyReceived, setEmptyReceived] = useState<number>(o?.totalQty || 0);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Advance allocation modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceId, setAdvanceId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [actionSuccess, setActionSuccess] = useState("");

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");

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

  // Available customer advances
  const availableAdvances = customerAdvances.filter(
    a => a.customerId === customer?.id && a.remainingAdvance > 0 && a.status !== "fully_applied"
  );

  // Stepper calculations
  const isApproved = o.status !== "draft" && o.status !== "confirmed";
  const isDispatched = o.status === "pending_dispatch" || o.status === "delivered" || !!linkedDelivery;
  const isDelivered = o.status === "delivered" || linkedDelivery?.status === "delivered";
  const isInvoiced = !!linkedInvoice;
  const isPaid = (o.paymentStatus === "paid") || (linkedInvoice?.status === "paid");

  const steps = [
    { key: "created", label: "Order Created", sub: o.date, done: true },
    { key: "confirmed", label: "Order Confirmed", sub: o.status !== "draft" ? "Confirmed" : "Pending", done: o.status !== "draft" },
    { key: "dispatched", label: "Dispatched", sub: linkedDelivery ? linkedDelivery.num : (isDispatched ? "In Transit" : "Pending"), done: isDispatched },
    { key: "delivered", label: "Delivered", sub: isDelivered ? `${o.qtyIssued || o.totalQty} Delivered` : "Pending", done: isDelivered },
    { key: "invoiced", label: "Invoiced", sub: linkedInvoice ? linkedInvoice.num : "Not Invoiced", done: isInvoiced },
    { key: "paid", label: "Payment Settled", sub: isPaid ? "Settled" : (o.paymentStatus === "partially_paid" ? "Partial" : "Pending"), done: isPaid },
  ];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    createDelivery({
      orderId: o.id,
      vehicle,
      driver,
    });
    setShowDispatchModal(false);
    setActionSuccess("Vehicle assigned and order dispatched successfully.");
  };

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedDelivery) {
      confirmDelivery(linkedDelivery.id, {
        deliveredAt: new Date().toISOString(),
        receiverName: receiverName || o.customerName,
        emptyReceived: Number(emptyReceived) || 0,
        notes: deliveryNotes,
      });
      setShowConfirmModal(false);
      setActionSuccess(`Delivery confirmed! ${emptyReceived} empty cylinder(s) received into warehouse.`);
    } else {
      // Create and confirm
      createDelivery({
        orderId: o.id,
        vehicle: "Direct Dispatch",
        driver: "Warehouse Staff",
      });
      // Retrieve newly created delivery
      setTimeout(() => {
        const store = useERPStore.getState();
        const d = store.deliveries.find(del => del.orderId === o.id);
        if (d) {
          store.confirmDelivery(d.id, {
            deliveredAt: new Date().toISOString(),
            receiverName: receiverName || o.customerName,
            emptyReceived: Number(emptyReceived) || 0,
            notes: deliveryNotes,
          });
        }
      }, 50);
      setShowConfirmModal(false);
      setActionSuccess(`Delivery confirmed! ${emptyReceived} empty cylinder(s) recorded.`);
    }
  };

  const handlePostInvoice = () => {
    postInvoice({ orderId: o.id });
    setActionSuccess(`Tax Invoice posted successfully for Order ${o.num}!`);
  };

  const handleAllocateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedInvoice || !advanceId) return;
    const res = allocateAdvanceToInvoice(advanceId, linkedInvoice.id, advanceAmount);
    if (res.success) {
      setShowAdvanceModal(false);
      setActionSuccess(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || payAmount <= 0) return;
    recordPayment({
      customerId: customer.id,
      amount: payAmount,
      date: new Date().toISOString().split("T")[0],
      method: payMethod as any,
      ref: payRef || undefined,
      remarks: payRemarks || `Payment for Order ${o.num}`,
    });
    setShowPaymentModal(false);
    setPayAmount(0);
    setPayRef("");
    setPayRemarks("");
    setActionSuccess(`Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully for ${o.customerName}.`);
  };

  const sMeta = STATUS_BADGE[o.status] || STATUS_BADGE.confirmed;
  const pMeta = PAYMENT_BADGE[o.paymentStatus || "unpaid"] || PAYMENT_BADGE.unpaid;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1180, margin: "0 auto" }}>
      {/* Alert message if any */}
      {actionSuccess && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 18px", borderRadius: 8, color: "#065f46", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/orders")}
            style={{ width: 38, height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
            <ArrowLeft size={16} color="#64748b" />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0, fontFamily: "monospace" }}>
                {o.num}
              </h1>
              <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: sMeta.bg, color: sMeta.color }}>
                {sMeta.label}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: pMeta.bg, color: pMeta.color }}>
                {pMeta.label}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              Order Placed on <strong style={{ color: "#1e293b" }}>{o.date}</strong> by <span style={{ color: "#0f766e", fontWeight: 600 }}>{o.createdBy}</span>
              {customer?.sap_code && ` • SAP: ${customer.sap_code}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Printer size={14} /> Print Order
          </button>

          {/* Admin Approval */}
          {o.status === "confirmed" && currentUserRole === "admin" && (
            <button onClick={() => { updateOrderStatus(o.id, "approved"); setActionSuccess("Order approved for dispatch."); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}>
              <ShieldCheck size={14} /> Approve Order
            </button>
          )}

          {/* Dispatch */}
          {(o.status === "approved" || o.status === "confirmed") && !linkedDelivery && (
            <button onClick={() => setShowDispatchModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
              <Truck size={14} /> Assign Vehicle & Dispatch
            </button>
          )}

          {/* Confirm Delivery & Collect Empties */}
          {o.status !== "delivered" && (
            <button onClick={() => setShowConfirmModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#059669", color: "#fff", border: "none", cursor: "pointer" }}>
              <RotateCcw size={14} /> Confirm Delivery & Empties
            </button>
          )}

          {/* Generate Invoice */}
          {!linkedInvoice && (
            <button onClick={handlePostInvoice}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#0284c7", color: "#fff", border: "none", cursor: "pointer" }}>
              <FileText size={14} /> Post Tax Invoice
            </button>
          )}

          {/* Settle from Advance */}
          {linkedInvoice && linkedInvoice.status !== "paid" && availableAdvances.length > 0 && (
            <button onClick={() => {
              const firstAdv = availableAdvances[0];
              setAdvanceId(firstAdv.id);
              setAdvanceAmount(Math.min(firstAdv.remainingAdvance, (linkedInvoice.total - (linkedInvoice.paid || 0))));
              setShowAdvanceModal(true);
            }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer" }}>
              <CreditCard size={14} /> Apply Customer Advance
            </button>
          )}

          {/* Record Payment */}
          {linkedInvoice && linkedInvoice.status !== "paid" && (
            <button
              onClick={() => {
                setPayAmount(Math.max(0, o.total - (o.paidAmount || linkedInvoice?.paid || 0)));
                setShowPaymentModal(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#059669", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <DollarSign size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Transaction Lifecycle Timeline */}
      <div style={{ ...card(), padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", marginBottom: 16 }}>
          Order Lifecycle & Document Audit Trail
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {steps.map((st, idx) => (
            <div key={st.key} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : "initial" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 90 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: st.done ? "#059669" : "#f1f5f9",
                  color: st.done ? "#fff" : "#94a3b8",
                  border: st.done ? "2px solid #059669" : "2px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800
                }}>
                  {st.done ? "✓" : idx + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: st.done ? "#1e293b" : "#94a3b8", textAlign: "center" }}>
                  {st.label}
                </span>
                <span style={{ fontSize: 10.5, color: st.done ? "#059669" : "#94a3b8", fontWeight: 600 }}>
                  {st.sub}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ height: 2, background: st.done ? "#059669" : "#e2e8f0", flex: 1, margin: "0 8px 30px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Split: Left (Items + Linked Docs), Right (Customer + Financial Summary) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Products & Rate per KG Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: 13, color: "#1e293b" }}>Ordered Products & Per-KG Breakdown</span>
                <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>Rate per KG = Basic Rate per Unit ÷ Verified Product Reference Weight</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#f1f5f9", color: "#475569" }}>
                18% GST Exclusive
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b" }}>Product</th>
                    <th style={{ padding: "10px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>Qty Ord / Issued</th>
                    <th style={{ padding: "10px 10px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748b" }}>Basic Rate (₹)</th>
                    <th style={{ padding: "10px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748b" }}>Ref Wt (kg)</th>
                    <th style={{ padding: "10px 10px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#0f766e" }}>Rate / KG (₹)</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#1e293b" }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((it, i) => {
                    const refWt = it.referenceWeightKg || (
                      it.productCode.includes("475") || it.productName.includes("47.5") ? 47.5 :
                      it.productCode.includes("425") || it.productName.includes("425") ? 425 : 19
                    );
                    const ratePerKg = it.calculatedRatePerKg || (refWt > 0 ? +(it.unitRate / refWt).toFixed(2) : 0);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{it.productName}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>SKU: {it.productCode}</div>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center" }}>
                          <span style={{ fontWeight: 800, fontSize: 13 }}>{it.qty}</span>
                          <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
                            ({o.qtyIssued !== undefined ? `${o.qtyIssued} issued` : "pending"})
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                          ₹{it.unitRate.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                          {refWt} kg
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right", fontSize: 12.5, fontWeight: 800, color: "#0f766e" }}>
                          ₹{ratePerKg.toFixed(2)}/kg
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 800, color: "#1e3a8a" }}>
                          ₹{it.total.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty Cylinders Received on Delivery */}
          <div style={{ ...card(), padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RotateCcw size={16} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>Empty Cylinders Received on Order</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 100,
                background: (o.emptyReceivedOnOrder || 0) > 0 ? "#ecfdf5" : "#fef3c7",
                color: (o.emptyReceivedOnOrder || 0) > 0 ? "#065f46" : "#92400e"
              }}>
                {(o.emptyReceivedOnOrder || 0)} Cylinders Received
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>
              When filled cylinders are delivered, commercial customers return empty cylinders to maintain the godown rotation.
              Total filled issued on this order: <strong>{o.qtyIssued || o.totalQty}</strong>.
              Empty cylinders returned: <strong>{o.emptyReceivedOnOrder || 0}</strong>.
            </p>
            {linkedExchange && (
              <div style={{ marginTop: 10, fontSize: 11.5, color: "#047857", fontWeight: 600 }}>
                ✓ Recorded on Cylinder Exchange Voucher #{linkedExchange.exchangeNum || linkedExchange.num} on {linkedExchange.returnDate || linkedExchange.deliveryDate || linkedExchange.date}
              </div>
            )}
          </div>

          {/* Linked Business Documents Panel */}
          <div style={{ ...card(), padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", marginBottom: 12 }}>
              Linked Transaction Documents (Single Order ID Reference)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {/* Order ID */}
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Master Order ID</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace", marginTop: 4 }}>{o.num}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Order Date: {o.date}</div>
              </div>

              {/* Delivery Document */}
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Dispatch / Delivery</div>
                {linkedDelivery ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f766e", fontFamily: "monospace", marginTop: 4 }}>{linkedDelivery.num}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{linkedDelivery.vehicle || "Assigned"} • {linkedDelivery.driver}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>Not dispatched yet</div>
                )}
              </div>

              {/* Invoice Document */}
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Tax Invoice</div>
                {linkedInvoice ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", fontFamily: "monospace", marginTop: 4 }}>{linkedInvoice.num}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{INR(linkedInvoice.total)} • Status: {linkedInvoice.status}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>No invoice posted</div>
                )}
              </div>

              {/* Cylinder Exchange / Return */}
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Cylinder Exchange</div>
                {linkedExchange ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#7c3aed", fontFamily: "monospace", marginTop: 4 }}>{linkedExchange.exchangeNum || linkedExchange.num}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{linkedExchange.emptyReceived} empties returned</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>Linked to delivery</div>
                )}
              </div>
            </div>
          </div>

          {/* Gate Remarks */}
          {o.remarks && (
            <div style={{ ...card(), padding: "14px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 4 }}>
                Delivery Instructions & Remarks
              </div>
              <div style={{ fontSize: 13, color: "#1e293b" }}>{o.remarks}</div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer Profile & Financial Position */}
          <div style={{ ...card(), padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", marginBottom: 12 }}>
              Customer Account & Financial Limits
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{o.customerName}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: "#1e3a8a", fontWeight: 700, fontFamily: "monospace", background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                Code: {o.customerCode}
              </span>
              {customer?.sap_code && (
                <span style={{ fontSize: 11.5, color: "#0f766e", fontWeight: 700, fontFamily: "monospace", background: "#f0fdfa", padding: "2px 8px", borderRadius: 4 }}>
                  SAP: {customer.sap_code}
                </span>
              )}
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                {customer?.category || "Commercial"}
              </span>
            </div>

            <div style={{ height: 1, background: "#e2e8f0", margin: "14px 0" }} />

            {/* Financial Status Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Prepaid Advance Balance:</span>
                <strong style={{ color: "#059669" }}>
                  {INR(customer?.advance_balance || 0)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Authorized Credit Limit:</span>
                <strong>{INR(customer?.credit_limit || 0)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Current Outstanding:</span>
                <strong style={{ color: (customer?.outstanding_balance || 0) > 0 ? "#dc2626" : "#1e293b" }}>
                  {INR(customer?.outstanding_balance || 0)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Net Available Credit:</span>
                <strong style={{ color: ((customer?.credit_limit || 0) - (customer?.outstanding_balance || 0)) >= 0 ? "#1e3a8a" : "#dc2626" }}>
                  {INR(Math.max(0, (customer?.credit_limit || 0) - (customer?.outstanding_balance || 0)))}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Pending Empties with Customer:</span>
                <strong style={{ color: (customer?.empty_cylinders_pending || 0) > 0 ? "#d97706" : "#059669" }}>
                  {customer?.empty_cylinders_pending || 0} cylinders
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Link href={`/customers/${customer?.id || o.customerId}`} style={{ fontSize: 12, fontWeight: 700, color: "#f97316", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Open Full Customer Master Profile <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Financial Order Calculation */}
          <div style={{ ...card(), padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", marginBottom: 14 }}>
              Order Financial Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Quantity Ordered:</span>
                <strong>{o.totalQty} cylinders / units</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Taxable Subtotal:</span>
                <span>₹{o.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Statutory GST (18%):</span>
                <span style={{ color: "#f97316", fontWeight: 700 }}>₹{o.taxAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}>
                <span>Final Bill Amount:</span>
                <span>₹{o.total.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Paid / Allocated:</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  ₹{(o.paidAmount || (linkedInvoice?.paid) || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Balance Pending:</span>
                <span style={{ color: "#dc2626", fontWeight: 800 }}>
                  ₹{Math.max(0, o.total - (o.paidAmount || (linkedInvoice?.paid) || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Advance Allocations list if any */}
            {linkedAllocations.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
                  Advance Payment Applied
                </div>
                {linkedAllocations.map(al => (
                  <div key={al.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: "#7c3aed", fontWeight: 600 }}>{al.advanceReceiptNum || al.advanceNum}</span>
                    <strong style={{ color: "#059669" }}>-₹{al.allocatedAmount.toLocaleString("en-IN")}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>Assign Vehicle & Dispatch Order #{o.num}</h3>
            <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Vehicle Registration Number</label>
                <input type="text" required value={vehicle} onChange={e => setVehicle(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Driver / Delivery Executive Name</label>
                <input type="text" required value={driver} onChange={e => setDriver(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowDispatchModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Confirmation & Empties Modal */}
      {showConfirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
              Confirm Delivery & Empty Cylinders Return
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "-6px 0 16px" }}>
              Record cylinder handover and empty cylinder collection for Order #{o.num}.
            </p>
            <form onSubmit={handleConfirmDelivery} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Delivered Quantity (Filled Cylinders)</label>
                <input type="number" readOnly value={o.totalQty} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 4 }}>
                  Empty Cylinders Collected / Returned from Customer
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={emptyReceived}
                  onChange={e => setEmptyReceived(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: "100%", border: "2px solid #059669", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#065f46" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                  These empties will be returned to warehouse inventory and credited to customer's cylinder account.
                </span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Receiver Name / Authorized Person</label>
                <input type="text" required value={receiverName} onChange={e => setReceiverName(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Delivery Notes / Pod Remarks</label>
                <input type="text" value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder="e.g. Received in good condition" style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowConfirmModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Confirm Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Advance Allocation Modal */}
      {showAdvanceModal && linkedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>Apply Prepaid Advance to Invoice</h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 16px" }}>
              Allocate available customer advance balance to Tax Invoice #{linkedInvoice.num}.
            </p>
            <form onSubmit={handleAllocateAdvance} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Select Advance Voucher</label>
                <select
                  value={advanceId}
                  onChange={e => {
                    setAdvanceId(e.target.value);
                    const selected = availableAdvances.find(a => a.id === e.target.value);
                    if (selected) {
                      setAdvanceAmount(Math.min(selected.remainingAdvance, (linkedInvoice.total - (linkedInvoice.paid || 0))));
                    }
                  }}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                >
                  {availableAdvances.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.advanceReceiptNum || a.advanceNum} — Available: {INR(a.remainingAdvance)} (Received {a.receiptDate || a.date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Amount to Allocate (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Math.min(
                    availableAdvances.find(a => a.id === advanceId)?.remainingAdvance || 0,
                    (linkedInvoice.total - (linkedInvoice.paid || 0))
                  )}
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(Number(e.target.value) || 0)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                  Invoice Outstanding: {INR(linkedInvoice.total - (linkedInvoice.paid || 0))}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowAdvanceModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Allocate Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>Record Payment</h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 16px" }}>
              Customer: <strong>{o.customerName}</strong> · Order: <strong>{o.num}</strong>
              {linkedInvoice && <> · Invoice: <strong>{linkedInvoice.num}</strong></>}
            </p>
            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Amount Received (₹) *</label>
                <input
                  type="number" required min="1" value={payAmount || ""}
                  onChange={e => setPayAmount(Number(e.target.value) || 0)}
                  style={{ width: "100%", border: "2px solid #059669", borderRadius: 8, padding: "9px 12px", fontSize: 15, fontWeight: 800, outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  Balance due: ₹{Math.max(0, o.total - (o.paidAmount || linkedInvoice?.paid || 0)).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Payment Method *</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  {payMethod === "Cash" ? "Received By" : payMethod === "Cheque" ? "Cheque / DD Number" : "UTR / Reference Number"}
                </label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                  placeholder={payMethod === "Cash" ? "Staff member name" : "Transaction reference number"}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Remarks (Optional)</label>
                <input type="text" value={payRemarks} onChange={e => setPayRemarks(e.target.value)}
                  placeholder={`Payment for Order ${o.num}`}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
