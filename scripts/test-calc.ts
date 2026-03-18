import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runCalc() {
  const invoiceNum = '962213';
  const { data: nfe, error: nfeError } = await supabase
    .from('invoices_nfe')
    .select('*, customer:invoices_nfe_customers(*)')
    .eq('numero', invoiceNum)
    .single();

  if (nfeError || !nfe) {
    console.error('NFE Error:', nfeError);
    return;
  }

  // Find carrier 0001
  const { data: carrier, error: carrierError } = await supabase
    .from('carriers')
    .select('*')
    .ilike('codigo', '%0001%')
    .single();

  if (carrierError || !carrier) {
    console.error('Carrier Error:', carrierError);
    return;
  }

  console.log(`Testing Invoice ${invoiceNum} for Carrier ${carrier.codigo} - ${carrier.razao_social}`);
  
  // Try to find the active table
  const issueDate = nfe.data_emissao;
  const dateToCheck = issueDate ? new Date(issueDate).toISOString() : new Date().toISOString();
  console.log('Issue date for check:', dateToCheck);
  
  const { data: activeTable, error: tableError } = await supabase
    .from('freight_rate_tables')
    .select('id, nome, data_inicio, data_fim, status')
    .eq('transportador_id', carrier.id)
    .eq('status', 'ativo')
    .lte('data_inicio', dateToCheck)
    .gte('data_fim', dateToCheck)
    .order('data_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tableError) console.error('Table error:', tableError);
  
  if (!activeTable) {
    console.log('❌ No active table found for carrier on date', dateToCheck);
    
    // Check if there is ANY active table for this carrier ignoring dates
    const { data: anyTable } = await supabase
      .from('freight_rate_tables')
      .select('id, nome, data_inicio, data_fim, status')
      .eq('transportador_id', carrier.id)
      .eq('status', 'ativo')
      .limit(1)
      .maybeSingle();
      
    if (anyTable) {
        console.log('⚠️ Found an active table, but dates did not match:', anyTable.data_inicio, 'to', anyTable.data_fim);
    }
  } else {
    console.log('✅ Found active table:', activeTable.nome);
    
    // Search tariff by city
    const destinationCity = nfe.customer && nfe.customer[0] ? nfe.customer[0].cidade : null;
    const destinationState = nfe.customer && nfe.customer[0] ? nfe.customer[0].estado : null;
    console.log(`Searching for destination: ${destinationCity} - ${destinationState}`);
  }
}

runCalc();
