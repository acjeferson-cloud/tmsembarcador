import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: orderData } = await supabaseAdmin.from('orders').select('*').eq('numero_pedido', '512460').maybeSingle();
  const { data: invoices } = await supabaseAdmin.from('invoices_nfe').select('*').eq('numero_pedido', '512460');
  const { data: invoiceByNum } = await supabaseAdmin.from('invoices_nfe').select('*').eq('number', '512460');
  
  let ctesByInvoice = [];
  if (invoices && invoices.length > 0) {
     const inv = invoices[0];
     const invNum = inv.number || inv.numero;
     if (invNum) {
       const { data } = await supabaseAdmin.from('ctes_complete').select('*').or(`invoice_number.eq.${invNum},numero_nfe.eq.${invNum}`);
       ctesByInvoice = data || [];
     }
  }

  return new Response(JSON.stringify({ 
    orderMeta: orderData?.metadata,
    invoicesMeta: invoices?.map(i => i.metadata),
    invoiceByNumMeta: invoiceByNum?.map(i => i.metadata),
    ctesMeta: ctesByInvoice.map((c: any) => c.metadata)
  }), { headers: { 'Content-Type': 'application/json' } })
})
