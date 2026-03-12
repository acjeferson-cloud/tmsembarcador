-- Drop the NOT NULL constraint from the old 'token' column
ALTER TABLE nps_pesquisas_cliente ALTER COLUMN token DROP NOT NULL;

-- In a future migration, we can safely DROP COLUMN token if we fully migrated to token_pesquisa
-- For now, allowing it to be NULL fixes the issue with new inserts.

NOTIFY pgrst, 'reload schema';
