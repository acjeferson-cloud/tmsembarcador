import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface InteractionLog {
  id: string;
  organization_id?: string;
  environment_id?: string;
  invoice_id: string;
  invoice_number: string;
  business_partner_id: string;
  contact_id?: string;
  contact_name: string;
  channel: 'whatsapp' | 'email';
  event_type: string;
  occurrence_code: string;
  status: 'success' | 'error' | 'pending';
  log_message?: string;
  created_at?: string;
  updated_at?: string;
}

export const interactionLogsService = {
  async getByBusinessPartner(partnerId: string): Promise<InteractionLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('interaction_logs')
        .select('*')
        .eq('business_partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data as InteractionLog[];
    } catch (error) {
      console.error('Error fetching interaction logs:', error);
      return [];
    }
  },

  async insertLog(logData: Omit<InteractionLog, 'id' | 'created_at' | 'updated_at'>): Promise<InteractionLog | null> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      
      const enrichedData = {
        organization_id: context?.organizationId || logData.organization_id,
        environment_id: context?.environmentId || logData.environment_id,
        ...logData
      };

      const { data, error } = await (supabase as any)
        .from('interaction_logs')
        .insert([enrichedData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as InteractionLog;
    } catch (error) {
      console.error('Error inserting interaction log:', error);
      return null;
    }
  }
};
