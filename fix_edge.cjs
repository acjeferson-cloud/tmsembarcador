const fs = require('fs');
let content = fs.readFileSync('supabase/functions/enviar-email-nps/index.ts', 'utf8');

content = content.replace(
  "const { estabelecimentoId, to, subject, html } = await req.json();",
  "const { estabelecimentoId, to, subject, html, attachments } = await req.json();"
);

content = content.replace(
  "htmlPreview: html?.substring(0, 50) });",
  "htmlPreview: html?.substring(0, 50), attachmentsCount: attachments?.length || 0 });"
);

content = content.replace(
  "const info = await transporter.sendMail({",
  "const info = await transporter.sendMail({\n      attachments,"
);

fs.writeFileSync('supabase/functions/enviar-email-nps/index.ts', content, 'utf8');
