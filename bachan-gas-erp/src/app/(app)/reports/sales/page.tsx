"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, ShoppingBag, CreditCard, Download } from "lucide-react";
import { useERPStore } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function SalesReportsPage() {
  const { invoices, payments, orders } = useERPStore();

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const pendingCollection = Math.max(0, totalInvoiced - totalCollected);

  // Dynamic monthly buckets
  const hasData = invoices.length > 0 || payments.length > 0;
  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "short" });

  const monthlyData = [
    {
      month: currentMonth,
      sales: totalInvoiced,
      collections: totalCollected,
    }
  ];

  // Customer wise sales
  const customerSalesMap: Record<string, number> = {};
  orders.forEach(o => {
    customerSalesMap[o.customerName] = (customerSalesMap[o.customerName] || 0) + o.total;
  });

  const customerWise = Object.entries(customerSalesMap).map(([name, sales]) => ({
    name: name.length > 15 ? name.substring(0, 15) + "…" : name,
    sales,
  })).slice(0, 5);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Sales & Revenue Reports</h1>
        <p className="page-sub">Monthly sales invoiced, collections realized, and customer revenue breakdown</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Invoiced Sales", val: INR(totalInvoiced), color: "var(--navy)" },
          { label: "Total Realized Collections", val: INR(totalCollected), color: "var(--green)" },
          { label: "Pending Collection", val: INR(pendingCollection), color: "var(--red)" }
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Sales vs Collections</span></div>
          <div style={{ padding: "20px 10px 10px", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hasData ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15}/><stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--fg2)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--fg2)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} formatter={(v: any) => [INR(Number(v || 0)), ""]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#1e3a8a" fill="url(#gS)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="collections" name="Collections" stroke="#f97316" fill="url(#gC)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <TrendingUp size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 700, color: "#334155" }}>Zero Sales Transactions Recorded</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Invoiced sales and collection graphs will populate automatically as supply orders are billed.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top Revenue Accounts</span></div>
          <div style={{ padding: "20px 10px 10px", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {customerWise.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={customerWise} layout="vertical" margin={{ left: 15, right: 15 }}>
                  <XAxis type="number" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "var(--fg2)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--fg2)" }} width={80} />
                  <Tooltip formatter={(v: any) => [INR(Number(v || 0)), "Sales"]} />
                  <Bar dataKey="sales" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b" }}>
                <ShoppingBag size={32} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>No Account Sales Yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
