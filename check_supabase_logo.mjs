import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), '');
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Variáveis do supabase não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogo() {
  console.log("Fetching by CNPJ '82981721000194' (Matriz Log Axis)...");
  
  const { data, error } = await supabase.from('establishments').select('*').eq('cnpj', '82981721000194').maybeSingle();
  
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  console.log("DB returned:", data ? true : false);
  if (data) {
     console.log("ID:", data.id);
     console.log("Codigo:", data.codigo);
     console.log("Metadata existe?", !!data.metadata);
     console.log("Logo_url nativa:", data.logo_url ? data.logo_url.substring(0,40) + '...' : 'NULL');
     console.log("Logo_light_base64 nativa:", data.logo_light_base64 ? data.logo_light_base64.substring(0,40) + '...' : 'NULL');
     if (data.metadata) {
         console.log("Metadata.logo_url:", data.metadata.logo_url ? data.metadata.logo_url.substring(0,40) + '...' : 'NULL');
         console.log("Metadata.logo_light_base64:", data.metadata.logo_light_base64 ? data.metadata.logo_light_base64.substring(0,40) + '...' : 'NULL');
     }
  }
  
  console.log("--- fetching by codigo 1 ---");
  const { data: d2 } = await supabase.from('establishments').select('*').eq('codigo', 1).maybeSingle();
  if (d2) {
     console.log("ID 1:", d2.id);
     console.log("Metadata 1 existe?", !!d2.metadata);
  }
}

testLogo();
