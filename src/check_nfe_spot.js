import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const chave = '42260482981721000194550020009826351490722713';
  
  console.log('Checking invoice with access key:', chave);
  const { data: invoice, error: invErr } = await supabase.from('invoices_nfe')
    .select('id, numero, chave_acesso')
    .eq('chave_acesso', chave)
    .limit(1)
    .maybeSingle();
    
  if (invErr) console.error('Invoice error:', invErr);
  if (!invoice) {
    console.log('Invoice NOT FOUND by chave_acesso!');
    // Try by numero just in case it is padded or substring
    const numero = chave.substring(25, 34); // typical position for number
    console.log('Trying by numero substring:', numero);
    const { data: inv2 } = await supabase.from('invoices_nfe')
      .select('id, numero, chave_acesso')
      .eq('numero', numero)
      .limit(1)
      .maybeSingle();
    console.log('Found by numero?', !!inv2, inv2);
    return;
  }
  
  console.log('Found Invoice:', invoice);
  
  console.log('Checking if it is linked to a Spot Negotiation...');
  const { data: spotInvoices, error: spotErr } = await supabase.from('freight_spot_invoices')
    .select('*')
    .eq('invoice_id', invoice.id);
    
  if (spotErr) console.error('Spot invoice error:', spotErr);
  console.log('Spot Invoices for this NFE:', spotInvoices);
  
  if (spotInvoices && spotInvoices.length > 0) {
    for (const spotInv of spotInvoices) {
      console.log('Checking Spot Header:', spotInv.negotiation_id);
      const { data: header } = await supabase.from('freight_spot_negotiations')
        .select('id, status')
        .eq('id', spotInv.negotiation_id)
        .single();
      console.log('Spot Header:', header);
    }
  }
}

check();
