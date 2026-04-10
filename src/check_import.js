import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function simulateCteImportHook() {
  const invNumber = '42260482981721000194550020009826351490722713'; // First try access key
  const invNumberShort = '982635'; // Then try short number
  
  for (const num of [invNumber, invNumberShort]) {
    console.log(`\nTesting with XML tag <chave> / <nDoc>: ${num}`);
    let query = supabase.from('invoices_nfe').select('id, numero, chave_acesso').limit(1);
    
    if (num.length === 44) {
      query = query.eq('chave_acesso', num);
    } else {
      query = query.eq('numero', num);
    }
    
    const { data: foundInvoice, error: invError } = await query.maybeSingle();
    
    console.log('Found Invoice NFE:', foundInvoice || 'None', invError || '');
    
    if (foundInvoice) {
      const { data: spotLinks, error: spotError } = await supabase
         .from('freight_spot_invoices')
         .select('negotiation_id')
         .eq('invoice_id', foundInvoice.id);
         
      console.log('Spot Links:', spotLinks || 'None', spotError || '');
      
      if (spotLinks && spotLinks.length > 0) {
         const negIds = spotLinks.map(s => s.negotiation_id);
         console.log('Would update negotiation_ids:', negIds);
         
         const { data: updated, error: updateError } = await supabase
           .from('freight_spot_negotiations')
           .update({ status: 'aguardando_fatura' })
           .in('id', negIds)
           .eq('status', 'pendente_faturamento')
           .select();
           
         console.log('Update result:', updated, updateError || '');
      }
    }
  }
}

simulateCteImportHook();
