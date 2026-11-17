"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useERPStore, Customer } from "@/lib/store";
import {
  Search, UserPlus, Building2, Phone, Mail, MapPin,
  CreditCard, Calendar, CheckCircle2, AlertCircle, ArrowRight,
  ShieldCheck, FileText, Check, Clock
} from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "1.5px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
  transition: "border-color .15s",
};

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const {
    customers,
    currentUserRole,
    currentSessionUser,
    submitNewCustomerRegistration,
  } = useERPStore();

  const [activeTab, setActiveTab] = useState<"search" | "register">("search");

  // Option A: Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);

  // Option B: Register form state
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    consumer_no: "",
    sap_code: "",
    mobile: "",
    alt_mobile: "",
    email: "",
    contact_person: "",
    category: "commercial" as const,
    address: "",
    billing_address: "",
    delivery_address: "",
    credit_limit: "",
    payment_tenure_days: "15",
  });

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter existing customers for Option A
  const filteredCustomers = searchQuery.trim().length >= 1
    ? customers.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.business.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.sap_code && c.sap_code.toLowerCase().includes(q)) ||
          c.mobile.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
        );
      }).slice(0, 10)
    : [];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.name.trim()) {
      setStatusMessage({ type: "error", text: "Customer Name is required." });
      return;
    }
    if (!formData.mobile.trim()) {
      setStatusMessage({ type: "error", text: "Primary Mobile Number is required." });
      return;
    }

    setIsSubmitting(true);

    try {
      const creditLimitNum = formData.credit_limit.trim() ? parseFloat(formData.credit_limit) : null;
      const tenureDaysNum = parseInt(formData.payment_tenure_days) || 15;

      const created = submitNewCustomerRegistration(
        {
          name: formData.name.trim(),
          business: formData.business.trim() || formData.name.trim(),
          consumer_type: "Commercial (Non-Domestic)",
          category: "commercial",
          sap_code: formData.sap_code.trim() || undefined,
          contact_person: formData.contact_person.trim() || formData.name.trim(),
          mobile: formData.mobile.trim(),
          alt_mobile: formData.alt_mobile.trim() || undefined,
          email: formData.email.trim() || undefined,
          billing_address: formData.billing_address.trim() || formData.address.trim(),
          delivery_address: formData.delivery_address.trim() || formData.address.trim(),
          credit_limit: creditLimitNum,
          payment_tenure_days: tenureDaysNum,
          payment_terms: `${tenureDaysNum} Days`,
        },
        currentSessionUser?.fullName || (currentUserRole === "admin" ? "Bachan Admin" : "Staff User")
      );

      if (currentUserRole === "admin") {
        setStatusMessage({
          type: "success",
          text: `Customer ${created.name} (${created.code}) successfully created and approved as Active!`,
        });
        setTimeout(() => {
          router.push(`/customers/${created.id}`);
        }, 1200);
      } else {
        setStatusMessage({
          type: "success",
          text: `Customer registration for ${created.name} submitted successfully! It is queued for Admin Approval.`,
        });
        // Reset form
        setFormData({
          name: "",
          business: "",
          consumer_no: "",
          sap_code: "",
          mobile: "",
          alt_mobile: "",
          email: "",
          contact_person: "",
          category: "commercial",
          address: "",
          billing_address: "",
          delivery_address: "",
          credit_limit: "",
          payment_tenure_days: "15",
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to submit customer registration." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── TOP HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Customer Onboarding
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }}>
              Commercial LPG Master
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
            Commercial LPG customer management · Option A (Search & Link) or Option B (Register New)
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {currentUserRole === "admin" && (
            <Link
              href="/admin/customer-approvals"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8,
                background: "#fff7ed", border: "1px solid #fed7aa",
                color: "#c2410c", fontSize: 12.5, fontWeight: 700, textDecoration: "none"
              }}
            >
              <ShieldCheck size={16} color="#ea580c" />
              Customer Approvals Queue
            </Link>
          )}
          <Link
            href="/customers"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              background: "#ffffff", border: "1.5px solid #cbd5e1",
              color: "#334155", fontSize: 12.5, fontWeight: 700, textDecoration: "none"
            }}
          >
            Back to Customers
          </Link>
        </div>
      </div>

      {/* ── ROLE BANNER ── */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: currentUserRole === "admin" ? "1px solid #fed7aa" : "1px solid #bae6fd",
          background: currentUserRole === "admin" ? "#fffbeb" : "#f0f9ff",
          color: currentUserRole === "admin" ? "#92400e" : "#0369a1",
          fontSize: 12.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {currentUserRole === "admin" ? (
            <ShieldCheck size={18} color="#d97706" />
          ) : (
            <Clock size={18} color="#0284c7" />
          )}
          <span>
            Active Session: <strong>{currentSessionUser?.fullName || currentUserRole.toUpperCase()}</strong> ({currentUserRole === "admin" ? "Administrator" : "Operations Staff"}).
            {currentUserRole === "admin"
              ? " Direct registration approval is enabled."
              : " Registrations submitted will be routed to Admin for approval."}
          </span>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: "6px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "search" ? "#ea580c" : "transparent",
            color: activeTab === "search" ? "#ffffff" : "#475569",
            boxShadow: activeTab === "search" ? "0 2px 8px rgba(234,88,12,0.3)" : "none",
            transition: "all .15s ease",
          }}
        >
          <Search size={16} />
          Option A: Select / Search Existing Customer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "register" ? "#ea580c" : "transparent",
            color: activeTab === "register" ? "#ffffff" : "#475569",
            boxShadow: activeTab === "register" ? "0 2px 8px rgba(234,88,12,0.3)" : "none",
            transition: "all .15s ease",
          }}
        >
          <UserPlus size={16} />
          Option B: Register New Commercial Customer
        </button>
      </div>

      {/* ── STATUS MESSAGE BANNER ── */}
      {statusMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: statusMessage.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
            background: statusMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: statusMessage.type === "success" ? "#166534" : "#991b1b",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={18} color="#16a34a" />
          ) : (
            <AlertCircle size={18} color="#dc2626" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OPTION A (SEARCH & LINK EXISTING) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "search" && (
        <div style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Option A: Search & Link Existing Customer
            </h2>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0" }}>
              Search across 648 verified customer accounts by name, consumer ID, SAP code, mobile number, or city.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedExistingCustomer(null);
              }}
              placeholder="Type customer name, consumer ID, SAP code, or mobile number..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 16px 12px 42px",
                fontSize: 13.5,
                borderRadius: 10,
                border: "1.5px solid #cbd5e1",
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ea580c";
                e.target.style.background = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.background = "#f8fafc";
              }}
            />
          </div>

          {/* Autocomplete Results List */}
          {searchQuery.trim().length >= 1 && (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                overflow: "hidden",
                background: "#ffffff",
                maxHeight: 340,
                overflowY: "auto",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
              }}
            >
              {filteredCustomers.length === 0 ? (
                <div style={{ padding: "16px 20px", textAlign: "center", fontSize: 12.5, color: "#64748b" }}>
                  No registered customer found matching &quot;{searchQuery}&quot;. Switch to Option B above to register a new customer.
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedExistingCustomer(cust)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: selectedExistingCustomer?.id === cust.id ? "#fff7ed" : "#ffffff",
                      transition: "background .12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedExistingCustomer?.id !== cust.id) {
                        e.currentTarget.style.background = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedExistingCustomer?.id !== cust.id) {
                        e.currentTarget.style.background = "#ffffff";
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{cust.name}</span>
                        <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569" }}>
                          {cust.code}
                        </span>
                        {cust.sap_code && (
                          <span style={{ fontSize: 11, fontFamily: "monospace", padding: "2px 6px", borderRadius: 4, background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                            SAP: {cust.sap_code}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: cust.status === "active" ? "#dcfce7" : "#fef3c7",
                            color: cust.status === "active" ? "#15803d" : "#b45309",
                          }}
                        >
                          {cust.status}
                        </span>
                      </div>
                      <p style={{ margin: "3px 0 0 0", fontSize: 12, color: "#64748b" }}>
                        {cust.business} · Mobile: {cust.mobile} · {cust.city || "Ludhiana"}
                      </p>
                    </div>
                    <ArrowRight size={16} color="#94a3b8" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected Customer Card Preview */}
          {selectedExistingCustomer && (
            <div
              style={{
                marginTop: 8,
                padding: 20,
                borderRadius: 12,
                border: "1.5px solid #fed7aa",
                background: "#fffaf5",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", color: "#c2410c", letterSpacing: "0.06em" }}>
                    Selected Customer Record
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                    {selectedExistingCustomer.name}
                  </h3>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0 0" }}>
                    {selectedExistingCustomer.business}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 12.5, fontFamily: "monospace", fontWeight: 800, color: "#334155" }}>
                    {selectedExistingCustomer.code}
                  </span>
                  {selectedExistingCustomer.sap_code && (
                    <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                      SAP: {selectedExistingCustomer.sap_code}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #fed7aa",
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Primary Mobile:</span>
                  <strong style={{ color: "#0f172a", fontSize: 13 }}>{selectedExistingCustomer.mobile}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Total Outstanding:</span>
                  <strong style={{ color: "#0f172a", fontSize: 13 }}>
                    {selectedExistingCustomer.outstanding !== null
                      ? `₹${selectedExistingCustomer.outstanding.toLocaleString("en-IN")}`
                      : "Not Configured"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Credit Limit:</span>
                  <strong style={{ color: "#0f172a", fontSize: 13 }}>
                    {selectedExistingCustomer.credit_limit !== null
                      ? `₹${selectedExistingCustomer.credit_limit.toLocaleString("en-IN")}`
                      : "Not Set"}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block" }}>Payment Tenure:</span>
                  <strong style={{ color: "#0f172a", fontSize: 13 }}>{selectedExistingCustomer.payment_terms || "15 Days"}</strong>
                </div>
              </div>

              {/* Action Buttons for selected customer */}
              <div style={{ paddingTop: 12, borderTop: "1px solid #fed7aa", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={`/customers/${selectedExistingCustomer.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 8,
                    background: "#ea580c", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
                    textDecoration: "none", boxShadow: "0 2px 6px rgba(234,88,12,0.3)"
                  }}
                >
                  <FileText size={15} />
                  View Customer Profile
                </Link>

                <Link
                  href={`/orders/new?customer=${selectedExistingCustomer.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 8,
                    background: "#0f172a", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
                    textDecoration: "none", boxShadow: "0 2px 6px rgba(15,23,42,0.2)"
                  }}
                >
                  Create Customer Order
                </Link>

                <Link
                  href={`/finance/payments?customer=${selectedExistingCustomer.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 8,
                    background: "#ffffff", border: "1.5px solid #cbd5e1",
                    color: "#0f172a", fontSize: 12.5, fontWeight: 700,
                    textDecoration: "none"
                  }}
                >
                  <CreditCard size={15} color="#64748b" />
                  Record Payment
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: OPTION B (REGISTER NEW COMMERCIAL CUSTOMER) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "register" && (
        <form onSubmit={handleRegisterSubmit} style={{ ...cardStyle, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Option B: Register New Commercial Customer
            </h2>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0" }}>
              {currentUserRole === "admin"
                ? "Admin registration immediately activates the account with full commercial records."
                : "Staff registration will submit this profile to the Admin Customer Approvals queue for authorized verification."}
            </p>
          </div>

          {/* Section 1: Customer Identity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#ea580c", letterSpacing: "0.06em" }}>
              1. Customer Identity & Category
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hotel Grand Punjab"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Business Trade Name
                </label>
                <input
                  type="text"
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  placeholder="e.g. Grand Punjab Hospitality Pvt Ltd"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  SAP Customer Code (when available)
                </label>
                <input
                  type="text"
                  value={formData.sap_code}
                  onChange={(e) => setFormData({ ...formData, sap_code: e.target.value })}
                  placeholder="e.g. SAP-90142"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Customer Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="commercial">Commercial (Approved 6 LPG Products)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#ea580c", letterSpacing: "0.06em" }}>
              2. Contact & Address Details
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Primary Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Alternate Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.alt_mobile}
                  onChange={(e) => setFormData({ ...formData, alt_mobile: e.target.value })}
                  placeholder="Optional alternate mobile"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Gurpreet Singh (Manager)"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="accounts@grandpunjab.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 4 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Registered billing address..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Delivery / Godown Address
                </label>
                <textarea
                  rows={2}
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="Physical commercial site delivery location..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Credit Terms & Payment Tenure */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#ea580c", letterSpacing: "0.06em" }}>
              3. Proposed Credit Terms & Payment Tenure
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Proposed Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="e.g. 50000 (leave empty if not applicable)"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 5 }}>
                  Proposed Payment Tenure (Days)
                </label>
                <select
                  value={formData.payment_tenure_days}
                  onChange={(e) => setFormData({ ...formData, payment_tenure_days: e.target.value })}
                  style={inputStyle}
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days (Standard)</option>
                  <option value="30">30 Days</option>
                  <option value="45">45 Days</option>
                  <option value="0">Immediate / Advance Only (0 Days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── SUBMIT BUTTONS ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: "#ea580c",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 3px 10px rgba(234,88,12,0.35)",
              }}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : currentUserRole === "admin" ? (
                <>
                  <Check size={16} />
                  Register & Activate Customer
                </>
              ) : (
                <>
                  <Clock size={16} />
                  Submit Registration for Admin Approval
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
