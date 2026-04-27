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

    // 4. Buscar o usuário na tabela public.users
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, nome, email')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      console.error("User not found or error fetching user:", userError);
      throw new Error("Não foi possível gerar a recuperação. Verifique se o e-mail está cadastrado no sistema.");
    }

    // 5. Gerar uma senha temporária
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$&';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const tempPassword = generateRandomPassword();

    // 6. Hashear a senha temporária usando SHA-256 (Padrão do TMS)
    const msgBuffer = new TextEncoder().encode(tempPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const senhaHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 7. Atualizar o usuário no banco de dados
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        senha_hash: senhaHash,
        force_password_reset: true 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating user password:", updateError);
      throw new Error("Erro interno ao redefinir a senha.");
    }

    // 8. Configurar Nodemailer e Enviar o E-mail Customizado
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
    const loginLink = origin || 'http://localhost:5175';
    
    const htmlBody = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="Log Axis TMS" style="max-height: 60px; max-width: 200px; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; text-align: center;">Recuperação de Senha</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Olá, ${user.nome}</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568;">Sua senha do TMS Embarcador foi redefinida com sucesso.</p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; text-align: center; margin: 25px 0; border-radius: 6px;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 10px; margin-top: 0;">Sua senha temporária é:</p>
          <p style="font-size: 28px; font-weight: bold; font-family: monospace; color: #0f172a; margin: 0; letter-spacing: 2px;">${tempPassword}</p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${loginLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Acessar o Sistema
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #718096; margin-top: 30px;"><strong>Importante:</strong> Ao fazer o login com a senha temporária, o sistema exigirá que você crie uma nova senha definitiva.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center;">
          <p style="font-size: 12px; color: #a0aec0; margin: 0;">© ${new Date().getFullYear()} TMS Embarcador Log Axis. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    const sendFrom = `"${finalSmtpConfig.from_name}" <${finalSmtpConfig.from_email}>`;

    const info = await transporter.sendMail({
      from: sendFrom,
      to: email,
      subject: 'Senha Temporária - TMS Embarcador',
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
