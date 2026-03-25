import { supabase } from '../lib/supabase';
import { deliveryNotificationHandler } from './deliveryNotificationHandler';
import { trackingService } from './trackingService';
import { TenantContextHelper } from '../utils/tenantContext';

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
  metadata?: any;
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
    metadata?: any;
  };
  products?: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    valor_total: number;
  }>;
  freight_results?: any[];
}

export const nfeService = {
  async getAll(): Promise<NFeWithCustomer[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      let query = (supabase as any)
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
            cnpj,
            metadata
          ),
          products:invoices_nfe_products(
            id,
            descricao,
            quantidade,
            valor_total,
            cubagem
          )
        `);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data: invoices, error } = await query.order('created_at', { ascending: false });

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
        order_number: invoice.order_number || invoice.numero_pedido,
        order_serie: invoice.order_serie,
        weight: invoice.peso_total || 0,
        volumes: invoice.quantidade_volumes || 1,
        cubic_meters: invoice.cubagem_total || (invoice.products || []).reduce((acc: number, p: any) => acc + (Number(p.cubagem) || 0), 0),
        total_value: invoice.valor_total,
        pis_value: invoice.valor_pis || 0,
        cofins_value: invoice.valor_cofins || 0,
        icms_value: invoice.valor_icms || 0,
        status: invoice.situacao,
        xml_data: invoice.xml_content,
        metadata: invoice.metadata,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          razao_social: invoice.customer[0].razao_social,
          cnpj_cpf: invoice.customer[0].cnpj_cpf,
          cidade: invoice.customer[0].cidade,
          estado: invoice.customer[0].estado
        } : undefined,
        carrier: invoice.carrier ? {
          id: invoice.carrier.id,
          codigo: invoice.carrier.codigo,
          razao_social: invoice.carrier.razao_social,
          cnpj: invoice.carrier.cnpj,
          metadata: invoice.carrier.metadata
        } : undefined,
        products: (invoice.products || []).map((p: any) => ({
          id: p.id,
          description: p.descricao,
          quantity: p.quantidade,
          total_value: p.valor_total,
          cubic_meters: p.cubagem
        })),
        freight_results: invoice.freight_results || []
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
            codigo,
            metadata
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
        order_serie: data.order_serie,
        order_number: data.order_number,
        weight: data.peso_total || 0,
        volumes: data.quantidade_volumes || 1,
        cubic_meters: data.cubagem_total || 0,
        total_value: data.valor_total,
        pis_value: data.valor_pis || 0,
        cofins_value: data.valor_cofins || 0,
        icms_value: data.valor_icms || 0,
        status: data.situacao,
        xml_data: data.xml_content,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
        carrier_id: data.carrier_id,
        customer: data.customer?.[0] ? {
          id: data.customer[0].id,
          razao_social: data.customer[0].razao_social,
          cnpj_cpf: data.customer[0].cnpj_cpf,
          inscricao_estadual: data.customer[0].inscricao_estadual,
          logradouro: data.customer[0].logradouro,
          numero: data.customer[0].numero,
          complemento: data.customer[0].complemento,
          bairro: data.customer[0].bairro,
          cidade: data.customer[0].cidade,
          estado: data.customer[0].estado,
          cep: data.customer[0].cep,
          telefone: data.customer[0].telefone,
          email: data.customer[0].email
        } : undefined,
        carrier: data.carrier ? {
          id: data.carrier.id,
          codigo: data.carrier.codigo,
          razao_social: data.carrier.razao_social,
          cnpj: data.carrier.cnpj
        } : undefined,
        products: (data.products || []).map((p: any) => ({
          id: p.id,
          product_code: p.codigo_produto,
          description: p.descricao,
          quantity: p.quantidade,
          unit: p.unidade,
          unit_value: p.valor_unitario,
          total_value: p.valor_total,
          weight: p.peso,
          cubic_meters: p.cubagem,
          ncm: p.ncm
        }))
      } as any;
    } catch (error) {

      return null;
    }
  },

  async searchByNumberOrKey(searchTerm: string): Promise<NFeWithCustomer[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      let query = (supabase as any)
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
            codigo_produto,
            descricao,
            quantidade,
            unidade,
            valor_unitario,
            valor_total,
            peso,
            cubagem,
            ncm
          )
        `)
        .or(`numero.eq.${searchTerm},chave_acesso.eq.${searchTerm}`);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('created_at', { ascending: false });

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
        order_serie: invoice.order_serie,
        order_number: invoice.order_number,
        weight: invoice.peso_total || 0,
        volumes: invoice.quantidade_volumes || 1,
        cubic_meters: invoice.cubagem_total || 0,
        total_value: invoice.valor_total,
        pis_value: invoice.valor_pis || 0,
        cofins_value: invoice.valor_cofins || 0,
        icms_value: invoice.valor_icms || 0,
        status: invoice.situacao,
        xml_data: invoice.xml_content,
        metadata: invoice.metadata,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          razao_social: invoice.customer[0].razao_social,
          cnpj_cpf: invoice.customer[0].cnpj_cpf,
          cidade: invoice.customer[0].cidade,
          estado: invoice.customer[0].estado
        } : undefined,
        products: (invoice.products || []).map((p: any) => ({
          id: p.id,
          product_code: p.codigo_produto,
          description: p.descricao,
          quantity: p.quantidade,
          unit: p.unidade,
          unit_value: p.valor_unitario,
          total_value: p.valor_total,
          weight: p.peso,
          cubic_meters: p.cubagem,
          ncm: p.ncm
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

  async getByAccessKeys(accessKeys: string[]): Promise<NFeWithCustomer[]> {
    try {
      if (!accessKeys || accessKeys.length === 0) return [];

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
        .in('chave_acesso', accessKeys);

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
        metadata: invoice.metadata,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          razao_social: invoice.customer[0].razao_social,
          cnpj_cpf: invoice.customer[0].cnpj_cpf,
          cidade: invoice.customer[0].cidade,
          estado: invoice.customer[0].estado
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
      console.error('Error fetching NFes by Access Keys:', error);
      return [];
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
        metadata: invoice.metadata,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        carrier_id: invoice.carrier_id,
        customer: invoice.customer?.[0] ? {
          id: invoice.customer[0].id,
          razao_social: invoice.customer[0].razao_social,
          cnpj_cpf: invoice.customer[0].cnpj_cpf,
          cidade: invoice.customer[0].cidade,
          estado: invoice.customer[0].estado
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

  async addOccurrence(invoiceId: string, occurrenceData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: invoice, error: fetchError } = await (supabase as any)
        .from('invoices_nfe')
        .select('metadata, situacao, order_number, numero')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = invoice?.metadata || {};
      const occurrences = metadata.occurrences || [];
      
      const newOccurrence = {
        ...occurrenceData,
        id: `occ_${Date.now()}`
      };
      
      occurrences.push(newOccurrence);
      
      const updatedMetadata = {
        ...metadata,
        occurrences
      };

      const { error: updateError } = await (supabase as any)
        .from('invoices_nfe')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;
      
      if (invoice.order_number) {
         try {
           const { data: orderData } = await (supabase as any)
             .from('orders')
             .select('id, metadata')
             .eq('order_number', invoice.order_number)
             .single();
             
           if (orderData) {
             const orderMetadata = orderData.metadata || {};
             const orderOccurrences = orderMetadata.occurrences || [];
             orderOccurrences.push(newOccurrence);
             
             const isDelivered = occurrenceData.codigo === '001' || occurrenceData.codigo === '002';
             const dataEntrega = isDelivered ? { data_entrega_realizada: occurrenceData.data_ocorrencia } : {};
             
             await (supabase as any).from('orders').update({
               metadata: { ...orderMetadata, occurrences: orderOccurrences },
               ...dataEntrega,
               updated_at: new Date().toISOString()
             }).eq('id', orderData.id);
           }
          } catch (e) {
             console.error('Erro ao atualizar metadata do pedido relacionado', e);
          }
      }

      // Sincroniza o status consolidado de toda a timeline com o banco
      try {
        await trackingService.syncDocumentTrackingStatus('nfe', invoiceId, invoice.numero);
      } catch (err) {
        console.error('Erro ao sincronizar status global na NFe', err);
      }

      // Disparar notificação automatizada "fire-and-forget"
      deliveryNotificationHandler.processOccurrenceNotification(
        invoiceId,
        occurrenceData.codigo,
        occurrenceData.descricao,
        invoice?.numero || ''
      ).catch(console.error);

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao adicionar ocorrência:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Pegar os dados da NFe para ter a chave de acesso e poder excluir o XML depois
      const nfe = await this.getById(id);

      // 1. Apagar produtos vinculados
      await (supabase as any).from('invoices_nfe_products').delete().eq('nfe_id', id);

      // 2. Apagar clientes/destinatarios vinculados
      await (supabase as any).from('invoices_nfe_customers').delete().eq('nfe_id', id);

      // 3. Excluir a NFe principal
      const { error } = await (supabase as any)
        .from('invoices_nfe')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };

      // 4. Delete XML document in electronic_documents by access_key
      if (nfe?.access_key) {
        await (supabase as any)
          .from('electronic_documents')
          .delete()
          .eq('access_key', nfe.access_key);
      }

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }
};
