import { supabase } from './supabase';

/**
 * Configura o contexto da sessão no banco de dados
 * CRÍTICO: Deve ser chamado após login para garantir isolamento multi-tenant
 */
export async function setSessionContext(
  organizationId: string,
  environmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Override with localStorage selection if available
    const selectedOrgId = localStorage.getItem('tms-selected-organization');
    if (selectedOrgId && selectedOrgId !== 'null') {
      organizationId = selectedOrgId;
    }
    
    const selectedEnvId = localStorage.getItem('tms-selected-environment');
    if (selectedEnvId && selectedEnvId !== 'null') {
      environmentId = selectedEnvId;
    }

    console.log('🔐 [sessionContext] Configurando contexto da sessão:', {
      organizationId,
      environmentId
    });

    const { data, error } = await supabase.rpc('set_session_context', {
      p_organization_id: organizationId,
      p_environment_id: environmentId
    });

    if (error) {
      console.error('❌ [sessionContext] Erro ao configurar contexto:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [sessionContext] Contexto configurado com sucesso:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ [sessionContext] Erro ao configurar contexto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém o contexto atual da sessão
 */
export async function getCurrentSessionContext(): Promise<{
  organizationId: string | null;
  environmentId: string | null;
  hasContext: boolean;
}> {
  try {
    const { data, error } = await supabase.rpc('get_current_session_context');

    if (error) {
      console.error('❌ [sessionContext] Erro ao obter contexto:', error);
      return { organizationId: null, environmentId: null, hasContext: false };
    }

    return {
      organizationId: data.organization_id,
      environmentId: data.environment_id,
      hasContext: data.has_context
    };
  } catch (error) {
    console.error('❌ [sessionContext] Erro ao obter contexto:', error);
    return { organizationId: null, environmentId: null, hasContext: false };
  }
}

/**
 * Obtém organization_id e environment_id do usuário pelo email
 */
export async function getUserOrganizationAndEnvironment(email: string): Promise<{
  success: boolean;
  organizationId?: string;
  environmentId?: string;
  userId?: string;
  userName?: string;
  error?: string;
}> {
  try {
    console.log('🔍 [sessionContext] Buscando organização do usuário:', email);

    const { data, error } = await supabase.rpc('get_user_organization_and_environment', {
      p_email: email
    });

    if (error) {
      console.error('❌ [sessionContext] Erro ao buscar organização:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      console.error('❌ [sessionContext] Usuário não encontrado ou inativo:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ [sessionContext] Organização encontrada:', {
      organizationId: data.organization_id,
      environmentId: data.environment_id,
      userId: data.user_id,
      userName: data.user_name
    });

    return {
      success: true,
      organizationId: data.organization_id,
      environmentId: data.environment_id,
      userId: data.user_id,
      userName: data.user_name
    };
  } catch (error) {
    console.error('❌ [sessionContext] Erro ao buscar organização:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Configura o contexto da sessão após login
 * Busca os dados do usuário e configura o contexto automaticamente
 */
export async function setupSessionAfterLogin(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 1. Buscar organization e environment do usuário
    const userOrg = await getUserOrganizationAndEnvironment(email);
    if (!userOrg.success || !userOrg.organizationId || !userOrg.environmentId) {
      return { success: false, error: userOrg.error || 'Dados do usuário não encontrados' };
    }

    // 2. Configurar contexto da sessão
    const result = await setSessionContext(userOrg.organizationId, userOrg.environmentId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [sessionContext] Erro ao configurar sessão após login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
