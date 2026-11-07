import { Suspense } from "react";
import DeliveriesPage from "@/components/deliveries/DeliveriesPage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#64748b" }}>Loading deliveries...</div>}>
      <DeliveriesPage />
    </Suspense>
  );
}

