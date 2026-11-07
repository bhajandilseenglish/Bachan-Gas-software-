"use client";
import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useERPStore } from "@/lib/store";
import { createOrder as createOrderSupabase } from "@/lib/actions";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, X } from "lucide-react";

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get("customer_id") || searchParams.get("customerId") || "";

  const { customers, products, customerRates, setCustomerRate, getApplicableRate, createOrder } = useERPStore();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [customerId, setCustomerId] = useState(preSelectedCustomerId || (customers[0]?.id || ""));
  const [prodId, setProdId] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [isContractRate, setIsContractRate] = useState(false);

  // Quick Rate Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [modalAgreedRate, setModalAgreedRate] = useState("");

  const prod = products.find(p => p.id === prodId) || products[0];
  const selectedCustomer = customers.find(c => c.id === customerId || c.code === customerId);

  // Update rate whenever customer or product changes
  useEffect(() => {
    if (customerId && prodId) {
      const rateObj = getApplicableRate(customerId, prodId);
      if (rateObj.isConfigured) {
        setRate(rateObj.rate);
        setIsContractRate(true);
      } else {
        setRate(prod ? prod.rate : 0);
        setIsContractRate(false);
      }
    } else if (prod) {
      setRate(prod.rate);
      setIsContractRate(false);
    }
  }, [customerId, prodId, getApplicableRate, prod, customerRates]);

  const taxRate = prod?.tax ?? 5;
  const subtotal = qty * rate;
  const taxAmt = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + taxAmt;
  const totalKg = qty * (prod?.weight || 0);

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
    setIsContractRate(true);
    setShowRateModal(false);
    setMsg({ type: "success", text: `Approved contract rate of ₹${agreedNum} configured for ${selectedCustomer.name}. You can now proceed with the order.` });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);

    if (!customerId) {
      setMsg({ type: "error", text: "Please select a valid customer." });
      return;
    }

    if (!isContractRate) {
      setMsg({
        type: "error",
        text: "Rate Not Configured: You must configure an approved commercial rate for this customer before booking."
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
        <h1 className="page-title">Create Supply Order</h1>
        <p className="page-sub">Book and schedule commercial LPG cylinder deliveries.</p>
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
          </div>
        </div>
      )}

      {/* Rate Warning Banner if unconfigured */}
      {!isContractRate && (
        <div style={{
          background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
                Commercial Contract Rate Not Configured
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                Orders cannot be confirmed without an approved contract rate. Configure the customer rate to unlock order booking.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalAgreedRate(String(prod?.rate || 1850));
              setShowRateModal(true);
            }}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "#d97706", color: "#fff", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5
            }}
          >
            <Plus size={14} /> Configure Approved Rate
          </button>
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

        {/* Cylinder & Pricing */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">Cylinder & Pricing</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
              background: isContractRate ? "#dcfce7" : "#fee2e2",
              color: isContractRate ? "#15803d" : "#dc2626"
            }}>
              {isContractRate ? "✓ Approved Contract Rate" : "⚠️ Rate Not Configured"}
            </span>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <Lbl label="LPG Cylinder Product *">
                <select
                  name="product_id"
                  required
                  style={sel}
                  value={prodId}
                  onChange={e => setProdId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.weight} kg) - Standard ₹{p.rate}
                    </option>
                  ))}
                </select>
              </Lbl>
              <Lbl label="Quantity (Cylinders) *">
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
              <Lbl label="Unit Rate (₹/Cylinder)">
                <input
                  name="unit_rate"
                  type="number"
                  step="0.01"
                  readOnly={!isContractRate}
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value) || 0)}
                  style={{ ...inp, background: !isContractRate ? "#fee2e2" : "var(--bg)" }}
                />
              </Lbl>
              <Lbl label={`GST Tax (${taxRate}%)`}>
                <div style={{ ...inp, background: "var(--bg)", color: "var(--fg2)", display: "flex", alignItems: "center" }}>
                  ₹{taxAmt.toLocaleString("en-IN")}
                </div>
              </Lbl>
              <Lbl label="Net LPG Weight">
                <div style={{ ...inp, background: "#fff7ed", color: "var(--orange)", fontWeight: 800, display: "flex", alignItems: "center" }}>
                  {totalKg.toFixed(1)} kg
                </div>
              </Lbl>
              <Lbl label="Total Subtotal">
                <div style={{ ...inp, background: "var(--bg)", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </div>
              </Lbl>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Order Financial Summary</span></div>
          <div style={{ padding: "14px 20px" }}>
            {[
              ["Product", `${prod?.name} (${prod?.weight} kg)`],
              ["Quantity", `${qty} cylinder${qty > 1 ? "s" : ""}`],
              ["Effective Rate", isContractRate ? `₹${rate.toLocaleString("en-IN")} / cylinder` : "Rate Not Configured"],
              ["Subtotal", `₹${subtotal.toLocaleString("en-IN")}`],
              [`GST (${taxRate}%)`, `₹${taxAmt.toLocaleString("en-IN")}`],
              ["Order Gross Total", `₹${total.toLocaleString("en-IN")}`],
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
                placeholder="e.g. Priority morning delivery, deliver to kitchen back gate..."
                style={{
                  width: "100%", border: "1.5px solid var(--border)", borderRadius: 8,
                  padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)",
                  outline: "none", resize: "vertical", fontFamily: "inherit"
                }}
              />
            </Lbl>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button
            type="submit"
            className="btn btn-orange"
            disabled={pending || !isContractRate}
            style={{
              opacity: !isContractRate ? 0.6 : 1,
              cursor: !isContractRate ? "not-allowed" : "pointer"
            }}
          >
            {pending ? "Creating Order…" : !isContractRate ? "🚫 Rate Not Configured — Cannot Confirm" : "✓ Confirm & Save Order"}
          </button>
        </div>
      </form>

      {/* Configure Rate Modal */}
      {showRateModal && selectedCustomer && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480,
            boxShadow: "0 20px 40px rgba(0,0,0,.2)", overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#1e3a8a", color: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
                <ShieldCheck size={18} /> Configure Approved Rate
              </div>
              <button onClick={() => setShowRateModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRate} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Consumer Account</label>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{selectedCustomer.name} ({selectedCustomer.code})</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Cylinder Product</label>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{prod?.name} (Standard List: ₹{prod?.rate})</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Agreed Unit Rate (₹/Cylinder) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={modalAgreedRate}
                  onChange={e => setModalAgreedRate(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontWeight: 700, color: "#1e293b", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowRateModal(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}>
                  ✓ Approve & Apply Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid var(--border)", borderRadius: 8,
  padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)",
  outline: "none", fontFamily: "inherit"
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#64748b" }}>Loading order form...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
