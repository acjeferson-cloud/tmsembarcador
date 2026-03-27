import { supabase } from './src/lib/supabase';

async function check() {
  const { data: invoice, error } = await supabase
    .from('invoices_nfe')
    .select(`
      id,
      numero,
      order_number
    `)
    .eq('numero', '945679')
    .single();
    
  console.log('Invoice:', invoice, 'Error:', error);
  
  if (invoice?.order_number) {
    const { data: order } = await supabase.from('orders').select('*').eq('numero_pedido', invoice.order_number).single();
    if (order) {
       console.log('Order found! Tracking code:', order.codigo_rastreio);
    } else {
       console.log('Order NOT found for order_number:', invoice.order_number);
       
       const { data: searchOrder } = await supabase.from('orders').select('*').eq('numero_pedido', '512460').single();
       console.log('But order 512460 exists?', !!searchOrder, 'tracking:', searchOrder?.codigo_rastreio);
    }
  } else {
     console.log('NO ORDER NUMBER ON INVOICE!');
     
     const { data: searchOrder } = await supabase.from('orders').select('*').eq('numero_pedido', '512460').single();
     console.log('But order 512460 exists?', !!searchOrder, 'tracking:', searchOrder?.codigo_rastreio);
     
     // let's check invoice metadata
     const { data: fullInvoice } = await supabase.from('invoices_nfe').select('metadata').eq('numero', '945679').single();
     console.log('Invoice Metadata:', JSON.stringify(fullInvoice?.metadata).substring(0, 100));
  }
}

check().catch(console.error);
