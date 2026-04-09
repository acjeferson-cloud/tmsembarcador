import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface KPIData {
  totalDeliveries: number;
  inTransit: number;
  delivered: number;
  waitingCollection: number;
  
  // Executive Metrics
  cfv: number;               // Custo de Frete sobre Vendas (%)
  custoPorKg: number;        // Custo Médio por KG
  shareContrato: number;     // % do frete em contrato
  shareSpot: number;         // % do frete em spot
  freteTotal: number;        // Total de frete gasto
  faturamentoTotal: number;
  
  onTimeRate: number;
}

export interface CargoMarker {
  id: string;
  numero: string;
  destinatario_nome: string;
  carrier_id: string;
  situacao: string;
  expected_delivery_date: string;
  lat: number;
  lng: number;
  is_delayed: boolean;
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
      let queryDaily = supabase.from('mv_control_tower_daily_kpis').select('*');
      let queryAudit = supabase.from('mv_control_tower_financial_audit').select('*');
      
      if (ctx?.organizationId) {
        queryDaily = queryDaily.eq('organization_id', ctx.organizationId);
        queryAudit = queryAudit.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        queryDaily = queryDaily.eq('environment_id', ctx.environmentId);
        queryAudit = queryAudit.eq('environment_id', ctx.environmentId);
      }
      if (ctx?.establishmentId) {
        queryDaily = queryDaily.eq('establishment_id', ctx.establishmentId);
        queryAudit = queryAudit.eq('establishment_id', ctx.establishmentId);
      }

      // Daily KPIs focus on Today
      const today = new Date().toISOString().split('T')[0];
      queryDaily = queryDaily.eq('data_referencia', today);

      const [resDaily, resAudit] = await Promise.all([queryDaily, queryAudit]);
      
      if (resDaily.data && resDaily.data.length > 0) {
        dailyData = resDaily.data.reduce((acc, curr) => ({
          total_em_transito: acc.total_em_transito + (Number(curr.total_em_transito) || 0),
          total_entregue: acc.total_entregue + (Number(curr.total_entregue) || 0),
          volume_produtos_reais: acc.volume_produtos_reais + (Number(curr.volume_produtos_reais) || 0),
          volume_peso_kg: acc.volume_peso_kg + (Number(curr.volume_peso_kg) || 0),
          entregues_no_prazo: acc.entregues_no_prazo + (Number(curr.entregues_no_prazo) || 0)
        }), dailyData);
      }
      
      if (resAudit.data && resAudit.data.length > 0) {
        auditData = resAudit.data.reduce((acc, curr) => ({
          frete_acordado_estimado: acc.frete_acordado_estimado + (Number(curr.frete_acordado_estimado) || 0),
          custo_mercado_spot: acc.custo_mercado_spot + (Number(curr.custo_mercado_spot) || 0)
        }), auditData);
      }
    } catch (error) {
      console.error('Erro ao buscar KPIs Reais das Views', error);
    }
    
    // Calculations
    const otifRate = dailyData.total_entregue > 0 
      ? (dailyData.entregues_no_prazo / dailyData.total_entregue) * 100 
      : 0;

    const freteContrato = auditData.frete_acordado_estimado || 0;
    const freteSpot = auditData.custo_mercado_spot || 0;
    const freteTotal = freteContrato + freteSpot;
    
    const faturamentoTotal = dailyData.volume_produtos_reais || 0;
    const pesoTotal = dailyData.volume_peso_kg || 0;

    const cfv = faturamentoTotal > 0 ? (freteTotal / faturamentoTotal) * 100 : 0;
    const custoPorKg = pesoTotal > 0 ? (freteTotal / pesoTotal) : 0;
    
    const shareContrato = freteTotal > 0 ? (freteContrato / freteTotal) * 100 : 0;
    const shareSpot = freteTotal > 0 ? (freteSpot / freteTotal) * 100 : 0;

    return {
      totalDeliveries: dailyData.total_entregue,
      inTransit: dailyData.total_em_transito,
      delivered: dailyData.total_entregue,
      waitingCollection: 0,
      
      cfv: Number(cfv.toFixed(2)),
      custoPorKg: Number(custoPorKg.toFixed(2)),
      shareContrato: Number(shareContrato.toFixed(1)),
      shareSpot: Number(shareSpot.toFixed(1)),
      freteTotal: freteTotal,
      faturamentoTotal: faturamentoTotal,
      
      onTimeRate: Number(otifRate.toFixed(1))
    };
  },

  async getMapMarkers(): Promise<CargoMarker[]> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      let query = supabase.from('mv_control_tower_map_markers').select('*');
      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query;
      if (!error && data && data.length > 0 && data[0].markers) {
        return data[0].markers as CargoMarker[];
      }
    } catch (err) {
      console.warn('MV de Marcadores ainda não gerada, caindo para Mock Visual.', err);
    }
    
    // Fallback/Mock até o script SQL ser executado pelo Usuário
    return [
      {
        id: 'NF1020',
        numero: '1020',
        destinatario_nome: 'Lojas Americanas - CD SP',
        carrier_id: 'RÁPIDO COMETA',
        situacao: 'em_transito',
        expected_delivery_date: new Date(Date.now() + 86400000).toISOString(),
        lat: -23.5505,
        lng: -46.6333,
        is_delayed: false
      },
      {
        id: 'NF1021',
        numero: '1021',
        destinatario_nome: 'Magalu S.A.',
        carrier_id: 'JAMEF',
        situacao: 'em_transito',
        expected_delivery_date: new Date(Date.now() - 86400000).toISOString(),
        lat: -22.9068,
        lng: -43.1729,
        is_delayed: true
      },
      {
        id: 'NF1022',
        numero: '1022',
        destinatario_nome: 'Mercado Livre Holding',
        carrier_id: 'JAMEF',
        situacao: 'entregue',
        expected_delivery_date: new Date().toISOString(),
        lat: -23.9535,
        lng: -46.3350,
        is_delayed: false
      },
      {
        id: 'NF1023',
        numero: '1023',
        destinatario_nome: 'B2W Digital SA',
        carrier_id: 'TNT MERCURIO',
        situacao: 'saiu_entrega',
        expected_delivery_date: new Date(Date.now() + 1200000).toISOString(),
        lat: -23.6821,
        lng: -46.5953,
        is_delayed: false
      }
    ];
  }
};
