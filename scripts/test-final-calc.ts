import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

const roundValue = (value: number): number => {
    return Math.round(value * 100) / 100;
};

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
  
  const tariff = { ...rate, detalhes: details || [] };
  
  const invoiceData = {
      weight: nfe.peso_total,
      value: nfe.valor_total,
      volume: nfe.quantidade_volumes || 0,
      m3: nfe.cubagem_total || 0,
  };

  let pesoConsiderado = invoiceData.weight;
  let pesoCubado = 0;
  if (tariff.fator_m3 > 0 && invoiceData.m3 > 0) {
      pesoCubado = invoiceData.m3 * tariff.fator_m3;
      if (pesoCubado > pesoConsiderado) pesoConsiderado = pesoCubado;
  }

  // Faixa de peso
  const sortedDetails = [...tariff.detalhes].sort((a, b) => a.ordem - b.ordem);
  let weightRange;
  for (const detail of sortedDetails) {
      if (pesoConsiderado <= detail.peso_ate) {
          weightRange = detail;
          break;
      }
  }
  if (!weightRange) weightRange = sortedDetails[sortedDetails.length - 1];

  // 1. FRETE PESO
  const valorFaixa = weightRange.valor_faixa || 0;
  const tipoCalculo = weightRange.tipo_calculo || 'valor_faixa';
  let calculatedFretePeso = valorFaixa;
  if (tipoCalculo === 'excedente') {
      const currentIndex = sortedDetails.findIndex(d => d.ordem === weightRange.ordem);
      if (currentIndex > 0) {
          const previousRange = sortedDetails[currentIndex - 1];
          const valorBase = previousRange.valor_faixa || 0;
          const pesoAnterior = previousRange.peso_ate || 0;
          const pesoExcedente = pesoConsiderado - pesoAnterior;
          calculatedFretePeso = valorBase + (pesoExcedente * valorFaixa);
      }
  }
  const fretePeso = roundValue(Math.max(calculatedFretePeso, tariff.frete_peso_minimo || 0));

  // 2. FRETE VALOR
  const percentualFreteValor = weightRange.frete_valor || 0;
  const calculatedFreteValor = (invoiceData.value * percentualFreteValor) / 100;
  const freteValor = roundValue(Math.max(calculatedFreteValor, tariff.frete_valor_minimo || 0));

  // 3. GRIS
  const percentualGris = tariff.percentual_gris || 0;
  const calculatedGris = (invoiceData.value * percentualGris) / 100;
  const gris = roundValue(Math.max(calculatedGris, tariff.gris_minimo || 0));

  // 4. Pedagio
  const pedagioTipoKg = tariff.pedagio_tipo_kg || 'fracao';
  const pedagioPorKg = tariff.pedagio_por_kg || 0;
  const pedagioCadaKg = tariff.pedagio_a_cada_kg || 100;
  let calculatedPedagio = 0;
  if (pedagioPorKg > 0) {
      if (pedagioTipoKg === 'fracao') {
          const fracao = Math.ceil(pesoConsiderado / pedagioCadaKg);
          calculatedPedagio = fracao * pedagioPorKg;
      } else {
          const kg = pesoConsiderado / pedagioCadaKg;
          calculatedPedagio = kg * pedagioPorKg;
      }
  }
  const pedagio = roundValue(Math.max(calculatedPedagio, tariff.pedagio_minimo || 0));

  const tas = roundValue(tariff.tas || 0);
  const seccat = roundValue(tariff.seccat || 0);
  const despacho = roundValue(tariff.despacho || 0);
  const itr = roundValue(tariff.itr || 0);
  const coletaEntrega = roundValue(tariff.coleta_entrega || 0);

  const baseCalculo = roundValue(fretePeso + freteValor + gris + pedagio + tas + seccat + despacho + itr + coletaEntrega);

  const icmsAliquota = parseFloat(tariff.aliquota_icms?.toString() || '0');
  const icmsEmbutido = tariff.icms_embutido_tabela === 'embutido';
  let icmsBase = 0, icmsValor = 0, outrosValores = 0, baseFrete = 0;

  if (icmsAliquota > 0) {
      if (icmsEmbutido) {
          let calcOutrosValores = 0;
          if (tariff.taxa_outros_minima && tariff.taxa_outros_minima > 0) {
              const tipoAcessoOutros = tariff.taxa_outros_tipo_valor || 'percentual';
              if (tipoAcessoOutros === 'percentual') {
                  const percOutros = tariff.valor_outros_percent || 0;
                  calcOutrosValores = (baseCalculo * percOutros) / 100;
                  calcOutrosValores = Math.max(calcOutrosValores, tariff.valor_outros_minimo || 0);
              } else {
                  // ignorar os de m3 para teste basico
                  calcOutrosValores = tariff.valor_outros_minimo || 0;
              }
          }
          outrosValores = roundValue(calcOutrosValores);
          baseFrete = roundValue(baseCalculo + outrosValores);
          const valorComICMS = baseFrete / (1 - (icmsAliquota / 100));
          icmsBase = roundValue(valorComICMS);
          icmsValor = roundValue(valorComICMS - baseFrete);
      } else {
          baseFrete = baseCalculo;
          icmsValor = roundValue((baseFrete * icmsAliquota) / (100 - icmsAliquota));
          icmsBase = roundValue(baseFrete + icmsValor);
          outrosValores = icmsValor;
      }
  }

  const valorTotal = icmsEmbutido ? icmsBase : roundValue(baseCalculo + outrosValores);

  console.log('--- Resumo Calculo ---');
  console.log('Frete Peso:', fretePeso);
  console.log('Frete Valor:', freteValor);
  console.log('GRIS:', gris);
  console.log('Pedagio:', pedagio);
  console.log('Valor Total:', valorTotal);
}

runCalc();
