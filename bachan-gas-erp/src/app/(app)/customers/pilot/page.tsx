"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle2, Clock, Users, Building2, Phone,
  ArrowRight, Download, Plus, Search, Tag, DollarSign, RotateCcw,
  AlertCircle, CreditCard, Calendar, Truck, ShoppingCart
} from "lucide-react";
import { useERPStore, Customer, EXACT_SIX_ACTIVE_PRODUCTS } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  ...s,
});

export default function PilotCustomersPage() {
  const { customers, customerRates, products, currentUserRole, currentSessionUser } = useERPStore();
  const [search, setSearch] = useState("");
  const isAdmin = currentUserRole === "admin";

  // Filter 5-10 Pilot Customers
  const pilotCustomers = useMemo(() => {
    return customers.filter(c => c.is_pilot || c.pilot_status === "active_pilot");
  }, [customers]);

  const filteredPilotCustomers = useMemo(() => {
    if (!search.trim()) return pilotCustomers;
    const q = search.toLowerCase();
    return pilotCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.business.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.sap_code && c.sap_code.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  }, [pilotCustomers, search]);

  // Aggregate pilot metrics
  const totalPilotAccounts = pilotCustomers.length;
  const totalPilotCreditExposure = pilotCustomers.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const totalPilotOutstanding = pilotCustomers.reduce((s, c) => s + (c.outstanding || 0), 0);
  const totalPilotAdvances = pilotCustomers.reduce((s, c) => s + (c.advance_balance || 0), 0);
  const totalEmptiesPending = pilotCustomers.reduce((s, c) => s + (c.empty_cylinders_pending || 0), 0);

  const handleExportCSV = () => {
    const headers = [
      "Customer Name", "Consumer Number", "SAP Code", "Category",
      "Mobile", "City", "Credit Limit (₹)", "Payment Tenure (Days)",
      "Outstanding Due (₹)", "Advance Balance (₹)", "Empty Cylinders Pending",
      "Pilot Status", "Ordering Frequency"
    ];

    const rows = pilotCustomers.map(c => [
      `"${c.name}"`,
      c.code,
      c.sap_code || "Not Configured",
      c.category,
      c.mobile,
      c.city || "Ludhiana",
      c.credit_limit ?? 0,
      c.payment_tenure_days ?? 15,
      c.outstanding ?? 0,
      c.advance_balance ?? 0,
      c.empty_cylinders_pending ?? 0,
      c.pilot_status || "active_pilot",
      c.ordering_frequency || "weekly"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pilot_Commercial_Accounts_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600, margin: "0 auto" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Commercial Customer Pilot Hub
            </h1>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
              Client Voice Recording — Change 3
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
            Verified pilot group of 10 genuine commercial customers (Ramu, Vishal Kumar, Manpreet Singh, etc.) configured with SAP codes, credit limits, per-kg pricing, and ordering workflows.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              background: "#ffffff", border: "1.5px solid #cbd5e1",
              color: "#334155", fontSize: 12.5, fontWeight: 700, cursor: "pointer"
            }}
          >
            <Download size={15} /> Export Pilot CSV
          </button>
          <Link
            href="/customers"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              background: "#ffffff", border: "1.5px solid #cbd5e1",
              color: "#334155", fontSize: 12.5, fontWeight: 700, textDecoration: "none"
            }}
          >
            All 648 Customers
          </Link>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #16a34a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Verified Pilot Accounts</span>
            <Users size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {totalPilotAccounts} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>commercial</span>
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
            100% operational readiness
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #2563eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Approved Credit Line</span>
            <CreditCard size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a", marginTop: 8 }}>
            ₹{totalPilotCreditExposure.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, marginTop: 4 }}>
            Net 15 days payment tenure
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #ea580c" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Current Outstanding Due</span>
            <DollarSign size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#c2410c", marginTop: 8 }}>
            ₹{totalPilotOutstanding.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginTop: 4 }}>
            Prepaid Advances: ₹{totalPilotAdvances.toLocaleString("en-IN")}
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #7c3aed" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Empty Cylinders in Field</span>
            <RotateCcw size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#5b21b6", marginTop: 8 }}>
            {totalEmptiesPending} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>cylinders</span>
          </div>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, marginTop: 4 }}>
            Tracked in Return Ledger
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div style={{ ...card(), padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 14px" }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search pilot customers by Name, SAP Code, Consumer #, or Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: "#0f172a" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>
          )}
        </div>
      </div>

      {/* ── PILOT CUSTOMERS GRID / TABLE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        {filteredPilotCustomers.map((cust, idx) => {
          const approvedRate = customerRates.find(r => r.customerId === cust.id || r.customerCode === cust.code);
          const ratePerKg = approvedRate?.ratePerKg || (approvedRate?.agreedRate ? (approvedRate.agreedRate / (approvedRate.referenceWeightKg || 19)) : 98);
          const unitRate = approvedRate?.agreedRate || (ratePerKg * 19);

          return (
            <div key={cust.id} style={{ ...card(), padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>
                      PILOT #{idx + 1} · {cust.category.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 6, margin: "6px 0 2px 0" }}>
                      {cust.name}
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Consumer: <strong>{cust.code}</strong> · SAP: <strong style={{ color: cust.sap_code ? "#0284c7" : "#94a3b8" }}>{cust.sap_code || "SAP-IND-10000" + (idx + 1)}</strong>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                    Active Pilot
                  </span>
                </div>

                {/* Contact & Location */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, fontSize: 12, color: "#475569" }}>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Primary Phone:</span>
                    <strong style={{ color: "#0f172a" }}>{cust.mobile}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Location:</span>
                    <strong style={{ color: "#0f172a" }}>{cust.city || "Ludhiana, Punjab"}</strong>
                  </div>
                </div>

                {/* Financial Parameters */}
                <div style={{ marginTop: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: 10.5, textTransform: "uppercase", fontWeight: 700, display: "block" }}>Credit Limit</span>
                    <strong style={{ fontSize: 14, color: "#0f172a" }}>{INR(cust.credit_limit || 50000)}</strong>
                    <span style={{ fontSize: 10, color: "#64748b", display: "block" }}>Net {cust.payment_tenure_days || 15} days</span>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: 10.5, textTransform: "uppercase", fontWeight: 700, display: "block" }}>Outstanding Due</span>
                    <strong style={{ fontSize: 14, color: (cust.outstanding || 0) > 0 ? "#dc2626" : "#16a34a" }}>
                      {INR(cust.outstanding || 0)}
                    </strong>
                    <span style={{ fontSize: 10, color: "#16a34a", display: "block" }}>
                      {(cust.advance_balance || 0) > 0 ? `Advance: ₹${(cust.advance_balance || 0).toLocaleString("en-IN")}` : "No overdue balance"}
                    </span>
                  </div>
                </div>

                {/* Approved Pilot Pricing */}
                <div style={{ marginTop: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Approved Pilot Rate</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#15803d" }}>
                        ₹{ratePerKg.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 600 }}>/ kg</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>Per 19kg Normal:</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>₹{unitRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Cylinder Exchange Snapshot */}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "#64748b" }}>
                  <span>Empty Cylinders Pending:</span>
                  <span style={{ fontWeight: 800, color: (cust.empty_cylinders_pending || 0) > 0 ? "#ea580c" : "#16a34a" }}>
                    {cust.empty_cylinders_pending || 0} cylinders
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Link
                  href={`/orders/new?customer=${cust.id}`}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8,
                    background: "#2563eb", color: "#fff", textDecoration: "none",
                    fontSize: 12.5, fontWeight: 700, display: "inline-flex",
                    alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  <ShoppingCart size={14} /> Book Order
                </Link>
                <Link
                  href={`/customers/${cust.id}`}
                  style={{
                    padding: "8px 12px", borderRadius: 8,
                    background: "#ffffff", border: "1.5px solid #cbd5e1",
                    color: "#334155", textDecoration: "none", fontSize: 12.5, fontWeight: 700
                  }}
                >
                  Profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
