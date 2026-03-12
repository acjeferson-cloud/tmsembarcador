
-- 1) Remove a constraint original
ALTER TABLE user_innovations DROP CONSTRAINT IF EXISTS user_innovations_user_id_fkey;

-- 2) Altera o tipo da coluna para NUMERICO/Inteiro já que o '1' que tá logando é Integer
-- Caso user_id na tabela users local seja integer, vamos mudar o INNOVATIONS para integer tb
ALTER TABLE user_innovations ALTER COLUMN user_id TYPE integer USING NULLIF(user_id::text, '')::integer;

-- 3) (Opcional) Recria a constraint apontando para a sua tabela interna de usuários ('users')
-- Se a foreign key apontava para auth.users do supabase, deixaremos sem constraint estrita
-- para que os IDs internos numéricos funcionem sem quebrar.

