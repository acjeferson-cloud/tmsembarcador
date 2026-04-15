import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface FreightNatureDict {
  id?: string;
  carrier_id?: string | null;
  xml_tag: string;
  search_string: string;
  operation_type: 'DEVOLUCAO' | 'REENTREGA';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  scope?: 'ESTABLISHMENT' | 'ENVIRONMENT' | 'ORGANIZATION';
}

export const freightNatureDictService = {
  async getAll(): Promise<FreightNatureDict[]> {
    const { data, error } = await supabase
      .from('freight_nature_dict')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByCarrier(carrierId: string): Promise<FreightNatureDict[]> {
    const { data, error } = await supabase
      .from('freight_nature_dict')
      .select('*')
      .or(`carrier_id.eq.${carrierId},carrier_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(dict: Omit<FreightNatureDict, 'id' | 'created_at' | 'updated_at'>): Promise<FreightNatureDict> {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (!ctx || !ctx.organizationId || !ctx.environmentId) {
      throw new Error('Sessão inválida ou contexto não selecionado.');
    }

    const payload = {
      ...dict,
      organization_id: ctx.organizationId,
      environment_id: ctx.environmentId,
      establishment_id: dict.scope === 'ESTABLISHMENT' ? (ctx.establishmentId || null) : null
    };

    const { data, error } = await supabase
      .from('freight_nature_dict')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, dict: Partial<FreightNatureDict>): Promise<FreightNatureDict> {
    const { data, error } = await supabase
      .from('freight_nature_dict')
      .update(dict)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('freight_nature_dict')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
