import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
      let logsBuffer = [];

      const payload = {
        endpointSystem: config.service_layer_address,
        port: config.port,
        username: config.username,
        password: config.password,
        companyDb: config.database
      };

      // == Process Orders ==
      try {
        const fetchRes = await fetch(`http://localhost:${port}/api/fetch-sap-order`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        const sapOrderResp = await fetchRes.json();
        if (sapOrderResp && sapOrderResp.success && sapOrderResp.order) {
          const sapOrder = sapOrderResp.order;
          
          // Check if order already exists
          const { data: existingOrd } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', sapOrder.order_number)
            .eq('organization_id', config.organization_id)
            .maybeSingle();
            
          if (!existingOrd) {
             const tmsOrder = {
                organization_id: config.organization_id,
                environment_id: config.environment_id,
                establishment_id: config.establishment_id,
                cliente_destino: sapOrder.customer?.name || sapOrder.customer?.document || 'CLIENTE SAP',
                cidade: sapOrder.customer?.city || '',
                uf: sapOrder.customer?.state || '',
                cnpj: sapOrder.customer?.document ? sapOrder.customer.document.replace(/\D/g, '') : '',
                order_number: sapOrder.order_number,
                peso: sapOrder.weight || 0,
                volumes: Math.ceil(sapOrder.volume_qty || 1),
                valor_mercadoria: sapOrder.order_value || 0,
                data_emissao: sapOrder.issue_date || new Date().toISOString().split('T')[0],
                data_entrada: new Date().toISOString(),
                status: 'pendente'
             };
             
             const { data: insertedOrd } = await supabase.from('orders').insert(tmsOrder).select().single();
             if (insertedOrd && sapOrder.items && sapOrder.items.length > 0) {
               const itemsBatch = sapOrder.items.map(it => ({
                 order_id: insertedOrd.id,
                 product_code: it.product_code || 'N/A',
                 description: it.description,
                 quantity: Math.ceil(it.quantity || 1),
                 unit_price: it.unit_price || 0,
                 total_value: it.total_value || 0
               }));
               await supabase.from('order_items').insert(itemsBatch);
             }
             logsBuffer.push(`Pedido ${sapOrder.order_number} baixado`);
             insertedCount++;
          }
        }
      } catch (err) { logsBuffer.push(`Erro Pedido: ${err.message}`); console.error('[SyncWorker] Order Error:', err); }

      // == Process Invoices ==
      try {
        const fetchResInv = await fetch(`http://localhost:${port}/api/fetch-sap-invoice`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        const sapInvResp = await fetchResInv.json();
        if (sapInvResp && sapInvResp.success && sapInvResp.invoice) {
          const sapInvoice = sapInvResp.invoice;
          
          const { data: existingInv } = await supabase
            .from('invoices_nfe')
            .select('id')
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
             // Calculate Freight Automatically
             let finalFreightValue = 0;
             let calculatedBestCarrier = finalCarrierId;
             let freightResults = [];
             
             const destZipCodeStr = sapInvoice.destination?.zip_code || '';
             const destZipCode = destZipCodeStr.replace(/\D/g, '');
             const w = parseFloat(sapInvoice.weight || '0');
             const ov = parseFloat(sapInvoice.invoice_value || '0');
             const cm = parseFloat(sapInvoice.cubic_meters || '0');
             const destState = sapInvoice.destination?.state;
             const destCity = sapInvoice.destination?.city;

             if (destState && destCity && w > 0 && ov > 0) {
                 try {
                     const { data: stateData } = await supabase.from('states').select('id').eq('sigla', destState).maybeSingle();
                     if (stateData) {
                         const normalizedCityName = destCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                         const { data: cityData } = await supabase.from('cities').select('id').eq('state_id', stateData.id).ilike('nome', `%${normalizedCityName}%`).limit(1).maybeSingle();
                         
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
                                         if (pesoConsiderado <= d.peso_ate) {
                                             weightRange = d; break;
                                         }
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
                                           const baseFrete = baseCalculo + outrosValores;
                                           valorTotal = baseFrete / (1 - (icmsAliquota / 100));
                                        } else {
                                           const baseFrete = baseCalculo;
                                           const icmsValor = (baseFrete * icmsAliquota) / (100 - icmsAliquota);
                                           valorTotal = baseFrete + icmsValor;
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
                                    let lowestQuote = null;
                                    if (finalCarrierId) {
                                       lowestQuote = freightResults.find(r => r.carrierId === finalCarrierId);
                                    }
                                    if (!lowestQuote) lowestQuote = freightResults[0];

                                    finalFreightValue = lowestQuote.totalValue;
                                    calculatedBestCarrier = lowestQuote.carrierId;
                                 }
                             }
                         }
                     }
                 } catch(err) {
                    console.log("[SyncWorker] Freight computation error", err);
                 }
             }
             
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
          }
        }
      } catch (err) { logsBuffer.push(`Erro Nota: ${err.message}`); console.error('[SyncWorker] Invoice Error:', err); }

      // Finish log and update config
      await supabase.from('erp_integration_config').update({ last_sync_time: new Date().toISOString() }).eq('id', config.id);

      const status = logsBuffer.some(msg => msg.includes('Erro')) ? 'error' : 'success';
      const finalMessage = logsBuffer.length > 0 ? logsBuffer.join(' | ') : 'Nenhum documento novo encontrado no ERP.';
      
      await writeLog(
        config.organization_id, 
        config.environment_id, 
        config.establishment_id, 
        status, 
        insertedCount, 
        finalMessage
      );

    }
  }
  
  return { success: true, processed };
}
