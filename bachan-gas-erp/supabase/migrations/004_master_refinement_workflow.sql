-- ============================================================================
-- BACHAN GAS SERVICE ERP — MIGRATION 004: MASTER SYSTEM REFINEMENT & WORKFLOW
-- Professional Roles, Customer Approvals, Warehouse Inventory, Rate per KG, Payments
-- ============================================================================

-- 1. ERP Application Users Table with Roles and Hashed Passwords
CREATE TABLE IF NOT EXISTS erp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_users_username ON erp_users(username);
CREATE INDEX IF NOT EXISTS idx_erp_users_role ON erp_users(role);

-- Seed Initial Verified Users if not present
INSERT INTO erp_users (username, password_hash, full_name, email, role, is_active)
VALUES 
    ('admin', 'admin123', 'Bachan Administrator', 'admin@bachangas.in', 'admin', TRUE),
    ('staff', 'staff123', 'Authorized Operations Staff', 'staff@bachangas.in', 'staff', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Customer Approvals and Customer Master Extensions
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150),
ADD COLUMN IF NOT EXISTS email VARCHAR(150),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending_approval', 'rejected', 'correction_requested')),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_approval_status ON customers(approval_status);

-- Customer Registration Approval Requests
CREATE TABLE IF NOT EXISTS customer_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_num VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(100),
    customer_data JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'correction_requested')),
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    correction_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_approval_status ON customer_approval_requests(status);

-- 3. Product Reference Weights & Customer Rate Master Extensions
ALTER TABLE products
ADD COLUMN IF NOT EXISTS reference_weight_kg NUMERIC(8,2);

-- Update Reference Weights for the approved 6 LPG Products
UPDATE products SET reference_weight_kg = 47.5 WHERE name ILIKE '%47.5kg LOT%';
UPDATE products SET reference_weight_kg = 47.5 WHERE name ILIKE '%47.5kg VOT%';
UPDATE products SET reference_weight_kg = 425.0 WHERE name ILIKE '%425kg jumbo%';
UPDATE products SET reference_weight_kg = 19.0 WHERE name ILIKE '%19kg nano cut%';
UPDATE products SET reference_weight_kg = 19.0 WHERE name ILIKE '%19 kg extra tej%' OR name ILIKE '%19kg extra tej%';
UPDATE products SET reference_weight_kg = 19.0 WHERE name ILIKE '%19 kg normal%' OR name ILIKE '%19kg normal%';

ALTER TABLE customer_rates
ADD COLUMN IF NOT EXISTS reference_weight_kg NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS calculated_rate_per_kg NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gst_rate_pct NUMERIC(5,2) DEFAULT 18.00;

-- 4. Warehouse Inventory & Stock Movement Ledger
CREATE TABLE IF NOT EXISTS warehouse_stock (
    product_id VARCHAR(100) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    filled_opening_stock INTEGER DEFAULT 0,
    filled_stock_received INTEGER DEFAULT 0,
    filled_stock_issued INTEGER DEFAULT 0,
    empty_opening_stock INTEGER DEFAULT 0,
    empty_stock_received INTEGER DEFAULT 0,
    empty_stock_issued INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_num VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('receipt', 'issue', 'adjustment', 'cylinder_return')),
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    is_empty BOOLEAN DEFAULT FALSE,
    ref_num VARCHAR(100),
    supplier_source VARCHAR(150),
    warehouse_location VARCHAR(100) DEFAULT 'Main Godown / Warehouse',
    recorded_by VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'approved' CHECK (status IN ('approved', 'pending_approval', 'rejected')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);

-- 5. Payment Receipts & Structured Payment Methods
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS receipt_num VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cheque_status VARCHAR(20) CHECK (cheque_status IN ('received', 'deposited', 'cleared', 'bounced', 'cancelled')),
ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cleared_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_payments_cheque_status ON payments(cheque_status);

-- 6. Customer Cylinder Exchange Ledger Enhancements
CREATE TABLE IF NOT EXISTS customer_cylinder_exchange_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_num VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    delivery_id VARCHAR(100),
    delivery_date DATE,
    filled_delivered INTEGER DEFAULT 0,
    empty_received INTEGER DEFAULT 0,
    outstanding_empty INTEGER NOT NULL,
    return_date DATE DEFAULT CURRENT_DATE,
    ref_num VARCHAR(100),
    recorded_by VARCHAR(100) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_cylinder_ledger_cust ON customer_cylinder_exchange_ledger(customer_id);

-- Rollback Instructions:
-- In case of emergency rollback, previous schemas are preserved.
-- To drop newly added tables:
-- DROP TABLE IF EXISTS stock_movements, warehouse_stock, customer_approval_requests, erp_users;
