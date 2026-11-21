"use client";
import Link from "next/link";
import { TrendingUp, Truck, PieChart, ArrowRight, BarChart2, FileSpreadsheet, Download } from "lucide-react";
import { useERPStore } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function ReportsHubPage() {
  const { orders, deliveries, invoices, payments } = useERPStore();

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalDeliveries = deliveries.filter(d => d.status === "delivered").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Reports & Business Intelligence</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
          Access executive analytics, dispatch efficiency, sales trends, and financial audits
        </p>
      </div>

      {/* Report Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {/* Sales & Month-over-Month Comparison */}
        <Link href="/reports/sales?tab=daily" style={{ ...card(), padding: 24, textDecoration: "none", color: "inherit", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1e3a8a15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <TrendingUp size={22} color="#1e3a8a" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Daily Sales & Month Comparison</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 16px", lineHeight: 1.5 }}>
            Daily order volumes, per-kg rate realization, and Month-over-Month comparison vs last month.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>₹{(totalInvoiced/100000).toFixed(2)}L Invoiced</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
              Open Report <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        {/* Client Wise Saving Report */}
        <Link href="/reports/sales?tab=savings" style={{ ...card(), padding: 24, textDecoration: "none", color: "inherit", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#16a34a15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BarChart2 size={22} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Client Wise Saving Report</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 16px", lineHeight: 1.5 }}>
            Commercial customer discount analysis: Master standard rate vs client agreed rate, per-cyl savings and total net benefit.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Contract Savings</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
              Open Report <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        {/* Cylinder Ledger & Returns */}
        <Link href="/cylinder-returns" style={{ ...card(), padding: 24, textDecoration: "none", color: "inherit", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#0284c715", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Truck size={22} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Cylinder Returns & Ledger</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 16px", lineHeight: 1.5 }}>
            Empty cylinder collection tracking, customer exchange liability, and driver return receipts.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0284c7" }}>Empty Exchange</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
              Open Returns <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        {/* Delivery Operations */}
        <Link href="/reports/deliveries" style={{ ...card(), padding: 24, textDecoration: "none", color: "inherit", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#16a34a15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Truck size={22} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Delivery Operations & Fleet</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 16px", lineHeight: 1.5 }}>
            Fleet vehicle trip tracking, cylinders supplied, driver on-time metrics, and dispatch bottlenecks.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{totalDeliveries} Completed Trips</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
              Open Report <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        {/* Financial Audit */}
        <Link href="/reports/financial" style={{ ...card(), padding: 24, textDecoration: "none", color: "inherit", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#7c3aed15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <PieChart size={22} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Financial Audit & Aging</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "6px 0 16px", lineHeight: 1.5 }}>
            Receivables aging breakdown (0-30, 31-60, &gt;60 days), recovery efficiency, and collection liquidity.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>₹{(totalCollected/100000).toFixed(2)}L Collected</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
              Open Report <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

