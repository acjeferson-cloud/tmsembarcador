// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface ERPConnectionPayload {
  endpointSystem: string;
  port: number | string;
  username: string;
  password?: string;
  companyDb: string;
}

Deno.serve(async (req) => {
  // Configuração CORS (Preflight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: ERPConnectionPayload = await req.json();
    const { endpointSystem, port, username, password, companyDb } = payload;

    if (!endpointSystem || !username || !companyDb) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros de conexão ausentes na requisição.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Sanitização e Construção da Base URL do SAP Service Layer
    let cleanEndpoint = endpointSystem.trim().replace(/\/$/, '');
    let serviceLayerUrl = cleanEndpoint;
    
    // Injeta porta se o usuário não enviou formatado "https://ip:50000"
    if (port && !cleanEndpoint.includes(`:${port}`)) {
      try {
        const urlParts = new URL(cleanEndpoint);
        urlParts.port = port.toString();
        serviceLayerUrl = urlParts.toString().replace(/\/$/, '');
      } catch (e) {
        // Se a url for inválida ou IP puro, monta manualmente
        serviceLayerUrl = `${cleanEndpoint}:${port}`;
      }
    }
    
    // Garante o sufixo obrigatório da API
    if (!serviceLayerUrl.endsWith('/b1s/v1')) {
      serviceLayerUrl = `${serviceLayerUrl}/b1s/v1`;
    }

    // Garante protocolo https (SAP exige por padrão)
    if (!serviceLayerUrl.startsWith('http')) {
      serviceLayerUrl = `https://${serviceLayerUrl}`;
    }

    // 2. Dispara requisição HTTP com Timeout Forçado para não prender a thread
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s cravado

    try {
      console.log(`Testando conexão SAP via Service Layer em: ${serviceLayerUrl}/Login`);
      
      const loginResponse = await fetch(`${serviceLayerUrl}/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          CompanyDB: companyDb,
          UserName: username,
          Password: password || ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Lê o JSON de erro em caso de status != 2xx
      if (!loginResponse.ok) {
        let errorData;
        try {
          errorData = await loginResponse.json();
        } catch (e) {
          errorData = null;
        }

        const statusCode = loginResponse.status;
        const sapErrorMsg = errorData?.error?.message?.value || '';

        if (statusCode === 401) {
          return new Response(
            JSON.stringify({ success: false, error: 'Falha de Autenticação: O Usuário ou a Password informada estão incorretos.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (sapErrorMsg.toLowerCase().includes('database') || sapErrorMsg.toLowerCase().includes('company')) {
          return new Response(
            JSON.stringify({ success: false, error: `Banco de Dados não encontrado: A instância "${companyDb}" informada não existe no servidor.` }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: false, error: `Falha na conexão SAP. Código do Servidor: ${statusCode}. Detalhe: ${sapErrorMsg || loginResponse.statusText}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sucesso total
      return new Response(
        JSON.stringify({ success: true, message: 'Conexão estabelecida com sucesso pelo SAP Business One.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Timeout (10s): Não foi possível alcançar o IP/Porta do servidor SAP. Verifique se o Endpoint precisa de VPN, ou se a porta está bloqueada por Firewall externo.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Erro general de DNS/Rede
      return new Response(
        JSON.stringify({ success: false, error: `Falha de DNS/Rede ou SSL ao conectar no IP do SAP: ${fetchError.message}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (globalError: any) {
    return new Response(
      JSON.stringify({ success: false, error: `Erro na Edge Function: ${globalError.message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
