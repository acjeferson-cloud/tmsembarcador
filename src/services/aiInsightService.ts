import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface AIInsightRequest {
  partnerId: string;
  type: 'carrier' | 'business_partner';
  partnerName: string;
  orgId?: string;
  envId?: string;
  estabCode?: string;
}

export interface AIInsightResponse {
  insight: string;
  cached: boolean;
  error?: string;
}

export const aiInsightService = {
  async generateInsight({ partnerId, type, partnerName, orgId, envId, estabCode }: AIInsightRequest): Promise<AIInsightResponse> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      
      const finalOrgId = orgId || context?.organizationId;
      const finalEnvId = envId || context?.environmentId;
      const finalEstabId = estabCode || context?.establishmentId;

      const { data, error } = await supabase.functions.invoke('generate-partner-insight', {
        body: { partnerId, type, partnerName, orgId: finalOrgId, envId: finalEnvId, estabCode: finalEstabId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        insight: data.insight,
        cached: data.cached || false
      };
    } catch (error: any) {

      return {
        insight: '',
        cached: false,
        error: error.message || 'Erro ao gerar análise com IA'
      };
    }
  }
};
