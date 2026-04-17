const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

const regex = /let definitiveLogoUrl = logoUrl \|\| '';[^]+?if \(logoAttachment\) {\r?\n\s*emailPayload\.attachments\.push\(logoAttachment\);\r?\n\s*}/m;

const replacement = `
          // --- BULLETPROOF DB FETCH FOR LOGO ---
          let definitiveLogoUrl = '';
          let logoAttachment: any = null;
          
          try {
              let query = (supabase as any).from('establishments').select('metadata, logo_url, logo_light_url, cnpj');
              if (establishmentCnpj) {
                  query = query.eq('cnpj', establishmentCnpj.replace(/\D/g, ''));
              } else {
                  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(establishmentId);
                  if (isUuid) query = query.eq('id', establishmentId);
                  else query = query.eq('codigo', parseInt(establishmentId) || 0);
              }
              const { data: dbEst } = await query.maybeSingle();
              
              if (dbEst) {
                  const rawVal = dbEst.metadata?.logo_nps_url || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || dbEst.logo_url || dbEst.logo_light_url || '';
                  
                  if (rawVal) {
                      if (rawVal.startsWith('http')) {
                          definitiveLogoUrl = rawVal;
                      } else if (!rawVal.startsWith('data:')) {
                         const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                         let cleanPath = rawVal;
                         if (cleanPath.startsWith('/public/logos/')) cleanPath = cleanPath.substring('/public/logos/'.length);
                         else if (cleanPath.startsWith('logos/')) cleanPath = cleanPath.substring('logos/'.length);
                         definitiveLogoUrl = \`\${baseUrl}/storage/v1/object/public/logos/\${cleanPath}\`;
                      }
                  } else {
                      // Fallback to base64 if url is completely absent
                      const b64 = dbEst.metadata?.logo_nps_base64 || dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_base64 || '';
                      if (b64 && b64.length > 100) {
                         let rawB64 = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
                         logoAttachment = {
                            filename: 'logo.png',
                            content: rawB64,
                            encoding: 'base64',
                            cid: 'logo_empresa',
                            contentDisposition: 'inline'
                         };
                      }
                  }
              }
          } catch(e) {
              console.error('[EMAIL LOGO] Failed to fetch auth logo:', e);
          }

          // Ultimate fallback if DB yielded nothing but screen passed a base64
          if (!definitiveLogoUrl && !logoAttachment && logoBase64 && logoBase64.length > 100) {
              let rawB64 = logoBase64.includes('base64,') ? logoBase64.split('base64,')[1] : logoBase64;
              logoAttachment = {
                 filename: 'logo.png',
                 content: rawB64,
                 encoding: 'base64',
                 cid: 'logo_empresa',
                 contentDisposition: 'inline'
              };
          }
          // --- END BULLETPROOF DB FETCH ---

          let logoHtml = '';
          
          if (definitiveLogoUrl) {
            logoHtml = \`<div style="text-align: center; margin-bottom: 30px;">
                 <img src="\${definitiveLogoUrl}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
               </div>\`;
          } else if (logoAttachment) {
             logoHtml = \`<div style="text-align: center; margin-bottom: 30px;">
                 <img src="cid:logo_empresa" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
               </div>\`;
          }

          const emailBody = \`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              \${logoHtml}
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb;">Relatório de Divergência de CT-e</h2>
              </div>
              
              <p>Prezado transportador <strong>\${cteData.carrierName}</strong>,</p>
              <p>Segue em anexo o relatório detalhado de divergência identificada no CT-e <strong>\${cteData.cteNumber}</strong>.</p>
    
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Resumo da Análise</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 10px; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #22c55e; margin-right: 10px;"></span>
                    <span style="color: #334155;"><strong>Taxas corretas:</strong> \${correctCount}</span>
                  </li>
                  <li style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444; margin-right: 10px;"></span>
                    <span style="color: #334155;"><strong>Taxas divergentes:</strong> \${divergentCount}</span>
                  </li>
                </ul>
              </div>
    
              <p>Por favor, revisar os valores divergentes e tomar as providências necessárias.</p>
    
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              
              <p style="color: #64748b; font-size: 14px; margin-bottom: 5px;">Atenciosamente,</p>
              <p style="color: #334155; font-weight: bold; margin-top: 0;">\${establishmentName}</p>
            </div>
          \`;

          const emailPayload: any = {
            estabelecimentoId: establishmentId,
            to: cteData.carrierEmail,
            subject: emailSubject,
            html: emailBody,
            attachments: [
              {
                filename: \`CTe_\${cteData.cteNumber}_Divergencia.pdf\`,
                content: base64data.split(',')[1],
                encoding: 'base64'
              }
            ]
          };

          if (logoAttachment) {
             emailPayload.attachments.push(logoAttachment);
          }
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
