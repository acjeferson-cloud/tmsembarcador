-- Migration: Prevent CEP Overlap Trigger
-- Description: Cria uma função de segurança de banco (PostgreSQL) para interceptar
-- e impedir a inserção de faixas de CEP que se cruzem/sobreponham geograficamente na mesma cidade.

-- 1. Cria a Função que executará a algoritmia de bloqueio matemático
CREATE OR REPLACE FUNCTION check_zip_code_range_overlap()
RETURNS TRIGGER AS $$
DECLARE
    new_start BIGINT;
    new_end BIGINT;
    overlapping_id UUID;
BEGIN
    -- Segurança contra strings vazias ou nulas
    IF NEW.start_zip IS NULL OR NEW.end_zip IS NULL THEN
        RETURN NEW;
    END IF;

    -- Converte a faixa que está ENTRANDO no banco para Inteiro Padronizado
    -- (Remove símbolos com Regexp Regex e garante padding fixo se quiser, mas aqui limpamos \D apenas)
    new_start := CAST(RPAD(REGEXP_REPLACE(NEW.start_zip, '\D', '', 'g'), 8, '0') AS BIGINT);
    new_end := CAST(RPAD(REGEXP_REPLACE(NEW.end_zip, '\D', '', 'g'), 8, '0') AS BIGINT);

    -- Procura avidamente por N-1 registros onde o range seja entrelaçado ao Range novo
    SELECT id INTO overlapping_id
    FROM zip_code_ranges
    WHERE city_id = NEW.city_id
      AND id IS DISTINCT FROM NEW.id -- Não avalia a si mesmo (Útil para UPDATEs)
      AND CAST(RPAD(REGEXP_REPLACE(start_zip, '\D', '', 'g'), 8, '0') AS BIGINT) <= new_end
      AND CAST(RPAD(REGEXP_REPLACE(end_zip, '\D', '', 'g'), 8, '0') AS BIGINT) >= new_start
    LIMIT 1;

    -- Se 'FOUND' (encontrou ao menos uma colisão transversal), Aborta o INSERT/UPDATE!
    IF FOUND THEN
        RAISE EXCEPTION 'A faixa (% - %) engloba ou choca-se com uma faixa de CEP já pré-cadastrada no município. Arquitetura TMS Exclusão Dupla acionada.', NEW.start_zip, NEW.end_zip;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Limpa o trigger caso já exista (Idempotência)
DROP TRIGGER IF EXISTS validate_zip_code_overlap ON zip_code_ranges;

-- 3. Acopla o Trigger (Gatilho) estrito diretamente na tabela
CREATE TRIGGER validate_zip_code_overlap
BEFORE INSERT OR UPDATE ON zip_code_ranges
FOR EACH ROW
EXECUTE FUNCTION check_zip_code_range_overlap();
