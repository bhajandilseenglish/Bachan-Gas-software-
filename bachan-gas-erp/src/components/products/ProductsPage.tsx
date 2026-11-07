"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Package, Plus, Pencil, Power, X, History, Save, Tag, Check, AlertCircle
} from "lucide-react";
import { useERPStore, CylinderProduct } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ProductsPage() {
  const { products, addProduct, updateProduct, toggleProduct } = useERPStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<CylinderProduct | null>(null);

  // Form fields for Add
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"Commercial" | "Domestic" | "Industrial">("Commercial");
  const [weight, setWeight] = useState(19.0);
  const [rate, setRate] = useState(2710);
  const [tax, setTax] = useState(5);
  const [hsn, setHsn] = useState("27111900");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addProduct({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      weight,
      sku: `BCG-${code.trim().toUpperCase()}`,
      rate,
      tax,
      hsn,
      active: true,
    });

    setShowAddModal(false);
    // Reset
    setName("");
    setCode("");
    setWeight(19.0);
    setRate(2710);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    updateProduct(editProduct.id, {
      name: editProduct.name,
      rate: editProduct.rate,
      tax: editProduct.tax,
      weight: editProduct.weight,
      hsn: editProduct.hsn,
    });

    setEditProduct(null);
  };

  const activeCount = products.filter(p => p.active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>LPG Cylinder Products & Master Rates</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {activeCount} active products configured · Governs standard order calculations & customer price rules
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/products/rates"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff",
              color: "#1e3a8a", border: "1.5px solid #e2e8f0", textDecoration: "none"
            }}
          >
            <Tag size={14} /> Customer Contract Rates
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f97316",
              color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
            }}
          >
            <Plus size={14} /> + Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Product Name", "Product Code", "Category", "Net LPG Weight", "Standard List Rate", "GST Tax", "HSN Code", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr
                key={p.id}
                style={{ borderBottom: "1px solid #e2e8f0", transition: "background .12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>SKU: {p.sku || `BCG-${p.code}`}</div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12.5 }}>
                    {p.code}
                  </span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em",
                    background: p.type === "Commercial" ? "#dbeafe" : p.type === "Industrial" ? "#ede9fe" : "#fce7f3",
                    color: p.type === "Commercial" ? "#1d4ed8" : p.type === "Industrial" ? "#6d28d9" : "#9d174d",
                  }}>
                    {p.type}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                  {p.weight} kg
                </td>
                <td style={{ padding: "13px 16px", fontWeight: 800, color: "#f97316", fontSize: 13.5 }}>
                  {INR(p.rate)}
                </td>
                <td style={{ padding: "13px 16px", color: "#475569", fontSize: 13 }}>
                  {p.tax}%
                </td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                  {p.hsn || "27111900"}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em",
                    background: p.active ? "#dcfce7" : "#f1f5f9",
                    color: p.active ? "#15803d" : "#475569",
                  }}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setEditProduct({ ...p })}
                      style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                        fontWeight: 600, background: "#f0f4fa", color: "#1e3a8a",
                        border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                      }}
                      title="Edit Product Rates"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 11.5,
                        fontWeight: 600, background: p.active ? "#fee2e2" : "#dcfce7",
                        color: p.active ? "#dc2626" : "#15803d",
                        border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                      }}
                      title={p.active ? "Deactivate" : "Activate"}
                    >
                      <Power size={13} /> {p.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 500, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Add New Cylinder Product</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Product Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Commercial LPG 47.5kg" style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Product Code *</label>
                  <input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. LPG-475" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Category Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} style={sel}>
                    <option value="Commercial">Commercial</option>
                    <option value="Domestic">Domestic</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Net Wt (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Standard Rate (₹)</label>
                  <input type="number" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>GST Tax (%)</label>
                  <input type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#f97316", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  ✓ Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 480, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Edit Product Rates: {editProduct.name}</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Product Name</label>
                <input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Standard List Rate (₹)</label>
                  <input type="number" step="0.01" value={editProduct.rate} onChange={e => setEditProduct({ ...editProduct, rate: parseFloat(e.target.value) || 0 })} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>GST Tax Rate (%)</label>
                  <input type="number" value={editProduct.tax} onChange={e => setEditProduct({ ...editProduct, tax: parseFloat(e.target.value) || 0 })} style={inp} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Net LPG Weight (kg)</label>
                  <input type="number" step="0.1" value={editProduct.weight} onChange={e => setEditProduct({ ...editProduct, weight: parseFloat(e.target.value) || 0 })} style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>HSN Code</label>
                  <input value={editProduct.hsn || ""} onChange={e => setEditProduct({ ...editProduct, hsn: e.target.value })} style={inp} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setEditProduct(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#f97316", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  ✓ Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
  padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none"
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer", background: "#fff" };
