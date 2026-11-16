"use client";
import { useState, useEffect } from "react";
import { Settings, Building2, Shield, Bell, Save, Check, RotateCcw, Phone, Mail, MapPin } from "lucide-react";
import { useERPStore, REAL_AGENCY_SETTINGS } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#1e293b", background: "#f8fafc",
  outline: "none", boxSizing: "border-box"
};

const sel: React.CSSProperties = {
  ...inp, cursor: "pointer"
};

export default function SettingsPage() {
  const { settings, updateSettings } = useERPStore();

  const [tradeName, setTradeName] = useState(settings?.tradeName || "Bachan Gas Service");
  const [gstin, setGstin] = useState(settings?.gstin || "03AABCJ1103D1Z8");
  const [distributorshipCode, setDistributorshipCode] = useState(settings?.distributorshipCode || "0000110351");
  const [phone, setPhone] = useState(settings?.phone || "+91 97812 90564");
  const [email, setEmail] = useState(settings?.email || "admin@bachangas.in");
  const [address, setAddress] = useState(settings?.address || "New Amar Nagar, G.T. Road, Ludhiana, Punjab 141003");
  const [defaultCommercialGst, setDefaultCommercialGst] = useState(settings?.defaultCommercialGst ?? 5);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(settings?.defaultPaymentTerms || "Net 15 Days");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setTradeName(settings.tradeName);
      setGstin(settings.gstin);
      setDistributorshipCode(settings.distributorshipCode);
      setPhone(settings.phone);
      setEmail(settings.email);
      setAddress(settings.address);
      setDefaultCommercialGst(settings.defaultCommercialGst);
      setDefaultPaymentTerms(settings.defaultPaymentTerms || "Net 15 Days");
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      tradeName: tradeName.trim(),
      gstin: gstin.trim(),
      distributorshipCode: distributorshipCode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      defaultCommercialGst: Number(defaultCommercialGst) || 5,
      defaultPaymentTerms,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset agency configuration back to verified Ludhiana Indane distributorship defaults?")) {
      updateSettings(REAL_AGENCY_SETTINGS);
      setTradeName(REAL_AGENCY_SETTINGS.tradeName);
      setGstin(REAL_AGENCY_SETTINGS.gstin);
      setDistributorshipCode(REAL_AGENCY_SETTINGS.distributorshipCode);
      setPhone(REAL_AGENCY_SETTINGS.phone);
      setEmail(REAL_AGENCY_SETTINGS.email);
      setAddress(REAL_AGENCY_SETTINGS.address);
      setDefaultCommercialGst(REAL_AGENCY_SETTINGS.defaultCommercialGst);
      setDefaultPaymentTerms(REAL_AGENCY_SETTINGS.defaultPaymentTerms || "Net 15 Days");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Agency Legal & Tax Settings
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Configure enterprise legal details, OMC distributorship code, default GST rates, and billing terms
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", cursor: "pointer"
          }}
        >
          <RotateCcw size={13} /> Reset to Agency Defaults
        </button>
      </div>

      {saved && (
        <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 10, padding: 14, color: "#15803d", fontSize: 13, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
          <Check size={16} /> Agency settings saved successfully and synchronized across invoices & challans!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Agency Info */}
        <div style={{ ...card() }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} color="#f97316" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Agency Legal Information</span>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Agency Trade Name *</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={e => setTradeName(e.target.value)}
                  style={inp}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>GSTIN / Tax ID *</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  style={inp}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>OMC Distributorship Code *</label>
                <input
                  type="text"
                  value={distributorshipCode}
                  onChange={e => setDistributorshipCode(e.target.value)}
                  style={inp}
                  required
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>Indane Distributor Code (0000110351)</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Official Contact Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={inp}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inp}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Registered Business Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ ...inp, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* GST & Default Config */}
        <div style={{ ...card() }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color="#f97316" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Default Taxation & Business Rules</span>
          </div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Commercial LPG GST Rate (%)</label>
              <input
                type="number"
                value={defaultCommercialGst}
                onChange={e => setDefaultCommercialGst(Number(e.target.value))}
                style={inp}
                min={0}
                max={28}
              />
              <span style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "block" }}>Standard statutory GST for 19kg commercial cylinders is 5%</span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Default Customer Payment Terms</label>
              <select
                value={defaultPaymentTerms}
                onChange={e => setDefaultPaymentTerms(e.target.value)}
                style={sel}
              >
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Advance Payment">Advance Payment</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "#f97316", color: "#fff", border: "none", cursor: "pointer",
              boxShadow: "0 2px 6px rgba(249,115,22,.3)"
            }}
          >
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
