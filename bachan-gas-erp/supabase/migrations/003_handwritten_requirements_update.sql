-- ============================================================
-- BACHAN GAS SERVICE ERP — Handwritten Requirements Update
-- Migration 003: SAP Customer Code, Basic Rate Master History,
-- Customer Advance Balances, Consumption Analytics & Domestic/Commercial
-- ============================================================

-- 1. ADD SAP CUSTOMER CODE & FINANCIAL ADVANCE BALANCE TO CUSTOMERS
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS sap_code TEXT,
  ADD COLUMN IF NOT EXISTS advance_balance NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS average_daily_consumption NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS average_weekly_consumption NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS average_monthly_consumption NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS average_order_qty NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS average_days_between_orders NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS last_supply_date DATE;

-- Index for instant lookup by SAP Code
CREATE INDEX IF NOT EXISTS idx_customers_sap_code ON public.customers (sap_code);
CREATE INDEX IF NOT EXISTS idx_customers_category ON public.customers (category);

-- 2. BASIC RATE MASTER HISTORY TABLE (For 6 Approved LPG Products)
CREATE TABLE IF NOT EXISTS public.basic_rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  basic_rate NUMERIC(10,2) NOT NULL, -- GST-exclusive rate per cylinder/unit
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basic_rate_product ON public.basic_rate_history (product_id);
CREATE INDEX IF NOT EXISTS idx_basic_rate_effective ON public.basic_rate_history (effective_from);

-- 3. CUSTOMER RATE MASTER ENHANCEMENTS
ALTER TABLE public.customer_rates
  ADD COLUMN IF NOT EXISTS sap_code TEXT,
  ADD COLUMN IF NOT EXISTS previous_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS rate_history JSONB DEFAULT '[]'::jsonb;

-- 4. ORDER EXTENSION: SAP CODE & ISSUED QUANTITY
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sap_code TEXT,
  ADD COLUMN IF NOT EXISTS qty_issued INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS empty_received_on_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS empty_pending_snapshot INTEGER DEFAULT 0;
