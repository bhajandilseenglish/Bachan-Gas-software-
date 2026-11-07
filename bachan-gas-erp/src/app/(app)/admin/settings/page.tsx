"use client";
import { useState } from "react";
import { Settings, Building2, Shield, Bell, Save, Check } from "lucide-react";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Agency Settings</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
          Configure enterprise agency details, tax compliance, and defaults
        </p>
      </div>

      {saved && (
        <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 10, padding: 14, color: "#15803d", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={16} /> Settings saved successfully!
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
                <input type="text" defaultValue="Bachan Gas Service" style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>GSTIN / Tax ID *</label>
                <input type="text" defaultValue="08AABCJ9921D1Z1" style={inp} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>OMC Distributorship Code</label>
                <input type="text" defaultValue="INDANE-RJ-40291" style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Official Contact Phone *</label>
                <input type="text" defaultValue="+91 141 2780000" style={inp} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Registered Business Address</label>
              <textarea rows={2} defaultValue="Plot No. 42, Tonk Road, Industrial Area, Jaipur, Rajasthan 302018" style={{ ...inp, resize: "vertical" }} />
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
              <input type="number" defaultValue="5" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Default Payment Terms</label>
              <select defaultValue="Net 30 Days" style={sel}>
                <option>Net 15 Days</option>
                <option>Net 30 Days</option>
                <option>Net 45 Days</option>
                <option>Cash on Delivery</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}>
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

const inp: React.CSSProperties = { width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
