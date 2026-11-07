"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Tag, Plus, Search, Edit3, Check, X, ShieldAlert, ArrowRight, User } from "lucide-react";
import { useERPStore, CustomerRate } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ProductRatesPage() {
  const { customerRates, customers, products, setCustomerRate } = useERPStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [rateValue, setRateValue] = useState(2680);
  const [notes, setNotes] = useState("Negotiated bulk contract rate");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct || !rateValue) return;

    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      defaultRate: selectedProduct.rate,
      agreedRate: rateValue,
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Super Admin",
    });

    setSuccessMsg("Customer contract rate saved successfully!");
    setTimeout(() => {
      setShowModal(false);
      setSuccessMsg("");
    }, 1000);
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Customer Contract Rates</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Manage customized commercial LPG cylinder rates negotiated with individual high-volume consumers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
            borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316",
            color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
          }}
        >
          <Plus size={14} /> + Add Customer Rate
        </button>
      </div>

      {/* Info Notice */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Tag size={16} color="#2563eb" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#1e40af" }}>
          <strong>ERP Rate Priority:</strong> When a new supply order is created, the system checks for an active customer-specific contract rate first. If found, that rate is locked in as a snapshot on the order. Otherwise, the standard product list rate is applied.
        </span>
      </div>

      {/* Add Rate Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 500, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Assign Customer-Specific Rate</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {successMsg ? (
              <div style={{ padding: 24, textAlign: "center", color: "#15803d", fontWeight: 700 }}>
                ✅ {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSaveRate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Select Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    style={sel}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.business}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Select Cylinder Product *</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    style={sel}
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Base Rate: ₹{p.rate})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Standard Base Rate</label>
                    <div style={{ ...inp, background: "#f8fafc", color: "#64748b" }}>
                      ₹{selectedProduct?.rate || 2710}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Negotiated Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={rateValue}
                      onChange={e => setRateValue(parseFloat(e.target.value) || 0)}
                      style={inp}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Contract Remarks / Approval Notes</label>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Approved by Agency Director, valid for FY26"
                    style={inp}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#f97316", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    ✓ Save Contract Rate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 13px", flex: 1, maxWidth: 360, background: "#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search customer, code, or cylinder..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
          />
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          {filtered.length} active customer rates
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Customer", "Product", "Contract Rate", "Standard Rate", "Discount", "Effective From", "Valid Till", "Profile"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const diff = (r.defaultRate || 2710) - r.agreedRate;
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid #e2e8f0", transition: "background .12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <Link href={`/customers/${r.customerId}`} style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", textDecoration: "none" }}>
                      {r.customerName}
                    </Link>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.customerCode}</div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                    {r.productName}
                  </td>
                  <td style={{ padding: "13px 16px", fontWeight: 800, color: "#16a34a", fontSize: 14 }}>
                    {INR(r.agreedRate)}
                  </td>
                  <td style={{ padding: "13px 16px", color: "#94a3b8", fontSize: 13, textDecoration: "line-through" }}>
                    {INR(r.defaultRate || 2710)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                      -₹{Math.max(0, diff)}/cyl
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b" }}>
                    {r.effectiveFrom}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b" }}>
                    {r.validTill}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <Link
                      href={`/customers/${r.customerId}`}
                      style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                        fontWeight: 600, background: "#f0f4fa", color: "#1e3a8a",
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
                      }}
                    >
                      <User size={13} /> View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc",
  outline: "none", boxSizing: "border-box"
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer", background: "#fff" };
