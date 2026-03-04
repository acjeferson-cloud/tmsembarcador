/*
  # Criar Storage Bucket para Logotipos de Environments
  
  1. Storage Bucket
    - Cria bucket `environment-logos` para armazenar logotipos dos ambientes
    - Configurações públicas de leitura para permitir exibição no login
  
  2. Policies
    - Anon: leitura pública dos logotipos
    - Authenticated: upload e gerenciamento de logotipos
*/

-- Criar bucket para logotipos de environments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'environment-logos',
  'environment-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Public read access for environment logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload environment logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update environment logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete environment logos" ON storage.objects;

-- Policy: Permitir leitura pública dos logotipos (para exibir no login)
CREATE POLICY "Public read access for environment logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'environment-logos');

-- Policy: Permitir authenticated users fazer upload
CREATE POLICY "Authenticated users can upload environment logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'environment-logos');

-- Policy: Permitir authenticated users atualizar seus logotipos
CREATE POLICY "Authenticated users can update environment logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'environment-logos');

-- Policy: Permitir authenticated users deletar logotipos
CREATE POLICY "Authenticated users can delete environment logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'environment-logos');

-- Policy: Permitir anon users fazer upload (para SaaS admin que usa anon com contexto)
CREATE POLICY "Anon users can upload environment logos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'environment-logos');

-- Policy: Permitir anon users atualizar (para SaaS admin que usa anon com contexto)
CREATE POLICY "Anon users can update environment logos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'environment-logos');

-- Policy: Permitir anon users deletar (para SaaS admin que usa anon com contexto)
CREATE POLICY "Anon users can delete environment logos"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'environment-logos');
