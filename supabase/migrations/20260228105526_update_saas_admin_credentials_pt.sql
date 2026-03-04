/*
  # Atualizar Credenciais do Administrador SaaS Global
  
  1. Remove Admin Antigo
    - Deleta todos os admins antigos
    
  2. Cria Novo Admin
    - Email: jeferson.costa@logaxis.com.br
    - Senha: JE278l2035A# (hash SHA256)
    - Nome: Jeferson Costa - Admin Global
    - Ativo: true
    
  3. Validação
    - Garante que existe apenas 1 admin ativo
*/

-- Deletar todos os admins antigos
DELETE FROM saas_admins;

-- Criar novo admin com senha hash SHA256
-- Senha: JE278l2035A#
INSERT INTO saas_admins (
  email,
  senha_hash,
  nome,
  ativo,
  last_login
) VALUES (
  'jeferson.costa@logaxis.com.br',
  encode(digest('JE278l2035A#', 'sha256'), 'hex'),
  'Jeferson Costa - Admin Global',
  true,
  NULL
);

-- Validar que existe apenas 1 admin
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM saas_admins WHERE ativo = true;
  
  IF admin_count != 1 THEN
    RAISE EXCEPTION 'Erro: esperado 1 admin ativo, encontrado %', admin_count;
  END IF;
  
  RAISE NOTICE 'Admin criado com sucesso. Email: jeferson.costa@logaxis.com.br';
END $$;

-- Comentário de auditoria
COMMENT ON TABLE saas_admins IS 'Tabela de administradores SaaS - Admin global: jeferson.costa@logaxis.com.br atualizado em 2026-03-01';
