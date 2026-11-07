"use client";
import { useState } from "react";
import { IndianRupee, TrendingUp, AlertCircle, Download, FileSpreadsheet, Percent, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { useERPStore } from "@/lib/store";

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

export default function FinancialReportsPage() {
  const { invoices, payments, customers } = useERPStore();

  const totalBilled = invoices.reduce((s, d) => s + d.total, 0);
  const totalCollected = payments.reduce((s, d) => s + d.amount, 0);
  const totalReceivables = customers.reduce((s, c) => s + (c.outstanding || 0), 0);
  const efficiency = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Financial Performance & Audit Report</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            P&L revenue tracking, collections efficiency, and receivables aging audit
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Gross Invoiced Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a", marginTop: 6 }}>{LAKHS(totalBilled)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Across {invoices.length} posted invoices</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Realized Collections</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a", marginTop: 6 }}>{LAKHS(totalCollected)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Across {payments.length} cleared receipts</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Current Receivables (Dr)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", marginTop: 6 }}>{LAKHS(totalReceivables)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Total customer debit balance</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Collection Efficiency</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed", marginTop: 6 }}>
            {efficiency !== "—" ? `${efficiency}%` : "100%"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Realized vs Invoiced ratio</div>
        </div>
      </div>

      {/* Financial Status Banner */}
      <div style={{ ...card(), padding: 24, textAlign: totalBilled === 0 ? "center" : "left" }}>
        {totalBilled === 0 ? (
          <div>
            <IndianRupee size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Financial Position Initialized</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4, maxWidth: 500, margin: "4px auto 0" }}>
              Today&apos;s Payments: ₹0 · Invoices: 0. Real financial transactions, margins, and tax audits will accumulate here as sales orders and bank receipts are logged.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Audited Net Realization</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
                Net realization is tracking at ₹{totalCollected.toLocaleString("en-IN")} against invoiced ₹{totalBilled.toLocaleString("en-IN")}.
              </div>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
              Audit Active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
