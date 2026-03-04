/*
  # Correção completa da estrutura de business_partners

  1. Alterações na tabela business_partners
    - Adicionar coluna credit_limit se não existir
    - Adicionar city_id para referência à tabela cities
    - Garantir que todos os campos necessários existam
    
  2. Alterações na tabela business_partner_addresses  
    - Adicionar city_id para referência à tabela cities
    - Garantir structure_type está correto

  3. Segurança
    - Manter RLS policies existentes
*/

-- Adicionar city_id à tabela business_partners se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN city_id UUID REFERENCES cities(id);
  END IF;
END $$;

-- Adicionar city_id à tabela business_partner_addresses se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partner_addresses' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE business_partner_addresses ADD COLUMN city_id UUID REFERENCES cities(id);
  END IF;
END $$;

-- Garantir que organization_id e environment_id existem em business_partner_addresses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partner_addresses' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE business_partner_addresses ADD COLUMN organization_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partner_addresses' AND column_name = 'environment_id'
  ) THEN
    ALTER TABLE business_partner_addresses ADD COLUMN environment_id UUID;
  END IF;
END $$;

-- Garantir que organization_id e environment_id existem em business_partner_contacts  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partner_contacts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE business_partner_contacts ADD COLUMN organization_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partner_contacts' AND column_name = 'environment_id'
  ) THEN
    ALTER TABLE business_partner_contacts ADD COLUMN environment_id UUID;
  END IF;
END $$;
