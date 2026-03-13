import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // fallback user key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const estabId = 'bb1f07f8-a367-4296-b91b-5fc50dca2175';
  console.log(`Testando busca de config SMTP para ${estabId}`);
  
  const { data, error } = await supabase
    .from('email_outgoing_config')
    .select('*')
    .eq('establishment_id', estabId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
    console.log("Resultado Supabase:", { data, error });
    
  console.log("\nProcurando QUAIS são os establishments que POSSUEM config:");
  const { data: allConfigs } = await supabase
    .from('email_outgoing_config')
    .select('id, establishment_id, from_email, from_name, ativo');
    
  console.log("Todas as configs encontradas no banco:", allConfigs);
}

check();
