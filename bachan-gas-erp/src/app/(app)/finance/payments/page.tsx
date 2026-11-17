"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard, Plus, Search, Download, CheckCircle2, Calendar,
  FileText, ArrowDownLeft, X, Printer, Shield, Clock, AlertTriangle, Check
} from "lucide-react";
import { useERPStore, PaymentReceipt, PaymentMethod, ChequeStatus } from "@/lib/store";

const cardStyle = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  ...s,
});

export default function PaymentsPage() {
  const {
    payments,
    customers,
    currentUserRole,
    currentSessionUser,
    recordStructuredPayment,
    updateChequeStatus,
  } = useERPStore();

  const isAdmin = currentUserRole === "admin";
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);

  // Form state
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [remarks, setRemarks] = useState("");

  // Conditional fields
  const [upiUtr, setUpiUtr] = useState("");
  const [upiProvider, setUpiProvider] = useState("Google Pay / PhonePe");

  const [bankName, setBankName] = useState("HDFC Bank");
  const [bankUtr, setBankUtr] = useState("");
  const [bankDate, setBankDate] = useState(new Date().toISOString().split("T")[0]);

  const [chequeNum, setChequeNum] = useState("");
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split("T")[0]);
  const [chequeBank, setChequeBank] = useState("State Bank of India");

  const [otherDesc, setOtherDesc] = useState("");
  const [otherRef, setOtherRef] = useState("");

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustId) || customers[0];

  const totalCleared = payments.filter(p => p.status === "cleared").reduce((s, p) => s + p.amount, 0);
  const pendingCheques = payments.filter(p => p.method === "Cheque" && p.status === "pending");
  const totalPendingCheques = pendingCheques.reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.customerName.toLowerCase().includes(q) ||
      p.num.toLowerCase().includes(q) ||
      (p.receiptNum && p.receiptNum.toLowerCase().includes(q)) ||
      p.customerCode.toLowerCase().includes(q) ||
      (p.ref && p.ref.toLowerCase().includes(q))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMsg({ type: "error", text: "Please enter a valid payment amount." });
      return;
    }
    if (!selectedCustomer) {
      setMsg({ type: "error", text: "Please select a valid customer account." });
      return;
    }

    try {
      const receipt = recordStructuredPayment({
        customerId: selectedCustomer.id,
        amount: amt,
        date: payDate,
        method,
        ref:
          method === "UPI"
            ? upiUtr
            : method === "Bank Transfer"
            ? bankUtr
            : method === "Cheque"
            ? chequeNum
            : method === "Other"
            ? otherRef
            : undefined,
        remarks: remarks.trim() || undefined,
        receivedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
        upiDetails:
          method === "UPI"
            ? { utrRef: upiUtr.trim(), provider: upiProvider }
            : undefined,
        bankDetails:
          method === "Bank Transfer"
            ? { bankName: bankName.trim(), utrRef: bankUtr.trim(), transferDate: bankDate }
            : undefined,
        chequeDetails:
          method === "Cheque"
            ? {
                chequeNum: chequeNum.trim(),
                chequeDate,
                bankName: chequeBank.trim(),
                status: "received",
              }
            : undefined,
        otherDetails:
          method === "Other"
            ? { description: otherDesc.trim(), refNum: otherRef.trim() || undefined }
            : undefined,
      });

      setMsg({
        type: "success",
        text: `Payment Receipt ${receipt.receiptNum} recorded successfully!`,
      });
      setAmount("");
      setRemarks("");
      setUpiUtr("");
      setBankUtr("");
      setChequeNum("");
      setOtherDesc("");
      setOtherRef("");
      setShowForm(false);
      setActiveReceiptModal(receipt);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to record payment receipt." });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Receipt Number",
      "Payment ID",
      "Date",
      "Customer Code",
      "Customer Name",
      "Amount",
      "Payment Method",
      "Status",
      "Reference",
      "Recorded By",
    ];

    const rows = filtered.map(p => [
      p.receiptNum || p.num,
      p.num,
      p.date,
      p.customerCode,
      `"${p.customerName.replace(/"/g, '""')}"`,
      p.amount,
      p.method,
      p.status,
      `"${(p.ref || "").replace(/"/g, '""')}"`,
      `"${(p.receivedBy || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_Payment_Receipts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Payment Receipts & Settlements
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
              Distributor Code: 0000110351
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
            Cash, UPI, Bank Transfer, and Cheque payment management with conditional settlement fields
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 14px", borderRadius: 8,
              background: "#ffffff", border: "1.5px solid #cbd5e1",
              color: "#334155", fontSize: 12.5, fontWeight: 700, cursor: "pointer"
            }}
          >
            <Download size={15} />
            Export Receipts
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: "#ea580c", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 2px 6px rgba(234,88,12,0.3)"
            }}
          >
            <Plus size={16} />
            Record Payment Receipt
          </button>
        </div>
      </div>

      {/* ── SUMMARY KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <div style={{ ...cardStyle(), padding: 18, borderLeft: "4px solid #16a34a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Total Cleared Receipts</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            ₹{totalCleared.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>
            {payments.filter(p => p.status === "cleared").length} settled payments
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 18, borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Cheques Pending Clearing</span>
            <Clock size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#b45309", marginTop: 8 }}>
            ₹{totalPendingCheques.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {pendingCheques.length} uncleared cheques (Balance deferred until cleared)
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 18, borderLeft: "4px solid #0284c7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Total Payment Records</span>
            <CreditCard size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {payments.length}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Across Cash, UPI, RTGS/NEFT & Cheque
          </div>
        </div>
      </div>

      {/* ── SETTLEMENT NOTICE BANNER ── */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #bae6fd",
          background: "#f0f9ff",
          color: "#0369a1",
          fontSize: 12.5,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          lineHeight: 1.5,
        }}
      >
        <Shield size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Financial Settlement Rule:</strong> Payments received via Cheque remain in &quot;Pending&quot; status and do not reduce the customer&apos;s outstanding balance until an Administrator marks them &quot;Cleared&quot;. This maintains strict ledger integrity.
        </div>
      </div>

      {/* ── FILTER & SEARCH ── */}
      <div style={{ ...cardStyle(), padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", minWidth: 280, flex: 1, maxWidth: 440 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center" }}>
            <Search size={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt #, customer name, code, or UTR/cheque #..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px 8px 36px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              fontSize: 12.5,
              background: "#f8fafc",
              color: "#0f172a",
              outline: "none",
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          Showing <strong>{filtered.length}</strong> payment receipts
        </span>
      </div>

      {/* ── PAYMENTS TABLE ── */}
      <div style={{ ...cardStyle(), overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", fontSize: 12.5, color: "#64748b" }}>
            No payment receipts match your search. Click &quot;Record Payment Receipt&quot; to issue a new receipt.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Receipt #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Customer Name & Code</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Amount (₹)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Method</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Reference / Details</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pay) => (
                  <tr key={pay.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                      {pay.receiptNum || pay.num}
                    </td>

                    <td style={{ padding: "14px 16px", color: "#475569" }}>{pay.date}</td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{pay.customerName}</div>
                      <span style={{ fontSize: 10.5, fontFamily: "monospace", color: "#64748b" }}>{pay.customerCode}</span>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <span style={{ fontWeight: 900, color: "#0f172a", fontSize: 13.5 }}>
                        ₹{pay.amount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11, background: "#f1f5f9", color: "#334155" }}>
                        {pay.method}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", fontSize: 11.5, color: "#475569" }}>
                      {pay.method === "Cheque" && pay.chequeDetails ? (
                        <div>
                          <div style={{ fontWeight: 700 }}>Cheque #{pay.chequeDetails.chequeNum}</div>
                          <span style={{ color: "#94a3b8" }}>{pay.chequeDetails.bankName}</span>
                        </div>
                      ) : (
                        <span>{pay.ref || "—"}</span>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      {pay.status === "cleared" ? (
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                          Cleared
                        </span>
                      ) : pay.status === "pending" ? (
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                          Pending Clearing
                        </span>
                      ) : (
                        <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
                          Bounced
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => setActiveReceiptModal(pay)}
                          style={{
                            padding: "6px 12px", borderRadius: 6, border: "1.5px solid #cbd5e1",
                            background: "#ffffff", color: "#334155", fontSize: 11.5, fontWeight: 700,
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                          }}
                        >
                          <Printer size={13} />
                          Receipt
                        </button>

                        {/* Cheque Clearing button for Admin */}
                        {isAdmin && pay.method === "Cheque" && pay.status === "pending" && (
                          <button
                            onClick={() => updateChequeStatus(pay.id, "cleared", currentSessionUser?.fullName || "Bachan Admin")}
                            style={{
                              padding: "6px 12px", borderRadius: 6, border: "none",
                              background: "#16a34a", color: "#ffffff", fontSize: 11.5, fontWeight: 700,
                              cursor: "pointer", boxShadow: "0 1px 4px rgba(22,163,74,0.3)"
                            }}
                          >
                            Mark Cleared
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RECORD PAYMENT MODAL ── */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
          }}
        >
          <div
            style={{
              background: "#ffffff", borderRadius: 16, maxWidth: 520, width: "100%",
              padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 14,
              maxHeight: "90vh", overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Record Payment Receipt</h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>Bachan Gas Service (Distributor Code: 0000110351)</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {msg && (
              <div
                style={{
                  padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
                  border: msg.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                  color: msg.type === "success" ? "#166534" : "#991b1b"
                }}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Customer Selection */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Select Customer Account *
                </label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}){c.outstanding !== null ? ` — Outstanding: ₹${c.outstanding.toLocaleString("en-IN")}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                    Payment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Payment Method *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 6 }}>
                  {(["Cash", "UPI", "Bank Transfer", "Cheque", "Other"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: method === m ? "none" : "1px solid #cbd5e1",
                        background: method === m ? "#ea580c" : "#f8fafc",
                        color: method === m ? "#ffffff" : "#475569",
                        boxShadow: method === m ? "0 2px 6px rgba(234,88,12,0.3)" : "none",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields */}
              {method === "Cash" && (
                <div style={{ padding: 12, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 12 }}>
                  Cash payment received physically at counter / godown. No electronic UTR required.
                </div>
              )}

              {method === "UPI" && (
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#ea580c" }}>UPI Payment Details</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>UTR / Transaction ID *</label>
                      <input
                        type="text"
                        required
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        placeholder="e.g. 412988371902"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>UPI Provider / App</label>
                      <select
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      >
                        <option value="Google Pay">Google Pay</option>
                        <option value="PhonePe">PhonePe</option>
                        <option value="Paytm">Paytm</option>
                        <option value="BHIM UPI">BHIM UPI</option>
                        <option value="Direct Bank UPI">Direct Bank UPI</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {method === "Bank Transfer" && (
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#ea580c" }}>NEFT / RTGS Transfer Details</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>UTR Reference Number *</label>
                      <input
                        type="text"
                        required
                        value={bankUtr}
                        onChange={(e) => setBankUtr(e.target.value)}
                        placeholder="e.g. HDFCR520261117"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === "Cheque" && (
                <div style={{ padding: 14, borderRadius: 10, border: "1px solid #fed7aa", background: "#fffaf5", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#c2410c" }}>Cheque Details (Pending Clearing)</span>
                    <span style={{ fontSize: 10, color: "#b45309", fontWeight: 700, background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>
                      Balance deferred until cleared
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Cheque # *</label>
                      <input
                        type="text"
                        required
                        value={chequeNum}
                        onChange={(e) => setChequeNum(e.target.value)}
                        placeholder="004812"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12, fontFamily: "monospace" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Date *</label>
                      <input
                        type="date"
                        required
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Drawee Bank *</label>
                      <input
                        type="text"
                        required
                        value={chequeBank}
                        onChange={(e) => setChequeBank(e.target.value)}
                        placeholder="SBI / PNB"
                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Supporting Remarks / Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared bill for October delivery supply..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12.5 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#ea580c", color: "#ffffff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(234,88,12,0.3)" }}
                >
                  Generate Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINTABLE PAYMENT RECEIPT MODAL ── */}
      {activeReceiptModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
          }}
        >
          <div
            style={{
              background: "#ffffff", borderRadius: 16, maxWidth: 560, width: "100%",
              padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 16
            }}
          >
            {/* Action Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.06em" }}>
                Official Commercial Payment Receipt
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 6, background: "#0f172a",
                    color: "#ffffff", fontSize: 11.5, fontWeight: 700, border: "none", cursor: "pointer"
                  }}
                >
                  <Printer size={14} />
                  Print Receipt
                </button>
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Card */}
            <div style={{ border: "1.5px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "1.5px solid #cbd5e1", paddingBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", textTransform: "uppercase", margin: 0, letterSpacing: "-0.3px" }}>
                  Bachan Gas Service
                </h2>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "#ea580c", margin: "2px 0 0 0" }}>
                  Authorized Commercial LPG Distributor · Indian Oil Corporation Limited
                </p>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  IOCL Distributor Code: <strong style={{ color: "#0f172a" }}>0000110351</strong> · Ludhiana, Punjab
                </div>
              </div>

              {/* Receipt Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Receipt Number</span>
                  <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 900, color: "#0f172a" }}>
                    {activeReceiptModal.receiptNum || activeReceiptModal.num}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Receipt Date</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{activeReceiptModal.date}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div style={{ background: "#ffffff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", fontWeight: 800 }}>Received With Thanks From:</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{activeReceiptModal.customerName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                  Consumer ID: <span style={{ fontFamily: "monospace" }}>{activeReceiptModal.customerCode}</span>
                </div>
              </div>

              {/* Amount and Method */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#ffffff", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", fontWeight: 800 }}>Amount Received</span>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a", marginTop: 2 }}>
                    ₹{activeReceiptModal.amount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", fontWeight: 800 }}>Payment Mode</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{activeReceiptModal.method}</div>
                  <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "#64748b", marginTop: 1 }}>
                    {activeReceiptModal.ref || "Direct Settlement"}
                  </div>
                </div>
              </div>

              {/* Cheque Details if applicable */}
              {activeReceiptModal.chequeDetails && (
                <div style={{ background: "#fffbeb", padding: 10, borderRadius: 8, border: "1px solid #fed7aa", fontSize: 11, color: "#92400e" }}>
                  <div>Cheque #: <strong>{activeReceiptModal.chequeDetails.chequeNum}</strong> · Date: {activeReceiptModal.chequeDetails.chequeDate}</div>
                  <div>Drawee Bank: {activeReceiptModal.chequeDetails.bankName}</div>
                  <div style={{ fontWeight: 800, marginTop: 2 }}>Status: {activeReceiptModal.chequeDetails.status.toUpperCase()}</div>
                </div>
              )}

              {/* Footer Signatures */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 14, borderTop: "1px solid #cbd5e1", fontSize: 11 }}>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Received By:</span>
                  <strong style={{ color: "#0f172a" }}>{activeReceiptModal.receivedBy}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ height: 28, borderBottom: "1px dashed #94a3b8", width: 140, marginBottom: 4 }} />
                  <span style={{ fontSize: 10, color: "#64748b", display: "block" }}>Authorized Signature & Stamp</span>
                  <strong style={{ fontSize: 10.5, color: "#0f172a" }}>For Bachan Gas Service</strong>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => setActiveReceiptModal(null)}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                  background: "#ffffff", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
