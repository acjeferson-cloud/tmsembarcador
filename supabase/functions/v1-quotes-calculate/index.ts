import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateApiKey, handleApiError } from '../_shared/apiAuthMiddleware.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Trata OPTIONS de pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Apenas aceita POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // 1. O middleware valida o header x-api-key e devolve o cliente do Supabase já injetado com o JWT do Tenant
    const apiContext = await authenticateApiKey(req);
    const { supabase, organizationId } = apiContext;

    // 2. Extrai e valida o corpo da requisição B2B
    const body = await req.json();
    
    if (
      !body.origin?.zipCode || 
      !body.destination?.zipCode || 
      body.invoiceValue === undefined ||
      body.totalWeight === undefined ||
      body.volumes === undefined ||
      body.cubicMeters === undefined ||
      !body.businessPartner
    ) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido. Certifique-se de enviar origin.zipCode, destination.zipCode, businessPartner, invoiceValue, totalWeight, volumes e cubicMeters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Executa a procedure no banco de dados. 
    // NOTA: Como o 'supabase' client tem o JWT do tenant injetado, o RLS fará com que essa query
    // só encontre as tabelas de frete da organizationId atual. É 100% isolado.
    const { data: quotes, error } = await supabase.rpc('calculate_freight_b2b', {
      p_origin_zip: body.origin.zipCode,
      p_dest_zip: body.destination.zipCode,
      p_business_partner: body.businessPartner,
      p_value: body.invoiceValue,
      p_weight: body.totalWeight,
      p_volumes: body.volumes,
      p_cubic_meters: body.cubicMeters,
      p_org_id: organizationId // Pode passar opcionalmente se a procedure quiser, mas o RLS já isola.
    });

    if (error) throw error;

    // 4. Retorna no contrato OpenAPI acordado
    const quoteId = crypto.randomUUID(); // Gerar um ID rastreável
    
    // (Opcional) Salvar log no histórico...
    // await supabase.from('freight_quotes_history').insert({ id: quoteId, ... })

    return new Response(
      JSON.stringify({
        quoteId,
        options: quotes || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return handleApiError(error);
  }
})
