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
    let inTransit = 0;
    
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const isoDate = twentyFourHoursAgo.toISOString();

      // KPI 1: Total de Entregas (Ocorrências 01 ou 02 lançadas nas Notas Fiscais nas últimas 24h)
      let query01 = supabase.from('invoices_nfe').select('*', { count: 'exact', head: true })
        .contains('metadata', { occurrences: [{ codigo: '01' }] })
        .gte('updated_at', isoDate);
        
      let query02 = supabase.from('invoices_nfe').select('*', { count: 'exact', head: true })
        .contains('metadata', { occurrences: [{ codigo: '02' }] })
        .gte('updated_at', isoDate);
      
      // KPI 2: Em Trânsito ou Saiu para Entrega
      let queryTransit = supabase.from('invoices_nfe').select('*', { count: 'exact', head: true })
        .in('situacao', ['em_transito', 'saiu_entrega'])
        .gte('updated_at', isoDate);

      
      if (ctx?.organizationId) {
        query01 = query01.eq('organization_id', ctx.organizationId);
        query02 = query02.eq('organization_id', ctx.organizationId);
        queryTransit = queryTransit.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        query01 = query01.eq('environment_id', ctx.environmentId);
        query02 = query02.eq('environment_id', ctx.environmentId);
        queryTransit = queryTransit.eq('environment_id', ctx.environmentId);
      }
      if (ctx?.establishmentId) {
        query01 = query01.eq('establishment_id', ctx.establishmentId);
        query02 = query02.eq('establishment_id', ctx.establishmentId);
        queryTransit = queryTransit.eq('establishment_id', ctx.establishmentId);
      }

      const [res01, res02, resTransit] = await Promise.all([query01, query02, queryTransit]);
      
      const count01 = res01.count || 0;
      const count02 = res02.count || 0;
      
      totalDeliveries = count01 + count02;
      inTransit = resTransit.count || 0;

    } catch (error) {
      console.error('Erro ao buscar KPIs', error);
    }

    return {
      totalDeliveries: totalDeliveries,
      inTransit: inTransit,
      delivered: 1098,
      delayed: 23,
      waitingCollection: 37,
      activeVehicles: 45,
      avgDeliveryTime: 2.4,
      onTimeRate: 94.2
    };
  }
};
