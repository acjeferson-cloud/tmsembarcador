import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payloadBody = await req.json();
    const { partnerId, type, partnerName, orgId } = payloadBody;

    if (!partnerId || !type || !partnerName || !orgId) {
      throw new Error("Missing required fields: partnerId, type, partnerName, or orgId");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Utilizando Admin Client (TMS utiliza auth custom via RPC, então bypassamos RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check Cache (Valid for 24h)
    const { data: cached } = await supabase
      .from('ai_insights_cache')
      .select('insight_text, created_at')
      .eq('partner_id', partnerId)
      .eq('type', type)
      .eq('organization_id', orgId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ insight: cached.insight_text, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch OpenAI Config for Tenant
    const { data: openAiConfig } = await supabase
      .from('openai_config')
      .select('api_key, modelo, temperatura, max_tokens, ativo')
      .eq('organization_id', orgId)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!openAiConfig || !openAiConfig.api_key) {
      throw new Error("OpenAI Config is missing or inactive for this organization");
    }

    const openaiKey = openAiConfig.api_key;
    const openaiModel = openAiConfig.modelo || "gpt-3.5-turbo";
    // We enforce 0.2 temperature rather than config.temperature to ensure strict formatting
    const openaiTemperature = 0.2; 

    let kpis: Record<string, number> = {};
    let systemPrompt = "";

    if (type === 'carrier') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: invoices } = await supabase.from('invoices')
        .select('id, status, delivery_date, estimated_delivery_date')
        .eq('carrier_id', partnerId)
        .gte('created_at', thirtyDaysAgo);

      const invList = invoices || [];
      const totalDeliveries = invList.filter(i => ['concluido', 'entregue'].includes(i.status?.toLowerCase())).length;
      const inTransit = invList.filter(i => i.status === 'em_transito').length;
      
      const todayString = new Date().toISOString().split('T')[0];
      const deliveredToday = invList.filter(i => i.delivery_date && i.delivery_date.startsWith(todayString)).length;
      
      const delayed = invList.filter(i => {
        if (i.delivery_date && i.estimated_delivery_date) {
          return new Date(i.delivery_date) > new Date(i.estimated_delivery_date);
        }
        if (!i.delivery_date && i.estimated_delivery_date) {
          return new Date() > new Date(i.estimated_delivery_date);
        }
        return false;
      }).length;

      const { count: awaitingPickup } = await supabase.from('pickups')
        .select('id', { count: 'exact', head: true })
        .eq('carrier_id', partnerId)
        .in('status', ['pendente', 'agendada']);

      const totalD = totalDeliveries || 1;
      const punctualityRate = (((totalD - delayed) / totalD) * 100).toFixed(1);

      kpis = {
        total_deliveries: totalDeliveries,
        in_transit: inTransit,
        delivered_today: deliveredToday,
        delayed,
        awaiting_pickup: awaitingPickup || 0,
        punctuality_rate: parseFloat(punctualityRate)
      };

      systemPrompt = `Você é um analista de logística sênior de um TMS.
Sua tarefa é ler um JSON de KPIs de um Transportador (Últimos 30 dias) e gerar um Insight focado em performance.
REGRAS OBRIGATÓRIAS:
1. Siga EXATAMENTE esta estrutura com os emojis indicados:
📊 ANÁLISE DE DESEMPENHO - {Nome}

🎯 Resumo Executivo:
[Resumo em até 3 linhas]

✅ Pontos Fortes:
• [Ponto forte 1 - cite números]
• [Ponto forte 2 - cite números]

⚠️ Pontos de Atenção:
• [Ponto 1]
• [Ponto 2]

📈 Recomendações:
1. [Rec 1]
2. [Rec 2]
3. [Rec 3]
4. [Rec 4]

💡 Tendência:
[Parágrafo único]

2. Baseie TUDO apenas nos KPIs fornecidos. Não invente dados fora do Payload.
3. Se punctuality_rate >= 90%, valorize. Se delayed > 10% do total ou awaiting_pickup alto, concentre o alerta e recomendações nisso.
4. Nunca faça saudações. Traga os dados puramente de forma técnica.`;

    } else if (type === 'business_partner') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { count: totalOrders } = await supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .or(`sender_id.eq.${partnerId},recipient_id.eq.${partnerId}`)
        .gte('created_at', thirtyDaysAgo);

      const { data: invoices } = await supabase.from('invoices')
        .select('id, status')
        .or(`sender_id.eq.${partnerId},recipient_id.eq.${partnerId}`)
        .gte('created_at', thirtyDaysAgo);

      const invList = invoices || [];
      const totalInvoices = invList.length;
      const deliveriesCompleted = invList.filter(i => ['concluido', 'entregue'].includes(i.status?.toLowerCase())).length;
      const deliveriesPending = totalInvoices - deliveriesCompleted;

      const { count: totalPickups } = await supabase.from('pickups')
        .select('id', { count: 'exact', head: true })
        .eq('requester_id', partnerId)
        .gte('created_at', thirtyDaysAgo);

      const { count: totalCtes } = await supabase.from('ctes')
        .select('id', { count: 'exact', head: true })
        .or(`sender_id.eq.${partnerId},recipient_id.eq.${partnerId}`)
        .gte('created_at', thirtyDaysAgo);

      const { count: totalBills } = await supabase.from('bills')
        .select('id', { count: 'exact', head: true })
        .eq('business_partner_id', partnerId)
        .gte('created_at', thirtyDaysAgo);

      kpis = {
        total_orders: totalOrders || 0,
        total_invoices: totalInvoices,
        total_pickups: totalPickups || 0,
        total_ctes: totalCtes || 0,
        total_bills: totalBills || 0,
        deliveries_completed: deliveriesCompleted,
        deliveries_pending: deliveriesPending
      };

      systemPrompt = `Você é um analista financeiro e logístico sênior de um TMS.
Sua tarefa é ler um JSON de KPIs de um Parceiro de Negócio/Cliente (Últimos 30 dias) e gerar um Insight focado no relacionamento.
REGRAS OBRIGATÓRIAS:
1. Siga EXATAMENTE esta estrutura com os emojis indicados:
📊 ANÁLISE DE RELACIONAMENTO - {Nome}

🎯 Resumo Executivo:
[Resumo em até 3 linhas]

📈 Indicadores de Desempenho:
• Taxa de conversão: [X]%
• Taxa de conclusão: [X]%
• [Cite métricas de CT-e ou Geração de Frete]

✅ Pontos Fortes:
• [Ponto forte base nos números]
• [Outro ponto forte]

⚠️ Pontos de Atenção:
• [Citar as pendências ou se deliveries_pending for alto]

💡 Recomendações:
1. [Recomendação de negócios 1]
2. [Recomendação de negócios 2]
3. [Recomendação de negócios 3]

📊 Projeção:
[Parágrafo único com a tendência da parceria]

2. Baseie TUDO apenas nos KPIs do JSON.
3. Se deliveries_pending for alto, direcione o aviso para não atrasar as parcerias de recebimento.
4. Nunca mande mensagem "olá", seja estritamente focado nos dados.`;
    }

    const payload = {
      context: `${type}_performance_analysis`,
      partner_name: partnerName,
      period: "Últimos 30 dias",
      kpis
    };

    console.log(`[generate-partner-insight] Calling OpenAI. Model: ${openaiModel}`);

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        temperature: openaiTemperature,
        messages: [
          { role: "system", content: systemPrompt.replace('{Nome}', partnerName) },
          { role: "user", content: JSON.stringify(payload) }
        ]
      })
    });

    if (!openAiResponse.ok) {
      const e = await openAiResponse.text();
      console.error("[generate-partner-insight] OpenAI API Error:", e);
      throw new Error(`OpenAI API error: ${openAiResponse.statusText}`);
    }

    const openAiData = await openAiResponse.json();
    const resultText = openAiData.choices[0].message.content;

    // Salvar Cache de forma simples (UPSERT)
    // Como a constraint unique é (organization_id, partner_id, type), nós buscamos se já existe, se não insere, se existe faz update
    try {
      const { data: existing } = await supabase
        .from('ai_insights_cache')
        .select('id')
        .eq('organization_id', orgId)
        .eq('partner_id', partnerId)
        .eq('type', type)
        .maybeSingle();
      
      if (existing) {
        await supabase.from('ai_insights_cache').update({
          insight_text: resultText,
          created_at: new Date().toISOString()
        }).eq('id', existing.id);
      } else {
        await supabase.from('ai_insights_cache').insert({
          organization_id: orgId,
          partner_id: partnerId,
          type: type,
          insight_text: resultText
        });
      }
    } catch(dbErr) {
      console.error("[generate-partner-insight] Cache insertion error:", dbErr);
      // Fails silently for cache errors to still return the result
    }

    return new Response(JSON.stringify({ insight: resultText, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error(`[generate-partner-insight] Error:`, error.message);
    // Return 200 so supabase-js parses the body instead of throwing a generic FunctionsHttpError
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  }
});
