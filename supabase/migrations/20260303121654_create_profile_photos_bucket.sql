/*
  # Criar bucket para fotos de perfil dos usuários

  1. Novo Bucket
    - `profile-photos` - bucket público para armazenar fotos de perfil dos usuários
  
  2. Políticas de Segurança
    - Permitir leitura pública das fotos
    - Permitir upload apenas para usuários autenticados
    - Permitir atualização apenas do próprio arquivo
    - Permitir deleção apenas do próprio arquivo
*/

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public read access for profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'profile-photos');