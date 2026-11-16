"use client";
import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, AlertTriangle, ShieldCheck, Search, Edit3, X, Check, ArrowRight } from "lucide-react";
import { useERPStore, Customer } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function PaymentTenurePage() {
  const { customers, updateCustomerTenureAndCredit, currentUserRole } = useERPStore();
  const [search, setSearch] = useState("");
  const [filterTenure, setFilterTenure] = useState<string>("all");
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [newTenure, setNewTenure] = useState<number>(15);

  const isAdmin = currentUserRole === "admin";

  const tenureBreakdown = {
    immediate: customers.filter(c => (c.payment_tenure_days || 0) === 0).length,
    days7: customers.filter(c => (c.payment_tenure_days || 0) === 7).length,
    days15: customers.filter(c => (c.payment_tenure_days || 0) === 15).length,
    days30: customers.filter(c => (c.payment_tenure_days || 0) === 30).length,
    custom: customers.filter(c => {
      const d = c.payment_tenure_days || 0;
      return d > 0 && d !== 7 && d !== 15 && d !== 30;
    }).length,
  };

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());

    const tenure = c.payment_tenure_days ?? 15;
    if (filterTenure === "immediate") return matchesSearch && tenure === 0;
    if (filterTenure === "7") return matchesSearch && tenure === 7;
    if (filterTenure === "15") return matchesSearch && tenure === 15;
    if (filterTenure === "30") return matchesSearch && tenure === 30;
    if (filterTenure === "custom") return matchesSearch && ![0, 7, 15, 30].includes(tenure);
    return matchesSearch;
  });

  const handleSaveTenure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust) return;
    if (!isAdmin) {
      alert("Staff accounts cannot modify payment tenure. Please ask an Admin.");
      return;
    }
    updateCustomerTenureAndCredit(editingCust.id, newTenure, editingCust.credit_limit || 0);
    setEditingCust(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Payment Tenure Management</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Configure credit payment days per customer. Due dates on invoices calculate automatically as (Invoice Date + Payment Tenure).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, fontWeight: 700, background: isAdmin ? "#dbeafe" : "#f1f5f9", color: isAdmin ? "#1e40af" : "#475569" }}>
            Role: {isAdmin ? "Admin (Full Access)" : "Staff (View Only)"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <Clock size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Default Standard (15 Days)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>{tenureBreakdown.days15}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Standard commercial terms</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0891b2", marginBottom: 8 }}>
            <Calendar size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Weekly Terms (7 Days)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0891b2" }}>{tenureBreakdown.days7}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Fast turnaround accounts</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7c3aed", marginBottom: 8 }}>
            <Clock size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Monthly Terms (30 Days)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed" }}>{tenureBreakdown.days30}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Extended credit accounts</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Cash / Advance (0 Days)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>{tenureBreakdown.immediate}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Zero credit grace period</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 260, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, code or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, width: "100%" }}
          />
        </div>

        <select
          value={filterTenure}
          onChange={e => setFilterTenure(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc", outline: "none" }}
        >
          <option value="all">All Payment Tenures</option>
          <option value="immediate">Cash / 0 Days</option>
          <option value="7">7 Days</option>
          <option value="15">15 Days (Standard)</option>
          <option value="30">30 Days</option>
          <option value="custom">Custom Days</option>
        </select>

        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {customers.length} commercial accounts
        </span>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Customer", "Consumer Code", "Payment Tenure", "Invoice Due Date Rule", "Outstanding (₹)", "Credit Limit (₹)", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(c => {
              const tenure = c.payment_tenure_days ?? 15;
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/customers/${c.id}`} style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", textDecoration: "none" }}>
                      {c.name}
                    </Link>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{c.city || "Ludhiana"}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, color: "#1e3a8a" }}>
                    {c.code}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 700,
                      background: tenure === 0 ? "#f1f5f9" : tenure <= 7 ? "#ecfdf5" : tenure <= 15 ? "#eff6ff" : "#fef3c7",
                      color: tenure === 0 ? "#475569" : tenure <= 7 ? "#059669" : tenure <= 15 ? "#2563eb" : "#d97706"
                    }}>
                      {tenure === 0 ? "Immediate (Cash)" : `${tenure} Days`}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>
                    Invoice Date + {tenure} Days
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: (c.outstanding || 0) > 0 ? "#dc2626" : "#64748b" }}>
                    {INR(c.outstanding)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#334155" }}>
                    {INR(c.credit_limit)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setEditingCust(c);
                          setNewTenure(c.payment_tenure_days ?? 15);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#1e3a8a" }}
                      >
                        <Edit3 size={12} /> Configure Tenure
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>Admin Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 100 && (
          <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            Displaying first 100 accounts of {filtered.length}. Use search to narrow down records.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCust && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Configure Payment Tenure</div>
              <button onClick={() => setEditingCust(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTenure} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
                  {editingCust.name} ({editingCust.code})
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Payment Tenure (Permitted Days for Payment)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                  {[0, 7, 15, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setNewTenure(days)}
                      style={{
                        padding: "8px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: newTenure === days ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                        background: newTenure === days ? "#eff6ff" : "#fff",
                        color: newTenure === days ? "#1d4ed8" : "#334155",
                        cursor: "pointer"
                      }}
                    >
                      {days === 0 ? "Immediate" : `${days} Days`}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Or Custom:</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={newTenure}
                    onChange={e => setNewTenure(parseInt(e.target.value) || 0)}
                    style={{ width: 100, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 700, outline: "none" }}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Days</span>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12, color: "#475569" }}>
                <strong>Business Rule:</strong> When an invoice is created, its statutory due date will be calculated as <code>Invoice Date + {newTenure} Days</code>. If overdue, it will automatically alert the credit desk.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingCust(null)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
                >
                  Save Tenure Setting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
