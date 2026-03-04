import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

interface Occurrence {
  id: string;
  codigo: string;
  descricao: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const occurrencesService = {
  async getAll(): Promise<Occurrence[]> {
    try {
      console.log('📝 [OCCURRENCES] Início');

      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        console.error('❌ [OCCURRENCES] User not found');
        return [];
      }

      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id } = userData;

      if (!organization_id || !environment_id) {
        console.error('❌ [OCCURRENCES] Missing org/env');
        return [];
      }

      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('❌ [OCCURRENCES] Error:', error);
        throw error;
      }

      console.log(`✅ [OCCURRENCES] Found: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Occurrence | null> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar ocorrência:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar ocorrência:', error);
      return null;
    }
  },

  async getByCode(codigo: string): Promise<Occurrence | null> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar ocorrência por código:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar ocorrência por código:', error);
      return null;
    }
  },

  async create(occurrence: Omit<Occurrence, 'id' | 'created_at' | 'updated_at'>): Promise<Occurrence | null> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .insert({
          codigo: occurrence.codigo,
          descricao: occurrence.descricao,
          created_by: occurrence.created_by,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ocorrência:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error);
      throw error;
    }
  },

  async update(id: string, occurrence: Partial<Occurrence>): Promise<Occurrence | null> {
    try {
      const updateData: any = {
        updated_by: occurrence.updated_by,
      };

      if (occurrence.codigo !== undefined) updateData.codigo = occurrence.codigo;
      if (occurrence.descricao !== undefined) updateData.descricao = occurrence.descricao;

      const { data, error } = await supabase
        .from('occurrences')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ocorrência:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar ocorrência:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('occurrences')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir ocorrência:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir ocorrência:', error);
      return false;
    }
  },

  async search(searchTerm: string): Promise<Occurrence[]> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .or(`codigo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar ocorrências:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      return [];
    }
  },

  async getNextCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
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
        .from('occurrences')
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

  async getStats() {
    try {
      const occurrences = await this.getAll();
      return {
        total: occurrences.length,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
      };
    }
  },
};
