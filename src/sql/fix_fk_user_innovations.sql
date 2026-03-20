-- ==========================================
-- 4. RESTAURAÇÃO DA FOREIGN KEY
-- ==========================================
-- Na migração anterior, a Foreign Key entre user_innovations e innovations pode ter sido removida acidentalmente durante a limpeza de constraints únicas.
-- Esta instrução restaura o relacionamento para que o PostgREST (Supabase) consiga fazer os JOINs corretamente.
ALTER TABLE user_innovations 
ADD CONSTRAINT user_innovations_innovation_id_fkey 
FOREIGN KEY (innovation_id) 
REFERENCES innovations(id) 
ON DELETE CASCADE;
