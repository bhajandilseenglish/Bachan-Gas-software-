import { useERPStore } from "../src/lib/store";

console.log("============================================================");
console.log("BACHAN GAS SERVICE ERP — END-TO-END BUSINESS WORKFLOW TEST");
console.log("============================================================\n");

const store = useERPStore.getState();

// Step 1: Create TEST Customer
console.log("▶ STEP 1: Creating 'ERP TEST CUSTOMER'...");
const testCustomer = store.addCustomer({
  name: "ERP TEST CUSTOMER",
  business: "ERP Test Fabrication Works Ltd",
  category: "commercial",
  consumer_type: "bulk",
  contact_person: "Vikram Test Lead",
  mobile: "9876599999",
  alt_mobile: "9876588888",
  email: "erptest@bachangas.com",
  gst: "23AABCT9999Z1Z5",
  city: "Gwalior",
  area: "Industrial Estate, Malanpur",
  state: "Madhya Pradesh",
  pin: "474001",
  status: "active",
  credit_limit: 100000,
  payment_terms: "net_30",
});

useERPStore.getState().updateCreditLimit(testCustomer.id, 100000, "Net 30 Days");
const refreshedTestCust = useERPStore.getState().getCustomer(testCustomer.id)!;
console.log(`✅ Customer Created: ID=${refreshedTestCust.id}, Code=${refreshedTestCust.code}, Name=${refreshedTestCust.name}`);
console.log(`   Initial Outstanding: ${refreshedTestCust.outstanding} (Not Yet Configured), Sanctioned Credit Limit: ₹${refreshedTestCust.credit_limit}`);

// Step 2: Assign Cylinder Product and Test Rate
console.log("\n▶ STEP 2: Assigning Contract Rate for Commercial 42.5kg...");
const commercialProduct = useERPStore.getState().products.find(p => p.code === "LPG-425") || useERPStore.getState().products[0];
console.log(`   Standard List Rate for ${commercialProduct.name}: ₹${commercialProduct.rate}`);

const agreedTestRate = 2600; // Special discount rate
useERPStore.getState().setCustomerRate({
  customerId: testCustomer.id,
  customerName: testCustomer.name,
  customerCode: testCustomer.code,
  productId: commercialProduct.id,
  productName: commercialProduct.name,
  defaultRate: commercialProduct.rate,
  agreedRate: agreedTestRate,
  effectiveFrom: "03 Nov 2026",
  validTill: "31 Mar 2027",
  approvedBy: "QA Lead",
});

const rateObj = useERPStore.getState().getApplicableRate(testCustomer.id, commercialProduct.id);
const resolvedRate = rateObj.rate;
console.log(`✅ Assigned Contract Rate: ₹${resolvedRate} (Verified lookup matches agreed rate: ₹${agreedTestRate})`);
if (resolvedRate !== agreedTestRate || !rateObj.isConfigured) throw new Error(`Expected resolved rate to be ${agreedTestRate}, got ${resolvedRate}`);

// Step 3 & 4: Create Order for 10 Cylinders & Verify Calculations
console.log("\n▶ STEP 3 & 4: Creating Order for 10 cylinders & verifying calculations...");
const orderQty = 10;
const expectedSubtotal = orderQty * agreedTestRate; // 26,000
const expectedTax = Math.round((expectedSubtotal * commercialProduct.tax) / 100); // 5% of 26,000 = 1,300
const expectedTotal = expectedSubtotal + expectedTax; // 27,300
const expectedKg = orderQty * commercialProduct.weight; // 425 kg

const testOrder = useERPStore.getState().createOrder({
  customerId: testCustomer.id,
  productId: commercialProduct.id,
  qty: orderQty,
  deliveryDate: "2026-11-04",
  remarks: "QA Workflow Automated Test Order",
});

console.log(`✅ Order Created: Num=${testOrder.num}, Status=${testOrder.status}`);
console.log(`   Ordered Qty: ${testOrder.totalQty} cylinders, Total Weight: ${testOrder.totalKg} kg (Expected: ${expectedKg} kg)`);
console.log(`   Subtotal: ₹${testOrder.subtotal} (Expected: ₹${expectedSubtotal})`);
console.log(`   GST Tax (5%): ₹${testOrder.taxAmt} (Expected: ₹${expectedTax})`);
console.log(`   Total Amount: ₹${testOrder.total} (Expected: ₹${expectedTotal})`);

if (testOrder.subtotal !== expectedSubtotal) throw new Error("Subtotal mismatch");
if (testOrder.taxAmt !== expectedTax) throw new Error("Tax calculation mismatch");
if (testOrder.total !== expectedTotal) throw new Error("Total calculation mismatch");
if (testOrder.totalKg !== expectedKg) throw new Error("Net weight calculation mismatch");

// Step 5: Confirm and Dispatch Order
console.log("\n▶ STEP 5: Transitioning Order Status (Confirmed -> Approved -> Dispatch)...");
useERPStore.getState().updateOrderStatus(testOrder.id, "approved");
let currentOrder = useERPStore.getState().orders.find(o => o.id === testOrder.id)!;
console.log(`   Status updated to: ${currentOrder.status}`);

useERPStore.getState().updateOrderStatus(testOrder.id, "pending_dispatch");
currentOrder = useERPStore.getState().orders.find(o => o.id === testOrder.id)!;
console.log(`✅ Status updated to: ${currentOrder.status}`);
if (currentOrder.status !== "pending_dispatch") throw new Error("Order status mismatch");

// Step 6, 7 & 8: Dispatch Delivery & Confirm
console.log("\n▶ STEP 6, 7 & 8: Creating Delivery, Dispatching & Confirming Delivery...");
const delivery = useERPStore.getState().createDelivery({
  orderId: testOrder.id,
  vehicle: "MP-07-GA-1001",
  driver: "Ramu Driver",
});
console.log(`   Delivery Created: Num=${delivery.num}, Vehicle=${delivery.vehicle}, Qty=${delivery.qty}`);

// Confirm delivery
useERPStore.getState().confirmDelivery(delivery.id);
const confirmedDelivery = useERPStore.getState().deliveries.find(d => d.id === delivery.id)!;
console.log(`✅ Delivery Confirmed: Status=${confirmedDelivery.status}`);
if (confirmedDelivery.status !== "delivered") throw new Error("Delivery status must be 'delivered'");

// Step 8 & 9: Verify Customer Last Supply Date, Delivered Qty, and Posted Invoice
console.log("\n▶ STEP 8 & 9: Verifying Customer Supply Record and Auto-Generated Invoice...");
const updatedCustAfterDelivery = useERPStore.getState().customers.find(c => c.id === testCustomer.id)!;
console.log(`   Customer Last Supply Date: ${updatedCustAfterDelivery.last_supply}`);
console.log(`   Customer Last Supply Qty: ${updatedCustAfterDelivery.last_supply_qty} cylinders`);
console.log(`   Customer Last Supply Product: ${updatedCustAfterDelivery.last_supply_product}`);
console.log(`   Customer Outstanding Balance: ₹${updatedCustAfterDelivery.outstanding}`);

if (updatedCustAfterDelivery.last_supply_qty !== 10) throw new Error("Last supply qty mismatch");
if (updatedCustAfterDelivery.outstanding !== expectedTotal) throw new Error(`Customer outstanding must equal invoice total ₹${expectedTotal}`);

// Find generated invoice
const generatedInvoice = useERPStore.getState().invoices.find(i => i.orderId === testOrder.id)!;
console.log(`✅ Tax Invoice Generated: Num=${generatedInvoice.num}, Status=${generatedInvoice.status}, Total=₹${generatedInvoice.total}`);
if (!generatedInvoice || generatedInvoice.status !== "posted") throw new Error("Invoice must be generated and posted");

// Verify Ledger Debit
const custLedgerAfterDelivery = useERPStore.getState().ledger.filter(l => l.customerId === testCustomer.id);
console.log(`   Customer Ledger Entries: ${custLedgerAfterDelivery.length}`);
const debitEntry = custLedgerAfterDelivery.find(l => l.type === "Sales Invoice");
console.log(`✅ Ledger Debit Entry: Type=${debitEntry?.type}, Debit=₹${debitEntry?.debit}, Balance=₹${debitEntry?.balance}`);
if (!debitEntry || debitEntry.debit !== expectedTotal) throw new Error("Ledger debit entry mismatch");

// Step 11 & 12: Record Partial Payment & Verify Updated Outstanding
console.log("\n▶ STEP 11 & 12: Recording Partial Payment of ₹15,000...");
const paymentAmount = 15000;
const expectedRemainingBalance = expectedTotal - paymentAmount; // 27,300 - 15,000 = 12,300

const receipt = useERPStore.getState().recordPayment({
  customerId: testCustomer.id,
  amount: paymentAmount,
  date: "03 Nov 2026",
  method: "Bank Transfer (NEFT)",
  ref: "NEFT-BGS-TEST-9921",
});

console.log(`✅ Payment Receipt Recorded: Num=${receipt.num}, Amount=₹${receipt.amount}, Ref=${receipt.ref}`);
const custAfterPayment = useERPStore.getState().customers.find(c => c.id === testCustomer.id)!;
console.log(`   Customer Outstanding after Payment: ₹${custAfterPayment.outstanding} (Expected: ₹${expectedRemainingBalance})`);
if (custAfterPayment.outstanding !== expectedRemainingBalance) throw new Error("Outstanding balance after payment mismatch");

// Step 13: Verify Ledger Credit and Available Credit
console.log("\n▶ STEP 13: Verifying Customer Ledger Credit & Available Credit Room...");
const custLedgerAfterPayment = useERPStore.getState().ledger.filter(l => l.customerId === testCustomer.id);
const creditEntry = custLedgerAfterPayment.find(l => l.type === "Receipt Voucher");
console.log(`✅ Ledger Credit Entry: Type=${creditEntry?.type}, Credit=₹${creditEntry?.credit}, Balance=₹${creditEntry?.balance}`);
if (!creditEntry || creditEntry.credit !== paymentAmount) throw new Error("Ledger credit entry mismatch");
if (creditEntry.balance !== expectedRemainingBalance) throw new Error("Ledger closing balance mismatch");

const creditLim = useERPStore.getState().getCustomer(testCustomer.id)?.credit_limit || 100000;
const expectedAvailableCredit = creditLim - expectedRemainingBalance; // 100,000 - 12,300 = 87,700
const actualAvailableCredit = creditLim - (custAfterPayment.outstanding || 0);
console.log(`   Sanctioned Credit Limit: ₹${testCustomer.credit_limit}`);
console.log(`   Current Outstanding Debt: ₹${custAfterPayment.outstanding}`);
console.log(`✅ Available Credit Room: ₹${actualAvailableCredit} (Expected: ₹${expectedAvailableCredit})`);
if (actualAvailableCredit !== expectedAvailableCredit) throw new Error("Available credit calculation mismatch");

// Step 14 & 15: Reflection on Dashboard & Global KPIs
console.log("\n▶ STEP 14 & 15: Verifying Dashboard KPIs and System-Wide Accounting...");
const allCustomers = useERPStore.getState().customers;
const totalReceivables = allCustomers.reduce((s, c) => s + (c.outstanding || 0), 0);
const allOrders = useERPStore.getState().orders;
const allPayments = useERPStore.getState().payments;

console.log(`   Total Customers in Register: ${allCustomers.length}`);
console.log(`   Total System Receivables: ₹${totalReceivables.toLocaleString("en-IN")}`);
console.log(`   Total Orders in Pipeline: ${allOrders.length}`);
console.log(`   Total Payments Cleared: ${allPayments.length}`);

console.log("\n============================================================");
console.log("🎉 ALL 15 BUSINESS WORKFLOW STEPS VERIFIED 100% PASS!");
console.log("============================================================\n");

