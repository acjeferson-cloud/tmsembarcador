import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface Occurrence {
  id: string;
  codigo: string;
  descricao: string;
  created_at?: string;
  updated_at?: string;
}

export const occurrencesService = {
  async getAll(): Promise<Occurrence[]> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*');

      if (error) {
        throw error;
      }
      
      return ((data as Occurrence[]) || []).sort((a, b) => 
        a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      );
    } catch (error) {
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
        throw error;
      }

      return data;
    } catch (error) {
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
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  },

  async create(occurrence: Omit<Occurrence, 'id' | 'created_at' | 'updated_at'>): Promise<Occurrence | null> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .insert({
          codigo: occurrence.codigo,
          descricao: occurrence.descricao
        } as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async update(id: string, occurrence: Partial<Occurrence>): Promise<Occurrence | null> {
    try {
      const updateData: any = {};

      if (occurrence.codigo !== undefined) updateData.codigo = occurrence.codigo;
      if (occurrence.descricao !== undefined) updateData.descricao = occurrence.descricao;

      const { data, error } = await supabase
        .from('occurrences')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('occurrences')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  async search(searchTerm: string): Promise<Occurrence[]> {
    try {
      const { data, error } = await supabase
        .from('occurrences')
        .select('*')
        .or(`codigo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);

      if (error) {
        throw error;
      }

      return ((data as Occurrence[]) || []).sort((a, b) => 
        a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
      );
    } catch (error) {
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
        return nextCode.toString().padStart(2, '0');
      }

      return '01';
    } catch (error) {
      return '01';
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
      return {
        total: 0,
      };
    }
  }
};

