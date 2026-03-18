import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// We need to fake the lib/supabase because we're running in Node
jest = require('jest-mock');
jest.mock('../src/lib/supabase', () => ({ supabase }));

import { invoicesCostService } from '../src/services/invoicesCostService';
import { freightCostCalculator } from '../src/services/freightCostCalculator';

async function runRealCalc() {
  const invoiceNum = '962213';
  const { data: nfe } = await supabase.from('invoices_nfe').select('*, customer:invoices_nfe_customers(*)').eq('numero', invoiceNum).single();
  const { data: carrier } = await supabase.from('carriers').select('*').ilike('codigo', '%0001%').single();

  const invoiceData = {
      weight: nfe.peso_total || 0,
      value: nfe.valor_total || 0,
      volume: nfe.quantidade_volumes || 0,
      m3: nfe.cubagem_total || 0,
      destinationCity: nfe.customer[0].cidade || '',
      destinationState: nfe.customer[0].estado || '',
  };

  console.log('Invoice Data:', invoiceData);
  
  try {
    const result = await invoicesCostService.calculateInvoiceCost(invoiceData, carrier.id, nfe.data_emissao);
    console.log('Result:', result);
  } catch (err) {
    console.error('Calculation Error:', err.message);
  }
}

runRealCalc();
