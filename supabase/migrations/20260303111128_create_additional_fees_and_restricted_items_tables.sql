/*
  # Create Additional Fees and Restricted Items Tables

  1. New Tables
    - `freight_rate_additional_fees`
      - Stores additional fees (TDA, TDE, TRT) for freight rate tables
      - Supports filtering by business partner, state, and city
      - Multiple value types: fixed, percentage of weight/value/CT-e
      - Includes minimum value enforcement
      - Full multi-tenant isolation with organization_id and environment_id
    
    - `freight_rate_restricted_items`
      - Stores items that cannot be transported by a specific freight rate
      - Links to freight_rates table
      - Includes item codes, NCM, EAN, and descriptions
      - Full multi-tenant isolation with organization_id and environment_id

  2. Security
    - Enable RLS on both tables
    - Policies allow access based on organization and environment context
    - Support for both authenticated and anonymous users with proper context

  3. Indexes
    - Performance indexes on foreign keys and lookup columns
    - Multi-tenant isolation indexes on organization_id and environment_id
*/

-- ============================================================================
-- TABLE: freight_rate_additional_fees
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.freight_rate_additional_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  freight_rate_table_id uuid NOT NULL,
  freight_rate_id uuid,
  business_partner_id uuid,
  state_id uuid,
  
  -- Multi-tenant isolation
  organization_id uuid NOT NULL,
  environment_id uuid NOT NULL,
  
  -- Fee Configuration
  fee_type text NOT NULL CHECK (fee_type IN ('TDA', 'TDE', 'TRT')),
  consider_cnpj_root boolean DEFAULT false NOT NULL,
  city_id text,
  
  -- Value Configuration
  fee_value numeric(10,2) NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('fixed', 'percent_weight', 'percent_value', 'percent_weight_value', 'percent_cte')),
  minimum_value numeric(10,2) DEFAULT 0 NOT NULL,
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid,
  updated_by uuid
);

-- Add foreign key constraints
ALTER TABLE public.freight_rate_additional_fees
  ADD CONSTRAINT freight_rate_additional_fees_table_fkey 
    FOREIGN KEY (freight_rate_table_id) 
    REFERENCES public.freight_rate_tables(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_additional_fees_rate_fkey 
    FOREIGN KEY (freight_rate_id) 
    REFERENCES public.freight_rates(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_additional_fees_organization_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES public.saas_organizations(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_additional_fees_environment_fkey 
    FOREIGN KEY (environment_id) 
    REFERENCES public.saas_environments(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_additional_fees_partner_fkey 
    FOREIGN KEY (business_partner_id) 
    REFERENCES public.business_partners(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_additional_fees_state_fkey 
    FOREIGN KEY (state_id) 
    REFERENCES public.states(id) 
    ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_freight_rate_additional_fees_table 
  ON public.freight_rate_additional_fees(freight_rate_table_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_additional_fees_rate 
  ON public.freight_rate_additional_fees(freight_rate_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_additional_fees_org_env 
  ON public.freight_rate_additional_fees(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_additional_fees_partner 
  ON public.freight_rate_additional_fees(business_partner_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_additional_fees_state 
  ON public.freight_rate_additional_fees(state_id);

-- ============================================================================
-- TABLE: freight_rate_restricted_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.freight_rate_restricted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  freight_rate_id uuid NOT NULL,
  
  -- Multi-tenant isolation
  organization_id uuid NOT NULL,
  environment_id uuid NOT NULL,
  
  -- Item Information
  item_code text NOT NULL CHECK (char_length(item_code) <= 50),
  item_description text NOT NULL CHECK (char_length(item_description) <= 200),
  ncm_code text CHECK (ncm_code IS NULL OR char_length(ncm_code) <= 50),
  ean_code text CHECK (ean_code IS NULL OR char_length(ean_code) <= 50),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE public.freight_rate_restricted_items
  ADD CONSTRAINT freight_rate_restricted_items_rate_fkey 
    FOREIGN KEY (freight_rate_id) 
    REFERENCES public.freight_rates(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_restricted_items_organization_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES public.saas_organizations(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT freight_rate_restricted_items_environment_fkey 
    FOREIGN KEY (environment_id) 
    REFERENCES public.saas_environments(id) 
    ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_freight_rate_restricted_items_rate 
  ON public.freight_rate_restricted_items(freight_rate_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_restricted_items_org_env 
  ON public.freight_rate_restricted_items(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_freight_rate_restricted_items_item_code 
  ON public.freight_rate_restricted_items(item_code);
CREATE INDEX IF NOT EXISTS idx_freight_rate_restricted_items_ncm 
  ON public.freight_rate_restricted_items(ncm_code) WHERE ncm_code IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.freight_rate_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_rate_restricted_items ENABLE ROW LEVEL SECURITY;

-- Policies for freight_rate_additional_fees
CREATE POLICY "Allow SELECT with org/env context" ON public.freight_rate_additional_fees
  FOR SELECT
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow INSERT with org/env context" ON public.freight_rate_additional_fees
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow UPDATE with org/env context" ON public.freight_rate_additional_fees
  FOR UPDATE
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow DELETE with org/env context" ON public.freight_rate_additional_fees
  FOR DELETE
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

-- Policies for freight_rate_restricted_items
CREATE POLICY "Allow SELECT with org/env context" ON public.freight_rate_restricted_items
  FOR SELECT
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow INSERT with org/env context" ON public.freight_rate_restricted_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow UPDATE with org/env context" ON public.freight_rate_restricted_items
  FOR UPDATE
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  )
  WITH CHECK (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );

CREATE POLICY "Allow DELETE with org/env context" ON public.freight_rate_restricted_items
  FOR DELETE
  TO anon, authenticated
  USING (
    organization_id::text = current_setting('app.current_organization_id', true) AND
    environment_id::text = current_setting('app.current_environment_id', true)
  );
