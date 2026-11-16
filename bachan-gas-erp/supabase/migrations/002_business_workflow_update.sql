-- ============================================================
-- BACHAN GAS SERVICE ERP — Business Workflow Update
-- Migration 002: Exactly 6 active LPG products, 18% GST billing,
-- Empty cylinder tracking, Rate change workflow, Inactivity alerts
-- ============================================================

-- 1. DEACTIVATE HISTORICAL PRODUCTS (Preserve records, don't delete)
UPDATE public.products
SET is_active = false
WHERE product_code NOT IN ('LPG-475-LOT', 'LPG-475-VOT', 'LPG-425-JUMBO', 'LPG-190-NANO', 'LPG-190-XTRATEJ', 'LPG-190-NORMAL');

-- 2. INSERT EXACTLY 6 ACTIVE LPG PRODUCTS (Per-unit / cylinder, 18% GST)
INSERT INTO public.products (
  product_code, product_name, cylinder_type, net_weight_kg, sku, default_rate, tax_rate_pct, hsn_code, is_active
)
VALUES
  ('LPG-475-LOT', '47.5kg LOT', 'Commercial', 47.5, 'BGS-LOT-475', 0, 18.00, '27111900', true),
  ('LPG-475-VOT', '47.5kg VOT', 'Commercial', 47.5, 'BGS-VOT-475', 0, 18.00, '27111900', true),
  ('LPG-425-JUMBO', '425kg jumbo', 'Commercial', 425.0, 'BGS-JMB-425', 0, 18.00, '27111900', true),
  ('LPG-190-NANO', '19kg nano cut', 'Commercial', 19.0, 'BGS-NNO-190', 0, 18.00, '27111900', true),
  ('LPG-190-XTRATEJ', '19 kg extra tej', 'Commercial', 19.0, 'BGS-XTJ-190', 0, 18.00, '27111900', true),
  ('LPG-190-NORMAL', '19 kg normal', 'Commercial', 19.0, 'BGS-NRM-190', 0, 18.00, '27111900', true)
ON CONFLICT (product_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  cylinder_type = EXCLUDED.cylinder_type,
  sku = EXCLUDED.sku,
  tax_rate_pct = 18.00,
  is_active = true,
  updated_at = NOW();

-- 3. CUSTOMER EXTENSIONS: ORDER FREQUENCY, TENURE, CYLINDER BALANCE
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS ordering_frequency TEXT DEFAULT 'not_configured',
  ADD COLUMN IF NOT EXISTS custom_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS expected_next_order_date DATE,
  ADD COLUMN IF NOT EXISTS last_qualifying_order_date DATE,
  ADD COLUMN IF NOT EXISTS last_qualifying_order_qty INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_order_alert_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_pause_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_tenure_days INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS empty_cylinders_pending INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_filled_delivered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_empty_received INTEGER DEFAULT 0;

-- 4. EMPTY CYLINDER EXCHANGE LEDGER
CREATE TABLE IF NOT EXISTS public.cylinder_exchange_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  delivery_id UUID REFERENCES public.deliveries(id),
  delivery_date DATE,
  filled_delivered INTEGER NOT NULL DEFAULT 0,
  empty_received INTEGER NOT NULL DEFAULT 0,
  empty_pending INTEGER NOT NULL DEFAULT 0,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  recorded_by TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cylinder_exchange_customer ON public.cylinder_exchange_records(customer_id);

-- 5. STAFF RATE CHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.rate_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  existing_rate NUMERIC(12,2),
  requested_rate NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_requests_status ON public.rate_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_rate_requests_customer ON public.rate_change_requests(customer_id);

-- 6. CUSTOMER MISSED ORDER ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.customer_missed_order_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  mobile TEXT,
  expected_order_date DATE NOT NULL,
  last_order_date DATE,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  last_ordered_qty INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'contacted' | 'resolved' | 'snoozed'
  snoozed_until DATE,
  resolved_at TIMESTAMPTZ,
  resolved_by_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missed_alerts_status ON public.customer_missed_order_alerts(status);
CREATE INDEX IF NOT EXISTS idx_missed_alerts_customer ON public.customer_missed_order_alerts(customer_id);

-- 7. CUSTOMER FOLLOW-UP LOG TABLE
CREATE TABLE IF NOT EXISTS public.customer_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.customer_missed_order_alerts(id) ON DELETE SET NULL,
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result TEXT NOT NULL, -- 'will_order_tomorrow' | 'sufficient_stock' | 'temporarily_closed' | 'changed_supplier' | 'unable_to_contact' | 'other'
  notes TEXT,
  next_follow_up_date DATE,
  assigned_staff TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_customer ON public.customer_follow_ups(customer_id);
