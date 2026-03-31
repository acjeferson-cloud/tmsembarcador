-- Atualiza os códigos de ocorrência de 3 dígitos começando com '0' para 2 dígitos.
-- Ex: '001' -> '01', '099' -> '99', etc.
-- O código '100' permanecerá como '100', pois não começa com '0'.

UPDATE occurrences
SET codigo = SUBSTRING(codigo, 2)
WHERE LENGTH(codigo) = 3 AND codigo LIKE '0%';
