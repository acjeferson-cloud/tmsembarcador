const fs = require('fs');

let code = fs.readFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', 'utf8');

const helper = `async function calculateSyncFreight(supabase, w, ov, cm, destState, destCity, destZipCodeStr, finalCarrierId) {
    let finalFreightValue = 0;
    let calculatedBestCarrier = finalCarrierId;
    let freightResults = [];
    if (w > 0 && ov > 0) {
        try {
            let cityDataId = null;
            
            // 1. First, attempt to match using destZipCode exactly like the frontend
            const cleanZip = destZipCodeStr ? destZipCodeStr.replace(/\\D/g, '') : '';
            if (cleanZip && cleanZip.length === 8) {
               const { data: zipRangeData } = await supabase
                 .from('zip_code_ranges')
                 .select('city_id')
                 .lte('start_zip', cleanZip)
                 .gte('end_zip', cleanZip)
                 .limit(1).maybeSingle();
               if (zipRangeData) cityDataId = zipRangeData.city_id;
            }
            
            // 2. Fallback to name search if ZIP failed
            if (!cityDataId && destState && destCity) {
                const { data: stateData } = await supabase.from('states').select('id').eq('sigla', destState).maybeSingle();
                if (stateData) {
                    const normalizedCityName = destCity.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
                    const { data: cd } = await supabase.from('cities').select('id').eq('state_id', stateData.id).ilike('nome', '%' + normalizedCityName + '%').limit(1).maybeSingle();
                    if (cd) cityDataId = cd.id;
                }
            }

            if (cityDataId) {
                const { data: ratesData } = await supabase.rpc('calculate_freight_quotes', {
                   p_destination_city_id: cityDataId,
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
        } catch(err) { console.log('[SyncWorker] Freight computation error', err); }
    }
    return { finalFreightValue, calculatedBestCarrier, freightResults };
}`;

// Extract everything out of old calculateSyncFreight and replace
const startIndex = code.indexOf('async function calculateSyncFreight(supabase');
const endIndex = code.indexOf('export async function runCronSync(port = 8080) {');
const oldFunc = code.substring(startIndex, endIndex);

code = code.replace(oldFunc, helper + '\n\n');

// Also update parameters in Invoices block
code = code.replace(
    'await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, finalCarrierId);',
    'await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, sapInvoice.destination?.zip_code, finalCarrierId);'
);

code = code.replace(
    'await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, existingInv.carrier_id || finalCarrierId);',
    'await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, sapInvoice.destination?.zip_code, existingInv.carrier_id || finalCarrierId);'
);


fs.writeFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', code, 'utf8');
console.log("PATCH2 APPLIED SUCCESSFULLY");
