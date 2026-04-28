import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface AIInsightRequest {
  partnerId?: string;
  type: 'carrier' | 'business_partner' | 'cte_comparison';
  partnerName?: string;
  orgId?: string;
  envId?: string;
  estabCode?: string;
  cteData?: any;
}

export interface AIInsightResponse {
  insight: string;
  cached: boolean;
  error?: string;
}

export const aiInsightService = {
  async generateInsight(params: AIInsightRequest): Promise<AIInsightResponse> {
    const { partnerId, type, partnerName, orgId, envId, estabCode } = params;
    try {
      const context = await TenantContextHelper.getCurrentContext();
      
      const finalOrgId = orgId || context?.organizationId;
      const finalEnvId = envId || context?.environmentId;
      const finalEstabId = estabCode || context?.establishmentId;

      const { data, error } = await supabase.functions.invoke('generate-partner-insight', {
        body: { 
          partnerId, 
          type, 
          partnerName, 
          orgId: finalOrgId, 
          envId: finalEnvId, 
          estabCode: finalEstabId,
          cteData: params.cteData
        }
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
