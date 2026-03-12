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
    
    console.log("Fixing RLS for NPS tables...");
    
    await client.query(`
      DROP POLICY IF EXISTS "Users can view NPS surveys from their org/env" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Anon can view NPS surveys with context" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Public can view NPS survey by token" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Users can insert NPS surveys in their org/env" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Anon can insert NPS surveys with context" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Users can update NPS surveys in their org/env" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Anon can update NPS surveys with context" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "Public can update NPS survey response by token" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_select" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_insert" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_update" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "nps_pesquisas_cliente_isolation_delete" ON public.nps_pesquisas_cliente;

      DROP POLICY IF EXISTS "Users can view internal evaluations from their org/env" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "Anon can view internal evaluations with context" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "Users can insert internal evaluations in their org/env" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "Anon can insert internal evaluations with context" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "Users can update internal evaluations in their org/env" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "Anon can update internal evaluations with context" ON public.nps_avaliacoes_internas;

      DROP POLICY IF EXISTS "Users can view send history from their org/env" ON public.nps_historico_envios;
      DROP POLICY IF EXISTS "Anon can view send history with context" ON public.nps_historico_envios;
      DROP POLICY IF EXISTS "Users can insert send history in their org/env" ON public.nps_historico_envios;
      DROP POLICY IF EXISTS "Anon can insert send history with context" ON public.nps_historico_envios;

      DROP POLICY IF EXISTS "anon_all_nps_pesquisas" ON public.nps_pesquisas_cliente;
      DROP POLICY IF EXISTS "anon_all_nps_avaliacoes" ON public.nps_avaliacoes_internas;
      DROP POLICY IF EXISTS "anon_all_nps_historico" ON public.nps_historico_envios;

      CREATE POLICY "anon_all_nps_pesquisas" ON public.nps_pesquisas_cliente FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_nps_avaliacoes" ON public.nps_avaliacoes_internas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
      CREATE POLICY "anon_all_nps_historico" ON public.nps_historico_envios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

      ALTER TABLE public.nps_pesquisas_cliente ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.nps_avaliacoes_internas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.nps_historico_envios ENABLE ROW LEVEL SECURITY;

      NOTIFY pgrst, 'reload schema';
    `);
    
    console.log("Success! RLS policies for NPS tables have been made permissive.");
  } catch(e) {
    console.error("Error", e);
  } finally {
    await client.end();
  }
}

run();
