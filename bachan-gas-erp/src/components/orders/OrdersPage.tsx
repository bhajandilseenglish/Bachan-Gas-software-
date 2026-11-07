"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Download, Plus, Eye, CheckCircle2, Clock, Truck,
  Package, X, AlertCircle, Check
} from "lucide-react";
import { useERPStore, Order } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
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

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, customers, products, updateOrderStatus } = useERPStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        !search ||
        o.num.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerCode.toLowerCase().includes(search.toLowerCase()) ||
        o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchDate = !dateFilter || o.date === dateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, statusFilter, dateFilter]);

  const totalValue = filtered.reduce((s, o) => s + o.total, 0);
  const totalCylinders = filtered.reduce((s, o) => s + o.totalQty, 0);

  // Real CSV Export
  const handleExportCSV = () => {
    const headers = ["Order Number", "Order Date", "Customer Code", "Customer Name", "Product", "Qty", "Total (INR)", "Status"];
    const rows = filtered.map(o => [
      o.num,
      o.date,
      o.customerCode,
      `"${o.customerName}"`,
      `"${o.items.map(i => `${i.productName} (${i.qty})`).join(", ")}"`,
      o.totalQty,
      o.total,
      o.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BGS_Orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Orders Management</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {orders.length} total orders · {orders.filter(o => o.status === "confirmed" || o.status === "pending_dispatch").length} active pipeline · {INR(orders.reduce((s, o) => s + o.total, 0))} total turnover
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
            <Plus size={14} /> + New Order
          </Link>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => {
          const cnt = orders.filter(o => o.status === k).length;
          const sel = statusFilter === k;
          return (
            <button
              key={k}
              onClick={() => setStatusFilter(sel ? "all" : k)}
              style={{
                background: sel ? v.bg : "#fff",
                border: `2px solid ${sel ? v.color : "#e2e8f0"}`,
                borderRadius: 10, padding: 12, textAlign: "center",
                transition: "all .15s", cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: v.color }}>{cnt}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: v.color, marginTop: 2 }}>{v.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0",
          borderRadius: 8, padding: "8px 13px", flex: 1, minWidth: 240, background: "#f8fafc"
        }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search order #, customer, code, cylinder..."
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
          onChange={e => setStatusFilter(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 13px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
        >
          <option value="all">All Statuses ({orders.length})</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label} ({orders.filter(o => o.status === k).length})</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 13px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            style={{ fontSize: 12, color: "#f97316", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            Clear Date
          </button>
        )}

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
          {filtered.length} orders · {totalCylinders} cylinders · {INR(totalValue)}
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Order #", "Customer", "Product / Cylinder", "Quantity", "Total Amount", "Status", "Order Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(o => {
                  const s = STATUS_CONFIG[o.status] || STATUS_CONFIG.confirmed;
                  const firstItem = o.items[0];
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: "1px solid #e2e8f0", transition: "background .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <Link href={`/orders/${o.id}`} style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12.5, textDecoration: "none" }}>
                          {o.num}
                        </Link>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <Link href={`/customers/${o.customerId}`} style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", textDecoration: "none", display: "block" }}>
                          {o.customerName}
                        </Link>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{o.customerCode}</div>
                      </td>
                      <td style={{ padding: "13px 16px", color: "#475569", fontSize: 12.5 }}>
                        {firstItem?.productName || "LPG Cylinder"}
                        {o.items.length > 1 && <span style={{ color: "#94a3b8", marginLeft: 4 }}>+{o.items.length - 1} more</span>}
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                        {o.totalQty} cyl
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 800, fontSize: 13.5, color: "#1e293b" }}>
                        {INR(o.total)}
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
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {o.date}
                      </td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Link
                            href={`/orders/${o.id}`}
                            style={{
                              padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                              fontWeight: 600, background: "#f0f4fa", color: "#1e3a8a",
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
                            }}
                          >
                            <Eye size={13} /> View
                          </Link>

                          {o.status === "confirmed" && (
                            <button
                              onClick={() => updateOrderStatus(o.id, "approved")}
                              style={{
                                padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                                fontWeight: 600, background: "#ede9fe", color: "#6d28d9",
                                border: "none", cursor: "pointer"
                              }}
                              title="Approve Order"
                            >
                              Approve
                            </button>
                          )}

                          {o.status === "approved" && (
                            <button
                              onClick={() => updateOrderStatus(o.id, "pending_dispatch")}
                              style={{
                                padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                                fontWeight: 600, background: "#fef3c7", color: "#92400e",
                                border: "none", cursor: "pointer"
                              }}
                              title="Mark Ready for Dispatch"
                            >
                              Dispatch
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

        {/* Footer info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
          <span>Showing {filtered.length} of {orders.length} total orders</span>
          <span>Click any order number to inspect line items, driver dispatch & invoice status</span>
        </div>
      </div>
    </div>
  );
}
