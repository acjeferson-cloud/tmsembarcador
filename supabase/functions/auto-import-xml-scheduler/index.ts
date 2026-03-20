import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { ImapFlow } from "npm:imapflow";
import { simpleParser } from "npm:mailparser";
import { XMLParser } from "npm:fast-xml-parser";

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

  try {
    const logId = crypto.randomUUID();
    const startTime = new Date().toISOString();
    
    const { data: establishments, error: estabError } = await supabase
      .from('establishments')
      .select('id, organization_id, environment_id, metadata, razao_social');

    if (estabError) throw new Error(`Erro estabelecimentos: ${estabError.message}`);

    const activeConfigs = establishments.filter(e => e.metadata?.email_config?.autoDownloadEnabled === true);
    
    let totalNfe = 0;
    let totalCte = 0;
    let emailsChecked = 0;
    let details: any[] = [];

    for (const estab of activeConfigs) {
      const config = estab.metadata.email_config;
      let estabNfes = 0;
      let estabCtes = 0;
      let estabEmailsChecked = 0;

      try {
        const mailClient = new ImapFlow({
          host: config.host,
          port: parseInt(config.port, 10),
          secure: config.useSSL !== false,
          auth: { user: config.email, pass: config.password },
          logger: false
        });

        await mailClient.connect();
        const lock = await mailClient.getMailboxLock('INBOX');
        
        try {
          const messageGenerator = mailClient.fetch({ unseen: true }, { source: true, flags: true });
          
          for await (let msg of messageGenerator) {
             estabEmailsChecked++;
             emailsChecked++;
             
             const parsed = await simpleParser(msg.source);
             
             for (const attachment of parsed.attachments) {
               if (attachment.filename && attachment.filename.toLowerCase().endsWith('.xml')) {
                 const xmlString = attachment.content.toString('utf8');
                 let xmlObj;
                 try {
                   xmlObj = xmlParser.parse(xmlString);
                 } catch (e) {
                   continue; // Ignora XML inválido
                 }
                 
                 let docType = null;
                 let accessKey = null;
                 let nNF = '0';
                 let serie = '0';
                 
                 // NFe
                 const nfeRoot = xmlObj.nfeProc?.NFe || xmlObj.NFe;
                 if (nfeRoot && nfeRoot.infNFe) {
                     docType = 'NFe';
                     accessKey = nfeRoot.infNFe["@_Id"]?.replace('NFe', '') || 'Desconhecida';
                     nNF = nfeRoot.infNFe.ide?.nNF || '0';
                     serie = nfeRoot.infNFe.ide?.serie || '0';
                     
                     const vNF = nfeRoot.infNFe.total?.ICMSTot?.vNF || 0;
                     const xNome = nfeRoot.infNFe.dest?.xNome || 'Desconhecido';
                     const cnpj = nfeRoot.infNFe.dest?.CNPJ || '00000000000000';
                     const dhEmi = nfeRoot.infNFe.ide?.dhEmi || new Date().toISOString();

                     // Verifica duplicidade usando Service Role Key (by-pass RLS)
                     const { data: existing } = await supabase.from('invoices_nfe').select('id').eq('chave_acesso', accessKey).maybeSingle();
                     
                     if (!existing) {
                        await supabase.from('invoices_nfe').insert({
                           organization_id: estab.organization_id,
                           environment_id: estab.environment_id,
                           establishment_id: estab.id,
                           chave_acesso: accessKey,
                           numero: String(nNF),
                           serie: String(serie),
                           xml_content: xmlString,
                           data_emissao: dhEmi,
                           situacao: 'emitida',
                           valor_total: parseFloat(vNF),
                           destinatario_nome: xNome,
                           destinatario_cnpj: cnpj
                        });
                        totalNfe++;
                        estabNfes++;
                     }
                 }
                 
                 // CTe
                 const cteRoot = xmlObj.cteProc?.CTe || xmlObj.CTe;
                 if (cteRoot && cteRoot.infCte) {
                     docType = 'CTe';
                     accessKey = cteRoot.infCte["@_Id"]?.replace('CTe', '') || 'Desconhecida';
                     nNF = cteRoot.infCte.ide?.nCT || '0';
                     serie = cteRoot.infCte.ide?.serie || '0';
                     
                     const vTPrest = cteRoot.infCte.vPrest?.vTPrest || cteRoot.infCte.vPrest?.vRec || 0;
                     const xNome = cteRoot.infCte.rem?.xNome || cteRoot.infCte.dest?.xNome || 'Desconhecido';
                     const dhEmi = cteRoot.infCte.ide?.dhEmi || new Date().toISOString();

                     const { data: existing } = await supabase.from('ctes_complete').select('id').eq('access_key', accessKey).maybeSingle();
                     
                     if (!existing) {
                        await supabase.from('ctes_complete').insert({
                           organization_id: estab.organization_id,
                           environment_id: estab.environment_id,
                           establishment_id: estab.id,
                           access_key: accessKey,
                           number: String(nNF),
                           series: String(serie),
                           xml_data: { original: xmlString, parsed: new Date().toISOString() },
                           issue_date: dhEmi,
                           status: 'importado',
                           total_value: parseFloat(vTPrest),
                           sender_name: xNome
                        });
                        totalCte++;
                        estabCtes++;
                     }
                 }
               }
             }
             
             await mailClient.messageFlagsAdd(msg.seq, ['\\Seen']);
          }
        } finally {
          lock.release();
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

    await supabase.from('xml_auto_import_logs').insert({
       id: logId,
       execution_time: startTime,
       status: totalNfe > 0 || totalCte > 0 ? 'success' : 'warning',
       nfe_imported: totalNfe,
       cte_imported: totalCte,
       total_processed: totalNfe + totalCte,
       emails_checked: emailsChecked,
       details: details,
       error_message: null
    });

    return new Response(JSON.stringify({ 
      success: true, nfeImported: totalNfe, cteImported: totalCte, total: totalNfe + totalCte 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (globalError: any) {
    await supabase.from('xml_auto_import_logs').insert({
       execution_time: new Date().toISOString(), status: 'error',
       nfe_imported: 0, cte_imported: 0, total_processed: 0, emails_checked: 0,
       details: { error: globalError.message }, error_message: globalError.message
    });
    return new Response(JSON.stringify({ success: false, error: globalError.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
