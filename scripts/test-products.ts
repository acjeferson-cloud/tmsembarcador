import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  const invoiceNum = '962213';
  const { data: nfe } = await supabase.from('invoices_nfe').select('id').eq('numero', invoiceNum).single();
  if (nfe) {
    const { data: prods } = await supabase.from('invoices_nfe_products').select('id').eq('nfe_id', nfe.id);
    console.log('Products length:', prods?.length);
  }
}
checkProducts();
