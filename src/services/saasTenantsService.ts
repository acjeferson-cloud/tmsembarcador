import { supabase } from '../lib/supabase';

export interface SaasPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_users?: number;
  max_establishments?: number;
  max_storage_gb?: number;
  max_api_calls_month?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaasTenant {
  id: string;
  tenant_code: string;
  company_name: string;
  trade_name?: string;
  document?: string;
  plan_id?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial' | 'blocked';
  trial_ends_at?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: any;
  settings?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  plan?: SaasPlan;
}

interface TenantLimit {
  id: string;
  tenant_id: string;
  limit_type: string;
  limit_value: number;
  current_usage: number;
  last_reset_at: string;
}

interface TenantContact {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  is_primary: boolean;
  created_at: string;
}

export const saasTenantsService = {
  // ===== PLANOS =====
  async getPlans(includeInactive = false): Promise<SaasPlan[]> {
    try {
      let query = supabase
        .from('saas_plans')
        .select('*')
        .order('valor_mensal', { ascending: true });

      if (!includeInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) {

        throw error;
      }

      // Mapear colunas em português para interface em inglês
      const plans = (data as any[] || []).map(plan => ({
        id: plan.id,
        name: plan.nome,
        display_name: plan.nome,
        description: plan.descricao,
        price_monthly: parseFloat(plan.valor_mensal || 0),
        price_yearly: parseFloat(plan.valor_mensal || 0) * 12,
        max_users: plan.max_users,
        max_establishments: plan.max_establishments,
        max_storage_gb: -1,
        max_api_calls_month: -1,
        features: [],
        is_active: plan.ativo,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }));

      return plans;
    } catch (error) {

      return [];
    }
  },

  async createPlan(plan: Partial<SaasPlan>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .insert({
          ...plan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updatePlan(id: string, plan: Partial<SaasPlan>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saas_plans')
        .update({
          ...plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deletePlan(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saas_plans')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== TENANTS =====
  async getTenants(): Promise<SaasTenant[]> {
    try {
      const { data, error } = await supabase
        .from('saas_organizations')
        .select(`
          id,
          codigo,
          nome,
          nome_fantasia,
          cnpj,
          email,
          telefone,
          status,
          plan_id,
          created_at,
          updated_at,
          plan:saas_plans(*)
        `)
        .order('codigo', { ascending: false });

      if (error) throw error;

      // Mapear saas_organizations para formato SaasTenant
      const tenants = (data as any[] || []).map(org => ({
        id: org.id,
        tenant_code: org.codigo,
        company_name: org.nome,
        trade_name: org.nome_fantasia || org.nome,
        document: org.cnpj || '',
        plan_id: org.plan_id,
        status: (org.status === 'ativo' ? 'active' : 'inactive') as any,
        contact_email: org.email || '',
        contact_phone: org.telefone || '',
        created_at: org.created_at,
        updated_at: org.updated_at,
        plan: org.plan ? {
          ...org.plan,
          id: org.plan.id,
          name: org.plan.nome,
          display_name: org.plan.nome,
          price_monthly: parseFloat(org.plan.valor_mensal || '0'),
          price_yearly: parseFloat(org.plan.valor_mensal || '0') * 12,
          is_active: org.plan.ativo,
        } : undefined
      }));

      return tenants;
    } catch (error) {

      return [];
    }
  },

  async getTenantById(id: string): Promise<SaasTenant | null> {
    try {
      const { data, error } = await supabase
        .from('saas_organizations')
        .select(`
          id,
          codigo,
          nome,
          nome_fantasia,
          cnpj,
          email,
          telefone,
          status,
          plan_id,
          created_at,
          updated_at,
          plan:saas_plans(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;
      const org = data as any;

      // Mapear saas_organization para formato SaasTenant
      return {
        id: org.id,
        tenant_code: org.codigo,
        company_name: org.nome,
        trade_name: org.nome_fantasia || org.nome,
        document: org.cnpj || '',
        plan_id: org.plan_id,
        status: (org.status === 'ativo' ? 'active' : 'inactive') as any,
        contact_email: org.email || '',
        contact_phone: org.telefone || '',
        created_at: org.created_at,
        updated_at: org.updated_at,
        plan: org.plan ? {
          ...org.plan,
          id: org.plan.id,
          name: org.plan.nome,
          display_name: org.plan.nome,
          price_monthly: parseFloat(org.plan.valor_mensal || '0'),
          price_yearly: parseFloat(org.plan.valor_mensal || '0') * 12,
          is_active: org.plan.ativo,
        } : undefined
      };
    } catch (error) {

      return null;
    }
  },

  async createTenant(tenant: Partial<SaasTenant>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {


      // Mapear SaasTenant para formato saas_organizations
      const orgData = {
        nome: tenant.company_name,
        nome_fantasia: tenant.trade_name || tenant.company_name,
        cnpj: tenant.document || null,
        email: tenant.contact_email || null,
        telefone: tenant.contact_phone || null,
        plan_id: tenant.plan_id || null,
        status: tenant.status === 'active' ? 'ativo' : 'inativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // codigo será gerado automaticamente pelo trigger
      };

      const { data, error } = await supabase
        .from('saas_organizations')
        .insert(orgData)
        .select()
        .single();

      if (error) {

        return { success: false, error: error.message };
      }


      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updateTenant(id: string, tenant: Partial<SaasTenant>): Promise<{ success: boolean; error?: string }> {
    try {


      const orgData: any = {
        updated_at: new Date().toISOString()
      };

      if (tenant.company_name) orgData.nome = tenant.company_name;
      if (tenant.trade_name !== undefined) orgData.nome_fantasia = tenant.trade_name;
      if (tenant.document !== undefined) orgData.cnpj = tenant.document;
      if (tenant.contact_email !== undefined) orgData.email = tenant.contact_email;
      if (tenant.contact_phone !== undefined) orgData.telefone = tenant.contact_phone;
      if (tenant.plan_id) orgData.plan_id = tenant.plan_id;
      if (tenant.status) {
        orgData.status = tenant.status === 'active' ? 'ativo' : 'inativo';
      }

      const { error } = await supabase
        .from('saas_organizations')
        .update(orgData)
        .eq('id', id);

      if (error) {

        return { success: false, error: error.message };
      }


      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deleteTenant(id: string): Promise<{ success: boolean; error?: string }> {
    try {


      // Primeiro deletar ambientes associados
      const { error: envError } = await supabase
        .from('saas_environments')
        .delete()
        .eq('organization_id', id);

      if (envError) {

      }

      // Depois deletar organização
      const { error } = await supabase
        .from('saas_organizations')
        .delete()
        .eq('id', id);

      if (error) {

        return { success: false, error: error.message };
      }


      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== LIMITES =====
  async getTenantLimits(tenantId: string): Promise<TenantLimit[]> {
    try {
      const { data, error } = await supabase
        .from('saas_tenant_limits')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async updateTenantLimit(id: string, limit: Partial<TenantLimit>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saas_tenant_limits')
        .update(limit)
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== CONTATOS =====
  async getTenantContacts(tenantId: string): Promise<TenantContact[]> {
    try {
      const { data, error } = await supabase
        .from('saas_tenant_contacts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async addTenantContact(contact: Partial<TenantContact>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saas_tenant_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async deleteTenantContact(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('saas_tenant_contacts')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
};
