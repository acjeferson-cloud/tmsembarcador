import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    const numero = '945679';
    console.log(`Buscando NF ${numero}...`);
    
    // 1. Fetch NFe
    const { data: nfe, error: nfeError } = await supabase
      .from('invoices_nfe')
      .select('*')
      .eq('numero', numero)
      .limit(1)
      .single();
      
    if (nfeError || !nfe) {
      console.log('NFe completeness:', Object.keys(nfe));
      return;
    }
    // 2. Fetch NFe Customers
    const { data: nc, error: ncError } = await supabase
      .from('invoices_nfe_customers')
      .select('cnpj_cpf, email')
      .eq('invoice_nfe_id', nfe.id)
      .limit(1)
      .single();
      
    console.log('invoices_nfe_customers:', nc);
    if (!nc || ncError) return;

    // 3. Find Business Partner
    const cnpjClean = nc.cnpj_cpf.replace(/\D/g, '');
    let formattedCnpj = cnpjClean;
    if (cnpjClean.length === 11) formattedCnpj = cnpjClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (cnpjClean.length === 14) formattedCnpj = cnpjClean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

    const { data: bp, error: bpError } = await supabase
      .from('business_partners')
      .select('id, email, cpf_cnpj')
      .eq('cpf_cnpj', formattedCnpj)
      .eq('environment_id', nfe.environment_id)
      .limit(1)
      .single();

    console.log('Business Partner match:', bp);

    if (bp) {
      // 4. Fetch Contacts
      const { data: contacts, error: cError } = await supabase
        .from('business_partner_contacts')
        .select('id, email, receive_email_notifications, email_notify_delivered, is_primary')
        .eq('partner_id', bp.id);
        
    const { data: bpAny, error: bpAnyError } = await supabase
      .from('business_partners')
      .select('id, email, cpf_cnpj, environment_id')
      .ilike('cpf_cnpj', `%${cnpjClean}%`);
      
    console.log('Any BP with this CNPJ ignoring format/env:', bpAny);
    }
    
  } catch(e) { console.error(e) }
}
run();
