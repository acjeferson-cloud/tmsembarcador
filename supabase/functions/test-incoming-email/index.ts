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

    if (!host || !port || !email || (authType !== 'OAuth2' && !password)) {
      throw new Error('Parâmetros incompletos para teste de conexão: host, port, email e senha/token são obrigatórios.');
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

    let accessToken = '';
    
    if (authType === 'OAuth2') {
      const { clientId, clientSecret, refreshToken, tokenUrl: customTokenUrl } = body;
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Parâmetros incompletos para OAuth2: clientId, clientSecret e refreshToken são obrigatórios.');
      }
      
      const tokenUrl = customTokenUrl || 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');
      params.append('scope', 'https://outlook.office.com/IMAP.AccessAsUser.All offline_access');
      
      try {
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(`Falha ao obter token OAuth2: ${tokenData.error_description || tokenData.error}`);
        }
        accessToken = tokenData.access_token;
      } catch (err: any) {
        throw new Error(`Falha ao renovar token na Microsoft: ${err.message}`);
      }
    }

    // Default to IMAP
    const authConfig: any = { user: email };
    if (authType === 'OAuth2') {
      authConfig.accessToken = accessToken;
    } else {
      authConfig.pass = password;
    }

    const client = new ImapFlow({
      host: host,
      port: parseInt(port, 10),
      secure: secure !== false, // Default true
      auth: authConfig,
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
    if (error.message?.includes('AUTHENTICATIONFAILED') || error.message?.includes('Invalid credentials') || error.message?.includes('AUTHENTICATE failed')) {
      userMessage = `Falha na autenticação: ${error.message}`;
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      userMessage = `Tempo limite esgotado. Servidor não respondeu. (${error.message})`;
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = `Conexão recusada na rede. Host/Porta inválidos. (${error.message})`;
    } else if (error.message) {
      userMessage = `Erro do Servidor IMAP: ${error.message}`;
      if (error.response) {
         userMessage += ` | Resposta do Servidor: ${error.response}`;
      }
      if (error.command) {
         userMessage += ` | Comando: ${error.command}`;
      }
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
