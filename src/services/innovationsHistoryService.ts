import { supabase } from '../lib/supabase';

export interface InnovationHistoryEntry {
  id: string;
  innovation_id: string;
  innovation_name: string;
  action: 'ativacao' | 'desativacao';
  user_id: number;
  user_name: string;
  establishment_code: string;
  created_at: string;
}

interface CreateHistoryParams {
  innovation_id: string;
  innovation_name: string;
  action: 'ativacao' | 'desativacao';
  user_id: number;
  user_name: string;
  establishment_code: string;
}

export const innovationsHistoryService = {
  async createHistoryEntry(params: CreateHistoryParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('innovations_history')
        .insert({
          innovation_id: params.innovation_id,
          innovation_name: params.innovation_name,
          action: params.action,
          user_id: params.user_id,
          user_name: params.user_name,
          establishment_code: params.establishment_code,
        })
        .select();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getHistory(filters?: {
    innovation_id?: string;
    user_id?: number;
    establishment_code?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<InnovationHistoryEntry[]> {
    try {
      let query = supabase
        .from('innovations_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.innovation_id) {
        query = query.eq('innovation_id', filters.innovation_id);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.establishment_code) {
        query = query.eq('establishment_code', filters.establishment_code);
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getHistoryByDateRange(startDate: string, endDate: string): Promise<InnovationHistoryEntry[]> {
    return this.getHistory({ start_date: startDate, end_date: endDate });
  },

  async getHistoryByInnovation(innovationId: string): Promise<InnovationHistoryEntry[]> {
    return this.getHistory({ innovation_id: innovationId });
  },

  async getHistoryByUser(userId: number): Promise<InnovationHistoryEntry[]> {
    return this.getHistory({ user_id: userId });
  },

  async getHistoryByEstablishment(establishmentCode: string): Promise<InnovationHistoryEntry[]> {
    return this.getHistory({ establishment_code: establishmentCode });
  },

  async getRecentHistory(limit: number = 50): Promise<InnovationHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('innovations_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }
};
