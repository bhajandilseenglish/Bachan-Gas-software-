"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign, Upload, Download, CheckCircle2, AlertCircle,
  Search, ShieldAlert, ArrowLeft, RefreshCw, FileText, Check, Plus
} from "lucide-react";
import { useERPStore, Customer } from "@/lib/store";

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "1.5px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
};

export default function OpeningBalancesPage() {
  const {
    customers,
    currentUserRole,
    currentSessionUser,
    setCustomerOpeningBalance,
    bulkImportOpeningBalances,
  } = useERPStore();

  const isAdmin = currentUserRole === "admin";

  // Single adjustment state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk import state
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  // Filtered customer list for search
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.mobile && c.mobile.includes(customerSearch))
      ).slice(0, 8)
    : [];

  const configuredCount = customers.filter(c => c.is_financial_configured || c.outstanding !== null).length;
  const unconfiguredCount = customers.length - configuredCount;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedCustomerId) {
      setFeedback({ type: "error", text: "Please select a customer account." });
      return;
    }
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount < 0) {
      setFeedback({ type: "error", text: "Please enter a valid balance amount (₹)." });
      return;
    }

    try {
      setCustomerOpeningBalance(selectedCustomerId, amount, balanceType, asOfDate);
      setFeedback({
        type: "success",
        text: `Successfully configured Opening Balance of ₹${amount.toLocaleString("en-IN")} (${balanceType.toUpperCase()}) for customer.`,
      });
      setSelectedCustomerId("");
      setCustomerSearch("");
      setBalanceAmount("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to set opening balance." });
    }
  };

  const handleBulkImport = () => {
    setBulkStatus(null);
    if (!bulkCsvText.trim()) {
      setBulkStatus("Error: Paste CSV content with columns (Customer Code, Amount, Type).");
      return;
    }

    const lines = bulkCsvText.trim().split("\n");
    const records: Array<{ customerCodeOrId: string; balance: number; balanceType: "debit" | "credit"; asOfDate?: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || i === 0 && line.toLowerCase().includes("code")) continue; // Skip header
      const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        const code = parts[0];
        const amount = parseFloat(parts[1]);
        const typeStr = parts[2]?.toLowerCase() === "credit" ? "credit" : "debit";
        const dateStr = parts[3] || asOfDate;
        if (code && !isNaN(amount)) {
          records.push({
            customerCodeOrId: code,
            balance: amount,
            balanceType: typeStr,
            asOfDate: dateStr,
          });
        }
      }
    }

    if (records.length === 0) {
      setBulkStatus("Error: No valid rows could be parsed. Check the CSV format.");
      return;
    }

    const res = bulkImportOpeningBalances(records);
    setBulkStatus(`Batch Processed: ${res.imported} customer opening balances imported successfully. ${res.failed} records unmatched.`);
    setBulkCsvText("");
  };

  const handleDownloadTemplate = () => {
    const header = "Customer Code,Opening Balance Amount,Balance Type (debit/credit),As of Date\n";
    const sample = `${customers[0]?.code || "CX2988723"},12500,debit,2026-11-01\n${customers[1]?.code || "CX3721006"},0,debit,2026-11-01\n`;
    const blob = new Blob([header + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Bachan_Gas_Opening_Balances_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400, margin: "0 auto", paddingBottom: 40 }}>
      {/* Navigation & Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Link
            href="/finance/outstanding"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> Back to Outstanding Receivables
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px", margin: 0 }}>
              Opening Balance Configuration
            </h1>
            <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 4 }}>
              Set verified starting balances for customer accounts as of Go-Live date. Unconfigured accounts will not misreport false zero balances.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              background: "#ffffff",
              color: "#1e3a8a",
              border: "1.5px solid #cbd5e1",
              cursor: "pointer",
            }}
          >
            <Download size={14} /> Download CSV Template
          </button>
        </div>
      </div>

      {/* Role Notice */}
      {!isAdmin && (
        <div style={{ ...cardStyle, background: "#fef3c7", borderColor: "#fde68a", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <ShieldAlert size={20} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#92400e" }}>
              Administrator Privilege Required
            </div>
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
              You are currently logged in as Operations Staff. Opening balance entries and financial adjustments are restricted to authorized Administrators.
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
            Total Customers
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
            {customers.length}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Commercial & domestic accounts in database
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#16a34a" }}>
            Configured Balances
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a", marginTop: 6 }}>
            {configuredCount}
          </div>
          <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
            Accounts with active verified ledger balance
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#d97706" }}>
            Awaiting Configuration
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#d97706", marginTop: 6 }}>
            {unconfiguredCount}
          </div>
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>
            Shown as &quot;Opening Balance Not Configured&quot;
          </div>
        </div>
      </div>

      {/* Main Form Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        {/* Single Customer Configuration Form */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
            Single Customer Opening Balance
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 18px 0" }}>
            Configure or adjust an individual commercial customer&apos;s starting balance.
          </p>

          {feedback && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              background: feedback.type === "success" ? "#dcfce7" : "#fee2e2",
              color: feedback.type === "success" ? "#15803d" : "#b91c1c",
              border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`
            }}>
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSingleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Customer Lookup */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Search Customer Account <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  style={inputStyle}
                  placeholder="Type name, consumer ID (CX...), or mobile..."
                  value={customerSearch}
                  disabled={!isAdmin}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomerId("");
                  }}
                />
                {filteredCustomers.length > 0 && !selectedCustomerId && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    maxHeight: 240,
                    overflowY: "auto",
                  }}>
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch(`${c.name} (${c.code})`);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "9px 12px",
                          border: "none",
                          borderBottom: "1px solid #f1f5f9",
                          background: "#ffffff",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 12.5,
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0f172a" }}>{c.name}</strong>
                          <span style={{ color: "#64748b", marginLeft: 6 }}>({c.code})</span>
                        </div>
                        <span style={{ fontSize: 11, color: c.outstanding !== null ? "#16a34a" : "#d97706" }}>
                          {c.outstanding !== null ? `Current: ₹${c.outstanding}` : "Unconfigured"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Balance Amount & Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Opening Balance Amount (₹) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                  placeholder="e.g. 15000"
                  disabled={!isAdmin}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Balance Type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  style={inputStyle}
                  disabled={!isAdmin}
                  value={balanceType}
                  onChange={(e) => setBalanceType(e.target.value as any)}
                >
                  <option value="debit">Debit (Customer Owes Us)</option>
                  <option value="credit">Credit (Advance Deposited)</option>
                </select>
              </div>
            </div>

            {/* As-Of Date */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                As-Of Date
              </label>
              <input
                type="date"
                style={inputStyle}
                disabled={!isAdmin}
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!isAdmin}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 20px",
                borderRadius: 8,
                background: isAdmin ? "#f97316" : "#cbd5e1",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: isAdmin ? "pointer" : "not-allowed",
                marginTop: 6,
              }}
            >
              <Check size={16} /> Save &amp; Post to Customer Ledger
            </button>
          </form>
        </div>

        {/* Bulk CSV Import Card */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
            Bulk CSV Paste &amp; Import
          </h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px 0" }}>
            Paste comma-separated rows: <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>ConsumerCode,Amount,debit/credit</code>
          </p>

          {bulkStatus && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
              background: bulkStatus.startsWith("Error") ? "#fee2e2" : "#dbeafe",
              color: bulkStatus.startsWith("Error") ? "#b91c1c" : "#1e40af",
            }}>
              {bulkStatus}
            </div>
          )}

          <textarea
            style={{
              ...inputStyle,
              height: 180,
              fontFamily: "monospace",
              fontSize: 12,
              resize: "vertical",
            }}
            placeholder={`CX2988723,12500,debit\nCX3721006,4500,debit\nCX5516154,0,debit`}
            disabled={!isAdmin}
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
          />

          <button
            onClick={handleBulkImport}
            disabled={!isAdmin}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "11px 20px",
              borderRadius: 8,
              background: isAdmin ? "#1e3a8a" : "#cbd5e1",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: isAdmin ? "pointer" : "not-allowed",
              marginTop: 14,
            }}
          >
            <Upload size={16} /> Process Bulk Opening Balances
          </button>
        </div>
      </div>
    </div>
  );
}
