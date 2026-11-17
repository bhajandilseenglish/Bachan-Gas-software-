"use client";

import { useState } from "react";
import Link from "next/link";
import { useERPStore, CustomerApprovalRequest } from "@/lib/store";
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  ArrowRight, Search, FileText, UserCheck, ShieldAlert
} from "lucide-react";

const cardStyle = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  ...s,
});

export default function CustomerApprovalsPage() {
  const {
    customerApprovals,
    currentUserRole,
    currentSessionUser,
    approveCustomerRegistration,
    rejectCustomerRegistration,
    requestCustomerCorrection,
    customers,
  } = useERPStore();

  const [filterStatus, setFilterStatus] = useState<"all" | "pending_approval" | "approved" | "rejected" | "correction_requested">("pending_approval");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [selectedReq, setSelectedReq] = useState<CustomerApprovalRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "correction" | null>(null);
  const [actionReason, setActionReason] = useState("");

  if (currentUserRole !== "admin") {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", padding: 32, ...cardStyle(), textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
          <ShieldAlert size={26} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Admin Authorization Required</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
          The Customer Approvals queue is strictly reserved for Administrators.
          Operations staff accounts are not authorized to approve customer onboarding requests.
        </p>
        <div style={{ marginTop: 20 }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8, background: "#0f172a",
              color: "#ffffff", fontSize: 12.5, fontWeight: 700, textDecoration: "none"
            }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pendingList = customerApprovals.filter(a => a.status === "pending_approval");
  const approvedList = customerApprovals.filter(a => a.status === "approved");
  const rejectedList = customerApprovals.filter(a => a.status === "rejected");
  const correctionList = customerApprovals.filter(a => a.status === "correction_requested");

  const filteredApprovals = customerApprovals.filter((req) => {
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const cust = req.customerData;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      req.requestNum.toLowerCase().includes(q) ||
      (cust.name && cust.name.toLowerCase().includes(q)) ||
      (cust.code && cust.code.toLowerCase().includes(q)) ||
      (cust.mobile && cust.mobile.includes(q)) ||
      req.submittedBy.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleConfirmAction = () => {
    if (!selectedReq || !actionType) return;

    if (actionType === "approve") {
      approveCustomerRegistration(selectedReq.id, currentSessionUser?.fullName || "Bachan Admin");
    } else if (actionType === "reject") {
      if (!actionReason.trim()) {
        alert("Please enter a rejection reason.");
        return;
      }
      rejectCustomerRegistration(selectedReq.id, actionReason.trim(), currentSessionUser?.fullName || "Bachan Admin");
    } else if (actionType === "correction") {
      if (!actionReason.trim()) {
        alert("Please specify what corrections are required.");
        return;
      }
      requestCustomerCorrection(selectedReq.id, actionReason.trim(), currentSessionUser?.fullName || "Bachan Admin");
    }

    setSelectedReq(null);
    setActionType(null);
    setActionReason("");
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Customer Approvals Queue
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
              Admin Exclusive
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
            Review and govern commercial customer registration requests submitted by operations staff.
          </p>
        </div>

        <Link
          href="/customers/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 8,
            background: "#ea580c", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 2px 6px rgba(234,88,12,0.3)"
          }}
        >
          Customer Onboarding Portal
        </Link>
      </div>

      {/* ── STATS METRIC CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div
          onClick={() => setFilterStatus("pending_approval")}
          style={{
            ...cardStyle(),
            padding: 16,
            borderLeft: "4px solid #f59e0b",
            cursor: "pointer",
            background: filterStatus === "pending_approval" ? "#fffbeb" : "#ffffff",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#92400e" }}>Pending Approval</span>
            <Clock size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{pendingList.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Awaiting verification</div>
        </div>

        <div
          onClick={() => setFilterStatus("approved")}
          style={{
            ...cardStyle(),
            padding: 16,
            borderLeft: "4px solid #16a34a",
            cursor: "pointer",
            background: filterStatus === "approved" ? "#f0fdf4" : "#ffffff",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#166534" }}>Approved</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{approvedList.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Active customer accounts</div>
        </div>

        <div
          onClick={() => setFilterStatus("correction_requested")}
          style={{
            ...cardStyle(),
            padding: 16,
            borderLeft: "4px solid #0284c7",
            cursor: "pointer",
            background: filterStatus === "correction_requested" ? "#f0f9ff" : "#ffffff",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#0369a1" }}>Correction Needed</span>
            <AlertTriangle size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{correctionList.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Sent back to staff</div>
        </div>

        <div
          onClick={() => setFilterStatus("rejected")}
          style={{
            ...cardStyle(),
            padding: 16,
            borderLeft: "4px solid #dc2626",
            cursor: "pointer",
            background: filterStatus === "rejected" ? "#fef2f2" : "#ffffff",
            transition: "all .15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#991b1b" }}>Rejected</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{rejectedList.length}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Declined registrations</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER TABS ── */}
      <div style={{ ...cardStyle(), padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", minWidth: 260, flex: 1, maxWidth: 360 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center" }}>
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request #, customer, mobile, submitter..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px 8px 36px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              fontSize: 12.5,
              background: "#f8fafc",
              color: "#0f172a",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "pending_approval", "approved", "correction_requested", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: filterStatus === st ? "#0f172a" : "#f1f5f9",
                color: filterStatus === st ? "#ffffff" : "#475569",
                transition: "all .12s ease",
              }}
            >
              {st === "all"
                ? "All Requests"
                : st === "pending_approval"
                ? `Pending (${pendingList.length})`
                : st === "correction_requested"
                ? `Correction (${correctionList.length})`
                : st === "approved"
                ? `Approved (${approvedList.length})`
                : `Rejected (${rejectedList.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── APPROVALS TABLE ── */}
      <div style={{ ...cardStyle(), overflow: "hidden" }}>
        {filteredApprovals.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", color: "#94a3b8" }}>
              <CheckCircle2 size={22} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>No requests found</h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              There are currently no customer registration requests matching this filter view.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Request #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Customer Details</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Contact</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Proposed Terms</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Submitted By</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map((req) => {
                  const cust = req.customerData;
                  const matchingCustomer = customers.find(c => c.id === req.customerId);

                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                        {req.requestNum}
                        <span style={{ display: "block", fontSize: 10.5, color: "#94a3b8", fontFamily: "sans-serif", fontWeight: 500, marginTop: 2 }}>
                          {req.submittedAt}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13.5 }}>{cust.name}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                          {cust.business} · <span style={{ fontFamily: "monospace" }}>{cust.code}</span>
                          {cust.sap_code && ` · SAP: ${cust.sap_code}`}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{cust.mobile}</div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>{cust.contact_person || cust.city || "Ludhiana"}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          Limit: {cust.credit_limit !== null && cust.credit_limit !== undefined ? `₹${cust.credit_limit.toLocaleString("en-IN")}` : "None"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b" }}>
                          Tenure: {cust.payment_tenure_days || 15} Days
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{req.submittedBy}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Staff Member</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {req.status === "pending_approval" && (
                          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                            Pending
                          </span>
                        )}
                        {req.status === "approved" && (
                          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                            Approved
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <div>
                            <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
                              Rejected
                            </span>
                            {req.rejectionReason && (
                              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#dc2626", maxWidth: 220 }}>{req.rejectionReason}</p>
                            )}
                          </div>
                        )}
                        {req.status === "correction_requested" && (
                          <div>
                            <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                              Correction
                            </span>
                            {req.correctionNotes && (
                              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#0284c7", maxWidth: 220 }}>{req.correctionNotes}</p>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {req.status === "pending_approval" ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("approve");
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 6, border: "none",
                                background: "#16a34a", color: "#ffffff", fontSize: 11.5, fontWeight: 700,
                                cursor: "pointer", boxShadow: "0 1px 4px rgba(22,163,74,0.3)"
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("correction");
                                setActionReason("");
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 6,
                                background: "#f0f9ff", border: "1px solid #bae6fd",
                                color: "#0369a1", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Correction
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("reject");
                                setActionReason("");
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 6,
                                background: "#fef2f2", border: "1px solid #fecaca",
                                color: "#991b1b", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            {matchingCustomer && (
                              <Link
                                href={`/customers/${matchingCustomer.id}`}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  fontSize: 12, fontWeight: 700, color: "#ea580c", textDecoration: "none"
                                }}
                              >
                                View Profile
                                <ArrowRight size={14} />
                              </Link>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION / ACTION MODAL ── */}
      {selectedReq && actionType && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
          }}
        >
          <div
            style={{
              background: "#ffffff", borderRadius: 16, maxWidth: 480, width: "100%",
              padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 14
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {actionType === "approve"
                    ? "Approve Customer Registration"
                    : actionType === "reject"
                    ? "Reject Customer Registration"
                    : "Request Registration Correction"}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>
                  Customer: <strong>{selectedReq.customerData.name}</strong> ({selectedReq.customerData.code})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {actionType === "approve" && (
              <p style={{ margin: 0, padding: 12, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: 12.5, lineHeight: 1.5 }}>
                Approving this registration will immediately activate customer account <strong>{selectedReq.customerData.name}</strong>.
                The customer will be available across orders, deliveries, and payment receipts.
              </p>
            )}

            {(actionType === "reject" || actionType === "correction") && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  {actionType === "reject" ? "Reason for Rejection *" : "Notes on Required Corrections *"}
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionType === "reject"
                      ? "e.g. Duplicate commercial account or unverifiable address..."
                      : "e.g. Please verify GSTIN number or update complete delivery address..."
                  }
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 12px",
                    borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5,
                    color: "#0f172a", outline: "none", resize: "vertical"
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                  background: "#ffffff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: actionType === "approve" ? "#16a34a" : actionType === "reject" ? "#dc2626" : "#0284c7",
                  color: "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
              >
                {actionType === "approve"
                  ? "Confirm Approval"
                  : actionType === "reject"
                  ? "Confirm Rejection"
                  : "Send Correction Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
