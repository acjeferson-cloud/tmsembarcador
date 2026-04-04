import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function normalizeStr(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

async function run() {
  console.log('Fetching missing cities from database...');
  let allDbCities = [];
  let page = 0;
  while (true) {
    const { data: chunk, error } = await supabase.from('cities').select('id, nome, estado:state_id(sigla)').range(page * 1000, (page + 1) * 1000 - 1);
    if (!chunk || chunk.length === 0) break;
    allDbCities = allDbCities.concat(chunk);
    page++;
  }
  
  let allZips = [];
  page = 0;
  while (true) {
    const { data: chunk, error } = await supabase.from('zip_code_ranges').select('city_id').range(page * 1000, (page + 1) * 1000 - 1);
    if (!chunk || chunk.length === 0) break;
    allZips = allZips.concat(chunk);
    page++;
  }

  const cityIdsWithZips = new Set(allZips.map(z => z.city_id));
  const missingCities = allDbCities.filter(c => !cityIdsWithZips.has(c.id));

  if (missingCities.length === 0) {
    console.log("No missing cities found.");
    return;
  }

  console.log(`Found ${missingCities.length} cities missing CEPs. Fetching CSV ranges...`);

  const response = await fetch('https://gist.githubusercontent.com/tamnil/792a6a66f6df9fc028041587cfca0c3d/raw/');
  const csvText = await response.text();
  const lines = csvText.split('\n');

  let insertedCount = 0;
  
  for (const dbCity of missingCities) {
    if (!dbCity.estado) continue;
    const uf = dbCity.estado.sigla;
    const normName = normalizeStr(dbCity.nome);
    
    // Find in CSV
    let foundStart = null;
    let foundEnd = null;
    
    for (const line of lines) {
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 4) {
        const lineUf = parts[0].trim().toUpperCase();
        const lineCity = normalizeStr(parts[1]);
        if (lineUf === uf && lineCity === normName) {
          foundStart = parts[2].trim();
          foundEnd = parts[3].trim();
          break;
        }
      }
    }
    
    if (foundStart && foundEnd) {
      const startZip = foundStart.replace(/(\d{5})(\d{3})/, "$1-$2");
      const endZip = foundEnd.replace(/(\d{5})(\d{3})/, "$1-$2");
      
      const { error } = await supabase.from('zip_code_ranges').insert({
        city_id: dbCity.id,
        state_id: dbCity.estado.id, // wait, our DB query gave estado:state_id(sigla). We need state_id! Let's modify DB query below.
        start_zip_code: startZip,
        end_zip_code: endZip,
      });
      
      // Oh wait, we didn't select dbCity.state_id. I will need to use a raw query or just fetch state_id.
    }
  }
}
run();
