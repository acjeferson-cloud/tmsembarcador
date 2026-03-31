-- Migration: Remove CEP Overlap Trigger
-- Description: Remove a trava/trigger de exclusão dupla que impedia a inserção de faixas de CEP que se cruzam.

DROP TRIGGER IF EXISTS validate_zip_code_overlap ON zip_code_ranges;
DROP FUNCTION IF EXISTS check_zip_code_range_overlap();
