/*
  # Tornar coluna nome nullable em freight_rates

  O frontend usa 'descricao' mas o banco exige 'nome' NOT NULL.
  
  Solução: Tornar 'nome' nullable para compatibilidade.
*/

-- Tornar nome nullable
ALTER TABLE freight_rates 
ALTER COLUMN nome DROP NOT NULL;

-- Log sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Coluna nome agora é nullable';
    RAISE NOTICE '✅ Frontend pode usar descricao sem problemas';
END $$;
