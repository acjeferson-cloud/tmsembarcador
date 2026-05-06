const fs = require('fs');
let idx = fs.readFileSync('tms-erp-proxy/services/auto-import/index.js', 'utf8');
idx = idx.replace(/calculateBestFreight\(/g, 'calculateBestFreight(supabase, ');
idx = idx.replace(/calculateCteFreight\(/g, 'calculateCteFreight(supabase, ');
fs.writeFileSync('tms-erp-proxy/services/auto-import/index.js', idx);
