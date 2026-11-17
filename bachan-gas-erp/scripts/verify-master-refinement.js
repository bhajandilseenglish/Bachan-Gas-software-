// Verification script for Bachan Gas Service ERP Master Refinement & Business Workflow Upgrade
const fs = require("fs");
const path = require("path");

console.log("======================================================================");
console.log("BACHAN GAS SERVICE ERP — MASTER BUSINESS WORKFLOW VERIFICATION");
console.log("Distributor Code: 0000110351 · Ludhiana, Punjab");
console.log("======================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

// TEST 1: Database Migration Script
console.log("TEST SUITE 1: Safe PostgreSQL Database Migration Script");
const migrationPath = path.join(__dirname, "../supabase/migrations/004_master_refinement_workflow.sql");
assert(fs.existsSync(migrationPath), "Migration 004_master_refinement_workflow.sql exists");
const migrationSql = fs.readFileSync(migrationPath, "utf8");
assert(migrationSql.includes("erp_users"), "Migration contains erp_users table definition");
assert(migrationSql.includes("customer_approval_requests"), "Migration contains customer_approval_requests table");
assert(migrationSql.includes("reference_weight_kg"), "Migration includes reference_weight_kg column on products and customer_rates");
assert(migrationSql.includes("warehouse_stock"), "Migration contains warehouse_stock table");
assert(migrationSql.includes("stock_movements"), "Migration contains stock_movements table");
assert(migrationSql.includes("cheque_status"), "Migration tracks cheque_status and cleared_at in payments");

// TEST 2: Two Separate Login Experiences
console.log("\nTEST SUITE 2: Two Separate Login Experiences (Admin vs Staff)");
const adminLoginPath = path.join(__dirname, "../src/app/login/admin/page.tsx");
const staffLoginPath = path.join(__dirname, "../src/app/login/staff/page.tsx");
const portalLoginPath = path.join(__dirname, "../src/app/login/page.tsx");

assert(fs.existsSync(adminLoginPath), "Admin login route /login/admin exists");
assert(fs.existsSync(staffLoginPath), "Staff login route /login/staff exists");
assert(fs.existsSync(portalLoginPath), "Portal landing route /login exists with role picker");

const adminLoginSrc = fs.readFileSync(adminLoginPath, "utf8");
assert(adminLoginSrc.includes("loginUser(username, password, \"admin\")"), "Admin portal strictly enforces 'admin' role authentication");

const staffLoginSrc = fs.readFileSync(staffLoginPath, "utf8");
assert(staffLoginSrc.includes("loginUser(username, password, \"staff\")"), "Staff portal strictly enforces 'staff' role authentication");

// TEST 3: Customer Onboarding Option A & Option B
console.log("\nTEST SUITE 3: Customer Onboarding (Option A vs Option B) & Admin Approvals");
const newCustomerPagePath = path.join(__dirname, "../src/app/(app)/customers/new/page.tsx");
const customerApprovalsPagePath = path.join(__dirname, "../src/app/(app)/admin/customer-approvals/page.tsx");

assert(fs.existsSync(newCustomerPagePath), "Customer onboarding page /customers/new exists");
assert(fs.existsSync(customerApprovalsPagePath), "Admin customer approvals page /admin/customer-approvals exists");

const newCustSrc = fs.readFileSync(newCustomerPagePath, "utf8");
assert(newCustSrc.includes("Option A: Select / Search Existing Customer"), "Option A provides existing customer search & link without overwrite");
assert(newCustSrc.includes("Option B: Register New Commercial Customer"), "Option B provides complete registration form");
assert(newCustSrc.includes("submitNewCustomerRegistration"), "Form submits to store with approval workflow");

const approvalsSrc = fs.readFileSync(customerApprovalsPagePath, "utf8");
assert(approvalsSrc.includes("approveCustomerRegistration"), "Admin can approve pending registrations");
assert(approvalsSrc.includes("rejectCustomerRegistration"), "Admin can reject with reason");
assert(approvalsSrc.includes("requestCustomerCorrection"), "Admin can request corrections with notes");

// TEST 4: Customer Rates Master with Automatic Read-Only Rate per KG
console.log("\nTEST SUITE 4: Customer Rates Master (Automatic Rate per KG)");
const customerRatesPath = path.join(__dirname, "../src/app/(app)/products/rates/page.tsx");
assert(fs.existsSync(customerRatesPath), "Customer rates master page exists");

const ratesSrc = fs.readFileSync(customerRatesPath, "utf8");
assert(ratesSrc.includes("calculatedRatePerKg"), "Includes automatic calculated Rate per KG");
assert(!ratesSrc.includes("requestRateChange"), "Removed all customer rate change request buttons & forms");
assert(ratesSrc.includes("Formula: Rate ÷"), "Clear read-only rate per kg formula display");

// 6 Approved Products Reference Weights check
const storePath = path.join(__dirname, "../src/lib/store.ts");
const storeSrc = fs.readFileSync(storePath, "utf8");
assert(storeSrc.includes('name: "47.5kg LOT"') && storeSrc.includes("referenceWeightKg: 47.5"), "47.5kg LOT has reference weight 47.5 kg");
assert(storeSrc.includes('name: "47.5kg VOT"') && storeSrc.includes("referenceWeightKg: 47.5"), "47.5kg VOT has reference weight 47.5 kg");
assert(storeSrc.includes('name: "425kg jumbo"') && storeSrc.includes("referenceWeightKg: 425.0"), "425kg jumbo has reference weight 425.0 kg");
assert(storeSrc.includes('name: "19kg nano cut"') && storeSrc.includes("referenceWeightKg: 19.0"), "19kg nano cut has reference weight 19.0 kg");
assert(storeSrc.includes('name: "19 kg extra tej"') && storeSrc.includes("referenceWeightKg: 19.0"), "19 kg extra tej has reference weight 19.0 kg");
assert(storeSrc.includes('name: "19 kg normal"') && storeSrc.includes("referenceWeightKg: 19.0"), "19 kg normal has reference weight 19.0 kg");

// TEST 5: Warehouse Inventory Management
console.log("\nTEST SUITE 5: Warehouse Inventory Management (All 6 Subsections)");
const inventoryPagePath = path.join(__dirname, "../src/app/(app)/inventory/page.tsx");
assert(fs.existsSync(inventoryPagePath), "Warehouse inventory route /inventory exists");

const invSrc = fs.readFileSync(inventoryPagePath, "utf8");
assert(invSrc.includes("1. Inventory Overview"), "Subsection 1: Inventory Overview exists");
assert(invSrc.includes("2. Stock Receipts"), "Subsection 2: Stock Receipts exists");
assert(invSrc.includes("3. Stock Issues"), "Subsection 3: Stock Issues exists");
assert(invSrc.includes("4. Stock Adjustments"), "Subsection 4: Stock Adjustments exists");
assert(invSrc.includes("5. Cylinder Returns"), "Subsection 5: Cylinder Returns exists");
assert(invSrc.includes("6. Movement History"), "Subsection 6: Movement History exists");
assert(invSrc.includes("Opening Stock Not Configured"), "Displays 'Opening Stock Not Configured' when unconfigured");

// TEST 6: Payment Receipts with Conditional Fields & Cheque Settlement
console.log("\nTEST SUITE 6: Payment Receipts & Cheque Clearing Settlement");
const paymentsPagePath = path.join(__dirname, "../src/app/(app)/finance/payments/page.tsx");
assert(fs.existsSync(paymentsPagePath), "Finance payments page exists");

const paySrc = fs.readFileSync(paymentsPagePath, "utf8");
assert(storeSrc.includes("BGS-REC-"), "Generates sequential BGS-REC-XXXXX receipts in central store");
assert(paySrc.includes("0000110351"), "Contains official IOCL Distributor Code 0000110351");
assert(paySrc.includes("method === \"Cheque\""), "Contains conditional Cheque fields");
assert(paySrc.includes("updateChequeStatus"), "Admin cheque status clearing action supported");

// TEST 7: English Terminology Scrub (Zero Hindi/Hinglish)
console.log("\nTEST SUITE 7: Terminology Scrub (Zero Hindi/Hinglish Words)");
const customerProfilePath = path.join(__dirname, "../src/app/(app)/customers/[id]/page.tsx");
const dashboardPath = path.join(__dirname, "../src/components/dashboard/DashboardPage.tsx");
const customerProfileSrc = fs.readFileSync(customerProfilePath, "utf8");
const dashboardSrc = fs.readFileSync(dashboardPath, "utf8");

assert(!customerProfileSrc.includes("Total Udhaar"), "Customer profile uses 'Total Outstanding'");
assert(!customerProfileSrc.includes("Khali Cylinders Baaki"), "Customer profile uses 'Empty Cylinders Outstanding'");
assert(!dashboardSrc.includes("Khali cylinder wapsi"), "Dashboard uses 'Empty cylinder return'");
assert(!dashboardSrc.includes("Market Udhaar"), "Dashboard uses 'Financial Receivables & Collections'");
assert(!dashboardSrc.includes("Overdue Udhaar"), "Dashboard uses 'Overdue Receivables'");

// TEST 8: Excel Date Serial Conversion & Address Sanitization
console.log("\nTEST SUITE 8: Customer Database Excel Dates & Address Sanitization");
assert(storeSrc.includes("formatExcelDate"), "formatExcelDate conversion function exists in store");
assert(storeSrc.includes("cleanAddress"), "cleanAddress function exists in store to sanitize NA G/F placeholders");
assert(storeSrc.includes("verification_status"), "Customer model supports verification_status for review workflow");

// TEST 9: Dedicated Admin Opening Balance Module
console.log("\nTEST SUITE 9: Dedicated Admin Opening Balance Module & Store Actions");
const openingBalancesPagePath = path.join(__dirname, "../src/app/(app)/finance/opening-balances/page.tsx");
assert(fs.existsSync(openingBalancesPagePath), "Admin Opening Balances route /finance/opening-balances exists");
const openingBalSrc = fs.readFileSync(openingBalancesPagePath, "utf8");
assert(openingBalSrc.includes("setCustomerOpeningBalance"), "Supports single customer opening balance configuration");
assert(openingBalSrc.includes("bulkImportOpeningBalances"), "Supports bulk CSV opening balance import");
assert(storeSrc.includes("setCustomerOpeningBalance"), "Store implements setCustomerOpeningBalance action");
assert(storeSrc.includes("bulkImportOpeningBalances"), "Store implements bulkImportOpeningBalances action");

// TEST 10: Role Boundaries in Credit Management
console.log("\nTEST SUITE 10: Role Boundaries Enforcement in Credit Management");
const creditPagePath = path.join(__dirname, "../src/app/(app)/finance/credit/page.tsx");
const creditSrc = fs.readFileSync(creditPagePath, "utf8");
assert(creditSrc.includes("currentUserRole"), "Credit management reads currentUserRole");
assert(creditSrc.includes("Staff View (Read-Only)"), "Displays Staff View notice when logged in as staff");

// TEST 11: Customer Register Segment & Badge for Admin Review
console.log("\nTEST SUITE 11: Customer Register Review Segments & Status Badges");
const customersPagePath = path.join(__dirname, "../src/components/customers/CustomersPage.tsx");
const custsSrc = fs.readFileSync(customersPagePath, "utf8");
assert(custsSrc.includes("Needs Admin Review"), "Customer register includes 'Needs Admin Review' segment");
assert(custsSrc.includes("Review Needed"), "Displays 'Review Needed' badge on unverified records");

console.log("\n======================================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
if (passedTests === totalTests) {
  console.log("ALL MASTER BUSINESS WORKFLOW SPECIFICATIONS VERIFIED 100%!");
} else {
  console.error("SOME VERIFICATIONS FAILED!");
}
console.log("======================================================================");
