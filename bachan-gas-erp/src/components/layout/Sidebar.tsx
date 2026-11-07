"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Upload, ShoppingCart, Plus, Clock,
  Truck, Package, Receipt, CreditCard, FileText, BookOpen, BarChart2,
  TrendingUp, PieChart, Settings, UserCog, ScrollText, FileArchive,
  ChevronRight, Flame, Tag, History, Shield, LogOut
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  {
    label: "Customers", Icon: Users,
    children: [
      { label: "All Customers", href: "/customers", Icon: Users },
      { label: "Commercial Consumers", href: "/customers?category=commercial", Icon: Building2 },
      { label: "+ Add Customer", href: "/customers/new", Icon: Plus },
      { label: "Excel Bulk Import", href: "/customers/import", Icon: Upload },
    ],
  },
  {
    label: "Orders", Icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/orders", Icon: ShoppingCart },
      { label: "+ New Order", href: "/orders/new", Icon: Plus },
      { label: "Pending Dispatch", href: "/orders?status=pending_dispatch", Icon: Clock },
    ],
  },
  {
    label: "Deliveries", Icon: Truck,
    children: [
      { label: "All Deliveries", href: "/deliveries", Icon: Truck },
      { label: "Pending Deliveries", href: "/deliveries?status=pending", Icon: Package },
    ],
  },
  {
    label: "Finance", Icon: Receipt,
    children: [
      { label: "Customer Ledger", href: "/finance/ledger", Icon: BookOpen },
      { label: "Outstanding Receivables", href: "/finance/outstanding", Icon: Receipt },
      { label: "Payment Collections", href: "/finance/payments", Icon: CreditCard },
      { label: "Credit Management", href: "/finance/credit", Icon: Shield },
      { label: "Tax Invoices", href: "/finance/invoices", Icon: FileText },
    ],
  },
  {
    label: "Products & Rates", Icon: Tag,
    children: [
      { label: "Cylinder Products", href: "/products", Icon: Package },
      { label: "Customer Rates", href: "/products/rates", Icon: Tag },
      { label: "Rate Change History", href: "/products/rates/history", Icon: History },
    ],
  },
  {
    label: "Reports", Icon: BarChart2,
    children: [
      { label: "Reports Overview", href: "/reports", Icon: BarChart2 },
      { label: "Sales & Collections", href: "/reports/sales", Icon: TrendingUp },
      { label: "Delivery Operations", href: "/reports/deliveries", Icon: Truck },
      { label: "Financial Audit", href: "/reports/financial", Icon: PieChart },
    ],
  },
  {
    label: "Administration", Icon: Settings,
    children: [
      { label: "Agency Settings", href: "/settings", Icon: Settings },
      { label: "Users & Roles", href: "/admin/users", Icon: UserCog },
      { label: "System Audit Logs", href: "/admin/audit", Icon: ScrollText },
      { label: "Excel Import History", href: "/admin/imports", Icon: FileArchive },
    ],
  },
];

interface Props { collapsed: boolean; mobileOpen: boolean; onClose: () => void; }

export default function Sidebar({ collapsed, mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState<string[]>(["Customers", "Finance", "Orders"]);

  // Exact Child Route Active Detection
  const isChildActive = (href: string) => {
    if (!href) return false;
    const [targetPath, targetQuery] = href.split("?");

    // 1. Base route pathname must match exactly
    if (pathname !== targetPath) return false;

    // 2. If target href specifies a query param (e.g. ?category=commercial or ?status=pending_dispatch)
    if (targetQuery) {
      const hrefParams = new URLSearchParams(targetQuery);
      for (const [k, v] of hrefParams.entries()) {
        if (searchParams.get(k) !== v) {
          return false;
        }
      }
      return true;
    }

    // 3. If target href has NO query parameters (e.g. /customers, /orders, /deliveries):
    // It is ONLY active if the URL does NOT contain specialized child filter params!
    if (targetPath === "/customers" && searchParams.get("category") === "commercial") {
      return false;
    }
    if (targetPath === "/orders" && searchParams.get("status") === "pending_dispatch") {
      return false;
    }
    if (targetPath === "/deliveries" && searchParams.get("status") === "pending") {
      return false;
    }

    return true;
  };

  const isGroupActive = (item: (typeof NAV)[number]) => {
    if (!item.children) return false;
    return item.children.some(c => isChildActive(c.href));
  };

  // Auto-expand group that contains active item
  useEffect(() => {
    NAV.forEach(item => {
      if (item.children && item.children.some(c => isChildActive(c.href))) {
        setOpen(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [pathname, searchParams]);

  const toggle = (lbl: string) =>
    setOpen(p => p.includes(lbl) ? p.filter(x => x !== lbl) : [...p, lbl]);

  return (
    <aside style={{
      width: collapsed ? 64 : 250,
      minWidth: collapsed ? 64 : 250,
      height: "100vh",
      background: "#0d1f3c",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
      transition: "width .2s, min-width .2s",
      zIndex: 50,
      position: "relative",
      boxShadow: "2px 0 10px rgba(0,0,0,.15)"
    }}>
      {/* Brand Header */}
      <Link href="/dashboard" style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 14px", borderBottom: "1px solid rgba(255,255,255,.08)",
        flexShrink: 0, minHeight: 62, textDecoration: "none"
      }}>
        <div style={{
          width: 36, height: 36, background: "#f97316", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 2px 8px rgba(249,115,22,.4)"
        }}>
          <Flame size={20} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", letterSpacing: "-.2px" }}>
              Bachan Gas
            </div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", whiteSpace: "nowrap", marginTop: 1, fontWeight: 500 }}>
              Enterprise LPG ERP
            </div>
          </div>
        )}
      </Link>

      {/* Navigation List */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 8px" }}
        className="sb-scrollbar">
        {NAV.map(item => {
          if (!item.children) {
            const act = pathname === item.href;
            return (
              <Link key={item.label} href={item.href!} onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 12px", borderRadius: 9, marginBottom: 3,
                  background: act ? "#f97316" : "transparent",
                  color: act ? "#fff" : "#94a3b8",
                  fontSize: 13, fontWeight: act ? 700 : 500,
                  transition: "all .15s ease",
                  whiteSpace: "nowrap", overflow: "hidden",
                  textDecoration: "none",
                  boxShadow: act ? "0 2px 6px rgba(249,115,22,.3)" : "none",
                }}
                onMouseEnter={e => { if (!act) { e.currentTarget.style.background = "#1a3560"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!act) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; } }}
              >
                <item.Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          const isOpen = open.includes(item.label);
          const grpAct = isGroupActive(item);

          return (
            <div key={item.label} style={{ marginBottom: 4 }}>
              {/* Group Toggle Button */}
              <button
                type="button"
                onClick={() => toggle(item.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 12px", borderRadius: 9,
                  width: "100%",
                  color: grpAct ? "#f97316" : "#94a3b8",
                  fontSize: 13, fontWeight: grpAct ? 700 : 500,
                  transition: "all .15s ease",
                  whiteSpace: "nowrap", overflow: "hidden",
                  background: "transparent", border: "none", cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1a3560"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = grpAct ? "#f97316" : "#94a3b8"; }}
              >
                <item.Icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    <ChevronRight size={13} style={{
                      opacity: 0.6,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform .2s ease",
                      flexShrink: 0,
                    }} />
                  </>
                )}
              </button>

              {/* Submenu Children with Distinct Independent Spacing */}
              {isOpen && !collapsed && (
                <div style={{
                  marginLeft: 18,
                  paddingLeft: 10,
                  borderLeft: "2px solid rgba(255,255,255,.12)",
                  marginTop: 4,
                  marginBottom: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}>
                  {item.children.map(child => {
                    const act = isChildActive(child.href);
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={onClose}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 11px",
                          borderRadius: 8,
                          background: act ? "#f97316" : "transparent",
                          color: act ? "#ffffff" : "#8fa8c8",
                          fontSize: 12.5,
                          fontWeight: act ? 700 : 500,
                          transition: "all .15s ease",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textDecoration: "none",
                          boxShadow: act ? "0 2px 6px rgba(249,115,22,.35)" : "none",
                          cursor: "pointer",
                          position: "relative",
                        }}
                        onMouseEnter={e => {
                          if (!act) {
                            e.currentTarget.style.background = "#1a3560";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!act) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#8fa8c8";
                          }
                        }}
                      >
                        <child.Icon size={14} style={{ flexShrink: 0 }} />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Staff User Footer */}
      {!collapsed && (
        <div style={{
          padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          background: "rgba(0,0,0,.15)"
        }}>
          <div style={{
            width: 34, height: 34, background: "#f97316", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>BA</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Bachan Admin</div>
            <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>Agency Super Admin</div>
          </div>
          <Link href="/login" title="Sign Out" style={{ color: "#94a3b8", display: "flex", padding: 4 }}>
            <LogOut size={15} />
          </Link>
        </div>
      )}
    </aside>
  );
}
