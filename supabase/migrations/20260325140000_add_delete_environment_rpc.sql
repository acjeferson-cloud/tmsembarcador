-- migration: 20260325140000_add_delete_environment_rpc.sql
-- Adiciona botão de pânico (RPC) escalável para "Excluir Definitivamente" um ambiente não-produtivo

CREATE OR REPLACE FUNCTION delete_environment_cascade(p_environment_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table text;
BEGIN
  -- PROTEÇÃO: Não deletar Produção!
  IF EXISTS (SELECT 1 FROM saas_environments WHERE id = p_environment_id AND tipo = 'producao') THEN
    RAISE EXCEPTION 'Não é possível deletar completamente um ambiente de PRODUÇÃO.';
  END IF;

  -- 1) Desabilita temporariamente a verificação de Foreign Keys e Triggers na sessão atual
  --    (Para que a exclusão não falhe por causa de ordem de dependência)
  SET session_replication_role = 'replica';

  -- 2) Limpa as tabelas associativas mais conhecidas (que não têm a coluna environment_id diretamente)
  BEGIN DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE environment_id = p_environment_id); EXCEPTION WHEN OTHERS THEN END;
  BEGIN DELETE FROM user_establishments WHERE establishment_id IN (SELECT id FROM establishments WHERE environment_id = p_environment_id); EXCEPTION WHEN OTHERS THEN END;

  -- 3) Laço Dinâmico: Varredura total expurgando TUDO de qualquer tabela que possua environment_id
  FOR v_table IN
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'environment_id' AND table_schema = 'public' AND table_name != 'saas_environments'
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE environment_id = $1', v_table) USING p_environment_id;
    EXCEPTION WHEN OTHERS THEN
      -- Se a tabela estiver travada ou algo semelhante, ignora e segue pro próximo alvo
    END;
  END LOOP;

  -- 4) Remove a raiz (o ambiente em si)
  DELETE FROM saas_environments WHERE id = p_environment_id;

  -- 5) Restaura o funcionamento normal dos bloqueios do banco
  SET session_replication_role = 'origin';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de travamento global, garante que o banco volta ao normal
    SET session_replication_role = 'origin';
    RAISE;
END;
$$;
