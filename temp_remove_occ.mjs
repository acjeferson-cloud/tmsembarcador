import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  console.log(`Checking ${tableName}...`);
  const { data, error } = await supabase
    .from(tableName)
    .select('id, metadata')
    .not('metadata', 'is', null);

  if (error) {
    console.error(`Error fetching from ${tableName}:`, error.message);
    return;
  }

  for (const row of data) {
    if (row.metadata && Array.isArray(row.metadata.occurrences)) {
      const occurrences = row.metadata.occurrences;
      const index = occurrences.findIndex(o => o.codigo === '01' && o.descricao === 'Entrega Realizada Normalmente');
      if (index !== -1) {
        console.log(`Found occurrence in ${tableName} id: ${row.id}`);
        // Remove it
        occurrences.splice(index, 1);
        row.metadata.occurrences = occurrences;
        
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ metadata: row.metadata })
          .eq('id', row.id);
          
        if (updateError) {
          console.error(`Error updating ${row.id}:`, updateError.message);
        } else {
          console.log(`Successfully removed occurrence from ${row.id}`);
        }
      }
    }
  }
}

async function run() {
  await checkTable('orders');
  await checkTable('invoices_nfe');
  await checkTable('ctes_complete');
  await checkTable('pickups');
  console.log('Done!');
}

run();
