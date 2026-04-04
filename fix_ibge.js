import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const fixes = [
  { id: '22417bcb-2b6a-42e8-86b7-b2f855c110df', nome: 'Maricá', official_ibge: '3302700' },
  { id: 'ded9fe33-6f53-4ad2-ac31-8589608ea8a2', nome: 'Três Pontas', official_ibge: '3169406' },
  { id: '836bfbac-5787-41e1-a790-3c871586304c', nome: 'Auriflama', official_ibge: '3504206' },
  { id: '7ed49950-2fa8-4518-96ba-53533fe793ac', nome: 'Juruaia', official_ibge: '3136900' },
  { id: 'ca36ffcf-c2ed-4f6f-9a67-3a70173eb084', nome: 'Irineópolis', official_ibge: '4207908' },
  { id: '1c567cab-68b3-41fd-8b3e-a556ffe94ff4', nome: 'Mariana', official_ibge: '3140001' },
  { id: '0cdb612c-7c38-40ae-9c03-e86357612a13', nome: 'Rio Negro', official_ibge: '4122305' }
];

async function run() {
  console.log('Starting IBGE fix...');
  let successCount = 0;
  for (const f of fixes) {
    const { data, error } = await supabase.from('cities').update({ codigo_ibge: f.official_ibge }).eq('id', f.id);
    if (error) {
      console.error(`Error updating ${f.nome}:`, error);
    } else {
      console.log(`Successfully updated ${f.nome} to ${f.official_ibge}`);
      successCount++;
    }
  }
  console.log(`Finished fixing ${successCount}/${fixes.length} cities.`);
}

run();
