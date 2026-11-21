"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Edit3, Download, CheckCircle, X, ArrowRight, Scale, Calculator } from "lucide-react";
import { useERPStore, CylinderProduct } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined || n === 0) return "₹0.00";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const [ratePerKgInput, setRatePerKgInput] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenModal = (p: CylinderProduct) => {
    if (!isAdmin) {
      alert("Staff cannot modify basic rates. Only Admin has authority to change master pricing.");
      return;
    }
    setSelectedProduct(p);
    const currentKg = p.ratePerKg || (p.referenceWeightKg ? p.rate / p.referenceWeightKg : 100);
    setRatePerKgInput(currentKg > 0 ? String(currentKg) : "100");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  };

  const currentRefWeight = selectedProduct?.referenceWeightKg || 19;
  const numericRatePerKg = parseFloat(ratePerKgInput) || 0;
  const calculatedPerUnit = Math.round(numericRatePerKg * currentRefWeight * 100) / 100;
  const calculatedGstPerUnit = Math.round((calculatedPerUnit * 18) / 100);
  const calculatedGrossPerUnit = calculatedPerUnit + calculatedGstPerUnit;

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (numericRatePerKg <= 0) {
      alert("Please enter a valid GST-exclusive basic rate per KG (₹/kg).");
      return;
    }

    updateBasicRate({
      productId: selectedProduct.id,
      basicRatePerKg: numericRatePerKg,
      basicRate: calculatedPerUnit,
      effectiveFrom: effectiveDate,
      notes: notes.trim() || `Approved standard basic rate per kg update by ${isAdmin ? "Bachan Admin" : "Staff"}`,
    });

    setSuccessMsg(`Successfully configured rate for ${selectedProduct.name} at ₹${numericRatePerKg.toFixed(2)}/kg (₹${calculatedPerUnit.toLocaleString("en-IN")}/unit).`);
    setSelectedProduct(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      "Product Name", "Product Code", "SKU", "Ref Weight (kg)",
      "Basic Rate per KG (₹/kg)", "Basic Rate per Unit (₹)", "Statutory GST %",
      "GST Amount (₹)", "Gross Billing Rate (₹)", "Status"
    ];
    const rows = activeSix.map(p => {
      const refW = p.referenceWeightKg || 19;
      const rateKg = p.ratePerKg || (p.rate / refW);
      const gst = Math.round((p.rate * 18) / 100);
      const gross = p.rate + gst;
      return [
        `"${p.name}"`,
        p.code,
        p.sku,
        refW,
        rateKg.toFixed(2),
        p.rate.toFixed(2),
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.4px", margin: 0 }}>
              Basic Rate Master (6 Active LPG Products)
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              Authoritative Rate per KG
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Admin configures Basic Rate per KG (₹/kg). Per-cylinder rates are calculated dynamically: <strong>Rate per Unit = Rate per KG × Reference Weight</strong> (18% GST Exclusive).
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, fontWeight: 700, background: isAdmin ? "#dbeafe" : "#f1f5f9", color: isAdmin ? "#1e40af" : "#475569" }}>
            Role: {isAdmin ? "Admin (Pricing Master Control)" : "Staff (View Only)"}
          </span>
          <button
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#fff", color: "#475569", border: "1.5px solid #cbd5e1", cursor: "pointer" }}
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
      <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", padding: 14, borderRadius: 10, fontSize: 12.5, color: "#334155", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <strong style={{ color: "#0f172a" }}>Commercial LPG Formula:</strong> Rate per Unit = Basic Rate per KG × Product Reference Weight. Final invoice applies statutory 18% GST (CGST 9% + SGST 9% intra-state Punjab or IGST 18% inter-state).
        </div>
        <Link href="/products/rates" style={{ fontWeight: 700, color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Customer Specific Rates <ArrowRight size={14} />
        </Link>
      </div>

      {/* Master 6 Products Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        {activeSix.map(prod => {
          const refW = prod.referenceWeightKg || 19;
          const rateKg = prod.ratePerKg || (prod.rate > 0 ? prod.rate / refW : 100);
          const unitRate = prod.rate > 0 ? prod.rate : rateKg * refW;
          const gstAmt = Math.round((unitRate * 18) / 100);
          const grossTotal = unitRate + gstAmt;

          return (
            <div key={prod.id} style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace" }}>
                      {prod.code}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
                      {prod.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 9px", borderRadius: 100 }}>
                    Active Product
                  </span>
                </div>

                {/* Per-KG & Per-Unit Price Box */}
                <div style={{ marginTop: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Authoritative Rate per KG</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#15803d", marginTop: 2 }}>
                        ₹{rateKg.toFixed(2)} <span style={{ fontSize: 13, fontWeight: 600 }}>/ kg</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#e2e8f0", color: "#334155", padding: "2px 8px", borderRadius: 4 }}>
                        Ref: {refW} kg
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #86efac", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Rate per Cylinder (Basic):</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>₹{unitRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Statutory 18% GST Breakdown */}
                <div style={{ marginTop: 12, background: "#f8fafc", padding: "10px 14px", borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: 4 }}>
                    <span>Statutory 18% GST:</span>
                    <span style={{ fontWeight: 700, color: "#334155" }}>+ ₹{gstAmt.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#0f172a", fontWeight: 800, paddingTop: 4, borderTop: "1px solid #e2e8f0" }}>
                    <span>Gross Invoice Rate:</span>
                    <span>₹{grossTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 16 }}>
                {isAdmin ? (
                  <button
                    onClick={() => handleOpenModal(prod)}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      background: "#2563eb", color: "#fff", border: "none",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    <Edit3 size={15} /> Configure Rate per KG
                  </button>
                ) : (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: 8 }}>
                    Admin permission required to adjust rates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit History Table */}
      <div style={{ ...card(), overflow: "hidden", marginTop: 8 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Master Basic Rate Audit Trail
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
            Immutable historical log of all basic rate updates, effective dates, and responsible administrators.
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
              <th style={{ padding: "10px 16px" }}>Product Name</th>
              <th style={{ padding: "10px 16px" }}>Code</th>
              <th style={{ padding: "10px 16px" }}>Ref Weight</th>
              <th style={{ padding: "10px 16px" }}>Rate per KG (₹/kg)</th>
              <th style={{ padding: "10px 16px" }}>Rate per Unit (₹)</th>
              <th style={{ padding: "10px 16px" }}>Effective From</th>
              <th style={{ padding: "10px 16px" }}>Updated By</th>
              <th style={{ padding: "10px 16px" }}>Timestamp</th>
              <th style={{ padding: "10px 16px" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {basicRateHistory.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No historical rate revisions recorded yet.
                </td>
              </tr>
            ) : (
              basicRateHistory.map(item => {
                const refW = item.referenceWeightKg || 19;
                const rateKg = item.basicRatePerKg || (item.basicRate / refW);
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{item.productName}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12.5, color: "#1e3a8a" }}>{item.productCode}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>{refW} kg</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                      ₹{rateKg.toFixed(2)}/kg
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                      {INR(item.basicRate)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>{item.effectiveFrom}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{item.updatedBy}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.updatedAt}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.notes || "Master update"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Rate Modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Configure Basic Rate Master</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Product: <strong>{selectedProduct.name}</strong> ({selectedProduct.code}) · Verified Ref: <strong>{currentRefWeight} kg</strong>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRate} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* PRIMARY INPUT: Basic Rate per KG */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 6 }}>
                  Authoritative Basic Rate per KG (₹/kg) * [GST 18% Exclusive]
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, fontWeight: 700, color: "#64748b" }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    autoFocus
                    placeholder="e.g. 100.00"
                    value={ratePerKgInput}
                    onChange={e => setRatePerKgInput(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 30px", border: "2px solid #2563eb", borderRadius: 8, fontSize: 16, fontWeight: 800, color: "#0f172a", outline: "none" }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#64748b" }}>/ kg</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Enter the basic price per kilogram of LPG without tax.
                </div>
              </div>

              {/* AUTOMATIC READ-ONLY CALCULATION */}
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>
                  Dynamic System Calculation
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#334155", marginBottom: 4 }}>
                  <span>Rate per Unit ({currentRefWeight} kg × ₹{numericRatePerKg.toFixed(2)}):</span>
                  <strong style={{ color: "#0f172a" }}>₹{calculatedPerUnit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#334155", marginBottom: 4 }}>
                  <span>Statutory 18% GST (CGST 9% + SGST 9%):</span>
                  <strong style={{ color: "#2563eb" }}>+ ₹{calculatedGstPerUnit.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "#15803d", paddingTop: 6, borderTop: "1px dashed #cbd5e1" }}>
                  <span>Gross Invoice Rate per Unit:</span>
                  <span>₹{calculatedGrossPerUnit.toLocaleString("en-IN")}</span>
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
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                  Rate Revision Notes / Justification
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official IOCL monthly commercial rate revision or Admin pricing update"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
                >
                  Save & Apply Rate per KG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
