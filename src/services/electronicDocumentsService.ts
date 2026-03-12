import { supabase } from '../lib/supabase';

interface ElectronicDocument {
  id?: string;
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
      const { data, error } = await supabase
        .from('electronic_documents')
        .select('*')
        .order('import_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<ElectronicDocument | null> {
    try {
      const { data, error } = await supabase
        .from('electronic_documents')
        .select('*')
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
      const { data, error } = await supabase
        .from('electronic_documents')
        .select('*')
        .eq('access_key', accessKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

      return null;
    }
  },

  async create(document: ElectronicDocument): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('electronic_documents')
        .insert({
          ...document,
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
      const { data, error } = await supabase
        .from('electronic_documents')
        .select('*')
        .eq('document_type', type)
        .order('import_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  }
};
