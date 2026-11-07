"use client";
import { useState } from "react";
import { BookOpen, Search, Download, Calendar, ArrowUpRight, ArrowDownLeft, FileText, Printer, CheckCircle } from "lucide-react";
import { useERPStore } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Yet Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function LedgerPage() {
  const { customers, ledger } = useERPStore();
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || "");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const currentCust = customers.find(c => c.id === selectedCustId || c.code === selectedCustId) || customers[0];
  const entries = currentCust ? ledger.filter(l => l.customerId === currentCust.id) : [];

  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const closingBalance = currentCust?.outstanding;

  const handleExportCSV = () => {
    if (!currentCust) return;
    const headers = ["Date", "Voucher Ref", "Transaction Type", "Particulars / Description", "Debit (Dr)", "Credit (Cr)", "Running Balance"];
    const rows = entries.map(l => [
      l.date,
      l.ref,
      `"${l.type}"`,
      `"${l.desc}"`,
      l.debit,
      l.credit,
      l.balance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_${currentCust.code}_${currentCust.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Customer Ledger</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Double-entry financial ledger statements with running debit/credit audit trail
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Printer size={14} /> Print
          </button>
          <button onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
            <Download size={14} /> Export Statement (CSV)
          </button>
        </div>
      </div>

      {/* Selector & Filters */}
      <div style={{ ...card(), padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            Select Customer Account ({customers.length} verified accounts)
          </label>
          <select
            value={selectedCustId}
            onChange={e => setSelectedCustId(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600, color: "#1e293b", background: "#f8fafc", outline: "none", cursor: "pointer" }}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) — {c.city}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
              From Date
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
              To Date
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc", outline: "none" }} />
          </div>
        </div>
      </div>

      {currentCust && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="stat-grid-4">
            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Customer Opening Balance</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", marginTop: 4 }}>
                {currentCust.outstanding !== null ? INR(0) : "Not Yet Configured"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {currentCust.outstanding !== null ? "Financial position initialized" : "Opening balance unconfigured"}
              </div>
            </div>

            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Invoiced Debits</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1e3a8a", marginTop: 4 }}>{INR(totalDebits)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Across {entries.filter(e => e.debit > 0).length} invoice vouchers</div>
            </div>

            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Payments Credited</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a", marginTop: 4 }}>{INR(totalCredits)}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Across {entries.filter(e => e.credit > 0).length} receipts cleared</div>
            </div>

            <div style={{ ...card(), padding: "14px 16px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: (closingBalance || 0) > 0 ? "#dc2626" : "#16a34a", textTransform: "uppercase", letterSpacing: ".05em" }}>
                Current Closing Balance
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: (closingBalance || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
                {closingBalance !== null ? INR(closingBalance) : "Not Yet Configured"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {closingBalance !== null ? "Net balance due" : "No posted debit/credit vouchers"}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                Statement of Account — {currentCust.name} ({currentCust.code})
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{entries.length} transactions recorded</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Date", "Voucher Ref", "Voucher Type", "Particulars", "Debit (₹)", "Credit (₹)", "Running Balance (₹)"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                      <BookOpen size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontWeight: 700, color: "#334155" }}>No Ledger Vouchers Recorded Yet</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        Customer Opening Balance: Not Yet Configured. Sales invoices and payment receipts will generate entries here automatically.
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((e, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>{e.date}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>{e.ref}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600 }}>{e.type}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#1e293b" }}>{e.desc}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: e.debit > 0 ? 800 : 400, color: e.debit > 0 ? "#dc2626" : "#64748b" }}>
                        {e.debit > 0 ? `₹${e.debit.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: e.credit > 0 ? 800 : 400, color: e.credit > 0 ? "#16a34a" : "#64748b" }}>
                        {e.credit > 0 ? `₹${e.credit.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
                        ₹{e.balance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
