"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package, Truck, ArrowDownLeft, ArrowUpRight, RotateCcw,
  Sliders, History, Plus, CheckCircle2, AlertTriangle, ShieldCheck,
  Search, ShieldAlert, FileText, Check, Clock, X, ChevronRight, Layers, Flame,
  Calendar, BarChart2, Download, Scale
} from "lucide-react";
import { useERPStore, WarehouseStockItem, StockMovement, EXACT_SIX_ACTIVE_PRODUCTS, StockReconciliationRecord } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  ...s,
});

export default function InventoryPage() {
  const {
    warehouseStock,
    stockMovements,
    products,
    currentUserRole,
    currentSessionUser,
    recordStockReceipt,
    recordStockAdjustment,
    approveStockAdjustment,
    configureOpeningStock,
    getDailyStockRegister,
    getMonthlyStockRegister,
    stockReconciliations,
    recordStockReconciliation,
    approveStockReconciliation,
    inTransitShipments,
    createInTransitShipment,
    recordShipmentReceipt,
    getInTransitTotals,
  } = useERPStore();

  const isAdmin = currentUserRole === "admin";
  const activeProducts = products.filter(p => p.active);

  const [activeTab, setActiveTab] = useState<
    "overview" | "in_transit" | "receipts" | "issues" | "adjustments" | "returns" | "history" | "daily_register" | "monthly_register" | "reconciliation"
  >("overview");

  // Daily & Monthly Register Filters
  const [dailyMonth, setDailyMonth] = useState("2026-11");
  const [dailyProdId, setDailyProdId] = useState(activeProducts[0]?.id || "p1");

  const [monthlyYear, setMonthlyYear] = useState(2026);
  const [monthlyProdId, setMonthlyProdId] = useState(activeProducts[0]?.id || "p1");

  // Reconciliation modal state
  const [showReconModal, setShowReconModal] = useState(false);
  const [reconForm, setReconForm] = useState({
    productId: activeProducts[0]?.id || "p1",
    monthPeriod: "2026-11",
    isEmpty: false,
    physicalCount: "",
    reason: "Month-End Physical Stock Verification",
  });

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

  // Receipt form state
  const [receiptForm, setReceiptForm] = useState({
    productId: activeProducts[0]?.id || "",
    qty: "",
    refNum: "",
    supplierSource: "IOCL Bottling Plant, Jalandhar",
    warehouseLocation: "Main Godown (Ludhiana)",
    remarks: "",
  });

  // Adjustment form state
  const [adjForm, setAdjForm] = useState({
    productId: activeProducts[0]?.id || "",
    qty: "",
    isAddition: false,
    reason: "Damaged / Defective Valve",
  });

  // Opening stock form state
  const [openingForm, setOpeningForm] = useState({
    productId: activeProducts[0]?.id || "",
    filledOpening: "",
    emptyOpening: "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-Transit Shipments State (Client Change 2)
  const inTransitTotals = getInTransitTotals();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedShipmentForReceipt, setSelectedShipmentForReceipt] = useState<any>(null);
  const [receiveItemQtys, setReceiveItemQtys] = useState<Record<string, number>>({});
  const [receiveCondition, setReceiveCondition] = useState("Good - Sound Valves");
  const [receiveRemarks, setReceiveRemarks] = useState("");

  const [dispatchForm, setDispatchForm] = useState({
    supplierSource: "IOCL Bottling Plant, Jalandhar",
    warehouseDestination: "Main Godown, Ludhiana",
    dispatchDate: new Date().toISOString().split("T")[0],
    expectedArrivalDate: new Date().toISOString().split("T")[0],
    transporter: "Punjab Logistics Express",
    vehicleNumber: "PB-08-AX-9941",
    challanNumber: "",
    productId: activeProducts[0]?.id || "p-nrm-190",
    qtyDispatched: "100",
    remarks: "",
  });

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(dispatchForm.qtyDispatched);
    if (!qty || qty <= 0) {
      alert("Please enter a valid dispatch quantity.");
      return;
    }
    const newShp = createInTransitShipment({
      supplierSource: dispatchForm.supplierSource,
      warehouseDestination: dispatchForm.warehouseDestination,
      dispatchDate: dispatchForm.dispatchDate,
      expectedArrivalDate: dispatchForm.expectedArrivalDate,
      transporter: dispatchForm.transporter,
      vehicleNumber: dispatchForm.vehicleNumber,
      challanNumber: dispatchForm.challanNumber || `CH-${Date.now().toString().slice(-5)}`,
      remarks: dispatchForm.remarks,
      recordedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
      items: [{ productId: dispatchForm.productId, qtyDispatched: qty }],
    });
    setNotification({
      type: "success",
      text: `In-transit shipment ${newShp.shipmentNum} logged successfully (${qty} cylinders dispatched from ${dispatchForm.supplierSource} on ${dispatchForm.vehicleNumber}).`,
    });
    setShowDispatchModal(false);
  };

  const handleReceiveShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForReceipt) return;

    const receiptItems: { productId: string; productName: string; qtyReceived: number }[] = [];
    selectedShipmentForReceipt.items.forEach((item: any) => {
      const q = receiveItemQtys[item.productId] || 0;
      if (q > 0) {
        receiptItems.push({
          productId: item.productId,
          productName: item.productName,
          qtyReceived: q,
        });
      }
    });

    if (receiptItems.length === 0) {
      alert("Please enter at least 1 cylinder quantity received.");
      return;
    }

    recordShipmentReceipt(selectedShipmentForReceipt.id, {
      receiptDate: new Date().toISOString().split("T")[0],
      items: receiptItems,
      condition: receiveCondition,
      remarks: receiveRemarks,
      receivedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
    });

    const totalRec = receiptItems.reduce((s, it) => s + it.qtyReceived, 0);
    setNotification({
      type: "success",
      text: `Successfully received ${totalRec} cylinders into godown from shipment ${selectedShipmentForReceipt.shipmentNum}. Godown physical stock increased automatically.`,
    });
    setShowReceiveModal(false);
    setSelectedShipmentForReceipt(null);
  };

  // Handle Receipt
  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(receiptForm.qty);
    if (!qtyNum || qtyNum <= 0) {
      alert("Please enter a valid receipt quantity.");
      return;
    }

    recordStockReceipt({
      date: new Date().toISOString().split("T")[0],
      productId: receiptForm.productId,
      qty: qtyNum,
      refNum: receiptForm.refNum.trim() || undefined,
      supplierSource: receiptForm.supplierSource.trim(),
      warehouseLocation: receiptForm.warehouseLocation.trim(),
      remarks: receiptForm.remarks.trim() || undefined,
      recordedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
    });

    setNotification({
      type: "success",
      text: `Stock receipt of ${qtyNum} filled cylinders recorded successfully!`,
    });
    setShowReceiptModal(false);
    setReceiptForm({
      productId: activeProducts[0]?.id || "",
      qty: "",
      refNum: "",
      supplierSource: "IOCL Bottling Plant, Jalandhar",
      warehouseLocation: "Main Godown (Ludhiana)",
      remarks: "",
    });
  };

  // Handle Adjustment
  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(adjForm.qty);
    if (!qtyNum || qtyNum <= 0) {
      alert("Please enter a valid adjustment quantity.");
      return;
    }

    recordStockAdjustment({
      date: new Date().toISOString().split("T")[0],
      productId: adjForm.productId,
      qty: qtyNum,
      isAddition: adjForm.isAddition,
      reason: adjForm.reason,
      recordedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
    });

    setNotification({
      type: "success",
      text: isAdmin
        ? `Stock adjustment of ${qtyNum} cylinders approved and applied!`
        : `Stock adjustment submitted for Admin approval.`,
    });
    setShowAdjustmentModal(false);
    setAdjForm({
      productId: activeProducts[0]?.id || "",
      qty: "",
      isAddition: false,
      reason: "Damaged / Defective Valve",
    });
  };

  // Handle Opening Stock Configuration (Admin only)
  const handleOpeningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fNum = parseInt(openingForm.filledOpening) || 0;
    const eNum = parseInt(openingForm.emptyOpening) || 0;

    configureOpeningStock(
      openingForm.productId,
      fNum,
      eNum,
      currentSessionUser?.fullName || "Bachan Admin"
    );

    setNotification({
      type: "success",
      text: `Opening stock configured: ${fNum} filled, ${eNum} empty cylinders.`,
    });
    setShowOpeningModal(false);
  };

  // Handle Reconciliation Submit
  const handleReconciliationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(reconForm.physicalCount);
    if (isNaN(countNum) || countNum < 0) {
      alert("Please enter a valid non-negative physical count.");
      return;
    }
    const rec = recordStockReconciliation({
      productId: reconForm.productId,
      monthPeriod: reconForm.monthPeriod,
      isEmpty: reconForm.isEmpty,
      physicalCount: countNum,
      reason: reconForm.reason,
      countedBy: currentSessionUser?.fullName || (isAdmin ? "Bachan Admin" : "Staff User"),
    });

    setNotification({
      type: "success",
      text: `Physical count recorded for ${rec.productName}. Variance: ${rec.quantityDifference > 0 ? "+" : ""}${rec.quantityDifference} units. ${isAdmin ? "Approve below to apply authorized adjustment." : "Submitted for Admin approval."}`,
    });
    setShowReconModal(false);
    setReconForm({
      ...reconForm,
      physicalCount: "",
    });
  };

  // Filter lists
  const receiptMovements = stockMovements.filter(m => m.type === "receipt");
  const issueMovements = stockMovements.filter(m => m.type === "issue");
  const adjustmentMovements = stockMovements.filter(m => m.type === "adjustment");
  const returnMovements = stockMovements.filter(m => m.type === "cylinder_return");

  // Aggregate metrics
  let totalFilledCylinders = 0;
  let totalEmptyCylinders = 0;
  let totalGasWeightKg = 0;
  let configuredCount = 0;

  warehouseStock.forEach((item) => {
    if (item.filledOpeningStock !== null) {
      configuredCount++;
      const f = Math.max(0, (item.filledOpeningStock || 0) + item.filledStockReceived - item.filledStockIssued);
      const e = Math.max(0, (item.emptyOpeningStock || 0) + item.emptyStockReceived - item.emptyStockIssued);
      totalFilledCylinders += f;
      totalEmptyCylinders += e;
      totalGasWeightKg += f * item.referenceWeightKg;
    } else {
      const f = item.filledStockReceived - item.filledStockIssued;
      const e = item.emptyStockReceived - item.emptyStockIssued;
      if (f > 0) totalFilledCylinders += f;
      if (e > 0) totalEmptyCylinders += e;
      if (f > 0) totalGasWeightKg += f * item.referenceWeightKg;
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600, margin: "0 auto" }}>
      {/* ── TOP HEADER & ACTIONS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
              Warehouse Inventory Management
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }}>
              Main Godown · Ludhiana
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
              Distributor Code: 0000110351
            </span>
          </div>
          <p className="page-sub" style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>
            Physical stock management for 6 approved commercial LPG products · Live Godown inventory, receipts, dispatches, returns & audit adjustments
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDispatchModal(true)}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: "#ea580c", color: "#ffffff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
              boxShadow: "0 2px 6px rgba(234,88,12,0.3)", transition: "all .15s"
            }}
          >
            <Truck size={16} /> New In-Transit Shipment
          </button>

          <button
            onClick={() => setShowReceiptModal(true)}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: "#16a34a", color: "#ffffff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
              boxShadow: "0 2px 6px rgba(22,163,74,0.3)", transition: "all .15s"
            }}
          >
            <ArrowDownLeft size={16} /> Direct Godown Receipt
          </button>

          <button
            onClick={() => setShowAdjustmentModal(true)}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "none",
              background: "#0f172a", color: "#ffffff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
              boxShadow: "0 2px 6px rgba(15,23,42,0.25)", transition: "all .15s"
            }}
          >
            <Sliders size={16} /> Stock Adjustment
          </button>

          <button
            onClick={() => setShowReconModal(true)}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "1.5px solid #cbd5e1",
              background: "#fff", color: "#1e3a8a", fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all .15s"
            }}
          >
            <Scale size={16} color="#1e3a8a" /> Physical Count Recon
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowOpeningModal(true)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1.5px solid #fed7aa",
                background: "#fff", color: "#ea580c", fontSize: 12.5, fontWeight: 700,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all .15s"
              }}
            >
              <ShieldCheck size={16} color="#ea580c" /> Configure Opening Stock
            </button>
          )}
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {notification && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, background: "#f0fdf4",
          border: "1px solid #bbf7d0", color: "#166534", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", color: "#166534", fontWeight: 800, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── KPI METRIC CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #16a34a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Filled Cylinders in Godown</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={15} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {totalFilledCylinders.toLocaleString("en-IN")} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>units</span>
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
            Ready for customer dispatch
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #0284c7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Empty Cylinders in Godown</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RotateCcw size={15} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {totalEmptyCylinders.toLocaleString("en-IN")} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>units</span>
          </div>
          <div style={{ fontSize: 11, color: "#0284c7", fontWeight: 600, marginTop: 4 }}>
            Available for plant refill return
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #f97316" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Total Stored Gas Weight</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={15} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {(totalGasWeightKg / 1000).toFixed(2)} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Metric Tons</span>
          </div>
          <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginTop: 4 }}>
            {totalGasWeightKg.toLocaleString("en-IN")} kg net LPG stock
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: "4px solid #ea580c" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>In-Transit from Bottling Plants</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={15} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#c2410c", marginTop: 8 }}>
            {inTransitTotals.totalInTransitQty.toLocaleString("en-IN")} <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>cylinders</span>
          </div>
          <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginTop: 4 }}>
            {inTransitTotals.totalShipments} active plant shipments
          </div>
        </div>

        <div style={{ ...card(), padding: 18, borderLeft: configuredCount === 6 ? "4px solid #16a34a" : "4px solid #d97706" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <span>Baseline Opening Stock</span>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: configuredCount === 6 ? "#dcfce7" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={15} color={configuredCount === 6 ? "#16a34a" : "#d97706"} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: configuredCount === 6 ? "#166534" : "#b45309", marginTop: 8 }}>
            {configuredCount} / 6 <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Configured</span>
          </div>
          <div style={{ fontSize: 11, color: configuredCount === 6 ? "#16a34a" : "#b45309", fontWeight: 600, marginTop: 4 }}>
            {configuredCount === 6 ? "All 6 product baselines verified" : "Unconfigured items track movements"}
          </div>
        </div>
      </div>

      {/* ── SUBSECTIONS NAVIGATION TABS ── */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", borderBottom: "2px solid #e2e8f0",
        paddingBottom: 2, background: "#ffffff", padding: "8px 12px", borderRadius: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
      }}>
        {[
          { id: "overview", label: "1. Inventory Overview", icon: Package, count: 6 },
          { id: "in_transit", label: "2. In-Transit Inventory", icon: Truck, count: inTransitTotals.totalInTransitQty },
          { id: "receipts", label: "3. Stock Receipts", icon: ArrowDownLeft, count: receiptMovements.length },
          { id: "issues", label: "4. Stock Issues", icon: ArrowUpRight, count: issueMovements.length },
          { id: "adjustments", label: "5. Stock Adjustments", icon: Sliders, count: adjustmentMovements.length },
          { id: "returns", label: "6. Cylinder Returns", icon: RotateCcw, count: returnMovements.length },
          { id: "daily_register", label: "7. Daily Register", icon: Calendar },
          { id: "monthly_register", label: "8. Monthly Register & Analysis", icon: BarChart2 },
          { id: "reconciliation", label: "9. Month-End Reconciliation", icon: Scale, count: (stockReconciliations || []).filter(r => r.status === "pending_approval").length },
          { id: "history", label: "10. Movement History", icon: History, count: stockMovements.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: isActive ? "#fff7ed" : "transparent",
                color: isActive ? "#ea580c" : "#475569",
                fontWeight: isActive ? 800 : 600,
                fontSize: 13, whiteSpace: "nowrap", transition: "all .12s",
                borderBottom: isActive ? "3px solid #ea580c" : "3px solid transparent",
              }}
            >
              <Icon size={16} color={isActive ? "#ea580c" : "#64748b"} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 100,
                  background: isActive ? "#fed7aa" : "#e2e8f0",
                  color: isActive ? "#9a3412" : "#475569",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: INVENTORY OVERVIEW (6 APPROVED PRODUCTS) ── */}
      {activeTab === "overview" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Godown Inventory Balance — 6 Approved LPG Products
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Current physical stock in Godown calculated from configured opening stock and verified movements.
              </p>
            </div>
            <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", background: "#e2e8f0", padding: "4px 8px", borderRadius: 6 }}>
              Formula: Opening + Receipts − Dispatches + Adjustments
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 18px" }}>Product Name & Code</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Ref Weight</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Opening Baseline Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Filled in Godown</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Empty in Godown</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Total Gas Weight</th>
                  <th style={{ padding: "12px 18px" }}>Last Updated</th>
                  {isAdmin && <th style={{ padding: "12px 18px", textAlign: "right" }}>Admin Actions</th>}
                </tr>
              </thead>
              <tbody>
                {warehouseStock.map((item) => {
                  const hasOpening = item.filledOpeningStock !== null;
                  const filledTotal = hasOpening
                    ? (item.filledOpeningStock || 0) + item.filledStockReceived - item.filledStockIssued
                    : item.filledStockReceived - item.filledStockIssued;

                  const emptyTotal = item.emptyOpeningStock !== null
                    ? (item.emptyOpeningStock || 0) + item.emptyStockReceived - item.emptyStockIssued
                    : item.emptyStockReceived - item.emptyStockIssued;

                  const totalWeightKg = Math.max(0, filledTotal) * item.referenceWeightKg;

                  return (
                    <tr key={item.productId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Product Name */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", marginTop: 2 }}>
                          {item.productCode}
                        </div>
                      </td>

                      {/* Reference Weight */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                        {item.referenceWeightKg} kg
                      </td>

                      {/* Opening Baseline Status */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        {hasOpening ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                            background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0"
                          }}>
                            Configured ({item.filledOpeningStock}F / {item.emptyOpeningStock}E)
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                            background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a"
                          }}>
                            Opening Stock Not Configured
                          </span>
                        )}
                      </td>

                      {/* Filled in Godown */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
                          {hasOpening ? Math.max(0, filledTotal) : `${filledTotal >= 0 ? "+" : ""}${filledTotal}`}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                          +{item.filledStockReceived} in / −{item.filledStockIssued} out
                        </div>
                      </td>

                      {/* Empty in Godown */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: "#334155" }}>
                          {item.emptyOpeningStock !== null ? Math.max(0, emptyTotal) : `${emptyTotal >= 0 ? "+" : ""}${emptyTotal}`}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                          +{item.emptyStockReceived} ret / −{item.emptyStockIssued} out
                        </div>
                      </td>

                      {/* Total Weight */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#0284c7" }}>
                          {totalWeightKg.toLocaleString("en-IN")} kg
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                          {(totalWeightKg / 1000).toFixed(2)} MT gas
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: "14px 18px", fontSize: 11.5, color: "#64748b" }}>
                        {item.lastUpdated}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              setOpeningForm({
                                productId: item.productId,
                                filledOpening: item.filledOpeningStock !== null ? String(item.filledOpeningStock) : "",
                                emptyOpening: item.emptyOpeningStock !== null ? String(item.emptyOpeningStock) : "",
                              });
                              setShowOpeningModal(true);
                            }}
                            style={{
                              padding: "5px 12px", borderRadius: 6, border: "1px solid #fed7aa",
                              background: "#fff7ed", color: "#c2410c", fontSize: 11.5, fontWeight: 700,
                              cursor: "pointer", transition: "all .12s"
                            }}
                          >
                            Set Opening
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: IN-TRANSIT INVENTORY (Client Change 2) ── */}
      {activeTab === "in_transit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Section Header Card */}
          <div style={{ ...card(), padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    In-Transit Inventory Tracking
                  </h2>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" }}>
                    Supplier to Godown
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0 0" }}>
                  Live visibility into commercial cylinders dispatched from bottling plants (IOCL Jalandhar, Bathinda, etc.) currently in transit on freight vehicles. Stock is credited to physical warehouse godown only upon verified physical unloading.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowDispatchModal(true)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: "#ea580c", color: "#fff", fontSize: 12.5, fontWeight: 700,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                    boxShadow: "0 2px 6px rgba(234,88,12,0.25)"
                  }}
                >
                  <Plus size={15} /> Dispatch New Shipment
                </button>
              </div>
            </div>

            {/* Quick In-Transit Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
              <div style={{ background: "#fff7ed", padding: "10px 14px", borderRadius: 8, border: "1px solid #fed7aa" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>Total In-Transit</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#9a3412", marginTop: 2 }}>
                  {inTransitTotals.totalInTransitQty} <span style={{ fontSize: 12, fontWeight: 600 }}>cylinders</span>
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Shipments</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                  {inTransitTotals.totalShipments} <span style={{ fontSize: 12, fontWeight: 600 }}>trucks</span>
                </div>
              </div>
              <div style={{ background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Expected Today</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginTop: 2 }}>
                  {inTransitTotals.expectedTodayQty} <span style={{ fontSize: 12, fontWeight: 600 }}>cylinders</span>
                </div>
              </div>
              <div style={{ background: inTransitTotals.overdueCount > 0 ? "#fef2f2" : "#f8fafc", padding: "10px 14px", borderRadius: 8, border: inTransitTotals.overdueCount > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: inTransitTotals.overdueCount > 0 ? "#dc2626" : "#64748b", textTransform: "uppercase" }}>Overdue Tracking</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: inTransitTotals.overdueCount > 0 ? "#991b1b" : "#0f172a", marginTop: 2 }}>
                  {inTransitTotals.overdueCount} <span style={{ fontSize: 12, fontWeight: 600 }}>shipments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipments List Table Card */}
          <div style={{ ...card(), overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  <th style={{ padding: "12px 18px" }}>Shipment #</th>
                  <th style={{ padding: "12px 18px" }}>Bottling Source & Dest</th>
                  <th style={{ padding: "12px 18px" }}>Vehicle & Transporter</th>
                  <th style={{ padding: "12px 18px" }}>Challan #</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Dispatched</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>Received</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>In-Transit</th>
                  <th style={{ padding: "12px 18px" }}>Status</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inTransitShipments.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 36, textAlign: "center", color: "#64748b" }}>
                      No in-transit shipments recorded yet. Click &quot;Dispatch New Shipment&quot; above to log factory dispatches.
                    </td>
                  </tr>
                ) : (
                  inTransitShipments.map(shp => {
                    const isFullyReceived = shp.status === "fully_received";
                    const isPartial = shp.status === "partially_received";
                    const pct = shp.totalDispatched > 0 ? Math.round((shp.totalReceived / shp.totalDispatched) * 100) : 0;

                    return (
                      <tr key={shp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace" }}>
                            {shp.shipmentNum}
                          </span>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            Disp: {shp.dispatchDate} · ETA: {shp.expectedArrivalDate}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{shp.supplierSource}</div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            → {shp.warehouseDestination}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>
                            {shp.vehicleNumber}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                            {shp.transporter}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: 12, color: "#475569" }}>
                          {shp.challanNumber}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                          {shp.totalDispatched}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 800, color: "#16a34a" }}>
                          {shp.totalReceived}
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "center", fontWeight: 900, color: shp.totalInTransit > 0 ? "#ea580c" : "#64748b" }}>
                          {shp.totalInTransit}
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                            background: isFullyReceived ? "#dcfce7" : isPartial ? "#ffedd5" : "#e0f2fe",
                            color: isFullyReceived ? "#15803d" : isPartial ? "#c2410c" : "#0369a1",
                            border: `1px solid ${isFullyReceived ? "#bbf7d0" : isPartial ? "#fed7aa" : "#bae6fd"}`
                          }}>
                            {isFullyReceived ? "Fully Received" : isPartial ? "Partially Received" : "In-Transit"}
                          </span>
                          <div style={{ width: 80, height: 5, background: "#e2e8f0", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: isFullyReceived ? "#16a34a" : "#ea580c" }} />
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          {!isFullyReceived && (
                            <button
                              onClick={() => {
                                setSelectedShipmentForReceipt(shp);
                                const initialQtys: Record<string, number> = {};
                                shp.items.forEach(it => {
                                  initialQtys[it.productId] = it.qtyInTransit;
                                });
                                setReceiveItemQtys(initialQtys);
                                setShowReceiveModal(true);
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 6, border: "none",
                                background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 700,
                                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5
                              }}
                            >
                              <ArrowDownLeft size={13} /> Receive into Godown
                            </button>
                          )}
                          {isFullyReceived && (
                            <span style={{ fontSize: 11.5, color: "#16a34a", fontWeight: 700 }}>
                              ✓ Received in Full
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: STOCK RECEIPTS ── */}
      {activeTab === "receipts" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Stock Receipts from Bottling Plant ({receiptMovements.length})
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Verified shipments of filled cylinders received into the godown from IOCL bottling facilities.
              </p>
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "#16a34a", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={14} /> Add Stock Receipt
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            {receiptMovements.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <ArrowDownLeft size={32} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                <div style={{ fontWeight: 700, color: "#1e293b" }}>No stock receipts recorded yet</div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Click &quot;Add Stock Receipt&quot; to log incoming truck deliveries from the bottling plant.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Receipt #</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Product Name</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "12px 18px" }}>Challan / Invoice #</th>
                    <th style={{ padding: "12px 18px" }}>Bottling Plant Source</th>
                    <th style={{ padding: "12px 18px" }}>Location</th>
                    <th style={{ padding: "12px 18px" }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptMovements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{m.movementNum}</td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.date}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{m.productName}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize: 14 }}>
                        +{m.qty}
                      </td>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#475569" }}>{m.refNum || "—"}</td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.supplierSource || "IOCL Bottling Plant"}</td>
                      <td style={{ padding: "12px 18px", color: "#64748b" }}>{m.warehouseLocation || "Main Godown"}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{m.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: STOCK ISSUES ── */}
      {activeTab === "issues" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Stock Issues (Customer Dispatches) ({issueMovements.length})
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Filled cylinders automatically deducted from warehouse inventory upon delivery confirmation.
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {issueMovements.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <ArrowUpRight size={32} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                <div style={{ fontWeight: 700, color: "#1e293b" }}>No stock issues logged yet</div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Confirmed deliveries will automatically register filled cylinder stock issues here.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Issue #</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Product Name</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "12px 18px" }}>Delivery Reference</th>
                    <th style={{ padding: "12px 18px" }}>Remarks</th>
                    <th style={{ padding: "12px 18px" }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {issueMovements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{m.movementNum}</td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.date}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{m.productName}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: "#dc2626", fontSize: 14 }}>
                        −{m.qty}
                      </td>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#475569" }}>{m.refNum || "—"}</td>
                      <td style={{ padding: "12px 18px", color: "#64748b" }}>{m.remarks || "Delivery supply to customer"}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{m.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: STOCK ADJUSTMENTS ── */}
      {activeTab === "adjustments" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Stock Adjustments & Physical Audit Reconciliation ({adjustmentMovements.length})
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Track valve defects, pin leaks, and physical audit reconciliation. Staff submissions require Admin approval.
              </p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "#0f172a", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={14} /> New Stock Adjustment
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            {adjustmentMovements.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <Sliders size={32} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                <div style={{ fontWeight: 700, color: "#1e293b" }}>No stock adjustments logged</div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Use stock adjustments to correct inventory counts for damaged cylinders or audit reconciliation.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Adjustment #</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Product Name</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Adjustment Qty</th>
                    <th style={{ padding: "12px 18px" }}>Reason & Notes</th>
                    <th style={{ padding: "12px 18px" }}>Recorded By</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    {isAdmin && <th style={{ padding: "12px 18px", textAlign: "right" }}>Admin Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {adjustmentMovements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{m.movementNum}</td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.date}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{m.productName}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                        {m.qty}
                      </td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.remarks}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{m.recordedBy}</td>
                      <td style={{ padding: "12px 18px" }}>
                        {m.status === "approved" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                            Approved
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                            Pending Admin Approval
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          {m.status === "pending_approval" && (
                            <button
                              onClick={() => approveStockAdjustment(m.id, currentSessionUser?.fullName || "Bachan Admin")}
                              style={{
                                padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#16a34a", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: CYLINDER RETURNS ── */}
      {activeTab === "returns" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Cylinder Returns (Empty Cylinders Received into Godown) ({returnMovements.length})
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Empty cylinders returned by customers automatically increase empty stock in the godown.
              </p>
            </div>
            <Link
              href="/deliveries?tab=received"
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "#ea580c", color: "#ffffff", fontSize: 12.5, fontWeight: 700,
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              Delivery Returns Register →
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            {returnMovements.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <RotateCcw size={32} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                <div style={{ fontWeight: 700, color: "#1e293b" }}>No empty cylinder returns logged yet</div>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Empty cylinders returned upon customer delivery confirmation will automatically populate this register.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Return #</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Product Name</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Empties Received</th>
                    <th style={{ padding: "12px 18px" }}>Delivery Challan</th>
                    <th style={{ padding: "12px 18px" }}>Godown Location</th>
                    <th style={{ padding: "12px 18px" }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {returnMovements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{m.movementNum}</td>
                      <td style={{ padding: "12px 18px", color: "#475569" }}>{m.date}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b" }}>{m.productName}</td>
                      <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: "#0284c7", fontSize: 14 }}>
                        +{m.qty} empty
                      </td>
                      <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#475569" }}>{m.refNum || "—"}</td>
                      <td style={{ padding: "12px 18px", color: "#64748b" }}>{m.warehouseLocation || "Main Godown"}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{m.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: MOVEMENT HISTORY ── */}
      {activeTab === "history" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Chronological Inventory Movement Ledger ({stockMovements.length})
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Complete immutable audit trail of all physical cylinder movements in and out of the godown.
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {stockMovements.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <History size={32} style={{ margin: "0 auto 10px", color: "#cbd5e1" }} />
                <div style={{ fontWeight: 700, color: "#1e293b" }}>No movements recorded yet</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>Movement #</th>
                    <th style={{ padding: "12px 18px" }}>Date</th>
                    <th style={{ padding: "12px 18px" }}>Type</th>
                    <th style={{ padding: "12px 18px" }}>Product</th>
                    <th style={{ padding: "12px 18px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "12px 18px", textAlign: "center" }}>Direction</th>
                    <th style={{ padding: "12px 18px" }}>Reference</th>
                    <th style={{ padding: "12px 18px" }}>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.map((m) => {
                    const isInflow = m.type === "receipt" || m.type === "cylinder_return";
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 800, color: "#0f172a" }}>{m.movementNum}</td>
                        <td style={{ padding: "12px 18px", color: "#475569" }}>{m.date}</td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>
                          {m.type.replace(/_/g, " ")}
                        </td>
                        <td style={{ padding: "12px 18px", color: "#0f172a" }}>{m.productName}</td>
                        <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 800, color: isInflow ? "#16a34a" : "#dc2626", fontSize: 14 }}>
                          {isInflow ? `+${m.qty}` : `−${m.qty}`}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "center" }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                            background: isInflow ? "#dcfce7" : "#fee2e2",
                            color: isInflow ? "#166534" : "#991b1b",
                            border: `1px solid ${isInflow ? "#bbf7d0" : "#fca5a5"}`
                          }}>
                            {isInflow ? "IN (Received)" : "OUT (Issued)"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#64748b" }}>{m.refNum || "—"}</td>
                        <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{m.recordedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: DAILY STOCK REGISTER (CONTINUOUS CARRY FORWARD) ── */}
      {activeTab === "daily_register" && (
        <div style={{ ...card(), overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={18} color="#ea580c" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Daily Warehouse Stock Register (Continuous Carry-Forward)
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
                Closing stock of Day N automatically becomes the opening stock of Day N+1 in Asia/Kolkata timezone.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={dailyProdId}
                onChange={(e) => setDailyProdId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "#fff" }}
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <input
                type="month"
                value={dailyMonth}
                onChange={(e) => setDailyMonth(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "#fff" }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "right", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  <th style={{ padding: "11px 14px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "11px 12px" }}>Opening (F)</th>
                  <th style={{ padding: "11px 12px", color: "#16a34a" }}>Receipts (F)</th>
                  <th style={{ padding: "11px 12px", color: "#dc2626" }}>Issues (F)</th>
                  <th style={{ padding: "11px 12px" }}>Adj (F)</th>
                  <th style={{ padding: "11px 12px", fontWeight: 900, color: "#0f172a" }}>Closing (F)</th>
                  <th style={{ padding: "11px 12px", borderLeft: "2px solid #e2e8f0" }}>Opening (E)</th>
                  <th style={{ padding: "11px 12px", color: "#16a34a" }}>Returns (E)</th>
                  <th style={{ padding: "11px 12px", color: "#dc2626" }}>Sent Out (E)</th>
                  <th style={{ padding: "11px 12px" }}>Adj (E)</th>
                  <th style={{ padding: "11px 12px", fontWeight: 900, color: "#0f172a" }}>Closing (E)</th>
                  <th style={{ padding: "11px 14px", color: "#ea580c", fontWeight: 800 }}>Gas Wt (kg)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const data = getDailyStockRegister ? getDailyStockRegister(dailyProdId, dailyMonth) : [];
                  const p = products.find(prod => prod.id === dailyProdId);
                  const refWt = p?.referenceWeightKg || 19;
                  return data.map((d) => (
                    <tr key={d.date} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", textAlign: "left", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                        {d.date}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{d.openingFilled}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.receivedFilled > 0 ? "#16a34a" : "#94a3b8", fontWeight: d.receivedFilled > 0 ? 700 : 400 }}>
                        {d.receivedFilled > 0 ? `+${d.receivedFilled}` : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.issuedFilled > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.issuedFilled > 0 ? 700 : 400 }}>
                        {d.issuedFilled > 0 ? `−${d.issuedFilled}` : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.adjFilled !== 0 ? "#7c3aed" : "#94a3b8" }}>
                        {d.adjFilled !== 0 ? (d.adjFilled > 0 ? `+${d.adjFilled}` : `${d.adjFilled}`) : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#0f172a", background: "#f8fafc" }}>
                        {d.closingFilled}
                      </td>

                      <td style={{ padding: "10px 12px", textAlign: "right", borderLeft: "2px solid #e2e8f0" }}>{d.openingEmpty}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.receivedEmpty > 0 ? "#16a34a" : "#94a3b8", fontWeight: d.receivedEmpty > 0 ? 700 : 400 }}>
                        {d.receivedEmpty > 0 ? `+${d.receivedEmpty}` : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.issuedEmpty > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.issuedEmpty > 0 ? 700 : 400 }}>
                        {d.issuedEmpty > 0 ? `−${d.issuedEmpty}` : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: d.adjEmpty !== 0 ? "#7c3aed" : "#94a3b8" }}>
                        {d.adjEmpty !== 0 ? `${d.adjEmpty}` : 0}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#0f172a", background: "#f8fafc" }}>
                        {d.closingEmpty}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#ea580c" }}>
                        {(d.closingFilled * refWt).toLocaleString("en-IN")} kg
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 7: MONTHLY STOCK REGISTER & MOM MOVEMENT ANALYSIS ── */}
      {activeTab === "monthly_register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(), padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={18} color="#2563eb" />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Monthly Stock Register & Movement Analysis
                </h2>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
                Continuous monthly opening and closing balances with month-over-month movement comparison.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                value={monthlyProdId}
                onChange={(e) => setMonthlyProdId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "#fff" }}
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(Number(e.target.value))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 13, fontWeight: 700, color: "#0f172a", background: "#fff" }}
              >
                <option value={2026}>Calendar Year 2026</option>
                <option value={2025}>Calendar Year 2025</option>
              </select>
            </div>
          </div>

          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "right", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Month Period</th>
                    <th style={{ padding: "12px 14px" }}>Opening (F)</th>
                    <th style={{ padding: "12px 14px", color: "#16a34a" }}>Receipts (F)</th>
                    <th style={{ padding: "12px 14px", color: "#dc2626" }}>Dispatches (F)</th>
                    <th style={{ padding: "12px 14px" }}>Adj (F)</th>
                    <th style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>Closing (F)</th>
                    <th style={{ padding: "12px 14px", borderLeft: "2px solid #e2e8f0" }}>Opening (E)</th>
                    <th style={{ padding: "12px 14px", color: "#16a34a" }}>Returns (E)</th>
                    <th style={{ padding: "12px 14px", color: "#dc2626" }}>Issues (E)</th>
                    <th style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>Closing (E)</th>
                    <th style={{ padding: "12px 14px", textAlign: "center" }}>Net Monthly Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const mData = getMonthlyStockRegister ? getMonthlyStockRegister(monthlyProdId, monthlyYear) : [];
                    return mData.map((m) => {
                      const netFilled = m.closingFilled - m.openingFilled;
                      return (
                        <tr key={m.monthPeriod} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800, color: "#1e293b" }}>
                            {m.monthName}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>{m.openingFilled}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: m.receivedFilled > 0 ? "#16a34a" : "#94a3b8", fontWeight: m.receivedFilled > 0 ? 700 : 400 }}>
                            {m.receivedFilled > 0 ? `+${m.receivedFilled}` : 0}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: m.issuedFilled > 0 ? "#dc2626" : "#94a3b8", fontWeight: m.issuedFilled > 0 ? 700 : 400 }}>
                            {m.issuedFilled > 0 ? `−${m.issuedFilled}` : 0}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>{m.adjFilled || 0}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a", background: "#f8fafc" }}>
                            {m.closingFilled}
                          </td>

                          <td style={{ padding: "12px 14px", textAlign: "right", borderLeft: "2px solid #e2e8f0" }}>{m.openingEmpty}</td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: m.returnsEmpty > 0 ? "#16a34a" : "#94a3b8", fontWeight: m.returnsEmpty > 0 ? 700 : 400 }}>
                            {m.returnsEmpty > 0 ? `+${m.returnsEmpty}` : 0}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: m.issuedEmpty > 0 ? "#dc2626" : "#94a3b8", fontWeight: m.issuedEmpty > 0 ? 700 : 400 }}>
                            {m.issuedEmpty > 0 ? `−${m.issuedEmpty}` : 0}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "#0f172a", background: "#f8fafc" }}>
                            {m.closingEmpty}
                          </td>

                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span style={{
                              padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                              background: netFilled > 0 ? "#ecfdf5" : netFilled < 0 ? "#fef2f2" : "#f1f5f9",
                              color: netFilled > 0 ? "#065f46" : netFilled < 0 ? "#991b1b" : "#475569"
                            }}>
                              {netFilled > 0 ? `+${netFilled} filled` : netFilled < 0 ? `${netFilled} filled` : "0 (Balanced)"}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: MONTH-END STOCK RECONCILIATION WORKFLOW ── */}
      {activeTab === "reconciliation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card(), padding: "18px 22px", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", border: "1.5px solid #bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Scale size={20} color="#1e3a8a" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1e3a8a", margin: 0 }}>
                    Month-End Physical Stock Reconciliation Workflow
                  </h2>
                </div>
                <p style={{ fontSize: 12.5, color: "#475569", margin: "4px 0 0", maxWidth: 750 }}>
                  Enter actual physical godown cylinder counts at the end of each month.
                  The system automatically calculates the variance (Physical Count − System Closing Stock).
                  Admin approval creates an authorized audit adjustment record to align system stock with verified reality.
                </p>
              </div>

              <button
                onClick={() => setShowReconModal(true)}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  background: "#1e3a8a", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 6px rgba(30,58,138,0.25)"
                }}
              >
                <Plus size={15} /> Record Physical Stock Count
              </button>
            </div>
          </div>

          <div style={{ ...card(), overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "1.5px solid #cbd5e1", textAlign: "left", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 16px" }}>Reconciliation #</th>
                    <th style={{ padding: "12px 16px" }}>Month Period</th>
                    <th style={{ padding: "12px 16px" }}>Product & Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>System Closing</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Physical Count</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Variance (Diff)</th>
                    <th style={{ padding: "12px 16px" }}>Variance Reason</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px" }}>Audited By</th>
                    {isAdmin && <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {(stockReconciliations || []).length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                        No physical stock reconciliation entries recorded yet. Click "Record Physical Stock Count" at month-end to initiate reconciliation.
                      </td>
                    </tr>
                  ) : (
                    (stockReconciliations || []).map((r) => {
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 800, color: "#1e3a8a" }}>
                            {r.reconciliationNum}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                            {r.monthPeriod}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.productName}</div>
                            <span style={{ fontSize: 11, color: r.isEmpty ? "#0284c7" : "#16a34a", fontWeight: 600 }}>
                              {r.isEmpty ? "Empty Cylinders" : "Filled Cylinders"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                            {r.systemClosingQty}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#1e3a8a" }}>
                            {r.physicalCount}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: r.quantityDifference === 0 ? "#16a34a" : r.quantityDifference > 0 ? "#0f766e" : "#dc2626" }}>
                            {r.quantityDifference > 0 ? `+${r.quantityDifference}` : r.quantityDifference}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569" }}>
                            {r.reason}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
                              background: r.status === "approved" ? "#dcfce7" : "#fef3c7",
                              color: r.status === "approved" ? "#166534" : "#92400e"
                            }}>
                              {r.status === "approved" ? "Approved" : "Pending Approval"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>
                            <div>{r.countedBy}</div>
                            <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{r.countedAt}</div>
                          </td>
                          {isAdmin && (
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              {r.status === "pending_approval" && (
                                <button
                                  onClick={() => {
                                    approveStockReconciliation(r.id, currentSessionUser?.fullName || "Bachan Admin");
                                    setNotification({
                                      type: "success",
                                      text: `Stock reconciliation ${r.reconciliationNum} approved! Authorized adjustment applied to inventory.`
                                    });
                                  }}
                                  style={{
                                    padding: "6px 12px", borderRadius: 6, border: "none",
                                    background: "#16a34a", color: "#fff", fontSize: 11.5, fontWeight: 700,
                                    cursor: "pointer"
                                  }}
                                >
                                  ✓ Approve & Adjust
                                </button>
                              )}
                              {r.status === "approved" && (
                                <span style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>
                                  ✓ Adjusted
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: STOCK RECEIPT ── */}
      {showReceiptModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 520, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Record Godown Stock Receipt</h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Log incoming filled LPG cylinders received from bottling plant</p>
              </div>
              <button onClick={() => setShowReceiptModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleReceiptSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Select Product *
                </label>
                <select
                  value={receiptForm.productId}
                  onChange={(e) => setReceiptForm({ ...receiptForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.referenceWeightKg || 19} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Quantity Received (Filled Cylinders) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={receiptForm.qty}
                  onChange={(e) => setReceiptForm({ ...receiptForm, qty: e.target.value })}
                  placeholder="e.g. 304"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, fontWeight: 700, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Plant Invoice / Challan Reference #
                </label>
                <input
                  type="text"
                  value={receiptForm.refNum}
                  onChange={(e) => setReceiptForm({ ...receiptForm, refNum: e.target.value })}
                  placeholder="e.g. IOCL-CH-88239"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Bottling Plant Source
                </label>
                <input
                  type="text"
                  value={receiptForm.supplierSource}
                  onChange={(e) => setReceiptForm({ ...receiptForm, supplierSource: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Godown Storage Location
                </label>
                <input
                  type="text"
                  value={receiptForm.warehouseLocation}
                  onChange={(e) => setReceiptForm({ ...receiptForm, warehouseLocation: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  Save Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: STOCK ADJUSTMENT ── */}
      {showAdjustmentModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 500, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>New Stock Adjustment</h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Record valve defects, leaks, or physical audit reconciliation</p>
              </div>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Select Product *
                </label>
                <select
                  value={adjForm.productId}
                  onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Adjustment Direction *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, isAddition: false })}
                    style={{
                      padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: !adjForm.isAddition ? "2px solid #dc2626" : "1px solid #cbd5e1",
                      background: !adjForm.isAddition ? "#fee2e2" : "#f8fafc",
                      color: !adjForm.isAddition ? "#991b1b" : "#475569"
                    }}
                  >
                    Deduct (− Count)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, isAddition: true })}
                    style={{
                      padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      border: adjForm.isAddition ? "2px solid #16a34a" : "1px solid #cbd5e1",
                      background: adjForm.isAddition ? "#dcfce7" : "#f8fafc",
                      color: adjForm.isAddition ? "#166534" : "#475569"
                    }}
                  >
                    Add (+ Count)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjForm.qty}
                  onChange={(e) => setAdjForm({ ...adjForm, qty: e.target.value })}
                  placeholder="e.g. 2"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, fontWeight: 700, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Reason *
                </label>
                <select
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  <option value="Damaged / Defective Valve">Damaged / Defective Valve</option>
                  <option value="Cylinder Pin Leakage">Cylinder Pin Leakage</option>
                  <option value="Physical Audit Reconciliation">Physical Audit Reconciliation</option>
                  <option value="Tare Weight Discrepancy">Tare Weight Discrepancy</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {isAdmin ? "Apply Adjustment" : "Submit for Admin Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: OPENING STOCK CONFIGURATION (ADMIN ONLY) ── */}
      {showOpeningModal && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 500, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Configure Opening Stock Baseline</h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Admin-only verified baseline godown inventory</p>
              </div>
              <button onClick={() => setShowOpeningModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleOpeningSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Select Product *
                </label>
                <select
                  value={openingForm.productId}
                  onChange={(e) => setOpeningForm({ ...openingForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Filled Cylinders Opening Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingForm.filledOpening}
                  onChange={(e) => setOpeningForm({ ...openingForm, filledOpening: e.target.value })}
                  placeholder="e.g. 150"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, fontWeight: 700, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Empty Cylinders Opening Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingForm.emptyOpening}
                  onChange={(e) => setOpeningForm({ ...openingForm, emptyOpening: e.target.value })}
                  placeholder="e.g. 80"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, fontWeight: 700, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#ea580c", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(234,88,12,0.3)"
                  }}
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: PHYSICAL STOCK RECONCILIATION ── */}
      {showReconModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 500, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Record Month-End Physical Stock Count</h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Compare actual physical count with system closing balance</p>
              </div>
              <button onClick={() => setShowReconModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleReconciliationSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Select Product *
                </label>
                <select
                  value={reconForm.productId}
                  onChange={(e) => setReconForm({ ...reconForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Reconciliation Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={reconForm.monthPeriod}
                    onChange={(e) => setReconForm({ ...reconForm, monthPeriod: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Cylinder Category *
                  </label>
                  <select
                    value={reconForm.isEmpty ? "empty" : "filled"}
                    onChange={(e) => setReconForm({ ...reconForm, isEmpty: e.target.value === "empty" })}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                  >
                    <option value="filled">Filled Cylinders</option>
                    <option value="empty">Empty Cylinders</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Actual Physical Count in Godown *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={reconForm.physicalCount}
                  onChange={(e) => setReconForm({ ...reconForm, physicalCount: e.target.value })}
                  placeholder="e.g. 142"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, fontWeight: 700, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Variance Reason / Audit Remarks *
                </label>
                <select
                  value={reconForm.reason}
                  onChange={(e) => setReconForm({ ...reconForm, reason: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none", background: "#f8fafc" }}
                >
                  <option value="Month-End Physical Stock Verification">Month-End Physical Stock Verification</option>
                  <option value="Cylinder Pin / Valve Defect Leakage">Cylinder Pin / Valve Defect Leakage</option>
                  <option value="Transit Handling Variance">Transit Handling Variance</option>
                  <option value="Tare Discrepancy Correction">Tare Discrepancy Correction</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowReconModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#1e3a8a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Submit Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── MODAL 5: DISPATCH NEW IN-TRANSIT SHIPMENT ── */}
      {showDispatchModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 540, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Dispatch New In-Transit Shipment</h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Log factory dispatch of cylinders from bottling plant</p>
              </div>
              <button onClick={() => setShowDispatchModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleDispatchSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Bottling Plant Source *
                  </label>
                  <select
                    value={dispatchForm.supplierSource}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, supplierSource: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  >
                    <option value="IOCL Bottling Plant, Jalandhar">IOCL Bottling Plant, Jalandhar</option>
                    <option value="IOCL LPG Bottling Plant, Bathinda">IOCL LPG Plant, Bathinda</option>
                    <option value="BPCL LPG Plant, Lalru">BPCL LPG Plant, Lalru</option>
                    <option value="HPCL Bottling Plant, Sangrur">HPCL Bottling Plant, Sangrur</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Destination Godown *
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.warehouseDestination}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, warehouseDestination: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PB-08-AX-9941"
                    value={dispatchForm.vehicleNumber}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Freight Transporter *
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.transporter}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, transporter: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Plant Challan / Gate Pass # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CH-IOCL-98442"
                    value={dispatchForm.challanNumber}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, challanNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Expected Arrival Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dispatchForm.expectedArrivalDate}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, expectedArrivalDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    LPG Product Dispatched *
                  </label>
                  <select
                    value={dispatchForm.productId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, productId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                  >
                    {activeProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code}) - {p.referenceWeightKg} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Dispatched Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dispatchForm.qtyDispatched}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, qtyDispatched: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", fontSize: 14, fontWeight: 800, border: "1.5px solid #ea580c", borderRadius: 8, outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Driver Notes / Dispatch Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tanker seal verified at terminal gate"
                  value={dispatchForm.remarks}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, remarks: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#ea580c", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(234,88,12,0.3)"
                  }}
                >
                  Confirm In-Transit Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: LOG PHYSICAL RECEIPT FROM SHIPMENT ── */}
      {showReceiveModal && selectedShipmentForReceipt && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{ background: "#ffffff", borderRadius: 16, maxWidth: 540, width: "100%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Receive Shipment {selectedShipmentForReceipt.shipmentNum}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Vehicle: <strong>{selectedShipmentForReceipt.vehicleNumber}</strong> · Plant: <strong>{selectedShipmentForReceipt.supplierSource}</strong>
                </p>
              </div>
              <button onClick={() => setShowReceiveModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleReceiveShipmentSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                  Shipment Cargo & Quantities Unloaded
                </div>
                {selectedShipmentForReceipt.items.map((it: any) => (
                  <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{it.productName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        Disp: {it.qtyDispatched} · Already Recv: {it.qtyReceived} · In-Transit: <strong>{it.qtyInTransit}</strong>
                      </div>
                    </div>
                    <div style={{ width: 120 }}>
                      <input
                        type="number"
                        min="0"
                        max={it.qtyInTransit}
                        value={receiveItemQtys[it.productId] ?? it.qtyInTransit}
                        onChange={(e) => setReceiveItemQtys({ ...receiveItemQtys, [it.productId]: parseInt(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "7px 10px", fontSize: 14, fontWeight: 800, border: "1.5px solid #16a34a", borderRadius: 8, outline: "none", textAlign: "right" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Cylinder Condition at Gate *
                </label>
                <select
                  value={receiveCondition}
                  onChange={(e) => setReceiveCondition(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                >
                  <option value="Good - Sound Valves">Good - Sound Valves (Standard)</option>
                  <option value="Minor Surface Paint Scratch">Minor Surface Paint Scratch (Acceptable)</option>
                  <option value="Valve Pin Defect Observed">Valve Pin Defect Observed (Segregated)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Receipt Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unloaded into Godown Bay 1"
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1.5px solid #cbd5e1", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  Confirm Physical Godown Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
