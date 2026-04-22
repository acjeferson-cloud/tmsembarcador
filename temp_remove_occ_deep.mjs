import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTable(tableName) {
  try {
    const { data: allRecords, error } = await supabase.from(tableName).select('id, metadata').not('metadata', 'is', null);
    if (error) {
       console.log(`Table ${tableName} no metadata column or error: ${error.message}`);
       return;
    }
    
    if (allRecords && Array.isArray(allRecords)) {
      for (const rec of allRecords) {
        if (rec.metadata && Array.isArray(rec.metadata.occurrences)) {
           const occs = rec.metadata.occurrences;
           const originalLen = occs.length;
           const filtered = occs.filter(o => !(o.codigo === '01' || String(o.codigo) === '01' || (o.descricao && o.descricao.includes('Entrega Realizada Normalmente'))));
           
           if (filtered.length !== originalLen) {
              rec.metadata.occurrences = filtered;
              await supabase.from(tableName).update({ metadata: rec.metadata }).eq('id', rec.id);
              console.log(`Cleaned occurrence '01' from ${tableName} ID: ${rec.id}`);
           }
        }
      }
    }
  } catch(e) {
    console.log(`Failed on ${tableName}: ${e.message}`);
  }
}

async function run() {
  await cleanTable('orders');
  await cleanTable('invoices_nfe');
  await cleanTable('pickups');
  // Avoid ctes_complete because metadata doesn't exist
  
  console.log('Finished deep cleaning!');
}

run();
