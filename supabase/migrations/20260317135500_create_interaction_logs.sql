-- Create interaction_logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES saas_organizations(id),
    environment_id uuid REFERENCES saas_environments(id),
    invoice_id uuid REFERENCES invoices_nfe(id) ON DELETE CASCADE,
    invoice_number text,
    business_partner_id uuid REFERENCES business_partners(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES business_partner_contacts(id) ON DELETE SET NULL,
    contact_name text,
    channel text CHECK (channel IN ('whatsapp', 'email')),
    event_type text,
    occurrence_code text,
    status text CHECK (status IN ('success', 'error', 'pending')),
    log_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interaction_logs_org_env ON interaction_logs(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_business_partner ON interaction_logs(business_partner_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_invoice ON interaction_logs(invoice_id);

-- Enable RLS
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view interaction logs from their org/env"
    ON interaction_logs FOR SELECT
    TO authenticated
    USING (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND environment_id = current_setting('app.environment_id', true)::uuid
    );

CREATE POLICY "Users can insert interaction logs in their org/env"
    ON interaction_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id = current_setting('app.organization_id', true)::uuid
        AND environment_id = current_setting('app.environment_id', true)::uuid
    );

-- Allow anon insertions for internal tracking and function triggers
CREATE POLICY "Anon can insert interaction logs"
    ON interaction_logs FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can view interaction logs"
    ON interaction_logs FOR SELECT
    TO anon
    USING (true);
