import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getAddressFromCnpj(cnpj, org_id) {
    if (!cnpj) return { zipCode: '', city: '', state: '' };
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) return { zipCode: '', city: '', state: '' };
    
    if (supabase) {
      try {
          const { data: bp } = await supabase.from('business_partners')
            .select('id, addresses:business_partner_addresses(zip_code, city, state)')
            .eq('cpf_cnpj', cleanCnpj)
            .eq('organization_id', org_id)
            .maybeSingle();
          if (bp && bp.addresses && bp.addresses.length > 0) {
              return {
                  zipCode: bp.addresses[0].zip_code || '',
                  city: bp.addresses[0].city || '',
                  state: bp.addresses[0].state || ''
              };
          }
      } catch(e) {}
    }
    
    try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        if (res.ok) {
            const data = await res.json();
            return {
                zipCode: data.cep ? data.cep.replace(/\D/g, '') : '',
                city: data.municipio || '',
                state: data.uf || ''
            };
        }
    } catch(e) {}
    
    return { zipCode: '', city: '', state: '' };
}

function calculateCheckDigit(input) {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  const cleanInput = input.replace(/-/g, '');
  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    let value;
    if (char >= '0' && char <= '9') { value = parseInt(char); } 
    else if (char >= 'A' && char <= 'Z') { value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10; } 
    else { value = 0; }
    sum += value * weights[i % weights.length];
  }
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  return checkDigit.toString();
}

function generateTrackingCode(orderNumber, orderDate, establishmentCode = '0001', establishmentPrefix = 'TGL') {
  const numericOrderNumber = parseInt(String(orderNumber).replace(/^PED-/, ''), 10);
  const formattedEstablishmentCode = parseInt(establishmentCode, 10).toString();
  const yearSuffix = orderDate.getFullYear().toString().slice(-2);
  const base36OrderNumber = numericOrderNumber.toString(36).toUpperCase();
  const codeWithoutCheckDigit = `${establishmentPrefix}-${formattedEstablishmentCode}-${yearSuffix}-${base36OrderNumber}`;
  const checkDigit = calculateCheckDigit(codeWithoutCheckDigit);
  return `${codeWithoutCheckDigit}-${checkDigit}`;
}

// Aux function to write logs to DB
async function writeLog(organization_id, environment_id, establishment_id, status, records_processed, message) {
  if (!supabase) return;
  try {
    const { error: insertErr } = await supabase.from('erp_sync_logs').insert({
      organization_id,
      environment_id,
      establishment_id,
      status, 
      records_processed,
      message
    });
    console.log('[SyncWorker] WriteLog insert result:', insertErr || 'SUCCESS');
  } catch (err) {
    console.error('Failed to write sync log:', err);
  }
}

async function calculateSyncFreight(supabase, w, ov, cm, destState, destCity, destZipCodeStr, finalCarrierId, config) {
    let finalFreightValue = 0;
    let calculatedBestCarrier = finalCarrierId;
    let freightResults = [];
    if (w > 0 && ov > 0) {
        try {
            let cityDataId = null;
            
            // 1. First, attempt to match using destZipCode exactly like the frontend
            const cleanZip = destZipCodeStr ? destZipCodeStr.replace(/\D/g, '') : '';
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
                    const normalizedCityName = destCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                    const { data: allCities } = await supabase.from('cities').select('id, nome').eq('state_id', stateData.id);
                    if (allCities && allCities.length > 0) {
                        const matchedCity = allCities.find(c => {
                             const dbCityNorm = c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                             return dbCityNorm === normalizedCityName;
                        });
                        if (matchedCity) cityDataId = matchedCity.id;
                    }
                }
            }

            if (cityDataId) {
                const { data: ratesData } = await supabase.rpc('calculate_freight_quotes', {
                   p_destination_city_id: cityDataId,
                   p_selected_modals: ['rodoviario', 'aereo', 'aquaviario', 'ferroviario'],
                   p_organization_id: config?.organization_id,
                   p_environment_id: config?.environment_id,
                   p_establishment_id: config?.establishment_id
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
}

export async function runCronSync(port = 8080) {
  if (!supabase) {
    console.error('Missing Supabase credentials for WorkerSync');
    return { success: false, message: 'Missing credentials' };
  }

  // 1. Fetch eligible configs (active, auto_sync_enabled = true)
  const { data: configs, error: configError } = await supabase
    .from('erp_integration_config')
    .select('*')
    .eq('is_active', true)
    .eq('auto_sync_enabled', true);

  if (configError || !configs) {
    console.error('Error fetching configs:', configError);
    return { success: false, error: configError };
  }

  const now = new Date();
  let processed = 0;
  
  for (const config of configs) {
    const lastSync = config.last_sync_time ? new Date(config.last_sync_time) : new Date(0);
    const intervalMinutes = config.sync_interval_minutes || 5;
    const diffMins = (now.getTime() - lastSync.getTime()) / 60000;

    // Check if enough time has passed based on the settings
    if (diffMins >= intervalMinutes) {
      console.log(`[SyncWorker] Executing sync for Config ID ${config.id} - ${config.erp_name}`);
      processed++;
      
      let insertedCount = 0;
      let errorCount = 0;
      let logsBuffer = [];

      const payload = {
        endpointSystem: config.service_layer_address || config.api_url,
        port: config.port || config.metadata?.port,
        username: config.username,
        password: config.password,
        companyDb: config.database || config.metadata?.database,
        sap_bpl_id: config.sap_bpl_id || null,
        lastSyncTime: config.last_sync_time || null
      };

      // == Process Orders ==
      try {
        const fetchRes = await fetch(`http://localhost:${port}/api/fetch-sap-order`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        const sapOrderResp = await fetchRes.json();
        console.log('[SyncWorker] Pedido Fetch Response:', sapOrderResp);
        if (sapOrderResp && sapOrderResp.success && sapOrderResp.orders) {
          for (const sapOrder of sapOrderResp.orders) {
          
          // Check if order already exists
          const { data: existingOrd } = await supabase
            .from('orders')
            .select('id')
            .eq('numero_pedido', String(sapOrder.order_number))
            .eq('organization_id', config.organization_id)
            .maybeSingle();
            
          if (!existingOrd) {
             // 1. Calculate Freight
             let finalCarrierId = null;
             if (sapOrder.carrier_document) {
                const rawCarrierCnpj = sapOrder.carrier_document.replace(/\D/g, '');
                if (rawCarrierCnpj) {
                  const { data: existingCarrier } = await supabase.from('carriers').select('id').eq('cnpj', rawCarrierCnpj).eq('organization_id', config.organization_id).maybeSingle();
                  if (existingCarrier) finalCarrierId = existingCarrier.id;
                }
             }

             let destStateStr = sapOrder.destination?.state || sapOrder.customer?.state || '';
             let destCityStr = sapOrder.destination?.city || sapOrder.customer?.city || '';
             let destZipCodeStr = sapOrder.destination?.zip_code || '';
             
             if (!destZipCodeStr && sapOrder.customer?.document) {
                const addr = await getAddressFromCnpj(sapOrder.customer.document, config.organization_id);
                if (addr.zipCode) destZipCodeStr = addr.zipCode;
                if (!destCityStr && addr.city) destCityStr = addr.city;
                if (!destStateStr && addr.state) destStateStr = addr.state;
             }

             const w = parseFloat(sapOrder.weight || '0');
             const ov = parseFloat(sapOrder.order_value || '0');
             const cm = parseFloat(sapOrder.cubic_meters || '0');
             
             const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destStateStr, destCityStr, destZipCodeStr, finalCarrierId, config);

             let estabCode = '0001';
             let estabPrefix = 'TGL';
             if (config.establishment_id) {
               try {
                 const { data: estab } = await supabase.from('establishments').select('codigo, metadata').eq('id', config.establishment_id).maybeSingle();
                 if (estab) {
                    estabCode = estab.codigo || '0001';
                    estabPrefix = estab.metadata?.tracking_prefix || 'TGL';
                 }
               } catch(e) {}
             }
             const trackingCode = generateTrackingCode(String(sapOrder.order_number), new Date(sapOrder.issue_date || new Date()), estabCode, estabPrefix);

             // 2. Build Payload
             const tmsOrder = {
                organization_id: config.organization_id,
                environment_id: config.environment_id,
                establishment_id: config.establishment_id,
                metadata: { customer_name: sapOrder.customer?.name || sapOrder.customer?.document || 'CLIENTE SAP' },
                destino_cidade: destCityStr,
                destino_estado: destStateStr,
                destino_cep: destZipCodeStr ? destZipCodeStr.replace(/\D/g, '') : null,
                destino_logradouro: sapOrder.destination?.street || '',
                destino_bairro: sapOrder.destination?.neighborhood || '',
                numero_pedido: String(sapOrder.order_number),
                codigo_rastreio: trackingCode,
                weight: w,
                volume_qty: Math.ceil(parseFloat(sapOrder.volume_qty || '1')),
                cubic_meters: cm,
                valor_mercadoria: ov,
                data_pedido: sapOrder.issue_date || new Date().toISOString().split('T')[0],
                data_entrada: new Date().toISOString().split('T')[0],
                status: 'pendente',
                freight_results: freightResults,
                valor_frete: finalFreightValue,
                carrier_id: calculatedBestCarrier || null,
                best_carrier_id: calculatedBestCarrier || null
             };
             
             const { data: insertedOrd, error: errOrd } = await supabase.from('orders').insert(tmsOrder).select().single();
             if (errOrd) {
                 console.log('[SyncWorker] Erro ao inserir Pedido:', errOrd);
                 logsBuffer.push(`Erro no Pedido ${sapOrder.order_number}: Falha ao inserir`);
                 errorCount++;
             } else {
                 if (insertedOrd && sapOrder.items && sapOrder.items.length > 0) {
                   const itemsBatch = sapOrder.items.map(it => ({
                     order_id: insertedOrd.id,
                     organization_id: config.organization_id,
                     environment_id: config.environment_id,
                     produto_codigo: it.product_code || 'N/A',
                     produto_descricao: it.description || 'Produto ERP',
                     quantidade: Math.ceil(parseFloat(it.quantity || '1')),
                     valor_unitario: parseFloat(it.unit_price || '0'),
                     valor_total: parseFloat(it.total_value || '0'),
                     peso: 0,
                     volume: Math.ceil(parseFloat(it.quantity || '1')),
                     cubagem: 0
                   }));
                   await supabase.from('order_items').insert(itemsBatch);
                 }
                 logsBuffer.push(`Pedido ${sapOrder.order_number} baixado`);
                 insertedCount++;
             }
           }
         }
       } else if (sapOrderResp && sapOrderResp.error) {
           logsBuffer.push(`Erro Pedido: ${sapOrderResp.error}`);
           errorCount++;
       }
      } catch (err) { logsBuffer.push(`Erro Pedido Sistêmico: ${err.message}`); console.error('[SyncWorker] Order Error:', err); }

      // == Process Invoices ==
      try {
        const fetchResInv = await fetch(`http://localhost:${port}/api/fetch-sap-invoice`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        const sapInvResp = await fetchResInv.json();
        console.log('[SyncWorker] Nota Fiscal Fetch Response:', sapInvResp);
        if (sapInvResp && sapInvResp.success && sapInvResp.invoices) {
          for (const sapInvoice of sapInvResp.invoices) {
          
          const { data: existingInv } = await supabase
            .from('invoices_nfe')
            .select('id, valor_frete, carrier_id')
            .eq('numero', sapInvoice.invoice_number)
            .eq('organization_id', config.organization_id)
            .maybeSingle();

          let finalCarrierId = null;
          if (sapInvoice.carrier_document) {
            const rawCarrierCnpj = sapInvoice.carrier_document.replace(/\D/g, '');
            if (rawCarrierCnpj) {
              const { data: existingCarrier } = await supabase
                .from('carriers')
                .select('id')
                .eq('cnpj', rawCarrierCnpj)
                .eq('organization_id', config.organization_id)
                .maybeSingle();
              if (existingCarrier) finalCarrierId = existingCarrier.id;
            }
          }
            
          if (!existingInv) {
             let destZipCodeStr = sapInvoice.destination?.zip_code || '';
             let destState = sapInvoice.destination?.state || '';
             let destCity = sapInvoice.destination?.city || '';
             
             if (!destZipCodeStr && sapInvoice.customer?.document) {
                const addr = await getAddressFromCnpj(sapInvoice.customer.document, config.organization_id);
                if (addr.zipCode) destZipCodeStr = addr.zipCode;
                if (!destCity && addr.city) destCity = addr.city;
                if (!destState && addr.state) destState = addr.state;
             }

             const destZipCode = destZipCodeStr.replace(/\D/g, '');
             const w = parseFloat(sapInvoice.weight || '0');
             const ov = parseFloat(sapInvoice.invoice_value || '0');
             const cm = parseFloat(sapInvoice.cubic_meters || '0');
             
             const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, destZipCodeStr, finalCarrierId, config);
             
             const tmsNfe = {
                organization_id: config.organization_id,
                environment_id: config.environment_id,
                establishment_id: config.establishment_id,
                numero: sapInvoice.invoice_number,
                serie: sapInvoice.serie || '1',
                chave_acesso: 'SAPB1-' + Date.now() + '-' + sapInvoice.invoice_number,
                data_emissao: sapInvoice.issue_date ? sapInvoice.issue_date + 'T00:00:00Z' : new Date().toISOString(),
                valor_total: parseFloat(sapInvoice.invoice_value || '0'),
                valor_produtos: parseFloat(sapInvoice.invoice_value || '0'),
                peso_total: w,
                quantidade_volumes: Math.ceil(sapInvoice.volume_qty || 1),
                situacao: 'Emitida',
                invoice_type: 'NFe',
                order_number: sapInvoice.order_number || '',
                carrier_id: calculatedBestCarrier,
                valor_frete: finalFreightValue,
                freight_results: freightResults.length > 0 ? freightResults : null
             };
             
             const { data: insertedNfe } = await supabase.from('invoices_nfe').insert(tmsNfe).select().single();
             if (insertedNfe) {
               if (sapInvoice.items && sapInvoice.items.length > 0) {
                 const itemsBatch = sapInvoice.items.map(it => ({
                     invoice_nfe_id: insertedNfe.id,
                     descricao: it.description,
                     quantidade: Math.ceil(it.quantity || 1),
                     valor_unitario: it.unit_price || 0,
                     valor_total: it.total_value || 0
                 }));
                 await supabase.from('invoices_nfe_products').insert(itemsBatch);
               }
               
               await supabase.from('invoices_nfe_customers').insert({
                 invoice_nfe_id: insertedNfe.id,
                 razao_social: sapInvoice.customer?.name || '',
                 cnpj_cpf: sapInvoice.customer?.document ? sapInvoice.customer.document.replace(/\D/g, '') : '',
                 cidade: sapInvoice.destination?.city || '',
                 estado: sapInvoice.destination?.state || '',
                 cep: sapInvoice.destination?.zip_code || '',
                 logradouro: sapInvoice.destination?.street || '',
                 numero: sapInvoice.destination?.number || '',
                 bairro: sapInvoice.destination?.neighborhood || ''
               });
             }
             logsBuffer.push(`NFe ${sapInvoice.invoice_number} baixada`);
             insertedCount++;
          } else if (existingInv.valor_frete === 0 || existingInv.valor_frete === null) {
              let destZipCodeStr = sapInvoice.destination?.zip_code || '';
              let destState = sapInvoice.destination?.state || '';
              let destCity = sapInvoice.destination?.city || '';
              
              if (!destZipCodeStr && sapInvoice.customer?.document) {
                 const addr = await getAddressFromCnpj(sapInvoice.customer.document, config.organization_id);
                 if (addr.zipCode) destZipCodeStr = addr.zipCode;
                 if (!destCity && addr.city) destCity = addr.city;
                 if (!destState && addr.state) destState = addr.state;
              }

              const destZipCode = destZipCodeStr.replace(/\D/g, '');
              const w = parseFloat(sapInvoice.weight || '0');
              const ov = parseFloat(sapInvoice.invoice_value || '0');
              const cm = parseFloat(sapInvoice.cubic_meters || '0');
              
              const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destState, destCity, destZipCodeStr, existingInv.carrier_id || finalCarrierId, config);
              
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
                 logsBuffer.push(`NFe ${sapInvoice.invoice_number} custo recalculado p/ ${finalFreightValue}`);
              }
          }
          } // close for loop
        } else if (sapInvResp && sapInvResp.error) {
           logsBuffer.push(`Erro NFe: ${sapInvResp.error}`);
           errorCount++;
        }
      } catch (err) { logsBuffer.push(`Erro NFe Sistêmico: ${err.message}`); console.error('[SyncWorker] Invoice Error:', err); }

      // Finish log and update config
      await supabase.from('erp_integration_config').update({ last_sync_time: new Date().toISOString() }).eq('id', config.id);

      const status = logsBuffer.some(msg => msg.includes('Erro')) ? 'error' : 'success';
      const finalMessage = logsBuffer.length > 0 ? logsBuffer.join(' | ') : 'Nenhum documento novo encontrado no ERP.';
      
      if (status === 'error' || insertedCount > 0 || errorCount > 0 || logsBuffer.length > 0) {
        await writeLog(
          config.organization_id, 
          config.environment_id, 
          config.establishment_id, 
          status, 
          insertedCount, 
          finalMessage
        );
      } else {
        console.log(`[SyncWorker] Skipping DB log insertion for Config ID ${config.id} (0 docs, 0 errors).`);
      }

    }
  }
  
  return { success: true, processed };
}
