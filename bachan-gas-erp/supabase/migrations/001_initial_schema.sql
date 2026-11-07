-- ============================================================
-- BACHAN GAS SERVICE ERP — Initial Database Schema
-- Migration 001: Core tables, relationships, RLS policies
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role_enum AS ENUM (
  'super_admin', 'admin', 'manager', 'sales_staff', 'accounts_staff', 'dispatch_staff'
);

CREATE TYPE customer_category_enum AS ENUM (
  'commercial', 'domestic', 'industrial', 'institutional', 'other'
);

CREATE TYPE customer_status_enum AS ENUM (
  'active', 'inactive', 'suspended', 'blacklisted'
);

CREATE TYPE consumer_type_enum AS ENUM (
  'regular', 'bulk', 'seasonal', 'spot'
);

CREATE TYPE payment_terms_enum AS ENUM (
  'immediate', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'advance'
);

CREATE TYPE order_status_enum AS ENUM (
  'draft', 'confirmed', 'approved', 'pending_dispatch', 'partially_delivered', 'delivered', 'cancelled'
);

CREATE TYPE delivery_status_enum AS ENUM (
  'pending', 'in_transit', 'delivered', 'failed', 'cancelled'
);

CREATE TYPE invoice_status_enum AS ENUM (
  'draft', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled', 'written_off'
);

CREATE TYPE payment_method_enum AS ENUM (
  'cash', 'bank_transfer', 'upi', 'cheque', 'other'
);

CREATE TYPE payment_status_enum AS ENUM (
  'pending', 'cleared', 'bounced', 'cancelled'
);

CREATE TYPE ledger_entry_type_enum AS ENUM (
  'opening_balance', 'invoice', 'payment', 'credit_note', 'debit_note', 'adjustment', 'reversal'
);

CREATE TYPE audit_action_enum AS ENUM (
  'create', 'update', 'delete', 'approve', 'reject', 'post', 'reverse', 'import', 'export'
);

-- ============================================================
-- USERS & ROLES
-- ============================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'sales_staff',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permission flags per role
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_enum NOT NULL,
  resource TEXT NOT NULL,           -- e.g. 'customers', 'orders', 'invoices'
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identifiers
  customer_code TEXT UNIQUE NOT NULL,         -- Internal auto-generated: BCG-00001
  existing_consumer_id TEXT,                  -- From source system / import
  consumer_number TEXT,                       -- Gas agency consumer number
  -- Personal / Business
  customer_name TEXT NOT NULL,
  business_name TEXT,
  category customer_category_enum NOT NULL DEFAULT 'commercial',
  consumer_type consumer_type_enum NOT NULL DEFAULT 'regular',
  status customer_status_enum NOT NULL DEFAULT 'active',
  -- Contact
  contact_person TEXT,
  mobile TEXT,
  alternate_mobile TEXT,
  email TEXT,
  -- Tax & Compliance
  gst_number TEXT,
  -- Address
  billing_address TEXT,
  delivery_address TEXT,
  city TEXT,
  area TEXT,
  state TEXT DEFAULT 'Rajasthan',
  pin_code TEXT,
  -- Finance
  credit_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_terms payment_terms_enum NOT NULL DEFAULT 'net_30',
  opening_receivable NUMERIC(15,2) NOT NULL DEFAULT 0,   -- Seeded once at onboarding
  -- Meta
  notes TEXT,
  is_portal_enabled BOOLEAN NOT NULL DEFAULT false,       -- Phase 2: customer portal
  imported_from TEXT,                                      -- Import batch ID
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'delivery',          -- billing | delivery | other
  address_line TEXT NOT NULL,
  city TEXT,
  area TEXT,
  state TEXT,
  pin_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS / CYLINDERS
-- ============================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code TEXT UNIQUE NOT NULL,          -- e.g. LPG-425, LPG-190
  product_name TEXT NOT NULL,
  cylinder_type TEXT NOT NULL,                -- e.g. 'Commercial', 'Domestic'
  net_weight_kg NUMERIC(8,3) NOT NULL,        -- 42.5, 19.0, 14.2 etc.
  sku TEXT,
  default_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  hsn_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default product rates (changes over time)
CREATE TABLE public.product_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rate NUMERIC(12,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer-specific rate overrides
CREATE TABLE public.customer_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rate NUMERIC(12,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  approved_by UUID REFERENCES public.user_profiles(id),
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id, effective_from)
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,          -- BGS-ORD-2024-00001
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status order_status_enum NOT NULL DEFAULT 'draft',
  -- Totals (computed from order_items, stored for performance)
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Delivery
  requested_delivery_date DATE,
  delivery_address TEXT,
  vehicle_number TEXT,
  -- Workflow
  confirmed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.user_profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.user_profiles(id),
  cancellation_reason TEXT,
  -- Meta
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  -- Rate snapshot — frozen at order time
  unit_rate NUMERIC(12,2) NOT NULL,
  tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- Computed
  subtotal NUMERIC(15,2) NOT NULL,           -- quantity * unit_rate
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  -- Delivery tracking
  delivered_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_quantity NUMERIC(10,2) GENERATED ALWAYS AS (quantity - delivered_quantity) STORED,
  -- Meta
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DELIVERIES
-- ============================================================

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_number TEXT UNIQUE NOT NULL,       -- BGS-DLV-2024-00001
  order_id UUID NOT NULL REFERENCES public.orders(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status delivery_status_enum NOT NULL DEFAULT 'pending',
  vehicle_number TEXT,
  driver_name TEXT,
  remarks TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.user_profiles(id),
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  ordered_quantity NUMERIC(10,2) NOT NULL,
  delivered_quantity NUMERIC(10,2) NOT NULL CHECK (delivered_quantity >= 0),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_over_delivery CHECK (delivered_quantity <= ordered_quantity)
);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,        -- BGS-INV-2024-00001
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  order_id UUID REFERENCES public.orders(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status invoice_status_enum NOT NULL DEFAULT 'draft',
  -- Amounts
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  -- Meta
  notes TEXT,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.user_profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.user_profiles(id),
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL,
  unit_rate NUMERIC(12,2) NOT NULL,
  tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number TEXT UNIQUE NOT NULL,        -- BGS-PAY-2024-00001
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  method payment_method_enum NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  status payment_status_enum NOT NULL DEFAULT 'cleared',
  allocated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  unallocated_amount NUMERIC(15,2) GENERATED ALWAYS AS (amount - allocated_amount) STORED,
  remarks TEXT,
  recorded_by UUID NOT NULL REFERENCES public.user_profiles(id),
  cleared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  allocated_amount NUMERIC(15,2) NOT NULL CHECK (allocated_amount > 0),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  allocated_by UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  UNIQUE(payment_id, invoice_id)
);

-- ============================================================
-- FINANCIAL LEDGER
-- ============================================================

CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  entry_date DATE NOT NULL,
  entry_type ledger_entry_type_enum NOT NULL,
  -- Reference pointers
  order_id UUID REFERENCES public.orders(id),
  invoice_id UUID REFERENCES public.invoices(id),
  payment_id UUID REFERENCES public.payments(id),
  -- Double-entry style
  debit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,   -- Amount owed by customer
  credit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,  -- Amount paid / credited
  running_balance NUMERIC(15,2) NOT NULL,           -- Positive = customer owes
  -- Description
  description TEXT NOT NULL,
  reference_number TEXT,
  -- Reversal tracking
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  reversed_by_entry_id UUID REFERENCES public.ledger_entries(id),
  reversed_at TIMESTAMPTZ,
  -- Meta
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OPENING BALANCES (seeded once)
-- ============================================================

CREATE TABLE public.opening_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) UNIQUE,
  balance_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,           -- Positive = customer owes
  notes TEXT,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES public.user_profiles(id),
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREDIT LIMITS
-- ============================================================

CREATE TABLE public.credit_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  credit_limit NUMERIC(15,2) NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  approved_by UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  action audit_action_enum NOT NULL,
  resource_type TEXT NOT NULL,       -- 'customers', 'orders', 'payments', etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXCEL IMPORT SYSTEM
-- ============================================================

CREATE TABLE public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  import_type TEXT NOT NULL,            -- 'customers', 'rates', 'payments', 'orders'
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  error_summary TEXT,
  column_mapping JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  imported_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.import_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  error_type TEXT NOT NULL,             -- 'validation', 'duplicate', 'missing_field'
  field_name TEXT,
  raw_value TEXT,
  error_message TEXT NOT NULL,
  raw_row_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEQUENCES FOR FORMATTED NUMBERS
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS delivery_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;

-- Functions to generate formatted numbers
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
  SELECT 'BCG-' || LPAD(nextval('customer_code_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
  SELECT 'BGS-ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TEXT AS $$
  SELECT 'BGS-DLV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('delivery_number_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
  SELECT 'BGS-INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
  SELECT 'BGS-PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('payment_number_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_customers_code ON public.customers(customer_code);
CREATE INDEX idx_customers_consumer_number ON public.customers(consumer_number);
CREATE INDEX idx_customers_name ON public.customers USING gin(to_tsvector('english', customer_name || ' ' || COALESCE(business_name, '')));
CREATE INDEX idx_customers_category ON public.customers(category);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_mobile ON public.customers(mobile);
CREATE INDEX idx_customers_created_at ON public.customers(created_at DESC);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_date ON public.orders(order_date DESC);
CREATE INDEX idx_orders_number ON public.orders(order_number);

CREATE INDEX idx_deliveries_customer ON public.deliveries(customer_id);
CREATE INDEX idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX idx_deliveries_date ON public.deliveries(delivery_date DESC);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX idx_payments_customer ON public.payments(customer_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date DESC);

CREATE INDEX idx_ledger_customer ON public.ledger_entries(customer_id);
CREATE INDEX idx_ledger_date ON public.ledger_entries(entry_date DESC);
CREATE INDEX idx_ledger_type ON public.ledger_entries(entry_type);

CREATE INDEX idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff can view their own profile
CREATE POLICY "Users view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Authenticated users can read customers
CREATE POLICY "Auth users read customers" ON public.customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin/manager/sales can modify customers
CREATE POLICY "Privileged users modify customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'manager', 'sales_staff')
      AND up.is_active = true
    )
  );

-- Products: all authenticated users can read
CREATE POLICY "Auth users read products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Orders: all auth users can read; accounts/admin can post
CREATE POLICY "Auth users read orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff manage orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'manager', 'sales_staff')
      AND up.is_active = true
    )
  );

-- Invoices: accounts staff manage
CREATE POLICY "Auth users read invoices" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Accounts manage invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'accounts_staff')
      AND up.is_active = true
    )
  );

-- Payments: accounts staff manage
CREATE POLICY "Auth users read payments" ON public.payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Accounts manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin', 'accounts_staff')
      AND up.is_active = true
    )
  );

-- Ledger: read-only for all staff
CREATE POLICY "Auth users read ledger" ON public.ledger_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System writes ledger" ON public.ledger_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit logs: admin view only
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System writes audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- DEFAULT PERMISSIONS SEED
-- ============================================================

INSERT INTO public.permissions (role, resource, can_view, can_create, can_edit, can_delete, can_approve, can_export) VALUES
  -- Super Admin: full access
  ('super_admin', 'customers', true, true, true, true, true, true),
  ('super_admin', 'orders', true, true, true, true, true, true),
  ('super_admin', 'deliveries', true, true, true, true, true, true),
  ('super_admin', 'invoices', true, true, true, true, true, true),
  ('super_admin', 'payments', true, true, true, true, true, true),
  ('super_admin', 'products', true, true, true, true, true, true),
  ('super_admin', 'rates', true, true, true, true, true, true),
  ('super_admin', 'reports', true, true, true, true, true, true),
  ('super_admin', 'users', true, true, true, true, true, true),
  ('super_admin', 'audit_logs', true, false, false, false, false, true),
  ('super_admin', 'settings', true, true, true, true, true, true),
  -- Admin
  ('admin', 'customers', true, true, true, false, true, true),
  ('admin', 'orders', true, true, true, false, true, true),
  ('admin', 'deliveries', true, true, true, false, true, true),
  ('admin', 'invoices', true, true, true, false, true, true),
  ('admin', 'payments', true, true, true, false, true, true),
  ('admin', 'products', true, true, true, false, false, true),
  ('admin', 'rates', true, true, true, false, true, true),
  ('admin', 'reports', true, false, false, false, false, true),
  ('admin', 'users', true, true, true, false, false, false),
  -- Manager
  ('manager', 'customers', true, true, true, false, false, true),
  ('manager', 'orders', true, true, true, false, true, true),
  ('manager', 'deliveries', true, true, true, false, false, true),
  ('manager', 'invoices', true, true, false, false, false, true),
  ('manager', 'payments', true, true, false, false, false, true),
  ('manager', 'products', true, false, false, false, false, false),
  ('manager', 'reports', true, false, false, false, false, true),
  -- Sales Staff
  ('sales_staff', 'customers', true, true, true, false, false, false),
  ('sales_staff', 'orders', true, true, false, false, false, false),
  ('sales_staff', 'deliveries', true, false, false, false, false, false),
  -- Accounts Staff
  ('accounts_staff', 'customers', true, false, false, false, false, true),
  ('accounts_staff', 'invoices', true, true, true, false, false, true),
  ('accounts_staff', 'payments', true, true, true, false, false, true),
  ('accounts_staff', 'reports', true, false, false, false, false, true),
  -- Dispatch Staff
  ('dispatch_staff', 'orders', true, false, false, false, false, false),
  ('dispatch_staff', 'deliveries', true, true, true, false, false, false);

