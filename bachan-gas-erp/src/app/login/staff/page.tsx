"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useERPStore } from "@/lib/store";
import { Users, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginUser } = useERPStore();
  const [username, setUsername] = useState("staff");
  const [password, setPassword] = useState("staff123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = loginUser(username, password, "staff");
      if (!res.success) {
        setError(res.error || "Authentication failed. Staff credentials required.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        minHeight: "100vh",
        width: "100%",
        overflowY: "auto",
        background: "radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0f172a 45%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, margin: "auto" }}>
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#94a3b8",
              textDecoration: "none",
              transition: "color .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <ArrowLeft size={14} /> Back to Portal Selection
          </Link>
        </div>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(2, 132, 199, 0.35)",
              marginBottom: 12,
            }}
          >
            <Users size={28} color="#ffffff" />
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.4px",
              margin: "0 0 4px 0",
            }}
          >
            Bachan Gas Service
          </h1>

          <p
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 4px 0",
            }}
          >
            Operations Staff Portal
          </p>

          <p style={{ fontSize: 11.5, color: "#64748b", margin: 0 }}>
            IOCL Code: 0000110351 · Ludhiana, Punjab
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 18,
            padding: 26,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                Sign In to Operations
              </h2>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0 0" }}>
                Daily operations & delivery workflows
              </p>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 6,
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              Staff Role
            </span>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(220, 38, 38, 0.15)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "#fca5a5",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  marginBottom: 6,
                }}
              >
                Staff Username
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="staff"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px 10px 38px",
                    borderRadius: 8,
                    background: "#020617",
                    border: "1.5px solid #334155",
                    color: "#ffffff",
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0284c7")}
                  onBlur={(e) => (e.target.style.borderColor = "#334155")}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  marginBottom: 6,
                }}
              >
                Staff Password
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px 10px 38px",
                    borderRadius: 8,
                    background: "#020617",
                    border: "1.5px solid #334155",
                    color: "#ffffff",
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color .15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0284c7")}
                  onBlur={(e) => (e.target.style.borderColor = "#334155")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "11px 16px",
                borderRadius: 8,
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
                opacity: loading ? 0.7 : 1,
                transition: "background .15s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#0369a1";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#0284c7";
              }}
            >
              {loading ? "Authenticating..." : "Sign In to Operations"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Role permissions note */}
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(2, 6, 23, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#cbd5e1" }}>
              Staff Permitted Activities:
            </p>
            <p style={{ margin: 0 }}>• Customer lookups & submit new registrations for approval</p>
            <p style={{ margin: 0 }}>• Record deliveries & empty cylinder returns</p>
            <p style={{ margin: 0 }}>• Record godown stock receipts & customer payment receipts</p>
            <p style={{ margin: "4px 0 0 0", color: "#f59e0b" }}>
              Note: Staff cannot modify rates, approve customers, or change credit limits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11.5, color: "#64748b", marginTop: 22 }}>
          Bachan Gas Service ERP · Enterprise Commercial LPG Management
        </p>
      </div>
    </div>
  );
}
