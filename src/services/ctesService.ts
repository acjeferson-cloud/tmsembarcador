import { supabase } from '../lib/supabase';

interface CTe {
  id?: string;
  cte_number: string;
  cte_series?: string;
  access_key?: string;
  authorization_protocol?: string;
  issue_date: string;
  authorization_date?: string;
  shipper_id?: string;
  shipper_name: string;
  shipper_document: string;
  recipient_id?: string;
  recipient_name: string;
  recipient_document: string;
  carrier_id?: string;
  carrier_name: string;
  invoice_id?: string;
  invoice_number?: string;
  freight_value: number;
  total_weight: number;
  transport_mode?: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  status: 'pending' | 'authorized' | 'cancelled' | 'denied';
  xml_file?: string;
  pdf_file?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
}

export const ctesService = {
  async getAll(): Promise<CTe[]> {
    try {
      const { data, error } = await supabase
        .from('ctes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<CTe | null> {
    try {
      const { data, error } = await supabase
        .from('ctes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async create(cte: CTe): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ctes')
        .insert({
          ...cte,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error) {

      return { success: false, error: 'Erro ao criar CT-e' };
    }
  },

  async update(id: string, cte: Partial<CTe>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes')
        .update({
          ...cte,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar CT-e' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ctes')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao excluir CT-e' };
    }
  }
};
