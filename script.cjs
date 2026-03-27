require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: invoice, error } = await supabase.from('invoices_nfe').select('numero, order_number, numero_pedido').eq('numero', '945679').single();
  console.log('Invoice:', invoice, 'Error:', error);
  
  if (invoice) {
     const ordNum = invoice.order_number || invoice.numero_pedido;
     console.log('Resolved ordNum:', ordNum);
     if (ordNum) {
        const { data: order, error: ordErr } = await supabase.from('orders').select('codigo_rastreio').eq('numero_pedido', ordNum).limit(1);
        console.log('Orders found by ordNum:', order, 'Err:', ordErr);
     }
  }
}
run();
