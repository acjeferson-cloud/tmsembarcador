-- Migration for Tracking Events and Outbound Webhooks Queue

CREATE TABLE IF NOT EXISTS public.tracking_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.saas_organizations(id),
    environment_id uuid REFERENCES public.saas_environments(id),
    cte_id uuid REFERENCES public.ctes_complete(id) ON DELETE SET NULL,
    invoice_id uuid REFERENCES public.invoices_nfe(id) ON DELETE SET NULL,
    carrier_cnpj text,
    status_code text NOT NULL,
    event_date timestamp with time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outbound_webhooks_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.saas_organizations(id),
    environment_id uuid REFERENCES public.saas_environments(id),
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending',
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_webhooks_queue ENABLE ROW LEVEL SECURITY;

-- Policy for Tracking Events
CREATE POLICY "Tracking Events Select"
ON public.tracking_events
FOR SELECT
TO public
USING (
  organization_id IS NOT NULL AND
  (
    current_setting('app.current_organization_id', true) IS NULL
    OR organization_id::text = current_setting('app.current_organization_id', true)
    OR organization_id::text = (current_setting('request.jwt.claims', true)::json->>'org_id')
  )
);

CREATE POLICY "Tracking Events Insert"
ON public.tracking_events
FOR INSERT
TO public
WITH CHECK (
  organization_id IS NOT NULL AND
  (
    current_setting('app.current_organization_id', true) IS NULL
    OR organization_id::text = current_setting('app.current_organization_id', true)
    OR organization_id::text = (current_setting('request.jwt.claims', true)::json->>'org_id')
  )
);

-- Policy for Webhooks Queue
CREATE POLICY "Webhooks Queue Select"
ON public.outbound_webhooks_queue
FOR SELECT
TO public
USING (
  organization_id IS NOT NULL AND
  (
    current_setting('app.current_organization_id', true) IS NULL
    OR organization_id::text = current_setting('app.current_organization_id', true)
    OR organization_id::text = (current_setting('request.jwt.claims', true)::json->>'org_id')
  )
);

CREATE POLICY "Webhooks Queue Insert"
ON public.outbound_webhooks_queue
FOR INSERT
TO public
WITH CHECK (
  organization_id IS NOT NULL AND
  (
    current_setting('app.current_organization_id', true) IS NULL
    OR organization_id::text = current_setting('app.current_organization_id', true)
    OR organization_id::text = (current_setting('request.jwt.claims', true)::json->>'org_id')
  )
);

-- Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_invoice ON public.tracking_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_cte ON public.tracking_events(cte_id);
CREATE INDEX IF NOT EXISTS idx_outbound_webhooks_status ON public.outbound_webhooks_queue(status);
