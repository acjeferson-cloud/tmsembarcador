/*
  Importação de Localidades do Distrito Federal (DF)

  Este script importa todas as cidades, distritos e povoados do Distrito Federal
  conforme o cadastro atualizado dos Correios, incluindo:
  - Nome da localidade
  - Código do IBGE (5300108 - Brasília)
  - Tipo (Município, Região Administrativa)
  - Faixas de CEP

  O script trata:
  - Duplicidades (INSERT ... ON CONFLICT)
  - Atualização de registros existentes
  - Validação de sobreposição de CEPs
  - Consistência de dados
*/

-- Obter ID do estado DF
DO $$
DECLARE
  v_state_id uuid;
BEGIN
  -- Buscar ID do estado DF
  SELECT id INTO v_state_id
  FROM states
  WHERE abbreviation = 'DF'
  LIMIT 1;

  IF v_state_id IS NULL THEN
    RAISE EXCEPTION 'Estado DF não encontrado na tabela states';
  END IF;

  -- Brasília (Plano Piloto - sede do município)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Brasília', 'Município', '70000000', '73699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Gama (RA II)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Gama', 'Região Administrativa', '72400000', '72699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Taguatinga (RA III)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Taguatinga', 'Região Administrativa', '72000000', '72199999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Brazlândia (RA IV)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Brazlândia', 'Região Administrativa', '72700000', '72799999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Sobradinho (RA V)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Sobradinho', 'Região Administrativa', '73000000', '73099999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Planaltina (RA VI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Planaltina', 'Região Administrativa', '73300000', '73399999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Paranoá (RA VII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Paranoá', 'Região Administrativa', '71570000', '71599999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Núcleo Bandeirante (RA VIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Núcleo Bandeirante', 'Região Administrativa', '71700000', '71799999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Ceilândia (RA IX)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Ceilândia', 'Região Administrativa', '72200000', '72299999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Guará (RA X)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Guará', 'Região Administrativa', '71000000', '71099999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Cruzeiro (RA XI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Cruzeiro', 'Região Administrativa', '70640000', '70699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Samambaia (RA XII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Samambaia', 'Região Administrativa', '72300000', '72399999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Santa Maria (RA XIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Santa Maria', 'Região Administrativa', '72500000', '72599999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- São Sebastião (RA XIV)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'São Sebastião', 'Região Administrativa', '71600000', '71699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Recanto das Emas (RA XV)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Recanto das Emas', 'Região Administrativa', '72600000', '72699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Lago Sul (RA XVI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Lago Sul', 'Região Administrativa', '71600000', '71680999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Riacho Fundo (RA XVII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Riacho Fundo', 'Região Administrativa', '71800000', '71899999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Lago Norte (RA XVIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Lago Norte', 'Região Administrativa', '71500000', '71569999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Candangolândia (RA XIX)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Candangolândia', 'Região Administrativa', '71725000', '71739999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Águas Claras (RA XX)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Águas Claras', 'Região Administrativa', '71900000', '71999999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Riacho Fundo II (RA XXI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Riacho Fundo II', 'Região Administrativa', '71880000', '71899999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Sudoeste/Octogonal (RA XXII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Sudoeste/Octogonal', 'Região Administrativa', '70670000', '70689999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Varjão (RA XXIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Varjão', 'Região Administrativa', '71535000', '71549999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Park Way (RA XXIV)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Park Way', 'Região Administrativa', '71760000', '71779999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- SCIA - Estrutural (RA XXV)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'SCIA - Estrutural', 'Região Administrativa', '71250000', '71269999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Sobradinho II (RA XXVI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Sobradinho II', 'Região Administrativa', '73060000', '73099999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Jardim Botânico (RA XXVII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Jardim Botânico', 'Região Administrativa', '71680000', '71699999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Itapoã (RA XXVIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Itapoã', 'Região Administrativa', '71580000', '71599999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- SIA (RA XXIX)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'SIA', 'Região Administrativa', '71200000', '71249999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Vicente Pires (RA XXX)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Vicente Pires', 'Região Administrativa', '72110000', '72139999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Fercal (RA XXXI)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Fercal', 'Região Administrativa', '73380000', '73399999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Sol Nascente/Pôr do Sol (RA XXXII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Sol Nascente/Pôr do Sol', 'Região Administrativa', '72236000', '72269999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  -- Arniqueira (RA XXXIII)
  INSERT INTO cities (state_id, ibge_code, name, type, zip_code_start, zip_code_end)
  VALUES (v_state_id, '5300108', 'Arniqueira', 'Região Administrativa', '72615000', '72649999')
  ON CONFLICT (state_id, ibge_code, name)
  DO UPDATE SET
    type = EXCLUDED.type,
    zip_code_start = EXCLUDED.zip_code_start,
    zip_code_end = EXCLUDED.zip_code_end,
    updated_at = now();

  RAISE NOTICE 'Importação das localidades do DF concluída com sucesso!';
  RAISE NOTICE 'Total de 33 regiões administrativas do Distrito Federal importadas/atualizadas.';
END $$;

-- Validar se há sobreposição de CEPs
SELECT
  'VALIDAÇÃO DE SOBREPOSIÇÃO DE CEPS' as tipo,
  c1.name as localidade_1,
  c2.name as localidade_2,
  c1.zip_code_start as cep_inicio_1,
  c1.zip_code_end as cep_fim_1,
  c2.zip_code_start as cep_inicio_2,
  c2.zip_code_end as cep_fim_2
FROM cities c1
JOIN cities c2 ON c1.state_id = c2.state_id
  AND c1.id != c2.id
  AND c1.zip_code_start <= c2.zip_code_end
  AND c1.zip_code_end >= c2.zip_code_start
WHERE c1.state_id IN (SELECT id FROM states WHERE abbreviation = 'DF');

-- Estatísticas da importação
SELECT
  'ESTATÍSTICAS DA IMPORTAÇÃO' as tipo,
  COUNT(*) as total_localidades,
  COUNT(DISTINCT ibge_code) as total_municipios,
  COUNT(*) FILTER (WHERE type = 'Município') as municipios,
  COUNT(*) FILTER (WHERE type = 'Região Administrativa') as regioes_administrativas
FROM cities
WHERE state_id IN (SELECT id FROM states WHERE abbreviation = 'DF');
