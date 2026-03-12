import { supabase } from '../lib/supabase';
import { getMovableHolidays, formatDateISO } from '../utils/holidayCalculator';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'nacional' | 'estadual' | 'municipal';
  is_recurring: boolean;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  organization_id?: string;
  environment_id?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

class HolidaysService {
  /**
   * Busca todos os feriados
   */
  async getAll(): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      throw error;
    }
    return data || [];
  }

  /**
   * Busca feriados por ano
   */
  async getByYear(year: number): Promise<Holiday[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca feriados por tipo
   */
  async getByType(type: 'nacional' | 'estadual' | 'municipal'): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca feriados que afetam uma cidade específica
   * Retorna: feriados nacionais + estaduais do estado + municipais da cidade
   */
  async getHolidaysForCity(cityId: string, stateId: string, year?: number): Promise<Holiday[]> {
    let query = supabase
      .from('holidays')
      .select('*')
      .or(`type.eq.nacional,and(type.eq.estadual,state_id.eq.${stateId}),and(type.eq.municipal,city_id.eq.${cityId})`);

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Verifica se uma data específica é feriado
   */
  async isHoliday(date: Date, cityId?: string, stateId?: string): Promise<boolean> {
    const dateStr = formatDateISO(date);

    let query = supabase
      .from('holidays')
      .select('id')
      .eq('date', dateStr);

    if (cityId && stateId) {
      query = query.or(`type.eq.nacional,and(type.eq.estadual,state_id.eq.${stateId}),and(type.eq.municipal,city_id.eq.${cityId})`);
    } else if (stateId) {
      query = query.or(`type.eq.nacional,and(type.eq.estadual,state_id.eq.${stateId})`);
    } else {
      query = query.eq('type', 'nacional');
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  /**
   * Cria um novo feriado
   */
  async create(holiday: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>): Promise<Holiday> {
    const { data, error } = await supabase
      .from('holidays')
      .insert([{
        name: holiday.name,
        date: holiday.date,
        type: holiday.type,
        is_recurring: holiday.is_recurring,
        active: holiday.active ?? true,
        country_id: holiday.country_id,
        state_id: holiday.state_id,
        city_id: holiday.city_id,
        organization_id: holiday.organization_id,
        environment_id: holiday.environment_id
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza um feriado
   */
  async update(id: string, updates: Partial<Holiday>): Promise<Holiday> {
    const { data, error } = await supabase
      .from('holidays')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Exclui um feriado
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Importa feriados móveis para um ano específico
   * (Carnaval, Sexta-feira Santa, Corpus Christi)
   */
  async importMovableHolidays(year: number, countryId: string): Promise<void> {
    const movableHolidays = getMovableHolidays(year);

    const holidays = movableHolidays.map(holiday => ({
      name: holiday.name,
      date: formatDateISO(holiday.date),
      type: holiday.type,
      is_recurring: holiday.is_recurring,
      country_id: countryId
    }));

    // Verificar se já existem antes de inserir
    for (const holiday of holidays) {
      const { data: existing } = await supabase
        .from('holidays')
        .select('id')
        .eq('name', holiday.name)
        .eq('date', holiday.date)
        .maybeSingle();

      if (!existing) {
        await this.create(holiday);
      }
    }
  }

  /**
   * Importa todos os feriados (fixos + móveis) para um ano
   */
  async importAllHolidaysForYear(year: number, countryId: string): Promise<void> {
    await this.importMovableHolidays(year, countryId);
  }

  /**
   * Calcula o número de dias úteis entre duas datas
   * considerando feriados e configurações de dias úteis
   */
  async calculateBusinessDays(
    startDate: Date,
    endDate: Date,
    cityId?: string,
    stateId?: string,
    consideraSabado: boolean = false,
    consideraDomingo: boolean = false,
    consideraFeriados: boolean = true
  ): Promise<number> {
    let businessDays = 0;
    const currentDate = new Date(startDate);

    // Buscar feriados do período se necessário
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const holidays: string[] = [];

    if (consideraFeriados && cityId && stateId) {
      for (let year = startYear; year <= endYear; year++) {
        const yearHolidays = await this.getHolidaysForCity(cityId, stateId, year);
        holidays.push(...yearHolidays.map(h => h.date));
      }
    }

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = formatDateISO(currentDate);

      // Verificar se é fim de semana
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      // Verificar se é feriado
      const isHoliday = consideraFeriados && holidays.includes(dateStr);

      // Contar como dia útil se:
      // - Não é feriado (ou não considera feriados)
      // - E não é sábado (ou considera sábado)
      // - E não é domingo (ou considera domingo)
      if (!isHoliday &&
          (!isSaturday || consideraSabado) &&
          (!isSunday || consideraDomingo)) {
        businessDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  }

  /**
   * Calcula a data de entrega baseada em dias úteis
   */
  async calculateDeliveryDate(
    startDate: Date,
    deliveryDays: number,
    cityId?: string,
    stateId?: string,
    consideraSabado: boolean = false,
    consideraDomingo: boolean = false,
    consideraFeriados: boolean = true
  ): Promise<Date> {
    let daysAdded = 0;
    const currentDate = new Date(startDate);

    // Buscar feriados do ano atual e próximo
    const startYear = startDate.getFullYear();
    const holidays: string[] = [];

    if (consideraFeriados && cityId && stateId) {
      for (let year = startYear; year <= startYear + 1; year++) {
        const yearHolidays = await this.getHolidaysForCity(cityId, stateId, year);
        holidays.push(...yearHolidays.map(h => h.date));
      }
    }

    while (daysAdded < deliveryDays) {
      currentDate.setDate(currentDate.getDate() + 1);

      const dayOfWeek = currentDate.getDay();
      const dateStr = formatDateISO(currentDate);

      // Verificar se é fim de semana
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      // Verificar se é feriado
      const isHoliday = consideraFeriados && holidays.includes(dateStr);

      // Contar como dia útil se:
      // - Não é feriado (ou não considera feriados)
      // - E não é sábado (ou considera sábado)
      // - E não é domingo (ou considera domingo)
      if (!isHoliday &&
          (!isSaturday || consideraSabado) &&
          (!isSunday || consideraDomingo)) {
        daysAdded++;
      }
    }

    return currentDate;
  }
}

export const holidaysService = new HolidaysService();
