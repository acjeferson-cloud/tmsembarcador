import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('--- [NPS-SCHEDULER] INICIANDO JOB ---');
    
    // Verify Request Auth (Cron jobs use Anon/Service Role Key, UI users use JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn("Unauthorized request attempt to nps-scheduler (No Auth Header)");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // The Supabase API Gateway automatically verifies JWTs unless --no-verify-jwt is used.
    // Since this is just an idempotent scheduler trigger, any valid auth header 
    // is sufficient to proceed.
    const isCronOrAdmin = true;

    const appUrl = Deno.env.get('APP_URL') ?? 'https://embarcador.agely.com.br';

    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('Supabase environment variables not set in Edge Function.');
    }

    // Bypass RLS to execute background job
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // 1. Fetch Environments with Automation ON
    const { data: activeSettings, error: envError } = await supabase
      .from('nps_settings')
      .select('environment_id, automation_active, expiration_days')
      .eq('automation_active', true);

    if (envError) throw envError;
    
    if (!activeSettings || activeSettings.length === 0) {
      console.log("Nenhum ambiente com automação de NPS ativa.");
      return new Response(JSON.stringify({ message: "No active environments." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const activeEnvIds = activeSettings.map(s => s.environment_id);

    // 2. Fetch Pending NPS Dispatches
    const { data: pendingDispatches, error: dispatchError } = await supabase
      .from('nps_dispatches')
      .select('id, invoice_id, environment_id, organization_id, recipient_email, token, invoices_nfe(numero)')
      .in('environment_id', activeEnvIds)
      .eq('status', 'pendente')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50); // Process 50 per execution to avoid timeouts

    if (dispatchError) throw dispatchError;

    if (!pendingDispatches || pendingDispatches.length === 0) {
      console.log("Nenhum NPS pendente no momento para ambientes ativos.");
      return new Response(JSON.stringify({ message: "No pending dispatches." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processando ${pendingDispatches.length} disparos pendentes...`);

    let sentCount = 0;
    let errorCount = 0;

    for (const dispatch of pendingDispatches) {
      try {
        if (!dispatch.recipient_email) {
          throw new Error("Email do destinatario nao encontrado.");
        }

        // Get matching setting logic (e.g. expiration_days)
        const setting = activeSettings.find(s => s.environment_id === dispatch.environment_id);
        const expDays = setting?.expiration_days || 7;

        // Fetch SMTP config for this environment (fallback logic)
        const { data: estabs, error: estabsError } = await supabase
          .from('establishments')
          .select('id')
          .eq('environment_id', dispatch.environment_id);

        if (estabsError || !estabs || estabs.length === 0) {
           throw new Error("Nenhum estabelecimento encontrado para o environment_id.");
        }
        
        const estabIds = estabs.map(e => e.id);

        const { data: smtpConfig, error: smtpError } = await supabase
          .from('email_outgoing_config')
          .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, from_email, ativo')
          .in('establishment_id', estabIds)
          .eq('ativo', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (smtpError || !smtpConfig) {
          throw new Error("SMTP Configuration missing or inactive for this environment.");
        }

        // Create Transporter
        const transporter = nodemailer.createTransport({
          host: smtpConfig.smtp_host,
          port: smtpConfig.smtp_port,
          secure: smtpConfig.smtp_secure,
          auth: {
             user: smtpConfig.smtp_user,
             pass: smtpConfig.smtp_password
          }
        });

        const sendFrom = smtpConfig.from_name 
          ? `"${smtpConfig.from_name}" <${smtpConfig.from_email || smtpConfig.smtp_user}>` 
          : smtpConfig.from_email || smtpConfig.smtp_user;

        const subject = "Como foi sua experiência de entrega?";
        const npsUrl = `${appUrl}/nps-responder/${dispatch.token}`;
        
        // Simple and elegant email template
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb;">Como foi a entrega da sua mercadoria?</h2>
            </div>
            
            <p>Olá,</p>
            <p>A Nota Fiscal <strong>${dispatch.invoices_nfe?.numero || 'referente ao seu pedido'}</strong> foi entregue recentemente.</p>
            <p>Gostaríamos de saber como foi sua experiência com a nossa entrega. Sua avaliação é muito importante para melhorarmos continuamente nossos serviços.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; font-weight: bold;">Em uma escala de 0 a 10, que nota você daria para a entrega?</p>
              
              <div style="display: flex; justify-content: center; gap: 5px; margin-top: 15px;">
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => 
                   `<a href="${npsUrl}?score=${n}" style="display: inline-block; width: 35px; height: 35px; line-height: 35px; background-color: #f3f4f6; color: #1f2937; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #d1d5db;">${n}</a>`
                ).join('')}
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                <span style="float: left;">0 - Muito Ruim</span>
                <span style="float: right;">10 - Excelente</span>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${npsUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Avaliar Agora</a>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Se você não é o responsável por esta avaliação, por favor ignore este email.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: sendFrom,
          to: dispatch.recipient_email,
          subject,
          html
        });

        // Calculate Expiration
        const dispatchedAt = new Date();
        const expiresAt = new Date(dispatchedAt.getTime() + expDays * 24 * 60 * 60 * 1000);

        // Update database success
        await supabase
          .from('nps_dispatches')
          .update({
            status: 'enviado',
            dispatched_at: dispatchedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            error_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', dispatch.id);

        sentCount++;
        console.log(`[SUCESSO] NPS NF ${dispatch.invoices_nfe?.numero} enviado para ${dispatch.recipient_email}`);

      } catch (err) {
        errorCount++;
        console.error(`[ERRO] Falha ao enviar NPS ID ${dispatch.id}:`, err);
        
        // Update database failure
        await supabase
          .from('nps_dispatches')
          .update({
            status: 'erro',
            error_reason: err.message || 'Erro desconhecido',
            updated_at: new Date().toISOString()
          })
          .eq('id', dispatch.id);
      }
    }

    console.log(`--- [NPS-SCHEDULER] CONCLUÍDO. Envios: ${sentCount}. Erros: ${errorCount}. ---`);
    return new Response(JSON.stringify({ 
      success: true, 
      sent: sentCount, 
      errors: errorCount 
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Falha crítica na Edge Function nps-scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
