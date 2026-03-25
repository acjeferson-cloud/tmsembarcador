import { supabase } from '../lib/supabase';

export interface TenantContext {
  organizationId: string;
  environmentId: string | null;
  establishmentId: string | null;
  userEmail: string;
}

export class TenantContextHelper {
  private static async getUserProfile(userEmail: string) {
    const { data: rawData, error } = await (supabase as any)
      .rpc('get_user_context_for_session', { p_email: userEmail });
      
    const data = rawData as any;

    if (error || !data || !data.success) {
      console.error('Falha ao buscar perfil do usuário via RPC', error || data?.error);
      return null;
    }

    return {
      organization_id: data.organization_id as string,
      environment_id: data.environment_id as string | null,
      supabase_user_id: userEmail
    };
  }

  static isValidUUID(uuid: string | null | undefined): boolean {
    if (!uuid) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  static async getCurrentContext(): Promise<TenantContext | null> {
    try {
      let userEmail: string | null = null;
      const sessionResponse = await supabase?.auth.getUser();
      const user = sessionResponse?.data?.user;

      if (user?.email) {
        userEmail = user.email;
      } else {
        // Fallback para o localStorage cacheado
        const savedUser = localStorage.getItem('tms-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            if (userData?.email) userEmail = userData.email;
          } catch (e) {
            console.warn('Erro ao ler tms-user do localStorage', e);
          }
        }
      }

      if (!userEmail) {
        console.warn('TenantContext: Usuário não autenticado ou sem e-mail.');
        return null;
      }

      const userProfile = await this.getUserProfile(userEmail);

      if (!userProfile) {
        console.warn(`TenantContext: Perfil não encontrado para o e-mail ${userEmail}`);
        return null;
      }

      let organizationId = userProfile.organization_id;
      const selectedOrgId = localStorage.getItem('tms-selected-organization');
      
      if (selectedOrgId && this.isValidUUID(selectedOrgId)) {
        organizationId = selectedOrgId;
      }

      if (!organizationId || !this.isValidUUID(organizationId)) {
        console.warn(`TenantContext: Perfil sem organization_id para o e-mail ${userEmail}`);
        return null;
      }

      let environmentId: string | null = null;

      const selectedEnvironmentId = localStorage.getItem('tms-selected-environment');

      if (selectedEnvironmentId && this.isValidUUID(selectedEnvironmentId)) {
        environmentId = selectedEnvironmentId;
      } else if (userProfile.environment_id && this.isValidUUID(userProfile.environment_id)) {
        environmentId = userProfile.environment_id;
      } else {
        const { data: defaultEnv } = await (supabase as any)
          .from('saas_environments')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('tipo', 'producao')
          .maybeSingle();

        environmentId = defaultEnv?.id || null;
      }

      let establishmentId: string | null = null;
      
      const selectedEstabId = localStorage.getItem('tms-selected-estab-id');
      const currentEstabRaw = localStorage.getItem('tms-current-establishment');
      
      if (selectedEstabId && this.isValidUUID(selectedEstabId)) {
        establishmentId = selectedEstabId;
      } else if (currentEstabRaw) {
        try {
          const parsed = JSON.parse(currentEstabRaw);
          if (parsed.establishment_id && this.isValidUUID(parsed.establishment_id)) {
            establishmentId = parsed.establishment_id;
          }
        } catch (e) {}
      }

      return {
        organizationId,
        environmentId,
        establishmentId,
        userEmail: userEmail as string
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

  static async getEstablishmentId(): Promise<string | null> {
    const context = await this.getCurrentContext();
    return context?.establishmentId || null;
  }

  static async setSessionContext(context: TenantContext): Promise<void> {
    try {
      await (supabase as any).rpc('set_session_context', {
        p_organization_id: context.organizationId,
        p_environment_id: context.environmentId,
        p_user_email: context.userEmail,
        p_establishment_id: context.establishmentId
      });
    } catch (error) {

      throw new Error('Falha ao configurar contexto da sessão');
    }
  }

  static async isSuperAdmin(): Promise<boolean> {
    try {
      const sessionResponse = await supabase?.auth.getUser();
      const user = sessionResponse?.data?.user;

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
      const { data, error } = await (supabase as any)
        .from('saas_organizations')
        .select('id, nome, nome_fantasia, codigo, status')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      return (data || []).map((org: any) => ({
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
      const { data, error } = await (supabase as any)
        .from('saas_environments')
        .select('id, nome, tipo, status')
        .eq('organization_id', organizationId)
        .eq('status', 'ativo')
        .order('tipo', { ascending: true })
        .order('nome');

      if (error) throw error;

      return (data || []).map((env: any) => ({
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

  static async switchContext(organizationId: string, environmentId: string | null, establishmentId: string | null, userEmail: string): Promise<void> {
    try {
      await this.setSessionContext({
        organizationId,
        environmentId,
        establishmentId,
        userEmail
      });

      if (environmentId) {
        localStorage.setItem('tms-selected-environment', environmentId);
      }
      
      if (establishmentId) {
        localStorage.setItem('tms-selected-estab-id', establishmentId);
      }

      localStorage.setItem('tms-selected-organization', organizationId);


    } catch (error) {

      throw error;
    }
  }

  static clearContext(): void {
    localStorage.removeItem('tms-selected-estab-id');
    localStorage.removeItem('tms-selected-environment');
    localStorage.removeItem('tms-selected-organization');
  }
}
