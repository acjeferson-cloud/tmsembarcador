const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

const regex = /\/\/ --- BULLETPROOF DB FETCH FOR LOGO ---[\s\S]*?\/\/ --- END BULLETPROOF DB FETCH ---/m;

const replacement = `
          // --- BULLETPROOF DB FETCH FOR LOGO ---
          console.log('[EMAIL DB FETCH] Iniciando busca do logotipo para envio. Establishment ID/CNPJ:', establishmentId, establishmentCnpj);
          console.log('[EMAIL DB FETCH] Logo base64 do frontend recebido:', logoBase64 ? logoBase64.substring(0, 30) + '...' : 'Nenhum');
          console.log('[EMAIL DB FETCH] Logo URL do frontend recebida:', logoUrl || 'Nenhum');
          
          let definitiveLogoUrl = '';
          let logoAttachment: any = null;
          
          try {
              let query = (supabase as any).from('establishments').select('metadata, logo_url, logo_light_url, cnpj');
              if (establishmentCnpj) {
                  const cleaned = establishmentCnpj.replace(/\D/g, '');
                  console.log('[EMAIL DB FETCH] Consultando estabelecimento por CNPJ:', cleaned);
                  query = query.eq('cnpj', cleaned);
              } else {
                  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(establishmentId);
                  console.log('[EMAIL DB FETCH] Consultando por ID:', establishmentId, 'IsUUID?', isUuid);
                  if (isUuid) query = query.eq('id', establishmentId);
                  else query = query.eq('codigo', parseInt(establishmentId) || 0);
              }
              const { data: dbEst, error: dbErr } = await query.maybeSingle();
              
              if (dbErr) {
                 console.error('[EMAIL DB FETCH] Erro na consulta do DB:', dbErr);
              }
              
              if (dbEst) {
                  console.log('[EMAIL DB FETCH] Estabelecimento retornado. Verificando dados:', JSON.stringify(dbEst));
                  
                  const rawVal = dbEst.metadata?.logo_nps_url || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || dbEst.logo_url || dbEst.logo_light_url || '';
                  console.log('[EMAIL DB FETCH] Melhor URL/Path de logotipo encontrado bruto:', rawVal || 'Nenhum');
                  
                  if (rawVal) {
                      if (rawVal.startsWith('http')) {
                          console.log('[EMAIL DB FETCH] RESOLVIDO: O banco retornou um HTTP absoluto valido.', rawVal);
                          definitiveLogoUrl = rawVal;
                      } else if (!rawVal.startsWith('data:')) {
                         const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                         let cleanPath = rawVal;
                         if (cleanPath.startsWith('/public/logos/')) cleanPath = cleanPath.substring('/public/logos/'.length);
                         else if (cleanPath.startsWith('logos/')) cleanPath = cleanPath.substring('logos/'.length);
                         
                         definitiveLogoUrl = \`\${baseUrl}/storage/v1/object/public/logos/\${cleanPath}\`;
                         console.log('[EMAIL DB FETCH] RESOLVIDO: O banco retornou URL relativa. Montada URL absoluta com base do VITE:', definitiveLogoUrl);
                      }
                  } else {
                      console.log('[EMAIL DB FETCH] Nenhuma URL encontrada no banco. Buscando Base64 do banco...');
                      // Fallback to base64 if url is completely absent
                      const b64 = dbEst.metadata?.logo_nps_base64 || dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_base64 || '';
                      if (b64 && b64.length > 100) {
                         console.log('[EMAIL DB FETCH] RESOLVIDO: Base64 retornado pelo banco. Configurando como Content-ID (cid).');
                         let rawB64 = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
                         logoAttachment = {
                            filename: 'logo.png',
                            content: rawB64,
                            encoding: 'base64',
                            cid: 'logo_empresa',
                            contentDisposition: 'inline'
                         };
                      } else {
                         console.log('[EMAIL DB FETCH] Base64 TAMBÉM VAZIO NO BANCO.');
                      }
                  }
              } else {
                  console.warn('[EMAIL DB FETCH] Nenhum estabelecimento encontrado no DB com esse Filtro!');
              }
          } catch(e) {
              console.error('[EMAIL DB FETCH] Failed to fetch auth logo:', e);
          }

          // Ultimate fallback if DB yielded nothing but screen passed a base64
          if (!definitiveLogoUrl && !logoAttachment && logoBase64 && logoBase64.length > 100) {
              console.log('[EMAIL DB FETCH] ULTIMO RECURSO: DB não tinha o arquivo, injetando o Base64 passado pela Interface (CID fallback).');
              let rawB64 = logoBase64.includes('base64,') ? logoBase64.split('base64,')[1] : logoBase64;
              logoAttachment = {
                 filename: 'logo.png',
                 content: rawB64,
                 encoding: 'base64',
                 cid: 'logo_empresa',
                 contentDisposition: 'inline'
              };
          }
          
          console.log('[EMAIL RESULT] definitiveLogoUrl:', definitiveLogoUrl);
          console.log('[EMAIL RESULT] logoAttachment exists?', !!logoAttachment);
          // --- END BULLETPROOF DB FETCH ---
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
