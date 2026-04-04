const fs = require('fs');
let content = fs.readFileSync('src/services/ordersService.ts', 'utf8');

content = content.replace(
    "customer_name: dbOrder.business_partner_name || dbOrder.business_partners?.razao_social || 'Cliente não informado',",
    "customer_name: dbOrder.business_partner_name || dbOrder.business_partners?.razao_social || dbOrder.metadata?.customer_name || 'Cliente não informado',"
);

content = content.replace(
    "best_carrier_id: orderData.best_carrier_id || null,\n        created_at: new Date().toISOString(),",
    "best_carrier_id: orderData.best_carrier_id || null,\n        metadata: { customer_name: orderData.customer_name },\n        created_at: new Date().toISOString(),"
);

content = content.replace(
    "if (orderData.entry_date !== undefined) dataToUpdate.data_entrada = orderData.entry_date || null;",
    "if (orderData.entry_date !== undefined) dataToUpdate.data_entrada = orderData.entry_date || null;\n      if (orderData.customer_name) {\n        // Fetch current to merge metadata safely without destroying it\n        const { data: currentDbOrder } = await supabase.from('orders').select('metadata').eq('id', id).single();\n        dataToUpdate.metadata = { ...((currentDbOrder && currentDbOrder.metadata) || {}), customer_name: orderData.customer_name };\n      }"
);

fs.writeFileSync('src/services/ordersService.ts', content);
console.log('ordersService updated metadata customer_name');
