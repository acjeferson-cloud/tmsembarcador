import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

export interface ApiContext {
  organizationId: string;
  environmentId: string;
  keyId: string;
  supabase: SupabaseClient;
}

export async function authenticateApiKey(req: Request): Promise<ApiContext> {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    throw new Error('Chave de API não fornecida. Envie o header x-api-key.');
  }

  // 1. Cria um cliente admin para checar a chave no banco
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 2. Busca a chave na tabela de configuração
  const { data: keyConfig, error } = await supabaseAdmin
    .from('api_keys_config')
    .select('id, organization_id, environment_id, key_type, is_active')
    .eq('api_key', apiKey)
    .single();

  if (error || !keyConfig) {
    throw new Error('Chave de API inválida ou não encontrada.');
  }

  if (!keyConfig.is_active) {
    throw new Error('Esta Chave de API está desativada.');
  }

  if (keyConfig.key_type !== 'inbound_api') {
    throw new Error('Esta chave não tem permissão para acessar as APIs B2B de entrada.');
  }

  // 3. Assina um JWT curto na hora, imitando uma sessão de usuário logado
  // O segredo JWT do Supabase é obrigatório
  const jwtSecretStr = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!jwtSecretStr) {
    throw new Error('SUPABASE_JWT_SECRET não configurado na Edge Function.');
  }

  const secret = new TextEncoder().encode(jwtSecretStr);
  const token = await new jose.SignJWT({
    role: 'authenticated', // Permite que a RLS avalie a request
    org_id: keyConfig.organization_id, // Usado pela RLS para isolar o tenant
    env_id: keyConfig.environment_id,
    api_key_id: keyConfig.id
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // Token dura apenas 5 minutos (segurança)
    .sign(secret);

  // 4. Cria o cliente do Supabase *contextualizado* (com o RLS ativado via JWT)
  const tenantSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  // 5. Opcional: Chama uma RPC ou faz update para incrementar o "current_usage"
  // (Pode ser feito de forma assíncrona para não atrasar a requisição)
  supabaseAdmin.rpc('increment_api_key_usage', {
    key_id: keyConfig.id,
    increment_amount: 1
  }).catch(e => console.error('Erro ao incrementar uso:', e));

  return {
    organizationId: keyConfig.organization_id,
    environmentId: keyConfig.environment_id,
    keyId: keyConfig.id,
    supabase: tenantSupabase
  };
}

// Helper para tratar erros padrão no Edge Function
export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro interno da API';
  const status = message.includes('inválida') || message.includes('não fornecida') ? 401 : 500;
  
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
