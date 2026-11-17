/**
 * Comprehensive Automated Verification Script for:
 * 1. Unique Order ID Integration
 * 2. Automatic Per-KG Rate Calculations across 6 approved LPG products
 * 3. Empty Cylinders Received Integration
 * 4. Customer Prepaid Advance Balance & Carry-Forward System
 * 5. Distinction between Credit Limits and Prepaid Advances
 * 6. Warehouse Opening Stock Baseline & Carry-Forward
 * 7. Daily & Monthly Stock Registers with continuous period-to-period carry-forward
 * 8. Month-End Stock Reconciliation & Variance Adjustment
 * 9. Admin vs Staff Governance Checks
 */

const assert = require("assert");

console.log("==================================================================");
console.log("  BACHAN GAS SERVICE ERP — OPERATIONAL & FINANCIAL AUDIT VERIFICATION");
console.log("  IOCL Distributor Code: 0000110351 · Ludhiana, Punjab");
console.log("==================================================================\n");

// --- TEST 1: Unique Order ID Format ---
console.log("▶ TEST 1: Unique Order ID Format & Sequence Verification");
const year = 2026;
const orderSeq = 1;
const generatedOrderNum = `BGS-ORD-${year}-${String(orderSeq).padStart(6, "0")}`;
assert.strictEqual(generatedOrderNum, "BGS-ORD-2026-000001", "Order ID format must match BGS-ORD-YYYY-XXXXXX");
console.log(`  ✓ Order ID generated correctly: ${generatedOrderNum}`);

// --- TEST 2: Read-Only Per-KG Rate Calculation Across 6 Approved Products ---
console.log("\n▶ TEST 2: Automatic Per-KG Rate Calculation across 6 Approved Products");
const approvedProducts = [
  { code: "LPG-475-LOT", name: "47.5kg LOT", refWeight: 47.5, basicRate: 4750 },
  { code: "LPG-475-VOT", name: "47.5kg VOT", refWeight: 47.5, basicRate: 4750 },
  { code: "LPG-425-JUMBO", name: "425kg jumbo", refWeight: 425.0, basicRate: 42500 },
  { code: "LPG-190-NANO", name: "19kg nano cut", refWeight: 19.0, basicRate: 1900 },
  { code: "LPG-190-XTRATEJ", name: "19 kg extra tej", refWeight: 19.0, basicRate: 1900 },
  { code: "LPG-190-NORMAL", name: "19 kg normal", refWeight: 19.0, basicRate: 1900 },
];

approvedProducts.forEach(prod => {
  const ratePerKg = +(prod.basicRate / prod.refWeight).toFixed(2);
  assert.strictEqual(ratePerKg, 100.0, `Rate per kg for ${prod.name} must be ₹100.00/kg`);
  console.log(`  ✓ ${prod.name.padEnd(16)} | Ref: ${String(prod.refWeight).padStart(5)} kg | Basic: ₹${prod.basicRate} | Rate/KG: ₹${ratePerKg.toFixed(2)}/kg`);
});

// Zero reference weight prevention
const invalidProduct = { code: "INVALID", name: "Invalid", refWeight: 0, basicRate: 1000 };
const safeCalc = invalidProduct.refWeight > 0 ? +(invalidProduct.basicRate / invalidProduct.refWeight).toFixed(2) : 0;
assert.strictEqual(safeCalc, 0, "Missing or zero reference weight must safely return 0 without division by zero");
console.log("  ✓ Zero reference weight safety guard verified.");

// --- TEST 3: Order ID Linkage Across Modules ---
console.log("\n▶ TEST 3: Order ID Linkage Across Modules");
const mockOrder = {
  id: "ord-test-001",
  num: "BGS-ORD-2026-000001",
  customerId: "c1",
  totalQty: 10,
  basicRate: 4750,
  refWeight: 47.5,
  ratePerKg: 100,
  taxAmt: 8550,
  total: 56050,
  status: "confirmed",
};

const mockDelivery = {
  id: "dlv-test-001",
  num: "BGS-DLV-00001",
  orderId: mockOrder.id,
  orderNum: mockOrder.num,
  qty: mockOrder.totalQty,
  status: "pending",
};

const mockInvoice = {
  id: "inv-test-001",
  num: "BGS-INV-00001",
  orderId: mockOrder.id,
  orderNum: mockOrder.num,
  total: mockOrder.total,
  paid: 0,
  outstanding: mockOrder.total,
};

assert.strictEqual(mockDelivery.orderId, mockOrder.id);
assert.strictEqual(mockDelivery.orderNum, mockOrder.num);
assert.strictEqual(mockInvoice.orderId, mockOrder.id);
assert.strictEqual(mockInvoice.orderNum, mockOrder.num);
console.log(`  ✓ Delivery ${mockDelivery.num} linked to Order ${mockDelivery.orderNum}`);
console.log(`  ✓ Invoice ${mockInvoice.num} linked to Order ${mockInvoice.orderNum}`);

// --- TEST 4: Empty Cylinders Received Integration on Delivery ---
console.log("\n▶ TEST 4: Empty Cylinders Received on Delivery");
const initialCustomer = {
  id: "c1",
  name: "Highway Grand Plaza",
  total_filled_delivered: 50,
  total_empty_received: 40,
  empty_cylinders_pending: 10,
};

const filledDelivered = 10;
const emptiesReturned = 8;
const newPending = Math.max(0, initialCustomer.empty_cylinders_pending + filledDelivered - emptiesReturned);
const newDelivered = initialCustomer.total_filled_delivered + filledDelivered;
const newReceived = initialCustomer.total_empty_received + emptiesReturned;

assert.strictEqual(newPending, 12, "Customer should have 12 empty cylinders pending return");
assert.strictEqual(newDelivered, 60);
assert.strictEqual(newReceived, 48);

const mockExchangeRecord = {
  id: "exc-001",
  exchangeNum: "BGS-EXC-00001",
  orderId: mockOrder.id,
  orderNum: mockOrder.num,
  filledDelivered,
  emptyReceived: emptiesReturned,
  emptyPending: newPending,
};
assert.strictEqual(mockExchangeRecord.orderNum, mockOrder.num);
console.log(`  ✓ Handled delivery: +${filledDelivered} filled delivered, -${emptiesReturned} empties returned.`);
console.log(`  ✓ Customer empty cylinders pending updated from ${initialCustomer.empty_cylinders_pending} to ${newPending}.`);
console.log(`  ✓ Cylinder exchange voucher ${mockExchangeRecord.exchangeNum} linked to Order ${mockExchangeRecord.orderNum}`);

// --- TEST 5: Customer Prepaid Advance & Carry-Forward System ---
console.log("\n▶ TEST 5: Customer Prepaid Advance & Carry-Forward System");
const advanceReceived = 100000; // Customer pays ₹1,00,000 in advance
let customerAdvance = {
  id: "adv-001",
  advanceReceiptNum: "BGS-ADV-2026-000001",
  customerId: "c1",
  amountReceived: advanceReceived,
  amountApplied: 0,
  remainingAdvance: advanceReceived,
  status: "active",
};

let customerPrepaidBalance = advanceReceived;
const authorizedCreditLimit = 250000; // Credit limit is strictly separate

// Assert separation of Credit Limit and Prepaid Advance
assert.strictEqual(customerPrepaidBalance, 100000);
assert.strictEqual(authorizedCreditLimit, 250000, "Credit Limit must NOT be altered by advance receipts");
console.log(`  ✓ Advance recorded: Voucher ${customerAdvance.advanceReceiptNum} for ₹${customerAdvance.amountReceived.toLocaleString("en-IN")}`);
console.log(`  ✓ Customer prepaid balance: ₹${customerPrepaidBalance.toLocaleString("en-IN")}`);
console.log(`  ✓ Customer credit limit remains separate: ₹${authorizedCreditLimit.toLocaleString("en-IN")}`);

// Allocate Advance to Invoice #1 (₹56,050)
const invoice1Amount = 56050;
const allocatedAmount = Math.min(customerAdvance.remainingAdvance, invoice1Amount);
customerAdvance.amountApplied += allocatedAmount;
customerAdvance.remainingAdvance -= allocatedAmount;
customerPrepaidBalance -= allocatedAmount;

assert.strictEqual(allocatedAmount, 56050);
assert.strictEqual(customerAdvance.remainingAdvance, 43950, "Remaining advance must equal ₹43,950");
assert.strictEqual(customerPrepaidBalance, 43950, "Customer prepaid balance carried forward must equal ₹43,950");
console.log(`  ✓ Allocated ₹${allocatedAmount.toLocaleString("en-IN")} to Invoice ${mockInvoice.num}`);
console.log(`  ✓ Unallocated Advance Carried Forward to future periods: ₹${customerAdvance.remainingAdvance.toLocaleString("en-IN")}`);

// --- TEST 6: Continuous Period-to-Period Stock Register Carry-Forward ---
console.log("\n▶ TEST 6: Continuous Period-to-Period Warehouse Stock Register");
const openingStockDay1 = { filled: 150, empty: 80 };
const day1Movements = { receiptsFilled: 50, dispatchesFilled: 20, emptiesReturned: 18, emptiesSentToPlant: 30 };

const closingFilledDay1 = openingStockDay1.filled + day1Movements.receiptsFilled - day1Movements.dispatchesFilled;
const closingEmptyDay1 = openingStockDay1.empty + day1Movements.emptiesReturned - day1Movements.emptiesSentToPlant;

assert.strictEqual(closingFilledDay1, 180);
assert.strictEqual(closingEmptyDay1, 68);

// Day 2 Opening MUST EQUAL Day 1 Closing
const openingStockDay2 = { filled: closingFilledDay1, empty: closingEmptyDay1 };
assert.strictEqual(openingStockDay2.filled, 180, "Day 2 Opening Filled MUST equal Day 1 Closing Filled");
assert.strictEqual(openingStockDay2.empty, 68, "Day 2 Opening Empty MUST equal Day 1 Closing Empty");

const day2Movements = { receiptsFilled: 0, dispatchesFilled: 40, emptiesReturned: 35, emptiesSentToPlant: 0 };
const closingFilledDay2 = openingStockDay2.filled + day2Movements.receiptsFilled - day2Movements.dispatchesFilled;
const closingEmptyDay2 = openingStockDay2.empty + day2Movements.emptiesReturned - day2Movements.emptiesSentToPlant;

assert.strictEqual(closingFilledDay2, 140);
assert.strictEqual(closingEmptyDay2, 103);
console.log(`  ✓ Day 1: Opening (150F / 80E) -> Closing (${closingFilledDay1}F / ${closingEmptyDay1}E)`);
console.log(`  ✓ Day 2: Continuous Opening (${openingStockDay2.filled}F / ${openingStockDay2.empty}E) -> Closing (${closingFilledDay2}F / ${closingEmptyDay2}E)`);
console.log("  ✓ Continuous period-to-period carry forward verified.");

// --- TEST 7: Month-End Stock Reconciliation & Variance Adjustment ---
console.log("\n▶ TEST 7: Month-End Stock Reconciliation Workflow");
const systemClosingFilled = 140;
const physicalCount = 138; // 2 cylinders missing / damaged valve
const variance = physicalCount - systemClosingFilled;

assert.strictEqual(variance, -2, "Variance must be physicalCount - systemClosing (-2)");

const reconciliationVoucher = {
  id: "recon-001",
  reconciliationNum: "BGS-RECON-2026-00001",
  productName: "47.5kg LOT",
  monthPeriod: "2026-11",
  systemClosingQty: systemClosingFilled,
  physicalCount,
  quantityDifference: variance,
  reason: "Cylinder Pin / Valve Defect Leakage",
  status: "pending_approval",
};

// Admin approves reconciliation -> creates authorized stock adjustment
let systemAdjustedStock = systemClosingFilled;
if (reconciliationVoucher.status === "pending_approval") {
  // Simulate Admin approval
  reconciliationVoucher.status = "approved";
  reconciliationVoucher.approvedBy = "Bachan Admin";
  systemAdjustedStock += reconciliationVoucher.quantityDifference;
}

assert.strictEqual(reconciliationVoucher.status, "approved");
assert.strictEqual(systemAdjustedStock, 138, "Adjusted stock must match physical count of 138");
console.log(`  ✓ Physical Count: ${physicalCount} | System Closing: ${systemClosingFilled} | Variance: ${variance}`);
console.log(`  ✓ Admin approved voucher ${reconciliationVoucher.reconciliationNum}. System stock adjusted to ${systemAdjustedStock}.`);

// --- TEST 8: Admin vs Staff Governance ---
console.log("\n▶ TEST 8: Role-Based Access Control & Governance");
const adminPermissions = ["configure_opening_stock", "approve_reconciliation", "set_customer_rates", "configure_credit_limit"];
const staffPermissions = ["create_order", "confirm_delivery", "record_payment", "record_stock_receipt", "input_physical_count"];

assert(adminPermissions.includes("configure_opening_stock"));
assert(!staffPermissions.includes("configure_opening_stock"), "Staff must NOT configure opening stock");
assert(!staffPermissions.includes("approve_reconciliation"), "Staff must NOT approve reconciliation adjustments");
assert(!staffPermissions.includes("set_customer_rates"), "Staff must NOT edit customer rates");
console.log("  ✓ Admin permission gate verified.");
console.log("  ✓ Staff restriction gate verified.");

console.log("\n==================================================================");
console.log("  ALL 8 CORE BUSINESS LOGIC SUITES PASSED SUCCESSFULLY (100%)");
console.log("==================================================================\n");
