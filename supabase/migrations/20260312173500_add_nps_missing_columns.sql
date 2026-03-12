-- Migration to synchronize nps tables with front-end fields expectation (npsService.ts)

-- 1. Add missing columns to nps_pesquisas_cliente
ALTER TABLE nps_pesquisas_cliente
ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES establishments(id),
ADD COLUMN IF NOT EXISTS transportador_id uuid REFERENCES carriers(id),
ADD COLUMN IF NOT EXISTS cliente_telefone text,
ADD COLUMN IF NOT EXISTS canal_envio text CHECK (canal_envio IN ('whatsapp', 'email', 'sms')),
ADD COLUMN IF NOT EXISTS token_pesquisa text UNIQUE,
ADD COLUMN IF NOT EXISTS opinioes jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avaliar_anonimo boolean DEFAULT false;

-- The token column already existed as "token". Let's copy it to "token_pesquisa" or just use "token_pesquisa" as the unique identifier.
UPDATE nps_pesquisas_cliente SET token_pesquisa = token WHERE token_pesquisa IS NULL;

-- 2. Add missing columns to nps_avaliacoes_internas
ALTER TABLE nps_avaliacoes_internas
ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES establishments(id),
ADD COLUMN IF NOT EXISTS periodo_inicio date,
ADD COLUMN IF NOT EXISTS periodo_fim date,
ADD COLUMN IF NOT EXISTS nota_final decimal(10,2),
ADD COLUMN IF NOT EXISTS metricas jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_entregas integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS entregas_no_prazo integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS entregas_com_ocorrencia integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_medio_atualizacao decimal(10,2),
ADD COLUMN IF NOT EXISTS tempo_medio_pod decimal(10,2),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update CHECK constraints for status to include feminine forms used by front-end
ALTER TABLE nps_pesquisas_cliente DROP CONSTRAINT IF EXISTS nps_pesquisas_cliente_status_check;
ALTER TABLE nps_pesquisas_cliente ADD CONSTRAINT nps_pesquisas_cliente_status_check
CHECK (status IN ('pendente', 'respondido', 'respondida', 'expirado', 'expirada'));
