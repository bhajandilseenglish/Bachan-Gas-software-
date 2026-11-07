import { Suspense } from "react";
import CustomersPage from "@/components/customers/CustomersPage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#64748b" }}>Loading customer register...</div>}>
      <CustomersPage />
    </Suspense>
  );
}

