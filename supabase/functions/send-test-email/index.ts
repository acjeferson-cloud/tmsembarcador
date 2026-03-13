import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";

// CORS headers are mandatory for requests coming from a browser (browser frontend)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Deal with CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, smtp_config } = body;

    // Validate request
    if (!email || !smtp_config) {
      throw new Error('Payload invites "email" and "smtp_config" objects.');
    }

    // Configure Nodemailer transporter based on the configuration from the client
    const transporter = nodemailer.createTransport({
      host: smtp_config.host,
      port: smtp_config.port,
      secure: smtp_config.secure,
      auth: {
        user: smtp_config.auth.user,
        pass: smtp_config.auth.pass,
      },
    });

    const sendFrom = email?.from?.name 
      ? `"${email.from.name}" <${email?.from?.email || smtp_config?.auth?.user}>` 
      : (email?.from?.email || smtp_config?.auth?.user);

    // Attempt to send the email
    const info = await transporter.sendMail({
      from: sendFrom,
      to: email?.to,
      subject: email?.subject,
      html: email?.html,
    });

    console.log(`Email successfully sent to ${email?.to}. MessageId: ${info.messageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'E-mail successfully sent',
        info: info,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error during send-test-email function execution:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred while sending email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
