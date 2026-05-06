const fs = require('fs');
let code = fs.readFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', 'utf8');

const cteTarget1 = `const vCarga = infCte.infCTeNorm?.infCarga?.vCarga || 0;
                       let pesoReal = 0;`;

const cteReplacement1 = `const cteEmitDoc = String(infCte.emit?.CNPJ || '');
                       const cteTomaDoc = String(infCte.toma?.CNPJ || infCte.toma?.CPF || infCte.toma03?.toma || infCte.toma4?.CNPJ || infCte.toma4?.CPF || '');
                       let routedCteEstabId = estab.id;
                       const cnpjsToCheckCte = [cteEmitDoc, destDoc, origDoc, cteTomaDoc].map(c => String(c || '').replace(/\\D/g, '')).filter(c => c.length > 0);
                       for (const c of cnpjsToCheckCte) {
                          const match = establishments.find((e: any) => e.organization_id === estab.organization_id && e.cnpj && e.cnpj.replace(/\\D/g, '') === c);
                          if (match) {
                             routedCteEstabId = match.id;
                             break;
                          }
                       }

                       const vCarga = infCte.infCTeNorm?.infCarga?.vCarga || 0;
                       let pesoReal = 0;`;

code = code.replace(cteTarget1, cteReplacement1);

const cteTarget2 = `organization_id: estab.organization_id,
                                                  environment_id: estab.environment_id,
                                                  establishment_id: estab.id,
                                                  carrier_id: cteCarrierId,`;

const cteReplacement2 = `organization_id: estab.organization_id,
                                                  environment_id: estab.environment_id,
                                                  establishment_id: routedCteEstabId,
                                                  carrier_id: cteCarrierId,`;

code = code.replace(cteTarget2, cteReplacement2);

fs.writeFileSync('supabase/functions/auto-import-xml-scheduler/index.ts', code);
console.log("Updated CTE successfully!");
