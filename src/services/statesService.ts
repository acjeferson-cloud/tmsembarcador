import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

export interface State {
  id: string;
  codigo: string;
  nome: string;
  sigla: string;
  regiao?: string;
  country_id?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;

  // Aliases
  name?: string;
  abbreviation?: string;
  ibge_code?: string;
  capital?: string;
  region?: string;
}

export const statesService = {
  async getAll(): Promise<State[]> {
    try {
      console.log('[statesService] Starting getAll query...');
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('[statesService] Error:', error);
        throw error;
      }

      console.log('[statesService] Success! Found', data?.length || 0, 'states');
      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: state.capital,
        region: state.regiao,
      }));
    } catch (error) {
      console.error('[statesService] Exception:', error);
      return [];
    }
  },

  async getById(id: string): Promise<State | null> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar estado:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar estado:', error);
      return null;
    }
  },

  async getByAbbreviation(abbreviation: string): Promise<State | null> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('sigla', abbreviation)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar estado por sigla:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        name: data.nome,
        abbreviation: data.sigla,
        ibge_code: data.codigo,
        capital: data.capital,
        region: data.regiao,
      };
    } catch (error) {
      console.error('Erro ao buscar estado por sigla:', error);
      return null;
    }
  },

  async getByRegion(region: string): Promise<State[]> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('regiao', region)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar estados por região:', error);
        throw error;
      }

      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: '',
        region: state.regiao,
      }));
    } catch (error) {
      console.error('Erro ao buscar estados por região:', error);
      return [];
    }
  },

  async getByIbgeCode(ibgeCode: string): Promise<State | null> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('codigo', ibgeCode)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar estado por código IBGE:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        name: data.nome,
        abbreviation: data.sigla,
        ibge_code: data.codigo,
        capital: data.capital,
        region: data.regiao,
      };
    } catch (error) {
      console.error('Erro ao buscar estado por código IBGE:', error);
      return null;
    }
  },

  async create(state: Omit<State, 'id' | 'created_at' | 'updated_at'>): Promise<State | null> {
    try {
      const { data, error } = await supabase
        .from('states')
        .insert({
          codigo: state.ibge_code || state.codigo,
          nome: state.name || state.nome,
          sigla: state.abbreviation || state.sigla,
          regiao: state.region || state.regiao,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar estado:', error);
        throw error;
      }

      return {
        ...data,
        name: data.nome,
        abbreviation: data.sigla,
        ibge_code: data.codigo,
        capital: data.capital,
        region: data.regiao,
      };
    } catch (error) {
      console.error('Erro ao criar estado:', error);
      throw error;
    }
  },

  async update(id: string, state: Partial<State>): Promise<State | null> {
    try {
      const updateData: any = {
        updated_by: state.updated_by,
      };

      if (state.name !== undefined) updateData.name = state.name;
      if (state.abbreviation !== undefined) updateData.abbreviation = state.abbreviation;
      if (state.ibge_code !== undefined) updateData.ibge_code = state.ibge_code;
      if (state.capital !== undefined) updateData.capital = state.capital;
      if (state.region !== undefined) updateData.region = state.region;

      const { data, error } = await supabase
        .from('states')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar estado:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('states')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir estado:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      return false;
    }
  },

  async search(searchTerm: string): Promise<State[]> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .or(`nome.ilike.%${searchTerm}%,sigla.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar estados:', error);
        throw error;
      }

      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: '',
        region: state.regiao,
      }));
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      return [];
    }
  },

  async getStats() {
    try {
      const states = await this.getAll();

      const total = states.length;
      const byRegion: { [key: string]: number } = {};

      states.forEach(state => {
        const reg = state.region || state.regiao;
        if (reg) {
          byRegion[reg] = (byRegion[reg] || 0) + 1;
        }
      });

      return {
        total,
        byRegion,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        byRegion: {},
      };
    }
  },
};
