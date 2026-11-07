"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/actions";
import { useERPStore } from "@/lib/store";

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const FIELD = (label: string, name: string, type = "text", required = false, placeholder = "") => ({
  label, name, type, required, placeholder
});

export default function NewCustomerPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = (fd.get("customer_name") as string || "").trim();
    if (!name) {
      setError("Customer name is required.");
      return;
    }
    const mobile = (fd.get("mobile") as string || "").trim();
    if (!mobile) {
      setError("Mobile number is required.");
      return;
    }

    startTransition(async () => {
      try {
        // Also save to Supabase if configured
        if (isConfigured) {
          try {
            await createCustomer(fd);
          } catch (err) {
            console.warn("Supabase save optional error:", err);
          }
        }

        // Always save to centralized persistent store
        const newCust = useERPStore.getState().addCustomer({
          name,
          business: (fd.get("business_name") as string) || name,
          category: (fd.get("category") as any) || "commercial",
          consumer_type: (fd.get("consumer_type") as string) || "regular",
          contact_person: (fd.get("contact_person") as string) || name,
          mobile,
          alt_mobile: (fd.get("alternate_mobile") as string) || "",
          email: (fd.get("email") as string) || "",
          gst: (fd.get("gstin") as string) || "",
          city: (fd.get("city") as string) || "Gwalior",
          area: (fd.get("billing_address") as string) || "Central",
          state: "Madhya Pradesh",
          pin: (fd.get("pincode") as string) || "474001",
          credit_limit: parseFloat((fd.get("credit_limit") as string) || "0") || 0,
          payment_terms: `${(fd.get("payment_terms_days") as string) || "15"} days`,
          status: "active",
        });

        setSuccess(`Customer ${newCust.name} created successfully! Redirecting...`);
        setTimeout(() => {
          router.push(`/customers/${newCust.id}`);
        }, 800);
      } catch (err: any) {
        setError(err.message || "Failed to create customer.");
      }
    });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Add New Customer</h1>
        <p className="page-sub">Fill in the customer details. Fields marked * are required.</p>
      </div>

      {!isConfigured && (
        <div style={{ background: "#fef3c7", border: "1.5px solid #fde68a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <strong style={{ color: "#92400e" }}>⚠️ Database not connected.</strong>
          <span style={{ color: "#78350f", marginLeft: 8 }}>
            Add your Supabase credentials to <code>.env.local</code> to save data.
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: 14, marginBottom: 16, color: "#b91c1c", fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 10, padding: 14, marginBottom: 16, color: "#15803d", fontSize: 13 }}>
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Section title="Basic Information">
          <Row>
            <Field label="Customer Name *" name="customer_name" required placeholder="Full customer name" />
            <Field label="Business Name" name="business_name" placeholder="Company / firm name" />
          </Row>
          <Row>
            <SelectField label="Category *" name="category" required options={[
              { value: "commercial", label: "Commercial" },
              { value: "domestic", label: "Domestic" },
              { value: "industrial", label: "Industrial" },
              { value: "institutional", label: "Institutional" },
            ]} />
            <SelectField label="Consumer Type" name="consumer_type" options={[
              { value: "regular", label: "Regular" },
              { value: "bulk", label: "Bulk" },
              { value: "seasonal", label: "Seasonal" },
              { value: "spot", label: "Spot" },
            ]} />
          </Row>
          <Row>
            <Field label="Existing Consumer ID" name="existing_consumer_id" placeholder="From previous system" />
            <Field label="Consumer Number" name="consumer_number" placeholder="Gas agency consumer number" />
          </Row>
        </Section>

        {/* Contact */}
        <Section title="Contact Details">
          <Row>
            <Field label="Contact Person" name="contact_person" placeholder="Primary contact name" />
            <Field label="Mobile *" name="mobile" type="tel" required placeholder="10-digit mobile number" />
          </Row>
          <Row>
            <Field label="Alternate Mobile" name="alternate_mobile" type="tel" placeholder="Secondary contact" />
            <Field label="Email" name="email" type="email" placeholder="customer@example.com" />
          </Row>
          <Row>
            <Field label="GST Number" name="gst_number" placeholder="22AAAAA0000A1Z5" />
          </Row>
        </Section>

        {/* Address */}
        <Section title="Address">
          <Field label="Billing Address" name="billing_address" placeholder="Full billing address" />
          <Field label="Delivery Address" name="delivery_address" placeholder="Full delivery address (if different)" />
          <Row>
            <Field label="City" name="city" placeholder="City" />
            <Field label="Area / Locality" name="area" placeholder="Area or locality" />
          </Row>
          <Row>
            <Field label="State" name="state" defaultValue="Rajasthan" />
            <Field label="PIN Code" name="pin_code" placeholder="302001" />
          </Row>
        </Section>

        {/* Finance */}
        <Section title="Financial Settings">
          <Row>
            <Field label="Credit Limit (₹)" name="credit_limit" type="number" placeholder="0" />
            <SelectField label="Payment Terms" name="payment_terms" options={[
              { value: "immediate", label: "Immediate" },
              { value: "net_7", label: "Net 7 days" },
              { value: "net_15", label: "Net 15 days" },
              { value: "net_30", label: "Net 30 days" },
              { value: "net_45", label: "Net 45 days" },
              { value: "net_60", label: "Net 60 days" },
              { value: "advance", label: "Advance Payment" },
            ]} />
          </Row>
          <Row>
            <Field label="Opening Receivable Balance (₹)" name="opening_receivable" type="number" placeholder="0"  />
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>Note</label>
              <p style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.6, paddingTop: 4 }}>
                Opening balance is posted as a ledger entry on save. Only enter the verified outstanding amount from your records.
              </p>
            </div>
          </Row>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>Internal Notes</label>
            <textarea name="notes" rows={3} placeholder="Any internal notes about this customer..."
              style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-orange" disabled={pending}>
            {pending ? "Saving..." : "💾 Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

function Field({ label, name, type = "text", required = false, placeholder = "", defaultValue = "" }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>{label}</label>
      <input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue}
        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)", outline: "none", transition: "border-color .15s" }}
        onFocus={e => e.target.style.borderColor = "var(--orange)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function SelectField({ label, name, options, required = false }: {
  label: string; name: string; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 6 }}>{label}</label>
      <select name={name} required={required}
        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "var(--fg)", background: "var(--bg)", outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

