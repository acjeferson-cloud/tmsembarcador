import { supabase } from '../lib/supabase';

interface NFe {
  id: string;
  establishment_id: string;
  organization_id: string;
  environment_id: string;
  invoice_type: string;
  number: string;
  series: string;
  access_key: string;
  issue_date: string;
  operation_nature: string;
  total_value: number;
  pis_value: number;
  cofins_value: number;
  icms_value: number;
  status: string;
  xml_data?: any;
  created_at: string;
  updated_at: string;
}

export interface NFeWithCustomer extends NFe {
  carrier_id?: string;
  customer?: {
    id: string;
    razao_social: string;
    cnpj_cpf: string;
    cidade: string;
    estado: string;
  };
  carrier?: {
    id: string;
    codigo: string;
    razao_social: string;
    cnpj: string;
  };
  products?: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    valor_total: number;
  }>;
}

export const nfeService = {
  async getAll(): Promise<NFeWithCustomer[]> {
    try {
      const { data: invoices, error } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(
            id,
            razao_social,
            cnpj_cpf,
            cidade,
            estado
          ),
          carrier:carriers(
            id,
            codigo,
            razao_social,
            cnpj
          ),
          products:invoices_nfe_products(
            id,
            descricao,
            quantidade,
            valor_total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return (invoices || []).map((invoice: any) => ({
        id: invoice.id,
        establishment_id: invoice.establishment_id,
        organization_id: invoice.organization_id,
        environment_id: invoice.environment_id,
        invoice_type: 'NFe',
        number: invoice.numero,
        series: invoice.serie,
        access_key: invoice.chave_acesso,
        issue_date: invoice.data_emissao,
        operation_nature: invoice.natureza_operacao,
        total_value: invoice.valor_total,
        pis_value: invoice.valor_pis || 0,
        cofins_value: invoice.valor_cofins || 0,
        icms_value: invoice.valor_icms || 0,
        status: invoice.situacao,
        xml_data: invoice.xml_content,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          name: invoice.customer[0].razao_social,
          cnpj: invoice.customer[0].cnpj_cpf,
          city: invoice.customer[0].cidade,
          state: invoice.customer[0].estado
        } : undefined,
        carrier: invoice.carrier ? {
          id: invoice.carrier.id,
          codigo: invoice.carrier.codigo,
          razao_social: invoice.carrier.razao_social,
          cnpj: invoice.carrier.cnpj
        } : undefined,
        products: (invoice.products || []).map((p: any) => ({
          id: p.id,
          description: p.descricao,
          quantity: p.quantidade,
          total_value: p.valor_total
        }))
      }));
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<NFeWithCustomer | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(*),
          carrier:carriers(
            id,
            razao_social,
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
        id: data.id,
        establishment_id: data.establishment_id,
        organization_id: data.organization_id,
        environment_id: data.environment_id,
        invoice_type: 'NFe',
        number: data.numero,
        series: data.serie,
        access_key: data.chave_acesso,
        issue_date: data.data_emissao,
        operation_nature: data.natureza_operacao,
        total_value: data.valor_total,
        pis_value: data.valor_pis || 0,
        cofins_value: data.valor_cofins || 0,
        icms_value: data.valor_icms || 0,
        status: data.situacao,
        xml_data: data.xml_content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        carrier_id: data.carrier_id,
        customer: data.customer?.[0] ? {
          id: data.customer[0].id,
          name: data.customer[0].razao_social,
          cnpj: data.customer[0].cnpj_cpf,
          city: data.customer[0].cidade,
          state: data.customer[0].estado
        } : undefined,
        carrier: data.carrier ? {
          id: data.carrier.id,
          codigo: data.carrier.codigo,
          razao_social: data.carrier.razao_social,
          cnpj: data.carrier.cnpj
        } : undefined,
        products: (data.products || []).map((p: any) => ({
          id: p.id,
          description: p.descricao,
          quantity: p.quantidade,
          total_value: p.valor_total
        }))
      } as any;
    } catch (error) {

      return null;
    }
  },

  async searchByNumberOrKey(searchTerm: string): Promise<NFeWithCustomer[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(
            id,
            razao_social,
            cnpj_cpf,
            cidade,
            estado
          ),
          products:invoices_nfe_products(
            id,
            descricao,
            quantidade,
            valor_total
          )
        `)
        .or(`numero.eq.${searchTerm},chave_acesso.eq.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return (data || []).map((invoice: any) => ({
        id: invoice.id,
        establishment_id: invoice.establishment_id,
        organization_id: invoice.organization_id,
        environment_id: invoice.environment_id,
        invoice_type: 'NFe',
        number: invoice.numero,
        series: invoice.serie,
        access_key: invoice.chave_acesso,
        issue_date: invoice.data_emissao,
        operation_nature: invoice.natureza_operacao,
        total_value: invoice.valor_total,
        pis_value: invoice.valor_pis || 0,
        cofins_value: invoice.valor_cofins || 0,
        icms_value: invoice.valor_icms || 0,
        status: invoice.situacao,
        xml_data: invoice.xml_content,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          name: invoice.customer[0].razao_social,
          cnpj: invoice.customer[0].cnpj_cpf,
          city: invoice.customer[0].cidade,
          state: invoice.customer[0].estado
        } : undefined,
        products: (invoice.products || []).map((p: any) => ({
          id: p.id,
          description: p.descricao,
          quantity: p.quantidade,
          total_value: p.valor_total
        }))
      })) as any[];
    } catch (error) {

      return [];
    }
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('invoices_nfe')
        .update({
          situacao: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async getByIds(ids: string[]): Promise<NFeWithCustomer[]> {
    try {
      if (!ids || ids.length === 0) return [];

      const { data, error } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(*),
          carrier:carriers(
            id,
            razao_social,
            cnpj,
            codigo
          ),
          products:invoices_nfe_products(*)
        `)
        .in('id', ids);

      if (error) throw error;
      if (!data) return [];

      return data.map((invoice: any) => ({
        id: invoice.id,
        establishment_id: invoice.establishment_id,
        organization_id: invoice.organization_id,
        environment_id: invoice.environment_id,
        invoice_type: 'NFe',
        number: invoice.numero,
        series: invoice.serie,
        access_key: invoice.chave_acesso,
        issue_date: invoice.data_emissao,
        operation_nature: invoice.natureza_operacao,
        total_value: invoice.valor_total,
        pis_value: invoice.valor_pis || 0,
        cofins_value: invoice.valor_cofins || 0,
        icms_value: invoice.valor_icms || 0,
        status: invoice.situacao,
        xml_data: invoice.xml_content,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          name: invoice.customer[0].razao_social,
          cnpj: invoice.customer[0].cnpj_cpf,
          city: invoice.customer[0].cidade,
          state: invoice.customer[0].estado
        } : undefined,
        carrier: invoice.carrier ? {
          id: invoice.carrier.id,
          codigo: invoice.carrier.codigo,
          razao_social: invoice.carrier.razao_social,
          cnpj: invoice.carrier.cnpj
        } : undefined,
        products: (invoice.products || []).map((p: any) => ({
          id: p.id,
          description: p.descricao,
          quantity: p.quantidade,
          total_value: p.valor_total
        }))
      }));
    } catch (error) {
      console.error('Error fetching NFes by IDs:', error);
      return [];
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
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
