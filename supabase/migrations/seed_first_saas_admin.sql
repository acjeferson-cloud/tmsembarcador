-- Criação do primeiro Admin SaaS diretamente pelo banco (sem precisar do Node/Service Role Key)

DO $$ 
DECLARE
  new_auth_id UUID := gen_random_uuid();
  admin_email TEXT := 'jeferson.costa@logaxis.com.br';
  admin_pass TEXT := 'Admin123!'; -- <-- Pode trocar se quiser, é a senha temporária
  existing_auth_id UUID;
BEGIN

  -- 1. Verifica se o usuário já existe no auth.users
  SELECT id INTO existing_auth_id FROM auth.users WHERE email = admin_email LIMIT 1;

  IF existing_auth_id IS NULL THEN
    -- Insere o usuário direto no auth.users do Supabase com senha encryptada em BCrypt
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', 
      new_auth_id, 
      'authenticated', 
      'authenticated', 
      admin_email, 
      crypt(admin_pass, gen_salt('bf')), 
      NOW(), 
      '{"provider": "email", "providers": ["email"], "is_saas_admin": true}', 
      '{"name": "Jeferson Costa"}', 
      NOW(), 
      NOW(), 
      '', '', '', ''
    );
  ELSE
    new_auth_id := existing_auth_id;
  END IF;

  -- 2. Atualiza a nossa tabela saas_admins vinculando ao auth.users.id
  -- Verifica se já existe um admin com esse email na saas_admins
  IF EXISTS (SELECT 1 FROM saas_admins WHERE email = admin_email) THEN
    UPDATE saas_admins 
    SET auth_user_id = new_auth_id, ativo = true 
    WHERE email = admin_email;
  ELSE
    INSERT INTO saas_admins (nome, email, senha_hash, ativo, auth_user_id)
    VALUES ('Jeferson Costa', admin_email, 'MIGRATED_BD', true, new_auth_id);
  END IF;

END $$;
