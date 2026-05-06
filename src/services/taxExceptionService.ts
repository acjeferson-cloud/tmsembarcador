
import { supabase } from '../lib/supabase';

export interface TaxExceptionGroup {
  id: string;
  organization_id: string;
  carrier_id: string;
  name: string;
  type: string;
  created_at?: string;
}

export interface TaxExceptionMember {
  id: string;
  group_id: string;
  document: string;
  name?: string;
}

export const taxExceptionService = {
  async getGroupsByCarrier(carrierId: string): Promise<TaxExceptionGroup[]> {
    const { data, error } = await supabase
      .from('tax_exception_groups')
      .select('*')
      .eq('carrier_id', carrierId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getAllGroups(orgId: string): Promise<TaxExceptionGroup[]> {
    const { data, error } = await supabase
      .from('tax_exception_groups')
      .select('*, carriers(nome_fantasia, razao_social)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createGroup(data: Partial<TaxExceptionGroup>): Promise<TaxExceptionGroup> {
    const { data: result, error } = await supabase
      .from('tax_exception_groups')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('tax_exception_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkInsertMembers(members: Partial<TaxExceptionMember>[]): Promise<void> {
    // Process in batches of 5000 to avoid request size limits
    const batchSize = 5000;
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const { error } = await supabase
        .from('tax_exception_members')
        .insert(batch);
      
      if (error) throw error;
    }
  },
  
  async getMembersCount(groupId: string): Promise<number> {
    const { count, error } = await supabase
      .from('tax_exception_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
      
    if (error) throw error;
    return count || 0;
  }
};

