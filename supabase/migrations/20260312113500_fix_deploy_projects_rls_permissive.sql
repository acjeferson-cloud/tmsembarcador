/*
  # Correção de RLS para Tabelas do Deploy Agent (Centro de Implantação)

  Este arquivo sobreescreve as políticas existentes para permitir que
  as tabelas relogadas ao deploy agent possam ser manipuladas sem erro 42501.
*/

-- Deploy Projects
ALTER TABLE deploy_projects ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE deploy_projects ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE deploy_projects DROP CONSTRAINT IF EXISTS deploy_projects_status_check;
ALTER TABLE deploy_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deploy_projects_select" ON deploy_projects;
DROP POLICY IF EXISTS "deploy_projects_insert" ON deploy_projects;
DROP POLICY IF EXISTS "deploy_projects_update" ON deploy_projects;
DROP POLICY IF EXISTS "deploy_projects_delete" ON deploy_projects;

CREATE POLICY "deploy_projects_select" ON deploy_projects FOR SELECT USING (true);
CREATE POLICY "deploy_projects_insert" ON deploy_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "deploy_projects_update" ON deploy_projects FOR UPDATE USING (true);
CREATE POLICY "deploy_projects_delete" ON deploy_projects FOR DELETE USING (true);

-- Deploy Uploads
ALTER TABLE deploy_uploads ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE deploy_uploads ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE deploy_uploads DROP CONSTRAINT IF EXISTS deploy_uploads_status_check;
ALTER TABLE deploy_uploads DROP CONSTRAINT IF EXISTS deploy_uploads_data_category_check;
ALTER TABLE deploy_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deploy_uploads_select" ON deploy_uploads;
DROP POLICY IF EXISTS "deploy_uploads_insert" ON deploy_uploads;
DROP POLICY IF EXISTS "deploy_uploads_update" ON deploy_uploads;
DROP POLICY IF EXISTS "deploy_uploads_delete" ON deploy_uploads;

CREATE POLICY "deploy_uploads_select" ON deploy_uploads FOR SELECT USING (true);
CREATE POLICY "deploy_uploads_insert" ON deploy_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "deploy_uploads_update" ON deploy_uploads FOR UPDATE USING (true);
CREATE POLICY "deploy_uploads_delete" ON deploy_uploads FOR DELETE USING (true);

-- Deploy Interpretations
ALTER TABLE deploy_interpretations ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE deploy_interpretations ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE deploy_interpretations DROP CONSTRAINT IF EXISTS deploy_interpretations_confidence_level_check;
ALTER TABLE deploy_interpretations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deploy_interpretations_select" ON deploy_interpretations;
DROP POLICY IF EXISTS "deploy_interpretations_insert" ON deploy_interpretations;
DROP POLICY IF EXISTS "deploy_interpretations_update" ON deploy_interpretations;
DROP POLICY IF EXISTS "deploy_interpretations_delete" ON deploy_interpretations;

CREATE POLICY "deploy_interpretations_select" ON deploy_interpretations FOR SELECT USING (true);
CREATE POLICY "deploy_interpretations_insert" ON deploy_interpretations FOR INSERT WITH CHECK (true);
CREATE POLICY "deploy_interpretations_update" ON deploy_interpretations FOR UPDATE USING (true);
CREATE POLICY "deploy_interpretations_delete" ON deploy_interpretations FOR DELETE USING (true);

-- Deploy Validations
ALTER TABLE deploy_validations ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE deploy_validations ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE deploy_validations DROP CONSTRAINT IF EXISTS deploy_validations_validation_type_check;
ALTER TABLE deploy_validations DROP CONSTRAINT IF EXISTS deploy_validations_severity_check;
ALTER TABLE deploy_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deploy_validations_select" ON deploy_validations;
DROP POLICY IF EXISTS "deploy_validations_insert" ON deploy_validations;
DROP POLICY IF EXISTS "deploy_validations_update" ON deploy_validations;
DROP POLICY IF EXISTS "deploy_validations_delete" ON deploy_validations;

CREATE POLICY "deploy_validations_select" ON deploy_validations FOR SELECT USING (true);
CREATE POLICY "deploy_validations_insert" ON deploy_validations FOR INSERT WITH CHECK (true);
CREATE POLICY "deploy_validations_update" ON deploy_validations FOR UPDATE USING (true);
CREATE POLICY "deploy_validations_delete" ON deploy_validations FOR DELETE USING (true);

-- Deploy Suggestions
ALTER TABLE deploy_suggestions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE deploy_suggestions ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE deploy_suggestions DROP CONSTRAINT IF EXISTS deploy_suggestions_category_check;
ALTER TABLE deploy_suggestions DROP CONSTRAINT IF EXISTS deploy_suggestions_priority_check;
ALTER TABLE deploy_suggestions DROP CONSTRAINT IF EXISTS deploy_suggestions_status_check;
ALTER TABLE deploy_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deploy_suggestions_select" ON deploy_suggestions;
DROP POLICY IF EXISTS "deploy_suggestions_insert" ON deploy_suggestions;
DROP POLICY IF EXISTS "deploy_suggestions_update" ON deploy_suggestions;
DROP POLICY IF EXISTS "deploy_suggestions_delete" ON deploy_suggestions;

CREATE POLICY "deploy_suggestions_select" ON deploy_suggestions FOR SELECT USING (true);
CREATE POLICY "deploy_suggestions_insert" ON deploy_suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "deploy_suggestions_update" ON deploy_suggestions FOR UPDATE USING (true);
CREATE POLICY "deploy_suggestions_delete" ON deploy_suggestions FOR DELETE USING (true);
