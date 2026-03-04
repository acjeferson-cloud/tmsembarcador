/*
  # Atualizar logo_url dos environments com base nos arquivos do storage

  1. Problema
    - Logos foram salvos no bucket mas não atualizaram a tabela saas_environments
    - Logo não aparece na tela de seleção de ambiente
  
  2. Solução
    - Buscar o arquivo mais recente de cada environment_id
    - Atualizar logo_url e logo_storage_path na tabela
*/

-- Atualizar logo do environment 288dd59d-e3a3-4c5d-b2f0-646770a4eddf (Testes - Demonstração)
UPDATE saas_environments
SET 
  logo_storage_path = 'logos/288dd59d-e3a3-4c5d-b2f0-646770a4eddf-1772278979138.png',
  logo_url = (
    SELECT 'https://wthqdsbnfnrzgupmhuqo.supabase.co/storage/v1/object/public/environment-logos/logos/288dd59d-e3a3-4c5d-b2f0-646770a4eddf-1772278979138.png'
  )
WHERE id = '288dd59d-e3a3-4c5d-b2f0-646770a4eddf';

-- Atualizar logo do environment 4e15648a-8e64-4c55-89ce-aa10f7f5af66 (Testes - Quimidrol)
UPDATE saas_environments
SET 
  logo_storage_path = 'logos/4e15648a-8e64-4c55-89ce-aa10f7f5af66-1772281046295.jpg',
  logo_url = (
    SELECT 'https://wthqdsbnfnrzgupmhuqo.supabase.co/storage/v1/object/public/environment-logos/logos/4e15648a-8e64-4c55-89ce-aa10f7f5af66-1772281046295.jpg'
  )
WHERE id = '4e15648a-8e64-4c55-89ce-aa10f7f5af66';

-- Atualizar logo do environment 518f849d-d24c-420c-bc1f-38fdf957d21a (Testes - Demonstração)
UPDATE saas_environments
SET 
  logo_storage_path = 'logos/518f849d-d24c-420c-bc1f-38fdf957d21a-1772282195324.jpg',
  logo_url = (
    SELECT 'https://wthqdsbnfnrzgupmhuqo.supabase.co/storage/v1/object/public/environment-logos/logos/518f849d-d24c-420c-bc1f-38fdf957d21a-1772282195324.jpg'
  )
WHERE id = '518f849d-d24c-420c-bc1f-38fdf957d21a';

-- Atualizar logo do environment 643ef05b-e898-4fa4-b19d-867f5536bb6e (Testes - Lynus)
-- Usar o arquivo mais recente
UPDATE saas_environments
SET 
  logo_storage_path = 'logos/643ef05b-e898-4fa4-b19d-867f5536bb6e-1772281002961.png',
  logo_url = (
    SELECT 'https://wthqdsbnfnrzgupmhuqo.supabase.co/storage/v1/object/public/environment-logos/logos/643ef05b-e898-4fa4-b19d-867f5536bb6e-1772281002961.png'
  )
WHERE id = '643ef05b-e898-4fa4-b19d-867f5536bb6e';

-- Atualizar logo do environment b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1 (Produção - Demonstração)
UPDATE saas_environments
SET 
  logo_storage_path = 'logos/b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1-1772278970483.png',
  logo_url = (
    SELECT 'https://wthqdsbnfnrzgupmhuqo.supabase.co/storage/v1/object/public/environment-logos/logos/b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1-1772278970483.png'
  )
WHERE id = 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1';
