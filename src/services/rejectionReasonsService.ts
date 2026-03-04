import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

interface RejectionReason {
  id: string;
  codigo: string;
  categoria: string;
  descricao: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const rejectionReasonsService = {
  async getAll(): Promise<RejectionReason[]> {
    try {
      console.log('❌ [REJECTION_REASONS] Início');

      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        console.error('❌ [REJECTION_REASONS] User not found');
        return [];
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id } = userData;

      if (!organization_id || !environment_id) {
        console.error('❌ [REJECTION_REASONS] Missing org/env');
        return [];
      }

      // Buscar dados globais (organization_id NULL e environment_id NULL)
      // OU dados específicos da organização/ambiente
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .or(`and(organization_id.is.null,environment_id.is.null),and(organization_id.eq.${organization_id},environment_id.eq.${environment_id})`)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('❌ [REJECTION_REASONS] Error:', error);
        throw error;
      }

      console.log(`✅ [REJECTION_REASONS] Found: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar motivos de rejeição:', error);
      return [];
    }
  },

  async getById(id: string): Promise<RejectionReason | null> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar motivo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar motivo:', error);
      return null;
    }
  },

  async getByCode(codigo: string): Promise<RejectionReason | null> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar motivo por código:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar motivo por código:', error);
      return null;
    }
  },

  async getByCategory(categoria: string): Promise<RejectionReason[]> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .eq('categoria', categoria)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar motivos por categoria:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar motivos por categoria:', error);
      return [];
    }
  },

  async getActive(): Promise<RejectionReason[]> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .eq('ativo', true)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar motivos ativos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar motivos ativos:', error);
      return [];
    }
  },

  async create(reason: Omit<RejectionReason, 'id' | 'created_at' | 'updated_at'>): Promise<RejectionReason | null> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .insert({
          codigo: reason.codigo,
          categoria: reason.categoria,
          descricao: reason.descricao,
          ativo: reason.ativo !== undefined ? reason.ativo : true,
          created_by: reason.created_by,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar motivo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar motivo:', error);
      throw error;
    }
  },

  async update(id: string, reason: Partial<RejectionReason>): Promise<RejectionReason | null> {
    try {
      const updateData: any = {
        updated_by: reason.updated_by,
      };

      if (reason.codigo !== undefined) updateData.codigo = reason.codigo;
      if (reason.categoria !== undefined) updateData.categoria = reason.categoria;
      if (reason.descricao !== undefined) updateData.descricao = reason.descricao;
      if (reason.ativo !== undefined) updateData.ativo = reason.ativo;

      const { data, error } = await supabase
        .from('rejection_reasons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar motivo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar motivo:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rejection_reasons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir motivo:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir motivo:', error);
      return false;
    }
  },

  async search(searchTerm: string): Promise<RejectionReason[]> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .or(`codigo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar motivos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar motivos:', error);
      return [];
    }
  },

  async getNextCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('codigo')
        .order('codigo', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastCode = parseInt(data[0].codigo);
        const nextCode = lastCode + 1;
        return nextCode.toString().padStart(3, '0');
      }

      return '001';
    } catch (error) {
      console.error('Erro ao obter próximo código:', error);
      return '001';
    }
  },

  async isCodeUnique(codigo: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('rejection_reasons')
        .select('id')
        .eq('codigo', codigo);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      console.error('Erro ao verificar unicidade do código:', error);
      return false;
    }
  },

  async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('categoria')
        .order('categoria', { ascending: true });

      if (error) throw error;

      const categories = Array.from(new Set(data?.map(r => r.categoria) || []));
      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  },

  async getStats() {
    try {
      const reasons = await this.getAll();

      const total = reasons.length;
      const active = reasons.filter(r => r.ativo).length;
      const inactive = total - active;

      const byCategory: Record<string, number> = {};
      reasons.forEach(reason => {
        if (!byCategory[reason.categoria]) {
          byCategory[reason.categoria] = 0;
        }
        byCategory[reason.categoria]++;
      });

      return {
        total,
        active,
        inactive,
        byCategory
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byCategory: {}
      };
    }
  },
};
