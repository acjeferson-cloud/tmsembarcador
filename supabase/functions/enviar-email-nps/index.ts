import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { estabelecimentoId, to, subject, html } = await req.json();
    console.log('--- [ENVIAR-EMAIL-NPS] INÍCIO DA REQUISIÇÃO ---');
    console.log('Dados recebidos:', { estabelecimentoId, to, subject, htmlPreview: html?.substring(0, 50) });

    if (!estabelecimentoId || !to || !subject || !html) {
      throw new Error('Faltam parâmetros obrigatórios no corpo da requisição (estabelecimentoId, to, subject, html).');
    }
    // Retrieve environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('As variáveis de ambiente do Supabase não estão configuradas na Edge Function.');
    }
    // Initialize Supabase admin client to bypass RLS since we need to read configuration passwords safely
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    // Fetch the email outgoing configuration for this establishment
    let { data: config, error: fetchError } = await supabase
      .from('email_outgoing_config')
      .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, from_email, ativo')
      .eq('establishment_id', estabelecimentoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!config) {
      console.log(`Nenhuma config SMTP na filial logada ${estabelecimentoId}. Buscando configs (mesmo Tenant) de irmãos...`);
      
      const { data: estabData } = await supabase
        .from('establishments')
        .select('environment_id, organization_id')
        .eq('id', estabelecimentoId)
        .maybeSingle();

      if (estabData?.environment_id) {
        const { data: irmaosData } = await supabase
          .from('establishments')
          .select('id')
          .eq('environment_id', estabData.environment_id);
          
        if (irmaosData && irmaosData.length > 0) {
          const idsIrmaos = irmaosData.map((e: any) => e.id);
          
          const resFallback = await supabase
            .from('email_outgoing_config')
            .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, from_email')
            .in('establishment_id', idsIrmaos)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (resFallback.data) {
             config = resFallback.data;
             fetchError = null;
             console.log(`SUCESSO! Edge Function encontrou configuração da filial-irmã.`);
          }
        }
      }
    }

    if (fetchError || !config) {
      console.error('Erro ao buscar configuração SMTP no banco de dados:', fetchError);
      throw new Error(`Nenhuma configuração SMTP de saída ativa foi encontrada para o estabelecimento logado (${estabelecimentoId}). Configure o remetente na aba de E-mail de Saída deste estabelecimento. Detalhes: ${fetchError?.message || 'Não encontrado'}`);
    }
    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
      throw new Error('Encontramos uma configuração SMTP, mas ela está incompleta (Falta host, usuário ou senha).');
    }
    // Construct the Nodemailer transporter using db configuration
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      }
    });
    const sendFrom = config.from_name ? `"${config.from_name}" <${config.from_email || config.smtp_user}>` : config.from_email || config.smtp_user;
    // Shoot the email
    const info = await transporter.sendMail({
      from: sendFrom,
      to,
      subject,
      html
    });
    console.log(`NPS E-mail disparado para ${to}. ID da Mensagem: ${info.messageId}`);
    return new Response(JSON.stringify({
      success: true,
      message: 'E-mail NPS enviado com sucesso!',
      info: info
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Falha de execução na Edge Function enviar-email-nps:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro não monitorado ao despachar e-mail.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
});
