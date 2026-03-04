import { supabase } from '../lib/supabase';

interface ReverseLogistics {
  id?: string;
  reverse_order_number: string;
  original_order_id?: string;
  original_order_number?: string;
  customer_id?: string;
  customer_name: string;
  type: 'exchange' | 'return' | 'warranty' | 'defect';
  reason: string;
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'processed' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  request_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  pickup_address: any;
  return_address: any;
  carrier?: string;
  tracking_code?: string;
  refund_amount?: number;
  exchange_order_id?: string;
  notes?: string;
  attachments?: any[];
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
  items?: ReverseLogisticsItem[];
}

interface ReverseLogisticsItem {
  id?: string;
  reverse_logistics_id?: string;
  product_id?: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  condition: 'new' | 'used' | 'damaged' | 'defective';
  reason: string;
  action: 'refund' | 'exchange' | 'repair' | 'discard';
}

export const reverseLogisticsService = {
  async getAll(): Promise<ReverseLogistics[]> {
    try {
      const { data, error } = await supabase
        .from('reverse_logistics')
        .select(`
          *,
          items:reverse_logistics_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logística reversa:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ReverseLogistics | null> {
    try {
      const { data, error } = await supabase
        .from('reverse_logistics')
        .select(`
          *,
          items:reverse_logistics_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar logística reversa:', error);
      return null;
    }
  },

  async create(reverseLogistics: ReverseLogistics): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { items, ...reverseData } = reverseLogistics;

      const { data, error } = await supabase
        .from('reverse_logistics')
        .insert({
          ...reverseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          reverse_logistics_id: data.id,
          created_at: new Date().toISOString()
        }));

        await supabase.from('reverse_logistics_items').insert(itemsToInsert);
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Erro ao criar logística reversa:', error);
      return { success: false, error: 'Erro ao criar logística reversa' };
    }
  },

  async update(id: string, reverseLogistics: Partial<ReverseLogistics>): Promise<{ success: boolean; error?: string }> {
    try {
      const { items, ...reverseData } = reverseLogistics;

      const { error } = await supabase
        .from('reverse_logistics')
        .update({
          ...reverseData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar logística reversa:', error);
      return { success: false, error: 'Erro ao atualizar logística reversa' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reverse_logistics')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir logística reversa:', error);
      return { success: false, error: 'Erro ao excluir logística reversa' };
    }
  }
};
