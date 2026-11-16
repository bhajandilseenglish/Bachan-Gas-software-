"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Clock, CheckCircle2, XCircle, Search, Plus, Filter, ShieldCheck, X, Check, ArrowRight
} from "lucide-react";
import { useERPStore, RateChangeRequest } from "@/lib/store";

const INR = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "Not Set";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function RateRequestsPage() {
  const {
    rateChangeRequests,
    currentUserRole,
    customers,
    products,
    requestRateChange,
    approveRateChange,
    rejectRateChange
  } = useERPStore();

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [rejectModalReq, setRejectModalReq] = useState<RateChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  // New request form state
  const [custId, setCustId] = useState(customers[0]?.id || "");
  const [prodId, setProdId] = useState(products.filter(p => p.active)[0]?.id || "");
  const [rateVal, setRateVal] = useState("");
  const [reason, setReason] = useState("");

  const isAdmin = currentUserRole === "admin";
  const activeProducts = products.filter(p => p.active);

  const filtered = rateChangeRequests.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch =
      !search ||
      r.num.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = rateChangeRequests.filter(r => r.status === "pending").length;

  const handleApprove = (id: string) => {
    approveRateChange(id, isAdmin ? "Bachan Admin" : "Authorized Admin");
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    rejectRateChange(rejectModalReq.id, rejectReason || "Rate adjustment not commercially viable", "Bachan Admin");
    setRejectModalReq(null);
    setRejectReason("");
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId || !prodId || !rateVal || !reason) return;

    requestRateChange({
      customerId: custId,
      productId: prodId,
      requestedRate: Number(rateVal),
      reason,
      requestedBy: isAdmin ? "Bachan Admin" : "Staff User",
    });

    setShowNewModal(false);
    setRateVal("");
    setReason("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
            Staff Rate Change Requests & Approvals
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {pendingCount} pending authorization requests · Enforces role-based rate control & immutable audit history
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316",
              color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
            }}
          >
            <Plus size={14} /> + New Rate Request
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        {[
          { id: "all", label: `All Requests (${rateChangeRequests.length})` },
          { id: "pending", label: `Pending Approval (${pendingCount})` },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: filter === t.id ? "#1e3a8a" : "#f1f5f9",
              color: filter === t.id ? "#fff" : "#64748b",
              border: "none", cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Request #", "Customer", "Product", "Existing Rate", "Requested Rate", "Reason", "Requested By & Date", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  No rate change requests found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a", fontSize: 12 }}>
                    {r.num}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{r.customerName}</div>
                    <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{r.customerCode}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>
                    {r.productName}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>
                    {INR(r.existingRate)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#16a34a" }}>
                      {INR(r.requestedRate)} <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>/ unit</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569", maxWidth: 220 }}>
                    {r.reason}
                    {r.rejectionReason && (
                      <div style={{ color: "#dc2626", fontSize: 11, marginTop: 3 }}>
                        <strong>Rejected:</strong> {r.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                    <div><strong>{r.requestedBy}</strong></div>
                    <div>{r.requestedDate}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                      background: r.status === "approved" ? "#dcfce7" : r.status === "rejected" ? "#fee2e2" : "#fef3c7",
                      color: r.status === "approved" ? "#15803d" : r.status === "rejected" ? "#991b1b" : "#92400e",
                      textTransform: "uppercase"
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.status === "pending" && isAdmin ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleApprove(r.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "none", cursor: "pointer" }}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModalReq(r)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#991b1b", background: "#fee2e2", border: "none", cursor: "pointer" }}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectModalReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 440, width: "100%", padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 12px" }}>Reject Rate Change Request</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px" }}>
              Provide a documented reason for rejecting this requested rate change for <strong>{rejectModalReq.customerName}</strong>.
            </p>
            <form onSubmit={handleRejectConfirm} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                rows={3}
                placeholder="Reason for rejection (e.g. Below minimum commercial margin threshold)..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                required
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                <button type="button" onClick={() => setRejectModalReq(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, maxWidth: 480, width: "100%", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Create Rate Change Request</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Customer</label>
                <select
                  value={custId}
                  onChange={e => setCustId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Product Line</label>
                <select
                  value={prodId}
                  onChange={e => setProdId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Requested Basic Rate (₹ per Cylinder) *</label>
                <input
                  type="number"
                  placeholder="e.g. 2680"
                  value={rateVal}
                  onChange={e => setRateVal(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Justification / Reason *</label>
                <textarea
                  rows={2}
                  placeholder="High daily volume customer..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#f97316", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
