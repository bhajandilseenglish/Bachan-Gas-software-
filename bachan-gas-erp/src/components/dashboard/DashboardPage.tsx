"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IndianRupee, AlertCircle, CreditCard, TrendingUp, Lock, CheckCircle2,
  Users, Building2, ShoppingCart, Clock, Package, Truck, RefreshCw,
  Calendar, ChevronRight, AlertTriangle, TrendingDown, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useERPStore } from "@/lib/store";

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  draft:               { bg: "#f1f5f9", color: "#475569", label: "Draft" },
  confirmed:           { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" },
  approved:            { bg: "#ede9fe", color: "#6d28d9", label: "Approved" },
  pending_dispatch:    { bg: "#fef3c7", color: "#92400e", label: "Pending Dispatch" },
  partially_delivered: { bg: "#cffafe", color: "#0e7490", label: "Part. Delivered" },
  delivered:           { bg: "#dcfce7", color: "#15803d", label: "Delivered" },
  cancelled:           { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const LAKHS = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Configured";
  if (n === 0) return "₹0";
  return n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${(n / 1000).toFixed(1)}k`;
};

type IconComponent = React.ElementType;

function MetCard({ title, value, sub, Icon, color, trend, trendUp, href }: {
  title: string; value: string; sub: string; Icon: IconComponent;
  color: string; trend?: string; trendUp?: boolean; href: string;
}) {
  return (
    <Link href={href} style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 18,
      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      cursor: "pointer", overflow: "hidden", position: "relative",
      textDecoration: "none", color: "inherit", display: "block",
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
    >
      {trend && (
        <div style={{
          position: "absolute", top: 14, right: 14,
          fontSize: 11, fontWeight: 700,
          color: trendUp ? "#16a34a" : "#dc2626",
          display: "flex", alignItems: "center", gap: 2,
        }}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: color + "18", marginBottom: 12,
      }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 900, color: "#1e293b", letterSpacing: "-.5px" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color }}>{sub}</div>
    </Link>
  );
}

function MiniCard({ val, label, Icon, color, href }: {
  val: string | number; label: string; Icon: IconComponent; color: string; href: string;
}) {
  return (
    <Link href={href} style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 10, padding: 13,
      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      cursor: "pointer", textDecoration: "none", color: "inherit", display: "block",
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Icon size={17} color={color} />
        <ChevronRight size={13} color="#cbd5e1" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3, fontWeight: 500, marginTop: 2 }}>{label}</div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { customers, orders, deliveries, invoices, payments, settings } = useERPStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      router.refresh();
    }, 400);
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // Calculate live financial KPIs from actual store data
  const configuredOutstandingCustomers = customers.filter(c => c.outstanding !== null && c.outstanding !== undefined);
  const hasConfiguredBalances = configuredOutstandingCustomers.length > 0;
  const totalReceivables = hasConfiguredBalances
    ? configuredOutstandingCustomers.reduce((s, c) => s + (c.outstanding || 0), 0)
    : null;

  const totalOverdue = customers.reduce((s, c) => s + (c.overdue || 0), 0);
  const totalCreditLimits = customers.reduce((s, c) => s + (c.credit_limit || 0), 0);
  const availableCredit = totalCreditLimits > 0 ? Math.max(0, totalCreditLimits - (totalReceivables || 0)) : null;

  // Operations KPIs
  const totalCustomers = customers.length;
  const activeCommercial = customers.filter(c => c.category === "commercial" && c.status === "active").length;
  const pendingApproval = orders.filter(o => o.status === "confirmed").length;
  const pendingDispatch = orders.filter(o => o.status === "pending_dispatch").length;
  const completedDeliveries = deliveries.filter(d => d.status === "delivered").length;
  const cylindersOrdered = orders.reduce((s, o) => s + o.totalQty, 0);
  const cylindersDelivered = deliveries.filter(d => d.status === "delivered").reduce((s, d) => s + d.qty, 0);

  // High outstanding customers
  const topOutstanding = [...customers]
    .filter(c => (c.outstanding || 0) > 0)
    .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0))
    .slice(0, 5);

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  // Near credit limit count
  const nearCreditLimitCount = customers.filter(c => (c.credit_limit || 0) > 0 && ((c.outstanding || 0) / c.credit_limit!) >= 0.9).length;
  const overdueInvoicesCount = invoices.filter(i => i.status === "overdue").length;

  // Real Dynamic Chart Calculation
  const hasFinancialData = invoices.length > 0 || payments.length > 0;
  const hasOrderData = orders.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1600 }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
              Operations & Financial Dashboard
            </h1>
            <span style={{
              background: "#dcfce7", color: "#15803d", border: "1px solid #86efac",
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700
            }}>
              LIVE PRODUCTION
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {todayStr} — {settings.tradeName} (Distributor Code: {settings.distributorshipCode})
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={refresh}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 600,
              background: "#fff", color: "#64748b",
              border: "1.5px solid #e2e8f0", cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Sync Dashboard
          </button>
          <Link
            href="/orders/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 600,
              background: "#f97316", color: "#fff", textDecoration: "none"
            }}
          >
            + New Supply Order
          </Link>
        </div>
      </div>

      {/* ── Financial KPIs ── */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#64748b", marginBottom: 12 }}>
          Financial Position & Receivables
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }} className="metric-grid-6">
          <MetCard
            title="Total Receivables"
            value={totalReceivables !== null ? LAKHS(totalReceivables) : "Not Configured"}
            sub={hasConfiguredBalances ? `from ${configuredOutstandingCustomers.length} accounts` : "Opening balances not yet set"}
            Icon={IndianRupee}
            color="#1e3a8a"
            href="/finance/outstanding"
          />
          <MetCard
            title="Overdue Balance"
            value={totalOverdue > 0 ? LAKHS(totalOverdue) : "₹0"}
            sub={totalOverdue > 0 ? `${customers.filter(c => (c.overdue || 0) > 0).length} overdue accounts` : "Zero overdue accounts"}
            Icon={AlertCircle}
            color="#dc2626"
            href="/finance/outstanding"
          />
          <MetCard
            title="Today's Collections"
            value={LAKHS(payments.reduce((s, p) => s + p.amount, 0))}
            sub={`${payments.length} receipts cleared`}
            Icon={CreditCard}
            color="#16a34a"
            href="/finance/payments"
          />
          <MetCard
            title="Billed Invoices"
            value={LAKHS(invoices.reduce((s, i) => s + i.total, 0))}
            sub={`${invoices.length} invoices generated`}
            Icon={TrendingUp}
            color="#7c3aed"
            href="/finance/invoices"
          />
          <MetCard
            title="Sanctioned Credit"
            value={totalCreditLimits > 0 ? LAKHS(totalCreditLimits) : "Not Configured"}
            sub={totalCreditLimits > 0 ? "Across active customers" : "Set in Customer Master"}
            Icon={Lock}
            color="#2563eb"
            href="/finance/credit"
          />
          <MetCard
            title="Available Credit"
            value={availableCredit !== null ? LAKHS(availableCredit) : "Not Configured"}
            sub={totalCreditLimits > 0 ? `${Math.round(((availableCredit || 0) / totalCreditLimits) * 100)}% available room` : "Credit terms unconfigured"}
            Icon={CheckCircle2}
            color="#0891b2"
            href="/finance/credit"
          />
        </div>
      </div>

      {/* ── Operational Mini KPIs ── */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#64748b", marginBottom: 12 }}>
          LPG Logistics & Customer Register Status
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }} className="metric-grid-6">
          <MiniCard val={totalCustomers} label="Registered Customers" Icon={Users} color="#1e3a8a" href="/customers" />
          <MiniCard val={activeCommercial} label="Active Commercial Accounts" Icon={Building2} color="#16a34a" href="/customers?category=commercial" />
          <MiniCard val={pendingApproval} label="Orders Awaiting Dispatch" Icon={Clock} color="#d97706" href="/orders" />
          <MiniCard val={pendingDispatch} label="Orders In Transit" Icon={Truck} color="#f97316" href="/deliveries?status=pending" />
          <MiniCard val={cylindersOrdered} label="Total Cylinders Ordered" Icon={Package} color="#7c3aed" href="/orders" />
          <MiniCard val={completedDeliveries} label="Deliveries Completed" Icon={CheckCircle2} color="#059669" href="/deliveries" />
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="chart-grid">
        {/* Sales & Collections */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Monthly Invoiced Sales vs Collections</span>
            <Link href="/reports/sales" style={{ fontSize: 11.5, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>View Sales Report →</Link>
          </div>
          <div style={{ padding: "20px 16px 10px", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hasFinancialData ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart
                  data={[
                    {
                      month: new Date().toLocaleDateString("en-IN", { month: "short" }),
                      sales: invoices.reduce((s, i) => s + i.total, 0),
                      collections: payments.reduce((s, p) => s + p.amount, 0),
                    }
                  ]}
                  margin={{ top: 5, right: 5, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sales" name="Invoiced Sales" stroke="#1e3a8a" fill="#1e3a8a20" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="collections" name="Collections Received" stroke="#f97316" fill="#f9731620" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#64748b" }}>
                <TrendingUp size={32} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>No Financial Billing Transactions Yet</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, maxWidth: 360 }}>
                  Monthly invoiced sales and collection graphs will automatically generate once orders are confirmed and billed.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Volume */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Weekly Supply Demand</span>
            <Link href="/reports/deliveries" style={{ fontSize: 11.5, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>Fleet Report →</Link>
          </div>
          <div style={{ padding: "20px 10px 10px", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hasOrderData ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={[
                    {
                      day: "Today",
                      orders: orders.length,
                      delivered: deliveries.filter(d => d.status === "delivered").length,
                    }
                  ]}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" name="Ordered" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="delivered" name="Delivered" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#64748b" }}>
                <Truck size={32} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Today&apos;s Orders: 0 · Pending Deliveries: 0</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                  No cylinder deliveries scheduled for today.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tables Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="table-grid">
        {/* Recent Orders */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Recent Orders Pipeline</span>
            <Link href="/orders" style={{ fontSize: 12, fontWeight: 600, color: "#f97316", textDecoration: "none" }}>View all orders →</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                <ShoppingCart size={32} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>No Active Supply Orders</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  All orders have been fulfilled or pipeline is clean. Click &quot;+ New Supply Order&quot; to book a delivery.
                </div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Order #", "Customer", "Cylinders", "Total (₹)", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => {
                    const s = STATUS_META[o.status] || STATUS_META.draft;
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "11px 16px", fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#1e3a8a" }}>{o.num}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ fontWeight: 600, fontSize: 12.5, color: "#1e293b" }}>{o.customerName}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{o.date}</div>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 12.5, fontWeight: 600 }}>{o.totalQty} cyl</td>
                        <td style={{ padding: "11px 16px", fontSize: 12.5, fontWeight: 700 }}>₹{o.total.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <Link href={`/orders/${o.id}`} style={{ fontSize: 11.5, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Outstanding Customers */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Highest Receivables</span>
            <Link href="/finance/outstanding" style={{ fontSize: 12, fontWeight: 600, color: "#f97316", textDecoration: "none" }}>All balances →</Link>
          </div>
          <div style={{ padding: "8px 12px" }}>
            {topOutstanding.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "#64748b" }}>
                <CheckCircle2 size={32} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>All Accounts Clear</div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                  Zero outstanding overdue accounts in register.
                </div>
              </div>
            ) : (
              topOutstanding.map(c => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 8, textDecoration: "none", color: "inherit",
                    borderBottom: "1px solid #f8fafc",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Code: {c.code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>{INR(c.outstanding)}</div>
                    <div style={{ fontSize: 10.5, color: (c.overdue || 0) > 0 ? "#dc2626" : "#64748b" }}>
                      {(c.overdue || 0) > 0 ? `Overdue: ${INR(c.overdue)}` : "Current due"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
