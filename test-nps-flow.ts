import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // fallback user key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const estabId = 'bb1f07f8-a367-4296-b91b-5fc50dca2175';
  console.log(`[DEBUG] Filial Logada no teste: ${estabId}`);
  
  // 1. Verificar "establishments" para o logado
  const { data: estabReq } = await supabase.from('establishments').select('*').eq('id', estabId).maybeSingle();
  console.log(`[DEBUG] Estabelecimento originário (0001):`, { 
      id: estabReq?.id,
      codigo: estabReq?.codigo,
      environment_id: estabReq?.environment_id,
      organization_id: estabReq?.organization_id
  });

  // 2. Verificar irmãos
  if (estabReq?.environment_id) {
      const { data: irmaos } = await supabase.from('establishments').select('id, codigo').eq('environment_id', estabReq.environment_id);
      console.log(`[DEBUG] Irmãos encontrados no Environment (${estabReq.environment_id}):`, irmaos);
      
      if (irmaos) {
          const ids = irmaos.map(i => i.id);
          const { data: configsIrmaos } = await supabase.from('email_outgoing_config').select('*').in('establishment_id', ids);
          console.log(`[DEBUG] Configs de E-mail nos irmãos:`, configsIrmaos?.map(c => ({ id: c.id, est_id: c.establishment_id, ativo: c.ativo })));
      }
  }

  // 3. Fallback manual por organization se environment falhar
  if (estabReq?.organization_id) {
      const { data: irmaosOrg } = await supabase.from('establishments').select('id, codigo').eq('organization_id', estabReq.organization_id);
      console.log(`[DEBUG] Irmãos na Organization (${estabReq.organization_id}):`, irmaosOrg);
      
      if (irmaosOrg) {
          const ids = irmaosOrg.map(i => i.id);
          const { data: configsIrmaosOrg } = await supabase.from('email_outgoing_config').select('*').in('establishment_id', ids);
          console.log(`[DEBUG] Configs de E-mail na Organization:`, configsIrmaosOrg?.map(c => ({ id: c.id, est_id: c.establishment_id, ativo: c.ativo })));
      }
  }

  console.log('--- TESTANDO A EDGE FUNCTION ENVIAR-EMAIL-NPS ---');
  
  const payload = {
      estabelecimentoId: estabId,
      to: 'ac.jeferson@gmail.com',
      subject: 'Teste Forçado Via API Local',
      html: '<h1>Teste de Automação</h1><p>Esta é uma prova de vida do enviador de NPS.</p>'
  };

  const { data: invokeData, error: invokeError } = await supabase.functions.invoke('enviar-email-nps', {
      body: payload
  });

  console.log("[INVOQUE EDGE FUNCTION] Result:", { invokeData, invokeError });
}

check();
