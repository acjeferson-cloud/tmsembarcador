const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

const newHTML = `
          let logoSrc = logoBase64 || '';
          if (logoSrc && !logoSrc.startsWith('http') && !logoSrc.startsWith('data:')) {
            logoSrc = \`data:image/png;base64,\${logoSrc}\`;
          }
          
          const logoHtml = logoSrc 
            ? \`<div style="text-align: center; margin-bottom: 30px;">
                 <img src="\${logoSrc}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
               </div>\`
            : '';

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
`;

content = content.replace(
  /const emailBody = `[\s\S]*?`;/g,
  newHTML.trim()
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
