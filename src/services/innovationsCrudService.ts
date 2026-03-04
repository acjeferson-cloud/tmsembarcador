import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

export interface InnovationCrud {
  id: string;
  name: string;
  description: string;
  detailed_description?: string;
  monthly_price: number;
  icon: string;
  category: string;
  is_active: boolean;
  display_order: number;
  organization_id?: string;
  environment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const innovationsCrudService = {
  async getAll(): Promise<InnovationCrud[]> {
    try {
      console.log('💡 [INNOVATIONS] Starting query...');

      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ [INNOVATIONS] Error:', error);
        throw error;
      }

      console.log(`✅ [INNOVATIONS] Found: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar inovações:', error);
      return [];
    }
  },

  async getById(id: string): Promise<InnovationCrud | null> {
    try {
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar inovação:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar inovação:', error);
      return null;
    }
  },

  async create(innovation: Omit<InnovationCrud, 'id' | 'created_at' | 'updated_at'>): Promise<InnovationCrud | null> {
    try {
      const { data, error } = await supabase
        .from('innovations')
        .insert({
          name: innovation.name,
          description: innovation.description,
          detailed_description: innovation.detailed_description,
          monthly_price: innovation.monthly_price,
          icon: innovation.icon || 'Sparkles',
          category: innovation.category || 'general',
          is_active: innovation.is_active !== undefined ? innovation.is_active : true,
          display_order: innovation.display_order || 0,
          organization_id: innovation.organization_id,
          environment_id: innovation.environment_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar inovação:', error);
        throw error;
      }

      await changeLogsService.logCreate({
        entityType: 'innovations',
        entityId: data.id,
        entityName: data.name,
        userId: 1,
        userName: 'Sistema'
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar inovação:', error);
      throw error;
    }
  },

  async update(id: string, innovation: Partial<InnovationCrud>): Promise<InnovationCrud | null> {
    try {
      const oldData = await this.getById(id);

      const { data, error } = await supabase
        .from('innovations')
        .update({
          name: innovation.name,
          description: innovation.description,
          detailed_description: innovation.detailed_description,
          monthly_price: innovation.monthly_price,
          icon: innovation.icon,
          category: innovation.category,
          is_active: innovation.is_active,
          display_order: innovation.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar inovação:', error);
        throw error;
      }

      if (oldData) {
        await changeLogsService.logMultipleUpdates({
          entityType: 'innovations',
          entityId: id,
          oldData,
          newData: data,
          userId: 1,
          userName: 'Sistema'
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar inovação:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const innovation = await this.getById(id);

      const { error } = await supabase
        .from('innovations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir inovação:', error);
        throw error;
      }

      if (innovation) {
        await changeLogsService.logDelete({
          entityType: 'innovations',
          entityId: id,
          entityName: innovation.name,
          userName: 'Sistema'
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir inovação:', error);
      return false;
    }
  },

  async search(searchTerm: string): Promise<InnovationCrud[]> {
    try {
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar inovações:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar inovações:', error);
      return [];
    }
  },

  async getStats() {
    try {
      const innovations = await this.getAll();

      const total = innovations.length;
      const active = innovations.filter(i => i.is_active).length;
      const inactive = innovations.filter(i => !i.is_active).length;

      const categories = innovations.reduce((acc: Record<string, number>, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        active,
        inactive,
        categories
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        categories: {}
      };
    }
  }
};
