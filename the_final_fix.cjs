const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

const regex = /try {\s*let query = \(supabase as any\)\.from\('establishments'\)[\s\S]*?const { data: dbEst, error: dbErr } = await query\.maybeSingle\(\);/m;

const replacement = `
          try {
              let query = (supabase as any).from('establishments').select('metadata, logo_url, logo_light_url, cnpj');
              
              const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(establishmentId);
              
              if (isUuid) {
                  console.log('[EMAIL DB FETCH] ID é formatado como UUID. Buscando na coluna id.');
                  query = query.eq('id', establishmentId);
              } else {
                  console.log('[EMAIL DB FETCH] ID não é UUID (provavelmente CNPJ). Buscando na coluna cnpj.');
                  const cleanCnpj = establishmentCnpj ? String(establishmentCnpj).replace(/\\D/g, '') : String(establishmentId).replace(/\\D/g, '');
                  query = query.eq('cnpj', cleanCnpj);
              }
              
              const { data: dbEst, error: dbErr } = await query.maybeSingle();
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
