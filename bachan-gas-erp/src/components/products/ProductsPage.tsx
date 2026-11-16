"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Package, Plus, Pencil, Power, X, History, Save, Tag, Check, AlertCircle, Shield
} from "lucide-react";
import { useERPStore, CylinderProduct } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ProductsPage() {
  const { products, currentUserRole, addProduct, updateProduct, toggleProduct } = useERPStore();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<CylinderProduct | null>(null);

  // Form fields for Add
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sku, setSku] = useState("");
  const [rate, setRate] = useState(0);
  const [hsn, setHsn] = useState("27111900");

  const isAdmin = currentUserRole === "admin";

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !isAdmin) return;

    addProduct({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: "Commercial",
      sku: sku.trim() || `BGS-${code.trim().toUpperCase()}`,
      rate: Number(rate) || 0,
      tax: 18,
      hsn,
      active: true,
    });

    setShowAddModal(false);
    setName("");
    setCode("");
    setSku("");
    setRate(0);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !isAdmin) return;

    updateProduct(editProduct.id, {
      name: editProduct.name,
      rate: Number(editProduct.rate) || 0,
      hsn: editProduct.hsn,
      sku: editProduct.sku,
    });

    setEditProduct(null);
  };

  const displayedProducts = products.filter(p => activeTab === "active" ? p.active : !p.active);
  const activeCount = products.filter(p => p.active).length;
  const archivedCount = products.filter(p => !p.active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            LPG Cylinder Products & Master Rates
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {activeCount} active commercial cylinder lines · Basic rate per cylinder/unit · Standard statutory GST: 18%
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
            <Tag size={14} /> Customer Rates
          </Link>
          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: activeTab === "active" ? "#1e3a8a" : "#f1f5f9",
            color: activeTab === "active" ? "#fff" : "#64748b",
            border: "none", cursor: "pointer"
          }}
        >
          Active LPG Products ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: activeTab === "archived" ? "#1e3a8a" : "#f1f5f9",
            color: activeTab === "archived" ? "#fff" : "#64748b",
            border: "none", cursor: "pointer"
          }}
        >
          Archived / Discontinued ({archivedCount})
        </button>
      </div>

      {/* Staff Notice */}
      {!isAdmin && (
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={15} color="#64748b" />
          <span>Staff Role View: Product catalog and base rates are view-only. To modify pricing for specific commercial accounts, use <strong>Request Rate Change</strong>.</span>
        </div>
      )}

      {/* Grid of Product Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {displayedProducts.map(p => (
          <div key={p.id} style={{ ...card(), padding: 18, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: p.active ? "#1e3a8a" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>{p.name}</h3>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{p.code} · SKU: {p.sku}</span>
                </div>
              </div>
              <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: p.active ? "#dcfce7" : "#fee2e2", color: p.active ? "#15803d" : "#991b1b" }}>
                {p.active ? "Active Line" : "Archived"}
              </span>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Basic Rate per Cylinder</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginTop: 2 }}>
                  {p.rate > 0 ? INR(p.rate) : <span style={{ color: "#94a3b8", fontSize: 14 }}>Per Customer Rate</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Statutory GST</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f97316", marginTop: 2 }}>
                  18% (GST-exclusive)
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: "#64748b", display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
              <span>HSN Code: <strong>{p.hsn}</strong></span>
              <span>Selling Unit: <strong>Cylinder / Unit</strong></span>
            </div>

            {isAdmin && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button
                  onClick={() => setEditProduct(p)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#1e3a8a", background: "#dbeafe", border: "none", cursor: "pointer" }}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => toggleProduct(p.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: p.active ? "#dc2626" : "#16a34a", background: p.active ? "#fee2e2" : "#dcfce7", border: "none", cursor: "pointer" }}
                >
                  <Power size={12} /> {p.active ? "Archive" : "Activate"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddModal && isAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 480, width: "100%", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Add LPG Product Line</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 47.5kg LOT"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Product Code *</label>
                <input
                  type="text"
                  placeholder="e.g. LPG-475-LOT"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Default Basic Rate (₹ per Cylinder / Unit)</label>
                <input
                  type="number"
                  placeholder="0 (Or assign via Customer Rates)"
                  value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>18% GST will be calculated separately and added to billing.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && isAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 480, width: "100%", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Edit Product Line</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Product Name</label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Default Basic Rate (₹ per Cylinder / Unit)</label>
                <input
                  type="number"
                  value={editProduct.rate}
                  onChange={e => setEditProduct({ ...editProduct, rate: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>GST is fixed at 18% (exclusive).</span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setEditProduct(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
