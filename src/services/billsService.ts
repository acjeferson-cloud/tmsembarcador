import { supabase } from '../lib/supabase';

export interface Bill {
  id: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  bill_number: string;
  issue_date: string;
  due_date?: string;
  customer_name?: string;
  customer_document?: string;
  total_value: number;
  paid_value?: number;
  discount_value?: number;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  cteCount?: number;
}

export interface BillCteLink {
  id: string;
  bill_id: string;
  cte_id?: string;
  cte_number?: string;
  created_at: string;
}

export const billsService = {
  async getAll(): Promise<Bill[]> {
    try {
      // 1. Fetch bills
      const { data, error } = await (supabase as any)
        .from('bills')
        .select(`
          *,
          bill_ctes:bill_ctes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to add cteCount correctly depending on postgrest count syntax
      return (data || []).map((b: any) => ({
        ...b,
        cteCount: b.bill_ctes && b.bill_ctes[0] ? b.bill_ctes[0].count : (Array.isArray(b.bill_ctes) ? b.bill_ctes.length : 0)
      }));
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Bill | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('bills')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar fatura:', error);
      return null;
    }
  },
  
  async getLinkedCtes(billId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('bill_ctes')
        .select(`
          id,
          cte_number,
          ctes_complete (
             id,
             number,
             series,
             issue_date,
             total_value,
             status
          )
        `)
        .eq('bill_id', billId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar CT-es vinculados:', error);
      return [];
    }
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('bills')
        .update({ status: status as any })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atualizar fatura' };
    }
  },
  
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao deletar fatura' };
    }
  }
};
