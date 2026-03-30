-- 1. Remove restrição única antiga que conflitava ao inserir dados com establishment_id
ALTER TABLE IF EXISTS public.whatsapp_config
  DROP CONSTRAINT IF EXISTS whatsapp_config_organization_id_environment_id_key CASCADE;

ALTER TABLE IF EXISTS public.whatsapp_config
  DROP CONSTRAINT IF EXISTS whatsapp_config_organization_id_environment_id_establishment_id_key CASCADE;

-- 2. Adiciona a nova restrição única englobando o establishment_id 
ALTER TABLE public.whatsapp_config
  ADD CONSTRAINT whatsapp_config_org_env_estab_key 
  UNIQUE (organization_id, environment_id, establishment_id);
