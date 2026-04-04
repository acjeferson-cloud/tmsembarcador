const fs = require('fs');

let code = fs.readFileSync('c:/desenvolvimento/tmsembarcador/tms-erp-proxy/syncWorker.js', 'utf8');

// Find the orders block
const orderFindRegex = /const \{ data: existingOrd \} = await supabase[\s\S]*?insertedCount\+\+;\s*\}/;

const orderFix = `const { data: existingOrd } = await supabase
            .from('orders')
            .select('id')
            .eq('numero_pedido', String(sapOrder.order_number))
            .eq('organization_id', config.organization_id)
            .maybeSingle();
            
          if (!existingOrd) {
             const tmsOrder = {
                organization_id: config.organization_id,
                environment_id: config.environment_id,
                establishment_id: config.establishment_id,
                metadata: { customer_name: sapOrder.customer?.name || sapOrder.customer?.document || 'CLIENTE SAP' },
                destino_cidade: sapOrder.customer?.city || '',
                destino_estado: sapOrder.customer?.state || '',
                numero_pedido: String(sapOrder.order_number),
                codigo_rastreio: String(sapOrder.order_number),
                weight: Number(sapOrder.weight || 0),
                volume_qty: Math.ceil(Number(sapOrder.volume_qty || 1)),
                valor_mercadoria: Number(sapOrder.order_value || 0),
                data_pedido: sapOrder.issue_date || new Date().toISOString().split('T')[0],
                data_entrada: new Date().toISOString().split('T')[0],
                status: 'pendente'
             };
             
             const { data: insertedOrd, error: errOrd } = await supabase.from('orders').insert(tmsOrder).select().single();
             if (errOrd) {
                 console.log('[SyncWorker] Erro ao inserir Pedido:', errOrd);
                 logsBuffer.push(\`Erro no Pedido \${sapOrder.order_number}: Falha ao inserir\`);
             } else {
                 if (insertedOrd && sapOrder.items && sapOrder.items.length > 0) {
                   const itemsBatch = sapOrder.items.map(it => ({
                     order_id: insertedOrd.id,
                     organization_id: config.organization_id,
                     environment_id: config.environment_id,
                     produto_codigo: it.product_code || 'N/A',
                     produto_descricao: it.description || 'Produto ERP',
                     quantidade: Math.ceil(Number(it.quantity || 1)),
                     valor_unitario: Number(it.unit_price || 0),
                     valor_total: Number(it.total_value || 0),
                     peso: 0,
                     volume: Math.ceil(Number(it.quantity || 1)),
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
console.log("ORDERS PATCH APPLIED SUCCESSFULLY");
