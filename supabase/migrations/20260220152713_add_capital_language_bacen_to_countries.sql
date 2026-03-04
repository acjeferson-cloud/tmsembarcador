/*
  # Add capital, language and BACEN code columns to countries table

  1. Schema Changes
    - Add `capital` column (text) to store country capital
    - Add `idioma_principal` column (text) to store primary language
    - Add `codigo_bacen` column (text) to store BACEN code
  
  2. Notes
    - These fields are optional
    - No data migration needed - fields will be null initially
*/

-- Add new columns to countries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'countries' AND column_name = 'capital'
  ) THEN
    ALTER TABLE countries ADD COLUMN capital text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'countries' AND column_name = 'idioma_principal'
  ) THEN
    ALTER TABLE countries ADD COLUMN idioma_principal text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'countries' AND column_name = 'codigo_bacen'
  ) THEN
    ALTER TABLE countries ADD COLUMN codigo_bacen text;
  END IF;
END $$;