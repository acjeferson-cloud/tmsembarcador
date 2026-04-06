/*
  # Scoped Quote Number Trigger
  Altera o comportamento da numeração das cotações de frete para seguir um sequencial isolado 
  por organization_id, environment_id e establishment_id.
*/

-- Remover valor default e a sequence global
ALTER TABLE freight_quotes_history ALTER COLUMN quote_number DROP DEFAULT;
DROP SEQUENCE IF EXISTS freight_quotes_history_quote_number_seq;

-- Limpar todo o hitórico de cotações para recomeçar
DELETE FROM freight_quotes_history;

-- Criar ou substituir a função que busca e isola o sequencial
CREATE OR REPLACE FUNCTION fn_set_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Busca o maior sequence + 1 para a exata organização, ambiente e estabelecimento
  SELECT COALESCE(MAX(quote_number), 0) + 1 INTO next_num
  FROM freight_quotes_history
  WHERE organization_id = NEW.organization_id
    AND environment_id = NEW.environment_id
    AND (establishment_id = NEW.establishment_id OR (establishment_id IS NULL AND NEW.establishment_id IS NULL));
    
  NEW.quote_number := next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Engatar a trigger na tabela
DROP TRIGGER IF EXISTS trg_set_quote_number ON freight_quotes_history;
CREATE TRIGGER trg_set_quote_number
BEFORE INSERT ON freight_quotes_history
FOR EACH ROW
EXECUTE FUNCTION fn_set_quote_number();
