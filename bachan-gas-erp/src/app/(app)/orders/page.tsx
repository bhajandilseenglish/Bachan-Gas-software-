import { Suspense } from "react";
import OrdersPage from "@/components/orders/OrdersPage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#64748b" }}>Loading orders...</div>}>
      <OrdersPage />
    </Suspense>
  );
}

