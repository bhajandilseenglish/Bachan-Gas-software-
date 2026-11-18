"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Upload, ShoppingCart, Plus, Clock,
  Truck, Package, Receipt, CreditCard, FileText, BookOpen, BarChart2,
  TrendingUp, PieChart, Settings, UserCog, ScrollText, FileArchive,
  ChevronRight, Flame, Tag, History, Shield, LogOut, X, AlertTriangle,
  RotateCcw, CheckSquare, Calendar, Bell, ShieldCheck, Wallet
} from "lucide-react";
import { useERPStore } from "@/lib/store";

interface Props { collapsed: boolean; mobileOpen: boolean; onClose: () => void; }

interface NavChildItem {
  label: string;
  href: string;
  Icon: any;
  badge?: string | number;
  badgeColor?: string;
}

interface NavItem {
  label: string;
  href?: string;
  Icon: any;
  badge?: string | number;
  badgeColor?: string;
  children?: NavChildItem[];
}

export default function Sidebar({ collapsed, mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUserRole, missedOrderAlerts, customerApprovals } = useERPStore();
  const [open, setOpen] = useState<string[]>(["Customers", "Finance", "Orders"]);

  const pendingAlertCount = missedOrderAlerts.filter(a => a.status === "active").length;
  const pendingApprovalsCount = customerApprovals.filter(a => a.status === "pending_approval").length;

  const isAdmin = currentUserRole === "admin";

  const NAV: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
    {
      label: "Customers", Icon: Users,
      badge: (isAdmin && pendingApprovalsCount > 0) || pendingAlertCount > 0 ? (pendingApprovalsCount + pendingAlertCount) : undefined,
      children: [
        { label: "Add Customer", href: "/customers/new", Icon: Plus },
        { label: "All Customers", href: "/customers", Icon: Users },
        ...(isAdmin
          ? [
              {
                label: "Customer Approvals",
                href: "/admin/customer-approvals",
                Icon: ShieldCheck,
                badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
                badgeColor: "#ea580c",
              },
            ]
          : []),
        {
          label: "Missed Order Alerts",
          href: "/customers/alerts",
          Icon: AlertTriangle,
          badge: pendingAlertCount > 0 ? String(pendingAlertCount) : undefined,
          badgeColor: "#dc2626",
        },
        { label: "Excel Import", href: "/customers/import", Icon: Upload },
      ],
    },
    {
      label: "Orders", Icon: ShoppingCart,
      children: [
        { label: "All Orders", href: "/orders", Icon: ShoppingCart },
        { label: "Create Order", href: "/orders/new", Icon: Plus },
        { label: "Pending Orders", href: "/orders?status=pending_dispatch", Icon: Clock },
      ],
    },
    {
      label: "Deliveries", href: "/deliveries", Icon: Truck,
    },
    {
      label: "Cylinder Returns", href: "/cylinder-returns", Icon: RotateCcw,
    },
    {
      label: "Warehouse Inventory", href: "/inventory", Icon: Package,
    },
    {
      label: "Finance", Icon: Receipt,
      children: [
        { label: "Invoices", href: "/finance/invoices", Icon: FileText },
        { label: "Payment Receipts", href: "/finance/payments", Icon: CreditCard },
        { label: "Customer Advances", href: "/finance/advances", Icon: Wallet },
        { label: "Customer Ledger", href: "/finance/ledger", Icon: BookOpen },
        ...(isAdmin
          ? [
              { label: "Outstanding Receivables", href: "/finance/outstanding", Icon: Receipt },
              { label: "Opening Balances", href: "/finance/opening-balances", Icon: Upload },
              { label: "Credit Limits", href: "/finance/credit", Icon: Shield },
              { label: "Payment Tenure", href: "/finance/tenure", Icon: Calendar },
            ]
          : []),
      ],
    },
    {
      label: "Reports", Icon: BarChart2,
      children: [
        { label: "Sales & Revenue", href: "/reports/sales", Icon: TrendingUp },
        { label: "Delivery Operations", href: "/reports/deliveries", Icon: Truck },
        { label: "Cylinder Ledger", href: "/reports/cylinders", Icon: RotateCcw },
        { label: "Financial Audit", href: "/reports/financial", Icon: PieChart },
        { label: "Inactivity & Retention", href: "/reports/inactivity", Icon: AlertTriangle },
      ],
    },
    // Master Settings is available to Admin
    ...(isAdmin
      ? [
          {
            label: "Master Settings", Icon: Settings,
            children: [
              { label: "Basic Rates", href: "/products/basic-rates", Icon: Shield },
              { label: "Customer Rates", href: "/products/rates", Icon: Tag },
              { label: "Product Master", href: "/products", Icon: Package },
              { label: "Employees", href: "/admin/users", Icon: UserCog },
              { label: "Audit Log", href: "/admin/audit", Icon: ScrollText },
              { label: "Agency Settings", href: "/settings", Icon: Settings },
            ],
          },
        ]
      : []),
  ];

  // Exact Child Route Active Detection
  const isChildActive = (href: string) => {
    if (!href) return false;
    const [targetPath, targetQuery] = href.split("?");

    if (pathname !== targetPath) return false;

    if (targetQuery) {
      const hrefParams = new URLSearchParams(targetQuery);
      for (const [k, v] of hrefParams.entries()) {
        if (searchParams.get(k) !== v) {
          return false;
        }
      }
      return true;
    }

    if (["/customers", "/orders", "/deliveries"].includes(targetPath)) {
      if (searchParams.toString().length > 0) return false;
    }

    return true;
  };

  const isParentActive = (item: (typeof NAV)[0]) => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some(c => isChildActive(c.href));
    }
    return false;
  };

  const toggleSection = (label: string) => {
    setOpen(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <aside
      id="sidebar"
      className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      style={{
        width: collapsed ? 64 : 260,
        height: "100vh",
        background: "#0d1f3c",
        color: "#94a3b8",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width .2s ease, transform .2s ease",
        zIndex: 50,
        position: "relative",
      }}
    >
      {/* Brand Header */}
      <div style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? "0" : "0 16px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        flexShrink: 0,
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32,
            height: 32,
            background: "#f97316",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(249,115,22,.4)",
          }}>
            <Flame size={18} />
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "#fff", letterSpacing: "-.2px" }}>
                Bachan Gas Service
              </div>
              <div style={{ fontSize: 10, color: "#f97316", fontWeight: 700, letterSpacing: ".04em" }}>
                LUDHIANA · 0000110351
              </div>
            </div>
          )}
        </Link>
        {mobileOpen && (
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#94a3b8",
              cursor: "pointer", padding: 6, display: "flex"
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(item => {
          const parentActive = isParentActive(item);
          const hasChildren = !!item.children;
          const isOpen = open.includes(item.label);

          if (!hasChildren && item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={parentActive ? "active" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: parentActive ? 700 : 500,
                  color: parentActive ? "#ffffff" : "#94a3b8",
                  background: parentActive ? "rgba(249,115,22,.18)" : "transparent",
                  borderLeft: parentActive ? "3px solid #f97316" : "3px solid transparent",
                  transition: "all .12s",
                }}
              >
                <item.Icon size={17} color={parentActive ? "#f97316" : "#94a3b8"} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          return (
            <div key={item.label} style={{ display: "flex", flexDirection: "column" }}>
              <button
                onClick={() => toggleSection(item.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "space-between",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  background: parentActive ? "rgba(255,255,255,.05)" : "transparent",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: parentActive ? "#ffffff" : "#94a3b8",
                  fontSize: 13,
                  fontWeight: parentActive ? 700 : 500,
                  width: "100%",
                  transition: "all .12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <item.Icon size={17} color={parentActive ? "#f97316" : "#94a3b8"} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.badge && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 100, background: "#dc2626", color: "#fff", fontWeight: 700 }}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      style={{
                        transform: isOpen ? "rotate(90deg)" : "none",
                        transition: "transform .15s",
                        opacity: 0.7,
                      }}
                    />
                  </div>
                )}
              </button>

              {!collapsed && isOpen && item.children && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 18, marginTop: 2, borderLeft: "1px solid rgba(255,255,255,.07)", marginLeft: 16 }}>
                  {item.children.map(child => {
                    const active = isChildActive(child.href);
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={onClose}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 10px",
                          borderRadius: 6,
                          textDecoration: "none",
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 500,
                          color: active ? "#ffffff" : "#94a3b8",
                          background: active ? "rgba(249,115,22,.2)" : "transparent",
                          borderLeft: active ? "2px solid #f97316" : "2px solid transparent",
                          transition: "all .12s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <child.Icon size={14} color={active ? "#f97316" : "#64748b"} />
                          <span>{child.label}</span>
                        </div>
                        {child.badge && (
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 100, background: child.badgeColor || "#f97316", color: "#fff", fontWeight: 700 }}>
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div style={{
        padding: collapsed ? "12px 0" : "12px 14px",
        borderTop: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {!collapsed && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,.05)", padding: "6px 10px", borderRadius: 8, fontSize: 11
          }}>
            <span style={{ color: "#94a3b8" }}>Active Role:</span>
            <span style={{
              fontWeight: 800,
              color: currentUserRole === "admin" ? "#38bdf8" : "#4ade80",
              textTransform: "uppercase"
            }}>
              {currentUserRole === "admin" ? "Super Admin" : "Staff User"}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
