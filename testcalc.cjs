const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'c:/desenvolvimento/tmsembarcador/.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCalc() {
    let w = 100; // fake weight
    let ov = 2008.00;
    let cm = 0;
    let destState = 'SP';
    let destCity = 'São José dos Campos';
    let finalCarrierId = null;
    let finalFreightValue = 0;
    let calculatedBestCarrier = finalCarrierId;
    let freightResults = [];
    if (destState && destCity && w > 0 && ov > 0) {
        try {
            const { data: stateData } = await supabase.from('states').select('id').eq('sigla', destState).maybeSingle();
            if (stateData) {
                const normalizedCityName = destCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                const { data: cityData } = await supabase.from('cities').select('id').eq('state_id', stateData.id).ilike('nome', '%' + normalizedCityName + '%').limit(1).maybeSingle();
                if (cityData) {
                    const { data: ratesData } = await supabase.rpc('calculate_freight_quotes', {
                       p_destination_city_id: cityData.id,
                       p_selected_modals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario']
                    });
                    if (ratesData && ratesData.length > 0) {
                        for (const rateData of ratesData) {
                            const tariff = rateData.rate_data?.freight_rate;
                            const details = rateData.rate_data?.freight_rate_details || [];
                            if (!tariff || details.length === 0) continue;
                            let pesoConsiderado = w;
                            if (tariff.fator_m3 > 0 && cm > 0) {
                                const pesoCubado = cm * tariff.fator_m3;
                                if (pesoCubado > pesoConsiderado) pesoConsiderado = pesoCubado;
                            }
                            let weightRange = details[details.length - 1];
                            for (const d of details) {
                                if (pesoConsiderado <= d.peso_ate) { weightRange = d; break; }
                            }
                            const freteMinimo = tariff.frete_peso_minimo || 0;
                            let calculatedFretePeso = weightRange ? (weightRange.valor_faixa || 0) : freteMinimo;
                            if (weightRange?.tipo_calculo === 'excedente') {
                                const currentIndex = details.findIndex(d => d.ordem === weightRange.ordem);
                                if (currentIndex > 0) {
                                   const prev = details[currentIndex - 1];
                                   const excedente = pesoConsiderado - (prev.peso_ate || 0);
                                   calculatedFretePeso = (prev.valor_faixa || 0) + (excedente * weightRange.valor_faixa);
                                }
                            }
                            const fretePeso = Math.max(calculatedFretePeso, freteMinimo);
                            const percentualV = weightRange ? (weightRange.frete_valor || 0) : 0;
                            const freteValor = Math.max((ov * percentualV) / 100, tariff.frete_valor_minimo || 0);
                            const semTaxas = weightRange?.tipo_taxa === 'sem_taxas';
                            const gris = semTaxas ? 0 : Math.max((ov * (tariff.percentual_gris || 0)) / 100, tariff.gris_minimo || 0);
                            let pedagio = 0;
                            if (!semTaxas && tariff.pedagio_por_kg > 0) {
                               const fracoes = Math.ceil(pesoConsiderado / (tariff.pedagio_a_cada_kg || 100));
                               pedagio = Math.max(fracoes * tariff.pedagio_por_kg, tariff.pedagio_minimo || 0);
                            }
                            const tas = semTaxas ? 0 : (tariff.tas || 0);
                            const seccat = semTaxas ? 0 : (tariff.seccat || 0);
                            const despacho = semTaxas ? 0 : (tariff.despacho || 0);
                            const itr = semTaxas ? 0 : (tariff.itr || 0);
                            const coletaEntrega = semTaxas ? 0 : (tariff.coleta_entrega || 0);
                            const baseCalculo = fretePeso + freteValor + gris + pedagio + tas + seccat + despacho + itr + coletaEntrega;
                            let valorTotal = baseCalculo;
                            const icmsAliquota = tariff.aliquota_icms || 0;
                            if (icmsAliquota > 0) {
                               const outrosValores = semTaxas ? 0 : Math.max((baseCalculo * (tariff.valor_outros_percent || 0)) / 100, tariff.valor_outros_minimo || 0);
                               if (tariff.icms_embutido_tabela === 'embutido') {
                                  valorTotal = (baseCalculo + outrosValores) / (1 - (icmsAliquota / 100));
                               } else {
                                  const icmsValor = (baseCalculo * icmsAliquota) / (100 - icmsAliquota);
                                  valorTotal = baseCalculo + icmsValor;
                               }
                            } else {
                               const outrosValores = semTaxas ? 0 : Math.max((baseCalculo * (tariff.valor_outros_percent || 0)) / 100, tariff.valor_outros_minimo || 0);
                               valorTotal = baseCalculo + outrosValores;
                            }
                            freightResults.push({
                                carrierId: rateData.carrier_id,
                                carrierName: rateData.carrier_name,
                                totalValue: parseFloat(valorTotal.toFixed(2)),
                                calculationDetails: { fretePeso, freteValor, gris, pedagio, tas, seccat, despacho, itr, coletaEntrega, valorTotal }
                            });
                        }
                        if (freightResults.length > 0) {
                           freightResults.sort((a, b) => a.totalValue - b.totalValue);
                           let lowestQuote = finalCarrierId ? freightResults.find(r => r.carrierId === finalCarrierId) : null;
                           if (!lowestQuote) lowestQuote = freightResults[0];
                           finalFreightValue = lowestQuote.totalValue;
                           calculatedBestCarrier = lowestQuote.carrierId;
                        }
                    }
                }
            }
        } catch(err) { console.log(err); }
    }
    console.log(JSON.stringify({ finalFreightValue, calculatedBestCarrier, freightResults }, null, 2));
}

testCalc();
