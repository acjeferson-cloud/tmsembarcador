const fs = require('fs');
let content = fs.readFileSync('src/components/CTes/ReportDivergenceModal.tsx', 'utf8');

content = content.replace(
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, user: { id: userId }, logoBase64 });",
  "const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });"
);

content = content.replace(
  "         const { data, error } = await supabase.functions.invoke('enviar-email-nps', {\r\n            body: {\r\n              estabelecimentoId: establishmentId,\r\n              to: cteData.carrierEmail,\r\n              subject: emailSubject,\r\n              html: emailBody\r\n            }\r\n          });",
  "         const { data, error } = await supabase.functions.invoke('enviar-email-nps', {\n            body: {\n              estabelecimentoId: establishmentId,\n              to: cteData.carrierEmail,\n              subject: emailSubject,\n              html: emailBody,\n              attachments: [{\n                filename: `CTe_${cteData.cteNumber}_Divergencia.pdf`,\n                content: base64data.split(',')[1],\n                encoding: 'base64'\n              }]\n            }\n          });"
);

content = content.replace(
  "         const { data, error } = await supabase.functions.invoke('enviar-email-nps', {\n            body: {\n              estabelecimentoId: establishmentId,\n              to: cteData.carrierEmail,\n              subject: emailSubject,\n              html: emailBody\n            }\n          });",
  "         const { data, error } = await supabase.functions.invoke('enviar-email-nps', {\n            body: {\n              estabelecimentoId: establishmentId,\n              to: cteData.carrierEmail,\n              subject: emailSubject,\n              html: emailBody,\n              attachments: [{\n                filename: `CTe_${cteData.cteNumber}_Divergencia.pdf`,\n                content: base64data.split(',')[1],\n                encoding: 'base64'\n              }]\n            }\n          });"
);

fs.writeFileSync('src/components/CTes/ReportDivergenceModal.tsx', content, 'utf8');
