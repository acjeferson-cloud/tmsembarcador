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
  bandeira_url?: string;
}

export const statesService = {
  async getAll(): Promise<State[]> {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }
      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: state.capital,
        region: state.regiao,
        bandeira_url: state.bandeira_url,
      }));
    } catch (error) {
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
        throw error;
      }

      return data;
    } catch (error) {
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
        bandeira_url: data.bandeira_url,
      };
    } catch (error) {
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
        throw error;
      }

      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: state.capital || '',
        region: state.regiao,
        bandeira_url: state.bandeira_url,
      }));
    } catch (error) {
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
        bandeira_url: data.bandeira_url,
      };
    } catch (error) {
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
          capital: state.capital,
          bandeira_url: state.bandeira_url,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        name: data.nome,
        abbreviation: data.sigla,
        ibge_code: data.codigo,
        capital: data.capital,
        region: data.regiao,
        bandeira_url: data.bandeira_url,
      };
    } catch (error) {
      throw error;
    }
  },

  async update(id: string, state: Partial<State>): Promise<State | null> {
    try {
      const updateData: any = {};

      if (state.name !== undefined) updateData.nome = state.name;
      if (state.abbreviation !== undefined) updateData.sigla = state.abbreviation;
      if (state.ibge_code !== undefined) updateData.codigo = state.ibge_code;
      if (state.capital !== undefined) updateData.capital = state.capital;
      if (state.region !== undefined) updateData.regiao = state.region;
      if (state.bandeira_url !== undefined) updateData.bandeira_url = state.bandeira_url;

      const { data, error } = await supabase
        .from('states')
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
      const { data, error } = await supabase
        .from('states')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
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
        throw error;
      }

      return (data || []).map(state => ({
        ...state,
        name: state.nome,
        abbreviation: state.sigla,
        ibge_code: state.codigo,
        capital: state.capital || '',
        region: state.regiao,
        bandeira_url: state.bandeira_url,
      }));
    } catch (error) {
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
      return {
        total: 0,
        byRegion: {},
      };
    }
  },
};
