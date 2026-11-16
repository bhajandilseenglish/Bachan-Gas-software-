"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Phone, CheckCircle, Clock, ShieldAlert, TrendingDown, Users, ChevronRight } from "lucide-react";
import { useERPStore, getKolkataDateString, CustomerFollowUp, MissedOrderAlert } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function CustomerInactivityReportPage() {
  const { customers, missedOrderAlerts, followUpLogs } = useERPStore();
  const todayStr = getKolkataDateString();

  const totalMonitored = customers.filter(c => !!c.ordering_frequency && c.ordering_frequency !== "not_configured").length;
  const activeAlerts = missedOrderAlerts.filter(a => a.status === "active");
  const resolvedAlerts = missedOrderAlerts.filter(a => a.status === "resolved");

  // Outcome distribution
  const outcomeCounts: Record<string, number> = {};
  followUpLogs.forEach((f: CustomerFollowUp) => {
    outcomeCounts[f.result] = (outcomeCounts[f.result] || 0) + 1;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>
            Customer Inactivity & Ordering Retention Report
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Continuous operational audit of ordering cycles, missed refills, churn alerts, and sales team follow-up outcomes.
          </p>
        </div>
        <Link
          href="/customers/alerts"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 700,
            background: "#dc2626",
            color: "#fff",
            textDecoration: "none"
          }}
        >
          <AlertCircle size={14} /> Open Live Inactivity Hub ({activeAlerts.length})
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", marginBottom: 8 }}>
            <ShieldAlert size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Missed Refill Alerts</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626" }}>{activeAlerts.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Accounts past expected order cutoff (18:00 IST)
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2563eb", marginBottom: 8 }}>
            <Users size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Monitored Accounts</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#1e3a8a" }}>{totalMonitored}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            With defined ordering cadence
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Resolved / Retained</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a" }}>{resolvedAlerts.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Recovered via qualifying customer refill orders
          </div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#d97706", marginBottom: 8 }}>
            <Clock size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Follow-ups Logged</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#d97706" }}>{followUpLogs.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
            Sales calls & customer touchpoints recorded
          </div>
        </div>
      </div>

      {/* Grid: Cadence Breakdown & Outcomes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Cadence Breakdown */}
        <div style={{ ...card(), padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
            Ordering Frequency Distribution
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Daily (Refill Every Day)", count: customers.filter(c => c.ordering_frequency === "daily").length, color: "#ef4444" },
              { label: "Every 2 Days", count: customers.filter(c => c.ordering_frequency === "every_2_days").length, color: "#f97316" },
              { label: "Every 3 Days", count: customers.filter(c => c.ordering_frequency === "every_3_days").length, color: "#f59e0b" },
              { label: "Weekly (Every 7 Days)", count: customers.filter(c => c.ordering_frequency === "weekly").length, color: "#3b82f6" },
              { label: "Custom Days Interval", count: customers.filter(c => c.ordering_frequency === "custom").length, color: "#8b5cf6" },
              { label: "Ad-hoc / Not Monitored", count: customers.filter(c => !c.ordering_frequency || c.ordering_frequency === "not_configured").length, color: "#94a3b8" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{row.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: row.color }}>{row.count} accounts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up Outcomes */}
        <div style={{ ...card(), padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
            Staff Follow-up Outcomes Summary
          </h2>
          {Object.keys(outcomeCounts).length === 0 ? (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              No follow-up outcomes recorded yet. Follow-ups logged in the Missed Order Hub will appear here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(outcomeCounts).map(([outcome, cnt]) => (
                <div key={outcome} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>
                    {outcome.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#2563eb" }}>{cnt} calls</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#fef2f2", borderBottom: "1.5px solid #fee2e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#991b1b" }}>Active Inactivity Incidents Requiring Commercial Action</div>
            <div style={{ fontSize: 11, color: "#b91c1c" }}>Accounts flagged by automatic order evaluation past 18:00 IST cutoff</div>
          </div>
          <Link href="/customers/alerts" style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", textDecoration: "none" }}>
            View Hub →
          </Link>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Customer Name", "Consumer Code", "Mobile", "Last Order Date", "Expected Date", "Days Overdue", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <CheckCircle size={32} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, color: "#16a34a" }}>All Monitored Accounts Up to Date</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>No overdue refill cycles currently active.</div>
                </td>
              </tr>
            ) : (
              activeAlerts.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/customers/${a.customerId}`} style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", textDecoration: "none" }}>
                      {a.customerName}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, color: "#1e3a8a" }}>
                    {a.customerCode}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                    {a.mobile || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>
                    {a.lastOrderDate || "None"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, fontWeight: 700, color: "#dc2626" }}>
                    {a.expectedOrderDate}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 100, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 800 }}>
                      +{a.daysOverdue} days
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 100, background: "#dc2626", color: "#fff", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>
                      ORDER NOT RECEIVED
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
