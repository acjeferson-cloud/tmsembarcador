import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Buscando dados para listar CIDADES com sobreposição de CEPs...");

  let allCities = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  while(hasMore) {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) { 
        console.error('Erro na tabela cities:', error);
        return;
    }
    if (data.length < pageSize) hasMore = false;
    allCities.push(...data);
    page++;
    if (page > 15) break; 
  }

  let allRanges = [];
  page = 0;
  hasMore = true;
  while(hasMore) {
    const { data, error } = await supabase
      .from('zip_code_ranges')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) { console.error('Erro na tabela zip_code_ranges:', error); return; }
    if (data.length < pageSize) hasMore = false;
    allRanges.push(...data);
    page++;
    if (page > 30) break;
  }

  const rangesParsed = allRanges.map(r => ({
    ...r,
    start: parseInt(String(r.start_zip).replace(/\D/g, '').padEnd(8, '0'), 10),
    end: parseInt(String(r.end_zip).replace(/\D/g, '').padEnd(8, '0'), 10)
  })).filter(r => !isNaN(r.start) && !isNaN(r.end));
  
  rangesParsed.sort((a, b) => a.start - b.start);
  
  const overlappingCityIds = new Set();

  for (let i = 0; i < rangesParsed.length - 1; i++) {
    const current = rangesParsed[i];
    const next = rangesParsed[i+1];
    
    if (current.end >= next.start) {
      overlappingCityIds.add(current.city_id);
      overlappingCityIds.add(next.city_id);
    }
  }

  const uniqueCities = Array.from(overlappingCityIds).map(id => {
    const city = allCities.find(c => c.id === id);
    return city ? `${city.nome} - ${city.estado_id}` : `ID Desconhecido: ${id}`;
  });

  uniqueCities.sort((a, b) => a.localeCompare(b));

  console.log(`\n=> Encontradas ${uniqueCities.length} cidades únicas envolvidas em sobreposições:`);
  console.log("--------------------------------------------------");
  uniqueCities.forEach(c => console.log(c));
  console.log("--------------------------------------------------");
}

main().catch(console.error);
