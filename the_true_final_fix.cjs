const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

content = content.replace(
  "let query = (supabase as any).from('establishments').select('metadata, logo_url, logo_light_url, cnpj');",
  "let query = (supabase as any).from('establishments').select('metadata');"
);

// We need to also clean up the dbEst references where it checks dbEst.logo_url since that doesn't exist.
content = content.replace(
  "const rawVal = dbEst.metadata?.logo_nps_url || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || dbEst.logo_url || dbEst.logo_light_url || '';",
  "const rawVal = dbEst.metadata?.logo_nps_url || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || '';"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
