require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Step 1: find order
  const { data: orders } = await supabase.from('orders').select('*');
  const searchCode = '0001-1-26-AZF0-8';
  const order = orders.find(o => o.codigo_rastreio?.toLowerCase().includes(searchCode.toLowerCase()));
  
  if (!order) {
    console.log('Order not found');
    return;
  }
  
  const mappedOrderNum = order.numero_pedido || order.numero || '';
  console.log('Mapped Order Number:', mappedOrderNum);
  
  // Step 2: find invoice
  const { data: invoices, error } = await supabase
    .from('invoices_nfe')
    .select('id, numero, order_number')
    .eq('order_number', mappedOrderNum)
    .limit(1)
    .maybeSingle();
    
  console.log('Invoice found by eq:', invoices, 'Error:', error?.message);
  
  // Just in case, let's list all invoices matching
  const { data: list } = await supabase.from('invoices_nfe').select('numero, order_number');
  const manualFind = list.find(i => i.order_number === mappedOrderNum);
  console.log('Manual find in all invoices:', manualFind);
}
run().catch(console.error);
