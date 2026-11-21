"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientSavingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports/sales?tab=savings");
  }, [router]);

  return (
    <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
      Loading Client Wise Saving Report...
    </div>
  );
}
