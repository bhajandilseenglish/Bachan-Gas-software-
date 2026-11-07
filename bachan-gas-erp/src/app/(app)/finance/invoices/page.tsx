"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Download, Eye, Printer, X, CheckCircle } from "lucide-react";
import { useERPStore, Invoice } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const ST: Record<string, { bg: string; color: string; label: string }> = {
  draft:          { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  posted:         { bg: "#dbeafe", color: "#1d4ed8", label: "Posted" },
  partially_paid: { bg: "#fef3c7", color: "#92400e", label: "Part. Paid" },
  paid:           { bg: "#dcfce7", color: "#15803d", label: "Paid" },
  overdue:        { bg: "#fee2e2", color: "#991b1b", label: "Overdue" },
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function InvoicesPage() {
  const { invoices } = useERPStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter(inv => {
    const matchesSearch = !search ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.num.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const totalDue = totalInvoiced - totalPaid;

  const handleExportCSV = () => {
    const headers = ["Invoice #", "Order #", "Customer Name", "Customer Code", "Invoice Date", "Due Date", "Particulars", "Total (₹)", "Paid (₹)", "Outstanding (₹)", "Status"];
    const rows = filtered.map(i => [
      i.num,
      i.orderNum,
      `"${i.customerName}"`,
      i.customerCode,
      i.date,
      i.dueDate,
      `"${i.itemsDesc}"`,
      i.total,
      i.paid,
      i.outstanding,
      i.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoices_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Tax Invoices</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            GST compliant sales tax invoices and debit tracking
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Download size={14} /> Export Invoices
          </button>
          <Link href="/orders"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", textDecoration: "none" }}>
            <Plus size={14} /> Generate from Order
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Invoiced Amount</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a", marginTop: 6 }}>{INR(totalInvoiced)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Across {invoices.length} tax invoices</div>
        </div>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".05em" }}>Realized Collections</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a", marginTop: 6 }}>{INR(totalPaid)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Settled payments</div>
        </div>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: ".05em" }}>Outstanding Receivables</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", marginTop: 6 }}>{INR(totalDue)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Pending realization</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 240, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by invoice number, customer name, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, width: "100%" }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#f8fafc", outline: "none" }}>
          <option value="all">All Invoices</option>
          <option value="posted">Posted</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          Showing {filtered.length} of {invoices.length} invoices
        </span>
      </div>

      {/* Invoices Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Invoice #", "Customer", "Invoice Date", "Due Date", "Order Ref", "Total (₹)", "Paid (₹)", "Due (₹)", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <FileText size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, color: "#334155" }}>No Invoices Found</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Tax invoices are generated upon order supply delivery.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(i => {
                const s = ST[i.status] || ST.posted;
                return (
                  <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, fontSize: 12.5, color: "#1e3a8a" }}>{i.num}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{i.customerName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Code: {i.customerCode}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{i.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{i.dueDate}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, fontFamily: "monospace" }}>{i.orderNum}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800 }}>{INR(i.total)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{INR(i.paid)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: i.outstanding > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>
                      {INR(i.outstanding)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => setSelectedInvoice(i)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Tax Invoice #{selectedInvoice.num}</div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Customer:</span><strong>{selectedInvoice.customerName} ({selectedInvoice.customerCode})</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Invoice Date:</span><span>{selectedInvoice.date}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Due Date:</span><span>{selectedInvoice.dueDate}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Order Number:</span><span style={{ fontFamily: "monospace" }}>{selectedInvoice.orderNum}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Description:</span><span>{selectedInvoice.itemsDesc}</span></div>
              <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#1e3a8a" }}><span>Total Amount:</span><span>{INR(selectedInvoice.total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}><span>Amount Paid:</span><strong>{INR(selectedInvoice.paid)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: 700 }}><span>Balance Due:</span><span>{INR(selectedInvoice.outstanding)}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={() => setSelectedInvoice(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
