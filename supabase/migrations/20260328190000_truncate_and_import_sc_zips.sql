/*
  # Limpeza do Banco de CEPs e Importação de Amostra de SC
  
  Este script vai:
  1. Limpar todas as faixas "amplas/genéricas" em TODAS as cidades
  2. Inserir faixas de CEP reais (padrão DNE) usando cruzamento preciso pelo Código IBGE.
*/

-- Passo 1: Limpar as faixas de CEP existentes para reiniciar corretamente
TRUNCATE TABLE zip_code_ranges RESTART IDENTITY CASCADE;

-- Passo 2: Função para importar as faixas de SC target a partir dos Códigos IBGE confirmados
DO $$
DECLARE
  v_city_id uuid;
BEGIN
  -- ==========================================
  -- CHAPECÓ (IBGE: 4204202)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4204202' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '89800000', '89816999');
  END IF;

  -- ==========================================
  -- JOINVILLE (IBGE: 4209102)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4209102' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '89200000', '89239999');
  END IF;

  -- ==========================================
  -- FLORIANÓPOLIS (IBGE: 4205407)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4205407' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88000000', '88099999');
  END IF;

  -- ==========================================
  -- SÃO JOSÉ (IBGE: 4216602)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4216602' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88100000', '88139999');
  END IF;

  -- ==========================================
  -- PALHOÇA (IBGE: 4211900)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4211900' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88130000', '88139999');
  END IF;

  -- ==========================================
  -- BLUMENAU (IBGE: 4202404)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4202404' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '89000000', '89099999');
  END IF;

  -- ==========================================
  -- ITAJAÍ (IBGE: 4208203)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4208203' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88300000', '88319999');
  END IF;

  -- ==========================================
  -- NAVEGANTES (IBGE: 4211306)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4211306' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip, neighborhood) VALUES 
      (v_city_id, '88375000', '88375999', 'Gravatá'),
      (v_city_id, '88370000', '88372999', 'Centro');
  END IF;

  -- ==========================================
  -- BALNEÁRIO CAMBORIÚ (IBGE: 4202008)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4202008' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88330000', '88339999');
  END IF;

  -- ==========================================
  -- CRICIÚMA (IBGE: 4204608)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4204608' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88800000', '88819999');
  END IF;

  -- ==========================================
  -- TUBARÃO (IBGE: 4218707)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4218707' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88700000', '88709999');
  END IF;

  -- ==========================================
  -- LAGES (IBGE: 4209300)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4209300' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '88500000', '88549999');
  END IF;

  -- ==========================================
  -- ABDON BATISTA (IBGE: 4200051)
  -- ==========================================
  SELECT id INTO v_city_id FROM cities WHERE codigo_ibge = '4200051' LIMIT 1;
  IF FOUND THEN
    INSERT INTO zip_code_ranges (city_id, start_zip, end_zip) 
    VALUES (v_city_id, '89636000', '89636999');
  END IF;

END $$;
