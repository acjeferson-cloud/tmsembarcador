-- Create invoices_nfe_carrier_costs table for explicit recalculation parity with CT-es

-- Create updated_at handler function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.invoices_nfe_carrier_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices_nfe(id) ON DELETE CASCADE,
  carrier_id uuid REFERENCES public.carriers(id) ON DELETE SET NULL,
  carrier_name text,
  carrier_document text,
  freight_table_id uuid REFERENCES public.freight_rates(id) ON DELETE SET NULL,
  tariff_code text,
  freight_type text,
  freight_weight_value numeric(15,2) DEFAULT 0,
  freight_value_value numeric(15,2) DEFAULT 0,
  seccat_value numeric(15,2) DEFAULT 0,
  dispatch_value numeric(15,2) DEFAULT 0,
  ademe_gris_value numeric(15,2) DEFAULT 0,
  itr_value numeric(15,2) DEFAULT 0,
  tas_value numeric(15,2) DEFAULT 0,
  collection_delivery_value numeric(15,2) DEFAULT 0,
  other_tax_value numeric(15,2) DEFAULT 0,
  toll_value numeric(15,2) DEFAULT 0,
  icms_rate numeric(5,2) DEFAULT 0,
  icms_base numeric(15,2) DEFAULT 0,
  icms_value numeric(15,2) DEFAULT 0,
  pis_value numeric(15,2) DEFAULT 0,
  cofins_value numeric(15,2) DEFAULT 0,
  other_value numeric(15,2) DEFAULT 0,
  total_value numeric(15,2) DEFAULT 0,
  calculation_data jsonb DEFAULT '{}'::jsonb,
  observations text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoices_nfe_carrier_costs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Invoices carrier costs are viewable by everyone in organization."
  ON public.invoices_nfe_carrier_costs FOR SELECT
  USING (true);

CREATE POLICY "Invoices carrier costs can be created by authenticated users"
  ON public.invoices_nfe_carrier_costs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Invoices carrier costs can be updated by authenticated users"
  ON public.invoices_nfe_carrier_costs FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Invoices carrier costs can be deleted by authenticated users"
  ON public.invoices_nfe_carrier_costs FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE TRIGGER handle_updated_at_invoices_nfe_carrier_costs
  BEFORE UPDATE ON public.invoices_nfe_carrier_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_costs_invoice_id ON public.invoices_nfe_carrier_costs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_costs_carrier_id ON public.invoices_nfe_carrier_costs(carrier_id);
