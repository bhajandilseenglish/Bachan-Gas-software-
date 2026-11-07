"use client";
import { useState, Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div id="app-shell">
      <div className={`mob-overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <Suspense fallback={<aside style={{ width: collapsed ? 64 : 250, minWidth: collapsed ? 64 : 250, height: "100vh", background: "#0d1f3c" }} />}>
        <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Suspense>
      <div id="main">
        <Suspense fallback={<header style={{ height: 58, background: "#fff" }} />}>
          <Header
            onMenu={() => setMobileOpen(true)}
            onToggle={() => setCollapsed(p => !p)}
            collapsed={collapsed}
          />
        </Suspense>
        <div id="page">{children}</div>
      </div>
    </div>
  );
}
