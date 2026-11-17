-- ============================================================================
-- BACHAN GAS SERVICE ERP — MIGRATION 005
-- Order Integration, Prepaid Advances & Carry Forward, Monthly Stock & Reconciliation
-- ============================================================================

-- 1. Ensure order_id and order_num linkages across all operational tables
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_num VARCHAR(50);

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_num VARCHAR(50);

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_num VARCHAR(50),
ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_advance BOOLEAN DEFAULT FALSE;

ALTER TABLE cylinder_exchange_ledger
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_num VARCHAR(50);

-- 2. Customer Advances Table (Prepaid Balances)
CREATE TABLE IF NOT EXISTS customer_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_receipt_num VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_received NUMERIC(12,2) NOT NULL CHECK (amount_received > 0),
    amount_applied NUMERIC(12,2) DEFAULT 0.00 CHECK (amount_applied >= 0),
    remaining_advance NUMERIC(12,2) NOT NULL CHECK (remaining_advance >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other')),
    reference_num VARCHAR(100),
    recorded_by VARCHAR(100) NOT NULL,
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'fully_applied', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_advances_customer ON customer_advances(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_advances_status ON customer_advances(status);

-- 3. Advance Allocations Table (Linking Advances to Invoices)
CREATE TABLE IF NOT EXISTS advance_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_id UUID NOT NULL REFERENCES customer_advances(id) ON DELETE RESTRICT CASCADE,
    advance_receipt_num VARCHAR(50) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    invoice_id VARCHAR(100) NOT NULL,
    invoice_num VARCHAR(50) NOT NULL,
    order_id VARCHAR(100),
    order_num VARCHAR(50),
    allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount > 0),
    allocated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    allocated_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advance_allocations_advance ON advance_allocations(advance_id);
CREATE INDEX IF NOT EXISTS idx_advance_allocations_invoice ON advance_allocations(invoice_id);

-- 4. Monthly Stock Reconciliation Table
CREATE TABLE IF NOT EXISTS stock_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_num VARCHAR(50) UNIQUE NOT NULL,
    warehouse_location VARCHAR(100) NOT NULL DEFAULT 'Main Godown (Ludhiana)',
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    month_period VARCHAR(10) NOT NULL, -- e.g. '2026-11'
    is_empty BOOLEAN DEFAULT FALSE,
    system_closing_qty INTEGER NOT NULL,
    physical_count INTEGER NOT NULL,
    quantity_difference INTEGER NOT NULL, -- physical_count - system_closing_qty
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    counted_by VARCHAR(100) NOT NULL,
    counted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    adjustment_movement_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_stock_recon_period ON stock_reconciliations(month_period, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_recon_status ON stock_reconciliations(status);

-- 5. Monthly Stock Snapshot Table for Historical Reporting
CREATE TABLE IF NOT EXISTS monthly_stock_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_period VARCHAR(10) NOT NULL, -- e.g. '2026-11'
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    warehouse_location VARCHAR(100) NOT NULL DEFAULT 'Main Godown (Ludhiana)',
    opening_filled INTEGER DEFAULT 0,
    received_filled INTEGER DEFAULT 0,
    issued_filled INTEGER DEFAULT 0,
    adjustments_filled INTEGER DEFAULT 0,
    closing_filled INTEGER DEFAULT 0,
    opening_empty INTEGER DEFAULT 0,
    received_empty INTEGER DEFAULT 0,
    issued_empty INTEGER DEFAULT 0,
    adjustments_empty INTEGER DEFAULT 0,
    closing_empty INTEGER DEFAULT 0,
    is_finalized BOOLEAN DEFAULT FALSE,
    finalized_by VARCHAR(100),
    finalized_at TIMESTAMPTZ,
    UNIQUE(month_period, product_id, warehouse_location)
);
