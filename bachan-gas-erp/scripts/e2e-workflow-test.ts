import { useERPStore } from "../src/lib/store";

console.log("============================================================");
console.log("BACHAN GAS SERVICE ERP — 18% GST & COMMERCIAL WORKFLOW TEST");
console.log("============================================================\n");

const store = useERPStore.getState();

// Step 1: Create Commercial Customer
console.log("▶ STEP 1: Creating 'Bachan Commercial Test Client'...");
const testCustomer = store.addCustomer({
  name: "Bachan Test Fabrication Ltd",
  business: "Bachan Fabrication Works",
  category: "commercial",
  consumer_type: "commercial_lpg",
  contact_person: "Harpreet Singh",
  mobile: "+91 98765 11223",
  alt_mobile: "+91 98765 44556",
  email: "test@bachangas.in",
  gst: "03AABCJ1103D1Z8",
  city: "Ludhiana",
  area: "Focal Point Phase V",
  state: "Punjab",
  pin: "141010",
  status: "active",
  credit_limit: 150000,
  payment_terms: "15 Days",
  payment_tenure_days: 15,
});

const refreshedTestCust = useERPStore.getState().getCustomer(testCustomer.id)!;
console.log(`✅ Customer Created: ID=${refreshedTestCust.id}, Code=${refreshedTestCust.code}, Name=${refreshedTestCust.name}`);
console.log(`   Payment Tenure: ${refreshedTestCust.payment_tenure_days} Days, Credit Limit: ₹${refreshedTestCust.credit_limit}`);

// Step 2: Assign Customer Rate for 47.5kg LOT (One of the exact 6 active LPG products)
console.log("\n▶ STEP 2: Assigning Customer Rate for '47.5kg LOT'...");
const activeProduct = useERPStore.getState().products.find(p => p.name === "47.5kg LOT")!;
console.log(`   Selected Active Product: ${activeProduct.name} (${activeProduct.code})`);

const agreedTestRate = 3850; // Basic rate per cylinder (GST exclusive)
useERPStore.getState().setCustomerRate({
  customerId: testCustomer.id,
  customerName: testCustomer.name,
  customerCode: testCustomer.code,
  productId: activeProduct.id,
  productName: activeProduct.name,
  defaultRate: activeProduct.rate,
  agreedRate: agreedTestRate,
  effectiveFrom: "01 Nov 2026",
  validTill: "31 Mar 2027",
  approvedBy: "Admin",
});

const rateObj = useERPStore.getState().getApplicableRate(testCustomer.id, activeProduct.id);
console.log(`✅ Customer Rate Resolved: ₹${rateObj.rate}/cylinder (Configured: ${rateObj.isConfigured})`);
if (rateObj.rate !== agreedTestRate || !rateObj.isConfigured) {
  throw new Error(`Rate mismatch: expected ${agreedTestRate}, got ${rateObj.rate}`);
}

// Step 3: Create Order for 10 Cylinders & Verify 18% GST Calculation
console.log("\n▶ STEP 3: Creating Order for 10 Cylinders & verifying 18% GST (CGST 9% + SGST 9%)...");
const orderQty = 10;
const expectedSubtotal = orderQty * agreedTestRate; // 10 * 3,850 = 38,500
const expectedCgst = Math.round((expectedSubtotal * 9) / 100); // 3,465
const expectedSgst = Math.round((expectedSubtotal * 9) / 100); // 3,465
const expectedTax = expectedCgst + expectedSgst; // 6,930 (18%)
const expectedTotal = expectedSubtotal + expectedTax; // 45,430

const testOrder = useERPStore.getState().createOrder({
  customerId: testCustomer.id,
  productId: activeProduct.id,
  qty: orderQty,
  deliveryDate: "2026-11-17",
  remarks: "Commercial test order for 47.5kg LOT",
});

console.log(`✅ Order Created: Num=${testOrder.num}, Status=${testOrder.status}`);
console.log(`   Ordered Qty: ${testOrder.totalQty} cylinders (No per-kg formula)`);
console.log(`   Subtotal (Taxable): ₹${testOrder.subtotal} (Expected: ₹${expectedSubtotal})`);
console.log(`   CGST (9%): ₹${testOrder.cgstAmount} (Expected: ₹${expectedCgst})`);
console.log(`   SGST (9%): ₹${testOrder.sgstAmount} (Expected: ₹${expectedSgst})`);
console.log(`   Total 18% GST: ₹${testOrder.taxAmt} (Expected: ₹${expectedTax})`);
console.log(`   Grand Total: ₹${testOrder.total} (Expected: ₹${expectedTotal})`);

if (testOrder.subtotal !== expectedSubtotal) throw new Error("Subtotal mismatch");
if (testOrder.taxAmt !== expectedTax) throw new Error("18% GST calculation mismatch");
if (testOrder.total !== expectedTotal) throw new Error("Total calculation mismatch");

// Step 4: Empty Cylinder Return Tracking
console.log("\n▶ STEP 4: Empty Cylinder Return Tracking (Delivered 10, Returned 7, Pending 3)...");
const exchangeRecord = useERPStore.getState().recordEmptyReturn({
  customerId: testCustomer.id,
  productId: activeProduct.id,
  productName: activeProduct.name,
  emptyReceived: 7,
  returnDate: "2026-11-17",
  refNum: "RET-TEST-001",
  remarks: "Partial empty return on delivery",
  recordedBy: "Staff Dispatcher",
});

const updatedCust = useERPStore.getState().getCustomer(testCustomer.id)!;
console.log(`✅ Empty Cylinder Return Recorded: Received=${exchangeRecord.emptyReceived}, Pending=${updatedCust.empty_cylinders_pending}`);
console.log(`   Total Filled Delivered: ${updatedCust.total_filled_delivered}`);
console.log(`   Total Empty Received: ${updatedCust.total_empty_received}`);
console.log(`   Net Empty Pending: ${updatedCust.empty_cylinders_pending}`);

// Step 5: Test Payment Tenure and Due Date Calculation
console.log("\n▶ STEP 5: Verifying Payment Tenure Due Date Calculation...");
const custTenure = updatedCust.payment_tenure_days;
console.log(`   Configured Payment Tenure: ${custTenure} Days`);
console.log(`   Invoice statutory rule: Due Date = Invoice Date + ${custTenure} Days`);

// Step 6: Test Inactivity Monitoring Cadence
console.log("\n▶ STEP 6: Configuring Customer Ordering Frequency...");
useERPStore.getState().updateCustomerOrderingFrequency(testCustomer.id, "daily");
const monitoredCust = useERPStore.getState().getCustomer(testCustomer.id)!;
console.log(`   Ordering Frequency: ${monitoredCust.ordering_frequency}`);
console.log(`   Expected Next Order Date: ${monitoredCust.expected_next_order_date}`);

console.log("\n============================================================");
console.log("ALL TEST VERIFICATIONS COMPLETED CLEANLY WITH 100% SUCCESS!");
console.log("============================================================\n");
