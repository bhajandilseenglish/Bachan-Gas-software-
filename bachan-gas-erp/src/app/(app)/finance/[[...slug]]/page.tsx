export default function FinancePage({ params }: { params: { slug: string[] } }) {
  const page = params?.slug?.[0] || "ledger";
  const titles: Record<string, string> = {
    ledger: "Customer Ledger",
    outstanding: "Outstanding Payments",
    payments: "Payment Collection",
    credit: "Credit Management",
    invoices: "Invoices",
  };
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{titles[page] || "Finance"}</h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Financial management module</p>
      </div>
      <div className="rounded-xl border p-8 text-center" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>{titles[page]} — database integration in progress</p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Connect Supabase credentials to activate live data</p>
      </div>
    </div>
  );
}

