"use client";
import { useState } from "react";
import { History, Search, Download } from "lucide-react";
import { useERPStore } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function RateHistoryPage() {
  const { auditLogs } = useERPStore();
  const [search, setSearch] = useState("");

  const rateLogs = auditLogs.filter(a => a.action === "rate_change");

  const filtered = rateLogs.filter(r =>
    !search ||
    r.resource.toLowerCase().includes(search.toLowerCase()) ||
    (r.details && r.details.toLowerCase().includes(search.toLowerCase())) ||
    r.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Rate Change Audit Log</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Immutable historical record of cylinder product rate modifications and authorized adjustments
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Timestamp", "Target Customer / Resource", "Rate Adjustment Details", "Authorized By", "Source IP"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <History size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, color: "#334155" }}>No Rate Revisions Recorded Yet</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Authorized contract rate approvals and price revisions will appear here automatically.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>{r.timestamp}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{r.resource}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#1e3a8a", fontWeight: 600 }}>{r.details || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5 }}>{r.user}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>{r.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
