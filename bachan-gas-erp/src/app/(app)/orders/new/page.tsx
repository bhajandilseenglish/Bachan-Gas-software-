"use client";
import { useState, useTransition, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERPStore } from "@/lib/store";
import { createOrder as createOrderSupabase } from "@/lib/actions";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, X, ShieldAlert, Search, User, CreditCard, Clock, Package, AlertCircle, RefreshCw, Calculator } from "lucide-react";

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
  const [rate, setRate] = useState<number>(4750);
  const [ratePerKg, setRatePerKg] = useState<number>(100);
  const [rateSource, setRateSource] = useState<"customer" | "standard" | "custom" | "none">("standard");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");

  // Quick Rate Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [modalAgreedRate, setModalAgreedRate] = useState("");

  const prod = activeProducts.find(p => p.id === prodId) || activeProducts[0];
  const selectedCustomer = customers.find(c => c.id === customerId || c.code === customerId);
  const refWeight = prod?.referenceWeightKg || 19.0;

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
      if (rateObj.isConfigured && rateObj.rate > 0) {
        setRate(rateObj.rate);
        setRatePerKg(rateObj.ratePerKg || Number((rateObj.rate / refWeight).toFixed(2)));
        setRateSource(rateObj.source);
      } else {
        const prodRate = prod && prod.rate > 0 ? prod.rate : 100 * refWeight;
        const prodKg = prod && prod.ratePerKg ? prod.ratePerKg : 100;
        setRate(prodRate);
        setRatePerKg(prodKg);
        setRateSource(prod && prod.rate > 0 ? "standard" : "custom");
      }
    } else if (prod) {
      const prodRate = prod.rate > 0 ? prod.rate : 100 * refWeight;
      const prodKg = prod.ratePerKg ? prod.ratePerKg : 100;
      setRate(prodRate);
      setRatePerKg(prodKg);
      setRateSource("standard");
    }
  }, [customerId, prodId, getApplicableRate, prod, customerRates, refWeight]);

  // Tax calculations: 18% GST Exclusive
  const isInterState = selectedCustomer?.state && selectedCustomer.state.toLowerCase() !== "punjab";
  const cgstPct = isInterState ? 0 : 9;
  const sgstPct = isInterState ? 0 : 9;
  const igstPct = isInterState ? 18 : 0;

  const currentRate = rate || 0;
  const subtotal = qty * currentRate; // Taxable Amount
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

    const kgRate = Number((agreedNum / refWeight).toFixed(2));
    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      sapCode: selectedCustomer.sap_code,
      productId: prod.id,
      productName: prod.name,
      defaultRate: prod.rate,
      agreedRate: agreedNum,
      ratePerKg: kgRate,
      referenceWeightKg: refWeight,
      effectiveFrom: new Date().toISOString().split("T")[0],
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin"
    });

    setRate(agreedNum);
    setRatePerKg(kgRate);
    setRateSource("customer");
    setShowRateModal(false);
    setMsg({ type: "success", text: `Customer rate of ₹${agreedNum.toLocaleString("en-IN")}/unit (₹${kgRate}/kg) configured for ${selectedCustomer.name}.` });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    if (!selectedCustomer) {
      setMsg({ type: "error", text: "Please select a valid customer." });
      return;
    }

    if (currentRate <= 0) {
      setMsg({
        type: "error",
        text: "Please enter a valid rate per unit or rate per kg."
      });
      return;
    }

    startTransition(async () => {
      try {
        const newOrder = createOrder({
          customerId: selectedCustomer.id,
          productId: prod.id,
          qty,
          unitRate: currentRate,
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
                <div style={{ padding: 16, color: "#64748b", fontSize: 13, textAlign: "center" }}>
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

        {/* Selected Customer Commercial Master Display */}
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

      {/* Quick Helper Banner if rate is unconfigured */}
      {currentRate <= 0 && (
        <div style={{
          background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>
                Pricing Ready to Configure
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                Enter the Basic Rate or Rate per KG below, or click &quot;Apply Standard Master Rate&quot; to populate standard pricing.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultKg = 100;
              const defaultRate = defaultKg * refWeight;
              setRate(defaultRate);
              setRatePerKg(defaultKg);
              setRateSource("standard");
            }}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "#d97706", color: "#fff", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5
            }}
          >
            Apply Standard Rate (₹100/kg)
          </button>
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
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span className="card-title">LPG Product & Basic Pricing (Exclusive of 18% GST)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                background: rateSource === "customer" ? "#dcfce7" : rateSource === "standard" ? "#eff6ff" : rateSource === "custom" ? "#fef3c7" : "#fee2e2",
                color: rateSource === "customer" ? "#15803d" : rateSource === "standard" ? "#1e40af" : rateSource === "custom" ? "#b45309" : "#dc2626"
              }}>
                {rateSource === "customer" ? "✓ Approved Customer Rate" : rateSource === "standard" ? "ℹ️ Standard Master Rate" : rateSource === "custom" ? "✏️ Custom Order Rate" : "⚠️ Rate Unconfigured"}
              </span>
            </div>
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

            {/* FULLY EDITABLE RATE PER UNIT & RATE PER KG (Both fully editable by anyone!) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>
                  Basic Rate (₹ / Unit) *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "#64748b" }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={rate || ""}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setRate(val);
                      setRatePerKg(val > 0 ? Number((val / refWeight).toFixed(2)) : 0);
                      setRateSource("custom");
                    }}
                    placeholder="e.g. 4750"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 24px", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 14,
                      background: "#ffffff", fontWeight: 800, color: "#0f172a", outline: "none"
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  Per cylinder (GST 18% exclusive)
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>
                  Rate per KG (₹ / KG) *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "#64748b" }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={ratePerKg || ""}
                    onChange={e => {
                      const kgVal = parseFloat(e.target.value) || 0;
                      setRatePerKg(kgVal);
                      setRate(kgVal > 0 ? Number((kgVal * refWeight).toFixed(2)) : 0);
                      setRateSource("custom");
                    }}
                    placeholder="e.g. 100"
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 24px", border: "1.5px solid #16a34a", borderRadius: 8, fontSize: 14,
                      background: "#ffffff", fontWeight: 800, color: "#166534", outline: "none"
                    }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 600, color: "#64748b" }}>/ kg</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  Ref: {refWeight} kg
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Taxable Subtotal
                </label>
                <div style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 800, background: "#f8fafc", color: "#1e293b" }}>
                  ₹{(subtotal || 0).toLocaleString("en-IN")}
                </div>
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  {qty} × ₹{Number(rate || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
                  Statutory GST (18%)
                </label>
                <div style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #fed7aa", borderRadius: 8, fontSize: 14, fontWeight: 800, background: "#fff7ed", color: "#ea580c" }}>
                  ₹{(taxAmt || 0).toLocaleString("en-IN")}
                </div>
                <span style={{ fontSize: 11, color: "#ea580c", marginTop: 3, display: "block" }}>
                  {isInterState ? "IGST 18%" : "CGST 9% + SGST 9%"}
                </span>
              </div>
            </div>

            {/* Quick Pricing Presets Bar */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 2, flexWrap: "wrap", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>One-Click Presets:</span>
              <button
                type="button"
                onClick={() => {
                  const defaultKg = 100;
                  const defaultUnit = defaultKg * refWeight;
                  setRate(defaultUnit);
                  setRatePerKg(defaultKg);
                  setRateSource("standard");
                }}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "1px solid #cbd5e1",
                  background: "#fff", fontSize: 11.5, fontWeight: 700, color: "#1e3a8a", cursor: "pointer"
                }}
              >
                Reset to Master Rate (₹100/kg → ₹{(100 * refWeight).toLocaleString("en-IN")})
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setModalAgreedRate(String(rate || 100 * refWeight));
                    setShowRateModal(true);
                  }}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: "1px solid #bfdbfe",
                    background: "#eff6ff", fontSize: 11.5, fontWeight: 700, color: "#2563eb", cursor: "pointer"
                  }}
                >
                  Save as Approved Customer Rate
                </button>
              )}
            </div>

            {/* GST breakdown pills */}
            <div style={{ display: "flex", gap: 12, fontSize: 12, background: "#f8fafc", padding: "10px 14px", borderRadius: 8 }}>
              {isInterState ? (
                <span>IGST 18%: <strong>₹{igstAmt.toLocaleString("en-IN")}</strong> (Inter-State: {selectedCustomer?.state})</span>
              ) : (
                <>
                  <span>CGST 9%: <strong>₹{cgstAmt.toLocaleString("en-IN")}</strong></span>
                  <span>•</span>
                  <span>SGST 9%: <strong>₹{sgstAmt.toLocaleString("en-IN")}</strong></span>
                  <span>•</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>Intra-State Supply (Punjab)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cylinder Exchange Warning Note */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#166534" }}>
            <strong>Exchange Liability Rule:</strong> Placing this order records an empty cylinder snapshot of <strong>{selectedCustomer?.empty_cylinders_pending || 0} pending cylinders</strong>. Customer empty liability will not increase until filled cylinders are physically issued and confirmed upon delivery.
          </div>
        </div>

        {/* Summary Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Order Financial Billing Summary</span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                <span>Product Line</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{prod?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                <span>Quantity Ordered</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{qty} cylinder{qty > 1 ? "s" : ""} / unit</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                <span>Basic Rate per Unit</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{Number(rate).toLocaleString("en-IN")} (₹{Number(ratePerKg).toFixed(2)}/kg)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                <span>Taxable Basic Subtotal</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ea580c" }}>
                <span>Statutory 18% GST</span>
                <span style={{ fontWeight: 800 }}>+ ₹{taxAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 900, color: "#1e293b", borderTop: "2px solid #e2e8f0", paddingTop: 12, marginTop: 4 }}>
                <span>Final Order Amount (Payable)</span>
                <span style={{ color: "#1e3a8a" }}>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Delivery Instructions & Remarks</span>
          </div>
          <div style={{ padding: 20 }}>
            <textarea
              rows={2}
              placeholder="e.g. Call manager before dispatch, urgent delivery, supply bay 2"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical" }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || currentRate <= 0}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: currentRate <= 0 ? "#94a3b8" : "#2563eb",
              color: "#fff", fontWeight: 800, fontSize: 13.5,
              cursor: currentRate <= 0 ? "not-allowed" : "pointer",
              boxShadow: currentRate <= 0 ? "none" : "0 2px 6px rgba(37,99,235,0.3)"
            }}
          >
            {pending ? "Saving Order..." : "Confirm & Save Order"}
          </button>
        </div>
      </form>

      {/* Quick Customer Rate Modal (Admin only) */}
      {showRateModal && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16
        }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 440, width: "100%", padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Authorize Customer Rate</h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Set approved contract rate for {selectedCustomer?.name}</p>
              </div>
              <button type="button" onClick={() => setShowRateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRate} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Product
                </label>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", padding: "8px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  {prod?.name} (Ref: {refWeight} kg)
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Approved Basic Rate (₹ / Unit) * [GST Exclusive]
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 4750.00"
                  value={modalAgreedRate}
                  onChange={e => setModalAgreedRate(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 15, fontWeight: 800, outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                  Equivalent to: ₹{modalAgreedRate && parseFloat(modalAgreedRate) > 0 ? (parseFloat(modalAgreedRate) / refWeight).toFixed(2) : "0.00"}/kg
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12.5, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
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

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading Order Form...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
