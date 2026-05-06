const fs = require('fs');
let c = fs.readFileSync('tms-erp-proxy/services/auto-import/index.js', 'utf8');
c = c.replace(/return JSON\.stringify\(\{ success: true, message: .*?\}\), \{ headers: \{ \.\.\.corsHeaders, 'Content-Type': 'application\/json' \} \};/, "return { success: true, message: 'Execução interrompida com sucesso.' };");
fs.writeFileSync('tms-erp-proxy/services/auto-import/index.js', c);
