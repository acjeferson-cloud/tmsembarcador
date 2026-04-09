-- Create import_logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_success INTEGER NOT NULL DEFAULT 0,
    records_error INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    errors JSONB,
    summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create freight_adjustments table
CREATE TABLE IF NOT EXISTS public.freight_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_type VARCHAR(50) NOT NULL,
    adjustment_value NUMERIC(10,4),
    affected_tables INTEGER NOT NULL DEFAULT 0,
    affected_routes INTEGER NOT NULL DEFAULT 0,
    previous_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies for import_logs
CREATE POLICY "Users can view their own firm's import logs or all if admin"
    ON public.import_logs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert import logs"
    ON public.import_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update import logs"
    ON public.import_logs FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policies for freight_adjustments
CREATE POLICY "Users can view freight adjustments"
    ON public.freight_adjustments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert freight adjustments"
    ON public.freight_adjustments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON public.import_logs TO authenticated;
GRANT ALL ON public.freight_adjustments TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.import_logs TO service_role;
GRANT ALL ON public.freight_adjustments TO service_role;
