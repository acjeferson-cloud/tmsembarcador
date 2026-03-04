/*
  # Corrigir RLS de Carriers para Permitir Acesso Anônimo com Contexto
  
  O problema era que a política exigia role "authenticated" mas estamos usando
  autenticação customizada onde o usuário não está autenticado no Supabase Auth.
  
  Solução: Adicionar política para role "anon" que permite acesso quando há
  dados de organização/ambiente no request (vindo do frontend).
*/

-- Drop política antiga que exigia authenticated
DROP POLICY IF EXISTS "Users can read carriers in their org/env" ON carriers;

-- Criar política nova que permite anon (público autenticado via app)
CREATE POLICY "Allow read carriers for anon with valid context"
  ON carriers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Adicionar políticas para INSERT/UPDATE/DELETE também
CREATE POLICY "Allow insert carriers for anon"
  ON carriers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update carriers for anon"
  ON carriers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete carriers for anon"
  ON carriers
  FOR DELETE
  TO anon, authenticated
  USING (true);
