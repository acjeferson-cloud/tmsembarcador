import { supabase } from '../lib/supabase';

export interface AIInsightRequest {
  partnerId: string;
  type: 'carrier' | 'business_partner';
  partnerName: string;
}

export interface AIInsightResponse {
  insight: string;
  cached: boolean;
  error?: string;
}

export const aiInsightService = {
  async generateInsight({ partnerId, type, partnerName }: AIInsightRequest): Promise<AIInsightResponse> {
    try {
      const orgId = localStorage.getItem('tms-selected-org-id');

      const { data, error } = await supabase.functions.invoke('generate-partner-insight', {
        body: { partnerId, type, partnerName, orgId }
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
