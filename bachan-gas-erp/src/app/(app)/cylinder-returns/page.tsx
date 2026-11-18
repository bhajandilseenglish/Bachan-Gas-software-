"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  RotateCcw, CheckCircle2, Clock, Package, Download, Plus, Search,
  Filter, FileText, Users, Building2, Phone, Calendar, ArrowRight,
  Printer, X, ShieldAlert, Check, RefreshCw
} from "lucide-react";
import {
  useERPStore,
  getKolkataDateString,
  getKolkataFormattedDate,
  Customer,
  CylinderExchangeRecord
} from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  ...s,
});

export default function CylinderReturnsPage() {
  const {
    cylinderExchangeLedger,
    customers,
    products,
    warehouseStock,
    orders,
    recordEmptyReturn,
    currentUserRole,
    currentSessionUser,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState<"ledger" | "pending" | "godown">("ledger");
  const [search, setSearch] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");

  // Modal State: Record Empty Return
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "p-nrm-190");
  const [returnQty, setReturnQty] = useState<number | "">("");
  const [returnDate, setReturnDate] = useState(getKolkataDateString());
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [referenceSlip, setReferenceSlip] = useState("");
  const [remarks, setRemarks] = useState("");
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State: View Receipt Voucher
  const [selectedVoucher, setSelectedVoucher] = useState<CylinderExchangeRecord | null>(null);

  // Calculated Metrics
  const totalEmptiesRecovered = useMemo(() => {
    return cylinderExchangeLedger.reduce((sum, item) => sum + (item.emptyReceived || 0), 0);
  }, [cylinderExchangeLedger]);

  const totalEmptiesPending = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.empty_cylinders_pending || 0), 0);
  }, [customers]);

  const customersHoldingEmpties = useMemo(() => {
    return customers.filter(c => (c.empty_cylinders_pending || 0) > 0);
  }, [customers]);

  const totalFilledDelivered = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.total_filled_delivered || 0), 0);
  }, [customers]);

  const recoveryRate = useMemo(() => {
    if (totalFilledDelivered === 0) return "100.0";
    return ((totalEmptiesRecovered / totalFilledDelivered) * 100).toFixed(1);
  }, [totalEmptiesRecovered, totalFilledDelivered]);

  // Filtered Return Ledger
  const filteredLedger = useMemo(() => {
    return cylinderExchangeLedger.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerCode.toLowerCase().includes(q) ||
        item.exchangeNum.toLowerCase().includes(q) ||
        (item.orderNum && item.orderNum.toLowerCase().includes(q)) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.refNum && item.refNum.toLowerCase().includes(q));

      const matchProduct =
        selectedProductFilter === "all" ||
        item.productId === selectedProductFilter ||
        item.productName.toLowerCase().includes(selectedProductFilter.toLowerCase());

      return matchSearch && matchProduct;
    });
  }, [cylinderExchangeLedger, search, selectedProductFilter]);

  // Filtered Pending Customers
  const filteredPendingCustomers = useMemo(() => {
    return customersHoldingEmpties.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.business.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q))
      );
    }).sort((a, b) => (b.empty_cylinders_pending || 0) - (a.empty_cylinders_pending || 0));
  }, [customersHoldingEmpties, search]);

  // Customer suggestions for modal
  const customerSuggestions = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.business.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q))
    ).slice(0, 8);
  }, [customers, customerSearch]);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const customerRecentOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return orders.filter(o => o.customerId === selectedCustomerId || o.customerCode === selectedCustomerObj?.code).slice(0, 10);
  }, [orders, selectedCustomerId, selectedCustomerObj]);

  const handleOpenCollectModal = (cust?: Customer) => {
    if (cust) {
      setSelectedCustomerId(cust.id);
      setCustomerSearch(`${cust.name} (${cust.code})`);
      setReturnQty(cust.empty_cylinders_pending && cust.empty_cylinders_pending > 0 ? cust.empty_cylinders_pending : "");
    } else {
      setSelectedCustomerId("");
      setCustomerSearch("");
      setReturnQty("");
    }
    setSelectedProductId(products[0]?.id || "p-nrm-190");
    setSelectedOrderId("");
    setReferenceSlip("");
    setRemarks("");
    setReturnDate(getKolkataDateString());
    setModalFeedback(null);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);

    if (!selectedCustomerId) {
      setModalFeedback({ type: "error", text: "Please select a valid customer account." });
      return;
    }

    const qty = typeof returnQty === "number" ? returnQty : parseInt(returnQty || "0", 10);
    if (!qty || qty <= 0) {
      setModalFeedback({ type: "error", text: "Please enter a valid empty cylinder return quantity greater than 0." });
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    const prodName = prod ? prod.name : "Commercial LPG Cylinder";

    const linkedOrder = orders.find(o => o.id === selectedOrderId);

    try {
      const record = recordEmptyReturn({
        customerId: selectedCustomerId,
        productId: selectedProductId,
        productName: prodName,
        emptyReceived: qty,
        returnDate: returnDate || getKolkataDateString(),
        refNum: referenceSlip.trim() || undefined,
        remarks: remarks.trim() || undefined,
        orderId: linkedOrder?.id,
        orderNum: linkedOrder?.num || linkedOrder?.orderNum,
        recordedBy: currentSessionUser?.fullName || (currentUserRole === "admin" ? "Bachan Administrator" : "Operations Staff"),
      });

      setModalFeedback({
        type: "success",
        text: `Empty Return recorded successfully! Voucher: ${record.exchangeNum}. Warehouse and customer balance updated.`,
      });

      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedVoucher(record);
      }, 1200);
    } catch (err: any) {
      setModalFeedback({ type: "error", text: err.message || "Failed to record empty return." });
    }
  };

  const handleExportCSV = () => {
    const headers = ["Exchange Ref", "Return Date", "Order Ref", "Customer Name", "Customer Code", "Product", "Empty Received", "Closing Pending", "Recorded By", "Remarks"];
    const rows = filteredLedger.map(item => [
      item.exchangeNum,
      item.returnDate,
      item.orderNum || "—",
      `"${item.customerName}"`,
      item.customerCode,
      `"${item.productName}"`,
      item.emptyReceived,
      item.emptyPending,
      `"${item.recordedBy}"`,
      `"${item.remarks || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Bachan_Gas_Cylinder_Returns_${getKolkataDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPendingCSV = () => {
    const headers = ["Customer Name", "Customer Code", "Business Name", "City", "Mobile", "Filled Delivered", "Empties Received", "Net Pending Empties"];
    const rows = filteredPendingCustomers.map(c => [
      `"${c.name}"`,
      c.code,
      `"${c.business || ""}"`,
      `"${c.city || ""}"`,
      c.mobile || "",
      c.total_filled_delivered || 0,
      c.total_empty_received || 0,
      c.empty_cylinders_pending || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Bachan_Gas_Pending_Cylinders_${getKolkataDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1600 }}>
      {/* ── TOP HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Cylinder Returns & Empty Collection
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }}>
              Cylinder Exchange Ledger
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
            Commercial LPG Empty Cylinder Exchange Ledger, Godown Stock Returns & Customer Liabilities
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => handleOpenCollectModal()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
              borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#ea580c",
              color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(234,88,12,.35)"
            }}
          >
            <RotateCcw size={15} /> + Record Empty Return
          </button>
          <button
            onClick={activeTab === "pending" ? handleExportPendingCSV : handleExportCSV}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff",
              color: "#475569", border: "1.5px solid #cbd5e1", cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <Link
            href="/inventory"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f8fafc",
              color: "#1e3a8a", border: "1.5px solid #bfdbfe", textDecoration: "none"
            }}
          >
            <Package size={14} /> Warehouse Inventory
          </Link>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          {
            label: "Total Empties Recovered",
            val: `${totalEmptiesRecovered.toLocaleString("en-IN")} units`,
            sub: `${cylinderExchangeLedger.length} return vouchers logged`,
            color: "#16a34a",
            Icon: CheckCircle2
          },
          {
            label: "Customer Liability Pending",
            val: `${totalEmptiesPending.toLocaleString("en-IN")} units`,
            sub: `${customersHoldingEmpties.length} customers holding cylinders`,
            color: totalEmptiesPending > 0 ? "#dc2626" : "#16a34a",
            Icon: RotateCcw
          },
          {
            label: "Cylinder Recovery Rate",
            val: `${recoveryRate}%`,
            sub: `${totalFilledDelivered.toLocaleString("en-IN")} total filled cylinders dispatched`,
            color: parseFloat(recoveryRate) >= 90 ? "#16a34a" : "#d97706",
            Icon: RefreshCw
          },
          {
            label: "Commercial LPG Products",
            val: `${products.length} Products`,
            sub: "47.5kg, 425kg Jumbo, 19kg variants",
            color: "#1e3a8a",
            Icon: Package
          },
        ].map((k, i) => (
          <div key={i} style={{ ...card(), padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: k.color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <k.Icon size={22} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color, letterSpacing: "-0.3px" }}>{k.val}</div>
              <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 700, marginTop: 1 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1.5px solid #e2e8f0", paddingBottom: 2 }}>
        <button
          onClick={() => setActiveTab("ledger")}
          style={{
            padding: "9px 18px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 700,
            background: activeTab === "ledger" ? "#ea580c" : "transparent",
            color: activeTab === "ledger" ? "#ffffff" : "#64748b",
            border: "none", cursor: "pointer", transition: "all .15s"
          }}
        >
          Exchange Ledger ({cylinderExchangeLedger.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "9px 18px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 700,
            background: activeTab === "pending" ? "#dc2626" : "transparent",
            color: activeTab === "pending" ? "#ffffff" : "#64748b",
            border: "none", cursor: "pointer", transition: "all .15s"
          }}
        >
          Customers Holding Empties ({customersHoldingEmpties.length})
        </button>
        <button
          onClick={() => setActiveTab("godown")}
          style={{
            padding: "9px 18px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 700,
            background: activeTab === "godown" ? "#1e3a8a" : "transparent",
            color: activeTab === "godown" ? "#ffffff" : "#64748b",
            border: "none", cursor: "pointer", transition: "all .15s"
          }}
        >
          Godown Stock & Circulation
        </button>
      </div>

      {/* ── TAB 1: EXCHANGE LEDGER ── */}
      {activeTab === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter Bar */}
          <div style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
                <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 10, top: 10 }} />
                <input
                  type="text"
                  placeholder="Search customer, voucher #, Order ID, slip..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "7px 10px 7px 32px", fontSize: 12.5,
                    borderRadius: 7, border: "1.5px solid #cbd5e1", outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                style={{
                  padding: "7px 12px", fontSize: 12.5, borderRadius: 7,
                  border: "1.5px solid #cbd5e1", background: "#fff", color: "#334155"
                }}
              >
                <option value="all">All Cylinder Types</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12.5, color: "#64748b", fontWeight: 600 }}>
              Showing <strong>{filteredLedger.length}</strong> return records
            </div>
          </div>

          {/* Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Voucher Ref", "Return Date", "Order ID", "Customer Name", "Product Category", "Empty Received", "Closing Pending", "Recorded By", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
                        <RotateCcw size={32} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>No cylinder return vouchers found</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Click &quot;+ Record Empty Return&quot; above to log collected empty cylinders.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, fontFamily: "monospace", color: "#1e3a8a" }}>
                          {item.exchangeNum}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#334155" }}>
                          {item.returnDate}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>
                          {item.orderNum ? (
                            <Link href={`/orders/${item.orderId || ""}`} style={{ color: "#ea580c", fontWeight: 700, textDecoration: "none" }}>
                              {item.orderNum}
                            </Link>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>— (Direct Return)</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link href={`/customers/${item.customerId}`} style={{ textDecoration: "none" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.customerName}</div>
                            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{item.customerCode}</div>
                          </Link>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                          {item.productName}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 900, color: "#16a34a" }}>
                          +{item.emptyReceived} units
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 700, color: item.emptyPending > 0 ? "#dc2626" : "#16a34a" }}>
                          {item.emptyPending} pending
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                          <div>{item.recordedBy}</div>
                          {item.remarks && <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>{item.remarks}</div>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setSelectedVoucher(item)}
                            style={{
                              padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700,
                              background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", cursor: "pointer"
                            }}
                          >
                            View Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PENDING CUSTOMER BALANCES ── */}
      {activeTab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header Summary */}
          <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={24} color="#dc2626" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#991b1b" }}>
                  {customersHoldingEmpties.length} Commercial Accounts Holding Unreturned Empty Cylinders
                </div>
                <div style={{ fontSize: 12, color: "#b91c1c" }}>
                  Total outstanding cylinder liability across customers: <strong>{totalEmptiesPending} units</strong>
                </div>
              </div>
            </div>

            <div style={{ position: "relative", width: 280 }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Filter pending customer, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "7px 10px 7px 30px", fontSize: 12.5,
                  borderRadius: 7, border: "1.5px solid #fca5a5", background: "#fff",
                  outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Pending Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Customer Name & Business", "Code / SAP Code", "City & Contact", "Filled Delivered", "Empties Recovered", "Outstanding Empties", "Quick Action"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#16a34a" }}>
                        <CheckCircle2 size={32} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                        <div style={{ fontSize: 14, fontWeight: 700 }}>All empty cylinders have been reconciled!</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>No customers currently have outstanding empty cylinder balances.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingCustomers.map((cust) => (
                      <tr key={cust.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <Link href={`/customers/${cust.id}`} style={{ textDecoration: "none" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{cust.name}</div>
                            {cust.business && <div style={{ fontSize: 11.5, color: "#64748b" }}>{cust.business}</div>}
                          </Link>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>
                          <div style={{ fontWeight: 700, color: "#1e3a8a" }}>{cust.code}</div>
                          {cust.sap_code && <div style={{ color: "#64748b" }}>SAP: {cust.sap_code}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                          <div>{cust.city || "Ludhiana"}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{cust.mobile}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#334155", fontWeight: 600 }}>
                          {cust.total_filled_delivered || 0} units
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#16a34a", fontWeight: 700 }}>
                          {cust.total_empty_received || 0} units
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            display: "inline-block", padding: "4px 10px", borderRadius: 6,
                            background: "#fee2e2", color: "#991b1b", fontSize: 13, fontWeight: 900
                          }}>
                            {cust.empty_cylinders_pending} units
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => handleOpenCollectModal(cust)}
                            style={{
                              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                              background: "#ea580c", color: "#fff", border: "none", cursor: "pointer"
                            }}
                          >
                            + Collect Empties
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GODOWN CIRCULATION SUMMARY ── */}
      {activeTab === "godown" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                Commercial LPG Cylinder Circulation Balance across 6 Approved Products
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Formula: Total Agency Float = Filled in Godown + Empties in Godown + Customer Circulation Pending
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#ffffff", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Product Name", "Reference Weight", "Filled in Godown", "Empty in Godown", "Customer Pending", "Total Agency Float", "Godown Location"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const stock = warehouseStock.find(s => s.productId === p.id || s.productName.toLowerCase().includes(p.name.toLowerCase()));
                    const filled = Math.max(0, (stock?.filledOpeningStock || 0) + (stock?.filledStockReceived || 0) - (stock?.filledStockIssued || 0));
                    const empty = Math.max(0, (stock?.emptyOpeningStock || 0) + (stock?.emptyStockReceived || 0) - (stock?.emptyStockIssued || 0));
                    // Approximation of product pending
                    const customerPending = Math.round(totalEmptiesPending / (products.length || 1));
                    const totalFloat = filled + empty + customerPending;

                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{p.code}</div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#334155", fontWeight: 600 }}>
                          {p.weight} kg
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>
                          {filled} units
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                          {empty} units
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                          {customerPending} units
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                          {totalFloat} units
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>
                          Main Godown · Ludhiana
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD EMPTY RETURN ── */}
      {showReturnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e2e8f0", paddingBottom: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RotateCcw size={18} color="#ea580c" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Record Empty Cylinder Return</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>Log collected empty cylinders and update warehouse inventory</p>
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            {modalFeedback && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 12.5, fontWeight: 600,
                background: modalFeedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: modalFeedback.type === "success" ? "#166534" : "#991b1b",
                border: `1px solid ${modalFeedback.type === "success" ? "#bbf7d0" : "#fecaca"}`
              }}>
                {modalFeedback.text}
              </div>
            )}

            <form onSubmit={handleReturnSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Customer Search / Selection */}
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Customer Account *
                </label>
                <input
                  type="text"
                  placeholder="Type customer name, consumer number, or phone..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (selectedCustomerId) setSelectedCustomerId("");
                  }}
                  style={{
                    width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                    border: "1.5px solid #cbd5e1", outline: "none", boxSizing: "border-box"
                  }}
                />

                {customerSuggestions.length > 0 && !selectedCustomerId && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#fff", border: "1.5px solid #cbd5e1", borderRadius: 8,
                    marginTop: 4, maxHeight: 220, overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,.15)"
                  }}>
                    {customerSuggestions.map(c => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch(`${c.name} (${c.code})`);
                          if (c.empty_cylinders_pending && c.empty_cylinders_pending > 0) {
                            setReturnQty(c.empty_cylinders_pending);
                          }
                        }}
                        style={{
                          width: "100%", textAlign: "left", padding: "8px 12px",
                          borderBottom: "1px solid #f1f5f9", background: "none", border: "none",
                          cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{c.business ? `${c.business} · ` : ""}{c.city} · {c.mobile}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: (c.empty_cylinders_pending || 0) > 0 ? "#dc2626" : "#16a34a", background: "#f8fafc", padding: "2px 6px", borderRadius: 4 }}>
                          {c.empty_cylinders_pending || 0} empties
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedCustomerObj && (
                  <div style={{ marginTop: 6, fontSize: 11.5, color: "#0369a1", background: "#f0f9ff", padding: "6px 10px", borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
                    <span>Selected: <strong>{selectedCustomerObj.name}</strong> ({selectedCustomerObj.code})</span>
                    <span>Current Pending: <strong>{selectedCustomerObj.empty_cylinders_pending || 0} units</strong></span>
                  </div>
                )}
              </div>

              {/* Product Category */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Cylinder Product Category *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                    border: "1.5px solid #cbd5e1", background: "#fff", color: "#0f172a", boxSizing: "border-box"
                  }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.weight} kg reference weight)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value ? parseInt(e.target.value, 10) : "")}
                    style={{
                      width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                      border: "1.5px solid #cbd5e1", outline: "none", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Return Date *
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                      border: "1.5px solid #cbd5e1", outline: "none", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
              </div>

              {/* Related Order (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Link to Recent Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                    border: "1.5px solid #cbd5e1", background: "#fff", color: "#0f172a", boxSizing: "border-box"
                  }}
                >
                  <option value="">— Standalone Return / Earlier Delivery —</option>
                  {customerRecentOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.num} · {o.date} · {o.items?.[0]?.productName || "Commercial LPG"} ({o.totalQty} cyls)
                    </option>
                  ))}
                </select>
              </div>

              {/* Slip / Challan Reference */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Challan / Slip Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-2026-881"
                  value={referenceSlip}
                  onChange={(e) => setReferenceSlip(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                    border: "1.5px solid #cbd5e1", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Returned via driver vehicle PB-10-8841..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8,
                    border: "1.5px solid #cbd5e1", outline: "none", boxSizing: "border-box", resize: "vertical"
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  style={{
                    padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: "#ea580c", color: "#fff", border: "none", cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(234,88,12,.3)"
                  }}
                >
                  Confirm & Update Godown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECEIPT VOUCHER ── */}
      {selectedVoucher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640, padding: 28, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a" }}>BACHAN GAS SERVICE</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Authorized Commercial LPG Distributor • Distributor Code: <strong>0000110351</strong>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  Main Godown · Ludhiana, Punjab
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, background: "#f0fdf4", color: "#166534", fontSize: 12, fontWeight: 800 }}>
                  EMPTY RETURN VOUCHER
                </span>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 4, fontFamily: "monospace" }}>
                  #{selectedVoucher.exchangeNum}
                </div>
              </div>
            </div>

            <div style={{ margin: "20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12.5 }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Customer Details</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginTop: 2 }}>{selectedVoucher.customerName}</div>
                <div style={{ color: "#64748b" }}>Code: {selectedVoucher.customerCode}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Transaction Info</div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2 }}>Date: {selectedVoucher.returnDate}</div>
                {selectedVoucher.orderNum && <div style={{ color: "#ea580c", fontWeight: 700 }}>Order: {selectedVoucher.orderNum}</div>}
                {selectedVoucher.refNum && <div style={{ color: "#64748b" }}>Ref Slip: {selectedVoucher.refNum}</div>}
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{selectedVoucher.productName}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Commercial LPG Empty Cylinders Received</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>
                  +{selectedVoucher.emptyReceived} units
                </div>
              </div>
              <div style={{ height: 1, background: "#e2e8f0", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Customer Remaining Outstanding Empties:</span>
                <strong style={{ color: selectedVoucher.emptyPending > 0 ? "#dc2626" : "#16a34a" }}>{selectedVoucher.emptyPending} units</strong>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11.5, color: "#64748b" }}>
              <div>
                <div>Recorded By: <strong>{selectedVoucher.recordedBy}</strong></div>
                {selectedVoucher.remarks && <div>Remarks: {selectedVoucher.remarks}</div>}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #cbd5e1", width: 140, marginBottom: 4 }} />
                <span>Authorized Godown Incharge</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 7, fontSize: 12.5, fontWeight: 600, background: "#f1f5f9",
                  color: "#334155", border: "1px solid #cbd5e1", cursor: "pointer"
                }}
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedVoucher(null)}
                style={{
                  padding: "8px 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 700,
                  background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
