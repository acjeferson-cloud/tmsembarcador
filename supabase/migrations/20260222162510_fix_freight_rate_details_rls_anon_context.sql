/*
  # Corrigir RLS da freight_rate_details para permitir anônimo com context

  1. Alterações
    - Remove políticas antigas complexas
    - Cria novas políticas simplificadas que verificam via freight_rates
    - Suporta operações via cliente anônimo quando context está configurado

  2. Segurança
    - Mantém isolamento via freight_rates parent
*/

-- Remover políticas antigas
DROP POLICY IF EXISTS "freight_rate_details_select_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_insert_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_update_policy" ON freight_rate_details;
DROP POLICY IF EXISTS "freight_rate_details_delete_policy" ON freight_rate_details;

-- Política de SELECT
CREATE POLICY "freight_rate_details_select_anon_context"
  ON freight_rate_details
  FOR SELECT
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de INSERT
CREATE POLICY "freight_rate_details_insert_anon_context"
  ON freight_rate_details
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de UPDATE
CREATE POLICY "freight_rate_details_update_anon_context"
  ON freight_rate_details
  FOR UPDATE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );

-- Política de DELETE
CREATE POLICY "freight_rate_details_delete_anon_context"
  ON freight_rate_details
  FOR DELETE
  USING (
    current_setting('app.current_organization_id', true) IS NOT NULL
    AND current_setting('app.current_environment_id', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM freight_rates fr
      WHERE fr.id = freight_rate_details.freight_rate_id
      AND fr.organization_id::text = current_setting('app.current_organization_id', true)
      AND fr.environment_id::text = current_setting('app.current_environment_id', true)
    )
  );
