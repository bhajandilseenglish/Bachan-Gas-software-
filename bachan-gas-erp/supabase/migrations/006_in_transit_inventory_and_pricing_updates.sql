-- ============================================================================
-- BACHAN GAS SERVICE ERP — MIGRATION 006
-- IN-TRANSIT INVENTORY, PER-KG PRICING MASTER & PILOT CUSTOMERS WORKFLOW
-- ============================================================================

-- 1. In-Transit Shipments Header Table
CREATE TABLE IF NOT EXISTS public.in_transit_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_num VARCHAR(50) UNIQUE NOT NULL, -- e.g. BGS-SHP-2026-00001
    supplier_source VARCHAR(255) NOT NULL, -- e.g. IOCL Bottling Plant, Jalandhar
    warehouse_destination VARCHAR(255) NOT NULL DEFAULT 'Main Godown, Ludhiana',
    total_dispatched INTEGER NOT NULL CHECK (total_dispatched >= 0),
    total_received INTEGER NOT NULL DEFAULT 0 CHECK (total_received >= 0),
    total_in_transit INTEGER NOT NULL CHECK (total_in_transit >= 0),
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_arrival_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transporter VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    challan_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_transit' CHECK (status IN ('planned', 'dispatched', 'in_transit', 'partially_received', 'fully_received', 'cancelled')),
    recorded_by VARCHAR(255) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 2. In-Transit Shipment Items Table
CREATE TABLE IF NOT EXISTS public.in_transit_shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.in_transit_shipments(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    reference_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 19.0,
    qty_dispatched INTEGER NOT NULL CHECK (qty_dispatched >= 0),
    qty_received INTEGER NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
    qty_in_transit INTEGER NOT NULL CHECK (qty_in_transit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 3. In-Transit Physical Receipt Logs Table
CREATE TABLE IF NOT EXISTS public.in_transit_receipt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.in_transit_shipments(id) ON DELETE CASCADE,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_received INTEGER NOT NULL CHECK (total_received > 0),
    condition VARCHAR(100) NOT NULL DEFAULT 'Good - Sound Valves',
    received_by VARCHAR(255) NOT NULL,
    remarks TEXT,
    stock_movement_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 4. Add Rate Per KG to Products Master & Customer Rates
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS rate_per_kg NUMERIC(10, 2);

ALTER TABLE public.customer_rates
    ADD COLUMN IF NOT EXISTS rate_per_kg NUMERIC(10, 2);

-- 5. Add Pilot Account Flags to Customers Table
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pilot_status VARCHAR(50) DEFAULT 'not_pilot',
    ADD COLUMN IF NOT EXISTS pilot_notes TEXT;

-- 6. Indexes for Performance & Tracking
CREATE INDEX IF NOT EXISTS idx_in_transit_shipments_status ON public.in_transit_shipments(status);
CREATE INDEX IF NOT EXISTS idx_in_transit_shipments_dates ON public.in_transit_shipments(dispatch_date, expected_arrival_date);
CREATE INDEX IF NOT EXISTS idx_in_transit_shipment_items_shp ON public.in_transit_shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_customers_pilot ON public.customers(is_pilot);

-- 7. Enable RLS and Configure Security
ALTER TABLE public.in_transit_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_transit_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_transit_receipt_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated staff and admin"
    ON public.in_transit_shipments FOR SELECT
    USING (true);

CREATE POLICY "Enable write access for authorized staff and admin"
    ON public.in_transit_shipments FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for shipment items"
    ON public.in_transit_shipment_items FOR SELECT
    USING (true);

CREATE POLICY "Enable write access for shipment items"
    ON public.in_transit_shipment_items FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for receipt logs"
    ON public.in_transit_receipt_logs FOR SELECT
    USING (true);

CREATE POLICY "Enable write access for receipt logs"
    ON public.in_transit_receipt_logs FOR ALL
    USING (true)
    WITH CHECK (true);
