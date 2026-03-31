import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allCities = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  while(hasMore) {
    const { data, error } = await supabase
      .from('cities')
      .select('id, nome, uf:estado_id') 
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) { 
        const fallback = await supabase.from('cities').select('*').range(page * pageSize, (page + 1) * pageSize - 1);
        if (fallback.data.length < pageSize) hasMore = false;
        allCities.push(...fallback.data);
    } else {
        if (data.length < pageSize) hasMore = false;
        allCities.push(...data);
    }
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
    
    if (data.length < pageSize) hasMore = false;
    allRanges.push(...data);
    page++;
    if (page > 30) break;
  }

  const citiesWithCep = new Set(allRanges.map(r => r.city_id));
  const citiesWithoutCep = allCities.filter(c => !citiesWithCep.has(c.id));
  
  citiesWithoutCep.sort((a,b) => a.nome.localeCompare(b.nome));

  console.log(`TOTAL:${citiesWithoutCep.length}\n`);
  citiesWithoutCep.forEach(c => console.log(`- ${c.nome}`));
}

main().catch(console.error);
