"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Edit3, History, Download, Plus, CheckCircle, AlertCircle, X, Clock, Calendar, ArrowRight } from "lucide-react";
import { useERPStore, CylinderProduct } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined || n === 0) return "₹0 (Unconfigured)";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function BasicRateMasterPage() {
  const { products, basicRateHistory, updateBasicRate, currentUserRole } = useERPStore();
  const isAdmin = currentUserRole === "admin";

  const activeSix = products.filter(p => p.active);

  const [selectedProduct, setSelectedProduct] = useState<CylinderProduct | null>(null);
  const [newRate, setNewRate] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenModal = (p: CylinderProduct) => {
    if (!isAdmin) {
      alert("Staff cannot modify basic rates. Only Admin has authority to change master pricing.");
      return;
    }
    setSelectedProduct(p);
    setNewRate(p.rate > 0 ? String(p.rate) : "");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      alert("Please enter a valid GST-exclusive basic rate per cylinder.");
      return;
    }

    updateBasicRate({
      productId: selectedProduct.id,
      basicRate: rateNum,
      effectiveFrom: effectiveDate,
      notes: notes.trim() || `Approved standard basic rate update by ${isAdmin ? "Bachan Admin" : "Staff"}`,
    });

    setSuccessMsg(`Successfully updated master rate for ${selectedProduct.name} to ₹${rateNum.toLocaleString("en-IN")}/cylinder.`);
    setSelectedProduct(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = ["Product Name", "Product Code", "SKU", "Basic Rate per Cylinder (₹)", "Statutory GST %", "GST Amount (₹)", "Gross Billing Rate (₹)", "Status"];
    const rows = activeSix.map(p => {
      const gst = Math.round((p.rate * 18) / 100);
      const gross = p.rate + gst;
      return [
        `"${p.name}"`,
        p.code,
        p.sku,
        p.rate,
        "18%",
        gst,
        gross,
        p.active ? "Active" : "Archived"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Basic_Rate_Master_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>
            Basic Rate Master (6 Active LPG Products)
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Dedicated Admin rate master. Standard basic rates per cylinder/unit (GST 18% exclusive). Used as statutory default when customer rate is not set.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, fontWeight: 700, background: isAdmin ? "#dbeafe" : "#f1f5f9", color: isAdmin ? "#1e40af" : "#475569" }}>
            Role: {isAdmin ? "Admin (Full Pricing Control)" : "Staff (View Only)"}
          </span>
          <button
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}
          >
            <Download size={14} /> Export Rates CSV
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "#dcfce7", color: "#15803d", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Notice Banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, borderRadius: 10, fontSize: 12.5, color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <strong>Statutory LPG Agency Rule:</strong> Basic rates are entered strictly <strong>per cylinder / unit</strong> and are <strong>exclusive of 18% GST</strong>. CGST (9%) and SGST (9%) for intra-state supply in Punjab or IGST (18%) for inter-state supply are calculated dynamically upon billing.
        </div>
        <Link href="/products/rates" style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          View Customer Rates <ArrowRight size={14} />
        </Link>
      </div>

      {/* Master 6 Products Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {activeSix.map(prod => {
          const gstAmt = Math.round((prod.rate * 18) / 100);
          const grossTotal = prod.rate + gstAmt;

          return (
            <div key={prod.id} style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                      {prod.code}
                    </span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginTop: 8 }}>
                      {prod.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: 100 }}>
                    Active Product
                  </span>
                </div>

                <div style={{ marginTop: 14, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Standard Basic Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: prod.rate > 0 ? "#1e3a8a" : "#dc2626", marginTop: 2 }}>
                    {INR(prod.rate)}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    Per Cylinder / Unit (GST Exclusive)
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#475569" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Statutory GST:</span>
                    <strong>18% ({INR(gstAmt)})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Indicative Gross Total:</span>
                    <strong>{INR(grossTotal)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>HSN Code:</span>
                    <span style={{ fontFamily: "monospace" }}>{prod.hsn || "27111900"}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                {isAdmin ? (
                  <button
                    onClick={() => handleOpenModal(prod)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      width: "100%",
                      justifyContent: "center"
                    }}
                  >
                    <Edit3 size={13} /> Configure Master Rate
                  </button>
                ) : (
                  <div style={{ fontSize: 11.5, color: "#64748b", textAlign: "center", width: "100%" }}>
                    Rate managed by Admin · Staff uses Request Rate Change
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Audit Log of Basic Rate Changes */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", margin: 0 }}>Basic Rate Master — Audit History</h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Historical changes to approved basic rates with effective dates and updater identity</p>
          </div>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{basicRateHistory.length} revision records</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Product Name", "Product Code", "Approved Basic Rate (₹)", "Effective From", "Updated By", "Timestamp", "Audit Notes"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {basicRateHistory.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No historical rate revisions recorded yet.
                </td>
              </tr>
            ) : (
              basicRateHistory.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{item.productName}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12.5, color: "#1e3a8a" }}>{item.productCode}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: item.basicRate > 0 ? "#16a34a" : "#dc2626" }}>
                    {INR(item.basicRate)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>{item.effectiveFrom}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>{item.updatedBy}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.updatedAt}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.notes || "Master update"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Rate Modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Configure Basic Master Rate</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Product: <strong>{selectedProduct.name}</strong> ({selectedProduct.code})</div>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRate} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Basic Rate per Cylinder (₹) * [GST 18% Exclusive]
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 700, color: "#64748b" }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 3850"
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px 9px 28px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 15, fontWeight: 800, outline: "none" }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Tax calculation: Final billing = Basic Rate + 18% GST (CGST 9% + SGST 9% for Punjab).
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Rate Revision Notes / Justification
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official OMC monthly commercial rate notification or Admin pricing revision"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
                >
                  Save & Apply Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
