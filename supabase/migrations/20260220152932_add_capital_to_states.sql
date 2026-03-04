/*
  # Add capital column to states table

  1. Schema Changes
    - Add `capital` column (text) to store state capital
  
  2. Data Migration
    - Update all Brazilian states with their respective capitals
*/

-- Add capital column to states table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'states' AND column_name = 'capital'
  ) THEN
    ALTER TABLE states ADD COLUMN capital text;
  END IF;
END $$;

-- Update Brazilian states with their capitals
UPDATE states 
SET capital = CASE sigla
  WHEN 'AC' THEN 'Rio Branco'
  WHEN 'AL' THEN 'Maceió'
  WHEN 'AP' THEN 'Macapá'
  WHEN 'AM' THEN 'Manaus'
  WHEN 'BA' THEN 'Salvador'
  WHEN 'CE' THEN 'Fortaleza'
  WHEN 'DF' THEN 'Brasília'
  WHEN 'ES' THEN 'Vitória'
  WHEN 'GO' THEN 'Goiânia'
  WHEN 'MA' THEN 'São Luís'
  WHEN 'MT' THEN 'Cuiabá'
  WHEN 'MS' THEN 'Campo Grande'
  WHEN 'MG' THEN 'Belo Horizonte'
  WHEN 'PA' THEN 'Belém'
  WHEN 'PB' THEN 'João Pessoa'
  WHEN 'PR' THEN 'Curitiba'
  WHEN 'PE' THEN 'Recife'
  WHEN 'PI' THEN 'Teresina'
  WHEN 'RJ' THEN 'Rio de Janeiro'
  WHEN 'RN' THEN 'Natal'
  WHEN 'RS' THEN 'Porto Alegre'
  WHEN 'RO' THEN 'Porto Velho'
  WHEN 'RR' THEN 'Boa Vista'
  WHEN 'SC' THEN 'Florianópolis'
  WHEN 'SP' THEN 'São Paulo'
  WHEN 'SE' THEN 'Aracaju'
  WHEN 'TO' THEN 'Palmas'
END
WHERE country_id = (SELECT id FROM countries WHERE codigo = 'BR' LIMIT 1);