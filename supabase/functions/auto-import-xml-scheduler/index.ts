import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { ImapFlow } from "npm:imapflow";
import { simpleParser } from "npm:mailparser";
import { XMLParser } from "npm:fast-xml-parser";
import { calculateBestFreight, calculateCteFreight } from "./freightQuoter.ts";
import { processDoccobExtracted } from "./doccobImporter.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let logsTableExists = true;
  const logId = crypto.randomUUID();
  let details: any[] = [];

  try {
    const payload = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    
    // RLS bypass via Edge Function to stop executions
    if (payload.action === 'stop' && payload.logId) {
       const { error: updateError } = await supabase
          .from('xml_auto_import_logs')
          .update({
             status: 'warning',
             should_stop: true,
             details: {
                message: 'Execução cancelada pelo usuário',
                stopped_at: new Date().toISOString(),
                forced_stop: true
             }
          })
          .eq('id', payload.logId);
       
       if (updateError) throw updateError;
       return new Response(JSON.stringify({ success: true, message: 'Execução interrompida com sucesso pelo servidor.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const startTime = new Date().toISOString();
    
    // Check if the xml logs table exists.
    const { error: probeError } = await supabase.from('xml_auto_import_logs').select('id').limit(1);
    if (probeError && probeError.code === '42P01') {
      logsTableExists = false;
      console.warn("Table xml_auto_import_logs does not exist. Skipping logging.");
    }

    if (logsTableExists) {
      const { error: insertError } = await supabase.from('xml_auto_import_logs').insert({
         id: logId,
         execution_time: startTime,
         status: 'running',
         nfe_imported: 0,
         cte_imported: 0,
         total_processed: 0,
         emails_checked: 0,
         details: [{ message: 'Iniciando processamento das contas de email...' }],
         error_message: null
      });
      if (insertError) {
        console.error("Failed to insert running log:", insertError);
        details.push({ message: 'Erro ao inserir log', error: insertError.message, code: insertError.code });
      }
    }

    const { data: establishments, error: estabError } = await supabase
      .from('establishments')
      .select('id, organization_id, environment_id, metadata, razao_social');

    if (estabError) throw new Error(`Erro estabelecimentos: ${estabError.message}`);

    const activeConfigs = establishments.filter((e: any) => {
       let metadata = e.metadata;
       if (typeof metadata === 'string') {
         try { metadata = JSON.parse(metadata); } catch (err) {}
       }
       let email_config = e.email_config;
       if (typeof email_config === 'string') {
         try { email_config = JSON.parse(email_config); } catch (err) {}
       }
       const config = email_config || metadata?.email_config;
       return config?.autoDownloadEnabled === true || config?.autoDownloadEnabled === 'true' || config?.autoDownloadEnabled === 1;
    });
    
    let totalNfe = 0;
    let totalCte = 0;
    let emailsChecked = 0;

    const flushLogs = async (status = 'running', msg = '') => {
      if (msg) details.push({ message: msg, time: new Date().toISOString() });
      if (logsTableExists) {
        await supabase.from('xml_auto_import_logs').update({
          status,
          nfe_imported: totalNfe,
          cte_imported: totalCte,
          total_processed: totalNfe + totalCte,
          emails_checked: emailsChecked,
          details
        }).eq('id', logId);
      }
    };

    await flushLogs('running', 'Iniciando processamento de estabelecimentos...');

    for (const estab of activeConfigs) {
      const config = estab.email_config || estab.metadata?.email_config || {};
      let estabNfes = 0;
      let estabCtes = 0;
      let estabEmailsChecked = 0;

      if (!config.host || !config.email) {
          console.warn(`Establecimento ${estab.razao_social} skipped due to missing host or email.`);
          details.push({
            establishment: estab.razao_social,
            status: 'warning',
            error: 'Host ou Email não preenchido corretamente na configuração.'
          });
          continue;
      }

      try {
        const mailClient = new ImapFlow({
          host: config.host,
          port: parseInt(config.port, 10) || 993,
          secure: config.useSSL !== false,
          auth: { user: config.email, pass: String(config.password || '') },
          logger: false,
          verifyOnly: false
        });

        await flushLogs('running', `Conectando ao IMAP: ${config.host}:${config.port} para ${config.email}...`);
        
        // Wrap connect in a timeout
        await Promise.race([
          mailClient.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('IMAP Connection Timeout após 15s')), 15000))
        ]);

        await flushLogs('running', `IMAP Conectado! Criando pasta 'Processados' se não existir...`);
        try {
          await mailClient.mailboxCreate('Processados');
        } catch (e) {
          // Ignore error, folder probably exists
        }

        await flushLogs('running', `Obtendo lock INBOX...`);
        let lock;
        try {
          lock = await Promise.race([
            mailClient.getMailboxLock('INBOX'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout obtendo lock INBOX após 10s')), 10000))
          ]) as any;
        } catch (lockErr) {
          await flushLogs('running', `Erro ao abrir INBOX: ${lockErr.message}`);
          throw lockErr;
        }

        await flushLogs('running', `Lock INBOX obtido! Buscando emails unread...`);
        
        try {
          // Fetch with UID, envelope and bodyStructure ONLY (NO source: true -> prevents OOM)
          const messageGenerator = mailClient.fetch({ unseen: true }, { envelope: true, bodyStructure: true, flags: true, uid: true });
          
          const messagesToProcess: any[] = [];
          for await (let msg of messageGenerator) {
            messagesToProcess.push(msg);
          }

          for (let msg of messagesToProcess) {
             estabEmailsChecked++;
             emailsChecked++;
             
             await flushLogs('running', `Lendo UID/Seq ${msg.seq}... Analisando anexos.`);
             
             try {
               const validAttachmentsInfo: any[] = [];
               
               const findValidParts = (node: any) => {
                 if (!node) return;
                 const type = node.type ? node.type.toLowerCase() : '';
                 const name = node.parameters?.name?.toLowerCase() || node.dispositionParameters?.filename?.toLowerCase() || '';
                 
                 if (
                   type.includes('xml') || name.endsWith('.xml') ||
                   name.endsWith('.txt') || name.endsWith('.edi')
                 ) {
                   validAttachmentsInfo.push({
                     part: node.part,
                     filename: node.parameters?.name || node.dispositionParameters?.filename || 'anexo.bin',
                     encoding: node.encoding
                   });
                 }
                 if (node.childNodes && Array.isArray(node.childNodes)) {
                   node.childNodes.forEach(findValidParts);
                 }
               };

               if (msg.bodyStructure) {
                 findValidParts(msg.bodyStructure);
               }

               const assunto = msg.envelope?.subject || 'Sem Assunto';
               const hasValidFiles = validAttachmentsInfo.length > 0;

               details.push({ 
                 message: `Lendo email ${msg.seq}`, 
                 assunto: assunto,
                 anexos: validAttachmentsInfo.map(a => a.filename),
                 tem_arquivos_suportados: hasValidFiles
               });
               
               for (const attachmentInfo of validAttachmentsInfo) {
                 const currFilename = attachmentInfo.filename ? attachmentInfo.filename.toLowerCase() : '';
                 if (currFilename.endsWith('.xml') || currFilename.endsWith('.txt') || currFilename.endsWith('.edi')) {
                   let payloadString = '';
                   try {
                     // Use fetchOne instead of a fetch stream generator to completely avoid Deno iterator hanging bugs
                     // We encapsulate this in a Promise.race to guarantee Deno ImapFlow bugs don't freeze the cloud Function
                     const pMsg = await Promise.race([
                         mailClient.fetchOne(msg.uid, { bodyParts: [attachmentInfo.part], uid: true }, { uid: true }),
                         new Promise<any>((_, reject) => setTimeout(() => reject(new Error(`Timeout de 15s baixando anexo parte ${attachmentInfo.part}`)), 15000))
                     ]);
                     
                     let partBuffer = pMsg?.bodyParts?.get(attachmentInfo.part);

                     if (!partBuffer) {
                        throw new Error("ImapFlow falhou em retornar o buffer do bodyPart " + attachmentInfo.part);
                     }

                     let rawString = partBuffer.toString('utf8');
                     if (attachmentInfo.encoding && attachmentInfo.encoding.toLowerCase() === 'base64') {
                        payloadString = atob(rawString.replace(/\s/g, ''));
                     } else {
                        payloadString = rawString;
                     }
                   } catch (downloadErr: any) {
                     details.push({ establishment: estab.razao_social, warning: `Falha ao baixar anexo ${attachmentInfo.filename}`, error: downloadErr.message });
                     continue;
                   }

                   if (currFilename.endsWith('.txt') || currFilename.endsWith('.edi')) {
                     const firstLine = payloadString.split('\n')[0] || '';
                     if (firstLine.includes('DOCCOB') || firstLine.includes('FATURA') || firstLine.includes('COB') || firstLine.startsWith('350')) {
                        details.push({ message: `Identificado arquivo EDI DOCCOB: ${attachmentInfo.filename}` });
                        await processDoccobExtracted(supabase, payloadString, estab, details);
                     } else {
                        details.push({ message: `Ignorando TXT não reconhecido no formato DOCCOB: ${attachmentInfo.filename}` });
                     }
                     continue;
                   }

                   let xmlString = payloadString;
                   let xmlObj;
                   try {
                     xmlObj = xmlParser.parse(xmlString);
                   } catch (e) {
                     details.push({ establishment: estab.razao_social, warning: 'Falha no parser do XML', file: attachmentInfo.filename });
                     continue;
                   }
                   
                   const nfeRoot = xmlObj.nfeProc?.NFe || xmlObj.NFe;
                   const cteRoot = xmlObj.cteProc?.CTe || xmlObj.CTe;
                   
                   let modelo = '0';
                   if (nfeRoot?.infNFe?.ide?.mod) modelo = String(nfeRoot.infNFe.ide.mod);
                   else if (cteRoot?.infCte?.ide?.mod) modelo = String(cteRoot.infCte.ide.mod);

                   details.push({ message: `Arquivo XML encontrado: ${attachmentInfo.filename}`, modelo });

                   // NFe - Modelo 55
                   if (modelo === '55' || (nfeRoot && nfeRoot.infNFe)) {
                       const infNFe = nfeRoot?.infNFe;
                       if (!infNFe) {
                          details.push({ message: 'NFe inválida ou sem infNFe', file: attachmentInfo.filename });
                          continue;
                       }
                       const accessKey = infNFe["@_Id"]?.replace('NFe', '') || 'Desconhecida';
                       
                       // Verifica duplicidade
                       const { data: existing } = await supabase.from('invoices_nfe').select('id').eq('chave_acesso', accessKey).maybeSingle();
                       if (existing) {
                         details.push({ message: `NFe já importada: ${accessKey}` });
                         continue;
                       }

                     // Extract complete NFe Data
                     const ide = nfeRoot.infNFe.ide;
                     const dest = nfeRoot.infNFe.dest;
                     const emit = nfeRoot.infNFe.emit;
                     const enderDest = dest?.enderDest;
                     const transp = nfeRoot.infNFe.transp;
                     const transporta = transp?.transporta;
                     const total = nfeRoot.infNFe.total?.ICMSTot;
                     const vol = transp?.vol;
                     
                     const nNF = String(ide?.nNF || '0');
                     const serie = String(ide?.serie || '0');
                     const dhEmi = ide?.dhEmi || new Date().toISOString();
                     const natOp = String(ide?.natOp || '');
                     
                     const totalValue = parseFloat(total?.vNF || '0');
                     const icmsValue = parseFloat(total?.vICMS || '0') + parseFloat(total?.vST || '0');
                     const weight = parseFloat(vol?.pesoB || '0');
                     const volumes = parseInt(vol?.qVol || '1');
                     
                     const customer = {
                       name: String(dest?.xNome || 'Desconhecido'),
                       cnpj: String(dest?.CNPJ || dest?.CPF || '00000000000000'),
                       stateRegistration: String(dest?.IE || ''),
                       address: String(enderDest?.xLgr || ''),
                       number: String(enderDest?.nro || ''),
                       complement: String(enderDest?.xCpl || ''),
                       neighborhood: String(enderDest?.xBairro || ''),
                       city: String(enderDest?.xMun || ''),
                       state: String(enderDest?.UF || ''),
                       zipCode: String(enderDest?.CEP || ''),
                       country: String(enderDest?.xPais || 'Brasil'),
                       phone: String(enderDest?.fone || ''),
                       email: String(dest?.email || '')
                     };
                     
                     // Carrier Lookup
                     let carrierId = null;
                     if (transporta && transporta.CNPJ) {
                       const cleanCnpj = String(transporta.CNPJ).replace(/\D/g, '');
                       const { data: foundCarrier } = await supabase
                         .from('carriers')
                         .select('id')
                         .eq('organization_id', estab.organization_id)
                         .like('cnpj', `%${cleanCnpj}%`)
                         .limit(1)
                         .maybeSingle();
                       if (foundCarrier) carrierId = foundCarrier.id;
                     }

                     // Customer Lookup
                     let destinatarioNome = customer.name;
                     if (customer.cnpj) {
                       const cleanCnpj = customer.cnpj.replace(/\D/g, '');
                       const { data: foundPartner } = await supabase
                         .from('business_partners')
                         .select('razao_social')
                         .eq('organization_id', estab.organization_id)
                         .like('cpf_cnpj', `%${cleanCnpj}%`)
                         .limit(1)
                         .maybeSingle();
                       if (foundPartner && foundPartner.razao_social) {
                         destinatarioNome = foundPartner.razao_social;
                       }
                     }

                     // Calculate freights
                     let freightResults: any[] = [];
                     let bestCarrierId = carrierId;
                     let valorFrete = 0;
                     try {
                        freightResults = await calculateBestFreight(
                           customer.city,
                           customer.state,
                           weight,
                           volumes,
                           totalValue,
                           0
                        );
                        
                        // If we didn't have a explicitly defined carrier in the XML, use the cheapest from quotes
                        if (!bestCarrierId && freightResults.length > 0) {
                           bestCarrierId = freightResults[0].carrierId;
                        }
                        
                        // If we have results matching our carrier (explicit or best), use it
                        if (bestCarrierId && freightResults.length > 0) {
                           const matchedResult = freightResults.find((r: any) => r.carrierId === bestCarrierId);
                           if (matchedResult) {
                              valorFrete = matchedResult.totalValue;
                           } else if (!carrierId) {
                               valorFrete = freightResults[0].totalValue;
                           }
                        }
                     } catch (calcErr) {
                         console.error("Auto calculation error:", calcErr);
                     }

                     // Insert NFe
                     const { data: insertedNfe, error: insertError } = await supabase
                       .from('invoices_nfe')
                       .insert({
                         organization_id: estab.organization_id,
                         environment_id: estab.environment_id,
                         establishment_id: estab.id,
                         numero: nNF,
                         serie: serie,
                         chave_acesso: accessKey,
                         data_emissao: dhEmi,
                         natureza_operacao: natOp,
                         modelo: '55',
                         destinatario_cnpj: customer.cnpj,
                         destinatario_nome: destinatarioNome,
                         valor_total: totalValue,
                         valor_produtos: totalValue - icmsValue,
                         valor_icms: icmsValue,
                         peso_total: weight,
                         quantidade_volumes: volumes,
                         cubagem_total: 0,
                         situacao: 'emitida',
                         xml_content: xmlString,
                         carrier_id: bestCarrierId,
                         valor_frete: valorFrete,
                         freight_results: freightResults
                       })
                       .select()
                       .single();

                     if (insertError) {
                       console.error("NFe Insert error:", insertError);
                       details.push({ message: `Erro DB ao inserir NFe ${accessKey}`, error: insertError.message });
                       continue;
                     }

                     const invoiceId = insertedNfe.id;

                     // Insert Customer
                     const { error: custError } = await supabase.from('invoices_nfe_customers').insert({
                       invoice_nfe_id: invoiceId,
                       organization_id: estab.organization_id,
                       environment_id: estab.environment_id,
                       cnpj_cpf: customer.cnpj,
                       razao_social: destinatarioNome,
                       inscricao_estadual: customer.stateRegistration,
                       logradouro: customer.address,
                       numero: customer.number,
                       complemento: customer.complement,
                       bairro: customer.neighborhood,
                       cidade: customer.city,
                       estado: customer.state,
                       cep: customer.zipCode,
                       telefone: customer.phone,
                       email: customer.email
                     });
                     if (custError) {
                       details.push({ message: `Aviso: Falha ao inserir cliente da NFe ${accessKey}`, error: custError.message });
                     }

                     // Insert Products
                     const detNode = nfeRoot.infNFe.det;
                     const detArray = Array.isArray(detNode) ? detNode : (detNode ? [detNode] : []);
                     const productsToInsert = detArray.map((d: any, index: number) => {
                       const prod = d.prod;
                       return {
                         invoice_nfe_id: invoiceId,
                         organization_id: estab.organization_id,
                         environment_id: estab.environment_id,
                         numero_item: parseInt(d["@_nItem"] || String(index + 1)),
                         codigo_produto: String(prod?.cProd || ''),
                         descricao: String(prod?.xProd || ''),
                         quantidade: parseFloat(prod?.qCom || '0'),
                         unidade: String(prod?.uCom || 'UN'),
                         peso: prod?.pesoB ? parseFloat(prod.pesoB) : (detArray.length > 0 ? (weight / detArray.length) : 0),
                         cubagem: 0,
                         valor_unitario: parseFloat(prod?.vUnCom || '0'),
                         valor_total: parseFloat(prod?.vProd || '0'),
                         ncm: String(prod?.NCM || '')
                       };
                     });

                     if (productsToInsert.length > 0) {
                       const { error: prodError } = await supabase.from('invoices_nfe_products').insert(productsToInsert);
                       if (prodError) {
                         details.push({ message: `Aviso: Falha ao inserir produtos da NFe ${accessKey}`, error: prodError.message });
                       }
                     }
                     
                     // Insert Electronic Document
                     const { error: edocError } = await supabase.from('electronic_documents').insert({
                        organization_id: estab.organization_id,
                        environment_id: estab.environment_id,
                        document_type: 'NFe',
                        model: '55',
                        document_number: nNF,
                        series: serie,
                        access_key: accessKey,
                        status: 'authorized',
                        issuer_name: String(emit?.xNome || ''),
                        issuer_document: String(emit?.CNPJ || ''),
                        recipient_name: customer.name,
                        recipient_document: customer.cnpj,
                        total_value: totalValue,
                        icms_value: icmsValue,
                        total_weight: weight,
                        transport_mode: 'Rodoviário',
                        xml_content: xmlString
                     });
                     if (edocError) {
                       details.push({ message: `Aviso: Falha ao inserir doc eletronico NFe ${accessKey}`, error: edocError.message });
                     }

                     totalNfe++;
                     estabNfes++;
                     details.push({ message: `NFe modelo 55 importada com sucesso: ${accessKey}` });
                 }
                 
                 // CTe - Modelo 57
                 else if (modelo === '57' || (cteRoot && cteRoot.infCte)) {
                     const infCte = cteRoot?.infCte;
                     if (!infCte) {
                        details.push({ message: 'CTe inválido ou sem infCte', file: attachmentInfo.filename });
                        continue;
                     }
                     const accessKey = infCte["@_Id"]?.replace('CTe', '') || 'Desconhecida';
                     const nNF = infCte.ide?.nCT || '0';
                     const serie = infCte.ide?.serie || '0';
                     
                     const vTPrest = infCte.vPrest?.vTPrest || infCte.vPrest?.vRec || 0;
                     const xNome = infCte.rem?.xNome || infCte.dest?.xNome || 'Desconhecido';
                     const dhEmi = infCte.ide?.dhEmi || new Date().toISOString();

                     // Extração da Transportadora (Emitente do CT-e)
                     let cteCarrierId = null;
                     if (infCte.emit && infCte.emit.CNPJ) {
                        const emitCnpj = String(infCte.emit.CNPJ).replace(/\D/g, '');
                        const { data: foundCarrier } = await supabase
                          .from('carriers')
                          .select('id')
                          .eq('organization_id', estab.organization_id)
                          .like('cnpj', `%${emitCnpj}%`)
                          .limit(1)
                          .maybeSingle();
                        if (foundCarrier) cteCarrierId = foundCarrier.id;
                     }

                     // Extração de Cidade/UF de Destino
                     const destCity = infCte.dest?.enderDest?.xMun || '';
                     const destState = infCte.dest?.enderDest?.UF || '';
                     const destName = infCte.dest?.xNome || '';
                     const destDoc = infCte.dest?.CNPJ || infCte.dest?.CPF || '';

                     // Extração de Cidade/UF de Origem (Remetente)
                     const origCity = infCte.rem?.enderReme?.xMun || '';
                     const origState = infCte.rem?.enderReme?.UF || '';
                     const origName = infCte.rem?.xNome || '';
                     const origDoc = infCte.rem?.CNPJ || infCte.rem?.CPF || '';

                     // Extração de Peso e Valor da Carga
                     const vCarga = infCte.infCTeNorm?.infCarga?.vCarga || 0;
                     let pesoReal = 0;
                     const infQNode = infCte.infCTeNorm?.infCarga?.infQ;
                     if (infQNode) {
                        const infQArray = Array.isArray(infQNode) ? infQNode : [infQNode];
                        // Procura por PESO BASE CÁLCULO, PESO REAL, ou PESO BRUTO
                        const pesoObj = infQArray.find((q: any) => String(q.tpMed).toUpperCase().includes('PESO') || q.cUnid === '01' || q.cUnid === '00');
                        if (pesoObj) {
                           pesoReal = parseFloat(pesoObj.qCarga || '0');
                        }
                     }

                     // Componentes de Valor
                     let freteValor = 0, fretePeso = 0, seccat = 0, despacho = 0, ademe = 0, pedagio = 0, tas = 0, outrosValores = 0;
                     const compNode = infCte.vPrest?.Comp;
                     const componentes = Array.isArray(compNode) ? compNode : (compNode ? [compNode] : []);
                     
                     componentes.forEach((comp: any) => {
                       const nome = String(comp.xNome || '').toUpperCase();
                       const valor = parseFloat(comp.vComp || '0');
                       if (nome.includes('FRETE VALOR') || nome.includes('AD VALOREM')) freteValor += valor;
                       else if (nome.includes('FRETE PESO') || nome.includes('FRETE-PESO')) fretePeso += valor;
                       else if (nome.includes('SECCAT') || nome.includes('SEC/CAT')) seccat += valor;
                       else if (nome.includes('DESPACHO')) despacho += valor;
                       else if (nome.includes('ADEME') || nome.includes('GRIS')) ademe += valor;
                       else if (nome.includes('PEDAGIO') || nome.includes('PEDÁGIO')) pedagio += valor;
                       else if (nome.includes('TAS') || nome.includes('TX-ADM')) tas += valor;
                       else if (nome.includes('OUTROS VALORES') || nome.includes('OUTROS')) outrosValores += valor;
                     });

                     // ICMS
                     const impNode = infCte.imp;
                     const icmsNode = impNode?.ICMS || impNode?.ICMS00 || impNode?.ICMS20 || impNode?.ICMS45 || impNode?.ICMS60 || impNode?.ICMS90 || impNode?.ICMSOutraUF || impNode?.ICMSSN;
                     const vBC = parseFloat(icmsNode?.vBC || '0');
                     const pICMS = parseFloat(icmsNode?.pICMS || '0');
                     const vICMS = parseFloat(icmsNode?.vICMS || '0');

                     const tpCTe = String(infCte.ide?.tpCTe ?? '0');

                     const { data: existing } = await supabase.from('ctes_complete').select('id').eq('access_key', accessKey).maybeSingle();
                     
                     if (!existing) {
                        const { error: cteInsertError } = await supabase.from('ctes_complete').insert({
                           organization_id: estab.organization_id,
                           environment_id: estab.environment_id,
                           establishment_id: estab.id,
                           carrier_id: cteCarrierId,
                           access_key: accessKey,
                           number: String(nNF),
                           series: String(serie),
                           xml_data: { original: xmlString, parsed: new Date().toISOString(), tpCTe },
                           issue_date: dhEmi,
                           status: 'importado',
                           freight_type: 'Normal',
                           total_value: parseFloat(vTPrest),
                           sender_name: origName,
                           sender_document: origDoc,
                           sender_city: origCity,
                           sender_state: origState,
                           recipient_name: destName,
                           recipient_document: destDoc,
                           recipient_city: destCity,
                           recipient_state: destState,
                           cargo_weight: pesoReal,
                           cargo_weight_for_calculation: pesoReal,
                           cargo_value: parseFloat(vCarga),
                           freight_weight_value: fretePeso,
                           freight_value_value: freteValor,
                           seccat_value: seccat,
                           dispatch_value: despacho,
                           ademe_gris_value: ademe,
                           tas_value: tas,
                           other_tax_value: outrosValores,
                           toll_value: pedagio,
                           icms_rate: pICMS,
                           icms_base: vBC,
                           icms_value: vICMS
                        });
                        if (cteInsertError) {
                           details.push({ message: `Erro DB ao inserir CTe ${accessKey}`, error: cteInsertError.message });
                        } else {
                           
                           // Run freight audit calculation for CT-e
                           if (existing === null || existing === undefined) {
                             const { data: fetchInserted } = await supabase.from('ctes_complete').select('id').eq('access_key', accessKey).maybeSingle();
                             if (fetchInserted) {
                               try {
                                 const calcResult = await calculateCteFreight(fetchInserted.id);
                                 details.push({ 
                                    message: `Status do cálculo CT-e ${accessKey}: ${calcResult.success ? 'Sucesso' : 'Falha'}${calcResult.error ? ' ('+calcResult.error+')' : ''}${calcResult.icmsLog ? ' [Logs: ' + calcResult.icmsLog + ']' : ''}` 
                                 });
                               } catch (calcError: any) {
                                 details.push({ 
                                    message: `Erro Exception no cálculo CT-e ${accessKey}: ${calcError.message}` 
                                 });
                               }
                             }
                           }

                           totalCte++;
                           estabCtes++;
                           details.push({ message: `CTe modelo 57 importado com sucesso: ${accessKey}` });
                        }
                     } else {
                        details.push({ message: `CTe já importado: ${accessKey}` });
                     }
                 } else {
                     details.push({ message: `XML de modelo não suportado ou tag raiz desconhecida. Modelo: ${modelo}`, file: attachmentInfo.filename });
                 }
               }
             }
             
             // Move to processed folder instead of just marking as seen
             try {
               try { await mailClient.mailboxCreate('processados'); } catch (e) { /* ignore if already exists */ }
               await mailClient.messageMove(msg.uid, 'processados', { uid: true });
               await flushLogs('running', `Email UID ${msg.uid} movido para pasta processados.`);
             } catch (moveErr: any) {
               console.warn(`Erro ao mover mensagem UID ${msg.uid}:`, moveErr);
               await flushLogs('running', `Aviso: Falha ao mover email UID ${msg.uid}: ${moveErr.message}. Marcando como lido.`);
               try {
                 await mailClient.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
               } catch (flagErr: any) {
                 console.error('Erro ao marcar como lido:', flagErr);
               }
             }
           } catch (emailError: any) {
             console.error("Erro no email:", emailError);
             await flushLogs('running', `Erro fatal ao processar email ${msg.seq}: ${emailError.message}`);
           }
          }
        } finally {
          if (lock) lock.release();
        }
        await mailClient.logout();
        
        const newEmailConfig = { ...config, lastAutoDownload: new Date().toISOString() };
        estab.metadata.email_config = newEmailConfig;
        await supabase.from('establishments').update({ metadata: estab.metadata }).eq('id', estab.id);

        details.push({
           establishment: estab.razao_social,
           emailsChecked: estabEmailsChecked,
           nfeImported: estabNfes,
           cteImported: estabCtes,
           status: 'success'
        });
      } catch (err: any) {
        details.push({
           establishment: estab.razao_social,
           status: 'error',
           error: err.message
        });
      }
    }

    if (logsTableExists) {
      const { error: updateError } = await supabase.from('xml_auto_import_logs')
        .update({
           status: totalNfe > 0 || totalCte > 0 ? 'success' : 'warning',
           nfe_imported: totalNfe,
           cte_imported: totalCte,
           total_processed: totalNfe + totalCte,
           emails_checked: emailsChecked,
           details: details,
           error_message: null
        })
        .eq('id', logId);
        
      if (updateError) {
         console.error("Failed to update final log:", updateError);
         details.push({ message: 'Erro ao atualizar log final', error: updateError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, nfeImported: totalNfe, cteImported: totalCte, total: totalNfe + totalCte, logs: details 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (globalError: any) {
    console.error("Global Error:", globalError);
    try {
      if (logsTableExists) {
        await supabase.from('xml_auto_import_logs')
          .update({
             status: 'error',
             error_message: globalError.message,
             details: { error: globalError.stack || globalError.message, logs: details }
          })
          .eq('id', logId);
      }
    } catch (e) { }

    return new Response(JSON.stringify({ success: false, error: globalError.message, logs: details }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
