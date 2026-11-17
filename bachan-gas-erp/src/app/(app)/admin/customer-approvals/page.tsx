"use client";

import { useState } from "react";
import Link from "next/link";
import { useERPStore, CustomerApprovalRequest } from "@/lib/store";
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  ArrowRight, Search, FileText, UserCheck, ShieldAlert
} from "lucide-react";

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
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Admin Authorization Required</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The Customer Approvals queue is strictly reserved for Administrators.
          Operations staff accounts are not authorized to approve customer onboarding requests.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Approvals Queue</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Admin Exclusive
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review and govern commercial customer registration requests submitted by operations staff.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-500 transition-colors inline-flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          Customer Onboarding Portal
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus("pending_approval")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === "pending_approval"
              ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
              : "bg-white border-slate-200 text-slate-900 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-90">Pending Approval</span>
            <Clock className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-extrabold mt-2">{pendingList.length}</div>
          <span className="text-[11px] opacity-75">Awaiting verification</span>
        </div>

        <div
          onClick={() => setFilterStatus("approved")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === "approved"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20"
              : "bg-white border-slate-200 text-slate-900 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-90">Approved</span>
            <CheckCircle2 className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-extrabold mt-2">{approvedList.length}</div>
          <span className="text-[11px] opacity-75">Active customer accounts</span>
        </div>

        <div
          onClick={() => setFilterStatus("correction_requested")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === "correction_requested"
              ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20"
              : "bg-white border-slate-200 text-slate-900 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-90">Correction Needed</span>
            <AlertTriangle className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-extrabold mt-2">{correctionList.length}</div>
          <span className="text-[11px] opacity-75">Sent back to staff</span>
        </div>

        <div
          onClick={() => setFilterStatus("rejected")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === "rejected"
              ? "bg-red-600 text-white border-red-700 shadow-md shadow-red-600/20"
              : "bg-white border-slate-200 text-slate-900 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-90">Rejected</span>
            <XCircle className="w-4 h-4 opacity-75" />
          </div>
          <div className="text-2xl font-extrabold mt-2">{rejectedList.length}</div>
          <span className="text-[11px] opacity-75">Declined registrations</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request #, customer, mobile, submitter..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["all", "pending_approval", "approved", "correction_requested", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all"
                ? "All Requests"
                : st === "pending_approval"
                ? "Pending"
                : st === "correction_requested"
                ? "Correction"
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredApprovals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No requests found</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no customer registration requests matching this view.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Proposed Terms</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApprovals.map((req) => {
                  const cust = req.customerData;
                  const matchingCustomer = customers.find(c => c.id === req.customerId);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {req.requestNum}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          {req.submittedAt}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {cust.business} · <span className="font-mono">{cust.code}</span>
                          {cust.sap_code && ` · SAP: ${cust.sap_code}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{cust.mobile}</div>
                        <div className="text-[11px] text-slate-500">{cust.contact_person || cust.city || "Ludhiana"}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          Limit: {cust.credit_limit !== null && cust.credit_limit !== undefined ? `₹${cust.credit_limit.toLocaleString("en-IN")}` : "None"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tenure: {cust.payment_tenure_days || 15} Days
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{req.submittedBy}</div>
                        <div className="text-[11px] text-slate-400">Staff Member</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {req.status === "pending_approval" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                        {req.status === "approved" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                              Rejected
                            </span>
                            {req.rejectionReason && (
                              <p className="text-[10px] text-red-600 mt-1 max-w-xs">{req.rejectionReason}</p>
                            )}
                          </div>
                        )}
                        {req.status === "correction_requested" && (
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              Correction
                            </span>
                            {req.correctionNotes && (
                              <p className="text-[10px] text-blue-600 mt-1 max-w-xs">{req.correctionNotes}</p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {req.status === "pending_approval" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("approve");
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("correction");
                                setActionReason("");
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition-colors"
                            >
                              Correction
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType("reject");
                                setActionReason("");
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {matchingCustomer && (
                              <Link
                                href={`/customers/${matchingCustomer.id}`}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                              >
                                View Profile
                                <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Confirmation / Reason Modal */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === "approve"
                    ? "Approve Customer Registration"
                    : actionType === "reject"
                    ? "Reject Customer Registration"
                    : "Request Registration Correction"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <strong>{selectedReq.customerData.name}</strong> ({selectedReq.customerData.code})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {actionType === "approve" && (
              <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                Approving this registration will activate customer account <strong>{selectedReq.customerData.name}</strong>.
                The customer will immediately be available for commercial LPG orders, deliveries, and payment receipts.
              </p>
            )}

            {(actionType === "reject" || actionType === "correction") && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      : "e.g. Please verify GSTIN number or update complete manifold delivery address..."
                  }
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : actionType === "reject"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
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
