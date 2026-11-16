"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Download, Eye, Printer, X, CheckCircle, ShieldCheck } from "lucide-react";
import { useERPStore, Invoice } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "₹0";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

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
    const headers = ["Invoice #", "Order #", "Customer Name", "Customer Code", "Invoice Date", "Due Date", "Payment Tenure", "Particulars", "Taxable (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "GST 18% (₹)", "Total (₹)", "Paid (₹)", "Outstanding (₹)", "Status"];
    const rows = filtered.map(i => [
      i.num,
      i.orderNum,
      `"${i.customerName}"`,
      i.customerCode,
      i.date,
      i.dueDate,
      `${i.paymentTenureDays || 15} Days`,
      `"${i.itemsDesc || ""}"`,
      i.taxableAmount || (i.total / 1.18),
      i.cgstAmount || 0,
      i.sgstAmount || 0,
      i.igstAmount || 0,
      i.taxAmount || (i.total - (i.total / 1.18)),
      i.total,
      i.paid,
      i.outstanding,
      i.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tax_Invoices_18GST_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Commercial Tax Invoices (18% GST)</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Statutory GST compliant sales invoices. Basic rates are GST-exclusive with separate 18% GST (CGST 9% + SGST 9% or IGST 18%).
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <Download size={14} /> Export CSV
          </button>
          <Link href="/orders/new"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316", color: "#fff", textDecoration: "none" }}>
            <Plus size={14} /> Create Order & Invoice
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Invoiced (Gross 18% GST)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a", marginTop: 6 }}>{INR(totalInvoiced)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Across {invoices.length} tax invoices</div>
        </div>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".05em" }}>Realized Collections</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a", marginTop: 6 }}>{INR(totalPaid)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Settled customer receipts</div>
        </div>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: ".05em" }}>Outstanding Receivables</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", marginTop: 6 }}>{INR(totalDue)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Pending realization / In payment tenure</div>
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
              {["Invoice #", "Customer", "Invoice Date", "Due Date", "Taxable (₹)", "GST 18% (₹)", "Total (₹)", "Paid (₹)", "Due (₹)", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
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
                const taxable = i.taxableAmount || Math.round(i.total / 1.18);
                const gst = i.taxAmount || (i.total - taxable);
                return (
                  <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, fontSize: 12.5, color: "#1e3a8a" }}>{i.num}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{i.customerName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Code: {i.customerCode} • Tenure: {i.paymentTenureDays ?? 15}d</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{i.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{i.dueDate}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#334155" }}>{INR(taxable)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#f97316", fontWeight: 600 }}>{INR(gst)}</td>
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
                        <Eye size={12} /> View Tax Invoice
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Full GST 18% Tax Invoice Modal */}
      {selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto", padding: 28, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e3a8a" }}>BACHAN GAS SERVICE</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Authorized Commercial LPG Distributor • Distributor Code: <strong>0000110351</strong>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  Ludhiana, Punjab • State Code: 03 • GSTIN: 03AAAAA0000A1Z5
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800 }}>
                  TAX INVOICE
                </span>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginTop: 4, fontFamily: "monospace" }}>
                  #{selectedInvoice.num}
                </div>
                <button onClick={() => setSelectedInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", marginTop: 6, color: "#94a3b8" }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Bill To & Invoice Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "16px 0", borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Billed To</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>{selectedInvoice.customerName}</div>
                <div style={{ color: "#475569", marginTop: 2 }}>Consumer Code: <strong>{selectedInvoice.customerCode}</strong></div>
                <div style={{ color: "#64748b" }}>Place of Supply: Punjab (State Code 03)</div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 3 }}>
                <div><span style={{ color: "#64748b" }}>Invoice Date: </span><strong>{selectedInvoice.date}</strong></div>
                <div><span style={{ color: "#64748b" }}>Payment Tenure: </span><strong>{selectedInvoice.paymentTenureDays ?? 15} Days</strong></div>
                <div><span style={{ color: "#64748b" }}>Due Date: </span><strong style={{ color: "#dc2626" }}>{selectedInvoice.dueDate}</strong></div>
                <div><span style={{ color: "#64748b" }}>Order Ref: </span><span style={{ fontFamily: "monospace" }}>{selectedInvoice.orderNum}</span></div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Invoice Particulars (Selling Unit: Cylinder / Unit)
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Product Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#475569" }}>Qty</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Basic Rate (₹)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Taxable Amt (₹)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>CGST 9%</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>SGST 9%</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Total GST 18%</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{it.productName}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{it.qty}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{INR(it.basicRate)}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{INR(it.taxableAmount)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>{INR(it.cgstAmt)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>{INR(it.sgstAmt)}</td>
                        <td style={{ padding: "10px", textAlign: "right", color: "#f97316", fontWeight: 600 }}>{INR(it.taxAmt)}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{INR(it.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{selectedInvoice.itemsDesc || "Commercial LPG Cylinder Supply"}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>1</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>{INR(selectedInvoice.taxableAmount || Math.round(selectedInvoice.total / 1.18))}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>{INR(selectedInvoice.taxableAmount || Math.round(selectedInvoice.total / 1.18))}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>{INR(selectedInvoice.cgstAmount || Math.round((selectedInvoice.taxAmount || (selectedInvoice.total - (selectedInvoice.total / 1.18))) / 2))}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>{INR(selectedInvoice.sgstAmount || Math.round((selectedInvoice.taxAmount || (selectedInvoice.total - (selectedInvoice.total / 1.18))) / 2))}</td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#f97316", fontWeight: 600 }}>{INR(selectedInvoice.taxAmount || Math.round(selectedInvoice.total - (selectedInvoice.total / 1.18)))}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 800 }}>{INR(selectedInvoice.total)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Taxable Subtotal (Basic):</span>
                  <strong>{INR(selectedInvoice.taxableAmount || Math.round(selectedInvoice.total / 1.18))}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>CGST (9% Intra-state Punjab):</span>
                  <span>{INR(selectedInvoice.cgstAmount || Math.round((selectedInvoice.taxAmount || (selectedInvoice.total - (selectedInvoice.total / 1.18))) / 2))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>SGST (9% Intra-state Punjab):</span>
                  <span>{INR(selectedInvoice.sgstAmount || Math.round((selectedInvoice.taxAmount || (selectedInvoice.total - (selectedInvoice.total / 1.18))) / 2))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#f97316", fontWeight: 700 }}>
                  <span>Total Statutory GST (18%):</span>
                  <span>{INR(selectedInvoice.taxAmount || Math.round(selectedInvoice.total - (selectedInvoice.total / 1.18)))}</span>
                </div>
                <div style={{ height: 1, background: "#cbd5e1", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 900, color: "#1e3a8a" }}>
                  <span>Final Invoice Total:</span>
                  <span>{INR(selectedInvoice.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                  <span>Amount Settled / Paid:</span>
                  <strong>{INR(selectedInvoice.paid)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: selectedInvoice.outstanding > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>
                  <span>Balance Outstanding:</span>
                  <span>{INR(selectedInvoice.outstanding)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Note */}
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11, color: "#166534" }}>
              <strong>Tax Compliance Note:</strong> In accordance with commercial LPG tax regulations, basic cylinder rates are exclusive of GST. 18% GST (CGST 9% + SGST 9% for intra-state supply in Punjab) is computed separately and added to the billing total.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                <Printer size={14} /> Print Invoice
              </button>
              <button onClick={() => setSelectedInvoice(null)} style={{ padding: "9px 18px", borderRadius: 8, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
