import { supabase } from '../lib/supabase';

export interface FreightRateCity {
  id: string;
  freight_rate_id: string;
  freight_rate_table_id: string;
  city_id: string;
  city_name?: string;
  city_state?: string;
  city_ibge_code?: string;
  delivery_days?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CityAvailability {
  city_id: string;
  city_name: string;
  city_state: string;
  city_ibge_code?: string;
  is_available: boolean;
  used_in_rate_id?: string;
  used_in_rate_code?: string;
}

export const freightRateCitiesService = {
  async getCitiesByRate(rateId: string): Promise<FreightRateCity[]> {
    const { data, error } = await supabase
      .from('freight_rate_cities')
      .select(`
        *,
        cities!inner (
          id,
          nome,
          codigo_ibge,
          states!inner (
            sigla
          )
        )
      `)
      .eq('freight_rate_id', rateId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      freight_rate_id: item.freight_rate_id,
      freight_rate_table_id: item.freight_rate_table_id,
      city_id: item.city_id,
      city_name: item.cities?.nome,
      city_state: item.cities?.states?.sigla,
      city_ibge_code: item.cities?.codigo_ibge,
      delivery_days: item.delivery_days,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async checkCityAvailability(
    tableId: string,
    cityId: string,
    currentRateId?: string
  ): Promise<{ available: boolean; usedInRate?: string }> {
    const { data, error } = await supabase
      .from('freight_rate_cities')
      .select('freight_rate_id, freight_rates(codigo)')
      .eq('freight_rate_table_id', tableId)
      .eq('city_id', cityId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { available: true };
    }

    if (currentRateId && data.freight_rate_id === currentRateId) {
      return { available: true };
    }

    return {
      available: false,
      usedInRate: (data as any).freight_rates?.codigo || data.freight_rate_id
    };
  },

  async getAvailableCitiesForRate(
    tableId: string,
    rateId: string,
    searchTerm?: string
  ): Promise<CityAvailability[]> {
    let query = supabase
      .from('cities')
      .select(`
        id,
        nome,
        codigo_ibge,
        states!inner (
          sigla
        )
      `)
      .eq('ativo', true)
      .order('nome', { ascending: true })
      .limit(500);

    // Se houver termo de busca, filtrar no servidor
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      const isNumber = /^\d+$/.test(term);
      const isUF = term.length === 2 && /^[a-zA-Z]{2}$/.test(term);
      
      if (isNumber) {
        query = query.like('codigo_ibge', `%${term}%`);
      } else if (isUF) {
        const validUFs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
        if (validUFs.includes(term.toUpperCase())) {
           query = query.eq('states.sigla', term.toUpperCase());
        } else {
           query = query.ilike('nome', `%${term}%`);
        }
      } else {
         query = query.ilike('nome', `%${term}%`);
      }
    }

    const { data: allCities, error: citiesError } = await query;

    if (citiesError) {
      throw citiesError;
    }

    const { data: usedCities, error: usedError } = await supabase
      .from('freight_rate_cities')
      .select('city_id, freight_rate_id, freight_rates(codigo)')
      .eq('freight_rate_table_id', tableId);

    if (usedError) {
      throw usedError;
    }

    const usedCitiesMap = new Map(
      (usedCities || []).map(uc => [
        uc.city_id,
        {
          rate_id: uc.freight_rate_id,
          rate_code: (uc as any).freight_rates?.codigo
        }
      ])
    );

    return (allCities || []).map((city: any) => {
      const usage = usedCitiesMap.get(city.id);
      const isUsedByCurrentRate = usage?.rate_id === rateId;

      return {
        city_id: city.id,
        city_name: city.nome,
        city_state: city.states?.sigla,
        city_ibge_code: city.codigo_ibge,
        is_available: !usage || isUsedByCurrentRate,
        used_in_rate_id: usage?.rate_id,
        used_in_rate_code: usage?.rate_code
      };
    });
  },

  async addCityToRate(
    rateId: string,
    tableId: string,
    cityId: string
  ): Promise<FreightRateCity> {
    const availability = await this.checkCityAvailability(tableId, cityId, rateId);
    if (!availability.available) {
      const errorMsg = `Cidade já vinculada à tarifa ${availability.usedInRate}`;
      throw new Error(errorMsg);
    }

    // Verificar se a cidade existe
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select(`
        id,
        nome,
        codigo_ibge,
        states!inner (
          sigla
        )
      `)
      .eq('id', cityId)
      .maybeSingle();

    if (cityError) {
      throw cityError;
    }

    if (!city) {
      const errorMsg = `Cidade com ID ${cityId} não encontrada`;
      throw new Error(errorMsg);
    }
    const insertData = {
      freight_rate_id: rateId,
      freight_rate_table_id: tableId,
      city_id: cityId
    };
    const { data, error } = await supabase
      .from('freight_rate_cities')
      .insert([insertData])
      .select(`
        *,
        cities!inner (
          id,
          nome,
          codigo_ibge,
          states!inner (
            sigla
          )
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Esta cidade já está vinculada a esta tarifa.');
      }
      if (error.code === '23503') {
        throw new Error('Erro de referência: verifique se a tarifa e cidade existem.');
      }
      throw new Error(error.message || 'Erro ao vincular cidade');
    }
    return {
      id: data.id,
      freight_rate_id: data.freight_rate_id,
      freight_rate_table_id: data.freight_rate_table_id,
      city_id: data.city_id,
      city_name: (data as any).cities?.nome,
      city_state: (data as any).cities?.states?.sigla,
      city_ibge_code: (data as any).cities?.codigo_ibge,
      delivery_days: data.delivery_days,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async addMultipleCitiesToRate(
    rateId: string,
    tableId: string,
    cityIds: string[]
  ): Promise<{ success: FreightRateCity[]; errors: { cityId: string; error: string }[] }> {
    const success: FreightRateCity[] = [];
    const errors: { cityId: string; error: string }[] = [];

    for (const cityId of cityIds) {
      try {
        const result = await this.addCityToRate(rateId, tableId, cityId);
        success.push(result);
      } catch (error) {
        errors.push({
          cityId,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return { success, errors };
  },

  async removeCityFromRate(id: string): Promise<void> {
    const { error } = await supabase
      .from('freight_rate_cities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCitiesCountByRate(rateId: string): Promise<number> {
    const { count, error } = await supabase
      .from('freight_rate_cities')
      .select('*', { count: 'exact', head: true })
      .eq('freight_rate_id', rateId);

    if (error) throw error;
    return count || 0;
  },

  async getCitiesByTable(tableId: string): Promise<FreightRateCity[]> {
    const { data, error } = await supabase
      .from('freight_rate_cities')
      .select(`
        *,
        freight_rates (codigo),
        cities!inner (
          id,
          nome,
          codigo_ibge,
          states!inner (
            sigla
          )
        )
      `)
      .eq('freight_rate_table_id', tableId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      freight_rate_id: item.freight_rate_id,
      freight_rate_table_id: item.freight_rate_table_id,
      city_id: item.city_id,
      city_name: item.cities?.nome,
      city_state: item.cities?.states?.sigla,
      city_ibge_code: item.cities?.codigo_ibge,
      delivery_days: item.delivery_days,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async updateDeliveryDays(cityId: string, deliveryDays: number | null): Promise<void> {
    const { error } = await supabase
      .from('freight_rate_cities')
      .update({
        delivery_days: deliveryDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', cityId);

    if (error) throw error;
  }
};
