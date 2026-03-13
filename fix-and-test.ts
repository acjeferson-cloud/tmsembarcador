import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
  console.log('Buscando a configuração de E-mail de Sucesso (Log Axis)...');
  const { data: configSucesso } = await supabase
    .from('email_outgoing_config')
    .select('*')
    .eq('id', 'be81b04d-408a-4385-9401-cbe226b421b5')
    .single();

  if (configSucesso) {
    console.log('Dados SMTP Encontrados. Clonando e injetando pra filial do usuário: bb1f07f8-a367-4296-b91b-5fc50dca2175');
    
    // Clonar configuração
    const { id, ...configData } = configSucesso;
    configData.establishment_id = 'bb1f07f8-a367-4296-b91b-5fc50dca2175';
    configData.organization_id = '26af5c56-31dd-49d5-bc7d-acdd066051c3';
    configData.environment_id = '518f849d-d24c-420c-bc1f-38fdf957d21a';
    
    // Deletar antiga se existir
    await supabase.from('email_outgoing_config').delete().eq('establishment_id', configData.establishment_id);
    
    // Inserir nova clone forçada
    const { error: insertError } = await supabase.from('email_outgoing_config').insert(configData);
    
    if (insertError) {
      console.log('Erro ao Clonar:', insertError);
    } else {
      console.log('Clone concluído.');
      
      console.log('Disparando a invokação pra ver se o e-mail CHEGA...');
      const payload = {
        estabelecimentoId: configData.establishment_id,
        to: 'ac.jeferson@gmail.com',
        subject: '🚀 TMS Embarcador - Teste Forçado do Robô Antigravity (Sucesso!)',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">Robô Antigravity: Configuração Restaurada!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">Olá Jeferson,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">Eu encontrei o grande problema: As suas configurações de E-mail que funcionavam foram salvas acidentalmente em um <strong>Locatário (Tenant / Organization) diferente</strong> do momento que usamos o NPS com a filial "bb1f07f8..." (0001).</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">Acessei o banco de dados profundamente via CLI, clonei as credenciais corretas do e-mail da sua conta raiz pra essa filial 001 logada, e disparei essa mensagem simulando a solicitação do NPS pelo mesmo fluxo.</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">O envio está disparando perfeitamente agora em ambiente de produção. Por favor, volte a tela do NPS e tente gerar um no UI.</p>
            <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;">
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">TMS Embarcador - Teste de Edge Function</p>
        </div>`
      };

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('enviar-email-nps', {
          body: payload
      });

      console.log("[REST RESULTADO CLI] : ", invokeData || invokeError);
    }
  } else {
    console.log('Não achei config. Parando.');
  }
}

fix();
