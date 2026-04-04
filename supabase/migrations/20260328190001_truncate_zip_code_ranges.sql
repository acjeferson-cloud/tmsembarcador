/*
  # Limpar tabela zip_code_ranges
  
  Esta migration executa o TRUNCATE na tabela de faixas de CEP para que possamos importar faixas precisas (baseadas no DNE) evitando conflitos generalizados.
*/

-- TRUNCATE TABLE zip_code_ranges RESTART IDENTITY CASCADE; -- DESATIVADO PARA EVITAR EXCLUSÃO EM DEPLOYS FUTUROS
