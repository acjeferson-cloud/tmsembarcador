import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pickupId = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'confirm' or 'reject'

    if (!pickupId || !action) {
      return new Response("Parâmetros inválidos. É necessário informar ID e ação.", { status: 400 });
    }

    if (action !== 'confirm' && action !== 'reject') {
      return new Response("Ação inválida. Utilize 'confirm' ou 'reject'.", { status: 400 });
    }

    const newStatus = action === 'confirm' ? 'coleta_confirmada' : 'coleta_recusada';

    const pickupIds = pickupId.split(',');

    // Update pickup status
    const { error } = await supabase
      .from('pickups')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .in('id', pickupIds);

    if (error) {
      console.error("Erro ao atualizar status da coleta:", error);
      return new Response("Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.", { status: 500 });
    }

    const redirectUrl = url.searchParams.get("redirect") || "https://app.logaxis.com.br";
    
    // Redirect to the frontend application route
    return new Response(null, {
      status: 302,
      headers: {
        "Location": `${redirectUrl}/coleta-resposta?status=${action}`
      }
    });
  } catch (error) {
    console.error("Erro interno:", error);
    
    const url = new URL(req.url);
    const redirectUrl = url.searchParams.get("redirect") || "https://app.logaxis.com.br";
    return new Response(null, {
      status: 302,
      headers: {
        "Location": `${redirectUrl}/coleta-resposta?status=error`
      }
    });
  }
});
