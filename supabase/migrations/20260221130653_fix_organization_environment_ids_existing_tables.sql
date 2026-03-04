/*
  # Corrigir Organization/Environment IDs nas Tabelas Existentes
  
  Atualiza apenas as tabelas que existem
*/

-- Atualizar occurrences (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'occurrences') THEN
    UPDATE occurrences
    SET 
      organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
      environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
      updated_at = now()
    WHERE organization_id = '3c206ee0-25d7-4d70-9278-074fd6f16a8b';
  END IF;
END $$;

-- Atualizar rejection_reasons (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rejection_reasons') THEN
    UPDATE rejection_reasons
    SET 
      organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
      environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
      updated_at = now()
    WHERE organization_id = '3c206ee0-25d7-4d70-9278-074fd6f16a8b';
  END IF;
END $$;

-- Atualizar freight_rates (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'freight_rates') THEN
    UPDATE freight_rates
    SET 
      organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
      environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
      updated_at = now()
    WHERE organization_id = '3c206ee0-25d7-4d70-9278-074fd6f16a8b';
  END IF;
END $$;

-- Atualizar business_partner_contacts (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_partner_contacts') THEN
    UPDATE business_partner_contacts
    SET 
      organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
      environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
      updated_at = now()
    WHERE organization_id = '3c206ee0-25d7-4d70-9278-074fd6f16a8b';
  END IF;
END $$;

-- Atualizar business_partner_addresses (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_partner_addresses') THEN
    UPDATE business_partner_addresses
    SET 
      organization_id = 'ddbbb51d-6134-420f-a28c-bcbc27269239',
      environment_id = '2989afa7-5010-419b-bb43-7f2cd559628a',
      updated_at = now()
    WHERE organization_id = '3c206ee0-25d7-4d70-9278-074fd6f16a8b';
  END IF;
END $$;
