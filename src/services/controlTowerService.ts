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
    console.log('=== INICIANDO BUSCA DE KPIs (MOCK DEBUG) ===');
    
    // Se estiver em localhost, já retorna o mock imediatamente para evitar travamentos locais de autenticação/banco
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Ambiente local detectado. Aplicando dados mockados imediatamente...');
      return {
        totalDeliveries: 1245,
        inTransit: 312,
        delivered: 933,
        waitingCollection: 45,
        cfv: 3.85,
        custoPorKg: 0.87,
        shareContrato: 82.5,
        shareSpot: 17.5,
        freteTotal: 84500,
        faturamentoTotal: 2194805,
        onTimeRate: 96.8
      };
    }

    const ctx = await TenantContextHelper.getCurrentContext();
    console.log('Current Context:', ctx);
    
    // MOCK DATA PARA DEMONSTRAÇÃO EM PRODUÇÃO (ALTERNATIVA 1)
    const orgMatch = ctx?.organizationId === 'a7c49619-53f0-4401-9b17-2a830dd4da40';
    const envMatch = ctx?.environmentId === 'b0d1aa42-38bb-4a33-8e51-0c6a0a390fd1';
    const estabMatch = ctx?.establishmentId === '5ca0807a-7e5f-44fe-80c9-cb5e30d5d984';
    
    console.log('Match Org:', orgMatch, 'Match Env:', envMatch, 'Match Estab:', estabMatch);
    
    // Na demonstração em produção, vamos garantir que bate a organização e o ambiente.
    const isMockEnv = orgMatch && envMatch;
                      
    if (isMockEnv) {
      console.log('IDs de Demonstração detectados. Aplicando dados mockados...');
      return {
        totalDeliveries: 1245,
        inTransit: 312,
        delivered: 933,
        waitingCollection: 45,
        cfv: 3.85,
        custoPorKg: 0.87,
        shareContrato: 82.5,
        shareSpot: 17.5,
        freteTotal: 84500,
        faturamentoTotal: 2194805,
        onTimeRate: 96.8
      };
    }
    
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
      
      if (ctx?.organizationId) {
        queryDaily = queryDaily.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        queryDaily = queryDaily.eq('environment_id', ctx.environmentId);
      }
      if (ctx?.establishmentId) {
        queryDaily = queryDaily.eq('establishment_id', ctx.establishmentId);
      }

      // Daily KPIs focus on Today
      const today = new Date().toISOString().split('T')[0];
      queryDaily = queryDaily.eq('data_referencia', today);

      const resDaily = await queryDaily;
      
      if (resDaily.data && resDaily.data.length > 0) {
        dailyData = resDaily.data.reduce((acc, curr) => ({
          total_em_transito: acc.total_em_transito + (Number(curr.total_em_transito) || 0),
          total_entregue: acc.total_entregue + (Number(curr.total_entregue) || 0),
          volume_produtos_reais: acc.volume_produtos_reais + (Number(curr.volume_produtos_reais) || 0),
          volume_peso_kg: acc.volume_peso_kg + (Number(curr.volume_peso_kg) || 0),
          entregues_no_prazo: acc.entregues_no_prazo + (Number(curr.entregues_no_prazo) || 0)
        }), dailyData);
      }
      
      // Mocking auditData temporarily until the view is created in the database to prevent 404 errors
      const faturamento = dailyData.volume_produtos_reais || 0;
      const fakeTotalFrete = faturamento * 0.0385; // Mocking freight as 3.85% of total billing

      auditData = {
        frete_acordado_estimado: fakeTotalFrete * 0.769,
        custo_mercado_spot: fakeTotalFrete * 0.231
      };
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
      
      // Busca NFs com metadados de geolocalização e que não estejam finalizadas há muito tempo
      let query = supabase
        .from('invoices_nfe')
        .select('id, numero, destinatario_nome, carrier_id, situacao, expected_delivery_date:delivery_forecast_date, metadata, created_at, carriers(nome_fantasia)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query;
      
      if (!error && data && data.length > 0) {
        // Filtrar apenas NFs que ganharam latitude e longitude no metadata
        const mappedData: CargoMarker[] = data
          .filter(nf => nf.metadata && nf.metadata.dest_lat && nf.metadata.dest_lng)
          .map(nf => ({
            id: nf.id,
            numero: nf.numero || 'S/N',
            destinatario_nome: nf.destinatario_nome || 'Destinatário N/I',
            carrier_id: (nf.carriers && nf.carriers.nome_fantasia) ? nf.carriers.nome_fantasia : (nf.carrier_id || 'Autônomo / N/I'),
            situacao: nf.situacao || 'pendente',
            expected_delivery_date: nf.expected_delivery_date || nf.created_at,
            lat: Number(nf.metadata.dest_lat),
            lng: Number(nf.metadata.dest_lng),
            is_delayed: !!nf.metadata.is_delayed_mock
          }));
          
        if (mappedData.length > 0) {
          return mappedData;
        }
      }
    } catch (err) {
      console.warn('Falha ao buscar Invoices_nfe reais para o Mapa', err);
    }
    
    return [];
  },

  async getDeliveryFunnel() {
    const ctx = await TenantContextHelper.getCurrentContext();
    
    let query = supabase.from('invoices_nfe').select('situacao, metadata, delivery_forecast_date');
    if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
    if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
    if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);
    
    const { data } = await query.order('created_at', { ascending: false }).limit(1000);
    
    let previstas = 0;
    let concluidas = 0;
    let emRota = 0;
    let atrasadas = 0;
    
    if (data && data.length > 0) {
      data.forEach(nf => {
        // Ignora notas canceladas/rejeitadas do funil principal
        if (['cancelada', 'rejeitada'].includes(nf.situacao?.toLowerCase() || '')) return;
        
        previstas++;
        
        const isAtrasada = nf.metadata?.is_delayed_mock === true || nf.metadata?.is_delayed === true || (nf.delivery_forecast_date && new Date(nf.delivery_forecast_date).getTime() < new Date().getTime() && nf.situacao !== 'entregue');
        
        if (nf.situacao?.toLowerCase() === 'entregue') {
          concluidas++;
        } else if (isAtrasada) {
          atrasadas++;
        } else if (['em_transito', 'saiu_entrega', 'saiu p/ entrega', 'coletada'].includes(nf.situacao?.toLowerCase() || '')) {
          emRota++;
        }
      });
    }
    
    return { previstas, concluidas, emRota, atrasadas };
  },

  async getAnomalyRadar() {
    const ctx = await TenantContextHelper.getCurrentContext();
    
    let query = supabase.from('invoices_nfe').select('situacao, metadata, direction');
    if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
    if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
    if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);
    
    const { data } = await query.order('created_at', { ascending: false }).limit(1000);
    
    let devolucoes = 0;
    let atrasos = 0;
    let sinistros = 0;
    
    if (data && data.length > 0) {
      data.forEach(nf => {
         const occs = nf.metadata?.occurrences || [];
         
         const isAtrasada = nf.metadata?.is_delayed_mock === true || nf.metadata?.is_delayed === true;
         if (isAtrasada && nf.situacao?.toLowerCase() !== 'entregue') {
             atrasos++;
         }
         
         if (nf.situacao?.toLowerCase() === 'devolvida' || nf.direction === 'reverse' || occs.some((o: any) => o.codigo === '03' || o.descricao?.toLowerCase().includes('devol'))) {
            devolucoes++;
         }
         
         if (occs.some((o: any) => o.codigo === '04' || o.descricao?.toLowerCase().includes('sinistro') || o.descricao?.toLowerCase().includes('avaria'))) {
            sinistros++;
         }
      });
    }
    
    return { devolucoes, atrasos, sinistros };
  }
};
