import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // fetch is native in node 20
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log('Fetching SC cities from IBGE...');
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/SC/municipios');
  const ibgeCities = await res.json();
  const ibgeNames = ibgeCities.map(c => c.nome.toUpperCase().trim());
  const ibgeCodes = ibgeCities.map(c => c.id.toString());
  console.log(`IBGE has ${ibgeCities.length} cities for SC.`);

  console.log('Fetching SC from states table...');
  const { data: stateData, error: stateErr } = await supabase.from('states').select('id').eq('sigla', 'SC').single();
  
  if (stateErr || !stateData) {
    console.error("Could not find SC in states table.");
    return;
  }
  
  const scId = stateData.id;
  console.log('SC state_id:', scId);
  
  console.log('Fetching cities from DB for SC...');
  const { data: dbCities, error } = await supabase.from('cities').select('nome, codigo_ibge').eq('state_id', scId);

  if (error) {
    console.error("Error fetching cities", error);
    return;
  }
  
  const dbNames = dbCities.map(c => c.nome.toUpperCase().trim());
  const dbCodes = dbCities.map(c => c.codigo_ibge);
  console.log(`Database has ${dbCities.length} cities for SC.`);
  
  const missingByCode = ibgeCities.filter(c => !dbCodes.includes(c.id.toString()));
  const missingByName = ibgeCities.filter(c => !dbNames.includes(c.nome.toUpperCase().trim()));

  console.log("-----------------------------------------");
  console.log("Missing by IBGE Code:");
  console.log(missingByCode.map(c => c.nome).join(", "));
  
  console.log("-----------------------------------------");
  console.log("Missing by Exact Name Match:");
  console.log(missingByName.map(c => c.nome).join(", "));
}

run();
