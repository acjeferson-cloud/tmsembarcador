import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Help function for LGPD Masking
function maskName(name: string | undefined | null): string {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 3) + '***';
  
  const firstName = parts[0];
  const lastNameInitial = parts[parts.length - 1].charAt(0);
  return `${firstName} ${lastNameInitial}***`;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, trackingCode } = await req.json();

    if (!token || !trackingCode || trackingCode.length < 3) {
      return new Response(
        JSON.stringify({ success: false, blocked: true, message: 'Parâmetros inválidos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validar Turnstile
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!secretKey) {
      console.error('Missing TURNSTILE_SECRET_KEY in environment');
      return new Response(
        JSON.stringify({ success: false, blocked: true, message: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });
    const checkResult = await check.json();

    if (!checkResult.success) {
      console.warn('Cloudflare block:', checkResult['error-codes']);
      return new Response(
        JSON.stringify({ success: false, blocked: true, message: 'A validação anti-bot falhou.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch tracking data directly from DB avoiding RLS and large getAll() loops
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

    const searchValue = String(trackingCode).trim().toUpperCase();

    // Buscar Pedido
    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        business_partners (razao_social),
        carriers (razao_social, nome_fantasia)
      `)
      .or(`codigo_rastreio.ilike.%${searchValue}%,numero_pedido.ilike.%${searchValue}%`)
      .limit(1)
      .maybeSingle();

    if (!orderData) {
      return new Response(
        JSON.stringify({ success: false, blocked: false, message: 'Código de rastreamento não encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (orderData) {
      // Data Transfer Object Mapping: Map DB columns back to TS properties expected by UI
      orderData.order_number = orderData.numero_pedido || orderData.order_number;
      orderData.tracking_code = orderData.codigo_rastreio || orderData.tracking_code;
      orderData.customer_name = orderData.business_partners?.razao_social || orderData.customer_name;
      orderData.issue_date = orderData.data_pedido || orderData.issue_date;
      orderData.origin_city = orderData.origem_cidade || orderData.origin_city;
      orderData.origin_state = orderData.origem_estado || orderData.origin_state;
      orderData.destination_city = orderData.destino_cidade || orderData.destination_city;
      orderData.destination_state = orderData.destino_estado || orderData.destination_state;
      orderData.order_value = orderData.valor_mercadoria || orderData.order_value;
      orderData.freight_value = orderData.valor_frete || orderData.freight_value;
      orderData.weight = orderData.peso_bruto || orderData.weight;
      orderData.volume_qty = orderData.quantidade_volumes || orderData.volume_qty;
      
      // Acomodar Carrier_name igual originalmente feito no serviço Local
      if (orderData.carriers) {
        orderData.carrier_name = orderData.carriers.nome_fantasia || orderData.carriers.razao_social || orderData.carrier_name;
      }
    }

    // Buscar Itens do Pedido no BD relacional e sobrescrever json legacy
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id);
      
    if (orderItems && orderItems.length > 0) {
      orderData.items = orderItems.map(item => ({
        id: item.id,
        product_code: item.produto_codigo || item.codigo || '',
        product_description: item.produto_descricao || item.descricao || '',
        quantity: Number(item.quantidade) || 1,
        unit_price: Number(item.valor_unitario) || 0,
        total_price: Number(item.valor_total) || 0
      }));
    } else if (!orderData.items) {
      orderData.items = [];
    }

    // Buscar NF-e
    const { data: invoiceData } = await supabaseAdmin
      .from('invoices_nfe')
      .select('*')
      .eq('order_number', orderData.numero_pedido || orderData.order_number)
      .limit(1)
      .maybeSingle();

    // Produtos da NF-e como fallback
    if (invoiceData && (!orderData.items || orderData.items.length === 0)) {
       const { data: invoiceProducts } = await supabaseAdmin
         .from('invoices_nfe_products')
         .select('*')
         .eq('invoice_nfe_id', invoiceData.id);
         
       if (invoiceProducts && invoiceProducts.length > 0) {
         orderData.items = invoiceProducts.map(p => ({
           id: p.id,
           product_code: p.cProd || p.codigo,
           product_description: p.xProd || p.descricao,
           quantity: Number(p.qCom || p.quantidade) || 1,
           unit_price: Number(p.vUnCom || p.valor_unitario) || 0,
           total_price: Number(p.vProd || p.valor_total) || 0,
         }));
       }
    }

    let pickupData = null;
    let cteData = null;
    let billData = null;

    if (invoiceData) {
      // Buscar Coleta
      let pickupId = null;
      if (invoiceData.id) {
         const { data: p1 } = await supabaseAdmin.from('pickup_invoices').select('pickup_id').eq('invoice_id', invoiceData.id).maybeSingle();
         if (p1) pickupId = p1.pickup_id;
      }
      if (!pickupId && invoiceData.chave_acesso) {
         const { data: p2 } = await supabaseAdmin.from('pickup_invoices').select('pickup_id').eq('access_key', invoiceData.chave_acesso).maybeSingle();
         if (p2) pickupId = p2.pickup_id;
      }
      if (pickupId) {
         const { data: pData } = await supabaseAdmin.from('pickups').select('*').eq('id', pickupId).maybeSingle();
         pickupData = pData;
      }

      // Buscar CTE
      const invNum = invoiceData.number || invoiceData.numero;
      if (invNum) {
        const { data: cData } = await supabaseAdmin
          .from('ctes_complete')
          .select('*')
          .or(`invoice_number.eq.${invNum},numero_nfe.eq.${invNum}`)
          .limit(1)
          .maybeSingle();

        if (cData) {
          cteData = cData;
        } else {
           let cteId = null;
           const { data: ci1 } = await supabaseAdmin.from('ctes_invoices').select('cte_id').eq('number', invNum).maybeSingle();
           if (ci1) cteId = ci1.cte_id;
           else if (invoiceData.chave_acesso) {
              const { data: ci2 } = await supabaseAdmin.from('ctes_invoices').select('cte_id').ilike('observations', `%${invoiceData.chave_acesso}%`).maybeSingle();
              if (ci2) cteId = ci2.cte_id;
           }
           if (cteId) {
             const { data: fallbackCte } = await supabaseAdmin.from('ctes_complete').select('*').eq('id', cteId).maybeSingle();
             cteData = fallbackCte;
           }
        }
      }
    }

    // Buscar Bill
    if (cteData?.id) {
       const { data: bCte } = await supabaseAdmin.from('bill_ctes').select('bill_id').eq('cte_id', cteData.id).maybeSingle();
       if (bCte) {
         const { data: bData } = await supabaseAdmin.from('bills').select('*').eq('id', bCte.bill_id).maybeSingle();
         billData = bData;
       }
    }

    // Mesclar ocorrencias
    let rawOccs: any[] = [];
    if (orderData?.metadata?.occurrences) rawOccs = [...rawOccs, ...orderData.metadata.occurrences];
    if (invoiceData?.metadata?.occurrences) rawOccs = [...rawOccs, ...invoiceData.metadata.occurrences];
    if (cteData?.metadata?.occurrences) rawOccs = [...rawOccs, ...cteData.metadata.occurrences];
    if (pickupData?.metadata?.occurrences) rawOccs = [...rawOccs, ...pickupData.metadata.occurrences];

    let occurrences: any[] = [];
    if (rawOccs.length > 0) {
      const unique = new Map();
      rawOccs.forEach(o => unique.set(o.codigo || o.id, o));
      occurrences = Array.from(unique.values());
    } else if (cteData?.status === 'entregue' || invoiceData?.status === 'entregue' || orderData?.status === 'entregue' || orderData?.status === 'delivered') {
      const d = cteData?.updated_at || invoiceData?.updated_at || orderData?.updated_at;
      occurrences = [
        { codigo: '100', descricao: 'Em rota de entrega', created_at: d },
        { codigo: '001', descricao: 'Entrega realizada', created_at: d }
      ];
    } else if (['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(cteData?.status?.toLowerCase() || '') ||
               ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(invoiceData?.status?.toLowerCase() || '') ||
               ['saiu_entrega', 'saiu_para_entrega', 'saiu p/ entrega', 'out_for_delivery'].includes(orderData?.status?.toLowerCase() || '')) {
      const d = cteData?.updated_at || invoiceData?.updated_at || orderData?.updated_at;
      occurrences = [
        { codigo: '100', descricao: 'Em rota de entrega', created_at: d }
      ];
    }

    // ------------------------------------------------------------
    // LGPD DATA MASKING
    // ------------------------------------------------------------
    const maskAddress = (city?: string, state?: string) => {
       if (city && state) return `${city} - ${state}`;
       if (city) return city;
       if (state) return state;
       return '';
    };

    if (orderData) {
      orderData.customer_name = maskName(orderData.customer_name);
      // Clean up sensitive address data from order
      orderData.destination_street = '';
      orderData.destination_number = '';
      orderData.destination_complement = '';
      orderData.destination_neighborhood = '';
      orderData.destination_zip_code = '';
      orderData.recipient_phone = '';
      // Only leaving destination_city and destination_state which are generic enough
    }

    if (invoiceData) {
      invoiceData.dest_nome = maskName(invoiceData.dest_nome);
      invoiceData.dest_logradouro = '';
      invoiceData.dest_numero = '';
      invoiceData.dest_bairro = '';
      invoiceData.dest_cep = '';
      invoiceData.dest_fone = '';
    }

    if (cteData) {
      cteData.receiver_name = maskName(cteData.receiver_name);
      cteData.receiver_street = '';
      cteData.receiver_number = '';
      cteData.receiver_neighborhood = '';
      cteData.receiver_zip = '';

      // Also sender and expedidor might be masked
      cteData.sender_name = maskName(cteData.sender_name || '');
      cteData.expedidor_name = maskName(cteData.expedidor_name || '');
      cteData.destinatario_name = maskName(cteData.destinatario_name || '');
    }

    const payload = {
      order: orderData,
      invoice: invoiceData,
      pickup: pickupData,
      cte: cteData,
      bill: billData,
      occurrences
    };

    return new Response(
      JSON.stringify({ success: true, data: payload }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exception fetching tracking:', error);
    return new Response(
      JSON.stringify({ success: false, blocked: true, message: 'Internal server error while searching data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
