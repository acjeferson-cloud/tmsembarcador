import fs from 'fs';

const filePath = 'supabase/functions/auto-import-xml-scheduler/index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const targetLoop = `               for (const attachmentInfo of validAttachmentsInfo) {`;

const sortCode = `               // Sort attachments so NFes are processed first based on filename heuristic
               validAttachmentsInfo.sort((a, b) => {
                  const aName = (a.filename || '').toLowerCase();
                  const bName = (b.filename || '').toLowerCase();
                  const aIsNfe = aName.includes('nfe') || (!aName.includes('cte') && aName.includes('nf'));
                  const bIsNfe = bName.includes('nfe') || (!bName.includes('cte') && bName.includes('nf'));
                  if (aIsNfe && !bIsNfe) return -1;
                  if (!aIsNfe && bIsNfe) return 1;
                  return 0;
               });

               for (const attachmentInfo of validAttachmentsInfo) {`;

content = content.replace(targetLoop, sortCode);

fs.writeFileSync(filePath, content);
console.log("Sort logic added!");
