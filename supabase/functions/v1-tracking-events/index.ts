import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateApiKey, handleApiError } from '../_shared/apiAuthMiddleware.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // 1. O middleware valida a key, cria o tenant JWT e injeta no Supabase client
    const apiContext = await authenticateApiKey(req);
    const { supabase, organizationId, environmentId } = apiContext;

    // 2. Extrai e valida o corpo da requisição B2B
    const body = await req.json();
    
    if (!body.carrierCnpj || !body.invoiceNumber || !body.statusCode || !body.eventDate) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido. Envie carrierCnpj, invoiceNumber, statusCode e eventDate.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Localiza a nota fiscal (invoices_nfe) usando CNPJ e Número da NF.
    // O RLS automático garante que se a NF for de outro org_id, ela retornará null.
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices_nfe')
      .select('id, cte_id, status')
      .eq('numero', body.invoiceNumber)
      .eq('carrier_cnpj', body.carrierCnpj)
      .maybeSingle();

    if (invoiceError) throw invoiceError;

    if (!invoice) {
      return new Response(
        JSON.stringify({ error: 'Nota fiscal e/ou transportadora não encontradas ou você não tem acesso.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Insere o Tracking Event na nova tabela dedicada.
    const metadata = {
      lat: body.latitude,
      lng: body.longitude,
      notes: body.notes
    };

    const { error: trackingError } = await supabase
      .from('tracking_events')
      .insert({
        organization_id: organizationId,
        environment_id: environmentId,
        invoice_id: invoice.id,
        cte_id: invoice.cte_id, // Pode ser null se a NF ainda não tem CTE
        carrier_cnpj: body.carrierCnpj,
        status_code: body.statusCode,
        event_date: body.eventDate,
        metadata: metadata
      });

    if (trackingError) throw trackingError;

    // 5. Atualiza o status agregado (situacao / status) na invoice_nfe e order, caso seja finalização.
    // Como a lógica do TMSEmbarcador atualiza o metadata->occurrences na order/invoice,
    // o Edge Function idealmente chama uma Procedure PL/pgSQL interna para manter consistência, 
    // ou apenas atualiza o status. Aqui, manteremos simples e direto no status.
    const deliveredStatuses = ['ENTREGUE', 'DELIVERED'];
    if (deliveredStatuses.includes(body.statusCode.toUpperCase())) {
      await supabase
        .from('invoices_nfe')
        .update({ situacao: 'entregue', updated_at: new Date().toISOString() })
        .eq('id', invoice.id);
    }

    // 6. Enfileira evento de Outbound Webhook para notificar o ERP do Embarcador (n8n worker processa dps)
    await supabase.from('outbound_webhooks_queue').insert({
      organization_id: organizationId,
      environment_id: environmentId,
      event_type: 'tracking.updated',
      payload: {
        invoiceId: invoice.id,
        invoiceNumber: body.invoiceNumber,
        newStatus: body.statusCode,
        date: body.eventDate,
        notes: body.notes
      }
    });

    // 7. Retorna 202 Accepted rapidamente para a transportadora
    return new Response(
      JSON.stringify({ message: 'Evento de tracking registrado e processado com sucesso.' }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return handleApiError(error);
  }
})
