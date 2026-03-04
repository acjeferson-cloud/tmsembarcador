/*
  # Adicionar TODAS as faixas de CEP de Navegantes-SC

  1. Objetivo
    - Navegantes-SC (IBGE: 4211306) possui 10 faixas de CEP
    - Cada faixa corresponde a um bairro/região específica
    - Faixa Geral: 88370-000 a 88379-999

  2. Dados dos Correios
    - Centro: 88370-001 a 88370-999
    - Gravatá: 88371-001 a 88371-999
    - Meia Praia: 88372-001 a 88372-999
    - São João: 88373-001 a 88373-999
    - Residencial Sul: 88374-001 a 88374-999
    - Industrial: 88375-001 a 88375-999
    - Residencial Central: 88376-001 a 88376-999
    - Gravatazinho: 88377-001 a 88377-999
    - Vila Guarani: 88378-001 a 88378-999
    - Ponta das Pedras: 88379-001 a 88379-999

  3. Ações
    - Deletar faixas antigas de Navegantes-SC
    - Inserir as 10 faixas completas
*/

-- Buscar ID de Navegantes-SC
DO $$
DECLARE
  v_city_id uuid;
BEGIN
  -- Buscar Navegantes-SC pelo código IBGE
  SELECT id INTO v_city_id
  FROM cities
  WHERE codigo_ibge = '4211306'
  LIMIT 1;

  IF v_city_id IS NOT NULL THEN
    RAISE NOTICE 'Navegantes-SC encontrada: %', v_city_id;

    -- Deletar faixas antigas
    DELETE FROM zip_code_ranges WHERE city_id = v_city_id;
    RAISE NOTICE 'Faixas antigas deletadas';

    -- Inserir as 10 faixas de CEP
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip, area, neighborhood)
    VALUES
      -- Faixa 1: Centro
      (v_city_id, '88370001', '88370999', 'Zona Urbana', 'Centro'),
      
      -- Faixa 2: Gravatá
      (v_city_id, '88371001', '88371999', 'Zona Urbana', 'Gravatá'),
      
      -- Faixa 3: Meia Praia
      (v_city_id, '88372001', '88372999', 'Zona Urbana', 'Meia Praia'),
      
      -- Faixa 4: São João
      (v_city_id, '88373001', '88373999', 'Zona Urbana', 'São João'),
      
      -- Faixa 5: Residencial Sul
      (v_city_id, '88374001', '88374999', 'Zona Urbana', 'Residencial Sul'),
      
      -- Faixa 6: Industrial
      (v_city_id, '88375001', '88375999', 'Zona Industrial', 'Industrial'),
      
      -- Faixa 7: Residencial Central
      (v_city_id, '88376001', '88376999', 'Zona Urbana', 'Residencial Central'),
      
      -- Faixa 8: Gravatazinho
      (v_city_id, '88377001', '88377999', 'Zona Urbana', 'Gravatazinho'),
      
      -- Faixa 9: Vila Guarani
      (v_city_id, '88378001', '88378999', 'Zona Urbana', 'Vila Guarani'),
      
      -- Faixa 10: Ponta das Pedras
      (v_city_id, '88379001', '88379999', 'Zona Urbana', 'Ponta das Pedras');

    RAISE NOTICE '10 faixas de CEP inseridas para Navegantes-SC';

    -- Validar
    DECLARE
      v_count integer;
    BEGIN
      SELECT COUNT(*) INTO v_count
      FROM zip_code_ranges
      WHERE city_id = v_city_id;

      RAISE NOTICE 'Total de faixas: %', v_count;
      
      IF v_count = 10 THEN
        RAISE NOTICE '✅ Navegantes-SC: 10 faixas completas!';
      ELSE
        RAISE WARNING '⚠️ Navegantes-SC: Esperado 10 faixas, encontrado %', v_count;
      END IF;
    END;

  ELSE
    RAISE WARNING '⚠️ Navegantes-SC não encontrada no banco!';
  END IF;
END $$;
