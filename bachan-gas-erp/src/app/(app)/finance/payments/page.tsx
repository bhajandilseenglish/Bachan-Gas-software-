"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard, Plus, Search, Download, CheckCircle2, Calendar,
  FileText, ArrowDownLeft, X, Printer, Shield, Clock, AlertTriangle, Check
} from "lucide-react";
import { useERPStore, PaymentReceipt, PaymentMethod, ChequeStatus } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,.06)",
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
            : otherRef || undefined,
        remarks: remarks || undefined,
        receivedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
        upiDetails: method === "UPI" ? { utrRef: upiUtr, provider: upiProvider } : undefined,
        bankDetails: method === "Bank Transfer" ? { utrRef: bankUtr, bankName, transferDate: bankDate } : undefined,
        chequeDetails:
          method === "Cheque"
            ? {
                chequeNum,
                chequeDate,
                bankName: chequeBank,
                status: "received",
              }
            : undefined,
        otherDetails: method === "Other" ? { description: otherDesc, refNum: otherRef } : undefined,
      });

      setMsg({
        type: "success",
        text: `Receipt ${receipt.receiptNum || receipt.num} recorded successfully!`,
      });
      setAmount("");
      setUpiUtr("");
      setBankUtr("");
      setChequeNum("");
      setRemarks("");

      setTimeout(() => {
        setShowForm(false);
        setMsg(null);
        setActiveReceiptModal(receipt);
      }, 800);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to record payment." });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Receipt #",
      "Customer Name",
      "Customer Code",
      "Date",
      "Amount (₹)",
      "Method",
      "Reference / Cheque #",
      "Status",
      "Received By",
    ];
    const rows = filtered.map(p => [
      p.receiptNum || p.num,
      `"${p.customerName}"`,
      p.customerCode,
      p.date,
      p.amount,
      p.method,
      `"${p.ref || "—"}"`,
      p.status,
      `"${p.receivedBy}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BGS_Receipts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Receipts & Settlements</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Distributor Code: 0000110351
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Cash, UPI, Bank Transfer, and Cheque payment management with conditional fields and settlement rules
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Receipts
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Payment Receipt
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Cleared Receipts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{totalCleared.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {payments.filter(p => p.status === "cleared").length} settled payments
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cheques Pending Clearing</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            ₹{totalPendingCheques.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pendingCheques.length} uncleared cheques (Balance not reduced until cleared)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Payment Records</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {payments.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across Cash, UPI, RTGS/NEFT & Cheque
          </span>
        </div>
      </div>

      {/* Cheque Clearing Settlement Notice */}
      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-xs text-blue-900 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Financial Settlement Rule:</strong> Payments received via Cheque remain in &quot;Pending&quot; status and do not reduce the customer&apos;s outstanding balance until an Administrator marks them &quot;Cleared&quot;. This maintains strict ledger integrity.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt #, customer name, code, or UTR/cheque #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> payment receipts
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No payment receipts match your search. Click &quot;Record Payment Receipt&quot; to issue a new receipt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name & Code</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Reference / Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {pay.receiptNum || pay.num}
                    </td>

                    <td className="py-3 px-4 text-slate-600">{pay.date}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pay.customerName}</div>
                      <span className="text-[10px] font-mono text-slate-500">{pay.customerCode}</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-extrabold text-sm text-slate-900">
                        ₹{pay.amount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-700">
                        {pay.method}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {pay.method === "Cheque" && pay.chequeDetails ? (
                        <div>
                          <div>Cheque #{pay.chequeDetails.chequeNum}</div>
                          <span className="text-slate-400">{pay.chequeDetails.bankName}</span>
                        </div>
                      ) : (
                        <span>{pay.ref || "—"}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {pay.status === "cleared" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Cleared
                        </span>
                      ) : pay.status === "pending" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Clearing
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                          Bounced
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveReceiptModal(pay)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          View Receipt
                        </button>

                        {/* Cheque Clearing button for Admin */}
                        {isAdmin && pay.method === "Cheque" && pay.status === "pending" && (
                          <button
                            onClick={() => updateChequeStatus(pay.id, "cleared", currentSessionUser?.fullName || "Bachan Admin")}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm"
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

      {/* RECORD PAYMENT MODAL (CONDITIONAL FORM) */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Payment Receipt</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bachan Gas Service (Distributor Code: 0000110351)</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer Account *</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}){c.outstanding !== null ? ` — Outstanding: ₹${c.outstanding.toLocaleString("en-IN")}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full p-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(["Cash", "UPI", "Bank Transfer", "Cheque", "Other"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        method === m
                          ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONDITIONAL FIELDS BASED ON METHOD */}
              {/* 1. Cash */}
              {method === "Cash" && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  Cash payment received physically at office / godown counter. No electronic UTR required.
                </div>
              )}

              {/* 2. UPI */}
              {method === "UPI" && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="text-[11px] font-bold uppercase text-slate-500">UPI Payment Details</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Transaction ID *</label>
                      <input
                        type="text"
                        required
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        placeholder="e.g. 412988371902"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">UPI Provider / App</label>
                      <select
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
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

              {/* 3. Bank Transfer */}
              {method === "Bank Transfer" && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="text-[11px] font-bold uppercase text-slate-500">NEFT / RTGS Transfer Details</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank / ICICI"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">UTR Reference Number *</label>
                      <input
                        type="text"
                        required
                        value={bankUtr}
                        onChange={(e) => setBankUtr(e.target.value)}
                        placeholder="e.g. HDFCR520261117"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Cheque */}
              {method === "Cheque" && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-amber-900">Cheque Details (Pending Clearing)</span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                      Balance deferred until cleared
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Number *</label>
                      <input
                        type="text"
                        required
                        value={chequeNum}
                        onChange={(e) => setChequeNum(e.target.value)}
                        placeholder="e.g. 004812"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Date *</label>
                      <input
                        type="date"
                        required
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Drawee Bank *</label>
                      <input
                        type="text"
                        required
                        value={chequeBank}
                        onChange={(e) => setChequeBank(e.target.value)}
                        placeholder="e.g. SBI / PNB"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Other */}
              {method === "Other" && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="text-[11px] font-bold uppercase text-slate-500">Other Settlement Method</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                      <input
                        type="text"
                        required
                        value={otherDesc}
                        onChange={(e) => setOtherDesc(e.target.value)}
                        placeholder="e.g. Credit Note Adjustment"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number</label>
                      <input
                        type="text"
                        value={otherRef}
                        onChange={(e) => setOtherRef(e.target.value)}
                        placeholder="e.g. CN-0021"
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Remarks / Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared bill for October delivery supply..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Generate Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE PAYMENT RECEIPT MODAL */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Commercial Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  className="text-slate-400 font-bold hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Card */}
            <div className="border border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-5 text-slate-900 text-xs">
              {/* Distributor Header */}
              <div className="text-center pb-4 border-b border-slate-300">
                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                  Bachan Gas Service
                </h2>
                <p className="text-xs text-orange-600 font-bold mt-0.5">
                  Authorized Commercial LPG Distributor · Indian Oil Corporation Limited
                </p>
                <div className="mt-1 text-[11px] text-slate-600">
                  IOCL Distributor Code: <strong className="text-slate-900">0000110351</strong> · Ludhiana, Punjab
                </div>
              </div>

              {/* Receipt Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Receipt Number</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {activeReceiptModal.receiptNum || activeReceiptModal.num}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase">Receipt Date</span>
                  <span className="font-bold text-slate-900">{activeReceiptModal.date}</span>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Received With Thanks From:
                </span>
                <div className="text-sm font-bold text-slate-900 mt-1">{activeReceiptModal.customerName}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Consumer ID: <span className="font-mono">{activeReceiptModal.customerCode}</span>
                </div>
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-white border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Amount Received
                  </span>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    ₹{activeReceiptModal.amount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Mode
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">{activeReceiptModal.method}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {activeReceiptModal.ref || "Direct Settlement"}
                  </div>
                </div>
              </div>

              {/* Cheque Info if applicable */}
              {activeReceiptModal.chequeDetails && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <div>
                    Cheque Number: <strong>#{activeReceiptModal.chequeDetails.chequeNum}</strong> · Date: {activeReceiptModal.chequeDetails.chequeDate}
                  </div>
                  <div>Drawee Bank: {activeReceiptModal.chequeDetails.bankName}</div>
                  <div className="font-semibold text-amber-800 mt-1">
                    Status: {activeReceiptModal.chequeDetails.status.toUpperCase()}
                  </div>
                </div>
              )}

              {/* Footer Signatures */}
              <div className="pt-6 border-t border-slate-300 flex items-end justify-between text-[11px]">
                <div>
                  <span className="text-slate-500 block">Received By:</span>
                  <span className="font-semibold text-slate-900">{activeReceiptModal.receivedBy}</span>
                </div>
                <div className="text-right">
                  <div className="h-8 border-b border-dashed border-slate-400 w-36 mb-1"></div>
                  <span className="text-[10px] text-slate-500 block">Authorized Signature & Stamp</span>
                  <span className="font-semibold text-[10px] text-slate-800">For Bachan Gas Service</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-1.5 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50"
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
