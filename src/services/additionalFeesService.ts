import { supabase } from '../lib/supabase';

export interface AdditionalFee {
  id: string;
  freight_rate_table_id: string;
  freight_rate_id: string | null;
  fee_type: 'TDA' | 'TDE' | 'TRT';
  business_partner_id: string | null;
  consider_cnpj_root: boolean;
  state_id: string | null;
  city_id: string | null;
  fee_value: number;
  value_type: 'fixed' | 'percent_weight' | 'percent_value' | 'percent_weight_value' | 'percent_cte';
  minimum_value: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export const additionalFeesService = {
  async getByFreightRateTable(freightRateTableId: string): Promise<AdditionalFee[]> {
    const { data, error } = await supabase
      .from('freight_rate_additional_fees')
      .select('*')
      .eq('freight_rate_table_id', freightRateTableId)
      .is('freight_rate_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByFreightRate(freightRateTableId: string, freightRateId: string): Promise<AdditionalFee[]> {
    const { data, error } = await supabase
      .from('freight_rate_additional_fees')
      .select('*')
      .eq('freight_rate_table_id', freightRateTableId)
      .eq('freight_rate_id', freightRateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(fee: Omit<AdditionalFee, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AdditionalFee> {
    const { data: { user } } = await supabase.auth.getUser();

    const organizationId = sessionStorage.getItem('organization_id');
    const environmentId = sessionStorage.getItem('environment_id');

    const { data, error } = await supabase
      .from('freight_rate_additional_fees')
      .insert({
        ...fee,
        organization_id: organizationId,
        environment_id: environmentId,
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, fee: Partial<AdditionalFee>): Promise<AdditionalFee> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('freight_rate_additional_fees')
      .update({
        ...fee,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('freight_rate_additional_fees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
