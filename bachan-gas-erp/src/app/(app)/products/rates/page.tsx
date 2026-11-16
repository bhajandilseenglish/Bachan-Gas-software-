"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Tag, Plus, Search, Edit3, Check, X, ShieldAlert, ArrowRight, User, Download, Clock, Shield } from "lucide-react";
import { useERPStore, CustomerRate } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ProductRatesPage() {
  const { customerRates, customers, products, currentUserRole, setCustomerRate, requestRateChange } = useERPStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const isAdmin = currentUserRole === "admin";
  const activeProducts = products.filter(p => p.active);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(activeProducts[0]?.id || "");
  const [rateValue, setRateValue] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const selectedProduct = activeProducts.find(p => p.id === selectedProductId) || activeProducts[0];

  const handleSaveRateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct || !rateValue) return;

    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      defaultRate: selectedProduct.rate,
      agreedRate: Number(rateValue),
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin",
    });

    setSuccessMsg(`Customer rate of ₹${Number(rateValue).toLocaleString("en-IN")}/unit saved successfully!`);
    setTimeout(() => {
      setShowModal(false);
      setSuccessMsg("");
      setRateValue("");
    }, 1000);
  };

  const handleStaffRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct || !rateValue || !requestReason) return;

    requestRateChange({
      customerId: selectedCustomer.id,
      productId: selectedProduct.id,
      requestedRate: Number(rateValue),
      reason: requestReason,
      requestedBy: "Staff User",
    });

    setSuccessMsg("Rate change request submitted for Admin approval!");
    setTimeout(() => {
      setShowRequestModal(false);
      setSuccessMsg("");
      setRateValue("");
      setRequestReason("");
    }, 1200);
  };

  const handleExportCSV = () => {
    const headers = ["Consumer ID", "Customer Name", "Product", "Basic Rate (per Unit)", "GST Rate", "Effective From", "Valid Till", "Approved By"];
    const rows = filtered.map(r => [
      r.customerCode,
      `"${r.customerName}"`,
      `"${r.productName}"`,
      r.agreedRate,
      "18%",
      r.effectiveFrom,
      r.validTill,
      `"${r.approvedBy}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_Customer_Rates_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return customerRates.filter(r => {
      const matchSearch =
        !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.productName.toLowerCase().includes(search.toLowerCase()) ||
        r.customerCode.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [customerRates, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Customer Rates
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Customer-specific pricing per cylinder/unit · Standard 18% GST calculated separately
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {customerRates.length > 0 && (
            <button
              onClick={handleExportCSV}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f1f5f9",
                color: "#1e293b", border: "1px solid #cbd5e1", cursor: "pointer"
              }}
            >
              <Download size={14} /> Export CSV
            </button>
          )}

          <Link
            href="/products/rates/requests"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff",
              color: "#d97706", border: "1.5px solid #fde68a", textDecoration: "none"
            }}
          >
            <Clock size={14} /> Rate Change Requests
          </Link>

          {isAdmin ? (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316",
                color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
              }}
            >
              <Plus size={14} /> + Add Customer Rate
            </button>
          ) : (
            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#1e3a8a",
                color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(30,58,138,.3)"
              }}
            >
              <Plus size={14} /> Request Rate Change
            </button>
          )}
        </div>
      </div>

      {/* Info Notice */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Tag size={16} color="#2563eb" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#1e40af" }}>
          <strong>ERP Customer Rate Engine:</strong> All rates are entered per cylinder/unit (GST-exclusive). When an order is placed, the approved customer rate is frozen on the order, and 18% statutory GST is added to generate the final invoice.
        </span>
      </div>

      {/* Search Bar */}
      <div style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by customer name, code, or cylinder product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: "#1e293b", background: "transparent" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Customer Rates Table */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Customer", "Consumer Code", "LPG Product", "Approved Basic Rate", "Statutory GST", "Effective Dates", "Authorized By"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No customer-specific rates configured yet. Standard order booking prompts for an approved rate prior to booking.
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{r.customerName}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>
                    {r.customerCode}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                    {r.productName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#16a34a" }}>
                      {INR(r.agreedRate)} <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>/ unit</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#f97316", fontWeight: 600 }}>
                    18% (Exclusive)
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                    {r.effectiveFrom} — {r.validTill}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#1e3a8a", fontWeight: 600 }}>
                    {r.approvedBy}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="mobile-only-cards" style={{ display: "none" }}>
        {filtered.length === 0 ? (
          <div style={{ ...card(), padding: 30, textAlign: "center", color: "#64748b" }}>
            No customer rates configured.
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} style={{ ...card(), padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{r.customerName}</div>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e3a8a", fontWeight: 700 }}>{r.customerCode}</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#16a34a" }}>
                  {INR(r.agreedRate)}
                </div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", margin: "6px 0" }}>
                Product: {r.productName}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                <span>GST: 18% Exclusive</span>
                <span>Approved: {r.approvedBy}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Add Customer Rate Modal */}
      {showModal && isAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 500, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Assign Customer Rate</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {successMsg && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveRateAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Select LPG Product</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Approved Basic Rate (₹ per Cylinder / Unit) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2680"
                  value={rateValue}
                  onChange={e => setRateValue(e.target.value)}
                  required
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>Basic GST-exclusive rate. 18% GST will be added on order generation.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Save Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Request Rate Change Modal */}
      {showRequestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 500, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Request Rate Change</h3>
              <button onClick={() => setShowRequestModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {successMsg && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleStaffRequestSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Product Line *</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Requested Basic Rate (₹ per Cylinder) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2650"
                  value={rateValue}
                  onChange={e => setRateValue(e.target.value)}
                  required
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Reason for Rate Change *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High volume daily buyer (5+ cylinders/day), matching market competitor rate"
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
