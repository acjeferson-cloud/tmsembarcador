const fs = require('fs');

let content = fs.readFileSync('tms-erp-proxy/syncWorker.js', 'utf8');

// 1. Add lastSyncTime to payload
content = content.replace(
  "companyDb: config.database || config.metadata?.database",
  "companyDb: config.database || config.metadata?.database,\n        lastSyncTime: config.last_sync_time || null"
);

// 2. Orders Loop
content = content.replace(
  "if (sapOrderResp && sapOrderResp.success && sapOrderResp.order) {\n          const sapOrder = sapOrderResp.order;",
  "if (sapOrderResp && sapOrderResp.success && sapOrderResp.orders) {\n          for (const sapOrder of sapOrderResp.orders) {"
);

// 3. Orders Error Else block
content = content.replace(
  "                 insertedCount++;\n             }\n          }\n        } else {\n           if (sapOrderResp && sapOrderResp.error) {",
  "                 insertedCount++;\n             }\n          }\n          }\n        } else if (sapOrderResp && sapOrderResp.error) {"
);

// 4. Invoices Loop
content = content.replace(
  "if (sapInvResp && sapInvResp.success && sapInvResp.invoice) {\n          const sapInvoice = sapInvResp.invoice;",
  "if (sapInvResp && sapInvResp.success && sapInvResp.invoices) {\n          for (const sapInvoice of sapInvResp.invoices) {"
);

// 5. Invoices Error Else block
content = content.replace(
  "                  logsBuffer.push(`NFe ${sapInvoice.invoice_number} custo recalculado p/ ${finalFreightValue}`);\n              }\n          }\n        } else {\n           if (sapInvResp && sapInvResp.error) {",
  "                  logsBuffer.push(`NFe ${sapInvoice.invoice_number} custo recalculado p/ ${finalFreightValue}`);\n              }\n          }\n          }\n        } else if (sapInvResp && sapInvResp.error) {"
);

fs.writeFileSync('tms-erp-proxy/syncWorker.js', content, 'utf8');
console.log('Worker refactored successfully.');
