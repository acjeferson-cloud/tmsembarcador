const fs = require('fs');
let content = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const regex = /if \(estId && estId !== '1'\) \{\s*try \{\s*const isUuid = \/.*?\/.*?;\s*let query = \(supabase as any\)\.from\('establishments'\)\.select\('\*'\);\s*if \(isUuid\) \{\s*query = query\.eq\('id', estId\);\s*\} else \{\s*query = query\.eq\('codigo', parseInt\(estId\) \|\| 0\);\s*\}\s*const \{ data: dbEst \} = await query\.maybeSingle\(\);\s*if \(dbEst\) \{\s*fantasia = dbEst\.fantasia \|\| dbEst\.nome_fantasia \|\| fantasia;\s*razaoSocial = dbEst\.razao_social \|\| razaoSocial;\s*cnpj = dbEst\.cnpj \|\| '';\s*endereco = dbEst\.endereco \? `\$\{dbEst\.endereco\}, \$\{dbEst\.bairro \|\| ''\} - \$\{dbEst\.cidade \|\| ''\}\/\$\{dbEst\.estado \|\| ''\}` : '';\s*logoBase64 = dbEst\.metadata\?\.logo_light_base64 \|\| dbEst\.metadata\?\.logo_dark_base64 \|\| dbEst\.logo_url;\s*\}\s*\} catch\(e\) \{\}\s*\}/s;

let replaceText = `if (estId && !logoBase64) {
           try {
               const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(estId);
               let query = (supabase as any).from('establishments').select('*');
               if (isUuid) {
                   query = query.eq('id', estId);
               } else {
                   query = query.eq('codigo', parseInt(estId) || 0);
               }
    
               const { data: dbEst } = await query.maybeSingle();
               if (dbEst) {
                   fantasia = dbEst.fantasia || dbEst.nome_fantasia || fantasia;
                   razaoSocial = dbEst.razao_social || razaoSocial;
                   cnpj = dbEst.cnpj || '';
                   endereco = dbEst.endereco ? \`\$\{dbEst.endereco\}, \$\{dbEst.bairro || ''\} - \$\{dbEst.cidade || ''\}/\$\{dbEst.estado || ''\}\` : '';
                   
                   logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.logo_light_base64 || dbEst.logo_url || dbEst.metadata?.logo_url;
               }
           } catch(e) {}
        }`;

if(regex.test(content)){
    content = content.replace(regex, replaceText);
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
    console.log("Successfully replaced the block and removed !== '1' condition!");
} else {
    // Let's use simple string replacement just in case
    content = content.replace("if (estId && estId !== '1') {", "if (estId && !logoBase64) {");
    content = content.replace("logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.logo_url;", "logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.logo_light_base64 || dbEst.logo_url || dbEst.metadata?.logo_url;");
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', content, 'utf8');
    console.log("Applied simple string replacement instead.");
}
