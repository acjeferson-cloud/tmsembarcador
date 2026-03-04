/*
  # Import 8 specific cities and their ZIP code ranges

  1. Cities to import:
    - Três Pontas - MG (37190-000 a 37194-999)
    - Auriflama - SP (15350-000 a 15354-999)
    - Apucarana - PR (86800-000 a 86809-999)
    - Juruaia - MG (37805-000 a 37807-999)
    - Irineópolis - SC (89440-000 a 89444-999)
    - Mariana - MG (35420-000 a 35429-999)
    - Rio Negro - PR (83880-000 a 83889-999)
    - Maricá - RJ (24900-000 a 24939-999)
*/

DO $$
DECLARE
  v_mg_id uuid;
  v_sp_id uuid;
  v_pr_id uuid;
  v_sc_id uuid;
  v_rj_id uuid;
  v_city_id uuid;
  v_exists boolean;
BEGIN
  -- Get state IDs
  SELECT id INTO v_mg_id FROM states WHERE sigla = 'MG';
  SELECT id INTO v_sp_id FROM states WHERE sigla = 'SP';
  SELECT id INTO v_pr_id FROM states WHERE sigla = 'PR';
  SELECT id INTO v_sc_id FROM states WHERE sigla = 'SC';
  SELECT id INTO v_rj_id FROM states WHERE sigla = 'RJ';

  -- Três Pontas - MG
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_mg_id, '3169307', 'Três Pontas', -21.3669, -45.5125, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '37190000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '37190000', '37194999');
  END IF;

  -- Auriflama - SP
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_sp_id, '3504800', 'Auriflama', -20.6878, -50.5547, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '15350000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '15350000', '15354999');
  END IF;

  -- Apucarana - PR
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_pr_id, '4101408', 'Apucarana', -23.5508, -51.4606, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '86800000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '86800000', '86809999');
  END IF;

  -- Juruaia - MG
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_mg_id, '3136553', 'Juruaia', -21.2528, -46.5753, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '37805000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '37805000', '37807999');
  END IF;

  -- Irineópolis - SC
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_sc_id, '4208203', 'Irineópolis', -26.2503, -50.7936, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '89440000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '89440000', '89444999');
  END IF;

  -- Mariana - MG
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_mg_id, '3139409', 'Mariana', -20.3778, -43.4161, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '35420000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '35420000', '35429999');
  END IF;

  -- Rio Negro - PR
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_pr_id, '4122107', 'Rio Negro', -26.1006, -49.7997, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '83880000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '83880000', '83889999');
  END IF;

  -- Maricá - RJ
  INSERT INTO cities (state_id, codigo_ibge, nome, latitude, longitude, ativo)
  VALUES (v_rj_id, '3302701', 'Maricá', -22.9192, -42.8186, true)
  ON CONFLICT (codigo_ibge) DO UPDATE SET nome = EXCLUDED.nome
  RETURNING id INTO v_city_id;
  
  SELECT EXISTS(SELECT 1 FROM zip_code_ranges WHERE city_id = v_city_id AND start_zip = '24900000') INTO v_exists;
  IF NOT v_exists THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) VALUES (v_city_id, '24900000', '24939999');
  END IF;

END $$;