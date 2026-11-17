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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">
            Commercial LPG customer management · Option A (Search & Link) or Option B (Register New)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUserRole === "admin" && (
            <Link
              href="/admin/customer-approvals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Customer Approvals Queue
            </Link>
          )}
          <Link
            href="/customers"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Customers
          </Link>
        </div>
      </div>

      {/* Role Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          currentUserRole === "admin"
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-blue-50/70 border-blue-200 text-blue-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {currentUserRole === "admin" ? (
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <span>
            Logged in as <strong>{currentSessionUser?.fullName || currentUserRole.toUpperCase()}</strong> ({currentUserRole === "admin" ? "Administrator" : "Operations Staff"}).
            {currentUserRole === "admin"
              ? " Direct registration approval is enabled."
              : " Registrations submitted will be routed to Admin for approval."}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "search"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="w-4 h-4" />
          Option A: Select / Search Existing Customer
        </button>
        <button
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "register"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Option B: Register New Commercial Customer
        </button>
      </div>

      {/* TAB 1: OPTION A */}
      {activeTab === "search" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Option A: Search & Link Existing Customer
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search by customer name, consumer number, SAP code, mobile, or city. Verified records will not be overwritten.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedExistingCustomer(null);
              }}
              placeholder="Type customer name, consumer ID, SAP code, or phone number..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Autocomplete Results */}
          {searchQuery.trim().length >= 1 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No registered customer found matching &quot;{searchQuery}&quot;. Switch to Option B to register a new customer.
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => setSelectedExistingCustomer(cust)}
                    className={`w-full text-left p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      selectedExistingCustomer?.id === cust.id ? "bg-orange-50/60" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{cust.name}</span>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {cust.code}
                        </span>
                        {cust.sap_code && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            SAP: {cust.sap_code}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            cust.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {cust.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {cust.business} · Mobile: {cust.mobile} · {cust.city || "Ludhiana"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Customer Details Preview when selected */}
          {selectedExistingCustomer && (
            <div className="mt-4 p-5 rounded-xl border border-orange-200 bg-orange-50/30 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                    Selected Existing Account
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedExistingCustomer.name}</h3>
                  <p className="text-xs text-slate-600">{selectedExistingCustomer.business}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-700">{selectedExistingCustomer.code}</span>
                  {selectedExistingCustomer.sap_code && (
                    <p className="text-xs text-slate-500 font-mono">SAP: {selectedExistingCustomer.sap_code}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-orange-200/60">
                <div>
                  <span className="text-slate-500 block">Mobile:</span>
                  <span className="font-semibold text-slate-900">{selectedExistingCustomer.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Outstanding:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedExistingCustomer.outstanding !== null
                      ? `₹${selectedExistingCustomer.outstanding.toLocaleString("en-IN")}`
                      : "Not Configured"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Credit Limit:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedExistingCustomer.credit_limit !== null
                      ? `₹${selectedExistingCustomer.credit_limit.toLocaleString("en-IN")}`
                      : "Not Set"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Tenure:</span>
                  <span className="font-semibold text-slate-900">{selectedExistingCustomer.payment_terms || "15 Days"}</span>
                </div>
              </div>

              {/* Action Buttons for selected customer */}
              <div className="pt-3 border-t border-orange-200/60 flex flex-wrap gap-2">
                <Link
                  href={`/customers/${selectedExistingCustomer.id}`}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-500 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Customer Profile
                </Link>
                <Link
                  href={`/orders/new?customer=${selectedExistingCustomer.id}`}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  Create Customer Order
                </Link>
                <Link
                  href={`/finance/payments?customer=${selectedExistingCustomer.id}`}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                  Record Payment
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPTION B */}
      {activeTab === "register" && (
        <form onSubmit={handleRegisterSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Option B: Register New Commercial Customer
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {currentUserRole === "admin"
                ? "Admin registration immediately activates the account with full commercial records."
                : "Staff registration will submit this profile to the Admin Customer Approvals queue for authorized verification."}
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Customer Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Customer Identity & Commercial Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Park Plaza Hotel / Mohan Sweet Shop"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Trading Name
                </label>
                <input
                  type="text"
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  placeholder="e.g. Park Plaza Hospitality Pvt Ltd"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consumer / Customer Number
                </label>
                <input
                  type="text"
                  value={formData.consumer_no}
                  onChange={(e) => setFormData({ ...formData, consumer_no: e.target.value })}
                  placeholder="Auto-generated (or enter official IOCL consumer ID)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SAP Customer Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sap_code}
                  onChange={(e) => setFormData({ ...formData, sap_code: e.target.value })}
                  placeholder="e.g. SAP-110351-409"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Manager / Proprietor Name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Category
                </label>
                <input
                  type="text"
                  readOnly
                  value="Commercial (Non-Domestic LPG)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. 98150 12345"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.alt_mobile}
                  onChange={(e) => setFormData({ ...formData, alt_mobile: e.target.value })}
                  placeholder="e.g. 98765 43210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="accounts@business.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Addresses */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              3. Addresses (Billing & Delivery)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Registered commercial billing address..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Address / LPG Manifold Location
                </label>
                <textarea
                  rows={2}
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="Physical kitchen, boiler or cylinder manifold location..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Proposed Terms */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              4. Commercial Terms & Credit Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="e.g. 50000 (leave empty if not applicable)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Payment Tenure (Days)
                </label>
                <select
                  value={formData.payment_tenure_days}
                  onChange={(e) => setFormData({ ...formData, payment_tenure_days: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-orange-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : currentUserRole === "admin" ? (
                <>
                  <Check className="w-4 h-4" />
                  Register & Activate Customer
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
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
