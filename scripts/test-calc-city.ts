import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
}

async function runCalc() {
  const invoiceNum = '962213';
  const { data: nfe, error: nfeError } = await supabase
    .from('invoices_nfe')
    .select('*, customer:invoices_nfe_customers(*)')
    .eq('numero', invoiceNum)
    .single();

  if (nfeError || !nfe) return;

  const { data: carrier } = await supabase
    .from('carriers')
    .select('*')
    .ilike('codigo', '%0001%')
    .single();

  if (!carrier) return;

  const issueDate = nfe.data_emissao;
  const dateToCheck = issueDate ? new Date(issueDate).toISOString() : new Date().toISOString();
  
  const { data: activeTable } = await supabase
    .from('freight_rate_tables')
    .select('id, nome')
    .eq('transportador_id', carrier.id)
    .eq('status', 'ativo')
    .lte('data_inicio', dateToCheck)
    .gte('data_fim', dateToCheck)
    .order('data_inicio', { ascending: false })
    .limit(1)
    .single();

  if (!activeTable) {
    console.log('No active table found');
    return;
  }
  
  const cityName = nfe.customer && nfe.customer[0] ? nfe.customer[0].cidade : '';
  const stateAbbr = nfe.customer && nfe.customer[0] ? nfe.customer[0].estado : '';

  const normalizedCityName = normalizeString(cityName);
  console.log('Norm city:', normalizedCityName, 'State:', stateAbbr);

  const { data: stateData } = await supabase
    .from('states')
    .select('id')
    .eq('sigla', stateAbbr)
    .single();

  if (!stateData) {
    console.log('State not found:', stateAbbr);
    return;
  }

  const { data: cities } = await supabase
    .from('cities')
    .select('id, nome')
    .eq('state_id', stateData.id);

  const city = cities?.find(c => normalizeString(c.nome) === normalizedCityName);

  if (!city) {
    console.log('City not found in cities table:', normalizedCityName);
    return;
  }
  
  console.log('Found city in DB with ID:', city.id, city.nome);

  const { data: rateCity, error: rateCityError } = await supabase
    .from('freight_rate_cities')
    .select('freight_rate_id')
    .eq('freight_rate_table_id', activeTable.id)
    .eq('city_id', city.id)
    .maybeSingle();

  if (rateCityError) console.error('Ratecity lookup error:', rateCityError.message, rateCityError.details);

  if (!rateCity) {
    console.log('No tariff found in freight_rate_cities for table', activeTable.id, 'and city', city.id);
    console.log('Checking all freight_rate_cities for this table...');
    const { data: allCities } = await supabase.from('freight_rate_cities').select('city_id, freight_rate_id').eq('freight_rate_table_id', activeTable.id);
    console.log('All configured cities for this table:', allCities);
    return;
  }

  console.log('Found rate ID:', rateCity.freight_rate_id);
}

runCalc();
