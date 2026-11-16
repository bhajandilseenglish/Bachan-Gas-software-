"use client";
import { useState } from "react";
import { ScrollText, Search, Download, Filter, RotateCcw, X, Shield, Clock } from "lucide-react";
import { useERPStore, AuditLog } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

const ACOLOR: Record<string, { bg: string; color: string; label: string }> = {
  create:      { bg: "#dcfce7", color: "#15803d", label: "CREATE" },
  update:      { bg: "#dbeafe", color: "#1d4ed8", label: "UPDATE" },
  approve:     { bg: "#ede9fe", color: "#6d28d9", label: "APPROVE" },
  dispatch:    { bg: "#ffedd5", color: "#c2410c", label: "DISPATCH" },
  deliver:     { bg: "#ecfdf5", color: "#047857", label: "DELIVER" },
  post:        { bg: "#fef3c7", color: "#92400e", label: "POST INV" },
  payment:     { bg: "#d1fae5", color: "#065f46", label: "PAYMENT" },
  rate_change: { bg: "#fce7f3", color: "#9d174d", label: "RATE CHG" },
};

export default function AuditPage() {
  const { auditLogs } = useERPStore();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = auditLogs.filter(l => {
    const ms = !search ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase())) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.ip.includes(search);
    const ma = actionFilter === "all" || l.action === actionFilter;
    return ms && ma;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "User", "Action", "Resource", "Details", "IP Address"];
    const rows = filtered.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      l.action,
      `"${l.resource}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ip,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
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
            Enterprise System Audit Logs
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Immutable chronological record of administrative actions, invoice postings, and dispatch authorizations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            background: "#f1f5f9", color: "#1e293b", border: "1px solid #cbd5e1", cursor: "pointer"
          }}
        >
          <Download size={14} /> Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by action, resource, details, or user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="approve">Approve</option>
            <option value="dispatch">Dispatch</option>
            <option value="deliver">Deliver</option>
            <option value="post">Invoice Posting</option>
            <option value="payment">Payment Receipt</option>
            <option value="rate_change">Rate Revision</option>
          </select>

          {(search || actionFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setActionFilter("all"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fee2e2", border: "none", cursor: "pointer" }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {auditLogs.length} events
        </div>
      </div>

      {/* Desktop Table */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Timestamp", "User / Operator", "Action", "Target Resource", "Event Details", "Source IP"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No audit log entries matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => {
                const c = ACOLOR[l.action] || { bg: "#f1f5f9", color: "#475569", label: l.action };
                return (
                  <tr key={l.id || i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {l.timestamp}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                      {l.user}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: c.bg, color: c.color, letterSpacing: ".04em" }}>
                        {c.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1e3a8a" }}>
                      {l.resource}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                      {l.details || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                      {l.ip}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Audit Cards */}
      <div className="mobile-only-cards" style={{ display: "none" }}>
        {filtered.length === 0 ? (
          <div style={{ ...card(), padding: 30, textAlign: "center", color: "#64748b" }}>
            No audit logs found.
          </div>
        ) : (
          filtered.map((l, i) => {
            const c = ACOLOR[l.action] || { bg: "#f1f5f9", color: "#475569", label: l.action };
            return (
              <div key={l.id || i} style={{ ...card(), padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: c.bg, color: c.color }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{l.timestamp}</span>
                </div>

                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a", margin: "4px 0" }}>
                  {l.resource}
                </div>

                <div style={{ fontSize: 12.5, color: "#475569", margin: "6px 0 10px", lineHeight: 1.4 }}>
                  {l.details || "No details provided"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                  <span>User: <strong style={{ color: "#1e293b" }}>{l.user}</strong></span>
                  <span style={{ fontFamily: "monospace" }}>IP: {l.ip}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
