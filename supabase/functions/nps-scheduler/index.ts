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

    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('Supabase environment variables not set in Edge Function.');
    }

    // Bypass RLS to execute background job
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    const reqBody = await req.json().catch(() => ({}));
    const isManualTrigger = reqBody?.manualTrigger === true;
    const triggerEnvId = reqBody?.environment_id;
    const triggerEstId = reqBody?.establishment_id;
    
    // Define origin URL for the NPS questionnaire (vital for localhost vs prod testing)
    const appUrl = reqBody?.appUrl || Deno.env.get('APP_URL') || 'https://embarcador.agely.com.br';

    // 1. Fetch Establishments Settings (If manual trigger, we fetch the specific establishment regardless of automation ON/OFF)
    let settingsQuery = supabase
      .from('nps_settings')
      .select('environment_id, establishment_id, automation_active, expiration_days');
      
    if (isManualTrigger && triggerEstId) {
      settingsQuery = settingsQuery.eq('establishment_id', triggerEstId);
    } else {
      settingsQuery = settingsQuery.eq('automation_active', true);
    }

    const { data: activeSettings, error: envError } = await settingsQuery;

    if (envError) throw envError;
    
    if (!activeSettings || activeSettings.length === 0) {
      console.log("Nenhum ambiente qualificavel ativo e/ou requisitado na fila de disparos.");
      return new Response(JSON.stringify({ message: "No active environments." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const activeEstIds = activeSettings.map(s => s.establishment_id);

    // 2. Fetch Pending NPS Dispatches
    let dispatchQuery = supabase
      .from('nps_dispatches')
      .select('id, invoice_id, environment_id, organization_id, establishment_id, recipient_email, token, invoices_nfe(numero)')
      .in('establishment_id', activeEstIds)
      .eq('status', 'pendente');
      
    if (!isManualTrigger) {
      dispatchQuery = dispatchQuery.lte('scheduled_for', new Date().toISOString());
    }

    const { data: pendingDispatches, error: dispatchError } = await dispatchQuery.limit(50);

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
        const setting = activeSettings.find(s => s.establishment_id === dispatch.establishment_id);
        const expDays = setting?.expiration_days || 7;

        // Establish the Logo 
        const { data: currentEstab, error: estabError } = await supabase
          .from('establishments')
          .select('id, metadata')
          .eq('id', dispatch.establishment_id)
          .maybeSingle();

        let npsLogo = null;
        if (currentEstab && currentEstab.metadata) {
          npsLogo = currentEstab.metadata.logo_nps_url || currentEstab.metadata.logo_nps_base64;
        }

        // Fetch SMTP config for this specific establishment 
        const { data: smtpConfig, error: smtpError } = await supabase
          .from('email_outgoing_config')
          .select('smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, from_email, ativo')
          .eq('establishment_id', dispatch.establishment_id)
          .eq('ativo', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (smtpError || !smtpConfig) {
          throw new Error("SMTP Configuration missing or inactive for this establishment.");
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
        
        const logoHtml = npsLogo 
          ? `<div style="text-align: center; margin-bottom: 30px;">
               <img src="${npsLogo}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
             </div>`
          : '';

        // Simple and elegant email template
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            ${logoHtml}
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb;">Como foi a entrega da sua mercadoria?</h2>
            </div>
            
            <p>Olá,</p>
            <p>A Nota Fiscal <strong>${dispatch.invoices_nfe?.numero || 'referente ao seu pedido'}</strong> foi entregue recentemente.</p>
            <p>Gostaríamos de saber como foi sua experiência com a nossa entrega. Sua avaliação é muito importante para melhorarmos continuamente nossos serviços.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; font-weight: bold;">Em uma escala de 0 a 10, que nota você daria para a entrega?</p>
              
              <div style="text-align: center; margin-top: 15px; margin-bottom: 25px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                         let bgColor = '#ef4444'; // Red (0-6)
                         let textColor = 'white';
                         if (n >= 7 && n <= 8) {
                           bgColor = '#facc15'; // Yellow (7-8)
                           textColor = '#1f2937';
                         } else if (n >= 9) {
                           bgColor = '#10b981'; // Green (9-10)
                         }
                         return `<a href="${npsUrl}?score=${n}" style="display: inline-block; width: 35px; height: 35px; line-height: 35px; margin: 2px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid rgba(0,0,0,0.1); text-align: center; font-family: Arial, sans-serif;">${n}</a>`;
                      }).join('')}
                    </td>
                  </tr>
                </table>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                <tr>
                  <td align="left" style="font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">0 - Muito Ruim</td>
                  <td align="right" style="font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">10 - Excelente</td>
                </tr>
              </table>
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
