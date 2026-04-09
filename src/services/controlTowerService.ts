import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface KPIData {
  totalDeliveries: number;
  inTransit: number;
  delivered: number;
  waitingCollection: number;
  activeCarriers: number;
  
  volumeReais: number;
  volumeKg: number;
  onTimeRate: number;
  
  freightEstimated: number;
  freightSpot: number;
}

export const controlTowerService = {
  async getKpiData(): Promise<KPIData> {
    const ctx = await TenantContextHelper.getCurrentContext();
    
    // Fallbacks
    let dailyData = {
      total_em_transito: 0,
      total_entregue: 0,
      volume_produtos_reais: 0,
      volume_peso_kg: 0,
      entregues_no_prazo: 0
    };
    
    let auditData = {
      frete_acordado_estimado: 0,
      custo_mercado_spot: 0
    };
    
    try {
      // 1. Fetch Daily KPIs
      let queryDaily = supabase.from('mv_control_tower_daily_kpis').select('*');
      
      // 2. Fetch Financial Audit
      let queryAudit = supabase.from('mv_control_tower_financial_audit').select('*');
      
      // 3. Fetch Active Carriers
      let queryCarriers = supabase.from('carriers').select('*', { count: 'exact', head: true }).eq('ativo', true);
      
      if (ctx?.organizationId) {
        queryDaily = queryDaily.eq('organization_id', ctx.organizationId);
        queryAudit = queryAudit.eq('organization_id', ctx.organizationId);
        queryCarriers = queryCarriers.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        queryDaily = queryDaily.eq('environment_id', ctx.environmentId);
        queryAudit = queryAudit.eq('environment_id', ctx.environmentId);
        queryCarriers = queryCarriers.eq('environment_id', ctx.environmentId);
      }
      if (ctx?.establishmentId) {
        queryDaily = queryDaily.eq('establishment_id', ctx.establishmentId);
        queryAudit = queryAudit.eq('establishment_id', ctx.establishmentId);
        queryCarriers = queryCarriers.eq('establishment_id', ctx.establishmentId);
      }

      // We only care about Today for Daily KPIs
      const today = new Date().toISOString().split('T')[0];
      queryDaily = queryDaily.eq('data_referencia', today);

      const [resDaily, resAudit, resCarriers] = await Promise.all([queryDaily, queryAudit, queryCarriers]);
      
      let activeCarriersCount = resCarriers.count || 0;
      
      if (resDaily.data && resDaily.data.length > 0) {
        // Sum across all matched records (in case of missing establishment_id grouping)
        dailyData = resDaily.data.reduce((acc, curr) => ({
          total_em_transito: acc.total_em_transito + (Number(curr.total_em_transito) || 0),
          total_entregue: acc.total_entregue + (Number(curr.total_entregue) || 0),
          volume_produtos_reais: acc.volume_produtos_reais + (Number(curr.volume_produtos_reais) || 0),
          volume_peso_kg: acc.volume_peso_kg + (Number(curr.volume_peso_kg) || 0),
          entregues_no_prazo: acc.entregues_no_prazo + (Number(curr.entregues_no_prazo) || 0)
        }), dailyData);
      }
      
      if (resAudit.data && resAudit.data.length > 0) {
        // Sum across all weeks or just the current week?
        // For audit, usually we sum the current week.
        auditData = resAudit.data.reduce((acc, curr) => ({
          frete_acordado_estimado: acc.frete_acordado_estimado + (Number(curr.frete_acordado_estimado) || 0),
          custo_mercado_spot: acc.custo_mercado_spot + (Number(curr.custo_mercado_spot) || 0)
        }), auditData);
      }
    } catch (error) {
      console.error('Erro ao buscar KPIs Reais das Views', error);
    }
    
    const otifRate = dailyData.total_entregue > 0 
      ? (dailyData.entregues_no_prazo / dailyData.total_entregue) * 100 
      : 0;

    return {
      totalDeliveries: dailyData.total_entregue,
      inTransit: dailyData.total_em_transito,
      delivered: dailyData.total_entregue,
      delayed: 0, // TBA from Alerts
      waitingCollection: 0, // TBA 
      activeCarriers: activeCarriersCount,
      
      volumeReais: dailyData.volume_produtos_reais,
      volumeKg: dailyData.volume_peso_kg,
      onTimeRate: Number(otifRate.toFixed(2)),
      
      freightEstimated: auditData.frete_acordado_estimado,
      freightSpot: auditData.custo_mercado_spot
    };
  }
};
