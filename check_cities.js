import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check Auriflama
  const { data: auri, error: e1 } = await supabase.from('cities').select('id, nome, codigo_ibge, estado:state_id(nome, sigla)').ilike('nome', '%auriflama%');
  if (e1) console.error("Error 1:", e1);
  console.log("Auriflama:", JSON.stringify(auri, null, 2));

  // Fetch all cities from Supabase using pagination
  let allDbCities = [];
  let hasMore = true;
  let page = 0;
  while (hasMore) {
    const { data: chunk, error } = await supabase.from('cities').select('id, nome, codigo_ibge, estado:state_id(sigla)').range(page * 1000, (page + 1) * 1000 - 1);
    allDbCities = allDbCities.concat(chunk);
    if (chunk.length < 1000) hasMore = false;
    page++;
  }
  
  console.log(`Supabase total cities: ${allDbCities.length}`);

  // Fetch official IBGE cities
  console.log('Fetching official IBGE list...');
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
  const ibgeCities = await res.json();
  console.log(`Official total cities: ${ibgeCities.length}`);

  let mismatches = [];
  
  for (const dbCity of allDbCities) {
    if (!dbCity.estado) continue;
    const uf = dbCity.estado.sigla;
    const dbNome = dbCity.nome.toLowerCase().trim();
    
    // Find matching city in IBGE by name and UF
    const official = ibgeCities.find(c => c.nome.toLowerCase().trim() === dbNome && c?.microrregiao?.mesorregiao?.UF?.sigla === uf);
    
    if (official && official.id.toString() !== dbCity.codigo_ibge.toString()) {
      mismatches.push({
        id: dbCity.id,
        nome: dbCity.nome,
        uf: uf,
        db_ibge: dbCity.codigo_ibge,
        official_ibge: official.id.toString()
      });
    }
  }

  console.log(`Found ${mismatches.length} mismatches!`);
  if (mismatches.length > 0) {
    console.log("All mismatches:");
    console.log(JSON.stringify(mismatches, null, 2));
  }
}

check();
