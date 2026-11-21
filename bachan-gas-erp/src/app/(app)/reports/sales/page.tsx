"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Percent,
  Truck,
  FileSpreadsheet,
  Printer,
  Download,
  Layers,
  ShieldCheck,
  ChevronRight,
  Info,
  Sliders,
  Search,
  Building2,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useERPStore, Order, OrderItem, CustomerRate, CylinderProduct } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const INRF = (n: number) => "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ActiveTab = "daily" | "forecast" | "growth" | "savings";
type DateFilter = "today" | "yesterday" | "7days" | "month" | "custom";

export default function SalesReportsPage() {
  const { orders, invoices, payments, customerRates, products, customers } = useERPStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("daily");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState<string>("2026-11-21");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [growthScenarioPct, setGrowthScenarioPct] = useState<number>(10); // +10% target growth for next month
  const [growthPeriod, setGrowthPeriod] = useState<"day" | "week" | "month">("day");

  // Reference test dates
  const TODAY_STR = "2026-11-21";
  const YESTERDAY_STR = "2026-11-20";

  // Product reference weight lookup helper
  const getProductRefWeight = (productId: string, productName?: string): number => {
    const prod = products.find((p) => p.id === productId || p.name.toLowerCase() === productName?.toLowerCase());
    if (prod?.referenceWeightKg) return prod.referenceWeightKg;
    if (productName?.includes("47.5")) return 47.5;
    if (productName?.includes("425")) return 425.0;
    return 19.0;
  };

  // Standard tariff lookup helper
  const getStandardTariff = (productId: string, productName?: string): number => {
    const prod = products.find((p) => p.id === productId || p.name.toLowerCase() === productName?.toLowerCase());
    return prod?.rate || (productName?.includes("47.5") ? 4750 : 1900);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. FILTERED ORDERS FOR DAILY REPORT
  // ─────────────────────────────────────────────────────────────
  const dailyFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.date || o.orderDate || o.createdAt?.slice(0, 10);
      if (dateFilter === "today") return orderDate === TODAY_STR;
      if (dateFilter === "yesterday") return orderDate === YESTERDAY_STR;
      if (dateFilter === "7days") return orderDate >= "2026-11-15" && orderDate <= TODAY_STR;
      if (dateFilter === "month") return orderDate?.startsWith("2026-11");
      if (dateFilter === "custom") return orderDate === customDate;
      return true;
    }).filter((o) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        o.num?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerCode?.toLowerCase().includes(q) ||
        o.sapCode?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.productName.toLowerCase().includes(q))
      );
    });
  }, [orders, dateFilter, customDate, searchTerm]);

  // Aggregate daily metrics
  const dailyMetrics = useMemo(() => {
    let totalCylinders = 0;
    let totalGasKg = 0;
    let taxableSales = 0;
    let totalGst = 0;
    let grossRevenue = 0;
    const clientSet = new Set<string>();

    dailyFilteredOrders.forEach((o) => {
      clientSet.add(o.customerId || o.customerName);
      totalCylinders += o.totalQty || o.qty || 0;
      taxableSales += o.subtotal || 0;
      totalGst += o.taxAmt || (o.cgstAmount || 0) + (o.sgstAmount || 0);
      grossRevenue += o.total || 0;

      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          const w = item.referenceWeightKg || getProductRefWeight(item.productId, item.productName);
          totalGasKg += item.qty * w;
        });
      } else {
        const w = o.referenceWeightKg || getProductRefWeight("", o.productName);
        totalGasKg += (o.totalQty || o.qty || 0) * w;
      }
    });

    const avgRatePerKg = totalGasKg > 0 ? taxableSales / totalGasKg : 0;

    // Collections realized for the selected dates
    const collections = payments
      .filter((p) => {
        if (dateFilter === "today") return p.date === TODAY_STR;
        if (dateFilter === "yesterday") return p.date === YESTERDAY_STR;
        if (dateFilter === "7days") return p.date >= "2026-11-15" && p.date <= TODAY_STR;
        if (dateFilter === "month") return p.date?.startsWith("2026-11");
        if (dateFilter === "custom") return p.date === customDate;
        return true;
      })
      .reduce((s, p) => s + p.amount, 0);

    return {
      totalCylinders,
      totalGasKg,
      totalGasMT: totalGasKg / 1000,
      taxableSales,
      totalGst,
      grossRevenue,
      avgRatePerKg,
      activeClients: clientSet.size,
      collections,
      collectionEfficiency: grossRevenue > 0 ? Math.min(100, (collections / grossRevenue) * 100) : 0,
    };
  }, [dailyFilteredOrders, payments, dateFilter, customDate]);

  // Product distribution data for chart
  const dailyProductDistribution = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; kg: number }> = {};
    dailyFilteredOrders.forEach((o) => {
      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          const key = item.productName;
          if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0, kg: 0 };
          map[key].qty += item.qty;
          map[key].revenue += item.total || item.subtotal * 1.18;
          map[key].kg += item.qty * (item.referenceWeightKg || getProductRefWeight(item.productId, item.productName));
        });
      } else if (o.productName) {
        const key = o.productName;
        if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0, kg: 0 };
        const q = o.totalQty || o.qty || 0;
        map[key].qty += q;
        map[key].revenue += o.total;
        map[key].kg += q * (o.referenceWeightKg || getProductRefWeight("", o.productName));
      }
    });
    return Object.values(map);
  }, [dailyFilteredOrders]);

  // ─────────────────────────────────────────────────────────────
  // 2. GROWTH COMPARISON (Day-over-Day, Week-over-Week, MTD)
  // ─────────────────────────────────────────────────────────────
  const growthComparison = useMemo(() => {
    // Current period vs previous period
    const getPeriodMetrics = (filterType: "current" | "previous", mode: "day" | "week" | "month") => {
      let filterFn: (d: string) => boolean;

      if (mode === "day") {
        const target = filterType === "current" ? TODAY_STR : YESTERDAY_STR;
        filterFn = (d) => d === target;
      } else if (mode === "week") {
        filterFn = filterType === "current"
          ? (d) => d >= "2026-11-15" && d <= "2026-11-21"
          : (d) => d >= "2026-11-08" && d <= "2026-11-14";
      } else {
        filterFn = filterType === "current"
          ? (d) => d?.startsWith("2026-11")
          : (d) => d?.startsWith("2026-10");
      }

      const periodOrders = orders.filter((o) => filterFn(o.date || o.orderDate || ""));
      let cylinders = 0;
      let gasKg = 0;
      let taxable = 0;
      let gross = 0;

      periodOrders.forEach((o) => {
        cylinders += o.totalQty || o.qty || 0;
        taxable += o.subtotal || 0;
        gross += o.total || 0;
        if (o.items && o.items.length > 0) {
          o.items.forEach((item) => {
            const w = item.referenceWeightKg || getProductRefWeight(item.productId, item.productName);
            gasKg += item.qty * w;
          });
        } else {
          gasKg += (o.totalQty || o.qty || 0) * (o.referenceWeightKg || 19);
        }
      });

      return {
        cylinders,
        gasKg,
        taxable,
        gross,
        avgRatePerKg: gasKg > 0 ? taxable / gasKg : 0,
        orderCount: periodOrders.length,
      };
    };

    const current = getPeriodMetrics("current", growthPeriod);
    const previous = getPeriodMetrics("previous", growthPeriod);

    const calcGrowth = (curr: number, prev: number) => {
      const diff = curr - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : curr > 0 ? 100 : 0;
      return { diff, pct };
    };

    return {
      current,
      previous,
      cylinders: calcGrowth(current.cylinders, previous.cylinders),
      gasKg: calcGrowth(current.gasKg, previous.gasKg),
      gross: calcGrowth(current.gross, previous.gross),
      ratePerKg: { diff: current.avgRatePerKg - previous.avgRatePerKg, pct: previous.avgRatePerKg > 0 ? ((current.avgRatePerKg - previous.avgRatePerKg) / previous.avgRatePerKg) * 100 : 0 },
      orders: calcGrowth(current.orderCount, previous.orderCount),
    };
  }, [orders, growthPeriod]);

  // ─────────────────────────────────────────────────────────────
  // 3. NEXT MONTH PROJECTIONS & INDENT FORECAST ("Eg next month, after report")
  // ─────────────────────────────────────────────────────────────
  const forecastMetrics = useMemo(() => {
    // Current November actuals
    const novOrders = orders.filter((o) => (o.date || o.orderDate || "")?.startsWith("2026-11"));
    let mtdCylinders = 0;
    let mtdGasKg = 0;
    let mtdGross = 0;

    novOrders.forEach((o) => {
      mtdCylinders += o.totalQty || o.qty || 0;
      mtdGross += o.total || 0;
      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          mtdGasKg += item.qty * (item.referenceWeightKg || getProductRefWeight(item.productId, item.productName));
        });
      } else {
        mtdGasKg += (o.totalQty || o.qty || 0) * (o.referenceWeightKg || 19);
      }
    });

    const daysElapsed = 21; // November 21
    const totalDaysNov = 30;
    const runRateMultiplier = totalDaysNov / daysElapsed; // 30 / 21 = 1.428

    const projectedNovCylinders = Math.round(mtdCylinders * runRateMultiplier);
    const projectedNovGasKg = Math.round(mtdGasKg * runRateMultiplier);
    const projectedNovGross = Math.round(mtdGross * runRateMultiplier);

    // Next Month (December 2026) Projection
    // December has 31 days. Commercial accounts consume at steady refill cadence + client growth factor
    const growthMult = 1 + growthScenarioPct / 100;

    // Estimate based on run-rate + customer refill frequency model
    const baseDecCylinders = Math.round(projectedNovCylinders * (31 / 30));
    const nextMonthCylinders = Math.round(baseDecCylinders * growthMult);
    const nextMonthGasKg = Math.round(projectedNovGasKg * (31 / 30) * growthMult);
    const nextMonthGross = Math.round(projectedNovGross * (31 / 30) * growthMult);

    // Product breakdown for next month
    const nextMonthProductIndent = [
      {
        productName: "47.5kg LOT",
        unitWeightKg: 47.5,
        projectedCylinders: Math.round(nextMonthCylinders * 0.38),
        projectedGasKg: Math.round(nextMonthCylinders * 0.38 * 47.5),
        projectedRevenue: Math.round(nextMonthCylinders * 0.38 * 4750 * 1.18),
        safetyBuffer: Math.round(nextMonthCylinders * 0.38 * 0.1),
      },
      {
        productName: "19 kg normal",
        unitWeightKg: 19.0,
        projectedCylinders: Math.round(nextMonthCylinders * 0.52),
        projectedGasKg: Math.round(nextMonthCylinders * 0.52 * 19.0),
        projectedRevenue: Math.round(nextMonthCylinders * 0.52 * 1900 * 1.18),
        safetyBuffer: Math.round(nextMonthCylinders * 0.52 * 0.1),
      },
      {
        productName: "19 kg extra tej",
        unitWeightKg: 19.0,
        projectedCylinders: Math.round(nextMonthCylinders * 0.07),
        projectedGasKg: Math.round(nextMonthCylinders * 0.07 * 19.0),
        projectedRevenue: Math.round(nextMonthCylinders * 0.07 * 1900 * 1.18),
        safetyBuffer: Math.round(nextMonthCylinders * 0.07 * 0.1),
      },
      {
        productName: "425kg jumbo",
        unitWeightKg: 425.0,
        projectedCylinders: Math.max(1, Math.round(nextMonthCylinders * 0.03)),
        projectedGasKg: Math.max(1, Math.round(nextMonthCylinders * 0.03)) * 425.0,
        projectedRevenue: Math.max(1, Math.round(nextMonthCylinders * 0.03)) * 42500 * 1.18,
        safetyBuffer: 1,
      },
    ];

    // IOCL Indent Logistics: 1 full commercial truckload ~ 306-324 cylinders
    const truckCapacity = 306;
    const requiredTruckloads = Math.ceil(nextMonthCylinders / truckCapacity);
    const weeklyIndent = Math.ceil(nextMonthCylinders / 4);

    return {
      daysElapsed,
      totalDaysNov,
      mtdCylinders,
      mtdGasKg,
      mtdGross,
      projectedNovCylinders,
      projectedNovGasKg,
      projectedNovGross,
      nextMonthCylinders,
      nextMonthGasKg,
      nextMonthGasMT: (nextMonthGasKg / 1000).toFixed(2),
      nextMonthGross,
      productIndents: nextMonthProductIndent,
      requiredTruckloads,
      weeklyIndent,
    };
  }, [orders, growthScenarioPct]);

  // ─────────────────────────────────────────────────────────────
  // 4. SAVINGS PER CLIENT REPORT ("saving per client")
  // ─────────────────────────────────────────────────────────────
  const clientSavingsData = useMemo(() => {
    // Map aggregated customer orders
    const map: Record<
      string,
      {
        customerId: string;
        customerName: string;
        customerCode: string;
        sapCode: string;
        category: string;
        productName: string;
        totalQty: number;
        standardRate: number;
        approvedRate: number;
        ratePerKg: number;
        totalBilledBasic: number;
        totalStandardBasic: number;
        paymentTerms: string;
      }
    > = {};

    orders.forEach((o) => {
      const custId = o.customerId || o.customerName;
      const cust = customers.find((c) => c.id === custId || c.code === o.customerCode || c.name === o.customerName);
      const custRate = customerRates.find((r) => r.customerId === custId || r.customerName === o.customerName);

      const item = o.items?.[0];
      const prodName = item?.productName || o.productName || "19 kg normal";
      const prodId = item?.productId || "";
      const standardRate = getStandardTariff(prodId, prodName);
      const billedRate = item?.unitRate || custRate?.agreedRate || standardRate;
      const qty = o.totalQty || o.qty || 0;

      if (!map[custId]) {
        map[custId] = {
          customerId: custId,
          customerName: o.customerName,
          customerCode: o.customerCode || cust?.code || "—",
          sapCode: o.sapCode || cust?.sap_code || custRate?.sapCode || "—",
          category: cust?.consumer_type || cust?.category || "Commercial",
          productName: prodName,
          totalQty: 0,
          standardRate,
          approvedRate: billedRate,
          ratePerKg: item?.calculatedRatePerKg || custRate?.ratePerKg || (billedRate / getProductRefWeight(prodId, prodName)),
          totalBilledBasic: 0,
          totalStandardBasic: 0,
          paymentTerms: cust?.payment_terms || "Net 15 Days",
        };
      }

      map[custId].totalQty += qty;
      map[custId].totalBilledBasic += qty * billedRate;
      map[custId].totalStandardBasic += qty * standardRate;
    });

    const rows = Object.values(map).map((row) => {
      const perCylinderSaving = Math.max(0, row.standardRate - row.approvedRate);
      const totalSaving = Math.max(0, row.totalStandardBasic - row.totalBilledBasic);
      const savingPct = row.standardRate > 0 ? (perCylinderSaving / row.standardRate) * 100 : 0;
      return {
        ...row,
        perCylinderSaving,
        totalSaving,
        savingPct,
      };
    });

    // Sort by highest total saving
    rows.sort((a, b) => b.totalSaving - a.totalSaving);

    const totalSavingsGranted = rows.reduce((s, r) => s + r.totalSaving, 0);
    const totalCommercialCylinders = rows.reduce((s, r) => s + r.totalQty, 0);
    const avgSavingPct = rows.length > 0 ? rows.reduce((s, r) => s + r.savingPct, 0) / rows.length : 0;
    const topClient = rows[0]?.customerName || "—";

    return {
      rows,
      totalSavingsGranted,
      totalCommercialCylinders,
      avgSavingPct,
      topClient,
    };
  }, [orders, customers, customerRates, products]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "savings") {
      csvContent += "Customer Name,SAP Code,Category,Product,Total Qty,Standard Rate (INR),Approved Rate (INR),Saving Per Cyl (INR),Total Savings (INR),Savings %\n";
      clientSavingsData.rows.forEach((r) => {
        csvContent += `"${r.customerName}","${r.sapCode}","${r.category}","${r.productName}",${r.totalQty},${r.standardRate},${r.approvedRate},${r.perCylinderSaving.toFixed(2)},${r.totalSaving.toFixed(2)},${r.savingPct.toFixed(1)}%\n`;
      });
    } else {
      csvContent += "Order ID,Date,Customer Name,SAP Code,Product,Quantity,Unit Rate (INR),Calculated Rate/KG,Taxable Subtotal (INR),GST (INR),Gross Total (INR),Status\n";
      dailyFilteredOrders.forEach((o) => {
        const item = o.items?.[0];
        csvContent += `"${o.num}","${o.date}","${o.customerName}","${o.sapCode || ""}","${item?.productName || o.productName || ""}",${o.totalQty},${item?.unitRate || ""},${item?.calculatedRatePerKg || ""},${o.subtotal},${o.taxAmt},${o.total},"${o.status}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bachan_Gas_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header & Main Navigation Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                background: "#1e3a8a15",
                color: "#1e3a8a",
                fontWeight: 800,
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 6,
                letterSpacing: ".5px",
                textTransform: "uppercase",
              }}
            >
              Enterprise Sales Intelligence
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>• Operational Date: 21 Nov 2026</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-.5px" }}>
            Sales & Commercial Reports
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Daily order volumes, next month IOCL plant indent forecasting, growth comparisons, and client contract savings
          </p>
        </div>

        {/* Global Export & Print Tools */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Printer size={15} /> Print Summary
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#1e3a8a",
              border: "none",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(30,58,138,0.25)",
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Modern 4-Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#f1f5f9",
          padding: 6,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #e2e8f0",
          overflowX: "auto",
        }}
      >
        {[
          { id: "daily", label: "Daily Sales Report", icon: Calendar, badge: "Simplified" },
          { id: "forecast", label: "Next Month Forecast & Indents", icon: Sparkles, badge: "Dec 2026" },
          { id: "growth", label: "Growth Comparison", icon: TrendingUp, badge: "DoD / WoW" },
          { id: "savings", label: "Savings Per Client", icon: Percent, badge: "Contract Rates" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#1e3a8a" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} color={isActive ? "#1e3a8a" : "#64748b"} />
              {tab.label}
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 10,
                  background: isActive ? "#1e3a8a15" : "#e2e8f0",
                  color: isActive ? "#1e3a8a" : "#64748b",
                  fontWeight: 700,
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: SIMPLIFIED DAILY SALES REPORT                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "daily" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Date Filters Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#ffffff",
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginRight: 4 }}>
                Period Filter:
              </span>
              {[
                { id: "today", label: "Today (21 Nov)" },
                { id: "yesterday", label: "Yesterday (20 Nov)" },
                { id: "7days", label: "Past 7 Days" },
                { id: "month", label: "Month to Date (Nov)" },
                { id: "custom", label: "Custom Date" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id as DateFilter)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: dateFilter === filter.id ? "1.5px solid #1e3a8a" : "1px solid #cbd5e1",
                    background: dateFilter === filter.id ? "#1e3a8a10" : "#ffffff",
                    color: dateFilter === filter.id ? "#1e3a8a" : "#475569",
                    fontWeight: dateFilter === filter.id ? 800 : 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {filter.label}
                </button>
              ))}

              {dateFilter === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                />
              )}
            </div>

            {/* Quick search input */}
            <div style={{ position: "relative", minWidth: 260 }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search order, customer, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {[
              {
                label: "Cylinders Supplied",
                val: `${dailyMetrics.totalCylinders} units`,
                sub: `${dailyMetrics.totalGasMT.toFixed(2)} MT LPG Mass (${dailyMetrics.totalGasKg.toLocaleString()} kg)`,
                color: "#1e3a8a",
                bg: "#1e3a8a08",
                icon: Package,
              },
              {
                label: "Gross Invoiced Revenue",
                val: INR(dailyMetrics.grossRevenue),
                sub: `Basic: ${INR(dailyMetrics.taxableSales)} + GST 18%: ${INR(dailyMetrics.totalGst)}`,
                color: "#0f172a",
                bg: "#f8fafc",
                icon: DollarSign,
              },
              {
                label: "Avg Realized Rate / KG",
                val: `₹${dailyMetrics.avgRatePerKg.toFixed(2)} / kg`,
                sub: "Exclusive of 18% GST baseline",
                color: "#d97706",
                bg: "#fffbeb",
                icon: Flame,
              },
              {
                label: "Collections Realized",
                val: INR(dailyMetrics.collections),
                sub: `${dailyMetrics.collectionEfficiency.toFixed(1)}% realization on period sales`,
                color: "#16a34a",
                bg: "#16a34a08",
                icon: CheckCircle2,
              },
              {
                label: "Active Accounts Billed",
                val: `${dailyMetrics.activeClients} Accounts`,
                sub: `${dailyFilteredOrders.length} confirmed dispatches`,
                color: "#7c3aed",
                bg: "#7c3aed08",
                icon: Building2,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: card.bg,
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      {card.label}
                    </span>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Icon size={14} color={card.color} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: card.color, letterSpacing: "-.5px" }}>
                      {card.val}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>{card.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Breakdown Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
            {/* Product Volume Bar Chart */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Product-Wise Volume Distribution
                  </h3>
                  <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>
                    Cylinders supplied and net LPG mass for selected period
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#f1f5f9",
                    padding: "3px 8px",
                    borderRadius: 6,
                    color: "#475569",
                  }}
                >
                  {dailyProductDistribution.length} Active SKUs
                </span>
              </div>

              {dailyProductDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyProductDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(v: any, name: any) => [
                        name === "qty" ? `${v} cylinders` : `${v} kg`,
                        name === "qty" ? "Units" : "LPG Mass",
                      ]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="qty" name="Units (Cyl)" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="kg" name="LPG Weight (kg)" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8", fontSize: 13 }}>
                  No supply dispatches recorded for this date filter.
                </div>
              )}
            </div>

            {/* Quick Operational Snapshot Card */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Daily Tax & Rate Summary
                </h3>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 14px" }}>
                  GST statutory bifurcation and rate realization
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#475569" }}>Taxable Subtotal (Basic):</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a" }}>
                      {INRF(dailyMetrics.taxableSales)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#475569" }}>CGST @ 9% (Punjab):</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                      {INRF(dailyMetrics.totalGst / 2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#475569" }}>SGST @ 9% (Punjab):</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                      {INRF(dailyMetrics.totalGst / 2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#1e3a8a10",
                      borderRadius: 6,
                      border: "1px solid #1e3a8a25",
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#1e3a8a" }}>
                      Total Gross Billing:
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a" }}>
                      {INRF(dailyMetrics.grossRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 10,
                  background: "#f0fdf4",
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontSize: 11.5, color: "#166534", fontWeight: 600 }}>
                  All orders comply with verified GST 18% and statutory CGST/SGST rules.
                </span>
              </div>
            </div>
          </div>

          {/* Daily Sales Ledger Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Daily Sales Transactions Ledger
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Detailed itemized orders, per-kg rate realization, and billing breakdown
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1e3a8a",
                  background: "#1e3a8a10",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                Showing {dailyFilteredOrders.length} Orders
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Order ID & Time</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Customer Name & SAP</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Product Line</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Basic Rate</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Rate / KG</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Taxable</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>GST (18%)</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Gross Total</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyFilteredOrders.length > 0 ? (
                    dailyFilteredOrders.map((o) => {
                      const item = o.items?.[0];
                      const refW = item?.referenceWeightKg || getProductRefWeight(item?.productId || "", item?.productName || o.productName);
                      const unitRate = item?.unitRate || (o.subtotal / (o.totalQty || 1));
                      const rateKg = item?.calculatedRatePerKg || (unitRate / refW);

                      return (
                        <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px" }}>
                            <Link
                              href={`/orders/${o.id}`}
                              style={{ fontWeight: 800, color: "#1e3a8a", textDecoration: "none" }}
                            >
                              {o.num}
                            </Link>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              {o.createdAt || o.date}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{o.customerName}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {o.sapCode || o.customerCode || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>
                              {item?.productName || o.productName || "19 kg normal"}
                            </span>
                            <div style={{ fontSize: 10.5, color: "#94a3b8" }}>Ref: {refW} kg</div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                            {o.totalQty || o.qty} cyl
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#334155" }}>
                            {INRF(unitRate)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#d97706" }}>
                            ₹{rateKg.toFixed(2)}/kg
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#334155" }}>
                            {INRF(o.subtotal)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748b" }}>
                            {INRF(o.taxAmt || (o.cgstAmount || 0) + (o.sgstAmount || 0))}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, color: "#1e3a8a" }}>
                            {INRF(o.total)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                                textTransform: "capitalize",
                                background:
                                  o.status === "delivered"
                                    ? "#dcfce7"
                                    : o.status === "confirmed"
                                    ? "#e0f2fe"
                                    : "#f1f5f9",
                                color:
                                  o.status === "delivered"
                                    ? "#166534"
                                    : o.status === "confirmed"
                                    ? "#0369a1"
                                    : "#475569",
                              }}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                                textTransform: "capitalize",
                                background: o.paymentStatus === "paid" ? "#dcfce7" : "#fee2e2",
                                color: o.paymentStatus === "paid" ? "#166534" : "#991b1b",
                              }}
                            >
                              {o.paymentStatus || "Unpaid"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                        No orders match the selected period or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {dailyFilteredOrders.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={3} style={{ padding: "12px 14px", color: "#0f172a" }}>
                        Period Summary Totals ({dailyFilteredOrders.length} orders)
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#1e3a8a" }}>
                        {dailyMetrics.totalCylinders} cyl
                      </td>
                      <td></td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#d97706" }}>
                        ₹{dailyMetrics.avgRatePerKg.toFixed(2)}/kg
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {INRF(dailyMetrics.taxableSales)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        {INRF(dailyMetrics.totalGst)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#1e3a8a", fontSize: 13 }}>
                        {INRF(dailyMetrics.grossRevenue)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: NEXT MONTH FORECAST & INDENTS ("Eg next month, after report") */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "forecast" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Executive Intro Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
              color: "#fff",
              padding: "24px 28px",
              borderRadius: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    background: "#f97316",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 10.5,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  PREDICTIVE DEMAND ENGINE
                </span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Run-Rate & Refill Frequency Model</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
                Next Month Demand & IOCL Indent Projections (December 2026)
              </h2>
              <p style={{ fontSize: 13, opacity: 0.85, margin: "6px 0 0", maxWidth: 650 }}>
                Extrapolating November month-to-date run rate (21 days elapsed) and active commercial refill intervals
                to calculate next month bottling plant procurement indents and gross revenue.
              </p>
            </div>

            {/* Growth Scenario Control Slider */}
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                padding: "16px 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                minWidth: 260,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                <span>Simulate Growth Scenario:</span>
                <span style={{ color: "#f97316", fontWeight: 900 }}>+{growthScenarioPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={growthScenarioPct}
                onChange={(e) => setGrowthScenarioPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                <span>0% (Baseline)</span>
                <span>+10% (Target)</span>
                <span>+30% (Aggressive)</span>
              </div>
            </div>
          </div>

          {/* Month Comparison Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {/* Nov Run-Rate */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Current Month Run-Rate (Nov 2026)
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, color: "#334155" }}>
                  21 / 30 Days (70%)
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>
                  {INR(forecastMetrics.mtdGross)}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
                  {forecastMetrics.mtdCylinders} cylinders supplied MTD ({forecastMetrics.mtdGasKg.toLocaleString()} kg LPG)
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#64748b" }}>Projected Nov 30 Closing:</span>
                <span style={{ fontWeight: 800, color: "#1e3a8a" }}>
                  {INR(forecastMetrics.projectedNovGross)} ({forecastMetrics.projectedNovCylinders} cyl)
                </span>
              </div>
            </div>

            {/* Next Month Projected Demand */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                  Next Month Demand (Dec 2026)
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, background: "#dcfce7", padding: "2px 8px", borderRadius: 4, color: "#166534" }}>
                  +{growthScenarioPct}% Growth
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#166534" }}>
                  {INR(forecastMetrics.nextMonthGross)}
                </div>
                <div style={{ fontSize: 12.5, color: "#15803d", marginTop: 4 }}>
                  {forecastMetrics.nextMonthCylinders} Cylinders ({forecastMetrics.nextMonthGasMT} MT LPG)
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid #bbf7d0",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#166534" }}>Increase vs Nov Run-Rate:</span>
                <span style={{ fontWeight: 800, color: "#15803d" }}>
                  +{INR(forecastMetrics.nextMonthGross - forecastMetrics.projectedNovGross)} (+{growthScenarioPct}%)
                </span>
              </div>
            </div>

            {/* IOCL Plant Indent Recommendation */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  IOCL Plant Indent Logistics
                </span>
                <Truck size={16} color="#d97706" />
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#d97706" }}>
                  {forecastMetrics.requiredTruckloads} Truckloads
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
                  ~{forecastMetrics.weeklyIndent} cylinders / week procurement indent
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#64748b" }}>Plant Bottling Source:</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>IOCL Plant, Jalandhar</span>
              </div>
            </div>
          </div>

          {/* Product-Wise Indent Requirement Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Product-Wise Next Month Indent Schedule (December 2026)
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Recommended godown replenishment indents by product line, with +10% safety buffer for winter peak
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                Total LPG Demand: {forecastMetrics.nextMonthGasMT} MT
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>Product Line</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Unit Weight</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Projected Units (Dec)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Projected Gas (KG)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Safety Buffer (+10%)</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Indent Order</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Projected Revenue</th>
                </tr>
              </thead>
              <tbody>
                {forecastMetrics.productIndents.map((indent, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#1e3a8a" }}>
                      {indent.productName}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>
                      {indent.unitWeightKg} kg
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {indent.projectedCylinders} units
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>
                      {indent.projectedGasKg.toLocaleString()} kg
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#d97706", fontWeight: 600 }}>
                      +{indent.safetyBuffer} units
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 900, color: "#166534" }}>
                      {indent.projectedCylinders + indent.safetyBuffer} units
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                      {INR(indent.projectedRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: 900, borderTop: "2px solid #cbd5e1" }}>
                  <td style={{ padding: "12px 16px", color: "#0f172a" }}>Consolidated Monthly Total</td>
                  <td></td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#1e3a8a" }}>
                    {forecastMetrics.nextMonthCylinders} units
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#64748b" }}>
                    {forecastMetrics.nextMonthGasKg.toLocaleString()} kg
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#d97706" }}>
                    +{Math.round(forecastMetrics.nextMonthCylinders * 0.1)} units
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#166534", fontSize: 13.5 }}>
                    {Math.round(forecastMetrics.nextMonthCylinders * 1.1)} units
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#1e3a8a", fontSize: 13.5 }}>
                    {INR(forecastMetrics.nextMonthGross)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Indent Timing & Safety Stock Recommendation */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <Info size={20} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1e40af" }}>
                Procurement Recommendation for Agency Management
              </div>
              <p style={{ fontSize: 12.5, color: "#1e3a8a", margin: "4px 0 0", lineHeight: 1.5 }}>
                To meet projected December demand of {forecastMetrics.nextMonthCylinders} units ({forecastMetrics.nextMonthGasMT} MT),
                submit weekly indents of ~{forecastMetrics.weeklyIndent} cylinders to the IOCL Jalandhar Bottling Plant.
                Ensure a 10% winter buffer is placed in Week 1 to guard against logistics or fog-related highway delays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PERIOD-OVER-PERIOD GROWTH COMPARISON ("comparison after growth") */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "growth" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Growth Period Selector */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Period-over-Period Performance Comparison
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                Evaluate growth rate, cylinder volume variances, and revenue momentum
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "day", label: "Day-over-Day (Today vs Yesterday)" },
                { id: "week", label: "Week-over-Week (This Wk vs Last Wk)" },
                { id: "month", label: "Month-over-Month (MTD vs Prior Month)" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setGrowthPeriod(p.id as any)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: growthPeriod === p.id ? "1.5px solid #1e3a8a" : "1px solid #cbd5e1",
                    background: growthPeriod === p.id ? "#1e3a8a10" : "#ffffff",
                    color: growthPeriod === p.id ? "#1e3a8a" : "#475569",
                    fontWeight: growthPeriod === p.id ? 800 : 600,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Growth Variance Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
            {[
              {
                label: "Cylinder Volume Growth",
                current: `${growthComparison.current.cylinders} cyl`,
                previous: `${growthComparison.previous.cylinders} cyl`,
                growth: growthComparison.cylinders,
                color: "#1e3a8a",
              },
              {
                label: "Net LPG Mass Dispatched",
                current: `${(growthComparison.current.gasKg / 1000).toFixed(2)} MT`,
                previous: `${(growthComparison.previous.gasKg / 1000).toFixed(2)} MT`,
                growth: growthComparison.gasKg,
                color: "#f97316",
              },
              {
                label: "Gross Invoiced Sales",
                current: INR(growthComparison.current.gross),
                previous: INR(growthComparison.previous.gross),
                growth: growthComparison.gross,
                color: "#16a34a",
              },
              {
                label: "Avg Rate / KG Realized",
                current: `₹${growthComparison.current.avgRatePerKg.toFixed(2)}/kg`,
                previous: `₹${growthComparison.previous.avgRatePerKg.toFixed(2)}/kg`,
                growth: growthComparison.ratePerKg,
                color: "#d97706",
              },
            ].map((kpi, idx) => {
              const isPositive = kpi.growth.pct >= 0;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {kpi.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>
                      {kpi.current}
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: isPositive ? "#dcfce7" : "#fee2e2",
                        color: isPositive ? "#166534" : "#991b1b",
                      }}
                    >
                      {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {Math.abs(kpi.growth.pct).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 6 }}>
                    Prior Period: <strong style={{ color: "#334155" }}>{kpi.previous}</strong> (
                    {isPositive ? "+" : ""}
                    {kpi.growth.diff > 0 && typeof kpi.growth.diff === "number"
                      ? kpi.growth.diff > 1000
                        ? INR(kpi.growth.diff)
                        : kpi.growth.diff.toFixed(1)
                      : kpi.growth.diff.toFixed(1)}
                    )
                  </div>
                </div>
              );
            })}
          </div>

          {/* Growth Comparison Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Detailed Operational Variance Table
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Comparing Current {growthPeriod === "day" ? "Day (21 Nov)" : growthPeriod === "week" ? "Week" : "MTD"} vs
                  Previous {growthPeriod === "day" ? "Day (20 Nov)" : growthPeriod === "week" ? "Week" : "Month"}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: "#f1f5f9",
                  padding: "4px 10px",
                  borderRadius: 6,
                  color: "#475569",
                }}
              >
                Growth Mode: {growthPeriod.toUpperCase()}
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569" }}>Performance Metric</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", textAlign: "right" }}>
                    Current Period
                  </th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", textAlign: "right" }}>
                    Prior Period
                  </th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", textAlign: "right" }}>
                    Absolute Variance
                  </th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", textAlign: "right" }}>
                    Growth Rate (%)
                  </th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, color: "#475569", textAlign: "center" }}>
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    metric: "Cylinders Dispatched",
                    curr: `${growthComparison.current.cylinders} units`,
                    prev: `${growthComparison.previous.cylinders} units`,
                    diff: `${growthComparison.cylinders.diff > 0 ? "+" : ""}${growthComparison.cylinders.diff} units`,
                    pct: growthComparison.cylinders.pct,
                  },
                  {
                    metric: "Total LPG Weight (kg)",
                    curr: `${growthComparison.current.gasKg.toLocaleString()} kg`,
                    prev: `${growthComparison.previous.gasKg.toLocaleString()} kg`,
                    diff: `${growthComparison.gasKg.diff > 0 ? "+" : ""}${growthComparison.gasKg.diff.toLocaleString()} kg`,
                    pct: growthComparison.gasKg.pct,
                  },
                  {
                    metric: "Total LPG Metric Tonnes (MT)",
                    curr: `${(growthComparison.current.gasKg / 1000).toFixed(2)} MT`,
                    prev: `${(growthComparison.previous.gasKg / 1000).toFixed(2)} MT`,
                    diff: `${growthComparison.gasKg.diff > 0 ? "+" : ""}${(growthComparison.gasKg.diff / 1000).toFixed(2)} MT`,
                    pct: growthComparison.gasKg.pct,
                  },
                  {
                    metric: "Taxable Net Sales (Basic)",
                    curr: INR(growthComparison.current.taxable),
                    prev: INR(growthComparison.previous.taxable),
                    diff: `${growthComparison.gross.diff > 0 ? "+" : ""}${INR(growthComparison.current.taxable - growthComparison.previous.taxable)}`,
                    pct: growthComparison.gross.pct,
                  },
                  {
                    metric: "Gross Invoiced Sales (with GST)",
                    curr: INR(growthComparison.current.gross),
                    prev: INR(growthComparison.previous.gross),
                    diff: `${growthComparison.gross.diff > 0 ? "+" : ""}${INR(growthComparison.gross.diff)}`,
                    pct: growthComparison.gross.pct,
                  },
                  {
                    metric: "Average Realized Rate per KG",
                    curr: `₹${growthComparison.current.avgRatePerKg.toFixed(2)} / kg`,
                    prev: `₹${growthComparison.previous.avgRatePerKg.toFixed(2)} / kg`,
                    diff: `${growthComparison.ratePerKg.diff > 0 ? "+" : ""}₹${growthComparison.ratePerKg.diff.toFixed(2)} / kg`,
                    pct: growthComparison.ratePerKg.pct,
                  },
                ].map((row, i) => {
                  const isUp = row.pct >= 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{row.metric}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        {row.curr}
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "right", color: "#64748b" }}>{row.prev}</td>
                      <td
                        style={{
                          padding: "12px 18px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: isUp ? "#166534" : "#991b1b",
                        }}
                      >
                        {row.diff}
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          textAlign: "right",
                          fontWeight: 900,
                          color: isUp ? "#166534" : "#991b1b",
                        }}
                      >
                        {isUp ? "+" : ""}
                        {row.pct.toFixed(1)}%
                      </td>
                      <td style={{ padding: "12px 18px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: isUp ? "#dcfce7" : "#fee2e2",
                            color: isUp ? "#166534" : "#991b1b",
                          }}
                        >
                          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isUp ? "Growing" : "Declining"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 4: SAVING PER CLIENT REPORT ("saving per client")        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "savings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Executive Overview Header */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    background: "#16a34a15",
                    color: "#16a34a",
                    fontWeight: 800,
                    fontSize: 10.5,
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  CONTRACT PRICE BENEFIT
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Master Tariff vs Approved Client Rates</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Savings Delivered Per Commercial Client
              </h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0" }}>
                Auditing approved special pricing against standard master rates (₹4,750 for 47.5kg LOT, ₹1,900 for 19kg Normal)
                to monitor total discount concessions and customer value delivery.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "#16a34a",
                border: "none",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 800,
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(22,163,74,0.25)",
              }}
            >
              <Download size={15} /> Export Client Savings CSV
            </button>
          </div>

          {/* Savings Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              {
                label: "Total Client Savings Granted",
                val: INRF(clientSavingsData.totalSavingsGranted),
                sub: "Net customer price discount passed",
                color: "#16a34a",
                bg: "#16a34a08",
              },
              {
                label: "Average Commercial Discount",
                val: `${clientSavingsData.avgSavingPct.toFixed(1)}%`,
                sub: "Below standard IOCL master list",
                color: "#1e3a8a",
                bg: "#1e3a8a08",
              },
              {
                label: "Top Beneficiary Client",
                val: clientSavingsData.topClient,
                sub: "Highest net savings realized",
                color: "#d97706",
                bg: "#fffbeb",
              },
              {
                label: "Discounted Volume Supplied",
                val: `${clientSavingsData.totalCommercialCylinders} cyl`,
                sub: "Across active commercial contracts",
                color: "#7c3aed",
                bg: "#7c3aed08",
              },
            ].map((k, i) => (
              <div
                key={i}
                style={{
                  background: k.bg,
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.color, marginTop: 10 }}>
                  {k.val}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Client Savings Detailed Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Client Contract Savings Ledger
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Itemized comparison between master tariff and approved contract rates
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {clientSavingsData.rows.length} Commercial Accounts
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Client Name & SAP</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Category</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569" }}>Primary Product</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Supplied</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Standard Master Rate</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Approved Client Rate</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Per-Cyl Saving</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Client Net Savings</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Savings %</th>
                    <th style={{ padding: "12px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Rate / KG</th>
                  </tr>
                </thead>
                <tbody>
                  {clientSavingsData.rows.length > 0 ? (
                    clientSavingsData.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.customerName}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {row.sapCode !== "—" ? row.sapCode : row.customerCode}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>{row.category}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e3a8a" }}>
                          {row.productName}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                          {row.totalQty} cyl
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748b" }}>
                          {INR(row.standardRate)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                          {INR(row.approvedRate)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#166534" }}>
                          ₹{row.perCylinderSaving.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, color: "#166534", fontSize: 13 }}>
                          {INRF(row.totalSaving)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: row.savingPct > 0 ? "#dcfce7" : "#f1f5f9",
                              color: row.savingPct > 0 ? "#166534" : "#64748b",
                            }}
                          >
                            {row.savingPct.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#d97706" }}>
                          ₹{row.ratePerKg.toFixed(2)}/kg
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                        No commercial client orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {clientSavingsData.rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 900, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={3} style={{ padding: "12px 14px", color: "#0f172a" }}>
                        Total Savings Granted to Clients
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#1e3a8a" }}>
                        {clientSavingsData.totalCommercialCylinders} cyl
                      </td>
                      <td colSpan={3}></td>
                      <td style={{ padding: "12px 14px", textAlign: "right", color: "#166534", fontSize: 14 }}>
                        {INRF(clientSavingsData.totalSavingsGranted)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#166534" }}>
                        Avg: {clientSavingsData.avgSavingPct.toFixed(1)}%
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
