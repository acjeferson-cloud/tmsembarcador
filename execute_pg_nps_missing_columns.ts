import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function run() {
  const connectionString = process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')
    : '';

  const dbUrl = process.env.DATABASE_URL || connectionString;

  if (!dbUrl) {
    console.error('Missing DB connection string');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    
    console.log("Adding missing columns to NPS tables...");
    
    // We can also read from the migration file or just execute the SQL here directly.
    // Let's run the exact SQL we need directly to ensure everything is perfect.
    
    await client.query(`
      -- 1. Add missing columns to nps_pesquisas_cliente
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES public.establishments(id);
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS transportador_id uuid REFERENCES public.carriers(id);
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS cliente_telefone text;
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS canal_envio text CHECK (canal_envio IN ('whatsapp', 'email', 'sms'));
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS token_pesquisa text UNIQUE;
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS opinioes jsonb DEFAULT '{}';
      ALTER TABLE public.nps_pesquisas_cliente ADD COLUMN IF NOT EXISTS avaliar_anonimo boolean DEFAULT false;

      -- Populate token_pesquisa from token if missing
      UPDATE public.nps_pesquisas_cliente SET token_pesquisa = token WHERE token_pesquisa IS NULL;

      -- 2. Add missing columns to nps_avaliacoes_internas
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS establishment_id uuid REFERENCES public.establishments(id);
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS periodo_inicio date;
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS periodo_fim date;
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS nota_final decimal(10,2);
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS metricas jsonb DEFAULT '{}';
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS total_entregas integer DEFAULT 0;
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS entregas_no_prazo integer DEFAULT 0;
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS entregas_com_ocorrencia integer DEFAULT 0;
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS tempo_medio_atualizacao decimal(10,2);
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS tempo_medio_pod decimal(10,2);
      ALTER TABLE public.nps_avaliacoes_internas ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

      -- Update CHECK constraints for status to include feminine forms used by front-end
      ALTER TABLE public.nps_pesquisas_cliente DROP CONSTRAINT IF EXISTS nps_pesquisas_cliente_status_check;
      ALTER TABLE public.nps_pesquisas_cliente ADD CONSTRAINT nps_pesquisas_cliente_status_check CHECK (status IN ('pendente', 'respondido', 'respondida', 'expirado', 'expirada'));

      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log("Success! Extracted and added missing columns to NPS tables.");
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
