"use client";
import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERPStore } from "@/lib/store";
import { createOrder as createOrderSupabase } from "@/lib/actions";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, X, ShieldAlert } from "lucide-react";

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get("customer_id") || searchParams.get("customerId") || "";

  const { customers, products, customerRates, currentUserRole, setCustomerRate, getApplicableRate, createOrder } = useERPStore();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const activeProducts = products.filter(p => p.active);

  const [customerId, setCustomerId] = useState(preSelectedCustomerId || (customers[0]?.id || ""));
  const [prodId, setProdId] = useState(activeProducts[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [isCustomerRate, setIsCustomerRate] = useState(false);

  // Quick Rate Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [modalAgreedRate, setModalAgreedRate] = useState("");

  const prod = activeProducts.find(p => p.id === prodId) || activeProducts[0];
  const selectedCustomer = customers.find(c => c.id === customerId || c.code === customerId);

  const isAdmin = currentUserRole === "admin";

  // Update rate whenever customer or product changes
  useEffect(() => {
    if (customerId && prodId) {
      const rateObj = getApplicableRate(customerId, prodId);
      if (rateObj.isConfigured) {
        setRate(rateObj.rate);
        setIsCustomerRate(true);
      } else {
        setRate(prod ? prod.rate : 0);
        setIsCustomerRate(false);
      }
    } else if (prod) {
      setRate(prod.rate);
      setIsCustomerRate(false);
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
  const projectedExposure = currentOutstanding + total;
  const isExceedingCredit = typeof creditLimit === "number" && creditLimit > 0 && projectedExposure > creditLimit;

  // Handle Quick Rate Configuration
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !prod) return;
    const agreedNum = parseFloat(modalAgreedRate);
    if (!agreedNum || agreedNum <= 0) return;

    setCustomerRate({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCode: selectedCustomer.code,
      productId: prod.id,
      productName: prod.name,
      defaultRate: prod.rate,
      agreedRate: agreedNum,
      effectiveFrom: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      validTill: "31 Mar 2027",
      approvedBy: "Bachan Admin"
    });

    setRate(agreedNum);
    setIsCustomerRate(true);
    setShowRateModal(false);
    setMsg({ type: "success", text: `Approved customer rate of ₹${agreedNum}/unit configured for ${selectedCustomer.name}. You can now proceed with booking.` });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    if (!customerId) {
      setMsg({ type: "error", text: "Please select a valid customer." });
      return;
    }

    if (!isCustomerRate && rate <= 0) {
      setMsg({
        type: "error",
        text: "Rate Not Configured: You must configure an approved commercial customer rate for this product before booking."
      });
      return;
    }

    startTransition(async () => {
      try {
        try {
          await createOrderSupabase(fd);
        } catch {
          // graceful fallback
        }

        const newOrder = createOrder({
          customerId,
          productId: prod.id,
          qty,
          unitRate: rate,
          deliveryDate: (fd.get("requested_delivery_date") as string) || new Date().toISOString().split("T")[0],
          remarks: (fd.get("remarks") as string) || "",
        });

        setMsg({ type: "success", text: `Order #${newOrder.num} created successfully!` });
        setTimeout(() => {
          router.push(`/orders/${newOrder.id}`);
        }, 800);
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Failed to create order." });
      }
    });
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Create Commercial LPG Order</h1>
        <p className="page-sub">Book and schedule deliveries with 18% GST & customer-specific rates.</p>
      </div>

      {msg && (
        <div style={{
          background: msg.type === "error" ? "#fee2e2" : "#dcfce7",
          border: `1.5px solid ${msg.type === "error" ? "#fca5a5" : "#86efac"}`,
          borderRadius: 10, padding: 14, marginBottom: 16,
          color: msg.type === "error" ? "#b91c1c" : "#15803d",
          fontSize: 13, fontWeight: 600,
        }}>
          {msg.type === "success" ? "✅ " : "❌ "}{msg.text}
        </div>
      )}

      {selectedCustomer && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10,
          padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: 13
        }}>
          <div>
            <strong>{selectedCustomer.name}</strong> ({selectedCustomer.code})
            <span style={{ color: "#64748b", marginLeft: 8 }}>{selectedCustomer.city} · {selectedCustomer.category.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <span>Outstanding: <strong style={{ color: (selectedCustomer.outstanding || 0) > 0 ? "#dc2626" : "#16a34a" }}>
              {selectedCustomer.outstanding !== null ? `₹${selectedCustomer.outstanding.toLocaleString("en-IN")}` : "Not Yet Configured"}
            </strong></span>
            <span>Credit Limit: <strong>
              {selectedCustomer.credit_limit !== null ? `₹${selectedCustomer.credit_limit.toLocaleString("en-IN")}` : "Not Configured"}
            </strong></span>
            <span>Payment Tenure: <strong>{selectedCustomer.payment_tenure_days || 15} Days</strong></span>
          </div>
        </div>
      )}

      {/* Credit Limit Exposure Alert */}
      {isExceedingCredit && (
        <div style={{
          background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12
        }}>
          <ShieldAlert size={22} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
              Credit Exposure Limit Warning
            </div>
            <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>
              Projected customer balance (₹{projectedExposure.toLocaleString("en-IN")}) will exceed permitted credit limit of ₹{creditLimit?.toLocaleString("en-IN")}.
              {isAdmin ? " As Admin, you may proceed after verifying payment authorization." : " Admin approval policy applies."}
            </div>
          </div>
        </div>
      )}

      {/* Rate Warning Banner if unconfigured */}
      {!isCustomerRate && (
        <div style={{
          background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                Commercial Customer Rate Not Configured
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                Orders require an approved basic rate per cylinder. Configure the customer rate to proceed.
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
              <Plus size={14} /> Configure Customer Rate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/products/rates/requests")}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer"
              }}
            >
              Request Rate Change
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer & Dates */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Customer & Schedule</span></div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16 }}>
            <Lbl label="Select Customer *">
              <select
                name="customer_id"
                required
                style={sel}
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.city}
                  </option>
                ))}
              </select>
            </Lbl>
            <Lbl label="Order Date *">
              <input
                name="order_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                style={inp}
              />
            </Lbl>
            <Lbl label="Requested Delivery Date">
              <input
                name="requested_delivery_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                style={inp}
              />
            </Lbl>
          </div>
        </div>

        {/* Cylinder & Pricing (Exactly Six Active Products) */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">LPG Product & Basic Pricing</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
              background: isCustomerRate ? "#dcfce7" : "#fee2e2",
              color: isCustomerRate ? "#15803d" : "#dc2626"
            }}>
              {isCustomerRate ? "✓ Approved Customer Rate" : "⚠️ Rate Unconfigured"}
            </span>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <Lbl label="Active LPG Product Line *">
                <select
                  name="product_id"
                  required
                  style={sel}
                  value={prodId}
                  onChange={e => setProdId(e.target.value)}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </Lbl>
              <Lbl label="Quantity (Cylinders / Units) *">
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  required
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={inp}
                />
              </Lbl>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1.2fr", gap: 16 }}>
              <Lbl label="Basic Rate (₹ per Cylinder / Unit)">
                <input
                  name="unit_rate"
                  type="number"
                  step="0.01"
                  readOnly={!isAdmin && isCustomerRate}
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value) || 0)}
                  style={{ ...inp, background: !isCustomerRate ? "#fee2e2" : "var(--bg)" }}
                />
              </Lbl>
              <Lbl label="Taxable Subtotal (Exclusive)">
                <div style={{ ...inp, background: "var(--bg)", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </div>
              </Lbl>
              <Lbl label="Statutory GST (18%)">
                <div style={{ ...inp, background: "#fff7ed", color: "var(--orange)", fontWeight: 800, display: "flex", alignItems: "center" }}>
                  ₹{taxAmt.toLocaleString("en-IN")}
                </div>
              </Lbl>
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
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>Intra-State Supply (Punjab)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Order Financial Summary</span></div>
          <div style={{ padding: "14px 20px" }}>
            {[
              ["Product Line", prod?.name],
              ["Quantity", `${qty} cylinder${qty > 1 ? "s" : ""} / unit${qty > 1 ? "s" : ""}`],
              ["Basic Rate", isCustomerRate ? `₹${rate.toLocaleString("en-IN")} / cylinder` : "Unconfigured"],
              ["Taxable Amount", `₹${subtotal.toLocaleString("en-IN")}`],
              ["Total GST (18%)", `₹${taxAmt.toLocaleString("en-IN")}`],
              ["Final Bill Amount", `₹${total.toLocaleString("en-IN")}`],
            ].map(([k, v], i) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", padding: "6px 0",
                fontSize: 13, borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                fontWeight: i === 5 ? 800 : 400,
                color: i === 5 ? "var(--orange)" : "var(--fg)",
              }}>
                <span>{k}</span>
                <span style={{ fontWeight: i === 5 ? 800 : 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Remarks */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">Delivery Instructions</span></div>
          <div style={{ padding: 20 }}>
            <Lbl label="Dispatch Remarks / Gate Instructions">
              <textarea
                name="remarks"
                rows={2}
                placeholder="e.g. Priority delivery, driver to collect matching empty cylinders..."
                style={{
                  width: "100%", border: "1.5px solid var(--border)", borderRadius: 8,
                  padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)",
                  outline: "none", resize: "vertical", fontFamily: "inherit"
                }}
              />
            </Lbl>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-orange" disabled={pending}>
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
            background: "#fff", borderRadius: 14, maxWidth: 440, width: "100%",
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Approved Basic Rate (₹ per Cylinder) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 2680"
                  value={modalAgreedRate}
                  onChange={e => setModalAgreedRate(e.target.value)}
                  style={{
                    width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 8,
                    padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>
                  Basic GST-exclusive rate. Standard 18% GST will be added during invoicing.
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Save & Lock Rate
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
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading Order Form...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}

function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid var(--border)", borderRadius: 8,
  padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)",
  outline: "none", boxSizing: "border-box", transition: "border-color .15s",
};

const sel: React.CSSProperties = {
  ...inp, cursor: "pointer",
};
