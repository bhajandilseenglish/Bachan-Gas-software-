"use client";

import { useState } from "react";
import Link from "next/link";
import { useERPStore, WarehouseStockItem, StockMovement, EXACT_SIX_ACTIVE_PRODUCTS } from "@/lib/store";
import {
  Package, Truck, ArrowDownLeft, ArrowUpRight, RotateCcw,
  Sliders, History, Plus, CheckCircle2, AlertTriangle, ShieldCheck,
  Search, ShieldAlert, FileText, Check, Clock
} from "lucide-react";

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
    deliveries,
    cylinderExchangeLedger,
  } = useERPStore();

  const isAdmin = currentUserRole === "admin";
  const activeProducts = products.filter(p => p.active);

  const [activeTab, setActiveTab] = useState<
    "overview" | "receipts" | "issues" | "adjustments" | "returns" | "history"
  >("overview");

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(activeProducts[0]?.id || "");

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

    const mov = recordStockAdjustment({
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

  // Filter lists
  const receiptMovements = stockMovements.filter(m => m.type === "receipt");
  const issueMovements = stockMovements.filter(m => m.type === "issue");
  const adjustmentMovements = stockMovements.filter(m => m.type === "adjustment");
  const returnMovements = stockMovements.filter(m => m.type === "cylinder_return");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Inventory Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              Main Godown · Ludhiana
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Physical stock management for 6 approved commercial LPG products · Receipts, issues, cylinder returns, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Record Stock Receipt
          </button>

          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            Stock Adjustment
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowOpeningModal(true)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Configure Opening Stock
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: "overview", label: "1. Inventory Overview", icon: Package, count: 6 },
          { id: "receipts", label: "2. Stock Receipts", icon: ArrowDownLeft, count: receiptMovements.length },
          { id: "issues", label: "3. Stock Issues", icon: ArrowUpRight, count: issueMovements.length },
          { id: "adjustments", label: "4. Stock Adjustments", icon: Sliders, count: adjustmentMovements.length },
          { id: "returns", label: "5. Cylinder Returns", icon: RotateCcw, count: returnMovements.length },
          { id: "history", label: "6. Movement History", icon: History, count: stockMovements.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-orange-500 text-orange-600 bg-orange-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-orange-200 text-orange-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVENTORY OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Current Godown Stock — 6 Approved LPG Products</h2>
                <p className="text-xs text-slate-500">Live physical count based on verified receipts, dispatches, and returns.</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Formula: Opening + Receipts − Dispatches + Adjustments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Ref Weight</th>
                    <th className="py-3 px-4 text-center">Opening Stock Status</th>
                    <th className="py-3 px-4 text-right">Filled in Stock</th>
                    <th className="py-3 px-4 text-right">Empty Cylinders</th>
                    <th className="py-3 px-4 text-right">Total Gas Weight (kg)</th>
                    <th className="py-3 px-4">Last Updated</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warehouseStock.map((item) => {
                    const hasConfiguredOpening = item.filledOpeningStock !== null;
                    const filledTotal = hasConfiguredOpening
                      ? (item.filledOpeningStock || 0) + item.filledStockReceived - item.filledStockIssued
                      : item.filledStockReceived - item.filledStockIssued;

                    const emptyTotal = item.emptyOpeningStock !== null
                      ? (item.emptyOpeningStock || 0) + item.emptyStockReceived - item.emptyStockIssued
                      : item.emptyStockReceived - item.emptyStockIssued;

                    const totalWeightKg = Math.max(0, filledTotal) * item.referenceWeightKg;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{item.productCode}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {item.referenceWeightKg} kg
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {hasConfiguredOpening ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Configured ({item.filledOpeningStock}F / {item.emptyOpeningStock}E)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Opening Stock Not Configured
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-extrabold text-sm text-slate-900">
                            {hasConfiguredOpening ? Math.max(0, filledTotal) : `${filledTotal >= 0 ? "+" : ""}${filledTotal}`}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            +{item.filledStockReceived} in / −{item.filledStockIssued} out
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-extrabold text-sm text-slate-800">
                            {item.emptyOpeningStock !== null ? Math.max(0, emptyTotal) : `${emptyTotal >= 0 ? "+" : ""}${emptyTotal}`}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            +{item.emptyStockReceived} ret / −{item.emptyStockIssued} out
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-sky-700 text-sm">
                            {totalWeightKg.toLocaleString("en-IN")} kg
                          </div>
                          <span className="text-[10px] text-slate-400">Equivalent gas</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {item.lastUpdated}
                        </td>

                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setOpeningForm({
                                  productId: item.productId,
                                  filledOpening: item.filledOpeningStock !== null ? String(item.filledOpeningStock) : "",
                                  emptyOpening: item.emptyOpeningStock !== null ? String(item.emptyOpeningStock) : "",
                                });
                                setShowOpeningModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors"
                            >
                              Configure
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
        </div>
      )}

      {/* TAB 2: STOCK RECEIPTS */}
      {activeTab === "receipts" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Receipts from Bottling Plant</h2>
              <p className="text-xs text-slate-500">Log truck arrivals with filled cylinders from IOCL Bottling Plants.</p>
            </div>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stock Receipt
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {receiptMovements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No stock receipts recorded yet. Click &quot;Add Stock Receipt&quot; to log incoming plant shipments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Challan / Ref #</th>
                      <th className="py-3 px-4">Plant Source</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.movementNum}</td>
                        <td className="py-3 px-4 text-slate-600">{m.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">+{m.qty}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.refNum || "—"}</td>
                        <td className="py-3 px-4 text-slate-600">{m.supplierSource || "IOCL Plant"}</td>
                        <td className="py-3 px-4 text-slate-600">{m.warehouseLocation || "Main Godown"}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{m.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK ISSUES */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900">Stock Issues (Customer Dispatches)</h2>
            <p className="text-xs text-slate-500">Filled cylinders automatically deducted from warehouse inventory upon delivery confirmation.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {issueMovements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No stock issues recorded yet. Confirmed deliveries will automatically deduct stock here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Issue #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Delivery Ref</th>
                      <th className="py-3 px-4">Remarks</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issueMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.movementNum}</td>
                        <td className="py-3 px-4 text-slate-600">{m.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-red-600">−{m.qty}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.refNum || "—"}</td>
                        <td className="py-3 px-4 text-slate-600">{m.remarks || "Delivery supply"}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{m.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STOCK ADJUSTMENTS */}
      {activeTab === "adjustments" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Adjustments & Physical Audit Reconciliation</h2>
              <p className="text-xs text-slate-500">
                Correct for valve leakages, physical damages, and audit discrepancies. Staff submissions require Admin approval.
              </p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Adjustment
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {adjustmentMovements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No inventory adjustments recorded.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Adjustment #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Adjustment Qty</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Admin Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adjustmentMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.movementNum}</td>
                        <td className="py-3 px-4 text-slate-600">{m.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{m.qty}</td>
                        <td className="py-3 px-4 text-slate-600">{m.remarks}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{m.recordedBy}</td>
                        <td className="py-3 px-4">
                          {m.status === "approved" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              Pending Approval
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            {m.status === "pending_approval" && (
                              <button
                                onClick={() => approveStockAdjustment(m.id, currentSessionUser?.fullName || "Bachan Admin")}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500"
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CYLINDER RETURNS */}
      {activeTab === "returns" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cylinder Returns (Empty Cylinders Received)</h2>
              <p className="text-xs text-slate-500">Customer empty cylinder returns automatically increase warehouse empty stock.</p>
            </div>
            <Link
              href="/deliveries?tab=received"
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
            >
              Delivery Empties Module
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {returnMovements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No customer empty cylinder returns logged yet. Empties returned upon delivery will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Return #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Empties Received</th>
                      <th className="py-3 px-4">Delivery Ref</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.movementNum}</td>
                        <td className="py-3 px-4 text-slate-600">{m.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{m.productName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-blue-700">+{m.qty} empty</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.refNum || "—"}</td>
                        <td className="py-3 px-4 text-slate-600">{m.warehouseLocation || "Main Godown"}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{m.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MOVEMENT HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900">Complete Inventory Movement Ledger</h2>
            <p className="text-xs text-slate-500">Chronological audit trail of all physical cylinder inflows and outflows.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {stockMovements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No inventory movements recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Movement #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockMovements.map((m) => {
                      const isInflow = m.type === "receipt" || m.type === "cylinder_return";
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.movementNum}</td>
                          <td className="py-3 px-4 text-slate-600">{m.date}</td>
                          <td className="py-3 px-4 capitalize font-semibold text-slate-800">
                            {m.type.replace("_", " ")}
                          </td>
                          <td className="py-3 px-4 text-slate-900">{m.productName}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{m.qty}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isInflow ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isInflow ? "IN (Received)" : "OUT (Issued)"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{m.refNum || "—"}</td>
                          <td className="py-3 px-4 text-slate-700">{m.recordedBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: STOCK RECEIPT */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Godown Stock Receipt</h3>
                <p className="text-xs text-slate-500">Log incoming filled LPG cylinders from plant</p>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleReceiptSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={receiptForm.productId}
                  onChange={(e) => setReceiptForm({ ...receiptForm, productId: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.referenceWeightKg || 19} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Received (Filled Cylinders) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={receiptForm.qty}
                  onChange={(e) => setReceiptForm({ ...receiptForm, qty: e.target.value })}
                  placeholder="e.g. 304"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plant Invoice / Challan Ref #</label>
                <input
                  type="text"
                  value={receiptForm.refNum}
                  onChange={(e) => setReceiptForm({ ...receiptForm, refNum: e.target.value })}
                  placeholder="e.g. IOCL-CH-88239"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bottling Plant Source</label>
                <input
                  type="text"
                  value={receiptForm.supplierSource}
                  onChange={(e) => setReceiptForm({ ...receiptForm, supplierSource: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Godown Storage Location</label>
                <input
                  type="text"
                  value={receiptForm.warehouseLocation}
                  onChange={(e) => setReceiptForm({ ...receiptForm, warehouseLocation: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Adjustment</h3>
                <p className="text-xs text-slate-500">Record physical count reconciliation or valve defects</p>
              </div>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={adjForm.productId}
                  onChange={(e) => setAdjForm({ ...adjForm, productId: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, isAddition: false })}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      !adjForm.isAddition
                        ? "bg-red-50 text-red-700 border-red-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Deduct (− Count)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, isAddition: true })}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      adjForm.isAddition
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Add (+ Count)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjForm.qty}
                  onChange={(e) => setAdjForm({ ...adjForm, qty: e.target.value })}
                  placeholder="e.g. 2"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
                <select
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Damaged / Defective Valve">Damaged / Defective Valve</option>
                  <option value="Cylinder Pin Leakage">Cylinder Pin Leakage</option>
                  <option value="Physical Audit Reconciliation">Physical Audit Reconciliation</option>
                  <option value="Tare Weight Discrepancy">Tare Weight Discrepancy</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {isAdmin ? "Apply Adjustment" : "Submit for Admin Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OPENING STOCK CONFIGURATION (ADMIN ONLY) */}
      {showOpeningModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Opening Stock</h3>
                <p className="text-xs text-slate-500">Admin-only physical baseline configuration</p>
              </div>
              <button onClick={() => setShowOpeningModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleOpeningSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={openingForm.productId}
                  onChange={(e) => setOpeningForm({ ...openingForm, productId: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Filled Cylinders Opening Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingForm.filledOpening}
                  onChange={(e) => setOpeningForm({ ...openingForm, filledOpening: e.target.value })}
                  placeholder="e.g. 150"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Empty Cylinders Opening Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={openingForm.emptyOpening}
                  onChange={(e) => setOpeningForm({ ...openingForm, emptyOpening: e.target.value })}
                  placeholder="e.g. 80"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
