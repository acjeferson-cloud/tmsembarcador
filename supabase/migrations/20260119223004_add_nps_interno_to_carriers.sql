/*
  # Adicionar NPS Interno aos Transportadores

  ## Alterações
  
  1. **Tabela: carriers**
     - Adiciona coluna `nps_interno` (numeric) - Armazena a nota NPS interna do transportador (0-10)
  
  ## Notas
  
  - O campo permite valores decimais para maior precisão
  - Valores válidos: 0.0 a 10.0
  - Campo opcional (pode ser NULL se ainda não foi avaliado)
*/

-- Adicionar coluna nps_interno à tabela carriers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carriers' AND column_name = 'nps_interno'
  ) THEN
    ALTER TABLE carriers ADD COLUMN nps_interno numeric(3,1);
  END IF;
END $$;

-- Adicionar comentário
COMMENT ON COLUMN carriers.nps_interno IS 'Nota NPS interna do transportador (0-10)';
