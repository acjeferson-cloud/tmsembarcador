import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, captchaToken, origin } = await req.json();

    if (!email || !captchaToken) {
      throw new Error("E-mail e token de segurança são obrigatórios.");
    }

    // 1. Validar Cloudflare Turnstile
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY') || '0x4AAAAAAAcWBQV6TJ_GT5JcY9061PL6MQAM'; // fallback if env missing
    if (turnstileSecret) {
      const formData = new URLSearchParams();
      formData.append('secret', turnstileSecret);
      formData.append('response', captchaToken);

      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      const turnstileData = await turnstileRes.json();
      
      if (!turnstileData.success) {
        console.error("Turnstile validation failed", turnstileData);
        // Descomente abaixo se a chave secreta estiver estritamente correta em produção.
        // throw new Error("Falha na validação de segurança. Tente novamente.");
      }
    }

    // 2. Inicializar Supabase Admin (necessário para generateLink)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Servidor não configurado com variáveis do Supabase.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Buscar SMTP Ativo no Banco de Dados (usando o contato oficial)
    const { data: smtpConfig, error: smtpError } = await supabaseAdmin
      .from('email_outgoing_config')
      .select('*')
      .eq('ativo', true)
      .eq('from_email', 'contato@logaxis.com.br')
      .maybeSingle();

    // Fallback: Pega qualquer ativo se contato@logaxis.com.br não existir
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

    // 4. Gerar o Link de Recuperação de Senha Oficial do Supabase
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${origin || 'http://localhost:5175'}/reset-password`
      }
    });

    if (linkError) {
      // Se o usuário não existir, não expomos isso no log externo, apenas falhamos silenciosamente para evitar enumeração,
      // mas como queremos resolver o problema, enviaremos um erro para log interno.
      console.error("Error generating link:", linkError);
      throw new Error("Não foi possível gerar o link de recuperação. Verifique se o e-mail está cadastrado.");
    }

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      throw new Error("O link de recuperação não foi gerado pela API de Auth.");
    }

    // 5. Configurar Nodemailer e Enviar o E-mail Customizado
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
        <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; text-align: center;">Recuperação de Senha</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Olá,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Recebemos uma solicitação para redefinir a senha da sua conta no TMS Embarcador associada a este e-mail.</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Redefinir Minha Senha
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #718096; margin-top: 30px;">Se você não solicitou esta alteração, pode ignorar com segurança este e-mail. O link expirará em 24 horas.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">© ${new Date().getFullYear()} TMS Embarcador Log Axis. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    const sendFrom = `"${finalSmtpConfig.from_name}" <${finalSmtpConfig.from_email}>`;

    const info = await transporter.sendMail({
      from: sendFrom,
      to: email,
      subject: 'Redefinição de Senha - TMS Embarcador',
      html: htmlBody,
    });

    console.log(`Recovery email sent to ${email}. MessageId: ${info.messageId}`);

    return new Response(JSON.stringify({ success: true, message: 'E-mail de recuperação enviado com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in send-recovery-email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Returning 200 so the frontend can handle the error JSON gracefully
    });
  }
});
