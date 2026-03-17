import { supabase } from '../lib/supabase';

interface Invoice {
  id?: string;
  invoice_number: string;
  invoice_series?: string;
  order_id?: string;
  order_number?: string;
  customer_id?: string;
  customer_name: string;
  customer_document: string;
  issue_date: string;
  invoice_value: number;
  freight_value?: number;
  total_value: number;
  carrier_id?: string;
  carrier_name?: string;
  status: 'pending' | 'authorized' | 'cancelled' | 'denied';
  access_key?: string;
  xml_file?: string;
  pdf_file?: string;
  destination_city: string;
  destination_state: string;
  observations?: string;
  establishment_id?: string;
  invoice_type?: string;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
}

export const invoicesService = {
  async getAll(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async create(invoice: Invoice): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error) {

      return { success: false, error: 'Erro ao criar nota fiscal' };
    }
  },

  async update(id: string, invoice: Partial<Invoice>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...invoice,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar nota fiscal' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Pegar os dados da nota/CTe para ter a chave de acesso e poder excluir o XML depois
      const invoice = await this.getById(id);

      // 1. Delete associated items
      const { error: errorItems } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (errorItems && errorItems.code !== 'PGRST116') {
        return { success: false, error: 'Erro ao excluir itens da nota: ' + errorItems.message };
      }

      // 2. Delete parent
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };

      // 3. Delete XML document in electronic_documents by access_key
      if (invoice?.access_key) {
        await supabase
          .from('electronic_documents')
          .delete()
          .eq('access_key', invoice.access_key);
      }

      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao excluir nota fiscal' };
    }
  },

  async getByAccessKey(accessKey: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('access_key', accessKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async getByAccessKeys(accessKeys: string[]): Promise<Invoice[]> {
    try {
      if (accessKeys.length === 0) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .in('access_key', accessKeys);

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getByIds(ids: string[]): Promise<Invoice[]> {
    try {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .in('id', ids);

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  }
};
