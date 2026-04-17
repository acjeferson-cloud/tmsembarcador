const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

// The replacement payload
let replacement = `         const { data, error } = await supabase.functions.invoke('enviar-email-nps', {
            body: {
              estabelecimentoId: establishmentId,
              to: cteData.carrierEmail,
              subject: emailSubject,
              html: emailBody,
              attachments: [{
                filename: \`CTe_\${cteData.cteNumber}_Divergencia.pdf\`,
                content: base64data.split(',')[1],
                encoding: 'base64'
              }]
            }
          });`;

content = content.replace(
  /const { data, error } = await supabase\.functions\.invoke\('enviar-email-nps', \{\s+body: \{\s+estabelecimentoId: establishmentId,\s+to: cteData\.carrierEmail,\s+subject: emailSubject,\s+html: emailBody\s+\}\s+\}\);/g,
  replacement
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
