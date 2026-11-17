"use client";

import Link from "next/link";
import { ShieldCheck, Users, ArrowRight, Flame } from "lucide-react";

export default function LoginPage() {
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
      <div style={{ width: "100%", maxWidth: 680, margin: "auto" }}>
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)",
              marginBottom: 14,
            }}
          >
            <Flame size={32} color="#ffffff" />
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              margin: "0 0 6px 0",
            }}
          >
            Bachan Gas Service
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
              margin: "0 0 14px 0",
              fontWeight: 500,
            }}
          >
            Commercial LPG Distribution ERP
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              borderRadius: 9999,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 12,
              color: "#cbd5e1",
            }}
          >
            <span>
              IOCL Distributor Code: <strong style={{ color: "#ffffff" }}>0000110351</strong>
            </span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>Ludhiana, Punjab</span>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Admin Portal Card */}
          <Link
            href="/login/admin"
            style={{
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textDecoration: "none",
              color: "inherit",
              transition: "transform .18s, border-color .18s, box-shadow .18s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.8)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(249, 115, 22, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.3)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.5)";
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(249, 115, 22, 0.15)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={24} color="#f97316" />
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(249, 115, 22, 0.12)",
                    color: "#f97316",
                    border: "1px solid rgba(249, 115, 22, 0.25)",
                  }}
                >
                  Full Governance
                </span>
              </div>

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "0 0 8px 0",
                }}
              >
                Administrator
              </h2>

              <p
                style={{
                  fontSize: 12.5,
                  color: "#94a3b8",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Full governance: customer onboarding approvals, product rate master, credit limits, godown inventory, and financial audit logs.
              </p>
            </div>

            <div
              style={{
                marginTop: 22,
                paddingTop: 14,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 700,
                color: "#f97316",
              }}
            >
              <span>Admin Login</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Staff Portal Card */}
          <Link
            href="/login/staff"
            style={{
              background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textDecoration: "none",
              color: "inherit",
              transition: "transform .18s, border-color .18s, box-shadow .18s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.8)";
              e.currentTarget.style.boxShadow = "0 16px 36px rgba(56, 189, 248, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.3)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.5)";
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={24} color="#38bdf8" />
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(56, 189, 248, 0.12)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                  }}
                >
                  Operations Role
                </span>
              </div>

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: "0 0 8px 0",
                }}
              >
                Operations Staff
              </h2>

              <p
                style={{
                  fontSize: 12.5,
                  color: "#94a3b8",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Operational tasks: customer lookups, order processing, delivery recording, cylinder returns, and stock receipts.
              </p>
            </div>

            <div
              style={{
                marginTop: 22,
                paddingTop: 14,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 700,
                color: "#38bdf8",
              }}
            >
              <span>Staff Login</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        {/* Security Notice */}
        <div style={{ textAlign: "center", color: "#64748b", fontSize: 11.5, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Protected Enterprise System · Authenticated Session Required</p>
          <p style={{ margin: "2px 0 0 0" }}>Role-based access strictly enforced according to business security policies</p>
        </div>
      </div>
    </div>
  );
}
