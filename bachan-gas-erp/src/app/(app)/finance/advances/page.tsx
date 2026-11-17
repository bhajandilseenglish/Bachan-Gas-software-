"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wallet, Search, Plus, Download, CheckCircle2, AlertCircle,
  Calendar, FileText, ArrowRight, User, RefreshCw, X, CreditCard,
  Building2, ChevronRight, ShieldCheck, DollarSign
} from "lucide-react";
import { useERPStore, CustomerAdvance, AdvanceAllocation } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function CustomerAdvancesPage() {
  const {
    customers,
    invoices,
    customerAdvances,
    advanceAllocations,
    recordCustomerAdvance,
    allocateAdvanceToInvoice,
    currentUserRole
  } = useERPStore();

  const [activeTab, setActiveTab] = useState<"advances" | "allocations">("advances");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "consumed">("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Record Advance Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || "");
  const [advAmount, setAdvAmount] = useState<number>(50000);
  const [paymentMode, setPaymentMode] = useState<"Bank Transfer" | "Cheque" | "UPI" | "Cash">("Bank Transfer");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Allocate Modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocAdvanceId, setAllocAdvanceId] = useState("");
  const [allocInvoiceId, setAllocInvoiceId] = useState("");
  const [allocAmount, setAllocAmount] = useState<number>(0);

  // Filtered Advances
  const filteredAdvances = useMemo(() => {
    return customerAdvances.filter(a => {
      const advNum = a.advanceReceiptNum || a.advanceNum || "";
      const advRef = a.referenceNum || a.reference || "";
      const matchSearch =
        !search ||
        advNum.toLowerCase().includes(search.toLowerCase()) ||
        a.customerName.toLowerCase().includes(search.toLowerCase()) ||
        a.customerCode.toLowerCase().includes(search.toLowerCase()) ||
        advRef.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" ? true :
        statusFilter === "active" ? a.status !== "fully_applied" :
        a.status === "fully_applied";

      const matchCustomer = customerFilter === "all" || a.customerId === customerFilter;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [customerAdvances, search, statusFilter, customerFilter]);

  // Overall KPIs
  const totalAdvancesReceived = customerAdvances.reduce((s, a) => s + (a.amountReceived || a.amount || 0), 0);
  const totalAdvancesAllocated = customerAdvances.reduce((s, a) => s + (a.amountApplied || a.allocatedAmount || 0), 0);
  const totalAdvanceCarriedForward = customerAdvances.reduce((s, a) => s + a.remainingAdvance, 0);
  const customersWithAdvance = customers.filter(c => (c.advance_balance || 0) > 0);

  // Handle Recording New Advance
  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId || advAmount <= 0) return;

    const res = recordCustomerAdvance({
      customerId: selectedCustId,
      amount: advAmount,
      date: new Date().toISOString().split("T")[0],
      paymentMode,
      reference,
      remarks,
    });

    if (res.success || res.id) {
      setShowRecordModal(false);
      setSuccessMsg(`Advance voucher ${res.advanceReceiptNum || res.advanceNum} of ${INR(advAmount)} successfully recorded! Available prepaid balance carried forward.`);
      setAdvAmount(50000);
      setReference("");
      setRemarks("");
    } else {
      alert(res.message);
    }
  };

  // Open Allocation Modal for a specific advance
  const handleOpenAllocate = (advance: CustomerAdvance) => {
    setAllocAdvanceId(advance.id);
    // Find open invoices for this customer
    const openInvs = invoices.filter(
      inv => (inv.customerId === advance.customerId || inv.customerCode === advance.customerCode) &&
             inv.status !== "paid"
    );
    if (openInvs.length > 0) {
      setAllocInvoiceId(openInvs[0].id);
      const invoiceOutstanding = openInvs[0].total - (openInvs[0].paid || 0);
      setAllocAmount(Math.min(advance.remainingAdvance, invoiceOutstanding));
    } else {
      setAllocInvoiceId("");
      setAllocAmount(0);
    }
    setShowAllocateModal(true);
  };

  // Execute Allocation
  const handleExecuteAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocAdvanceId || !allocInvoiceId || allocAmount <= 0) return;

    const res = allocateAdvanceToInvoice(allocAdvanceId, allocInvoiceId, allocAmount);
    if (res.success || res.id) {
      setShowAllocateModal(false);
      setSuccessMsg(res.message || "Advance allocated to invoice successfully.");
    } else {
      alert(res.message);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Advance Voucher", "Date", "Customer Code", "Customer Name", "Total Amount (INR)", "Allocated (INR)", "Remaining Carried Forward (INR)", "Payment Mode", "Reference", "Status"];
    const rows = filteredAdvances.map(a => [
      a.advanceReceiptNum || a.advanceNum,
      a.receiptDate || a.date,
      a.customerCode,
      `"${a.customerName}"`,
      a.amountReceived || a.amount,
      a.amountApplied || a.allocatedAmount || 0,
      a.remainingAdvance,
      `"${a.paymentMethod || a.paymentMode}"`,
      `"${a.referenceNum || a.reference || ""}"`,
      a.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BGS_Customer_Advances_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedAdvObj = customerAdvances.find(a => a.id === allocAdvanceId);
  const eligibleInvoicesForAlloc = invoices.filter(
    inv => selectedAdvObj &&
           (inv.customerId === selectedAdvObj.customerId || inv.customerCode === selectedAdvObj.customerCode) &&
           inv.status !== "paid"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Alert message if any */}
      {successMsg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 18px", borderRadius: 8, color: "#065f46", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-.3px" }}>
              Customer Prepaid Advances & Carry-Forward
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#ecfdf5", color: "#065f46" }}>
              Commercial LPG
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Prepaid balances are maintained independently from credit limits and carried forward continuously across billing periods.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff",
              color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowRecordModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#059669",
              color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 1px 2px rgba(5,150,105,.2)"
            }}
          >
            <Plus size={15} /> Record Customer Advance
          </button>
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div style={{ ...card(), padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
              Total Advances Received
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={16} color="#1d4ed8" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginTop: 8 }}>
            {INR(totalAdvancesReceived)}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            {customerAdvances.length} advance vouchers recorded
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
              Allocated Against Invoices
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={16} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", marginTop: 8 }}>
            {INR(totalAdvancesAllocated)}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            Applied to settled & partial bills
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
              Net Advance Carried Forward
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={16} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 8 }}>
            {INR(totalAdvanceCarriedForward)}
          </div>
          <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 600, marginTop: 4 }}>
            Continuous period-to-period credit
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
              Prepaid Accounts
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={16} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginTop: 8 }}>
            {customersWithAdvance.length} Customers
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            Holding unallocated advance funds
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1.5px solid #e2e8f0", paddingBottom: 2 }}>
        <button
          onClick={() => setActiveTab("advances")}
          style={{
            background: "none", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", color: activeTab === "advances" ? "#059669" : "#64748b",
            borderBottom: activeTab === "advances" ? "2.5px solid #059669" : "2.5px solid transparent",
          }}
        >
          Customer Advance Vouchers ({customerAdvances.length})
        </button>
        <button
          onClick={() => setActiveTab("allocations")}
          style={{
            background: "none", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", color: activeTab === "allocations" ? "#059669" : "#64748b",
            borderBottom: activeTab === "allocations" ? "2.5px solid #059669" : "2.5px solid transparent",
          }}
        >
          Allocation Audit Trail ({advanceAllocations.length})
        </button>
      </div>

      {activeTab === "advances" ? (
        <>
          {/* Filter Bar */}
          <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0",
              borderRadius: 8, padding: "8px 13px", flex: 1, minWidth: 240, background: "#f8fafc"
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search voucher #, customer name, code, UTR..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ color: "#94a3b8", cursor: "pointer", display: "flex", background: "none", border: "none" }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
            >
              <option value="all">All Statuses ({customerAdvances.length})</option>
              <option value="active">Active / Available ({customerAdvances.filter(a => a.status !== "consumed").length})</option>
              <option value="consumed">Fully Consumed ({customerAdvances.filter(a => a.status === "consumed").length})</option>
            </select>

            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer", maxWidth: 220 }}
            >
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Advances Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Voucher #", "Customer", "Date Received", "Original Amount", "Allocated", "Carried Forward", "Payment Mode & Ref", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                        No customer advance records match your criteria. Click "Record Customer Advance" to register prepaid receipts.
                      </td>
                    </tr>
                  ) : (
                    filteredAdvances.map(a => {
                      const isAvailable = a.remainingAdvance > 0;
                      return (
                        <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 13 }}>
                              {a.advanceReceiptNum || a.advanceNum}
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Link href={`/customers/${a.customerId}`} style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", textDecoration: "none", display: "block" }}>
                              {a.customerName}
                            </Link>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{a.customerCode}</div>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>
                            {a.receiptDate || a.date}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                            {INR(a.amountReceived || a.amount)}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>
                            {INR(a.amountApplied || a.allocatedAmount || 0)}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 800, color: isAvailable ? "#059669" : "#94a3b8" }}>
                            {INR(a.remainingAdvance)}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 12 }}>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{a.paymentMethod || a.paymentMode}</div>
                            {(a.referenceNum || a.reference) && <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>Ref: {a.referenceNum || a.reference}</div>}
                          </td>
                          <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", padding: "3px 10px",
                              borderRadius: 100, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
                              background: a.status === "available" ? "#ecfdf5" : a.status === "partially_allocated" ? "#fef3c7" : "#f1f5f9",
                              color: a.status === "available" ? "#065f46" : a.status === "partially_allocated" ? "#92400e" : "#475569"
                            }}>
                              {a.status === "available" ? "Available" : a.status === "partially_allocated" ? "Partial" : "Consumed"}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                            {isAvailable && (
                              <button
                                onClick={() => handleOpenAllocate(a)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px",
                                  borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#7c3aed",
                                  color: "#fff", border: "none", cursor: "pointer"
                                }}
                              >
                                Allocate to Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Allocations Audit Trail Table */
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Allocation ID", "Date", "Advance Voucher", "Customer", "Applied to Invoice", "Amount Allocated", "Responsible User"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advanceAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      No advance allocations recorded yet. When customer advances are applied to invoices, the full audit trail appears here.
                    </td>
                  </tr>
                ) : (
                  advanceAllocations.map(al => (
                    <tr key={al.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                        {al.id}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>
                        {al.allocatedDate || al.date}
                      </td>
                      <td style={{ padding: "13px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 13 }}>
                        {al.advanceReceiptNum || al.advanceNum}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                        {al.customerName || "Customer"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#059669", fontSize: 13 }}>
                          {al.invoiceNum}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 800, color: "#059669" }}>
                        {INR(al.allocatedAmount)}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b" }}>
                        {al.allocatedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Advance Modal */}
      {showRecordModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
              Record Commercial Customer Advance
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 16px" }}>
              Received funds will be held in the customer's prepaid balance and carried forward across billing months.
            </p>
            <form onSubmit={handleRecordAdvance} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Select Commercial Customer</label>
                <select
                  value={selectedCustId}
                  onChange={e => setSelectedCustId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Code: {c.code} {c.sap_code ? `(SAP: ${c.sap_code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Advance Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={advAmount}
                  onChange={e => setAdvAmount(Number(e.target.value) || 0)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>UTR / Cheque / Ref Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR891273948"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Accounting Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Advance received for commercial 47.5kg supply"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowRecordModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Record Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Advance to Invoice Modal */}
      {showAllocateModal && selectedAdvObj && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.1)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
              Allocate Advance #{selectedAdvObj.advanceReceiptNum || selectedAdvObj.advanceNum}
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px" }}>
              Customer: <strong>{selectedAdvObj.customerName}</strong> • Available Advance: <strong style={{ color: "#059669" }}>{INR(selectedAdvObj.remainingAdvance)}</strong>
            </p>

            {eligibleInvoicesForAlloc.length === 0 ? (
              <div style={{ padding: "20px 14px", textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  This customer has no unpaid or open invoices at this time.
                  The advance balance of {INR(selectedAdvObj.remainingAdvance)} will remain carried forward for future orders.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  style={{ marginTop: 14, padding: "8px 16px", borderRadius: 8, background: "#64748b", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5 }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteAllocate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Select Open Invoice</label>
                  <select
                    value={allocInvoiceId}
                    onChange={e => {
                      setAllocInvoiceId(e.target.value);
                      const inv = eligibleInvoicesForAlloc.find(i => i.id === e.target.value);
                      if (inv) {
                        const out = inv.total - (inv.paid || 0);
                        setAllocAmount(Math.min(selectedAdvObj.remainingAdvance, out));
                      }
                    }}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  >
                    {eligibleInvoicesForAlloc.map(inv => {
                      const out = inv.total - (inv.paid || 0);
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.num} — Outstanding: {INR(out)} (Total: {INR(inv.total)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Amount to Allocate (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAdvObj.remainingAdvance}
                    required
                    value={allocAmount}
                    onChange={e => setAllocAmount(Number(e.target.value) || 0)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                    Unallocated balance will remain carried forward on this voucher.
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAllocateModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                  <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Apply Advance</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
