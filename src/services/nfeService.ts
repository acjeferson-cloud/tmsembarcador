import { supabase } from '../lib/supabase';

interface NFe {
  id: string;
  establishment_id: string;
  invoice_type: string;
  number: string;
  series: string;
  access_key: string;
  issue_date: string;
  delivery_forecast_date?: string;
  operation_nature: string;
  order_number?: string;
  weight: number;
  volumes: number;
  total_value: number;
  pis_value: number;
  cofins_value: number;
  icms_value: number;
  status: string;
  xml_data?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface NFeWithCustomer extends NFe {
  carrier_id?: string;
  customer?: {
    id: string;
    name: string;
    cnpj: string;
    city: string;
    state: string;
  };
  carrier?: {
    id: string;
    codigo: string;
    razao_social: string;
    fantasia: string;
    cnpj: string;
  };
  products?: Array<{
    id: string;
    description: string;
    quantity: number;
    total_value: number;
  }>;
}

export const nfeService = {
  async getAll(): Promise<NFeWithCustomer[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(
            id,
            name,
            cnpj,
            city,
            state
          ),
          carrier:carriers(
            id,
            codigo,
            razao_social,
            fantasia,
            cnpj
          ),
          products:invoices_nfe_products(
            id,
            description,
            quantity,
            total_value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return (invoices || []).map((invoice: any) => ({
        ...invoice,
        customer: invoice.customer?.[0] || null,
        carrier: invoice.carrier || null,
        products: invoice.products || []
      }));
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<NFeWithCustomer | null> {
    try {
      const { data, error } = await supabase
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(*),
          carrier:carriers(
            id,
            razao_social,
            fantasia,
            cnpj,
            codigo
          ),
          products:invoices_nfe_products(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        customer: data.customer?.[0] || null,
        carrier: data.carrier || null,
        products: data.products || []
      };
    } catch (error) {

      return null;
    }
  },

  async searchByNumberOrKey(searchTerm: string): Promise<NFeWithCustomer[]> {
    try {
      const { data, error } = await supabase
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(
            id,
            name,
            cnpj,
            city,
            state
          ),
          products:invoices_nfe_products(
            id,
            description,
            quantity,
            total_value
          )
        `)
        .or(`number.eq.${searchTerm},access_key.eq.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return (data || []).map((invoice: any) => ({
        ...invoice,
        customer: invoice.customer?.[0] || null,
        products: invoice.products || []
      }));
    } catch (error) {

      return [];
    }
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('invoices_nfe')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('invoices_nfe')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
};
