"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Upload, Download, Plus, Eye, Pencil, Trash2, Users,
  CheckCircle, XCircle, IndianRupee, X, ChevronRight, RotateCcw
} from "lucide-react";
import { useERPStore, Customer } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Yet Configured";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const AVATAR_COLORS = ["#1e3a8a","#7c3aed","#0891b2","#16a34a","#f97316","#dc2626","#d97706","#2563eb"];
const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  commercial:   { bg: "#dbeafe", color: "#1d4ed8" },
  domestic:     { bg: "#fce7f3", color: "#9d174d" },
  industrial:   { bg: "#ede9fe", color: "#6d28d9" },
  institutional:{ bg: "#cffafe", color: "#0e7490" },
};

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  ...style,
});

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, deleteCustomer } = useERPStore();

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const qCat = searchParams.get("category");
    if (qCat) {
      setCat(qCat);
    } else {
      setCat("all");
    }
  }, [searchParams]);

  const filtered = customers.filter(c => {
    const ms = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.business.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const mc = cat === "all" || c.category === cat;
    const mst = status === "all" || c.status === status;
    return ms && mc && mst;
  });

  const activeCount = customers.filter(c => c.status === "active").length;
  const totalOut = customers.reduce((a, c) => a + (c.outstanding || 0), 0);

  // Real CSV Export
  const handleExportCSV = () => {
    const headers = ["Consumer ID", "Code", "Name", "Business Name", "Category", "Mobile", "City", "Area", "Status", "Credit Limit", "Outstanding", "Overdue", "Last Supply"];
    const rows = filtered.map(c => [
      c.id,
      c.code,
      `"${c.name}"`,
      `"${c.business}"`,
      c.category,
      c.mobile,
      `"${c.city}"`,
      `"${c.area}"`,
      c.status,
      c.credit_limit,
      c.outstanding,
      c.overdue,
      c.last_supply
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_Customers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Customer Master Register
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            {customers.length} total registered customers · {activeCount} active commercial accounts
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/customers/import" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, fontSize:12.5, fontWeight:600, background:"#fff", color:"#64748b", border:"1.5px solid #e2e8f0", textDecoration:"none" }}>
            <Upload size={14} /> Import Excel (60k+)
          </Link>
          <button onClick={handleExportCSV} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, fontSize:12.5, fontWeight:600, background:"#fff", color:"#64748b", border:"1.5px solid #e2e8f0", cursor:"pointer" }}>
            <Download size={14} /> Export CSV
          </button>
          <Link href="/customers/new" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12.5, fontWeight:600, background:"#f97316", color:"#fff", textDecoration:"none" }}>
            <Plus size={14} /> Add Customer
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Customers", val: customers.length, Icon: Users, color: "#1e3a8a" },
          { label: "Active Accounts", val: activeCount, Icon: CheckCircle, color: "#16a34a" },
          { label: "Inactive / Suspended", val: customers.length - activeCount, Icon: XCircle, color: "#64748b" },
          { label: "Total Outstanding Due", val: INR(totalOut), Icon: IndianRupee, color: "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ ...card(), padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...card(), padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 13px", flex:1, minWidth:240, background:"#f8fafc" }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, business, consumer code, mobile, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background:"transparent", border:"none", outline:"none", fontSize:13, color:"#1e293b", width:"100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color:"#94a3b8", cursor:"pointer", display:"flex", background:"none", border:"none" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 13px", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", cursor:"pointer" }}>
          <option value="all">All Categories</option>
          <option value="commercial">Commercial</option>
          <option value="domestic">Domestic</option>
          <option value="industrial">Industrial</option>
          <option value="institutional">Institutional</option>
        </select>

        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ border:"1.5px solid #e2e8f0", borderRadius:8, padding:"8px 13px", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", cursor:"pointer" }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        {(search || cat !== "all" || status !== "all") && (
          <button
            onClick={() => { setSearch(""); setCat("all"); setStatus("all"); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#dc2626", background: "#fee2e2", border: "none", cursor: "pointer" }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
          Showing {filtered.length} of {customers.length} customers
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {["Customer","Consumer Code","Mobile","City / Area","Category","Outstanding (Dr)","Credit Limit","Last Supply","Status","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#64748b", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No customers match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const pct = (c.credit_limit || 0) > 0 ? (((c.outstanding || 0) / c.credit_limit!) * 100) : 0;
                  const barCol = pct >= 90 ? "#dc2626" : pct >= 70 ? "#f97316" : "#16a34a";
                  const catS = CAT_STYLE[c.category] || { bg: "#f1f5f9", color: "#475569" };

                  return (
                    <tr key={c.id}
                      style={{ borderBottom: "1px solid #e2e8f0", cursor: "pointer", transition: "background .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width:34, height:34, borderRadius:8, background: AVATAR_COLORS[i % AVATAR_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
                            {c.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{c.business}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:"#1e3a8a", fontSize:12 }}>{c.code}</span>
                      </td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12.5 }} onClick={() => router.push(`/customers/${c.id}`)}>{c.mobile}</td>
                      <td style={{ padding:"12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        <div style={{ fontSize:12.5, fontWeight:600, color:"#1e293b" }}>{c.city}</div>
                        <div style={{ fontSize:11, color:"#64748b" }}>{c.area}</div>
                      </td>
                      <td style={{ padding:"12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:100, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", background:catS.bg, color:catS.color }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.outstanding !== null ? (
                          <>
                            <div style={{ fontWeight:800, color: (c.outstanding || 0) > 0 ? "#dc2626" : "#16a34a", fontSize:13 }}>
                              {INR(c.outstanding)}
                            </div>
                            {(c.outstanding || 0) > 0 && (c.credit_limit || 0) > 0 && (
                              <div style={{ height:4, background:"#f0f4fa", borderRadius:100, overflow:"hidden", marginTop:5, width:75 }}>
                                <div style={{ width: `${Math.min(pct,100)}%`, height:"100%", background:barCol, borderRadius:100 }} />
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>Not Yet Configured</span>
                        )}
                      </td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:13 }} onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.credit_limit !== null ? INR(c.credit_limit) : <span style={{ color: "#94a3b8", fontSize: 11, fontStyle: "italic" }}>Not Configured</span>}
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b" }} onClick={() => router.push(`/customers/${c.id}`)}>{c.last_supply}</td>
                      <td style={{ padding:"12px 16px" }} onClick={() => router.push(`/customers/${c.id}`)}>
                        <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:100, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", background: c.status==="active"?"#dcfce7":"#f1f5f9", color: c.status==="active"?"#15803d":"#475569" }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <Link href={`/customers/${c.id}`}
                            style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", color:"#1e3a8a", background:"#dbeafe", textDecoration:"none" }}
                            title="View complete customer profile"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link href={`/customers/${c.id}/edit`}
                            style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b", background:"#f1f5f9", textDecoration:"none" }}
                            title="Edit customer details"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete customer ${c.name} (${c.code})?`)) {
                                deleteCustomer(c.id);
                              }
                            }}
                            style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626", background:"#fee2e2", border:"none", cursor:"pointer" }}
                            title="Delete customer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid #e2e8f0" }}>
          <span style={{ fontSize:12, color:"#64748b" }}>
            Showing {filtered.length} of {customers.length} registered accounts
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
