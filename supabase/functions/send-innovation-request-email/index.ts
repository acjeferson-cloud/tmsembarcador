import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { innovationName, organizationName, userEmail, userName, requestType = 'activation' } = await req.json();

    if (!innovationName || !organizationName) {
      throw new Error("Dados da solicitação incompletos.");
    }

    const typeLabel = requestType === 'deactivation' ? 'Desativação' : 'Ativação';
    const typeLabelLower = requestType === 'deactivation' ? 'desativação' : 'ativação';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Servidor não configurado com variáveis do Supabase.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar SMTP Ativo no Banco de Dados (usando o contato oficial)
    const { data: smtpConfig, error: smtpError } = await supabaseAdmin
      .from('email_outgoing_config')
      .select('*')
      .eq('ativo', true)
      .eq('from_email', 'contato@logaxis.com.br')
      .maybeSingle();

    let finalSmtpConfig = smtpConfig;
    if (!finalSmtpConfig) {
      const { data: anySmtp } = await supabaseAdmin
        .from('email_outgoing_config')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .single();
      finalSmtpConfig = anySmtp;
    }

    if (!finalSmtpConfig) {
      throw new Error("Nenhuma configuração SMTP ativa encontrada no banco de dados.");
    }

    const transporter = nodemailer.createTransport({
      host: finalSmtpConfig.smtp_host,
      port: finalSmtpConfig.smtp_port,
      secure: finalSmtpConfig.smtp_secure,
      auth: {
        user: finalSmtpConfig.smtp_user,
        pass: finalSmtpConfig.smtp_password,
      },
    });

    const logoUrl = 'https://raw.githubusercontent.com/acjeferson-cloud/tmsembarcador/main/public/logo-logaxis.png';
    
    const htmlBody = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="Log Axis TMS" style="max-height: 60px; max-width: 200px; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; text-align: center;">Nova Solicitação de ${typeLabel}</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Olá Jeferson,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">O cliente <strong>${organizationName}</strong> acabou de solicitar a <strong>${typeLabelLower}</strong> do módulo <strong>${innovationName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; margin: 25px 0; border-radius: 6px;">
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;"><strong>Cliente:</strong> ${organizationName}</li>
            <li style="margin-bottom: 10px;"><strong>Módulo Solicitado:</strong> ${innovationName}</li>
            <li style="margin-bottom: 10px;"><strong>Tipo:</strong> ${typeLabel}</li>
            <li style="margin-bottom: 10px;"><strong>Solicitante:</strong> ${userName} (${userEmail})</li>
            <li><strong>Status:</strong> Aguardando Aprovação</li>
          </ul>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #718096; margin-top: 30px;">Acesse o SaaS Admin Console para aprovar ou rejeitar esta solicitação.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">© ${new Date().getFullYear()} TMS Embarcador Log Axis. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    const sendFrom = `"${finalSmtpConfig.from_name}" <${finalSmtpConfig.from_email}>`;

    const info = await transporter.sendMail({
      from: sendFrom,
      to: 'jeferson.costa@logaxis.com.br',
      subject: `Solicitação de ${typeLabel} de Módulo: ${innovationName} - ${organizationName}`,
      html: htmlBody,
    });

    console.log(`Innovation request email sent to jeferson.costa@logaxis.com.br. MessageId: ${info.messageId}`);

    return new Response(JSON.stringify({ success: true, message: 'E-mail de solicitação enviado com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-innovation-request-email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
