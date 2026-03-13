import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // fallback user key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNPS() {
  console.log('Testando busca de Pesquisas Cliente...');
  
  // Pegando o primeiro establishment_id válido de uma pesquisa para testar
  const { data: npsData, error: npsError } = await supabase
    .from('nps_pesquisas_cliente')
    .select('establishment_id')
    .limit(1);

  console.log('Sample Establishments em pesquisas:', npsData, npsError);

  const testEstablishment = npsData?.[0]?.establishment_id || 'bb1f07f8-a367-4296-b91b-5fc50dca2175';

  console.log(`\nFazendo group by de Ranking para establishment ${testEstablishment}`);
  
  const { data, error } = await supabase
    .from('nps_pesquisas_cliente')
    .select(`
      transportador_id,
      nota,
      transportador:carriers(razao_social)
    `)
    .eq('establishment_id', testEstablishment)
    .eq('status', 'respondida');
    
  if (error) {
    console.error('ERRO AO BUSCAR RANKING:', error);
  } else {
    console.log(`SUCESSO. Foram encontrados ${data?.length} registros.`);
    if (data && data.length > 0) console.log('Amostra:', data[0]);
  }
}

checkNPS();
