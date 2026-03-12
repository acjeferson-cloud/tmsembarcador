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

      throw new Error('Falha ao buscar perfil do usuário');
    }

    return data;
  }

  static async getCurrentContext(): Promise<TenantContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {

        return null;
      }

      const userProfile = await this.getUserProfile(user.email);

      if (!userProfile) {

        return null;
      }

      const organizationId = userProfile.organization_id;

      if (!organizationId) {

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
          .from('saas_environments')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('tipo', 'producao')
          .maybeSingle();

        environmentId = defaultEnv?.id || null;
      }

      return {
        organizationId,
        environmentId,
        userEmail: user.email
      };
    } catch (error) {

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

      return false;
    }
  }

  static async getAllOrganizations() {
    try {
      const { data, error } = await supabase
        .from('saas_organizations')
        .select('id, nome, nome_fantasia, codigo, status')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      return (data || []).map(org => ({
        id: org.id,
        name: org.nome,
        trade_name: org.nome_fantasia || org.nome,
        slug: org.codigo,
        is_active: org.status === 'ativo'
      }));
    } catch (error) {

      return [];
    }
  }

  static async getEnvironmentsByOrganization(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('saas_environments')
        .select('id, nome, tipo, status')
        .eq('organization_id', organizationId)
        .eq('status', 'ativo')
        .order('tipo', { ascending: true })
        .order('nome');

      if (error) throw error;

      return (data || []).map(env => ({
        id: env.id,
        name: env.nome,
        type: env.tipo === 'producao' ? 'production' :
              env.tipo === 'homologacao' ? 'staging' :
              env.tipo === 'teste' ? 'testing' :
              env.tipo === 'desenvolvimento' ? 'development' : 
              env.tipo === 'sandbox' ? 'sandbox' : env.tipo,
        is_active: env.status === 'ativo'
      }));
    } catch (error) {

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


    } catch (error) {

      throw error;
    }
  }

  static clearContext(): void {
    localStorage.removeItem('tms-selected-environment');
    localStorage.removeItem('tms-selected-organization');
  }
}
