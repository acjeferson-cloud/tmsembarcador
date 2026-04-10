import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

interface ElectronicDocument {
  id?: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  document_type: 'NFe' | 'CTe';
  model: string;
  document_number: string;
  series: string;
  access_key: string;
  authorization_protocol?: string;
  authorization_date?: string;
  import_date?: string;
  status: 'processing' | 'authorized' | 'cancelled' | 'denied';
  issuer_name: string;
  issuer_document: string;
  issuer_address?: any;
  recipient_name?: string;
  recipient_document?: string;
  recipient_address?: any;
  total_value: number;
  icms_value?: number;
  freight_value?: number;
  total_weight?: number;
  transport_mode?: string;
  xml_content?: string;
  created_at?: string;
  updated_at?: string;
}

export const electronicDocumentsService = {
  async getAll(): Promise<ElectronicDocument[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();

      let query = supabase
        .from('electronic_documents')
        .select('*');

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      // Removed establishmentId to ensure all documents in the environment are loaded
      // Often XMLs are imported by head office (Matriz) and need to be visible across
      // the environment if they are meant for other branches, but we stick to standard:
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('import_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("ERRO NO GET ALL DOCUMENTS ELETRONICOS:", error);
      return [];
    }
  },

  async getById(id: string): Promise<ElectronicDocument | null> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      let query = supabase
        .from('electronic_documents')
        .select('*');

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  },

  async getByAccessKey(accessKey: string): Promise<ElectronicDocument | null> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      let query = supabase
        .from('electronic_documents')
        .select('*')
        .eq('access_key', accessKey);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  },

  async create(document: ElectronicDocument): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { data, error } = await supabase
        .from('electronic_documents')
        .insert({
          ...document,
          organization_id: ctx?.organizationId,
          environment_id: ctx?.environmentId,
          establishment_id: ctx?.establishmentId,
          import_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error) {
      return { success: false, error: 'Erro ao criar documento' };
    }
  },

  async update(id: string, document: Partial<ElectronicDocument>): Promise<{ success: boolean; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { error } = await supabase
        .from('electronic_documents')
        .update({
          ...document,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar documento' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      const { error } = await supabase
        .from('electronic_documents')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao excluir documento' };
    }
  },

  async getByType(type: 'NFe' | 'CTe'): Promise<ElectronicDocument[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (ctx && ctx.organizationId && ctx.environmentId) {
        await TenantContextHelper.setSessionContext(ctx);
      }

      let query = supabase
        .from('electronic_documents')
        .select('*')
        .eq('document_type', type);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('import_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }
};
