const fs = require('fs');
let code = fs.readFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', 'utf8');

if (!code.includes('import { Buffer }')) {
   code = 'import { Buffer } from "node:buffer";\n' + code;
}

// 1. Limitar IMAP Search
const imapTarget = `const messageGenerator = mailClient.fetch({ unseen: true }, { envelope: true, bodyStructure: true, flags: true, uid: true });
          
          const messagesToProcess: any[] = [];
          for await (let msg of messageGenerator) {
            messagesToProcess.push(msg);
          }`;

const imapReplacement = `const searchResult = await mailClient.search({ unseen: true });
          if (!searchResult || searchResult.length === 0) {
             await flushLogs('running', \`Nenhum email não lido encontrado na INBOX.\`);
             await mailClient.logout();
             continue;
          }
          const uidsToProcess = searchResult.slice(0, 10); // Processa no máximo 10 emails por ciclo
          await flushLogs('running', \`Encontrados \${searchResult.length} emails. Processando \${uidsToProcess.length} neste ciclo...\`);
          
          const messageGenerator = mailClient.fetch(uidsToProcess, { envelope: true, bodyStructure: true, flags: true, uid: true });
          
          const messagesToProcess: any[] = [];
          for await (let msg of messageGenerator) {
            messagesToProcess.push(msg);
          }`;
code = code.replace(imapTarget, imapReplacement);

// 2. Corrigir Base64 travando a CPU
const b64Target = `let rawString = partBuffer.toString('utf8');
                     if (attachmentInfo.encoding && attachmentInfo.encoding.toLowerCase() === 'base64') {
                        payloadString = atob(rawString.replace(/\\s/g, ''));
                     } else {
                        payloadString = rawString;
                     }`;

const b64Replacement = `if (attachmentInfo.encoding && attachmentInfo.encoding.toLowerCase() === 'base64') {
                        payloadString = Buffer.from(partBuffer.toString('utf8'), 'base64').toString('utf8');
                     } else {
                        payloadString = partBuffer.toString('utf8');
                     }`;
code = code.replace(b64Target, b64Replacement);

fs.writeFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', code);
console.log('Script updated!');
