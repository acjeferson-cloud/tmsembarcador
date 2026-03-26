-- Migração de Automatização e Concessão Universal do Master Admin
-- Relaxamento responsável da Restrição UNIQUE global
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_environment_id_key;

-- Uma mesma conta de e-mail pode existir em múltiplos ambientes, mas apenas 1 vez por ambiente
ALTER TABLE users ADD CONSTRAINT users_email_env_key UNIQUE (email, environment_id);

-- 2. Gatilho de Injeção em Novos Ambientes (saas_environments)
CREATE OR REPLACE FUNCTION inject_master_admin_on_environment()
RETURNS TRIGGER AS $$
DECLARE
  v_master_email text := 'jeferson.costa@logaxis.com.br';
  v_senha_hash text;
BEGIN
  -- Achar a hash da senha deste usuário em qualquer outro ambiente (ou usar a mais atualizada)
  SELECT senha_hash INTO v_senha_hash
  FROM users 
  WHERE email = v_master_email AND senha_hash IS NOT NULL
  ORDER BY updated_at DESC 
  LIMIT 1;

  -- Se encontrou uma hash mestra, injetá-lo no novo ambiente
  IF v_senha_hash IS NOT NULL THEN
    INSERT INTO users (
      organization_id, 
      environment_id, 
      email, 
      senha_hash, 
      nome, 
      tipo, 
      ativo
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      v_master_email,
      v_senha_hash,
      'Jeferson Costa',
      'saas_admin',
      true
    ) ON CONFLICT ON CONSTRAINT users_email_env_key DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inject_master_env ON saas_environments;
CREATE TRIGGER trg_inject_master_env
AFTER INSERT ON saas_environments
FOR EACH ROW
EXECUTE FUNCTION inject_master_admin_on_environment();

-- 3. Gatilho de Injeção nas Novas Companhias (establishments)
CREATE OR REPLACE FUNCTION inject_master_admin_on_establishment()
RETURNS TRIGGER AS $$
DECLARE
  v_master_email text := 'jeferson.costa@logaxis.com.br';
  v_master_user_id uuid;
BEGIN
  -- Capturar o ID do mestre que foi injetado (ou existe) neste mesmo ambiente
  SELECT id INTO v_master_user_id 
  FROM users 
  WHERE email = v_master_email AND environment_id = NEW.environment_id;

  -- Inserir o vínculo de acesso à empresa
  IF v_master_user_id IS NOT NULL THEN
    INSERT INTO user_establishments (user_id, establishment_id, is_default)
    VALUES (v_master_user_id, NEW.id, true)
    ON CONFLICT (user_id, establishment_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inject_master_est ON establishments;
CREATE TRIGGER trg_inject_master_est
AFTER INSERT ON establishments
FOR EACH ROW
EXECUTE FUNCTION inject_master_admin_on_establishment();

-- 4. Correção Retroativa (Retrofit): Garantir a Onipresença nos Ambientes e Companhias Pré-Existentes
DO $$
DECLARE
  v_master_email text := 'jeferson.costa@logaxis.com.br';
  v_senha_hash text;
  env_record record;
  est_record record;
  v_user_id uuid;
BEGIN
  -- Apenas executa a retroatividade se o Jeferson já existir com senha em algum lugar
  SELECT senha_hash INTO v_senha_hash
  FROM users 
  WHERE email = v_master_email AND senha_hash IS NOT NULL
  ORDER BY updated_at DESC 
  LIMIT 1;

  IF v_senha_hash IS NOT NULL THEN
    -- Varre todos os ambientes existentes na nuvem
    FOR env_record IN SELECT id, organization_id FROM saas_environments LOOP
      
      -- Descobre o ID dele neste ambiente, ou cria se ele não estiver lá
      SELECT id INTO v_user_id FROM users WHERE email = v_master_email AND environment_id = env_record.id;
      
      IF v_user_id IS NULL THEN
        INSERT INTO users (
          organization_id, environment_id, email, senha_hash, nome, tipo, ativo
        ) VALUES (
          env_record.organization_id, env_record.id, v_master_email, v_senha_hash, 'Jeferson Costa', 'saas_admin', true
        ) RETURNING id INTO v_user_id;
      END IF;

      -- Com o ID em mãos, garante que as catracas de todos os estabelecimentos deste ambiente abram pra ele
      FOR est_record IN SELECT id FROM establishments WHERE environment_id = env_record.id LOOP
        INSERT INTO user_establishments (user_id, establishment_id, is_default)
        VALUES (v_user_id, est_record.id, true)
        ON CONFLICT (user_id, establishment_id) DO NOTHING;
      END LOOP;

    END LOOP;
  END IF;
END $$;
