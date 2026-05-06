const fs = require('fs');
let c = fs.readFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', 'utf8');
c = c.replace(/let payloadString = '';\s+if \(attachmentInfo\.content\) \{/, "if (currFilename.endsWith('.xml') || currFilename.endsWith('.txt') || currFilename.endsWith('.edi')) {\n                   let payloadString = '';\n                  if (attachmentInfo.content) {");
fs.writeFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', c);
