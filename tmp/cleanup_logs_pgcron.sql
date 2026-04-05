-- Habilitar a extensão pg_cron (caso ainda não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar o job para deletar logs mais antigos que 7 dias, todos os dias à 1:00 AM.
SELECT cron.schedule(
    'cleanup_erp_sync_logs', -- nome do job
    '0 1 * * *',             -- expressão cron (minuto 0, hora 1, todos os dias)
    $$ DELETE FROM public.erp_sync_logs WHERE created_at < NOW() - INTERVAL '7 days'; $$
);

-- Para verificar se o job foi criado corretamente, você pode executar:
-- SELECT * FROM cron.job;

-- Caso em algum momento precise remover o job, execute:
-- SELECT cron.unschedule('cleanup_erp_sync_logs');
