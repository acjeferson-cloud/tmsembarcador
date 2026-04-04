const fs = require('fs');
let content = fs.readFileSync('src/services/sapService.ts', 'utf8');

const search = "      // 6. Persist Order";
const replacement = `      // 6. Check if Order already exists
      const { data: existingOrder } = await supabase!
        .from('orders')
        .select('id')
        .eq('numero_pedido', String(sapOrder.order_number))
        .eq('organization_id', context?.organizationId || 0)
        .eq('environment_id', context?.environmentId || 0)
        .maybeSingle();

      if (existingOrder) {
        return { 
          success: true, 
          message: \`Pedido \${sapOrder.order_number} \${finalBusinessPartnerName ? 'do cliente ' + finalBusinessPartnerName : ''} já havia sido importado anteriormente, não foi duplicado.\`
        };
      }

      // 7. Persist Order`;

if (content.includes(search)) {
    content = content.replace(search, replacement);
    content = content.replace("// 7. Persist Items", "// 8. Persist Items");
    fs.writeFileSync('src/services/sapService.ts', content);
    console.log('Replaced successfully.');
} else {
    console.log('Not found');
}
