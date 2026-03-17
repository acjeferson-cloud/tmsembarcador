-- Correção de RLS para Tabelas de Faturas (Bills)
-- Permitindo acesso para sessão customizada (anon)

-- Remover políticas restritivas
DROP POLICY IF EXISTS "Permitir leitura de faturas pelo usuário autenticado" ON public.bills;
DROP POLICY IF EXISTS "Permitir inserção de faturas pelo usuário" ON public.bills;
DROP POLICY IF EXISTS "Permitir atualização de faturas" ON public.bills;
DROP POLICY IF EXISTS "Permitir deleção de faturas" ON public.bills;

DROP POLICY IF EXISTS "Permitir leitura de bill_ctes" ON public.bill_ctes;
DROP POLICY IF EXISTS "Permitir inserção de bill_ctes" ON public.bill_ctes;
DROP POLICY IF EXISTS "Permitir atualização de bill_ctes" ON public.bill_ctes;
DROP POLICY IF EXISTS "Permitir deleção de bill_ctes" ON public.bill_ctes;

-- Criar políticas baseadas no padrão do projeto (anon e authenticated com true)
CREATE POLICY "anon_all_bills" ON public.bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_bill_ctes" ON public.bill_ctes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
