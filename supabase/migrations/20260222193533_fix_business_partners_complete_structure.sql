/*
  # Completar estrutura da tabela business_partners

  1. Alterações
    - Adicionar coluna website para armazenar site do parceiro
    - Adicionar coluna regime_tributario para informações fiscais
    - Adicionar coluna prazo_pagamento para condições comerciais
    - Adicionar state_id e country_id para referências às tabelas de localização
    
  2. Segurança
    - Manter RLS policies existentes
*/

-- Adicionar coluna website
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'website'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN website TEXT;
  END IF;
END $$;

-- Adicionar coluna regime_tributario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'regime_tributario'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN regime_tributario TEXT;
  END IF;
END $$;

-- Adicionar coluna prazo_pagamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'prazo_pagamento'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN prazo_pagamento INTEGER DEFAULT 30;
  END IF;
END $$;

-- Adicionar coluna state_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'state_id'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN state_id UUID REFERENCES states(id);
  END IF;
END $$;

-- Adicionar coluna country_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_partners' AND column_name = 'country_id'
  ) THEN
    ALTER TABLE business_partners ADD COLUMN country_id UUID REFERENCES countries(id);
  END IF;
END $$;
