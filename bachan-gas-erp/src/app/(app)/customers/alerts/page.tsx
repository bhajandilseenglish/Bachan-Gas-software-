"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Phone, Calendar, Clock, CheckCircle2, UserCheck,
  Search, Filter, Plus, Eye, PauseCircle, PlayCircle, X, ShieldAlert,
  ArrowRight, MessageSquare, RefreshCw, ShoppingCart
} from "lucide-react";
import { useERPStore, MissedOrderAlert, CustomerFollowUp } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function MissedOrderAlertsPage() {
  const router = useRouter();
  const {
    customers,
    missedOrderAlerts,
    followUpLogs,
    evaluateInactivityAlerts,
    recordFollowUp,
    snoozeAlert,
    pauseCustomerAlerts,
    currentUserRole
  } = useERPStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "contacted" | "snoozed" | "resolved">("active");

  // Follow-up modal
  const [selectedAlert, setSelectedAlert] = useState<MissedOrderAlert | null>(null);
  const [followUpResult, setFollowUpResult] = useState<CustomerFollowUp["result"]>("will_order_tomorrow");
  const [notes, setNotes] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("Sales Desk");
  const [successToast, setSuccessToast] = useState("");

  // Evaluate alerts on mount
  useEffect(() => {
    evaluateInactivityAlerts();
  }, [evaluateInactivityAlerts]);

  const activeAlerts = missedOrderAlerts.filter(a => a.status === "active");
  const contactedAlerts = missedOrderAlerts.filter(a => a.status === "contacted");
  const resolvedCount = missedOrderAlerts.filter(a => a.status === "resolved").length;

  const filtered = missedOrderAlerts.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch =
      !search ||
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerCode.toLowerCase().includes(search.toLowerCase()) ||
      a.mobile.includes(search);
    return matchStatus && matchSearch;
  });

  const handleOpenFollowUp = (a: MissedOrderAlert) => {
    setSelectedAlert(a);
    setFollowUpResult("will_order_tomorrow");
    setNotes("");
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setNextDate(tom.toISOString().split("T")[0]);
    setSuccessToast("");
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    recordFollowUp({
      customerId: selectedAlert.customerId,
      alertId: selectedAlert.id,
      result: followUpResult,
      notes,
      nextFollowUpDate: nextDate,
      assignedStaff,
      recordedBy: currentUserRole === "admin" ? "Bachan Admin" : "Staff User",
    });

    setSuccessToast(`Follow-up recorded for ${selectedAlert.customerName}!`);
    setTimeout(() => {
      setSelectedAlert(null);
      setSuccessToast("");
    }, 1200);
  };

  const handleSnooze = (a: MissedOrderAlert) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 1);
    snoozeAlert(a.id, snoozeDate.toISOString().split("T")[0]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#dc2626", animation: "pulse 1.5s infinite" }} />
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", letterSpacing: "-.3px", margin: 0 }}>
              Automatic Customer Order Inactivity Alerts
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Real-time proactive retention system · Highlights high-frequency commercial accounts who missed their scheduled refill date
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => evaluateInactivityAlerts()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "#f1f5f9",
              color: "#1e293b", border: "1px solid #cbd5e1", cursor: "pointer"
            }}
          >
            <RefreshCw size={13} /> Re-evaluate Cutoff
          </button>
          <Link
            href="/orders/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: "#f97316",
              color: "#fff", textDecoration: "none", boxShadow: "0 2px 6px rgba(249,115,22,.3)"
            }}
          >
            <ShoppingCart size={14} /> Book Supply Order
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: "16px 20px", borderLeft: "4px solid #dc2626" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#dc2626", letterSpacing: ".05em" }}>
            Missed Expected Orders
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#dc2626", marginTop: 4 }}>
            {activeAlerts.length}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Critical attention: cutoff exceeded without order
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px", borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#d97706", letterSpacing: ".05em" }}>
            Contacted / Follow-up Active
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#d97706", marginTop: 4 }}>
            {contactedAlerts.length}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Staff in touch with customer representative
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px", borderLeft: "4px solid #16a34a" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#16a34a", letterSpacing: ".05em" }}>
            Resumed Ordering (Resolved)
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#16a34a", marginTop: 4 }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Successfully recovered commercial buyers
          </div>
        </div>

        <div style={{ ...card(), padding: "16px 20px", borderLeft: "4px solid #1e3a8a" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#1e3a8a", letterSpacing: ".05em" }}>
            Follow-up History Logs
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#1e3a8a", marginTop: 4 }}>
            {followUpLogs.length}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
            Documented calls & customer interactions
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "active", label: `Active Red Alerts (${activeAlerts.length})` },
            { id: "contacted", label: `Contacted (${contactedAlerts.length})` },
            { id: "all", label: `All Alerts (${missedOrderAlerts.length})` },
            { id: "resolved", label: `Resolved (${resolvedCount})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id as any)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                background: statusFilter === t.id ? (t.id === "active" ? "#dc2626" : "#1e3a8a") : "#f1f5f9",
                color: statusFilter === t.id ? "#fff" : "#475569",
                border: "none", cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", minWidth: 240, flex: 1 }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by customer name, phone, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Inactivity Alerts Table */}
      <div className="desktop-only-table" style={{ ...card(), overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Status", "Customer Name", "Contact Mobile", "Last Order Date", "Expected Order Date", "Days Overdue", "Last Order Qty", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#16a34a", fontSize: 13 }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 800, fontSize: 14 }}>No Missed Expected Orders!</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    All commercial accounts with configured ordering frequencies are ordering on schedule.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const isOverdue = a.status === "active";
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9", background: isOverdue ? "#fff5f5" : "transparent" }}>
                    <td style={{ padding: "12px 16px" }}>
                      {isOverdue ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 900, background: "#fee2e2", color: "#b91c1c", letterSpacing: ".04em" }}>
                          <AlertTriangle size={13} /> ORDER NOT RECEIVED
                        </span>
                      ) : a.status === "contacted" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
                          <UserCheck size={12} /> CONTACTED
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                          RESOLVED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/customers/${a.customerId}`} style={{ fontWeight: 800, fontSize: 13.5, color: isOverdue ? "#b91c1c" : "#1e293b", textDecoration: "none" }}>
                        {a.customerName}
                      </Link>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{a.customerCode}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      <a href={`tel:${a.mobile}`} style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Phone size={12} color="#16a34a" /> {a.mobile}
                      </a>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#475569" }}>
                      {a.lastOrderDate}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: isOverdue ? "#dc2626" : "#475569" }}>
                      {a.expectedOrderDate}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 900, color: isOverdue ? "#dc2626" : "#64748b", fontSize: 14 }}>
                        {a.daysOverdue} {a.daysOverdue === 1 ? "day" : "days"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      {a.lastOrderedQty > 0 ? `${a.lastOrderedQty} units` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleOpenFollowUp(a)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          <MessageSquare size={12} /> Follow-up
                        </button>
                        <button
                          onClick={() => router.push(`/orders/new?customerId=${a.customerId}`)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: "#f97316", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          <ShoppingCart size={12} /> Book
                        </button>
                        <Link
                          href={`/customers/${a.customerId}`}
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, background: "#f1f5f9", color: "#475569" }}
                          title="View Customer Profile"
                        >
                          <Eye size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="mobile-only-cards" style={{ display: "none" }}>
        {filtered.length === 0 ? (
          <div style={{ ...card(), padding: 30, textAlign: "center", color: "#64748b" }}>
            No inactivity alerts found.
          </div>
        ) : (
          filtered.map(a => (
            <div key={a.id} style={{ ...card(), padding: 14, borderLeft: a.status === "active" ? "4px solid #dc2626" : "4px solid #f97316" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>{a.customerName}</div>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#1e3a8a", fontWeight: 700 }}>{a.customerCode}</span>
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 10, fontWeight: 800, background: a.status === "active" ? "#fee2e2" : "#fef3c7", color: a.status === "active" ? "#b91c1c" : "#92400e" }}>
                  {a.status === "active" ? "MISSED ORDER" : a.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#f8fafc", padding: "8px 10px", borderRadius: 8, margin: "8px 0", fontSize: 11.5 }}>
                <div>Expected: <strong style={{ color: "#dc2626" }}>{a.expectedOrderDate}</strong></div>
                <div>Overdue: <strong>{a.daysOverdue} days</strong></div>
                <div>Mobile: <strong>{a.mobile}</strong></div>
                <div>Last Qty: <strong>{a.lastOrderedQty} units</strong></div>
              </div>

              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleOpenFollowUp(a)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#1e3a8a", color: "#fff", border: "none" }}
                >
                  <MessageSquare size={12} /> Follow-up
                </button>
                <button
                  onClick={() => router.push(`/orders/new?customerId=${a.customerId}`)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: "#f97316", color: "#fff", border: "none" }}
                >
                  <ShoppingCart size={12} /> Book Order
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Follow-up Recording Modal */}
      {selectedAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,31,60,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card(), maxWidth: 500, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MessageSquare size={18} color="#1e3a8a" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Record Customer Follow-up</h3>
              </div>
              <button onClick={() => setSelectedAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {successToast && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                ✓ {successToast}
              </div>
            )}

            <div style={{ background: "#fee2e2", padding: 12, borderRadius: 8, fontSize: 12.5, color: "#991b1b", marginBottom: 14 }}>
              <strong>Missed Order Alert:</strong> {selectedAlert.customerName} ({selectedAlert.mobile}) was expected on <strong>{selectedAlert.expectedOrderDate}</strong> ({selectedAlert.daysOverdue} days overdue).
            </div>

            <form onSubmit={handleFollowUpSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Follow-up Call Outcome *
                </label>
                <select
                  value={followUpResult}
                  onChange={e => setFollowUpResult(e.target.value as any)}
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#f8fafc", outline: "none" }}
                >
                  <option value="will_order_tomorrow">Customer Will Order Tomorrow</option>
                  <option value="sufficient_stock">Customer Has Sufficient Stock</option>
                  <option value="temporarily_closed">Customer Temporarily Closed</option>
                  <option value="changed_supplier">Customer Has Changed Supplier</option>
                  <option value="unable_to_contact">Unable to Contact (Ringing / Switched Off)</option>
                  <option value="other">Other Commercial Reason</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={e => setNextDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Assigned Staff Member
                </label>
                <input
                  value={assignedStaff}
                  onChange={e => setAssignedStaff(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                  Follow-up Conversation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spoke to Manager Vikram; restaurant closed for 2 days for renovation, resuming supply Friday morning..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setSelectedAlert(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, background: "#1e3a8a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
