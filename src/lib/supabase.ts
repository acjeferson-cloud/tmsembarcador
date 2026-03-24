import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''



let supabase: ReturnType<typeof createClient> | null = null

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables not found. Running in offline mode.')
  } else {

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })

  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
}

if (!supabase) {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Cache do contexto de sessão
interface SessionContextCache {
  orgId: string;
  envId: string;
  email: string;
  timestamp: number;
  lastVerified: number;
}

let sessionContextCache: SessionContextCache | null = null;
let contextConfigPromise: Promise<void> | null = null;
let isConfiguringContext = false;

// Helper para verificar se o contexto está configurado no banco
async function verifySessionContext(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc('verify_session_context');

    if (error) {
      console.warn('⚠️ Erro ao verificar contexto:', error);
      return false;
    }

    const isValid = data?.is_valid === true;

    if (!isValid) {
      // NOTA: Devido ao connection pooling do Supabase, é normal o contexto
      // ser perdido entre requisições. O heartbeat reconfigura automaticamente.
      sessionContextCache = null; // Invalidar cache
    }

    return isValid;
  } catch (error) {
    console.error('❌ Falha ao verificar contexto:', error);
    return false;
  }
}

// Helper para configurar o contexto da sessão com retry
async function configureSessionContext(retryCount: number = 0): Promise<void> {
  if (!supabase || isConfiguringContext) return;

  isConfiguringContext = true;

  try {
    // Buscar dados do usuário do localStorage
    const savedUser = localStorage.getItem('tms-user');
    if (!savedUser) {
      isConfiguringContext = false;
      return;
    }

    const userData = JSON.parse(savedUser);
    const userEmail = userData.email;
    if (!userEmail) {
      isConfiguringContext = false;
      return;
    }

    // Verificar se já temos contexto em cache válido (menos de 5 minutos)
    const now = Date.now();
    if (sessionContextCache &&
        sessionContextCache.email === userEmail &&
        now - sessionContextCache.timestamp < 5 * 60 * 1000) {

      // Verificar no banco a cada 30 segundos
      if (now - sessionContextCache.lastVerified > 30 * 1000) {
        const isValid = await verifySessionContext();
        if (isValid) {
          sessionContextCache.lastVerified = now;
          isConfiguringContext = false;
          return;
        }
        // Se não for válido, continua para reconfigurar
      } else {
        isConfiguringContext = false;
        return;
      }
    }

    // Buscar organization_id e environment_id do banco usando RPC (bypassa RLS)
    const { data: contextData, error } = await supabase
      .rpc('get_user_context_for_session', { p_email: userEmail });

    if (error) {
      throw new Error(`Erro ao buscar contexto do usuário: ${error.message}`);
    }

    if (!contextData || !contextData.success) {
      console.warn('⚠️ Não foi possível obter contexto do usuário:', contextData?.error || 'dados incompletos');
      console.warn('⚠️ Dados retornados:', contextData);
      isConfiguringContext = false;
      return;
    }

    const dbUser = {
      organization_id: contextData.organization_id,
      environment_id: contextData.environment_id
    };

    // Override with localStorage selection if available
    const selectedOrgId = localStorage.getItem('tms-selected-organization');
    if (selectedOrgId && selectedOrgId !== 'null') {
      dbUser.organization_id = selectedOrgId;
    }
    
    const selectedEnvId = localStorage.getItem('tms-selected-environment');
    if (selectedEnvId && selectedEnvId !== 'null') {
      dbUser.environment_id = selectedEnvId;
    }

    if (!dbUser.organization_id || !dbUser.environment_id) {
      console.warn('⚠️ Contexto retornado sem organization_id ou environment_id');
      isConfiguringContext = false;
      return;
    }

    // Configurar contexto na sessão PostgreSQL
    const { data: result, error: rpcError } = await supabase.rpc('set_session_context', {
      p_organization_id: dbUser.organization_id,
      p_environment_id: dbUser.environment_id,
      p_user_email: userEmail
    });

    if (rpcError) {
      throw new Error(`Erro ao configurar contexto: ${rpcError.message}`);
    }

    if (result?.success !== true) {
      throw new Error(`Configuração retornou falha: ${result?.error || 'unknown'}`);
    }

    // Log apenas se for primeira configuração (cache estava null)
    const wasFirstConfig = !sessionContextCache;

    // Atualizar cache
    sessionContextCache = {
      orgId: dbUser.organization_id,
      envId: dbUser.environment_id,
      email: userEmail,
      timestamp: now,
      lastVerified: now
    };


  } catch (error) {
    console.error('❌ Erro ao configurar contexto:', error);

    // Tentar novamente até 3 vezes com delay exponencial
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s

      await new Promise(resolve => setTimeout(resolve, delay));
      isConfiguringContext = false;
      return configureSessionContext(retryCount + 1);
    }

    console.error('❌ Falha ao configurar contexto após 4 tentativas');
  } finally {
    isConfiguringContext = false;
  }
}

// Garantir que o contexto está configurado (usar promise para evitar múltiplas chamadas)
async function ensureSessionContext(): Promise<void> {
  if (!contextConfigPromise) {
    contextConfigPromise = configureSessionContext().finally(() => {
      contextConfigPromise = null;
    });
  }
  return contextConfigPromise;
}

// Exportar supabase diretamente - o heartbeat cuida da manutenção do contexto
export { supabase, ensureSessionContext }

// Heartbeat para manter o contexto vivo e detectar perda de conexão
let heartbeatInterval: any = null;

function startHeartbeat() {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(async () => {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('tms-user');
    if (!savedUser) {
      stopHeartbeat();
      return;
    }

    // Reconfigurar contexto silenciosamente a cada 30 segundos
    // NOTA: Como o Supabase usa connection pooling HTTP, as variáveis de sessão
    // PostgreSQL não persistem entre requisições. Então reconfiguramos sempre
    // de forma silenciosa, sem verificar primeiro.
    try {
      await ensureSessionContext();
    } catch (error) {
      console.error('❌ Erro no heartbeat:', error);
    }
  }, 30000); // 30 segundos
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Reconfigurar contexto quando a janela recebe foco
if (typeof window !== 'undefined') {
  // Listener de foco para revalidar contexto
  window.addEventListener('focus', () => {
    // Sempre verificar contexto quando usuário volta para a aba
    ensureSessionContext().catch(err => {
      console.error('❌ Erro ao reconfigurar contexto no focus:', err);
    });
  });

  // Listener para quando usuário loga
  window.addEventListener('user-logged-in', () => {
    sessionContextCache = null; // Limpar cache
    startHeartbeat();
    ensureSessionContext().catch(err => {
      console.error('❌ Erro ao configurar contexto após login:', err);
    });
  });

  // Listener para quando usuário desloga
  window.addEventListener('user-logged-out', () => {
    stopHeartbeat();
    sessionContextCache = null;
  });

  // Configurar contexto assim que o módulo for carregado
  setTimeout(() => {
    const savedUser = localStorage.getItem('tms-user');
    if (savedUser) {
      startHeartbeat();
      ensureSessionContext().catch(err => {

      });
    }
  }, 500);
}

// Database types
interface City {
  id: number
  name: string
  ibge_code: string
  state_id: number
  state_name: string
  state_abbreviation: string
  zip_code_start: string
  zip_code_end: string
  type: 'cidade' | 'distrito' | 'povoado'
  region: string
  created_at?: string
  updated_at?: string
}

interface ZipCodeRange {
  id: number
  city_id: number
  start_zip: string
  end_zip: string
  area?: string
  neighborhood?: string
  created_at?: string
  updated_at?: string
}