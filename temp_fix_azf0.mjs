import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndClean(tableName, id) {
  if (!id) return;
  const { data } = await supabase.from(tableName).select('metadata').eq('id', id).single();
  if (!data || !data.metadata) {
     console.log(`No metadata for ${tableName} id ${id}`);
     return;
  }
  
  if (data.metadata.occurrences && Array.isArray(data.metadata.occurrences)) {
     console.log(`[${tableName}] Occurrences before:`);
     data.metadata.occurrences.forEach(o => console.log(`  - [${o.codigo}] ${o.descricao}`));
     
     const originalLen = data.metadata.occurrences.length;
     const filtered = data.metadata.occurrences.filter(o => o.codigo !== '01');
     
     if (filtered.length !== originalLen) {
        data.metadata.occurrences = filtered;
        await supabase.from(tableName).update({ metadata: data.metadata }).eq('id', id);
        console.log(`=> REMOVED occurrence '01' from ${tableName} ${id}`);
     } else {
        console.log(`=> No occurrence '01' to remove in ${tableName} ${id}`);
     }
  } else {
     console.log(`[${tableName}] No occurrences array in metadata`);
  }
}

async function run() {
  const trackingCode = '0001-1-26-AZF0-8';
  console.log(`Looking for tracking code: ${trackingCode}`);
  
  const { data: order } = await supabase.from('orders').select('*').eq('tracking_code', trackingCode).single();
  
  if (!order) {
    console.log('Order not found!');
    return;
  }
  
  console.log(`Found order: ${order.order_number} (ID: ${order.id})`);
  await checkAndClean('orders', order.id);
  
  const { data: invoices } = await supabase.from('invoices_nfe').select('*').eq('order_number', order.order_number);
  for (const inv of (invoices || [])) {
     console.log(`Found invoice: ${inv.numero || inv.number} (ID: ${inv.id})`);
     await checkAndClean('invoices_nfe', inv.id);
     
     // ctes_complete doesn't have metadata column usually, but let's check ctes_invoices
     // or just check ctes_complete status
  }
}

run();
