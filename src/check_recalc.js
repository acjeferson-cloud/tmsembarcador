import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testRecalc() {
  const cteId = '1e0ba3fd-bbf9-450f-a496-e8d1a166cd9f'; // We don't know the exact CTe ID... But we can find it!
  const num = '7632158';
  
  const { data: ctes } = await supabase.from('ctes_complete').select('id, number').eq('number', num).limit(1);
  if (!ctes || ctes.length === 0) {
    console.log('CTE não encontrado');
    return;
  }
  const cte = ctes[0];
  console.log('Testando para CT-e ID:', cte.id);
  
  try {
    const { data: cteInvs, error: e1 } = await supabase
      .from('ctes_invoices')
      .select('number')
      .eq('cte_id', cte.id);

    console.log('ctes_invoices:', cteInvs, e1);

    if (cteInvs && cteInvs.length > 0) {
      const numbers = cteInvs.map((l) => l.number).filter(n => !!n);
      console.log('numbers:', numbers);
      if (numbers.length > 0) {
        const { data: matchedByKey } = await supabase
          .from('invoices_nfe')
          .select('id')
          .in('chave_acesso', numbers);
          
        const { data: matchedByNumber } = await supabase
          .from('invoices_nfe')
          .select('id')
          .in('numero', numbers);
        
        const invoiceIds = [];
        if (matchedByKey) invoiceIds.push(...matchedByKey.map(n => n.id));
        if (matchedByNumber) invoiceIds.push(...matchedByNumber.map(n => n.id));

        console.log('invoiceIds:', invoiceIds);

        if (invoiceIds.length > 0) {
          const { data: spotNegLink, error: e3 } = await supabase
            .from('freight_spot_invoices')
            .select('negotiation_id')
            .in('invoice_id', invoiceIds)
            .limit(1)
            .maybeSingle();

          console.log('spotNegLink:', spotNegLink, e3);

          if (spotNegLink && spotNegLink.negotiation_id) {
            const { data: spotHeader, error: e4 } = await supabase
              .from('freight_spot_negotiations')
              .select('agreed_value')
              .eq('id', spotNegLink.negotiation_id)
              .single();

            console.log('spotHeader:', spotHeader, e4);
          }
        }
      }
    }
  } catch(e) {
    console.error('Exception caught:', e);
  }
}

testRecalc();
