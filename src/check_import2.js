import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testHook() {
  const invoiceNum = '982635'; 
  
  console.log('1. Fetching NFE...');
  const { data: foundInvoice } = await supabase.from('invoices_nfe').select('id, numero, chave_acesso').eq('numero', invoiceNum).limit(1).maybeSingle();
  
  if (foundInvoice) {
    console.log('Found it:', foundInvoice);
    const { data: spotLinks } = await supabase
      .from('freight_spot_invoices')
      .select('negotiation_id')
      .eq('invoice_id', foundInvoice.id);

    console.log('Spot links:', spotLinks);
    
    if (spotLinks && spotLinks.length > 0) {
      const negIds = spotLinks.map((s) => s.negotiation_id);
      
      const { data: updateRes, error: updateErr } = await supabase
         .from('freight_spot_negotiations')
         .update({ status: 'aguardando_fatura' })
         .in('id', negIds)
         .eq('status', 'pendente_faturamento')
         .select('id, code, status');
         
      console.log('Update result:', updateRes, updateErr || '');
    }
  } else {
    console.log('NFe missing');
  }
}

testHook();
