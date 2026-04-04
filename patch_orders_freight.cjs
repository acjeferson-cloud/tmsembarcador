const fs = require('fs');

let code = fs.readFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', 'utf8');

// Find the orders block again
const orderFindRegex = /const \{ data: existingOrd \} = await supabase[\s\S]*?insertedCount\+\+;\s*\}/;

const orderFix = `const { data: existingOrd } = await supabase
            .from('orders')
            .select('id')
            .eq('numero_pedido', String(sapOrder.order_number))
            .eq('organization_id', config.organization_id)
            .maybeSingle();
            
          if (!existingOrd) {
             // 1. Calculate Freight
             let finalCarrierId = null;
             if (sapOrder.carrier_document) {
                const rawCarrierCnpj = sapOrder.carrier_document.replace(/\\D/g, '');
                if (rawCarrierCnpj) {
                  const { data: existingCarrier } = await supabase.from('carriers').select('id').eq('cnpj', rawCarrierCnpj).eq('organization_id', config.organization_id).maybeSingle();
                  if (existingCarrier) finalCarrierId = existingCarrier.id;
                }
             }

             const destStateStr = sapOrder.destination?.state || sapOrder.customer?.state || '';
             const destCityStr = sapOrder.destination?.city || sapOrder.customer?.city || '';
             const destZipCodeStr = sapOrder.destination?.zip_code || '';
             const w = parseFloat(sapOrder.weight || '0');
             const ov = parseFloat(sapOrder.order_value || '0');
             const cm = parseFloat(sapOrder.cubic_meters || '0');
             
             const { finalFreightValue, calculatedBestCarrier, freightResults } = await calculateSyncFreight(supabase, w, ov, cm, destStateStr, destCityStr, destZipCodeStr, finalCarrierId);

             // 2. Build Payload
             const tmsOrder = {
                organization_id: config.organization_id,
                environment_id: config.environment_id,
                establishment_id: config.establishment_id,
                metadata: { customer_name: sapOrder.customer?.name || sapOrder.customer?.document || 'CLIENTE SAP' },
                destino_cidade: destCityStr,
                destino_estado: destStateStr,
                destino_cep: destZipCodeStr ? destZipCodeStr.replace(/\\D/g, '') : null,
                destino_logradouro: sapOrder.destination?.street || '',
                destino_bairro: sapOrder.destination?.neighborhood || '',
                numero_pedido: String(sapOrder.order_number),
                codigo_rastreio: String(sapOrder.order_number),
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
                 logsBuffer.push(\`Erro no Pedido \${sapOrder.order_number}: Falha ao inserir\`);
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
                 logsBuffer.push(\`Pedido \${sapOrder.order_number} baixado\`);
                 insertedCount++;
             }
          }`;

code = code.replace(orderFindRegex, orderFix);

fs.writeFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', code, 'utf8');
console.log("ORDERS FREIGHT PATCH APPLIED");
