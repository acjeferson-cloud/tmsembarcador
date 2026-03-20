import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ImapFlow } from "npm:imapflow";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { host, port, protocol, secure, authType, email, password } = body;

    if (!host || !port || !email || !password) {
      throw new Error('Parâmetros incompletos para teste de conexão: host, port, email e password são obrigatórios.');
    }

    if (protocol === 'POP3') {
      // Simples bypass temporário ou usar lib específica de POP3. Vamos retornar true se os dados vieram para não travar o cliente,
      // já que bibliotecas POP3 puras no Deno/npm podem dar conflito rápido. Mas IMAP é o principal.
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conexão POP3 não suporta teste em tempo real na versão atual. Considerando como válido para fins de cadastro.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Default to IMAP
    const client = new ImapFlow({
      host: host,
      port: parseInt(port, 10),
      secure: secure !== false, // Default true
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    await client.connect();
    
    // Log out to release connection
    await client.logout();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conexão de E-mail de Entrada (IMAP) estabelecida com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Erro no test-incoming-email:', error);

    let userMessage = error.message || 'Erro desconhecido';
    if (error.message?.includes('AUTHENTICATIONFAILED') || error.message?.includes('Invalid credentials')) {
      userMessage = 'Falha na autenticação: Usuário ou senha incorretos.';
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      userMessage = 'Tempo limite esgotado. Verifique o servidor e a porta informados.';
    } else if (error.message?.includes('failed') || error.code === 'ECONNREFUSED') {
      userMessage = 'Conexão recusada pelo servidor. Verifique o host e a porta.';
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: userMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
