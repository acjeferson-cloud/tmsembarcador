import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSim() {
  // Mock org and env
  // I need to use the service role key to query directly, but let's just use the function
  // We can also query orders to see if there are any
  const orgId = 'e2bc281e-84b2-4d2b-b8c7-434f0eeb9b98'; // Replace logic with raw query
  const envId = '666a01ab-1f7c-4866-9ab3-c3cf295fc166'; // Needs real env id ? Maybe bypass RLS with service_role?
  
  // Wait, let's just query one order to get valid org and env:
  const orderResp = await supabase.from('orders').select('organization_id, environment_id').limit(1).single();
  console.log("Found order:", orderResp.data);
  if (!orderResp.data) return;

  const { organization_id, environment_id } = orderResp.data;

  // Let's get carrier IDs
  const carriers = await supabase.from('carriers').select('id, razao_social').eq('status', 'ativo').limit(5);
  const carrierIds = carriers.data.map(c => c.id);

  console.log("Invoking edge function with", {
    startDate: '2025-01-01',
    endDate: '2026-03-25',
    carrierIds,
    organizationId: organization_id,
    environmentId: environment_id
  });

  const { data, error } = await supabase.functions.invoke('simulate-freight-batch', {
    body: {
        startDate: '2025-01-01',
        endDate: '2026-03-25',
        carrierIds,
        organizationId: organization_id,
        environmentId: environment_id
    }
  });

  console.log("Function Error:", error);
  console.log("Function Data:", JSON.stringify(data, null, 2));
}

testSim();
