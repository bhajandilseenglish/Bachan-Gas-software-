"use client";
import { useState } from "react";
import Link from "next/link";
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Plus, Calendar, Layers } from "lucide-react";
import { useERPStore, ImportBatch } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ImportsPage() {
  const { importBatches } = useERPStore();

  const handleDownloadLog = (batch: ImportBatch) => {
    const headers = ["Batch ID", "Filename", "Date", "Import Type", "Total Records", "Valid Imported", "Duplicates", "Status"];
    const row = [
      batch.batch,
      `"${batch.name}"`,
      `"${batch.date}"`,
      `"${batch.type}"`,
      batch.total,
      batch.valid,
      batch.duplicates,
      batch.status,
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_Import_${batch.batch}_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllLogs = () => {
    const headers = ["Batch ID", "Filename", "Date", "Import Type", "Total Records", "Valid Imported", "Duplicates", "Status"];
    const rows = importBatches.map(b => [
      b.batch,
      `"${b.name}"`,
      `"${b.date}"`,
      `"${b.type}"`,
      b.total,
      b.valid,
      b.duplicates,
      b.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_All_Import_Batches_${new Date().toISOString().split("T")[0]}.csv`);
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
            Excel & CSV Import History
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Audit log of customer registers, opening balances, and contract pricing batches
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {importBatches.length > 0 && (
            <button
              onClick={handleDownloadAllLogs}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                background: "#f1f5f9", color: "#1e293b", border: "1px solid #cbd5e1", cursor: "pointer"
              }}
            >
              <Download size={14} /> Export All Logs (CSV)
            </button>
          )}
          <Link
            href="/customers/import"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              background: "#f97316", color: "#fff", textDecoration: "none"
            }}
          >
            <Upload size={14} /> New Bulk Import
          </Link>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Batch ID", "Filename", "Import Type", "Date & Time", "Total Rows", "Imported", "Duplicates", "Status", "Download Log"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {importBatches.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No import batches logged yet.
                </td>
              </tr>
            ) : (
              importBatches.map(b => (
                <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{b.batch}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{b.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#dbeafe", color: "#1d4ed8" }}>
                      {b.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{b.date}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{b.total.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#16a34a", fontSize: 13 }}>{b.valid.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px", color: b.duplicates > 0 ? "#dc2626" : "#64748b", fontSize: 13 }}>{b.duplicates}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleDownloadLog(b)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: "#f97316", background: "#fff7ed", border: "1px solid #ffedd5", cursor: "pointer" }}
                      title="Download batch CSV report"
                    >
                      <Download size={12} /> Log CSV
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Batches Cards */}
      <div className="mobile-only-cards" style={{ display: "none" }}>
        {importBatches.length === 0 ? (
          <div style={{ ...card(), padding: 30, textAlign: "center", color: "#64748b" }}>
            No import batches recorded.
          </div>
        ) : (
          importBatches.map(b => (
            <div key={b.id} style={{ ...card(), padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{b.batch}</span>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginTop: 2 }}>{b.name}</div>
                </div>
                <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "#dcfce7", color: "#15803d" }}>
                  {b.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", margin: "8px 0" }}>
                Type: <strong style={{ color: "#1e293b" }}>{b.type}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                <span>Imported: <strong style={{ color: "#16a34a" }}>{b.valid}</strong> / {b.total}</span>
                <span>Duplicates: <strong>{b.duplicates}</strong></span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{b.date}</span>
                <button
                  onClick={() => handleDownloadLog(b)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#f97316", background: "#fff7ed", border: "1px solid #ffedd5" }}
                >
                  <Download size={12} /> Log CSV
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
