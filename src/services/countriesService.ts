import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

export interface Country {
  id: string;
  codigo: string;
  nome: string;
  sigla_iso2?: string;
  sigla_iso3?: string;
  continente?: string;
  nome_oficial?: string;
  codigo_telefone?: string;
  capital?: string;
  idioma_principal?: string;
  codigo_bacen?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;

  // Aliases para compatibilidade
  code?: string;
  name?: string;
  flag?: string;
  continent?: string;
  language?: string;
  bacen_code?: string;
  iso3?: string;
  bandeira_url?: string;
}

export const countriesService = {
  async getAll(): Promise<Country[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }
      return (data || []).map(country => ({
        ...country,
        code: country.codigo,
        name: country.nome,
        continent: country.continente,
        flag: country.sigla_iso2 || '',
        language: country.idioma_principal,
        bacen_code: country.codigo_bacen,
        iso3: country.sigla_iso3,
        bandeira_url: country.bandeira_url,
      }));
    } catch (error) {
      return [];
    }
  },

  async getById(id: string): Promise<Country | null> {
    try {
      const { data, error } = await supabase
        .from('countries')
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

  async getByCode(code: string): Promise<Country | null> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('codigo', code)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        code: data.codigo,
        name: data.nome,
        continent: data.continente,
        flag: data.sigla_iso2 || '',
        language: data.idioma_principal,
        bacen_code: data.codigo_bacen,
        iso3: data.sigla_iso3,
        bandeira_url: data.bandeira_url,
      };
    } catch (error) {
      return null;
    }
  },

  async getByContinent(continent: string): Promise<Country[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('continente', continent)
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(country => ({
        ...country,
        code: country.codigo,
        name: country.nome,
        continent: country.continente,
        flag: country.sigla_iso2 || '',
        language: country.idioma_principal,
        bacen_code: country.codigo_bacen,
        iso3: country.sigla_iso3,
        bandeira_url: country.bandeira_url,
      }));
    } catch (error) {
      return [];
    }
  },

  async create(country: Omit<Country, 'id' | 'created_at' | 'updated_at'>): Promise<Country | null> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .insert({
          codigo: country.code || country.codigo,
          nome: country.name || country.nome,
          sigla_iso2: country.flag || country.sigla_iso2 || '',
          continente: country.continent || country.continente,
          nome_oficial: country.nome_oficial || '',
          capital: country.capital,
          idioma_principal: country.language || country.idioma_principal,
          codigo_bacen: country.bacen_code || country.codigo_bacen,
          sigla_iso3: country.iso3 || country.sigla_iso3,
          bandeira_url: country.bandeira_url,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        code: data.codigo,
        name: data.nome,
        continent: data.continente,
        flag: data.sigla_iso2 || '',
        language: data.idioma_principal,
        bacen_code: data.codigo_bacen,
        iso3: data.sigla_iso3,
        bandeira_url: data.bandeira_url,
      };
    } catch (error) {
      throw error;
    }
  },

  async update(id: string, country: Partial<Country>): Promise<Country | null> {
    try {
      const updateData: any = {};

      if (country.code !== undefined) updateData.codigo = country.code;
      if (country.name !== undefined) updateData.nome = country.name;
      if (country.flag !== undefined) updateData.sigla_iso2 = country.flag;
      if (country.continent !== undefined) updateData.continente = country.continent;
      if (country.capital !== undefined) updateData.capital = country.capital;
      if (country.language !== undefined) updateData.idioma_principal = country.language;
      if (country.bacen_code !== undefined) updateData.codigo_bacen = country.bacen_code;
      if (country.iso3 !== undefined) updateData.sigla_iso3 = country.iso3;
      if (country.bandeira_url !== undefined) updateData.bandeira_url = country.bandeira_url;

      const { data, error } = await supabase
        .from('countries')
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
        .from('countries')
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

  async search(searchTerm: string): Promise<Country[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .or(`nome.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%`)
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(country => ({
        ...country,
        code: country.codigo,
        name: country.nome,
        continent: country.continente,
        flag: country.sigla_iso2 || '',
        language: country.idioma_principal,
        bacen_code: country.codigo_bacen,
        iso3: country.sigla_iso3,
        bandeira_url: country.bandeira_url,
      }));
    } catch (error) {
      return [];
    }
  },

  async getStats() {
    try {
      const countries = await this.getAll();

      const total = countries.length;
      const byContinents: { [key: string]: number } = {};

      countries.forEach(country => {
        const cont = country.continent || country.continente;
        if (cont) {
          byContinents[cont] = (byContinents[cont] || 0) + 1;
        }
      });

      return {
        total,
        byContinents,
      };
    } catch (error) {
      return {
        total: 0,
        byContinents: {},
      };
    }
  },
};
