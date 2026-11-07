"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Building2, User, Phone, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { useERPStore } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams?.id || "";
  const router = useRouter();

  const { customers, updateCustomer } = useERPStore();
  const c = customers.find(cust => cust.id === id || cust.code === id) || customers[0];

  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState(c?.name || "");
  const [business, setBusiness] = useState(c?.business || "");
  const [category, setCategory] = useState<any>(c?.category || "commercial");
  const [contactPerson, setContactPerson] = useState(c?.contact_person || "");
  const [status, setStatus] = useState<any>(c?.status || "active");
  const [mobile, setMobile] = useState(c?.mobile || "");
  const [altMobile, setAltMobile] = useState(c?.alt_mobile || "");
  const [email, setEmail] = useState(c?.email || "");
  const [gst, setGst] = useState(c?.gst || "");
  const [city, setCity] = useState(c?.city || "Ludhiana");
  const [area, setArea] = useState(c?.area || "");
  const [state, setState] = useState(c?.state || "Punjab");
  const [pin, setPin] = useState(c?.pin || "141003");
  const [creditLimit, setCreditLimit] = useState(c?.credit_limit !== null ? String(c?.credit_limit) : "");
  const [paymentTerms, setPaymentTerms] = useState(c?.payment_terms || "Net 15 Days");

  if (!c) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Customer Not Found</h2>
        <Link href="/customers" style={{ color: "#f97316" }}>Return to Customers List</Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const parsedLimit = creditLimit.trim() ? parseFloat(creditLimit) : null;

    updateCustomer(c.id, {
      name,
      business,
      category,
      contact_person: contactPerson,
      status,
      mobile,
      alt_mobile: altMobile,
      email,
      gst,
      city,
      area,
      state,
      pin,
      credit_limit: parsedLimit,
      payment_terms: paymentTerms,
      is_financial_configured: parsedLimit !== null,
    });

    setTimeout(() => {
      setSaving(false);
      router.push(`/customers/${c.id}`);
    }, 400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Edit Customer — {c.name} ({c.code})
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Update billing details, credit terms, and contact profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Basic Details */}
        <div style={{ ...card() }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} color="#f97316" /> Business & Contact Profile
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Customer Display Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inp} />
              </div>
              <div>
                <label style={lbl}>Registered Business Name *</label>
                <input type="text" value={business} onChange={e => setBusiness(e.target.value)} required style={inp} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Customer Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} style={sel}>
                  <option value="commercial">Commercial</option>
                  <option value="domestic">Domestic</option>
                  <option value="industrial">Industrial</option>
                  <option value="institutional">Institutional</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Primary Contact Person</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Account Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} style={sel}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Primary Mobile Number *</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} required style={inp} />
              </div>
              <div>
                <label style={lbl}>Alternate Mobile</label>
                <input type="text" value={altMobile} onChange={e => setAltMobile(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
              </div>
            </div>
          </div>
        </div>

        {/* GST & Address */}
        <div style={{ ...card() }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color="#f97316" /> Tax & Delivery Address
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>GSTIN (GST Number)</label>
                <input type="text" value={gst} onChange={e => setGst(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>City *</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} required style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Delivery / Billing Address *</label>
              <textarea value={area} onChange={e => setArea(e.target.value)} rows={2} required style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>State</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>PIN Code</label>
                <input type="text" value={pin} onChange={e => setPin(e.target.value)} style={inp} />
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Credit Terms */}
        <div style={{ ...card() }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={16} color="#f97316" /> Credit Limit & Payment Terms
          </div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>Approved Credit Limit (₹)</label>
              <input
                type="number"
                placeholder="Leave blank if unconfigured"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                style={inp}
              />
              <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                Leave empty if credit limit is not yet sanctioned.
              </span>
            </div>
            <div>
              <label style={lbl}>Agreed Payment Terms</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={sel}>
                <option value="Not Yet Configured">Not Yet Configured</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
            <Save size={15} /> {saving ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 };
const inp: React.CSSProperties = { width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
