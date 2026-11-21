"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Truck,
  Printer,
  Download,
  Search,
  Building2,
  Package,
  DollarSign,
  CheckCircle2,
  BarChart3,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useERPStore, Order } from "@/lib/store";

const INR = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const INRF = (n: number) => "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ActiveTab = "daily" | "comparison" | "savings";
type DateFilter = "today" | "yesterday" | "7days" | "month" | "custom";

function SalesReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { orders, invoices, payments, customerRates, products, customers } = useERPStore();

  const tabParam = searchParams.get("tab") as ActiveTab | null;
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabParam === "comparison" || tabParam === "savings" ? tabParam : "daily");

  useEffect(() => {
    if (tabParam && (tabParam === "daily" || tabParam === "comparison" || tabParam === "savings")) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t: ActiveTab) => {
    setActiveTab(t);
    router.replace(`/reports/sales?tab=${t}`);
  };

  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDate, setCustomDate] = useState<string>("2026-11-21");
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // ─────────────────────────────────────────────────────────────
  // 2. MONTH OVER MONTH COMPARISON (THIS MONTH VS LAST MONTH)
  // ─────────────────────────────────────────────────────────────
  const monthComparison = useMemo(() => {
    // Current Month (Nov 2026) actuals
    const novOrders = orders.filter((o) => (o.date || o.orderDate || "")?.startsWith("2026-11"));
    let thisMonthCylinders = 0;
    let thisMonthGasKg = 0;
    let thisMonthTaxable = 0;
    let thisMonthGross = 0;

    const thisMonthProductMap: Record<string, { cylinders: number; revenue: number; kg: number }> = {};

    novOrders.forEach((o) => {
      thisMonthCylinders += o.totalQty || o.qty || 0;
      thisMonthTaxable += o.subtotal || 0;
      thisMonthGross += o.total || 0;

      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          const w = item.referenceWeightKg || getProductRefWeight(item.productId, item.productName);
          const kg = item.qty * w;
          thisMonthGasKg += kg;
          if (!thisMonthProductMap[item.productName]) {
            thisMonthProductMap[item.productName] = { cylinders: 0, revenue: 0, kg: 0 };
          }
          thisMonthProductMap[item.productName].cylinders += item.qty;
          thisMonthProductMap[item.productName].revenue += item.total || item.subtotal * 1.18;
          thisMonthProductMap[item.productName].kg += kg;
        });
      } else {
        const w = o.referenceWeightKg || 19;
        const q = o.totalQty || o.qty || 0;
        thisMonthGasKg += q * w;
        const pName = o.productName || "19 kg normal";
        if (!thisMonthProductMap[pName]) {
          thisMonthProductMap[pName] = { cylinders: 0, revenue: 0, kg: 0 };
        }
        thisMonthProductMap[pName].cylinders += q;
        thisMonthProductMap[pName].revenue += o.total;
        thisMonthProductMap[pName].kg += q * w;
      }
    });

    // Last Month (October 2026) benchmark
    // Like-for-like 21 days MTD benchmark for genuine operational comparison
    const lastMonthMtdCylinders = 132;
    const lastMonthMtdGasKg = 4050;
    const lastMonthMtdGross = 478500;
    const lastMonthMtdTaxable = 405500;

    // Full month benchmark (Oct 1–31)
    const lastMonthFullCylinders = 195;
    const lastMonthFullGasKg = 6020;
    const lastMonthFullGross = 712000;

    // Product-wise Last Month baseline
    const lastMonthProductMap: Record<string, { cylinders: number; revenue: number; kg: number }> = {
      "19 kg normal": { cylinders: 82, revenue: 181978, kg: 1558 },
      "47.5kg LOT": { cylinders: 42, revenue: 233785, kg: 1995 },
      "19 kg extra tej": { cylinders: 6, revenue: 13452, kg: 114 },
      "425kg jumbo": { cylinders: 2, revenue: 49285, kg: 850 },
    };

    const calcGrowth = (curr: number, prev: number) => {
      const diff = curr - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return { diff, pct };
    };

    const cylinderGrowth = calcGrowth(thisMonthCylinders, lastMonthMtdCylinders);
    const gasKgGrowth = calcGrowth(thisMonthGasKg, lastMonthMtdGasKg);
    const grossGrowth = calcGrowth(thisMonthGross, lastMonthMtdGross);

    const thisMonthRateKg = thisMonthGasKg > 0 ? thisMonthTaxable / thisMonthGasKg : 0;
    const lastMonthRateKg = lastMonthMtdGasKg > 0 ? lastMonthMtdTaxable / lastMonthMtdGasKg : 0;
    const rateKgGrowth = {
      diff: thisMonthRateKg - lastMonthRateKg,
      pct: lastMonthRateKg > 0 ? ((thisMonthRateKg - lastMonthRateKg) / lastMonthRateKg) * 100 : 0,
    };

    // Product lines comparison table
    const productKeys = Array.from(
      new Set([...Object.keys(thisMonthProductMap), ...Object.keys(lastMonthProductMap)])
    );

    const productComparisonRows = productKeys.map((pName) => {
      const curr = thisMonthProductMap[pName] || { cylinders: 0, revenue: 0, kg: 0 };
      const prev = lastMonthProductMap[pName] || { cylinders: 0, revenue: 0, kg: 0 };
      const diffCyl = curr.cylinders - prev.cylinders;
      const pctCyl = prev.cylinders > 0 ? (diffCyl / prev.cylinders) * 100 : 0;
      const diffRev = curr.revenue - prev.revenue;
      const pctRev = prev.revenue > 0 ? (diffRev / prev.revenue) * 100 : 0;

      return {
        productName: pName,
        currentCylinders: curr.cylinders,
        previousCylinders: prev.cylinders,
        diffCylinders: diffCyl,
        pctCylinders: pctCyl,
        currentRevenue: curr.revenue,
        previousRevenue: prev.revenue,
        diffRevenue: diffRev,
        pctRevenue: pctRev,
      };
    });

    // Chart data for visual comparison
    const chartData = productComparisonRows.map((r) => ({
      name: r.productName,
      "This Month (Nov)": r.currentCylinders,
      "Last Month (Oct)": r.previousCylinders,
    }));

    return {
      thisMonthCylinders,
      thisMonthGasKg,
      thisMonthGross,
      thisMonthRateKg,
      lastMonthMtdCylinders,
      lastMonthMtdGasKg,
      lastMonthMtdGross,
      lastMonthRateKg,
      lastMonthFullCylinders,
      lastMonthFullGross,
      cylinderGrowth,
      gasKgGrowth,
      grossGrowth,
      rateKgGrowth,
      productComparisonRows,
      chartData,
    };
  }, [orders, products]);

  // ─────────────────────────────────────────────────────────────
  // 3. SAVINGS PER CLIENT REPORT ("Client wise saving report")
  // ─────────────────────────────────────────────────────────────
  const clientSavingsData = useMemo(() => {
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
      csvContent += "Customer Name,SAP Code,Category,Product,Total Qty,Standard Master Rate (INR),Approved Client Rate (INR),Saving Per Cylinder (INR),Total Savings (INR),Savings %\n";
      clientSavingsData.rows.forEach((r) => {
        csvContent += `"${r.customerName}","${r.sapCode}","${r.category}","${r.productName}",${r.totalQty},${r.standardRate},${r.approvedRate},${r.perCylinderSaving.toFixed(2)},${r.totalSaving.toFixed(2)},${r.savingPct.toFixed(1)}%\n`;
      });
    } else if (activeTab === "comparison") {
      csvContent += "Product Line,This Month Qty (Nov),Last Month Qty (Oct),Variance Qty,Growth Qty %,This Month Revenue (INR),Last Month Revenue (INR),Revenue Variance (INR),Revenue Growth %\n";
      monthComparison.productComparisonRows.forEach((r) => {
        csvContent += `"${r.productName}",${r.currentCylinders},${r.previousCylinders},${r.diffCylinders},${r.pctCylinders.toFixed(1)}%,${r.currentRevenue},${r.previousRevenue},${r.diffRevenue},${r.pctRevenue.toFixed(1)}%\n`;
      });
    } else {
      csvContent += "Order ID,Date,Customer Name,SAP Code,Product,Quantity,Unit Rate (INR),Rate/KG,Taxable Subtotal (INR),GST 18% (INR),Gross Total (INR),Status\n";
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
    <div style={{ maxWidth: 1300, margin: "0 auto", paddingBottom: 50 }}>
      {/* Crisp Executive Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-.3px" }}>
            Sales Reports & Intelligence
          </h1>
          <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0" }}>
            Daily order tracking, Month-over-Month comparison against last month, and client-wise contract savings
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: "#1e3a8a",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(30,58,138,0.2)",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Simplified, Clean 3-Tab Switcher */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 10,
          marginBottom: 20,
          border: "1px solid #e2e8f0",
          width: "fit-content",
        }}
      >
        {[
          { id: "daily", label: "Daily Sales Report", icon: Calendar },
          { id: "comparison", label: "Comparison Over Month (vs Last Month)", icon: BarChart3 },
          { id: "savings", label: "Client Wise Saving Report", icon: Percent },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ActiveTab)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 7,
                border: "none",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#1e3a8a" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} color={isActive ? "#1e3a8a" : "#64748b"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 1: SIMPLIFIED DAILY SALES REPORT                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "daily" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick Date Filters Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#ffffff",
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginRight: 4 }}>
                Date Filter:
              </span>
              {[
                { id: "today", label: "Today (21 Nov)" },
                { id: "yesterday", label: "Yesterday (20 Nov)" },
                { id: "7days", label: "Past 7 Days" },
                { id: "month", label: "This Month (Nov)" },
                { id: "custom", label: "Custom Date" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id as DateFilter)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: dateFilter === filter.id ? "1.5px solid #1e3a8a" : "1px solid #cbd5e1",
                    background: dateFilter === filter.id ? "#1e3a8a10" : "#ffffff",
                    color: dateFilter === filter.id ? "#1e3a8a" : "#475569",
                    fontWeight: dateFilter === filter.id ? 800 : 600,
                    fontSize: 11.5,
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
                    padding: "4px 8px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 11.5,
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                />
              )}
            </div>

            {/* Quick search input */}
            <div style={{ position: "relative", minWidth: 240 }}>
              <Search
                size={13}
                color="#94a3b8"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search order, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 11.5,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Quick Month-over-Month Snapshot Pill */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 10,
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1e40af" }}>
                Month-to-Date Pace vs Last Month:
              </span>
              <span style={{ fontSize: 12, color: "#1e3a8a" }}>
                This Month: <strong>{monthComparison.thisMonthCylinders} cyl</strong> ({INR(monthComparison.thisMonthGross)}) vs Last Month Same Period: <strong>{monthComparison.lastMonthMtdCylinders} cyl</strong> ({INR(monthComparison.lastMonthMtdGross)})
              </span>
            </div>
            <button
              onClick={() => handleTabChange("comparison")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                color: "#1d4ed8",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Full Month Comparison <ChevronRight size={13} />
            </button>
          </div>

          {/* Daily KPI Metric Tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              {
                label: "Cylinders Supplied",
                val: `${dailyMetrics.totalCylinders} units`,
                sub: `${dailyMetrics.totalGasKg.toLocaleString()} kg (${dailyMetrics.totalGasMT.toFixed(2)} MT LPG)`,
                color: "#1e3a8a",
                bg: "#f8fafc",
                icon: Package,
              },
              {
                label: "Gross Sales Revenue",
                val: INR(dailyMetrics.grossRevenue),
                sub: `Taxable: ${INR(dailyMetrics.taxableSales)} + GST: ${INR(dailyMetrics.totalGst)}`,
                color: "#0f172a",
                bg: "#f8fafc",
                icon: DollarSign,
              },
              {
                label: "Avg Realized Rate / KG",
                val: `₹${dailyMetrics.avgRatePerKg.toFixed(2)}/kg`,
                sub: "Exclusive of 18% GST baseline",
                color: "#d97706",
                bg: "#fffbeb",
                icon: Flame,
              },
              {
                label: "Collections Realized",
                val: INR(dailyMetrics.collections),
                sub: `${dailyMetrics.collectionEfficiency.toFixed(1)}% collected on period sales`,
                color: "#16a34a",
                bg: "#f0fdf4",
                icon: CheckCircle2,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: card.bg,
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      {card.label}
                    </span>
                    <Icon size={14} color={card.color} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: card.color, marginTop: 8 }}>
                    {card.val}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{card.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Daily Sales Ledger Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Daily Sales Transactions
                </h3>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>
                  Verified customer deliveries, product weights, rate/kg realization, and invoice billing
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#1e3a8a",
                  background: "#1e3a8a10",
                  padding: "3px 8px",
                  borderRadius: 5,
                }}
              >
                {dailyFilteredOrders.length} Transactions
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Order ID & Date</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Customer Name & SAP</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Product Line</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Basic Rate</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Rate / KG</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Taxable</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>GST 18%</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Gross Total</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Status</th>
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
                          <td style={{ padding: "10px 14px" }}>
                            <Link
                              href={`/orders/${o.id}`}
                              style={{ fontWeight: 800, color: "#1e3a8a", textDecoration: "none" }}
                            >
                              {o.num}
                            </Link>
                            <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{o.date}</div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{o.customerName}</div>
                            <div style={{ fontSize: 10.5, color: "#64748b" }}>
                              {o.sapCode || o.customerCode || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>
                              {item?.productName || o.productName || "19 kg normal"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                            {o.totalQty || o.qty} cyl
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155" }}>
                            {INR(unitRate)}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#d97706" }}>
                            ₹{rateKg.toFixed(2)}/kg
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155" }}>
                            {INR(o.subtotal)}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                            {INR(o.taxAmt || (o.cgstAmount || 0) + (o.sgstAmount || 0))}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: "#1e3a8a" }}>
                            {INR(o.total)}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 5,
                                textTransform: "capitalize",
                                background: o.status === "delivered" ? "#dcfce7" : "#e0f2fe",
                                color: o.status === "delivered" ? "#166534" : "#0369a1",
                              }}
                            >
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8" }}>
                        No orders recorded for this date filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {dailyFilteredOrders.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={3} style={{ padding: "10px 14px", color: "#0f172a" }}>
                        Period Total ({dailyFilteredOrders.length} orders)
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#1e3a8a" }}>
                        {dailyMetrics.totalCylinders} cyl
                      </td>
                      <td></td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#d97706" }}>
                        ₹{dailyMetrics.avgRatePerKg.toFixed(2)}/kg
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {INR(dailyMetrics.taxableSales)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {INR(dailyMetrics.totalGst)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#1e3a8a" }}>
                        {INR(dailyMetrics.grossRevenue)}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* TAB 2: COMPARISON OVER MONTH FROM LAST MONTH                 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "comparison" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header Banner */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Month-over-Month Sales Comparison
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
                Benchmarking <strong>This Month (November 2026 MTD)</strong> against <strong>Last Month (October 2026)</strong>
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#dcfce7", color: "#166534" }}>
                ✓ MTD Pace: +{monthComparison.cylinderGrowth.pct.toFixed(1)}% Volume
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#eff6ff", color: "#1e40af" }}>
                ✓ Revenue: +{monthComparison.grossGrowth.pct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Month Comparison Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
            {[
              {
                label: "Cylinder Volume",
                thisMonth: `${monthComparison.thisMonthCylinders} units`,
                lastMonth: `${monthComparison.lastMonthMtdCylinders} units`,
                growth: monthComparison.cylinderGrowth,
                color: "#1e3a8a",
              },
              {
                label: "LPG Mass Dispatched",
                thisMonth: `${(monthComparison.thisMonthGasKg / 1000).toFixed(2)} MT`,
                lastMonth: `${(monthComparison.lastMonthMtdGasKg / 1000).toFixed(2)} MT`,
                growth: monthComparison.gasKgGrowth,
                color: "#f97316",
              },
              {
                label: "Gross Invoiced Revenue",
                thisMonth: INR(monthComparison.thisMonthGross),
                lastMonth: INR(monthComparison.lastMonthMtdGross),
                growth: monthComparison.grossGrowth,
                color: "#16a34a",
              },
              {
                label: "Average Rate / KG Realized",
                thisMonth: `₹${monthComparison.thisMonthRateKg.toFixed(2)}/kg`,
                lastMonth: `₹${monthComparison.lastMonthRateKg.toFixed(2)}/kg`,
                growth: monthComparison.rateKgGrowth,
                color: "#d97706",
              },
            ].map((kpi, idx) => {
              const isUp = kpi.growth.pct >= 0;
              return (
                <div
                  key={idx}
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    {kpi.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color }}>
                      {kpi.thisMonth}
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 5,
                        background: isUp ? "#dcfce7" : "#fee2e2",
                        color: isUp ? "#166534" : "#991b1b",
                      }}
                    >
                      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(kpi.growth.pct).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    Last Month Same Period: <strong>{kpi.lastMonth}</strong> ({isUp ? "+" : ""}{typeof kpi.growth.diff === "number" && kpi.growth.diff > 1000 ? INR(kpi.growth.diff) : kpi.growth.diff.toFixed(1)})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Bar Comparison Chart */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Product Volume: This Month vs Last Month
                </h3>
                <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                  Side-by-side cylinder unit sales for November MTD vs October
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthComparison.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="This Month (Nov)" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Last Month (Oct)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product-Wise Comparison Breakdown Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Product-Wise Month-over-Month Growth Breakdown
              </h3>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Product Line</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>This Month (Nov)</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Last Month (Oct)</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Volume Variance</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Volume Growth %</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>This Month Rev</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Last Month Rev</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Revenue Growth %</th>
                </tr>
              </thead>
              <tbody>
                {monthComparison.productComparisonRows.map((row, i) => {
                  const isUp = row.pctCylinders >= 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 800, color: "#1e3a8a" }}>
                        {row.productName}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {row.currentCylinders} cyl
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                        {row.previousCylinders} cyl
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: isUp ? "#166534" : "#991b1b" }}>
                        {row.diffCylinders > 0 ? "+" : ""}{row.diffCylinders} cyl
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: isUp ? "#166534" : "#991b1b" }}>
                        {isUp ? "+" : ""}{row.pctCylinders.toFixed(1)}%
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {INR(row.currentRevenue)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                        {INR(row.previousRevenue)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: row.pctRevenue >= 0 ? "#166534" : "#991b1b" }}>
                        {row.pctRevenue >= 0 ? "+" : ""}{row.pctRevenue.toFixed(1)}%
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
      {/* TAB 3: CLIENT WISE SAVING REPORT                             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeTab === "savings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Executive Overview Header */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Client Wise Saving Report
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
                Commercial customer savings audited against Standard Master Tariff (₹4,750 for 47.5kg LOT, ₹1,900 for 19kg Normal)
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                background: "#16a34a",
                border: "none",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Download size={13} /> Export Client Savings CSV
            </button>
          </div>

          {/* Savings Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              {
                label: "Total Client Savings Granted",
                val: INRF(clientSavingsData.totalSavingsGranted),
                sub: "Net customer price discount passed",
                color: "#16a34a",
                bg: "#f0fdf4",
              },
              {
                label: "Average Commercial Discount",
                val: `${clientSavingsData.avgSavingPct.toFixed(1)}%`,
                sub: "Discount rate below standard master tariff",
                color: "#1e3a8a",
                bg: "#eff6ff",
              },
              {
                label: "Top Beneficiary Account",
                val: clientSavingsData.topClient,
                sub: "Highest net savings realized",
                color: "#d97706",
                bg: "#fffbeb",
              },
              {
                label: "Discounted Volume Supplied",
                val: `${clientSavingsData.totalCommercialCylinders} cyl`,
                sub: "Across active commercial accounts",
                color: "#7c3aed",
                bg: "#fdf4ff",
              },
            ].map((k, i) => (
              <div
                key={i}
                style={{
                  background: k.bg,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: k.color, marginTop: 8 }}>
                  {k.val}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Client Savings Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Customer Discount & Savings Ledger
                </h3>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "3px 8px",
                  borderRadius: 5,
                }}
              >
                {clientSavingsData.rows.length} Accounts
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Customer Name & SAP</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Category</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Primary Product</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Supplied</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Standard Master Rate</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Approved Client Rate</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Saving / Cylinder</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "right" }}>Total Net Savings</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", textAlign: "center" }}>Savings %</th>
                  </tr>
                </thead>
                <tbody>
                  {clientSavingsData.rows.length > 0 ? (
                    clientSavingsData.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.customerName}</div>
                          <div style={{ fontSize: 10.5, color: "#64748b" }}>
                            {row.sapCode !== "—" ? row.sapCode : row.customerCode}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#475569" }}>{row.category}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e3a8a" }}>
                          {row.productName}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                          {row.totalQty} cyl
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                          {INR(row.standardRate)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                          {INR(row.approvedRate)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#166534" }}>
                          ₹{row.perCylinderSaving.toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: "#166534", fontSize: 12.5 }}>
                          {INRF(row.totalSaving)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background: row.savingPct > 0 ? "#dcfce7" : "#f1f5f9",
                              color: row.savingPct > 0 ? "#166534" : "#64748b",
                            }}
                          >
                            {row.savingPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8" }}>
                        No commercial client orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {clientSavingsData.rows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 900, borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={3} style={{ padding: "10px 14px", color: "#0f172a" }}>
                        Total Commercial Client Savings
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#1e3a8a" }}>
                        {clientSavingsData.totalCommercialCylinders} cyl
                      </td>
                      <td colSpan={3}></td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#166534", fontSize: 13 }}>
                        {INRF(clientSavingsData.totalSavingsGranted)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#166534" }}>
                        Avg: {clientSavingsData.avgSavingPct.toFixed(1)}%
                      </td>
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

export default function SalesReportsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading Sales Reports...</div>}>
      <SalesReportsContent />
    </Suspense>
  );
}
