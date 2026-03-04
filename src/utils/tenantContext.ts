import { supabase } from '../lib/supabase';

export interface TenantContext {
  organizationId: string;
  environmentId: string | null;
  userEmail: string;
}

export class TenantContextHelper {
  private static async getUserProfile(userEmail: string) {
    const { data, error } = await supabase
      .from('users')
      .select('organization_id, environment_id, supabase_user_id')
      .eq('email', userEmail)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw new Error('Falha ao buscar perfil do usuário');
    }

    return data;
  }

  static async getCurrentContext(): Promise<TenantContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        console.error('Usuário não autenticado');
        return null;
      }

      const userProfile = await this.getUserProfile(user.email);

      if (!userProfile) {
        console.error('Perfil do usuário não encontrado');
        return null;
      }

      const organizationId = userProfile.organization_id;

      if (!organizationId) {
        console.error('Organization ID não encontrado');
        return null;
      }

      let environmentId: string | null = null;

      const selectedEnvironmentId = localStorage.getItem('tms-selected-environment');

      if (selectedEnvironmentId && selectedEnvironmentId !== 'null') {
        environmentId = selectedEnvironmentId;
      } else if (userProfile.environment_id) {
        environmentId = userProfile.environment_id;
      } else {
        const { data: defaultEnv } = await supabase
          .from('environments')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('is_default', true)
          .maybeSingle();

        environmentId = defaultEnv?.id || null;
      }

      return {
        organizationId,
        environmentId,
        userEmail: user.email
      };
    } catch (error) {
      console.error('Erro ao obter contexto do tenant:', error);
      return null;
    }
  }

  static async getOrganizationId(): Promise<string | null> {
    const context = await this.getCurrentContext();
    return context?.organizationId || null;
  }

  static async getEnvironmentId(): Promise<string | null> {
    const context = await this.getCurrentContext();
    return context?.environmentId || null;
  }

  static async setSessionContext(context: TenantContext): Promise<void> {
    try {
      await supabase.rpc('set_session_context', {
        p_organization_id: context.organizationId,
        p_environment_id: context.environmentId,
        p_user_email: context.userEmail
      });
    } catch (error) {
      console.error('Erro ao configurar contexto da sessão:', error);
      throw new Error('Falha ao configurar contexto da sessão');
    }
  }

  static async isSuperAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        return false;
      }

      return user.email === 'admin@logaxis.com.br';
    } catch (error) {
      console.error('Erro ao verificar super admin:', error);
      return false;
    }
  }

  static async getAllOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      return [];
    }
  }

  static async getEnvironmentsByOrganization(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('id, name, type, is_active')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ambientes:', error);
      return [];
    }
  }

  static async switchContext(organizationId: string, environmentId: string | null, userEmail: string): Promise<void> {
    try {
      await this.setSessionContext({
        organizationId,
        environmentId,
        userEmail
      });

      if (environmentId) {
        localStorage.setItem('tms-selected-environment', environmentId);
      }

      localStorage.setItem('tms-selected-organization', organizationId);

      console.log('✅ Contexto alterado com sucesso:', {
        organizationId,
        environmentId
      });
    } catch (error) {
      console.error('Erro ao trocar contexto:', error);
      throw error;
    }
  }

  static clearContext(): void {
    localStorage.removeItem('tms-selected-environment');
    localStorage.removeItem('tms-selected-organization');
  }
}
