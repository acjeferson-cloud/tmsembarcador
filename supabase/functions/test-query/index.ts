import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const nfeId = 'f933bbb2-d044-4bc1-a72c-838a58047b16';

  const { data: nfe } = await supabaseAdmin.from('invoices_nfe').select('environment_id').eq('id', nfeId).single();
  
  const { data: q1, error: e1 } = await supabaseAdmin.from('invoices_nfe_customers').select('*').eq('nfe_id', nfeId).single();
  
  const formattedCnpj = "25.266.685/0029-44";
  const { data: q2, error: e2 } = await supabaseAdmin.from('business_partners').select('id, cpf_cnpj').eq('cpf_cnpj', formattedCnpj);

  const query = `
    SELECT 
        bp.id as partner_id,
        nc.email as nfe_email,
        nc.cnpj_cpf as nfe_cnpj,
        bp.cpf_cnpj as bp_cnpj,
        bp.environment_id as bp_env,
        '${nfe?.environment_id}' as nfe_env
    FROM public.invoices_nfe_customers nc
    LEFT JOIN public.business_partners bp 
        ON REGEXP_REPLACE(bp.cpf_cnpj, '\\D', '', 'g') = REGEXP_REPLACE(nc.cnpj_cpf, '\\D', '', 'g')
    WHERE nc.nfe_id = '${nfeId}'
    LIMIT 1;
  `;

  return new Response(JSON.stringify({ nfe, q1, q2, query }), { headers: { 'Content-Type': 'application/json' } })
})
