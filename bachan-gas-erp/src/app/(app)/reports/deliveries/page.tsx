"use client";
import { useState } from "react";
import { Truck, CheckCircle, Clock, Package, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useERPStore } from "@/lib/store";

const card = (s?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", ...s
});

export default function DeliveryReportsPage() {
  const { deliveries } = useERPStore();

  const totalTrips = deliveries.length;
  const completed = deliveries.filter(d => d.status === "delivered").length;
  const inTransit = deliveries.filter(d => d.status === "in_transit" || d.status === "pending").length;
  const totalCylsDelivered = deliveries.filter(d => d.status === "delivered").reduce((s, d) => s + d.qty, 0);

  // Vehicle summary map
  const vehicleMap: Record<string, { driver: string; trips: number; cylinders: number }> = {};
  deliveries.forEach(d => {
    const v = d.vehicle || "Unassigned";
    if (!vehicleMap[v]) {
      vehicleMap[v] = { driver: d.driver || "—", trips: 0, cylinders: 0 };
    }
    vehicleMap[v].trips += 1;
    if (d.status === "delivered") {
      vehicleMap[v].cylinders += d.qty;
    }
  });

  const vehiclePerf = Object.entries(vehicleMap).map(([vehicle, data]) => ({
    vehicle,
    driver: data.driver,
    trips: data.trips,
    cylinders: data.cylinders,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.3px" }}>Delivery Operations Report</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
            Cylinder dispatches, vehicle fleet utilization, and verified supply delivery performance
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1e3a8a", marginBottom: 8 }}>
            <Truck size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Dispatches</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1e3a8a" }}>{totalTrips} Trips</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Recorded delivery challans</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", marginBottom: 8 }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Cylinders Delivered</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>{totalCylsDelivered} Cylinders</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Fulfilled supplies</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f97316", marginBottom: 8 }}>
            <Clock size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Pending / In Transit</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f97316" }}>{inTransit} Active</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>En route to consumers</div>
        </div>

        <div style={{ ...card(), padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7c3aed", marginBottom: 8 }}>
            <Package size={18} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Fulfillment Ratio</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed" }}>
            {totalTrips > 0 ? `${Math.round((completed / totalTrips) * 100)}%` : "100%"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>On-time supply completion</div>
        </div>
      </div>

      {/* Fleet Utilization Table */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
          Vehicle Fleet & Dispatch Performance
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
              {["Vehicle Registration", "Driver Name", "Trips Logged", "Cylinders Delivered", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehiclePerf.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                  <Truck size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 700, color: "#334155" }}>Pending Deliveries: 0</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    No fleet delivery trips logged today.
                  </div>
                </td>
              </tr>
            ) : (
              vehiclePerf.map((v, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#1e3a8a" }}>{v.vehicle}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{v.driver}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{v.trips}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{v.cylinders}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>Active Fleet</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
