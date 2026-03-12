import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { estabelecimentoId, to, subject, html } = await req.json();

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

    // Fetch the active email outgoing configuration for this establishment
    const { data: config, error: fetchError } = await supabase
      .from('email_outgoing_configs')
      .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, sender_name, sender_email')
      .eq('establishment_id', estabelecimentoId)
      .eq('ativo', true)
      .single();

    if (fetchError || !config) {
      console.error('Erro ao buscar configuração SMTP no banco de dados:', fetchError);
      throw new Error('Nenhuma configuração SMTP de saída ativa foi encontrada para este estabelecimento.');
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
        pass: config.smtp_password,
      },
    });

    const sendFrom = config.sender_name 
      ? `"${config.sender_name}" <${config.sender_email || config.smtp_user}>` 
      : (config.sender_email || config.smtp_user);

    // Shoot the email
    const info = await transporter.sendMail({
      from: sendFrom,
      to,
      subject,
      html,
    });

    console.log(`NPS E-mail disparado para ${to}. ID da Mensagem: ${info.messageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'E-mail NPS enviado com sucesso!',
        info: info,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Falha de execução na Edge Function enviar-email-nps:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro não monitorado ao despachar e-mail.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
