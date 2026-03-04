/*
  # Adicionar Colunas de Logotipo aos Ambientes
  
  1. Novas Colunas
    - logo_url: URL pública do logotipo
    - logo_storage_path: Caminho no Supabase Storage
    - logo_metadata: Metadados do logotipo (tamanho, tipo, dimensões)
  
  2. Uso
    - Permite que cada ambiente (Testes, Produção) tenha seu próprio logotipo
    - Logotipo aparece na interface quando o ambiente está ativo
    - Suporta diferentes logos para teste vs produção
*/

-- Adicionar colunas para logotipo na tabela saas_environments
ALTER TABLE saas_environments 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
ADD COLUMN IF NOT EXISTS logo_metadata JSONB DEFAULT '{}'::jsonb;

-- Comentários nas colunas
COMMENT ON COLUMN saas_environments.logo_url IS 'URL pública do logotipo do ambiente';
COMMENT ON COLUMN saas_environments.logo_storage_path IS 'Caminho do arquivo no Supabase Storage (bucket: environment-logos)';
COMMENT ON COLUMN saas_environments.logo_metadata IS 'Metadados do logotipo: {size_bytes, mime_type, width, height, uploaded_at, uploaded_by}';
