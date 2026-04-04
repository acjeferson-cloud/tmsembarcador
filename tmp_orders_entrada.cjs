const fs = require('fs');

let content = fs.readFileSync('src/services/ordersService.ts', 'utf8');

// 1. mapOrderFromDb:
// Original: entry_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],
// Replace to: entry_date: dbOrder.data_entrada || dbOrder.data_pedido || new Date().toISOString().split('T')[0],
content = content.replace(
  "entry_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],",
  "entry_date: dbOrder.data_entrada || dbOrder.data_pedido || new Date().toISOString().split('T')[0],"
);

// 2. dataToInsert in create():
// Add `data_entrada: orderData.entry_date || new Date().toISOString().split('T')[0],` below `data_pedido:`
content = content.replace(
  "data_pedido: orderData.issue_date || new Date().toISOString().split('T')[0],",
  "data_pedido: orderData.issue_date || new Date().toISOString().split('T')[0],\n        data_entrada: orderData.entry_date || new Date().toISOString().split('T')[0],"
);

// 3. update():
// Add `if (orderData.entry_date !== undefined) dataToUpdate.data_entrada = orderData.entry_date || null;`
content = content.replace(
  "if (orderData.issue_date !== undefined) dataToUpdate.data_pedido = orderData.issue_date || new Date().toISOString().split('T')[0];",
  "if (orderData.issue_date !== undefined) dataToUpdate.data_pedido = orderData.issue_date || new Date().toISOString().split('T')[0];\n      if (orderData.entry_date !== undefined) dataToUpdate.data_entrada = orderData.entry_date || null;"
);

// We should also replace the original data_pedido fallback for entry_date if it was using different formatting, 
// but string replacement should catch it if identical.

fs.writeFileSync('src/services/ordersService.ts', content);
console.log("ordersService mapped data_entrada");
