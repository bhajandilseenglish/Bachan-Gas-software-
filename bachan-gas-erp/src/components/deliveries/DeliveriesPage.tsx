"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Truck, CheckCircle2, Clock, Package, Download, Plus, Check,
  User, AlertCircle, X, Eye, ArrowRight
} from "lucide-react";
import { useERPStore, Delivery } from "@/lib/store";

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
  const { deliveries, orders, customers, confirmDelivery } = useERPStore();
  const [filter, setFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  // Confirm delivery modal
  const [confirmModalDelivery, setConfirmModalDelivery] = useState<Delivery | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [emptyCollected, setEmptyCollected] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [confirmSuccess, setConfirmSuccess] = useState("");

  const filtered = useMemo(() => {
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

    confirmDelivery(confirmModalDelivery.id);
    setConfirmSuccess(`Delivery ${confirmModalDelivery.num} confirmed! Invoice posted & ledger updated.`);
    setTimeout(() => {
      setConfirmModalDelivery(null);
      setConfirmSuccess("");
    }, 1200);
  };

  const handleExportCSV = () => {
    const headers = ["Delivery #", "Order #", "Customer", "Product", "Qty", "Vehicle", "Driver", "Delivery Date", "Status"];
    const rows = filtered.map(d => [
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Fleet & Cylinder Deliveries</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {deliveredCount} completed · {pendingCount} pending supply · {totalCylindersDelivered} total cylinders delivered
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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
          <Link
            href="/orders/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316",
              color: "#fff", textDecoration: "none", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
            }}
          >
            <Plus size={14} /> + New Supply Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Deliveries", val: deliveries.length, color: "#1e3a8a", Icon: Truck },
          { label: "Delivered & Invoiced", val: deliveredCount, color: "#16a34a", Icon: CheckCircle2 },
          { label: "Pending Supply", val: pendingCount, color: "#d97706", Icon: Clock },
          { label: "Cylinders Delivered", val: `${totalCylindersDelivered} cyl`, color: "#f97316", Icon: Package },
        ].map(s => (
          <div key={s.label} style={{ ...card(), padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ ...card(), padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
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
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                background: filter === t.id ? "#1e3a8a" : "#f1f5f9",
                color: filter === t.id ? "#fff" : "#475569",
                border: "none", cursor: "pointer", transition: "all .15s"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", width: 280 }}>
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

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Delivery #", "Order #", "Customer", "Cylinder / Product", "Qty", "Vehicle & Driver", "Date", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                    No delivery records found matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map(d => {
                  const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={d.id}
                      style={{ borderBottom: "1px solid #e2e8f0", transition: "background .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12.5 }}>
                          {d.num}
                        </span>
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
                      <td style={{ padding: "13px 16px", fontWeight: 800, fontSize: 13, color: "#1e293b" }}>
                        {d.qty} cyl
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#475569" }}>
                        {d.vehicle ? (
                          <div>
                            <strong>{d.vehicle}</strong>
                            {d.driver && <div style={{ fontSize: 11, color: "#64748b" }}>{d.driver}</div>}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {d.date}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", padding: "3px 10px",
                          borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: ".04em", background: s.bg, color: s.color, whiteSpace: "nowrap"
                        }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Link
                            href={`/customers/${d.customerId}`}
                            style={{
                              padding: "5px 9px", borderRadius: 6, fontSize: 11.5,
                              fontWeight: 600, background: "#f0f4fa", color: "#1e3a8a",
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
                            }}
                            title="View Customer Profile"
                          >
                            <User size={13} /> Profile
                          </Link>

                          {d.status !== "delivered" && (
                            <button
                              onClick={() => handleOpenConfirm(d)}
                              style={{
                                padding: "5px 11px", borderRadius: 6, fontSize: 11.5,
                                fontWeight: 700, background: "#16a34a", color: "#fff",
                                border: "none", cursor: "pointer", display: "inline-flex",
                                alignItems: "center", gap: 4, boxShadow: "0 1px 3px rgba(22,163,74,.3)"
                              }}
                              title="Confirm Delivery & Update Ledger"
                            >
                              <Check size={13} /> Confirm Delivery
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {confirmModalDelivery && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520,
            boxShadow: "0 20px 40px rgba(0,0,0,.2)", overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc"
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Confirm Cylinder Delivery</h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {confirmModalDelivery.num} · Order #{confirmModalDelivery.orderNum}
                </div>
              </div>
              <button
                onClick={() => setConfirmModalDelivery(null)}
                style={{ color: "#94a3b8", cursor: "pointer", background: "none", border: "none" }}
              >
                <X size={18} />
              </button>
            </div>

            {confirmSuccess ? (
              <div style={{ padding: 24, textAlign: "center", color: "#15803d", fontWeight: 700 }}>
                ✅ {confirmSuccess}
              </div>
            ) : (
              <form onSubmit={handleConfirmSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#f0f4fa", borderRadius: 8, padding: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: "#1e3a8a" }}>{confirmModalDelivery.customerName}</div>
                  <div style={{ color: "#475569", marginTop: 2 }}>
                    Supplying: <strong>{confirmModalDelivery.qty} cylinders</strong> ({confirmModalDelivery.product})
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Receiver Name / Authorized Person *
                  </label>
                  <input
                    required
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                      Full Cylinders Delivered
                    </label>
                    <input
                      disabled
                      value={confirmModalDelivery.qty}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                      Empty Cylinders Returned
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={emptyCollected}
                      onChange={e => setEmptyCollected(parseInt(e.target.value, 10) || 0)}
                      style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Delivery Notes / OTP / POD Slip #
                  </label>
                  <input
                    placeholder="e.g. Received in good order, POD #9921"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  />
                </div>

                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: 12, fontSize: 12, color: "#9a3412" }}>
                  <strong>ERP Automation:</strong> Confirming this delivery will automatically:
                  <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                    <li>Generate the posted Tax Invoice</li>
                    <li>Debit customer account ledger and increase outstanding</li>
                    <li>Update Customer&apos;s Last Supply Date and Quantity</li>
                  </ul>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmModalDelivery(null)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                  >
                    ✓ Confirm Delivery & Post Invoice
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
