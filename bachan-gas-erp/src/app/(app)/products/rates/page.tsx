"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Tag, Plus, Search, Check, Shield, History, Download, ArrowRight, Eye } from "lucide-react";
import { useERPStore, CustomerRate, EXACT_SIX_ACTIVE_PRODUCTS } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  ...s,
});

export default function CustomerRatesPage() {
  const { customerRates, customers, products, currentUserRole, setCustomerRate } = useERPStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRateHistory, setSelectedRateHistory] = useState<CustomerRate | null>(null);

  const isAdmin = currentUserRole === "admin";
  const activeSixProducts = products.filter(p => p.active);

  // Form State for Admin
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(activeSixProducts[0]?.id || "");
  const [basicRateInput, setBasicRateInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const selectedProduct = activeSixProducts.find(p => p.id === selectedProductId) || activeSixProducts[0];

  // Automatic Read-Only Rate per KG calculation
  const productRefWeight = selectedProduct?.referenceWeightKg || 19;
  const calculatedRatePerKg = basicRateInput && !isNaN(Number(basicRateInput)) && Number(basicRateInput) > 0
    ? (Number(basicRateInput) / productRefWeight).toFixed(2)
    : "—";

  const handleSaveRateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct || !basicRateInput) return;

    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      sapCode: selectedCustomer.sap_code,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      defaultRate: selectedProduct.rate,
      agreedRate: Number(basicRateInput),
      referenceWeightKg: productRefWeight,
      calculatedRatePerKg: Number(calculatedRatePerKg),
      gstRatePct: 18,
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin",
    });

    setSuccessMsg(`Customer rate for ${selectedCustomer.name} configured successfully!`);
    setTimeout(() => {
      setShowModal(false);
      setSuccessMsg("");
      setBasicRateInput("");
    }, 1200);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customerRates;
    return customerRates.filter(
      r =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerCode.toLowerCase().includes(q) ||
        (r.sapCode && r.sapCode.toLowerCase().includes(q)) ||
        r.productName.toLowerCase().includes(q)
    );
  }, [customerRates, search]);

  const handleExportCSV = () => {
    const headers = [
      "Consumer ID",
      "SAP Code",
      "Customer Name",
      "Product",
      "Basic Rate per Unit (₹)",
      "Ref Weight (kg)",
      "Rate per KG (₹/kg)",
      "Previous Rate",
      "GST Rate",
      "Effective From",
      "Approved By",
    ];
    const rows = filtered.map(r => {
      const prod = products.find(p => p.id === r.productId || p.name === r.productName);
      const refW = prod?.referenceWeightKg || r.referenceWeightKg || 19;
      const rateKg = (r.agreedRate / refW).toFixed(2);
      return [
        r.customerCode,
        r.sapCode || "—",
        `"${r.customerName}"`,
        `"${r.productName}"`,
        r.agreedRate,
        refW,
        rateKg,
        r.previousRate || "—",
        "18%",
        r.effectiveFrom,
        `"${r.approvedBy}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BGS_Customer_Rates_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Customer Rates</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#dbeafe", color: "#1d4ed8" }}>
              Customer-Specific Rate Master
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#fef3c7", color: "#b45309" }}>
              18% GST Applicable
            </span>
          </div>
          <p className="page-sub" style={{ marginTop: 4 }}>
            Customer-specific basic pricing per cylinder for the 6 approved LPG products with automatic read-only Rate per KG.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
              background: "#fff", fontSize: 12, fontWeight: 600, color: "#334155",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Download size={14} /> Export Rates
          </button>

          {isAdmin ? (
            <button
              onClick={() => {
                setShowModal(true);
                setBasicRateInput("");
              }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 14px" }}
            >
              <Plus size={15} /> Add Customer Rate
            </button>
          ) : (
            <div style={{ padding: "6px 12px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Staff View: Read-Only Rates
            </div>
          )}
        </div>
      </div>

      {/* Role Notice */}
      <div
        style={{
          ...card({
            padding: "10px 14px",
            background: isAdmin ? "#f8fafc" : "#eff6ff",
            borderColor: isAdmin ? "#e2e8f0" : "#bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: isAdmin ? "#475569" : "#1e40af",
          }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} color={isAdmin ? "#f97316" : "#2563eb"} />
          <span>
            {isAdmin ? (
              <>
                <strong>Administrator Master Governance:</strong> You can directly configure and update customer-specific rates. Rates require zero approval steps.
              </>
            ) : (
              <>
                <strong>Staff Member Access:</strong> Approved customer rates are displayed for billing and order reference. Rate modifications are restricted to Admin.
              </>
            )}
          </span>
        </div>
        <Link href="/products/basic-rates" style={{ fontSize: 12, fontWeight: 700, color: "#ea580c", textDecoration: "none" }}>
          View Standard Basic Rates →
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ ...card({ padding: 12, display: "flex", gap: 10, alignItems: "center" }) }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer rates by customer name, consumer ID, SAP code, or product..."
            style={{
              width: "100%", padding: "7px 10px 7px 32px", fontSize: 13,
              border: "1px solid #cbd5e1", borderRadius: 8, outline: "none",
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
          Showing <strong>{filtered.length}</strong> configured customer rates
        </span>
      </div>

      {/* Rates Table */}
      <div style={{ ...card({ overflow: "hidden" }) }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#94a3b8" }}>
              <Tag size={20} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>No Customer Rates Configured</div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, maxWidth: 440, margin: "4px auto 16px" }}>
              Commercial customers without a custom rate will either be billed at standard rates (if fallback is permitted) or prompted for rate configuration upon ordering.
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
                style={{ fontSize: 12, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={14} /> Add First Customer Rate
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 14px" }}>Customer / Consumer</th>
                  <th style={{ padding: "10px 14px" }}>SAP Code</th>
                  <th style={{ padding: "10px 14px" }}>Product</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Basic Rate (per Unit)</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Ref Weight</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Rate per KG</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>GST Rate</th>
                  <th style={{ padding: "10px 14px" }}>Effective Date</th>
                  <th style={{ padding: "10px 14px" }}>Approved By</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rate => {
                  const prod = products.find(p => p.id === rate.productId || p.name === rate.productName);
                  const refWeight = prod?.referenceWeightKg || rate.referenceWeightKg || 19;
                  const ratePerKg = (rate.agreedRate / refWeight).toFixed(2);

                  return (
                    <tr key={rate.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{rate.customerName}</div>
                        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{rate.customerCode}</div>
                      </td>

                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#475569" }}>
                        {rate.sapCode ? (
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", fontWeight: 600 }}>
                            {rate.sapCode}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{rate.productName}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>Commercial LPG</div>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                          ₹{rate.agreedRate.toLocaleString("en-IN")}
                        </div>
                        <span style={{ fontSize: 10, color: "#64748b" }}>per unit (+ 18% GST)</span>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                        {refWeight} kg
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#0284c7", fontSize: 13, background: "#f0f9ff", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
                          ₹{ratePerKg}/kg
                        </div>
                        <span style={{ fontSize: 10, color: "#64748b", display: "block" }}>read-only</span>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#fef3c7", color: "#92400e" }}>
                          18%
                        </span>
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>
                        <div>{rate.effectiveFrom}</div>
                        {rate.previousRate && (
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>Prev: ₹{rate.previousRate}</span>
                        )}
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#334155" }}>
                        <div style={{ fontWeight: 600 }}>{rate.approvedBy}</div>
                        <span style={{ fontSize: 10, color: "#15803d" }}>✓ Approved</span>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {rate.rateHistory && rate.rateHistory.length > 0 && (
                            <button
                              onClick={() => setSelectedRateHistory(rate)}
                              title="View Rate History"
                              style={{
                                padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1",
                                background: "#fff", fontSize: 11, color: "#475569", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4,
                              }}
                            >
                              <History size={12} /> History
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedCustomerId(rate.customerId);
                                setSelectedProductId(rate.productId);
                                setBasicRateInput(String(rate.agreedRate));
                                setShowModal(true);
                              }}
                              style={{
                                padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#ffedd5", color: "#c2410c", fontSize: 11, fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Edit Rate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Add/Edit Rate Modal */}
      {showModal && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%", padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Configure Customer Rate</h2>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Set GST-exclusive basic rate per cylinder. Rate per KG calculates automatically.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {successMsg && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: 8, fontSize: 12, color: "#047857", marginBottom: 16 }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveRateAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}){c.sap_code ? ` - SAP: ${c.sap_code}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Select LPG Product (Approved Master 6 Products)
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  {activeSixProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Ref: {p.referenceWeightKg || 19} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Basic Rate per Cylinder / Unit (₹) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="1"
                  value={basicRateInput}
                  onChange={e => setBasicRateInput(e.target.value)}
                  placeholder="e.g. 1850.00"
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: "1.5px solid #ea580c", borderRadius: 8, outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "block" }}>
                  Basic price excluding GST. 18% GST (CGST 9% + SGST 9%) will be added to the invoice.
                </span>
              </div>

              {/* Read-Only Rate per KG Display Card */}
              <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#0369a1" }}>
                      Automatic Calculated Rate per KG
                    </span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0284c7", marginTop: 2 }}>
                      {calculatedRatePerKg !== "—" ? `₹${calculatedRatePerKg} / kg` : "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#0284c7" }}>
                    <div>Ref Weight: <strong>{productRefWeight} kg</strong></div>
                    <div>Formula: Rate ÷ {productRefWeight}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700 }}
                >
                  Save Approved Customer Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate History Modal */}
      {selectedRateHistory && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16,
        }}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 540, width: "100%", padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Customer Rate History</h2>
                <p style={{ fontSize: 12, color: "#64748b" }}>
                  {selectedRateHistory.customerName} · {selectedRateHistory.productName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRateHistory(null)}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <tr>
                    <th style={{ padding: "8px 12px" }}>Rate</th>
                    <th style={{ padding: "8px 12px" }}>Effective From</th>
                    <th style={{ padding: "8px 12px" }}>Approved By</th>
                    <th style={{ padding: "8px 12px" }}>Recorded Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRateHistory.rateHistory || []).map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0f172a" }}>
                        ₹{h.rate.toLocaleString("en-IN")}/unit
                      </td>
                      <td style={{ padding: "8px 12px", color: "#475569" }}>{h.effectiveFrom}</td>
                      <td style={{ padding: "8px 12px", color: "#475569" }}>{h.approvedBy}</td>
                      <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{h.changedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                onClick={() => setSelectedRateHistory(null)}
                className="btn btn-secondary"
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
