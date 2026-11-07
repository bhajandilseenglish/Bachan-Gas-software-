"use client";
import { useState } from "react";
import Link from "next/link";
import { Receipt, AlertCircle, Users, BarChart3, Download, Search, ChevronRight } from "lucide-react";
import { useERPStore } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Yet Configured";
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

export default function OutstandingPage() {
  const { customers } = useERPStore();
  const [filter, setFilter] = useState<"all"|"overdue"|"configured">("all");
  const [search, setSearch] = useState("");

  const configuredCusts = customers.filter(c => c.outstanding !== null);
  const total = configuredCusts.reduce((s, c) => s + (c.outstanding || 0), 0);
  const totalOverdue = customers.reduce((s, c) => s + (c.overdue || 0), 0);

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());

    if (filter === "overdue") return matchesSearch && (c.overdue || 0) > 0;
    if (filter === "configured") return matchesSearch && c.outstanding !== null;
    return matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ["Customer Name", "Consumer Code", "City", "Outstanding Debit (₹)", "Overdue (₹)", "Sanctioned Limit (₹)", "Payment Terms", "Last Supply Date"];
    const rows = filtered.map(c => [
      `"${c.name}"`,
      c.code,
      `"${c.city}"`,
      c.outstanding !== null ? c.outstanding : "Not Yet Configured",
      c.overdue || 0,
      c.credit_limit !== null ? c.credit_limit : "Not Configured",
      `"${c.payment_terms}"`,
      c.last_supply
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Outstanding_Aging_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Outstanding Receivables</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Customer balance tracking, credit exposure monitoring, and overdue debit reconciliation
          </p>
        </div>
        <button onClick={handleExportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
          <Download size={14} /> Export Aging Report
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", marginBottom: 8 }}>
            <Receipt size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Receivables</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626" }}>
            {configuredCusts.length > 0 ? INR(total) : "Not Configured"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {configuredCusts.length > 0 ? `Across ${configuredCusts.length} debit accounts` : "Customer opening balances not yet configured"}
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: totalOverdue > 0 ? "#dc2626" : "#16a34a", marginBottom: 8 }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Overdue (&gt;30 Days)</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: totalOverdue > 0 ? "#dc2626" : "#16a34a" }}>
            {totalOverdue > 0 ? INR(totalOverdue) : "₹0"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {totalOverdue > 0 ? "Requires payment recovery" : "Zero overdue accounts"}
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <Users size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Consumer Base</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>{customers.length} Accounts</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Active commercial accounts</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7c3aed", marginBottom: 8 }}>
            <BarChart3 size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Opening Balance Status</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#7c3aed" }}>
            {configuredCusts.length} Configured
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            {customers.length - configuredCusts.length} unconfigured accounts
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 240, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, consumer code, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "all", label: "All Accounts" },
            { id: "configured", label: "Configured Balances" },
            { id: "overdue", label: "Overdue Only" },
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
              {["Customer", "City / Area", "Outstanding Due (₹)", "Overdue (₹)", "Credit Limit (₹)", "Payment Terms", "Last Supply", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Code: {c.code}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#1e293b" }}>{c.city}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: (c.outstanding || 0) > 0 ? "#dc2626" : "#64748b" }}>
                  {c.outstanding !== null ? INR(c.outstanding) : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11.5 }}>Not Yet Configured</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: (c.overdue || 0) > 0 ? "#dc2626" : "#16a34a" }}>
                  {(c.overdue || 0) > 0 ? INR(c.overdue) : "₹0"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>
                  {c.credit_limit !== null ? INR(c.credit_limit) : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11.5 }}>Not Configured</span>}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{c.payment_terms}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{c.last_supply}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Link href={`/customers/${c.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>
                    Profile <ChevronRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 50 && (
          <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "#64748b", background: "#f8fafc" }}>
            Showing top 50 of {filtered.length} accounts. Use search to filter specific customers.
          </div>
        )}
      </div>
    </div>
  );
}
