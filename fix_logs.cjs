const fs = require('fs');
let c1 = fs.readFileSync('src/services/cteDivergenceReportService.ts', 'utf8');

const regex = /let logoBase64: string \| undefined = context\?.logoBase64;.*?if \(logoBase64\) \{\s*try \{\s*if \(\!logoBase64\.startsWith\('http'\) && \!logoBase64\.startsWith\('data:'\)\) \{\s*logoBase64 = `data:image\/png;base64,\$\{logoBase64\}`;\s*\}\s*doc\.addImage\(logoBase64, margin, margin, 40, 15\);\s*currentX = margin \+ 45;\s*\} catch\(e\) \{\}\s*\}/s;

const replacement = `let logoBase64: string | undefined = context?.logoBase64;
        console.log("[PDF_LOGO] Logo fornecido pelo contexto UI:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "undefined");
        
        if (estId && !logoBase64) {
           console.log("[PDF_LOGO] Iniciando DB fallback para estId: ", estId);
           try {
               const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(estId);
               let query = (supabase as any).from('establishments').select('*');
               if (isUuid) {
                   query = query.eq('id', estId);
               } else {
                   query = query.eq('codigo', parseInt(estId) || 0);
               }
    
               const { data: dbEst, error: dbErr } = await query.maybeSingle();
               console.log("[PDF_LOGO] dbEst retornado:", !!dbEst, "Erro:", dbErr);
               
               if (dbEst) {
                   fantasia = dbEst.fantasia || dbEst.nome_fantasia || fantasia;
                   razaoSocial = dbEst.razao_social || razaoSocial;
                   cnpj = dbEst.cnpj || '';
                   endereco = dbEst.endereco ? \`\$\{dbEst.endereco\}, \$\{dbEst.bairro || ''\} - \$\{dbEst.cidade || ''\}/\$\{dbEst.estado || ''\}\` : '';
                   
                   logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.logo_light_base64 || dbEst.logo_url || dbEst.metadata?.logo_url;
                   console.log("[PDF_LOGO] Logo encontrado via Supabase:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "Nenhum logo na tabela");
               }
           } catch(e) { console.log("[PDF_LOGO] Erro no fallback DB:", e); }
        }

        if (logoBase64 && logoBase64.startsWith('http')) {
           console.log("[PDF_LOGO] Identificada URL externa (Storage). Baixando via URL SDK...", logoBase64);
           try {
               let path = logoBase64;
               if (path.includes('/public/logos/')) path = path.split('/public/logos/')[1];
               else if (path.includes('/public/')) path = path.split('/public/')[1].replace('logos/', '');
               
               console.log("[PDF_LOGO] Rota real convertida para bucket:", path);
               const { data: blob, error: downloadErr } = await (supabase as any).storage.from('logos').download(path);
               
               if (blob) {
                   console.log("[PDF_LOGO] Blob baixado com sucesso, tamanho:", blob.size);
                   logoBase64 = await new Promise((resolve) => {
                       const reader = new FileReader();
                       reader.onloadend = () => {
                           let res = reader.result as string;
                           if (res.startsWith('data:application/octet-stream;')) res = res.replace('data:application/octet-stream;', 'data:image/png;');
                           resolve(res);
                       };
                       reader.readAsDataURL(blob);
                   });
                   console.log("[PDF_LOGO] Blob transformado em Base64 Data URL (success)");
               } else {
                   console.log("[PDF_LOGO] Erro download blob:", downloadErr);
                   logoBase64 = undefined;
               }
           } catch(e) { 
               console.log("[PDF_LOGO] Erro captura URL via Storage:", e);
               logoBase64 = undefined; 
           }
        }
        
        console.log("[PDF_LOGO] Valor final de logoBase64 ap\\u00F3s todo fluxo:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "INV\\u00C1LIDO");

        if (logoBase64) {
          try {
            if (!logoBase64.startsWith('http') && !logoBase64.startsWith('data:')) {
              logoBase64 = \`data:image/png;base64,\$\{logoBase64\}\`;
            }
            doc.addImage(logoBase64, margin, margin, 40, 15);
            currentX = margin + 45;
            console.log("[PDF_LOGO] M\\u00E9todo doc.addImage disparado SEM erros");
          } catch(e) {
            console.error("[PDF_LOGO] ERRO FATAL AO INJETAR NO JSPDF: ", e);
          }
        }`;

if(regex.test(c1)){
    c1 = c1.replace(regex, replacement);
    fs.writeFileSync('src/services/cteDivergenceReportService.ts', c1, 'utf8');
    console.log("Successfully replaced block with debug logs!");
} else {
    console.error("REGEX FAILED TO MATCH");
}
