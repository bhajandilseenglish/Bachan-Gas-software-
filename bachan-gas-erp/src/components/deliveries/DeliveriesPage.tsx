"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Truck, CheckCircle2, Clock, Package, Download, Plus, Check,
  User, AlertCircle, X, Eye, ArrowRight, RotateCcw, ShieldAlert
} from "lucide-react";
import { useERPStore, Delivery, CylinderExchangeRecord } from "@/lib/store";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  in_transit: { bg: "#dbeafe", color: "#1d4ed8", label: "In Transit" },
  delivered:  { bg: "#dcfce7", color: "#15803d", label: "Delivered" },
  failed:     { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function DeliveriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    deliveries,
    orders,
    customers,
    cylinderExchangeLedger,
    confirmDelivery,
    recordEmptyReturn,
    currentUserRole
  } = useERPStore();

  const [mainTab, setMainTab] = useState<"history" | "received" | "pending">(
    (searchParams.get("tab") as any) || "history"
  );
  const [filter, setFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab === "received" || qTab === "pending" || qTab === "history") {
      setMainTab(qTab);
    }
    const qStatus = searchParams.get("status");
    if (qStatus) setFilter(qStatus);
  }, [searchParams]);

  // Confirm delivery modal
  const [confirmModalDelivery, setConfirmModalDelivery] = useState<Delivery | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [emptyCollected, setEmptyCollected] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [confirmSuccess, setConfirmSuccess] = useState("");

  // Standalone Empty Return Modal
  const [showEmptyReturnModal, setShowEmptyReturnModal] = useState(false);
  const [returnCustId, setReturnCustId] = useState(customers[0]?.id || "");
  const [returnProdName, setReturnProdName] = useState("47.5kg LOT");
  const [returnQty, setReturnQty] = useState(1);
  const [returnRef, setReturnRef] = useState("");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returnSuccess, setReturnSuccess] = useState("");

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchFilter = filter === "all" || d.status === filter;
      const matchSearch =
        !search ||
        d.num.toLowerCase().includes(search.toLowerCase()) ||
        d.orderNum.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (d.vehicle && d.vehicle.toLowerCase().includes(search.toLowerCase())) ||
        (d.driver && d.driver.toLowerCase().includes(search.toLowerCase()));

      return matchFilter && matchSearch;
    });
  }, [deliveries, filter, search]);

  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const inTransitCount = deliveries.filter(d => d.status === "in_transit").length;
  const totalCylindersDelivered = deliveries
    .filter(d => d.status === "delivered")
    .reduce((s, d) => s + d.qty, 0);

  // Empty cylinders metrics
  const totalEmptiesReturned = cylinderExchangeLedger.reduce((s, e) => s + (e.emptyReceived || 0), 0);
  const customersWithPendingEmpties = customers.filter(c => (c.empty_cylinders_pending || 0) > 0);
  const totalEmptiesPending = customers.reduce((s, c) => s + (c.empty_cylinders_pending || 0), 0);

  const handleOpenConfirm = (d: Delivery) => {
    setConfirmModalDelivery(d);
    setReceiverName(d.customerName);
    setEmptyCollected(d.qty);
    setNotes("");
    setConfirmSuccess("");
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalDelivery) return;

    confirmDelivery(confirmModalDelivery.id, emptyCollected);
    setConfirmSuccess(`Delivery ${confirmModalDelivery.num} confirmed! Empties credited & invoice posted.`);
    setTimeout(() => {
      setConfirmModalDelivery(null);
      setConfirmSuccess("");
    }, 1200);
  };

  const handleEmptyReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === returnCustId);
    if (!cust || returnQty <= 0) return;

    recordEmptyReturn({
      customerId: cust.id,
      productName: returnProdName,
      emptyReceived: returnQty,
      returnDate: new Date().toISOString().split("T")[0],
      refNum: returnRef,
      remarks: returnRemarks,
      recordedBy: currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
    });

    setReturnSuccess(`Recorded ${returnQty} empty cylinders returned from ${cust.name}!`);
    setTimeout(() => {
      setShowEmptyReturnModal(false);
      setReturnSuccess("");
      setReturnQty(1);
      setReturnRef("");
      setReturnRemarks("");
    }, 1200);
  };

  const handleExportCSV = () => {
    const headers = ["Delivery #", "Order #", "Customer", "Product", "Qty", "Vehicle", "Driver", "Delivery Date", "Status"];
    const rows = filteredDeliveries.map(d => [
      d.num,
      d.orderNum,
      `"${d.customerName}"`,
      `"${d.product}"`,
      d.qty,
      `"${d.vehicle || ""}"`,
      `"${d.driver || ""}"`,
      d.date,
      d.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BGS_Deliveries_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Fleet Deliveries & Empty Cylinder Tracking
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Track cylinder supplies, vehicle routes, empty cylinder returns, and customer exchange balances
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/cylinder-returns"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#fff7ed",
              color: "#c2410c", border: "1.5px solid #fed7aa", textDecoration: "none"
            }}
          >
            <RotateCcw size={14} /> Cylinder Returns Portal →
          </Link>
          <button
            onClick={() => setShowEmptyReturnModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a",
              color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(30,58,138,.3)"
            }}
          >
            <RotateCcw size={14} /> + Record Empty Received
          </button>
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
        </div>
      </div>

      {/* Main Tabs (Delivery History vs Empty Received vs Empty Pending) */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        <button
          onClick={() => setMainTab("history")}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: mainTab === "history" ? "#1e3a8a" : "#f1f5f9",
            color: mainTab === "history" ? "#fff" : "#64748b",
            border: "none", cursor: "pointer"
          }}
        >
          Delivery History ({deliveries.length})
        </button>
        <button
          onClick={() => setMainTab("received")}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: mainTab === "received" ? "#1e3a8a" : "#f1f5f9",
            color: mainTab === "received" ? "#fff" : "#64748b",
            border: "none", cursor: "pointer"
          }}
        >
          Empty Received ({cylinderExchangeLedger.length} Records)
        </button>
        <button
          onClick={() => setMainTab("pending")}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: mainTab === "pending" ? "#dc2626" : "#f1f5f9",
            color: mainTab === "pending" ? "#fff" : "#64748b",
            border: "none", cursor: "pointer"
          }}
        >
          Empty Pending ({totalEmptiesPending} Cylinders)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Completed Deliveries", val: deliveredCount, color: "#16a34a", Icon: CheckCircle2 },
          { label: "Pending Supply Dispatch", val: pendingCount, color: "#d97706", Icon: Clock },
          { label: "Total Cylinders Delivered", val: `${totalCylindersDelivered} units`, color: "#1e3a8a", Icon: Package },
          { label: "Empty Cylinders Pending", val: `${totalEmptiesPending} units`, color: totalEmptiesPending > 0 ? "#dc2626" : "#16a34a", Icon: RotateCcw },
        ].map((s, i) => (
          <div key={i} style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TAB 1: DELIVERY HISTORY */}
      {mainTab === "history" && (
        <>
          <div className="customers-filter-bar" style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="filter-selects-row" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {[
                { id: "all", label: `All (${deliveries.length})` },
                { id: "pending", label: `Pending (${pendingCount})` },
                { id: "in_transit", label: `In Transit (${inTransitCount})` },
                { id: "delivered", label: `Delivered (${deliveredCount})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  style={{
                    padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: filter === t.id ? "#1e3a8a" : "#f1f5f9",
                    color: filter === t.id ? "#fff" : "#475569",
                    border: "none", cursor: "pointer", whiteSpace: "nowrap"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="filter-search-box" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", minWidth: 220, flex: 1 }}>
              <Clock size={14} color="#94a3b8" />
              <input
                placeholder="Search delivery, vehicle, driver..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 12.5, color: "#1e293b", width: "100%" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ color: "#94a3b8", cursor: "pointer", background: "none", border: "none" }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Delivery #", "Order #", "Customer", "Cylinder / Product", "Qty", "Vehicle & Driver", "Date", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      No delivery records found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map(d => {
                    const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={d.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "13px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12.5 }}>
                          {d.num}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <Link href={`/orders/${d.orderId}`} style={{ fontFamily: "monospace", color: "#f97316", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                            {d.orderNum}
                          </Link>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <Link href={`/customers/${d.customerId}`} style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", textDecoration: "none", display: "block" }}>
                            {d.customerName}
                          </Link>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{d.customerCode}</div>
                        </td>
                        <td style={{ padding: "13px 16px", color: "#475569", fontSize: 12.5 }}>
                          {d.product}
                        </td>
                        <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                          {d.qty} units
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12.5 }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{d.vehicle || "—"}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{d.driver || "—"}</div>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b" }}>
                          {d.date}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.color, textTransform: "uppercase" }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          {d.status !== "delivered" ? (
                            <button
                              onClick={() => handleOpenConfirm(d)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#dcfce7", color: "#15803d", border: "none", cursor: "pointer" }}
                            >
                              <Check size={13} /> Confirm
                            </button>
                          ) : (
                            <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 600 }}>✓ Delivered</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 2: EMPTY RECEIVED */}
      {mainTab === "received" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Customer Empty Cylinders Exchange Ledger</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>Total Empties Returned: <strong>{totalEmptiesReturned} units</strong></span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Exchange Ref", "Customer Name", "Product Type", "Filled Delivered", "Empty Received", "Closing Pending", "Return Date", "Recorded By", "Remarks"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cylinderExchangeLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No empty cylinder receipts logged yet. When deliveries are completed or standalone empties collected, records accumulate here.
                  </td>
                </tr>
              ) : (
                cylinderExchangeLedger.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>
                      {e.exchangeNum}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/customers/${e.customerId}`} style={{ fontWeight: 700, color: "#1e293b", textDecoration: "none", fontSize: 13 }}>
                        {e.customerName}
                      </Link>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{e.customerCode}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                      {e.productName}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {e.filledDelivered > 0 ? `${e.filledDelivered} units` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#16a34a" }}>
                      {e.emptyReceived} units
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 800, color: e.emptyPending > 0 ? "#dc2626" : "#16a34a", fontSize: 13 }}>
                        {e.emptyPending} pending
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                      {e.returnDate}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {e.recordedBy}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                      {e.remarks || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: EMPTY PENDING REPORT */}
      {mainTab === "pending" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#dc2626" }}>Pending Empty Cylinders by Customer Account</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{customersWithPendingEmpties.length} customers with unreturned empties</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Customer", "Consumer Code", "Mobile", "City / Area", "Filled Delivered", "Empties Returned", "Pending Cylinders (Warning)", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customersWithPendingEmpties.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#16a34a", fontSize: 13 }}>
                    <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 700 }}>All Commercial Empty Cylinders Reconciled!</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Zero unreturned empty cylinders across all registered accounts.</div>
                  </td>
                </tr>
              ) : (
                customersWithPendingEmpties.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/customers/${c.id}`} style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", textDecoration: "none" }}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>
                      {c.code}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>
                      {c.mobile}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5 }}>
                      {c.city} · {c.area}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      {c.total_filled_delivered || 0} units
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
                      {c.total_empty_received || 0} units
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 800, background: "#fee2e2", color: "#b91c1c" }}>
                        <ShieldAlert size={14} /> {c.empty_cylinders_pending} PENDING
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => {
                          setReturnCustId(c.id);
                          setReturnQty(c.empty_cylinders_pending);
                          setShowEmptyReturnModal(true);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        <RotateCcw size={12} /> Receive Empties
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Standalone Record Empty Return Modal */}
      {showEmptyReturnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 480, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RotateCcw size={18} color="#1e3a8a" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Record Empty Cylinders Received</h3>
              </div>
              <button onClick={() => setShowEmptyReturnModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {returnSuccess && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                ✓ {returnSuccess}
              </div>
            )}

            <form onSubmit={handleEmptyReturnSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Customer Account *</label>
                <select
                  value={returnCustId}
                  onChange={e => setReturnCustId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.empty_cylinders_pending || 0} Empties Pending
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Cylinder Category *</label>
                  <select
                    value={returnProdName}
                    onChange={e => setReturnProdName(e.target.value)}
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
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Empties Received *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={returnQty}
                    onChange={e => setReturnQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Return Slip / Challan Reference #</label>
                <input
                  placeholder="e.g. RET-0921"
                  value={returnRef}
                  onChange={e => setReturnRef(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Remarks / Warehouse Condition</label>
                <input
                  placeholder="e.g. Collected by vehicle driver, valves inspected in order"
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowEmptyReturnModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Credit Empty Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delivery Modal */}
      {confirmModalDelivery && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 460, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Confirm Delivery #{confirmModalDelivery.num}</h3>
              <button onClick={() => setConfirmModalDelivery(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {confirmSuccess ? (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                ✓ {confirmSuccess}
              </div>
            ) : (
              <form onSubmit={handleConfirmSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12.5 }}>
                  <div>Customer: <strong>{confirmModalDelivery.customerName}</strong></div>
                  <div>Product: <strong>{confirmModalDelivery.product}</strong> ({confirmModalDelivery.qty} units)</div>
                  <div>Vehicle: {confirmModalDelivery.vehicle} · Driver: {confirmModalDelivery.driver}</div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Empty Cylinders Collected on Delivery</label>
                  <input
                    type="number"
                    min={0}
                    value={emptyCollected}
                    onChange={e => setEmptyCollected(parseInt(e.target.value, 10) || 0)}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>
                    Full delivered: {confirmModalDelivery.qty} · Net exchange will update immediately.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => setConfirmModalDelivery(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    Confirm Delivery
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
