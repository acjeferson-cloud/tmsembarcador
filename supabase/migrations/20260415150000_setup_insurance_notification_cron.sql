-- Habilitar a extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Garantir que a extensão net esteja habilitada para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pgnet;

-- Remover agendamento anterior se existir para evitar duplicidade
SELECT cron.unschedule('carrier-insurance-check-daily');

-- Agendar a Edge Function para rodar todos os dias às 09:00 UTC (06:00 BRT)
-- Substitua 'SUA_URL_DO_PROJECT' e 'SERVICE_ROLE_KEY' se necessário, 
-- mas geralmente no Supabase auto-hosted ou cloud, usamos variáveis de ambiente ou chamadas internas.
-- Aqui usamos a sintaxe padrão do Supabase para invocar funções via HTTP.

SELECT cron.schedule(
  'carrier-insurance-check-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := (SELECT value FROM shipyard.settings WHERE key = 'supabase_url') || '/functions/v1/carrier-insurance-check',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM shipyard.settings WHERE key = 'service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Nota: Como o ambiente local pode não ter 'shipyard.settings', 
-- uma alternativa mais robusta para migrations genericas é:
/*
SELECT cron.schedule(
  'carrier-insurance-check-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'http://localhost:54321/functions/v1/carrier-insurance-check',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
*/
