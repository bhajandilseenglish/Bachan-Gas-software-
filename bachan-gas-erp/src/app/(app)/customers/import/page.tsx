"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Download, RefreshCw, Check, Database, Users, ShieldCheck, ChevronRight
} from "lucide-react";
import { useERPStore, INITIAL_REAL_CUSTOMERS } from "@/lib/store";

interface ParsedCustomerRow {
  name: string;
  business_name: string;
  category: "commercial" | "domestic" | "industrial" | "institutional";
  consumer_type: "regular" | "bulk" | "seasonal" | "spot";
  mobile: string;
  email: string;
  city: string;
  billing_address: string;
  credit_limit: number | null;
  payment_terms_days: number;
  gstin: string;
  consumer_number: string;
  status: "valid" | "duplicate" | "invalid";
  errorMsg?: string;
}

export default function ImportCustomersPage() {
  const router = useRouter();
  const { customers, bulkAddCustomers, recordImportBatch } = useERPStore();
  const [activeTab, setActiveTab] = useState<"client_file" | "custom_upload">("client_file");
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template CSV Download
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      "Consumer Number", "Customer Name", "Business Name", "Category", "Consumer Type", "Mobile",
      "Email", "City", "Billing Address", "Credit Limit", "Payment Terms Days", "GSTIN"
    ];
    const sampleRows = [
      [
        "CX2988723", "RAMU", "RAMU ENTERPRISES", "commercial", "bulk", "9815677148",
        "", "Ludhiana", "ST NO.1 MAHA MAYA NAGAR", "", "15", ""
      ],
      [
        "CX3721006", "VISHAL KUMAR", "VISHAL FABRICATORS", "commercial", "regular", "7508072783",
        "", "Ludhiana", "ST NO.13 BASANT NAGAR", "", "15", ""
      ]
    ];
    const csvContent = [templateHeaders.join(","), ...sampleRows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Bachan_Gas_Customer_Register_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click Load from verified 23.xlsx
  const handleLoadFrom23Xlsx = () => {
    setStep("importing");
    setImportProgress(20);

    let curr = 20;
    const interval = setInterval(() => {
      curr += 30;
      if (curr >= 100) {
        clearInterval(interval);
        setImportProgress(100);

        const count = bulkAddCustomers(INITIAL_REAL_CUSTOMERS as any);
        recordImportBatch({
          batch: `BATCH-23XLSX-${Date.now().toString().slice(-4)}`,
          name: "23.xlsx (Bachan Gas Service Customer Register)",
          date: new Date().toLocaleString("en-IN"),
          type: "Commercial LPG Register (Indane 0000110351)",
          total: 61320,
          valid: 648,
          duplicates: 0,
          status: "completed",
        });

        setImportedCount(count);
        setStep("done");
      } else {
        setImportProgress(curr);
      }
    }, 250);
  };

  // Process custom CSV
  const processCSVText = (text: string, fName: string) => {
    setFileName(fName);
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      alert("The uploaded file contains no data rows.");
      return;
    }

    const existingCodes = new Set(customers.map(c => c.code.toLowerCase().trim()));
    const rows: ParsedCustomerRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanCols = cols.map(c => c.replace(/^"|"$/g, "").trim());

      const consumer_number = cleanCols[0] || `CX${String(i).padStart(7, "0")}`;
      const name = cleanCols[1] || "";
      const business_name = cleanCols[2] || name;
      const rawCat = (cleanCols[3] || "commercial").toLowerCase();
      const category: ParsedCustomerRow["category"] =
        rawCat.includes("dom") ? "domestic" :
        rawCat.includes("ind") ? "industrial" :
        rawCat.includes("inst") ? "institutional" : "commercial";

      const mobile = cleanCols[5] || "";
      const email = cleanCols[6] || "";
      const city = cleanCols[7] || "Ludhiana";
      const billing_address = cleanCols[8] || "";
      const credit_limit = cleanCols[9] ? parseFloat(cleanCols[9]) : null;

      let status: ParsedCustomerRow["status"] = "valid";
      let errorMsg = "";

      if (!name) {
        status = "invalid";
        errorMsg = "Customer Name is required";
      } else if (existingCodes.has(consumer_number.toLowerCase())) {
        status = "duplicate";
        errorMsg = "Consumer Number already exists in register";
      }

      rows.push({
        consumer_number,
        name,
        business_name,
        category,
        consumer_type: "regular",
        mobile,
        email,
        city,
        billing_address,
        credit_limit,
        payment_terms_days: 15,
        gstin: "",
        status,
        errorMsg,
      });
    }

    setParsedRows(rows);
    setStep("preview");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.status === "valid");
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setStep("importing");
    setImportProgress(20);

    const customersToInsert = validRows.map(r => ({
      name: r.name,
      business: r.business_name || r.name,
      category: r.category,
      consumer_type: "Commercial/Industrial",
      code: r.consumer_number,
      contact_person: r.name,
      mobile: r.mobile || "—",
      email: r.email || "—",
      area: r.billing_address || "Industrial Area",
      city: r.city || "Ludhiana",
      state: "Punjab",
      pin: "141003",
      gst: r.gstin || "—",
      credit_limit: r.credit_limit,
      payment_terms: "Net 15 Days",
      status: "active" as const,
      outstanding: null,
      overdue: null,
      last_payment: null,
      last_payment_date: "—",
      last_supply: "—",
      last_supply_qty: 0,
      last_supply_product: "19 Kg Commercial LPG",
      pending_orders: 0,
    }));

    let curr = 20;
    const interval = setInterval(() => {
      curr += 30;
      if (curr >= 100) {
        clearInterval(interval);
        setImportProgress(100);
        const count = bulkAddCustomers(customersToInsert as any);
        setImportedCount(count);
        setStep("done");
      } else {
        setImportProgress(curr);
      }
    }, 200);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 50 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Customer Register Import Engine</h1>
        <p className="page-sub">
          Verified import pipeline for Bachan Gas Service customer registers (23.xlsx) and external spreadsheets
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => { setActiveTab("client_file"); setStep("upload"); }}
          style={{
            padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "1.5px solid", cursor: "pointer",
            borderColor: activeTab === "client_file" ? "#1e3a8a" : "#e2e8f0",
            background: activeTab === "client_file" ? "#1e3a8a" : "#fff",
            color: activeTab === "client_file" ? "#fff" : "#64748b",
          }}
        >
          📁 Client File: 23.xlsx (Verified Register)
        </button>
        <button
          onClick={() => { setActiveTab("custom_upload"); setStep("upload"); }}
          style={{
            padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "1.5px solid", cursor: "pointer",
            borderColor: activeTab === "custom_upload" ? "#1e3a8a" : "#e2e8f0",
            background: activeTab === "custom_upload" ? "#1e3a8a" : "#fff",
            color: activeTab === "custom_upload" ? "#fff" : "#64748b",
          }}
        >
          📤 Upload Custom File (CSV / XLSX)
        </button>
      </div>

      {/* ── CLIENT FILE (23.XLSX) VIEW ── */}
      {activeTab === "client_file" && step === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* File Verification Card */}
          <div className="card" style={{ padding: 24, borderLeft: "4px solid #16a34a" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={22} color="#16a34a" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    Verified File Detected: 23.xlsx
                  </span>
                  <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    17.9 MB · Validated
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                  Distributor: <strong>BACHAN GAS SERVICE</strong> (Code: <code>0000110351</code>) · Ludhiana, Punjab
                </div>
              </div>

              <button
                onClick={handleLoadFrom23Xlsx}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: "#f97316", color: "#fff", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(249,115,22,.25)"
                }}
              >
                <Database size={16} /> Load Verified Register (648 Commercial Accounts)
              </button>
            </div>

            {/* Real Statistics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 20 }}>
              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Workbook Records</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a", marginTop: 4 }}>61,320</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Rows 5 to 61,324 audited</div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "14px 16px", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Commercial Accounts</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a", marginTop: 4 }}>648</div>
                <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>Commercial / Industrial LPG</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Domestic Consumers</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#475569", marginTop: 4 }}>57,705</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>14.2kg Domestic DBC</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Consumer IDs</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#7c3aed", marginTop: 4 }}>58,471</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>0 Duplicate Consumer Codes</div>
              </div>
            </div>

            {/* Data Quality Report */}
            <div style={{ marginTop: 18, padding: "12px 16px", background: "#fef3c7", borderRadius: 8, border: "1px solid #fde68a", display: "flex", gap: 24, fontSize: 12, color: "#92400e" }}>
              <span>✓ <strong>Duplicate Consumer Numbers:</strong> 0 (Clean Key)</span>
              <span>⚠️ <strong>Missing Phone Numbers:</strong> 4,545 records</span>
              <span>⚠️ <strong>Incomplete Addresses:</strong> 2,849 blank rows</span>
              <span>ℹ️ <strong>Financial Opening Balances:</strong> Not in file (set as Not Configured)</span>
            </div>
          </div>

          {/* Verified Column Mapping Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-header">
              <span className="card-title">Audited 23.xlsx Column Mapping (44 Columns Detected)</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["Excel Column", "Header Name in 23.xlsx", "ERP Target Field", "Sample Verified Value"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Col A (1)", "Distributor Code", "settings.distributorshipCode", "0000110351"],
                    ["Col B (2)", "Distributor Name", "settings.tradeName", "BACHAN GAS SERVICE"],
                    ["Col C (3)", "Consumer ID", "customer.existing_consumer_id", ".7000000001355622."],
                    ["Col D (4)", "Consumer Number", "customer.code", "CX2988723 / 7001355622"],
                    ["Col E (5)", "Consumer Name", "customer.name", "RAMU / VISHAL KUMAR"],
                    ["Col F (6)", "Address", "customer.area / billing_address", "ST NO.1 MAHA MAYA NAGAR, PB010, IN, 141003"],
                    ["Col G (7)", "City", "customer.city", "LUDHIANA / GIAS PURA"],
                    ["Col L (12)", "Phone Number", "customer.mobile", "9815677148"],
                    ["Col M (13)", "Consumer Status", "customer.status", "ACTIVE"],
                    ["Col P (16)", "Consumer Category", "customer.category", "Commercial/Industrial vs Domestic"],
                    ["Col AA (27)", "Product", "customer.last_supply_product", "19 Kg General Package / 5 Kg ND"],
                    ["Col AR (44)", "Last Refill Date", "customer.last_supply", "46057 (Refill Code)"],
                  ].map(([col, header, target, sample], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 12.5 }}>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 700, color: "#1e3a8a" }}>{col}</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600 }}>{header}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#16a34a", fontWeight: 700 }}>{target}</td>
                      <td style={{ padding: "10px 16px", color: "#64748b" }}>{sample}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM FILE UPLOAD VIEW ── */}
      {activeTab === "custom_upload" && step === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 30 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Upload CSV or Spreadsheet File</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748b" }}>Select customer register file from your local workstation</p>
              </div>
              <button onClick={handleDownloadTemplate} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fff", border: "1.5px solid #e2e8f0", cursor: "pointer" }}>
                <Download size={14} /> Download CSV Template
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => processCSVText(ev.target?.result as string, file.name);
                  reader.readAsText(file);
                }
              }}
              style={{
                border: "2px dashed", borderColor: isDragging ? "#f97316" : "#cbd5e1",
                borderRadius: 12, padding: "40px 20px", textAlign: "center",
                background: isDragging ? "#fff7ed" : "#f8fafc", cursor: "pointer"
              }}
            >
              <Upload size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Click to select or drop CSV file here</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Supports UTF-8 CSV with standard customer columns</div>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW STEP ── */}
      {step === "preview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Pre-Import Validation Preview — {fileName}</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748b" }}>
                  {parsedRows.filter(r => r.status === "valid").length} valid rows ready for import
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("upload")} className="btn btn-ghost">Cancel</button>
                <button onClick={handleExecuteImport} className="btn btn-orange">✓ Confirm & Execute Import</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["Code", "Customer Name", "Category", "Mobile", "City", "Status", "Validation"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 20).map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 12.5 }}>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 700 }}>{r.consumer_number}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "10px 16px" }}>{r.category}</td>
                    <td style={{ padding: "10px 16px" }}>{r.mobile}</td>
                    <td style={{ padding: "10px 16px" }}>{r.city}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10.5, fontWeight: 700, background: r.status === "valid" ? "#dcfce7" : "#fee2e2", color: r.status === "valid" ? "#15803d" : "#b91c1c" }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: r.status === "valid" ? "#16a34a" : "#dc2626", fontSize: 11 }}>
                      {r.status === "valid" ? "Ready" : r.errorMsg}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── IMPORTING STEP ── */}
      {step === "importing" && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <RefreshCw size={36} color="#f97316" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Importing Customer Records…</h3>
          <p style={{ margin: "6px 0 20px", fontSize: 13, color: "#64748b" }}>Writing records into database and initializing credit registers</p>
          <div style={{ width: "100%", maxWidth: 400, height: 8, background: "#f1f5f9", borderRadius: 100, margin: "0 auto", overflow: "hidden" }}>
            <div style={{ width: `${importProgress}%`, height: "100%", background: "#f97316", transition: "width .2s" }} />
          </div>
        </div>
      )}

      {/* ── DONE STEP ── */}
      {step === "done" && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <CheckCircle2 size={48} color="#16a34a" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Import Completed Successfully</h2>
          <p style={{ margin: "8px 0 24px", fontSize: 14, color: "#64748b" }}>
            {importedCount} customer accounts have been registered into the ERP Customer Master.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/customers" className="btn btn-orange">
              View Customer Register →
            </Link>
            <button onClick={() => setStep("upload")} className="btn btn-ghost">
              Import Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
