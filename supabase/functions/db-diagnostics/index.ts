import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Get all logs using Service Role (Bypass RLS)
    const { data: logs, error: logsError } = await supabase
      .from('xml_auto_import_logs')
      .select('*')
      .order('execution_time', { ascending: false });

    // 2. Try getting logs using ANON key to simulate unauthenticated access
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
    const { data: anonLogs, error: anonError } = await anonClient
      .from('xml_auto_import_logs')
      .select('*')
      .limit(5);

    return new Response(JSON.stringify({
      success: true,
      serviceRoleLogsFound: logs?.length || 0,
      anonRoleLogsFound: anonLogs?.length || 0,
      anonError: anonError,
      logsError: logsError,
      first5Logs: logs?.slice(0, 5) || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
