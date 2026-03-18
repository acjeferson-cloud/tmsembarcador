import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

async function runCalc() {
  const invoiceNum = '962213';
  const { data: nfe } = await supabase.from('invoices_nfe').select('*, customer:invoices_nfe_customers(*)').eq('numero', invoiceNum).single();
  const { data: carrier } = await supabase.from('carriers').select('*').ilike('codigo', '%0001%').single();
  const issueDate = nfe.data_emissao;
  const dateToCheck = issueDate ? new Date(issueDate).toISOString() : new Date().toISOString();
  
  const { data: activeTable } = await supabase.from('freight_rate_tables').select('id').eq('transportador_id', carrier.id).eq('status', 'ativo').lte('data_inicio', dateToCheck).gte('data_fim', dateToCheck).order('data_inicio', { ascending: false }).limit(1).single();

  const cityName = nfe.customer && nfe.customer[0] ? nfe.customer[0].cidade : '';
  const stateAbbr = nfe.customer && nfe.customer[0] ? nfe.customer[0].estado : '';
  const normalizedCityName = normalizeString(cityName);

  const { data: stateData } = await supabase.from('states').select('id').eq('sigla', stateAbbr).single();
  const { data: cities } = await supabase.from('cities').select('id, nome').eq('state_id', stateData.id);
  const city = cities?.find(c => normalizeString(c.nome) === normalizedCityName);

  const { data: rateCity } = await supabase.from('freight_rate_cities').select('freight_rate_id').eq('freight_rate_table_id', activeTable.id).eq('city_id', city.id).maybeSingle();

  const { data: rate } = await supabase.from('freight_rates').select('*').eq('id', rateCity.freight_rate_id).single();
  const { data: details } = await supabase.from('freight_rate_details').select('*').eq('freight_rate_id', rate.id).order('ordem', { ascending: true });
  
  const fullTariff = { ...rate, detalhes: details || [] };
  
  const mockCte = {
      carrier_id: carrier.id,
      issue_date: issueDate,
      recipient_city: cityName,
      recipient_state: stateAbbr,
      cargo_weight: nfe.peso_total,
      cargo_value: nfe.valor_total,
      cargo_volume: nfe.quantidade_volumes || 0,
      cargo_m3: nfe.cubagem_total || 0,
      icms_rate: 12.0,
      icms_value: 0,
  };

  const calcWeight = mockCte.cargo_weight;
  const calcValue = mockCte.cargo_value;

  console.log('Calculation Data:', {
    peso_total: calcWeight,
    valor_total: calcValue,
    cubagem_total: nfe.cubagem_total,
    tariff_peso_min: fullTariff.frete_peso_minimo,
    tariff_valor_min: fullTariff.frete_valor_minimo,
    tariff_total_min: fullTariff.valor_total_minimo,
    fator_m3: fullTariff.fator_m3,
    detalhes: fullTariff.detalhes
  });

  // Let's do a mock performCalculation
  let pesoConsiderado = calcWeight;
  let pesoCubado = 0;
  if (fullTariff.fator_m3 > 0 && nfe.cubagem_total > 0) {
      pesoCubado = nfe.cubagem_total * fullTariff.fator_m3;
      if (pesoCubado > pesoConsiderado) pesoConsiderado = pesoCubado;
  }
  console.log('Peso considerado:', pesoConsiderado);

  let fretePeso = 0;
  for (const detail of fullTariff.detalhes) {
      if (pesoConsiderado <= detail.peso_ate) {
          if (detail.tipo_calculo === 'por_kg') {
              fretePeso = detail.frete_valor * pesoConsiderado;
          } else {
              fretePeso = detail.frete_valor;
          }
          if (detail.frete_minimo && fretePeso < detail.frete_minimo) {
              fretePeso = detail.frete_minimo;
          }
          break;
      }
  }

  console.log('Frete Peso:', fretePeso);
}
runCalc();
