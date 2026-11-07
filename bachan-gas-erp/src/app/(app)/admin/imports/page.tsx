"use client";
import { useState } from "react";
import Link from "next/link";
import { Upload, FileText, CheckCircle, AlertTriangle, Download, Plus } from "lucide-react";

const IMPORT_BATCHES = [
  { id: "1", batch: "BATCH-20261101-01", name: "Commercial_Customer_Register_Nov2026.xlsx", date: "01 Nov 2026, 11:30 AM", type: "Customer Master", total: 428, valid: 428, duplicates: 0, status: "completed" },
  { id: "2", batch: "BATCH-20261025-02", name: "Opening_Balances_FY2026.xlsx", date: "25 Oct 2026, 04:15 PM", type: "Opening Balances", total: 186, valid: 184, duplicates: 2, status: "completed" },
  { id: "3", batch: "BATCH-20261015-01", name: "Contract_Rates_Oct2026.csv", date: "15 Oct 2026, 02:00 PM", type: "Customer Rates", total: 45, valid: 45, duplicates: 0, status: "completed" },
];

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ImportsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Excel Import History</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Batch processing history for customer register, opening balance, and rate imports
          </p>
        </div>
        <Link href="/customers/import"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", textDecoration: "none" }}>
          <Upload size={14} /> New Bulk Import
        </Link>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Batch ID","Filename","Import Type","Date & Time","Total Rows","Imported","Duplicates","Status","Report"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMPORT_BATCHES.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>{b.batch}</span></td>
                <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{b.name}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#dbeafe", color: "#1d4ed8" }}>
                    {b.type}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{b.date}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{b.total}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#16a34a", fontSize: 13 }}>{b.valid}</td>
                <td style={{ padding: "12px 16px", color: b.duplicates > 0 ? "#dc2626" : "#64748b", fontSize: 13 }}>{b.duplicates}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => alert("Downloading import batch report")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: "#f97316", background: "#fff7ed", border: "none", cursor: "pointer" }}>
                    <Download size={12} /> Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
