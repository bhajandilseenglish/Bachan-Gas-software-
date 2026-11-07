"use client";
import { useState } from "react";
import Link from "next/link";
import { CreditCard, AlertTriangle, ShieldCheck, TrendingUp, Search, Edit3, X, Check } from "lucide-react";
import { useERPStore, Customer } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};
const LAKHS = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  if (n === 0) return "₹0";
  return n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${(n/1000).toFixed(1)}k`;
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function CreditManagementPage() {
  const { customers, updateCreditLimit } = useERPStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"high_risk"|"moderate">("all");
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [newTerms, setNewTerms] = useState("Net 30 Days");

  const totalLimits = customers.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const totalUsed = customers.reduce((s, c) => s + (c.outstanding || 0), 0);
  const totalAvailable = totalLimits > 0 ? Math.max(0, totalLimits - totalUsed) : null;
  const highRiskCount = customers.filter(c => (c.credit_limit || 0) > 0 && ((c.outstanding || 0) / c.credit_limit!) >= 0.9).length;

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());

    const limit = c.credit_limit || 0;
    const pct = limit > 0 ? (c.outstanding || 0) / limit : 0;
    if (filter === "high_risk") return matchesSearch && pct >= 0.9;
    if (filter === "moderate") return matchesSearch && pct >= 0.7 && pct < 0.9;
    return matchesSearch;
  });

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust) return;
    const lim = parseFloat(newLimit);
    if (isNaN(lim) || lim < 0) return;

    updateCreditLimit(editingCust.id, lim, newTerms);
    setEditingCust(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Credit Limit Management</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Monitor credit exposures, sanction limits, and manage repayment terms across registered consumers
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <ShieldCheck size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Sanctioned Credit</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>
            {totalLimits > 0 ? LAKHS(totalLimits) : "Not Configured"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {customers.filter(c => (c.credit_limit || 0) > 0).length} accounts with sanctioned limits
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", marginBottom: 8 }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Utilized Credit</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626" }}>{LAKHS(totalUsed)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {totalLimits > 0 ? `${((totalUsed / totalLimits) * 100).toFixed(1)}% of total sanction` : "Credit terms unconfigured"}
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <CreditCard size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Available Credit Room</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>
            {totalAvailable !== null ? LAKHS(totalAvailable) : "Not Configured"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Safe borrowing cushion</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: highRiskCount > 0 ? "#dc2626" : "#16a34a", marginBottom: 8 }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Near Limit (&gt;90%)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: highRiskCount > 0 ? "#dc2626" : "#16a34a" }}>
            {highRiskCount} Accounts
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Require dispatch hold review</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 240, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, code, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "all", label: "All Customers" },
            { id: "high_risk", label: "High Risk (>90%)" },
            { id: "moderate", label: "Moderate (70–90%)" },
          ].map(b => (
            <button key={b.id} onClick={() => setFilter(b.id as any)}
              style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1.5px solid", borderColor: filter === b.id ? "#1e3a8a" : "#e2e8f0", background: filter === b.id ? "#1e3a8a" : "#fff", color: filter === b.id ? "#fff" : "#64748b", cursor: "pointer" }}>
              {b.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {customers.length} accounts
        </span>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Customer", "Credit Limit (₹)", "Current Debit (₹)", "Available Room (₹)", "Utilization", "Payment Terms", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(c => {
              const lim = c.credit_limit;
              const out = c.outstanding || 0;
              const pct = (lim || 0) > 0 ? (out / lim!) * 100 : 0;
              const barCol = pct >= 90 ? "#dc2626" : pct >= 70 ? "#f97316" : "#16a34a";
              const avail = lim !== null ? Math.max(0, lim - out) : null;

              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Code: {c.code} · {c.city}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>
                    {lim !== null ? `₹${lim.toLocaleString("en-IN")}` : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11.5 }}>Not Configured</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: out > 0 ? "#dc2626" : "#64748b" }}>
                    {c.outstanding !== null ? `₹${out.toLocaleString("en-IN")}` : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11.5 }}>Not Yet Configured</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                    {avail !== null ? `₹${avail.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", minWidth: 140 }}>
                    {(lim || 0) > 0 ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: barCol, marginBottom: 4 }}>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, background: "#f0f4fa", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: barCol, borderRadius: 100 }} />
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{c.payment_terms}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => {
                        setEditingCust(c);
                        setNewLimit(c.credit_limit !== null ? String(c.credit_limit) : "");
                        setNewTerms(c.payment_terms !== "Not Yet Configured" ? c.payment_terms : "Net 30 Days");
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}
                    >
                      <Edit3 size={12} /> Set Limit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 50 && (
          <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "#64748b", background: "#f8fafc" }}>
            Showing top 50 of {filtered.length} matching accounts. Use search to filter specific customers.
          </div>
        )}
      </div>

      {/* Edit Limit Modal */}
      {editingCust && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Update Credit Limit — {editingCust.name}</h3>
            <form onSubmit={handleSaveLimit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Sanctioned Limit (₹)</label>
                <input type="number" required placeholder="e.g. 100000" value={newLimit} onChange={e => setNewLimit(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Payment Terms</label>
                <select value={newTerms} onChange={e => setNewTerms(e.target.value)} style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc" }}>
                  <option>Net 7 Days</option>
                  <option>Net 15 Days</option>
                  <option>Net 30 Days</option>
                  <option>Net 45 Days</option>
                  <option>Cash on Delivery</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setEditingCust(null)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>✓ Save Credit Terms</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
