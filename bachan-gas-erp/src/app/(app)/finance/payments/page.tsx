"use client";
import { useState, useTransition } from "react";
import { CreditCard, Plus, Search, Download, CheckCircle2, Calendar, FileText, ArrowDownLeft, X } from "lucide-react";
import { useERPStore, PaymentReceipt } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function PaymentsPage() {
  const { payments, customers, recordPayment } = useERPStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  // New Payment Form state
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("Bank Transfer (NEFT)");
  const [refNum, setRefNum] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const totalAll = payments.reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter(p =>
    !search ||
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.num.toLowerCase().includes(search.toLowerCase()) ||
    p.customerCode.toLowerCase().includes(search.toLowerCase()) ||
    p.ref.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMsg({ type: "error", text: "Please enter a valid payment amount." });
      return;
    }
    if (!selectedCustId) {
      setMsg({ type: "error", text: "Please select a customer account." });
      return;
    }

    startTransition(() => {
      try {
        const rcpt = recordPayment({
          customerId: selectedCustId,
          amount: amt,
          date: payDate,
          method,
          ref: refNum,
        });
        setMsg({ type: "success", text: `Receipt ${rcpt.num} recorded successfully!` });
        setAmount("");
        setRefNum("");
        setTimeout(() => {
          setShowForm(false);
          setMsg(null);
        }, 1000);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Failed to record payment receipt." });
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ["Receipt #", "Customer Name", "Customer Code", "Receipt Date", "Amount (₹)", "Payment Method", "Reference / Transaction ID", "Status"];
    const rows = filtered.map(p => [
      p.num,
      `"${p.customerName}"`,
      p.customerCode,
      p.date,
      p.amount,
      `"${p.method}"`,
      `"${p.ref}"`,
      p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Receipts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Payment Collections</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Receipt vouchers, cash/bank payments, and customer credit ledger updates
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Download size={14} /> Export Receipts
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
            <Plus size={14} /> Record Payment
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <ArrowDownLeft size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Collections Realized</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>{INR(totalAll)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Across all cleared receipts</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <FileText size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Receipts Cleared</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>{payments.length} Receipts</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Bank & Cash vouchers</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7c3aed", marginBottom: 8 }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Ledger Integration</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed" }}>Live Double-Entry</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Automatically updates customer balance</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 240, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, receipt #, transaction reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, width: "100%" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {payments.length} payment receipts
        </span>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Receipt #", "Customer Account", "Date", "Amount (₹)", "Payment Method", "Reference ID", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <CreditCard size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, color: "#334155" }}>Today&apos;s Payments: ₹0</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    No payment collection receipts recorded yet. Click &quot;Record Payment&quot; to credit a customer account.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, fontSize: 12.5, color: "#1e3a8a" }}>{p.num}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.customerName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Code: {p.customerCode}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{p.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                    {INR(p.amount)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600 }}>{p.method}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>{p.ref}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                      ✓ Cleared
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Record Customer Payment Receipt</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {msg && (
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: msg.type === "error" ? "#fee2e2" : "#dcfce7", color: msg.type === "error" ? "#b91c1c" : "#15803d" }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: "18px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Select Customer *</label>
                <select
                  required
                  value={selectedCustId}
                  onChange={e => setSelectedCustId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#f8fafc" }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.outstanding !== null ? `Due: ₹${c.outstanding.toLocaleString("en-IN")}` : "Unconfigured"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 25000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Payment Method *</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#f8fafc" }}>
                  <option>Bank Transfer (NEFT)</option>
                  <option>Bank Transfer (RTGS)</option>
                  <option>UPI Payment</option>
                  <option>Cheque Deposit</option>
                  <option>Cash Receipt</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Cheque / UTR / Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-98231024 or Cheque #004521"
                  value={refNum}
                  onChange={e => setRefNum(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>Cancel</button>
                <button type="submit" disabled={pending} style={{ padding: "8px 18px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>
                  {pending ? "Saving..." : "✓ Record & Update Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
