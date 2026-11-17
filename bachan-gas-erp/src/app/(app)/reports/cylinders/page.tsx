"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RotateCcw, CheckCircle2, AlertTriangle, ArrowLeft, Download,
  Search, Plus, Package, Users, Calendar, Filter, FileText, Check, X
} from "lucide-react";
import { useERPStore, getKolkataDateString, getKolkataFormattedDate, Customer, CylinderExchangeRecord } from "@/lib/store";

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "1.5px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
};

export default function CylinderTrackingReportPage() {
  const {
    customers,
    products,
    cylinderExchangeLedger,
    recordEmptyReturn,
    currentUserRole,
    currentSessionUser,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState<"balances" | "ledger" | "products">("balances");
  const [search, setSearch] = useState("");
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "p-nrm-190");
  const [returnQty, setReturnQty] = useState("");
  const [refNum, setRefNum] = useState("");
  const [remarks, setRemarks] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Totals calculations
  const totalDelivered = customers.reduce((sum, c) => sum + (c.total_filled_delivered || 0), 0);
  const totalReceived = customers.reduce((sum, c) => sum + (c.total_empty_received || 0), 0);
  const totalPending = customers.reduce((sum, c) => sum + (c.empty_cylinders_pending || 0), 0);
  const recoveryRate = totalDelivered > 0 ? ((totalReceived / totalDelivered) * 100).toFixed(1) : "100.0";

  // Filtered customers for Tab 1
  const filteredCustomers = customers.filter(c => {
    const hasPending = (c.empty_cylinders_pending || 0) > 0;
    if (filterPendingOnly && !hasPending) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchMobile = c.mobile && c.mobile.includes(q);
      const matchCity = c.city && c.city.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchMobile && !matchCity) return false;
    }
    return true;
  });

  // Filtered customer search for modal
  const modalCustomerResults = customerSearch.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.mobile && c.mobile.includes(customerSearch))
      ).slice(0, 8)
    : [];

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedCustomerId) {
      setFeedback({ type: "error", text: "Please select a customer account." });
      return;
    }
    const qty = parseInt(returnQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid cylinder return quantity." });
      return;
    }

    try {
      const prod = products.find(p => p.id === selectedProductId);
      recordEmptyReturn({
        customerId: selectedCustomerId,
        productId: selectedProductId,
        productName: prod?.name || "19 kg normal",
        emptyReceived: qty,
        returnDate: getKolkataDateString(),
        refNum: refNum.trim() || undefined,
        remarks: remarks.trim() || undefined,
        recordedBy: currentSessionUser?.username || (currentUserRole === "admin" ? "Bachan Admin" : "Staff User"),
      });

      setFeedback({ type: "success", text: `Successfully recorded return of ${qty} empty cylinders.` });
      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedCustomerId("");
        setCustomerSearch("");
        setReturnQty("");
        setRefNum("");
        setRemarks("");
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to record cylinder return." });
    }
  };

  const handleExportCSV = () => {
    if (activeTab === "ledger") {
      const headers = ["Exchange #", "Date", "Customer Name", "Consumer Code", "Product", "Filled Delivered", "Empty Received", "Empty Pending", "Reference #", "Recorded By", "Remarks"];
      const rows = cylinderExchangeLedger.map(r => [
        r.exchangeNum,
        r.returnDate,
        `"${r.customerName}"`,
        r.customerCode,
        `"${r.productName}"`,
        r.filledDelivered,
        r.emptyReceived,
        r.emptyPending,
        `"${r.refNum || ""}"`,
        `"${r.recordedBy || ""}"`,
        `"${r.remarks || ""}"`
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csv));
      link.setAttribute("download", `Cylinder_Exchange_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Customer Name", "Consumer Code", "Mobile", "City", "Filled Delivered", "Empty Received", "Empty Cylinders Pending"];
      const rows = filteredCustomers.map(c => [
        `"${c.name}"`,
        c.code,
        c.mobile,
        `"${c.city}"`,
        c.total_filled_delivered || 0,
        c.total_empty_received || 0,
        c.empty_cylinders_pending || 0
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csv));
      link.setAttribute("download", `Customer_Cylinder_Holdings_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1600, margin: "0 auto", paddingBottom: 40 }}>
      {/* Top Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px", margin: 0 }}>
              Cylinder Tracking &amp; Return Ledger
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 4 }}>
              Commercial LPG cylinder circulation audit: filled dispatches, empty returns received in godown, and customer-held balances.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                background: "#ffffff",
                color: "#1e3a8a",
                border: "1.5px solid #cbd5e1",
                cursor: "pointer",
              }}
            >
              <Download size={14} /> Export Report CSV
            </button>

            <button
              onClick={() => setShowReturnModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                background: "#f97316",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
              }}
            >
              <RotateCcw size={15} /> Record Empty Return
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 6 }}>
            <Package size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total Filled Dispatched
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1e3a8a" }}>
            {totalDelivered} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>cylinders</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Delivered across all commercial accounts
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 6 }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Empties Received Back
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>
            {totalReceived} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>cylinders</span>
          </div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
            Recovered &amp; stocked in godown
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: totalPending > 0 ? "#dc2626" : "#16a34a", marginBottom: 6 }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Outstanding With Customers
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: totalPending > 0 ? "#dc2626" : "#16a34a" }}>
            {totalPending} <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>cylinders</span>
          </div>
          <div style={{ fontSize: 12, color: totalPending > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
            {totalPending > 0 ? "Awaiting return collection" : "All customer cylinders cleared"}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7c3aed", marginBottom: 6 }}>
            <RotateCcw size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Empty Recovery Ratio
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed" }}>
            {recoveryRate}%
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Empty cylinder collection efficiency
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1.5px solid #e2e8f0", paddingBottom: 2 }}>
        {[
          { id: "balances", label: `Customer Cylinder Balances (${customers.length})` },
          { id: "ledger", label: `Cylinder Exchange Ledger (${cylinderExchangeLedger.length})` },
          { id: "products", label: "Product-wise Circulation (6 Approved Products)" },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #1e3a8a" : "3px solid transparent",
                color: isActive ? "#1e3a8a" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: 13.5,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Customer Cylinder Balances */}
      {activeTab === "balances" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filter Bar */}
          <div style={{ ...cardStyle, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 260, background: "#f8fafc" }}>
              <Search size={14} color="#94a3b8" />
              <input
                placeholder="Search customer by name, consumer number (CX...), mobile, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#0f172a", width: "100%" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={filterPendingOnly}
                onChange={(e) => setFilterPendingOnly(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Show Accounts with Pending Empties Only
            </label>
          </div>

          {/* Table */}
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Customer</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Consumer ID</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Mobile</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>City / Area</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Filled Delivered</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Empty Received</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Empty Pending</th>
                  <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 36, textAlign: "center", color: "#64748b", fontSize: 13.5 }}>
                      No customer accounts match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.slice(0, 100).map((c, idx) => {
                    const pending = c.empty_cylinders_pending || 0;
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <Link href={`/customers/${c.id}`} style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", textDecoration: "none" }}>
                            {c.name}
                          </Link>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{c.business}</div>
                        </td>
                        <td style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>
                          {c.code}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 12.5, color: "#475569" }}>
                          {c.mobile || "—"}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 12.5, color: "#475569" }}>
                          <div>{c.city}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.area}</div>
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#1e3a8a", textAlign: "right" }}>
                          {c.total_filled_delivered || 0}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>
                          {c.total_empty_received || 0}
                        </td>
                        <td style={{ padding: "14px 18px", fontSize: 13.5, fontWeight: 800, color: pending > 0 ? "#dc2626" : "#16a34a", textAlign: "right" }}>
                          {pending}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearch(`${c.name} (${c.code})`);
                              setShowReturnModal(true);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: "#f0fdf4",
                              color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              cursor: "pointer",
                            }}
                          >
                            <RotateCcw size={13} /> Record Return
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {filteredCustomers.length > 100 && (
              <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "#64748b", background: "#f8fafc" }}>
                Showing top 100 of {filteredCustomers.length} accounts. Use search to locate specific customers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Cylinder Exchange Ledger */}
      {activeTab === "ledger" && (
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Exchange #</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Customer</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Product</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Filled Delivered</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Empty Received</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>Balance Pending</th>
                <th style={{ padding: "12px 18px", fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Reference / Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {cylinderExchangeLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13.5 }}>
                    No cylinder exchange transactions recorded yet. Use &quot;Record Empty Return&quot; or complete deliveries to generate ledger entries.
                  </td>
                </tr>
              ) : (
                cylinderExchangeLedger.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                    <td style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>
                      {r.exchangeNum}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12.5, color: "#475569" }}>
                      {r.returnDate}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{r.customerName}</div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{r.customerCode}</div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>
                      {r.productName}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#1e3a8a", textAlign: "right" }}>
                      {r.filledDelivered}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>
                      +{r.emptyReceived}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13.5, fontWeight: 800, color: r.emptyPending > 0 ? "#dc2626" : "#16a34a", textAlign: "right" }}>
                      {r.emptyPending}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "#475569" }}>
                      <div>{r.refNum || "Standard Return"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>By: {r.recordedBy || "Staff"}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Product-wise Circulation */}
      {activeTab === "products" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
          {products.map((p) => {
            const productLedgerEntries = cylinderExchangeLedger.filter(l => l.productId === p.id);
            const pDelivered = productLedgerEntries.reduce((s, l) => s + (l.filledDelivered || 0), 0);
            const pReceived = productLedgerEntries.reduce((s, l) => s + (l.emptyReceived || 0), 0);
            const pPending = Math.max(0, pDelivered - pReceived);

            return (
              <div key={p.id} style={{ ...cardStyle, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{p.name}</h3>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Ref Weight: <strong>{p.referenceWeightKg} kg</strong> · Code: {p.code}
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: p.active ? "#dcfce7" : "#fee2e2",
                    color: p.active ? "#15803d" : "#b91c1c"
                  }}>
                    {p.active ? "Approved Commercial" : "Inactive"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Dispatched</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#1e3a8a", marginTop: 2 }}>{pDelivered}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Collected</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#16a34a", marginTop: 2 }}>{pReceived}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pending</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: pPending > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>{pPending}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 12, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                  <span>Approved Basic Rate:</span>
                  <strong>₹{p.rate.toFixed(2)} Basic (+18% GST)</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Recording Modal */}
      {showReturnModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RotateCcw size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Record Empty Cylinder Return</h3>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Update customer empty balance &amp; godown stock</div>
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {feedback && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                background: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
                color: feedback.type === "success" ? "#15803d" : "#b91c1c",
              }}>
                {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Customer Lookup */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Customer Account <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    style={inputStyle}
                    placeholder="Search customer by name or CX code..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomerId("");
                    }}
                  />
                  {modalCustomerResults.length > 0 && !selectedCustomerId && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                      zIndex: 50,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}>
                      {modalCustomerResults.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch(`${c.name} (${c.code})`);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "9px 12px",
                            border: "none",
                            borderBottom: "1px solid #f1f5f9",
                            background: "#ffffff",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: 12.5,
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>{c.name}</strong>
                            <span style={{ color: "#64748b", marginLeft: 6 }}>({c.code})</span>
                          </div>
                          <span style={{ fontSize: 11, color: (c.empty_cylinders_pending || 0) > 0 ? "#dc2626" : "#16a34a" }}>
                            Pending: {c.empty_cylinders_pending || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Cylinder Product Variant <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  style={inputStyle}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.referenceWeightKg} kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Empty Cylinders Returned (Units) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  placeholder="e.g. 5"
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                />
              </div>

              {/* Reference / Challan */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Return Challan / Vehicle # (Optional)
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. PB-10-AB-1234 or RET-0045"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                />
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Remarks (Optional)
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Returned on pickup route"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
