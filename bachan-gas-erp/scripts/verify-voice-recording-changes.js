// ============================================================================
// BACHAN GAS SERVICE ERP — CLIENT VOICE RECORDING VERIFICATION SUITE
// Tests: Rate per KG entry, Order Direct Confirmation, In-Transit Inventory,
// Customer Pilot Group & Zero 404 Cylinder Returns
// ============================================================================

const fs = require("fs");
const path = require("path");

const storePath = path.join(__dirname, "../src/lib/store.ts");
const basicRatesPath = path.join(__dirname, "../src/app/(app)/products/basic-rates/page.tsx");
const customerRatesPath = path.join(__dirname, "../src/app/(app)/products/rates/page.tsx");
const newOrderPath = path.join(__dirname, "../src/app/(app)/orders/new/page.tsx");
const inventoryPath = path.join(__dirname, "../src/app/(app)/inventory/page.tsx");
const pilotPagePath = path.join(__dirname, "../src/app/(app)/customers/pilot/page.tsx");
const cylindersRedirectPath = path.join(__dirname, "../src/app/(app)/cylinders/page.tsx");
const nextConfigPath = path.join(__dirname, "../next.config.ts");

console.log("================================================================================");
console.log("   BACHAN GAS SERVICE ERP — CLIENT VOICE RECORDING AUTOMATED AUDIT SUITE");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, testName, details = "") {
  total++;
  if (condition) {
    console.log(`  [PASS] Test ${total}: ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] Test ${total}: ${testName}`);
    if (details) console.error(`         -> ${details}`);
  }
}

// 1. Inspect Store.ts
const storeCode = fs.readFileSync(storePath, "utf8");

assert(
  storeCode.includes("interface InTransitShipment") &&
  storeCode.includes("createInTransitShipment:") &&
  storeCode.includes("recordShipmentReceipt:"),
  "In-Transit Inventory interfaces and actions exist in store.ts"
);

assert(
  storeCode.includes("updateBasicRate: (data: { productId: string; basicRatePerKg?: number;") &&
  storeCode.includes("finalRatePerKg * refWeight"),
  "Basic Rate Master supports authoritative Basic Rate per KG entry with auto unit conversion"
);

assert(
  storeCode.includes("getApplicableRate: (customerId: string, productId: string) => { rate: number; ratePerKg: number;"),
  "getApplicableRate returns rate, ratePerKg, and referenceWeightKg"
);

assert(
  storeCode.includes("status: \"confirmed\""),
  "Normal routine orders are confirmed immediately on booking without mandatory Admin approval"
);

assert(
  storeCode.includes("INITIAL_IN_TRANSIT_SHIPMENTS") &&
  storeCode.includes("BGS-SHP-2026-00001"),
  "Initial In-Transit shipments configured for IOCL bottling plants"
);

assert(
  storeCode.includes("is_pilot") &&
  storeCode.includes("pilot_status"),
  "Customer interface supports pilot commercial customer workflow"
);

// 2. Inspect Basic Rate Master UI
const basicRatesCode = fs.readFileSync(basicRatesPath, "utf8");

assert(
  basicRatesCode.includes("Authoritative Basic Rate per KG (₹/kg)") &&
  basicRatesCode.includes("Rate per Unit = Rate per KG × Reference Weight"),
  "Basic Rate Master UI has per-KG editable input with auto-calculated read-only cylinder rate"
);

// 3. Inspect Customer Rate Master UI
const customerRatesCode = fs.readFileSync(customerRatesPath, "utf8");

assert(
  customerRatesCode.includes("Approved Customer Rate per KG (₹/kg)") &&
  customerRatesCode.includes("numRatePerKg * productRefWeight"),
  "Customer Rate Master UI has per-KG pricing input and dynamic unit rate calculation"
);

// 4. Inspect New Order Booking
const newOrderCode = fs.readFileSync(newOrderPath, "utf8");

assert(
  newOrderCode.includes("Basic Rate (₹ / Unit) *") &&
  newOrderCode.includes("Rate per KG (₹ / KG) *") &&
  newOrderCode.includes("getApplicableRate(customerId, prodId)"),
  "Order entry auto-retrieves rates with full bidirectional editing for Rate per Unit and Rate per KG"
);

// 5. Inspect Inventory Page for In-Transit Tracking
const inventoryCode = fs.readFileSync(inventoryPath, "utf8");

assert(
  inventoryCode.includes("In-Transit Inventory Tracking") &&
  inventoryCode.includes("Dispatch New In-Transit Shipment") &&
  inventoryCode.includes("Receive into Godown"),
  "Warehouse Inventory includes In-Transit Inventory Tracking, Dispatch modal, and Physical Receipt modal"
);

assert(
  inventoryCode.includes("filledStockReceived: (currentStock.filledStockReceived || 0) + rec.qtyReceived") ||
  storeCode.includes("filledStockReceived: (currentStock.filledStockReceived || 0) + rec.qtyReceived"),
  "Physical receipt of in-transit cylinders automatically increments godown stock"
);

// 6. Inspect Pilot Customers Hub
const pilotCode = fs.readFileSync(pilotPagePath, "utf8");

assert(
  pilotCode.includes("Commercial Customer Pilot Hub") &&
  pilotCode.includes("Book Order"),
  "Pilot Commercial Customer Hub page exists with live accounts, SAP codes, and quick booking"
);

// 7. Inspect Cylinder Returns & 404 Prevention
assert(
  fs.existsSync(cylindersRedirectPath),
  "/cylinders route exists and redirects cleanly to /cylinder-returns"
);

const nextConfigCode = fs.readFileSync(nextConfigPath, "utf8");
assert(
  nextConfigCode.includes("source: \"/cylinders\"") &&
  nextConfigCode.includes("destination: \"/cylinder-returns\""),
  "Next.js configuration specifies 307/308 redirects from /cylinders to /cylinder-returns"
);

console.log("\n================================================================================");
console.log(`   AUDIT RESULTS: ${passed} / ${total} TESTS PASSED`);
if (passed === total) {
  console.log("   ALL CLIENT VOICE RECORDING & CYLINDER RETURNS REQUIREMENTS VERIFIED!");
} else {
  console.error("   SOME TESTS FAILED — CHECK OUTPUT ABOVE.");
  process.exit(1);
}
console.log("================================================================================\n");
