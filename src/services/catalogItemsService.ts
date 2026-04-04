import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface CatalogItem {
  id?: string;
  organization_id?: string;
  environment_id?: string;
  item_code: string;
  ean_code?: string;
  item_description: string;
  ncm_code?: string;
  created_at?: string;
  updated_at?: string;
}

export const catalogItemsService = {
  /**
   * Obtém todos os itens do catálogo de forma paginada e com filtro opcional
   */
  async getItems(searchTerm?: string, page: number = 1, pageSize: number = 50): Promise<{ data: CatalogItem[], count: number }> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      
      const isOrgValid = TenantContextHelper.isValidUUID(context?.organizationId);
      const isEnvValid = TenantContextHelper.isValidUUID(context?.environmentId);

      if (!context || !isOrgValid || !isEnvValid) {
        return { data: [], count: 0 };
      }

      let query = (supabase as any)
        .from('catalog_items')
        .select('*', { count: 'exact' })
        .eq('organization_id', context.organizationId)
        .eq('environment_id', context.environmentId);
      
      if (searchTerm) {
        query = query.or(`item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%,ean_code.ilike.%${searchTerm}%,ncm_code.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('item_description', { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      return { data: data || [], count: count || 0 };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Busca itens baseados em autocomplete para o Modal de Itens Restritos
   */
  async searchItems(searchTerm: string): Promise<CatalogItem[]> {
     try {
       const context = await TenantContextHelper.getCurrentContext();
       if (!context || !TenantContextHelper.isValidUUID(context.organizationId) || !TenantContextHelper.isValidUUID(context.environmentId)) {
         return [];
       }
       
       if (!searchTerm || searchTerm.length < 2) return [];

       const { data, error } = await (supabase as any)
         .from('catalog_items')
         .select('id, item_code, item_description, ean_code, ncm_code')
         .eq('organization_id', context.organizationId)
         .eq('environment_id', context.environmentId as string)
         .or(`item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%,ean_code.ilike.%${searchTerm}%`)
         .order('item_description', { ascending: true })
         .limit(20);

       if (error) throw error;
       return data || [];
     } catch (error) {
       return [];
     }
  },

  /**
   * Cria um novo item manual no catálogo
   */
  async createItem(item: CatalogItem): Promise<{ data?: CatalogItem, error?: string }> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      if (!context) throw new Error('Contexto do tenant não encontrado');

      const itemToSave = {
        ...item,
        organization_id: context.organizationId,
        environment_id: context.environmentId as string,
      };

      if (!itemToSave.id) {
        delete itemToSave.id;
      }

      const { data, error } = await (supabase as any)
        .from('catalog_items')
        .insert([itemToSave])
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Erro ao criar item' };
    }
  },

  /**
   * Atualiza um item do catálogo
   */
  async updateItem(id: string, updates: Partial<CatalogItem>): Promise<{ data?: CatalogItem, error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('catalog_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Erro ao atualizar item' };
    }
  },

  /**
   * Exclui um item do catálogo
   */
  async deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('catalog_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Este item não pode ser excluído pois PODE estar vinculado a transportadoras/XMLs.' };
    }
  }
};
