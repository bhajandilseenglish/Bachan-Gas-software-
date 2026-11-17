"use client";
import { useState, useTransition, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERPStore } from "@/lib/store";
import { createOrder as createOrderSupabase } from "@/lib/actions";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, X, ShieldAlert, Search, User, CreditCard, Clock, Package, AlertCircle } from "lucide-react";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get("customer") || searchParams.get("customer_id") || searchParams.get("customerId") || "";

  const { customers, products, customerRates, currentUserRole, setCustomerRate, getApplicableRate, createOrder, orders } = useERPStore();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const activeProducts = products.filter(p => p.active);

  // Customer Search Query
  const [custSearch, setCustSearch] = useState("");
  const [customerId, setCustomerId] = useState(preSelectedCustomerId || (customers[0]?.id || ""));
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Order Line States
  const [prodId, setProdId] = useState(activeProducts[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [rateSource, setRateSource] = useState<"customer" | "standard" | "none">("none");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  // Quick Rate Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [modalAgreedRate, setModalAgreedRate] = useState("");

  const prod = activeProducts.find(p => p.id === prodId) || activeProducts[0];
  const selectedCustomer = customers.find(c => c.id === customerId || c.code === customerId);

  const isAdmin = currentUserRole === "admin";
  const projectedOrderNum = `BGS-ORD-${String(orders.length + 1).padStart(5, "0")}`;

  // Filter customers by Name, Business, SAP Code, Consumer Code, Mobile
  const matchingCustomers = useMemo(() => {
    if (!custSearch.trim()) return customers.slice(0, 50);
    const q = custSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.business.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.sap_code && c.sap_code.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q))
    ).slice(0, 50);
  }, [customers, custSearch]);

  // Update rate whenever customer or product changes
  useEffect(() => {
    if (customerId && prodId) {
      const rateObj = getApplicableRate(customerId, prodId);
      if (rateObj.isConfigured) {
        setRate(rateObj.rate);
        setRateSource(rateObj.source);
      } else {
        setRate(prod ? prod.rate : 0);
        setRateSource("none");
      }
    } else if (prod) {
      setRate(prod.rate);
      setRateSource("none");
    }
  }, [customerId, prodId, getApplicableRate, prod, customerRates]);

  // Tax calculations: 18% GST Exclusive
  const isInterState = selectedCustomer?.state && selectedCustomer.state.toLowerCase() !== "punjab";
  const cgstPct = isInterState ? 0 : 9;
  const sgstPct = isInterState ? 0 : 9;
  const igstPct = isInterState ? 18 : 0;

  const subtotal = qty * rate; // Taxable Amount
  const cgstAmt = Math.round((subtotal * cgstPct) / 100);
  const sgstAmt = Math.round((subtotal * sgstPct) / 100);
  const igstAmt = Math.round((subtotal * igstPct) / 100);
  const taxAmt = cgstAmt + sgstAmt + igstAmt; // Total 18% GST
  const total = subtotal + taxAmt;

  // Credit Limit & Exposure Check
  const currentOutstanding = selectedCustomer?.outstanding || 0;
  const creditLimit = selectedCustomer?.credit_limit;
  const availableCredit = creditLimit !== null && creditLimit !== undefined ? Math.max(0, creditLimit - currentOutstanding) : null;
  const projectedExposure = currentOutstanding + total;
  const isExceedingCredit = typeof creditLimit === "number" && creditLimit > 0 && projectedExposure > creditLimit;

  // Quick Customer Rate Modal Save (Admin only)
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !prod) return;
    const agreedNum = parseFloat(modalAgreedRate);
    if (!agreedNum || agreedNum <= 0) return;

    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      sapCode: selectedCustomer.sap_code,
      productId: prod.id,
      productName: prod.name,
      defaultRate: prod.rate,
      agreedRate: agreedNum,
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin"
    });

    setRate(agreedNum);
    setRateSource("customer");
    setShowRateModal(false);
    setMsg({ type: "success", text: `Customer rate of ₹${agreedNum.toLocaleString("en-IN")}/unit configured for ${selectedCustomer.name}.` });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!selectedCustomer) {
      setMsg({ type: "error", text: "Please select a valid customer." });
      return;
    }

    if (rate <= 0) {
      setMsg({
        type: "error",
        text: "Rate Not Configured: No approved applicable rate exists for this product. Order blocked until rate is configured."
      });
      return;
    }

    startTransition(async () => {
      try {
        const newOrder = createOrder({
          customerId: selectedCustomer.id,
          productId: prod.id,
          qty,
          unitRate: rate,
          deliveryDate,
          remarks,
          sapCode: selectedCustomer.sap_code,
          qtyIssued: 0, // Not issued until confirmed delivery
          emptyReceivedOnOrder: 0,
        });

        setMsg({ type: "success", text: `Order #${newOrder.num} booked successfully with 18% GST!` });
        setTimeout(() => {
          router.push(`/orders/${newOrder.id}`);
        }, 800);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Failed to create order." });
      }
    });
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Commercial LPG Order Booking</h1>
        <p className="page-sub">
          Official Bachan Gas Service order entry · 18% statutory GST calculated dynamically · Strictly 6 active LPG products
        </p>
      </div>

      {msg && (
        <div style={{
          background: msg.type === "error" ? "#fee2e2" : "#dcfce7",
          border: `1.5px solid ${msg.type === "error" ? "#fca5a5" : "#86efac"}`,
          borderRadius: 10, padding: 14, marginBottom: 16,
          color: msg.type === "error" ? "#b91c1c" : "#15803d",
          fontSize: 13, fontWeight: 700,
        }}>
          {msg.type === "success" ? "✅ " : "❌ "}{msg.text}
        </div>
      )}

      {/* Customer Search & Quick Select */}
      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
          Customer Selection (Search by Name, Business, SAP Code, Consumer #, Mobile)
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 14px", background: "#f8fafc" }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Type customer name, business, SAP code (e.g. SAP-IND-100001), CX consumer #, or phone..."
              value={custSearch}
              onFocus={() => setShowCustDropdown(true)}
              onChange={e => {
                setCustSearch(e.target.value);
                setShowCustDropdown(true);
              }}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: "#1e293b" }}
            />
            {custSearch && (
              <button type="button" onClick={() => setCustSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={16} />
              </button>
            )}
          </div>

          {showCustDropdown && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
              background: "#fff", border: "1.5px solid #cbd5e1", borderRadius: 8,
              marginTop: 4, maxHeight: 260, overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,.1)"
            }}>
              {matchingCustomers.length === 0 ? (
                <div style={{ padding: 14, fontSize: 12.5, color: "#64748b", textAlign: "center" }}>
                  No customer matching &quot;{custSearch}&quot;
                </div>
              ) : (
                matchingCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustSearch("");
                      setShowCustDropdown(false);
                    }}
                    style={{
                      padding: "10px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                      background: c.id === customerId ? "#eff6ff" : "transparent"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = c.id === customerId ? "#eff6ff" : "transparent")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: 13, color: "#1e293b" }}>{c.name}</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1e3a8a", fontFamily: "monospace" }}>{c.code}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2, display: "flex", gap: 12 }}>
                      {c.sap_code && <span>SAP: <strong style={{ color: "#0891b2" }}>{c.sap_code}</strong></span>}
                      <span>Mobile: {c.mobile}</span>
                      <span>City: {c.city}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Customer Commercial Master Display (Requirement #6) */}
        {selectedCustomer && (
          <div style={{ marginTop: 16, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                  {selectedCustomer.category.toUpperCase()} ACCOUNT
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Consumer #: <strong>{selectedCustomer.code}</strong> • SAP Code: <strong style={{ color: selectedCustomer.sap_code ? "#0891b2" : "#94a3b8" }}>{selectedCustomer.sap_code || "Not Configured"}</strong>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                <div>Phone: <strong>{selectedCustomer.mobile}</strong></div>
                <div>Supply State: <strong>{selectedCustomer.state || "Punjab"}</strong> ({isInterState ? "Inter-state IGST 18%" : "Intra-state CGST/SGST"})</div>
              </div>
            </div>

            {/* Commercial Parameters Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 12 }}>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Credit Limit</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>{INR(selectedCustomer.credit_limit)}</div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Max allowed credit</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Available Room</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: availableCredit !== null && availableCredit > 0 ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                  {INR(availableCredit)}
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Remaining credit</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Balance Pending</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: (selectedCustomer.outstanding || 0) > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
                  {INR(selectedCustomer.outstanding)}
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Current due balance</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Advance Balance</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: (selectedCustomer.advance_balance || 0) > 0 ? "#16a34a" : "#64748b", marginTop: 2 }}>
                  {INR(selectedCustomer.advance_balance || 0)}
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Prepaid balance</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Credit Days</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>
                  {selectedCustomer.payment_tenure_days ?? 15} Days
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Payment tenure</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Empty Cylinders Pending</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: (selectedCustomer.empty_cylinders_pending || 0) > 0 ? "#ea580c" : "#16a34a", marginTop: 2 }}>
                  {selectedCustomer.empty_cylinders_pending || 0} cyl
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Pending return</div>
              </div>
              <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Last Order</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginTop: 2 }}>
                  {selectedCustomer.last_order_date || selectedCustomer.last_supply || "None"}
                </div>
                <div style={{ fontSize: 9.5, color: "#94a3b8" }}>Previous refill</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credit Limit Exposure Alert */}
      {isExceedingCredit && (
        <div style={{
          background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12
        }}>
          <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>
              Credit Exposure Limit Warning
            </div>
            <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>
              Projected customer balance (₹{projectedExposure.toLocaleString("en-IN")}) will exceed permitted credit limit of ₹{creditLimit?.toLocaleString("en-IN")}.
              {isAdmin ? " As Admin, you may approve following business policy." : " Staff must obtain Admin credit authorization."}
            </div>
          </div>
        </div>
      )}

      {/* Rate Warning Banner if unconfigured */}
      {rateSource === "none" && rate <= 0 && (
        <div style={{
          background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>
                No Approved Rate Configured
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                Orders strictly require an approved Customer Rate or standard Basic Rate. Order cannot be confirmed until configured.
              </div>
            </div>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                setModalAgreedRate(String(prod?.rate || 2680));
                setShowRateModal(true);
              }}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "#d97706", color: "#fff", border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5
              }}
            >
              <Plus size={14} /> Authorize Customer Rate
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>
              Contact Administrator to configure approved pricing.
            </span>
          )}
        </div>
      )}

      {/* Main Order Form */}
      <form onSubmit={handleSubmit}>
        {/* Order Meta & Schedule */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">Order Information & Schedule</span>
            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: "#1e3a8a", background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
              {projectedOrderNum}
            </span>
          </div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Order Date *</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Requested Supply Delivery Date *</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        {/* Cylinder & Pricing (Strictly 6 Active LPG Products) */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">LPG Product & Basic Pricing (Exclusive of 18% GST)</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
              background: rateSource === "customer" ? "#dcfce7" : rateSource === "standard" ? "#eff6ff" : "#fee2e2",
              color: rateSource === "customer" ? "#15803d" : rateSource === "standard" ? "#1e40af" : "#dc2626"
            }}>
              {rateSource === "customer" ? "✓ Approved Customer Rate" : rateSource === "standard" ? "ℹ️ Basic Master Rate" : "⚠️ Rate Unconfigured"}
            </span>
          </div>

          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Active LPG Product Line (Approved Master 6) *
                </label>
                <select
                  required
                  value={prodId}
                  onChange={e => setProdId(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Quantity Ordered (Cylinders / Units) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr 1.2fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Basic Rate (₹ / Unit) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  readOnly={!isAdmin && rateSource === "customer"}
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                    background: rate <= 0 ? "#fee2e2" : "#f8fafc", fontWeight: 800, color: "#1e293b"
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  GST 18% exclusive basic
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Calculated Rate / KG
                </label>
                <div style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: 8, fontSize: 13.5, fontWeight: 800, background: "#f1f5f9", color: "#0f172a" }}>
                  ₹{(prod?.referenceWeightKg && rate > 0 ? (rate / prod.referenceWeightKg).toFixed(2) : "0.00")} / kg
                </div>
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  Ref: {prod?.referenceWeightKg || 19.0} kg
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Taxable Subtotal
                </label>
                <div style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 800, background: "#f8fafc", color: "#1e293b" }}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Statutory GST (18%)
                </label>
                <div style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #fed7aa", borderRadius: 8, fontSize: 14, fontWeight: 800, background: "#fff7ed", color: "#ea580c" }}>
                  ₹{taxAmt.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* GST breakdown pills */}
            <div style={{ display: "flex", gap: 12, fontSize: 12, background: "#f8fafc", padding: "10px 14px", borderRadius: 8 }}>
              {isInterState ? (
                <span>IGST 18%: <strong>₹{igstAmt.toLocaleString("en-IN")}</strong> (Inter-State: {selectedCustomer?.state})</span>
              ) : (
                <>
                  <span>CGST 9%: <strong>₹{cgstAmt.toLocaleString("en-IN")}</strong></span>
                  <span>·</span>
                  <span>SGST 9%: <strong>₹{sgstAmt.toLocaleString("en-IN")}</strong></span>
                  <span>·</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>Intra-State Supply (Punjab)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Operational Traceability Notice (Requirement #6 & #8) */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 8, fontSize: 12, color: "#166534", marginBottom: 16 }}>
          <strong>Exchange Liability Rule:</strong> Placing this order records an empty cylinder snapshot of <strong>{selectedCustomer?.empty_cylinders_pending || 0} pending cylinders</strong>. Customer empty liability will not increase until filled cylinders are physically issued and confirmed upon delivery.
        </div>

        {/* Order Summary & Financials */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Order Financial Billing Summary</span></div>
          <div style={{ padding: "14px 20px" }}>
            {[
              ["Product Line", prod?.name],
              ["Quantity Ordered", `${qty} cylinder${qty > 1 ? "s" : ""} / unit${qty > 1 ? "s" : ""}`],
              ["Basic Rate per Unit", rate > 0 ? `₹${rate.toLocaleString("en-IN")} (GST Exclusive)` : "Unconfigured"],
              ["Taxable Basic Subtotal", `₹${subtotal.toLocaleString("en-IN")}`],
              ["Total Statutory GST (18%)", `₹${taxAmt.toLocaleString("en-IN")}`],
              ["Final Payable Invoice Total", `₹${total.toLocaleString("en-IN")}`],
            ].map(([k, v], i) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", padding: "7px 0",
                fontSize: 13, borderBottom: i < 5 ? "1px solid #e2e8f0" : "none",
                fontWeight: i === 5 ? 900 : 400,
                color: i === 5 ? "#1e3a8a" : "#1e293b",
              }}>
                <span>{k}</span>
                <span style={{ fontWeight: i === 5 ? 900 : 700, fontSize: i === 5 ? 16 : 13 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Remarks */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">Delivery Instructions & Gate Notes</span></div>
          <div style={{ padding: 20 }}>
            <textarea
              rows={2}
              placeholder="e.g. Collect matching empty cylinders on delivery, security gate clearance, delivery contact person..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{
                width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
                padding: "9px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button
            type="submit"
            className="btn btn-orange"
            disabled={pending || rate <= 0}
            style={{ opacity: rate <= 0 ? 0.6 : 1, cursor: rate <= 0 ? "not-allowed" : "pointer" }}
          >
            {pending ? "Confirming Order..." : `Book Supply Order (₹${total.toLocaleString("en-IN")})`}
          </button>
        </div>
      </form>

      {/* Quick Customer Rate Modal (Admin Only) */}
      {showRateModal && isAdmin && selectedCustomer && prod && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, maxWidth: 460, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,.3)", overflow: "hidden"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>Authorize Customer Rate</span>
              </div>
              <button onClick={() => setShowRateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRate} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12 }}>
                <div>Customer: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.code})</div>
                <div style={{ marginTop: 4 }}>Product: <strong>{prod.name}</strong></div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Approved Basic Rate (₹ per Cylinder / Unit) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 3850"
                  value={modalAgreedRate}
                  onChange={e => setModalAgreedRate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 700, outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                  Basic rate exclusive of 18% GST. GST will be added dynamically upon billing.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowRateModal(false)} style={{ padding: "8px 14px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
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

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#64748b" }}>Loading order booking...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
