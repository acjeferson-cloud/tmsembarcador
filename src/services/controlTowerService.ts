import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface KPIData {
  totalDeliveries: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  waitingCollection: number;
  activeVehicles: number;
  avgDeliveryTime: number;
  onTimeRate: number;
}

export const controlTowerService = {
  async getKpiData(): Promise<KPIData> {
    const ctx = await TenantContextHelper.getCurrentContext();
    
    // Mocks padrão para manter o layout enquanto não são revitalizados
    let totalDeliveries = 0;
    
    try {
      // KPI 1: Total de Entregas (Ocorrências 01 ou 02 lançadas nas Notas Fiscais)
      let query01 = supabase.from('invoices_nfe').select('*', { count: 'exact', head: true }).contains('metadata', { occurrences: [{ codigo: '01' }] });
      let query02 = supabase.from('invoices_nfe').select('*', { count: 'exact', head: true }).contains('metadata', { occurrences: [{ codigo: '02' }] });
      
      if (ctx?.organizationId) {
        query01 = query01.eq('organization_id', ctx.organizationId);
        query02 = query02.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        query01 = query01.eq('environment_id', ctx.environmentId);
        query02 = query02.eq('environment_id', ctx.environmentId);
      }
      if (ctx?.establishmentId) {
        query01 = query01.eq('establishment_id', ctx.establishmentId);
        query02 = query02.eq('establishment_id', ctx.establishmentId);
      }

      const [res01, res02] = await Promise.all([query01, query02]);
      
      const count01 = res01.count || 0;
      const count02 = res02.count || 0;
      
      totalDeliveries = count01 + count02;

    } catch (error) {
      console.error('Erro ao buscar KPIs', error);
    }

    return {
      totalDeliveries: totalDeliveries,
      inTransit: 89, // Mocks originais
      delivered: 1098,
      delayed: 23,
      waitingCollection: 37,
      activeVehicles: 45,
      avgDeliveryTime: 2.4,
      onTimeRate: 94.2
    };
  }
};
