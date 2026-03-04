/*
  # Criar Tabelas Relacionadas a Business Partners
  
  Cria as tabelas business_partner_contacts e business_partner_addresses
  que o código está referenciando mas não existem no banco
*/

-- Tabela de contatos de parceiros de negócios
CREATE TABLE IF NOT EXISTS business_partner_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES saas_organizations(id),
  environment_id uuid NOT NULL REFERENCES saas_environments(id),
  name text NOT NULL,
  role text,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de endereços de parceiros de negócios
CREATE TABLE IF NOT EXISTS business_partner_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES saas_organizations(id),
  environment_id uuid NOT NULL REFERENCES saas_environments(id),
  address_type text NOT NULL CHECK (address_type IN ('billing', 'shipping', 'both')),
  street text NOT NULL,
  number text,
  complement text,
  neighborhood text,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text DEFAULT 'Brasil',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bp_contacts_partner ON business_partner_contacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_bp_contacts_org_env ON business_partner_contacts(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_bp_addresses_partner ON business_partner_addresses(partner_id);
CREATE INDEX IF NOT EXISTS idx_bp_addresses_org_env ON business_partner_addresses(organization_id, environment_id);

-- Habilitar RLS
ALTER TABLE business_partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partner_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contacts
CREATE POLICY "Users can view contacts in their org/env"
  ON business_partner_contacts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts in their org/env"
  ON business_partner_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in their org/env"
  ON business_partner_contacts FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts in their org/env"
  ON business_partner_contacts FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Políticas RLS para addresses
CREATE POLICY "Users can view addresses in their org/env"
  ON business_partner_addresses FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert addresses in their org/env"
  ON business_partner_addresses FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update addresses in their org/env"
  ON business_partner_addresses FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete addresses in their org/env"
  ON business_partner_addresses FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
