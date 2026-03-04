import { supabase } from '../lib/supabase';

export interface RestrictedItem {
  id?: string;
  freight_rate_id: string;
  item_code: string;
  item_description: string;
  ncm_code?: string;
  ean_code?: string;
  created_at?: string;
  updated_at?: string;
}

export const restrictedItemsService = {
  async getByFreightRateId(freightRateId: string): Promise<RestrictedItem[]> {
    try {
      const { data, error } = await supabase
        .from('freight_rate_restricted_items')
        .select('*')
        .eq('freight_rate_id', freightRateId)
        .order('item_code');

      if (error) {
        console.error('Erro ao buscar itens restritos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar itens restritos:', error);
      return [];
    }
  },

  async create(item: RestrictedItem): Promise<{ success: boolean; error?: string }> {
    try {
      const organizationId = sessionStorage.getItem('organization_id');
      const environmentId = sessionStorage.getItem('environment_id');

      const { error } = await supabase
        .from('freight_rate_restricted_items')
        .insert({
          freight_rate_id: item.freight_rate_id,
          item_code: item.item_code.trim(),
          item_description: item.item_description.trim(),
          ncm_code: item.ncm_code?.trim() || null,
          ean_code: item.ean_code?.trim() || null,
          organization_id: organizationId,
          environment_id: environmentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao criar item restrito:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar item restrito:', error);
      return { success: false, error: 'Erro ao criar item restrito' };
    }
  },

  async update(id: string, item: Partial<RestrictedItem>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (item.item_code) updateData.item_code = item.item_code.trim();
      if (item.item_description) updateData.item_description = item.item_description.trim();
      if (item.ncm_code !== undefined) updateData.ncm_code = item.ncm_code?.trim() || null;
      if (item.ean_code !== undefined) updateData.ean_code = item.ean_code?.trim() || null;

      const { error } = await supabase
        .from('freight_rate_restricted_items')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar item restrito:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar item restrito:', error);
      return { success: false, error: 'Erro ao atualizar item restrito' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('freight_rate_restricted_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir item restrito:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir item restrito:', error);
      return { success: false, error: 'Erro ao excluir item restrito' };
    }
  },

  async search(freightRateId: string, searchTerm: string): Promise<RestrictedItem[]> {
    try {
      const { data, error } = await supabase
        .from('freight_rate_restricted_items')
        .select('*')
        .eq('freight_rate_id', freightRateId)
        .or(`item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%,ncm_code.ilike.%${searchTerm}%,ean_code.ilike.%${searchTerm}%`)
        .order('item_code');

      if (error) {
        console.error('Erro ao buscar itens restritos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar itens restritos:', error);
      return [];
    }
  },

  async checkRestrictedItem(freightRateId: string, itemCode: string): Promise<RestrictedItem | null> {
    try {
      const { data, error } = await supabase
        .from('freight_rate_restricted_items')
        .select('*')
        .eq('freight_rate_id', freightRateId)
        .eq('item_code', itemCode)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar item restrito:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao verificar item restrito:', error);
      return null;
    }
  },

  async checkRestrictedItems(freightRateId: string, itemCodes: string[]): Promise<RestrictedItem[]> {
    try {
      const { data, error } = await supabase
        .from('freight_rate_restricted_items')
        .select('*')
        .eq('freight_rate_id', freightRateId)
        .in('item_code', itemCodes);

      if (error) {
        console.error('Erro ao verificar itens restritos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao verificar itens restritos:', error);
      return [];
    }
  }
};
