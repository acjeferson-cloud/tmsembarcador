import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface TaxationGroup {
  id: string;
  organization_id: string;
  carrier_id: string;
  name: string;
  type: string;
  created_at?: string;
  created_by_user_name?: string;
}

export interface TaxationMember {
  id: string;
  group_id: string;
  document: string;
  name?: string;
}

export const taxationService = {
  async getGroupsByCarrier(carrierId: string): Promise<TaxationGroup[]> {
    const { data, error } = await supabase
      .from('taxation_groups')
      .select('*')
      .eq('carrier_id', carrierId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getAllGroups(orgId: string): Promise<TaxationGroup[]> {
    const { data, error } = await supabase
      .from('taxation_groups')
      .select('*, carriers(nome_fantasia, razao_social)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createGroup(data: Partial<TaxationGroup>): Promise<TaxationGroup> {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (!ctx || !ctx.organizationId) {
      throw new Error('Sessão inválida ou contexto não selecionado.');
    }
    await TenantContextHelper.setSessionContext(ctx);

    const { data: result, error } = await supabase
      .from('taxation_groups')
      .insert([{
        ...data,
        organization_id: data.organization_id || ctx.organizationId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteGroup(id: string): Promise<void> {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (ctx) await TenantContextHelper.setSessionContext(ctx);

    const { error } = await supabase
      .from('taxation_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkInsertMembers(members: Partial<TaxationMember>[]): Promise<void> {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (ctx) await TenantContextHelper.setSessionContext(ctx);

    // Process in batches of 5000 to avoid request size limits
    const batchSize = 5000;
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const { error } = await supabase
        .from('taxation_members')
        .insert(batch);
      
      if (error) throw error;
    }
  },
  
  async getMembersCount(groupId: string): Promise<number> {
    const { count, error } = await supabase
      .from('taxation_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
      
    if (error) throw error;
    return count || 0;
  }
};

