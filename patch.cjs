const fs = require('fs');

let code = fs.readFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', 'utf8');

const helper = `async function calculateSyncFreight(supabase, w, ov, cm, destState, destCity, finalCarrierId) {
    let finalFreightValue = 0;
    let calculatedBestCarrier = finalCarrierId;
    let freightResults = [];
    if (destState && destCity && w > 0 && ov > 0) {
        try {
            const { data: stateData } = await supabase.from('states').select('id').eq('sigla', destState).maybeSingle();
            if (stateData) {
                const normalizedCityName = destCity.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
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
        } catch(err) { console.log('[SyncWorker] Freight computation error', err); }
    }
    return { finalFreightValue, calculatedBestCarrier, freightResults };
}`;

code = code.replace('let isSyncRunning = false;', helper + '\n\nlet isSyncRunning = false;');

const checkOld = `.select('id')
            .eq('numero', sapInvoice.invoice_number)`;
const checkNew = `.select('id, valor_frete, carrier_id')
            .eq('numero', sapInvoice.invoice_number)`;
code = code.replace(checkOld, checkNew);

const startI = code.indexOf('             // Calculate Freight Automatically');
const endI = code.indexOf('             const { data: insertedNfe } = await supabase.from(\'invoices_nfe\').insert(tmsNfe).select().single();');
const mathLogicOld = code.substring(startI, endI);

const newLogic = `             const destZipCodeStr = sapInvoice.destination?.zip_code || '';
             const destZipCode = destZipCodeStr.replace(/\\D/g, '');
             const w = parseFloat(sapInvoice.weight || '0');
             const ov = parseFloat(sapInvoice.invoice_value || '0');
             const cm = parseFloat(sapInvoice.cubic_meters || '0');
             const destState = sapInvoice.destination?.state;
             const destCity = sapInvoice.destination?.city;
             
             const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, finalCarrierId);
             
             tmsNfe.carrier_id = calculatedBestCarrier;
             tmsNfe.valor_frete = finalFreightValue;
             tmsNfe.freight_results = freightResults.length > 0 ? freightResults : null;
             
`;
code = code.replace(mathLogicOld, newLogic);

const oldElseTarget = `insertedCount++;
          }`;
const newElse = `insertedCount++;
          } else if (existingInv.valor_frete === 0 || existingInv.valor_frete === null) {
              const destZipCodeStr = sapInvoice.destination?.zip_code || '';
              const destZipCode = destZipCodeStr.replace(/\\D/g, '');
              const w = parseFloat(sapInvoice.weight || '0');
              const ov = parseFloat(sapInvoice.invoice_value || '0');
              const cm = parseFloat(sapInvoice.cubic_meters || '0');
              const destState = sapInvoice.destination?.state;
              const destCity = sapInvoice.destination?.city;
              
              const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, existingInv.carrier_id || finalCarrierId);
              
              if (finalFreightValue > 0) {
                 await supabase.from('invoices_nfe').update({
                     valor_frete: finalFreightValue,
                     carrier_id: calculatedBestCarrier,
                     freight_results: freightResults.length > 0 ? freightResults : null
                 }).eq('id', existingInv.id);
                 
                 if (destZipCode) {
                    await supabase.from('invoices_nfe_customers')
                      .update({ cidade: destCity || '', estado: destState || '', cep: sapInvoice.destination?.zip_code || '' })
                      .eq('invoice_nfe_id', existingInv.id)
                      .is('cep', null);
                 }
                 logsBuffer.push('NFe ' + sapInvoice.invoice_number + ' custo recalculado (' + finalFreightValue + ')');
              }
          }`;
          
code = code.replace(oldElseTarget, newElse);

fs.writeFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', code, 'utf8');

console.log("PATCH APPLIED SUCCESSFULLY");
