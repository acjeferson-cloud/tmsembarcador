import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface DashboardExecutiveKPIs {
  custoTotalFrete: number;
  volumeToneladas: number;
  totalEmbarques: number;
  ticketMedio: number;
  slaOtif: number;
  representatividade: number;
  custoKg: number;
  custoDivergencia: number;
  taxasExtrasPercent: number;
}

export interface DashboardTopOcorrencia {
  descricao: string;
  quantidade: number;
}

export interface DashboardMetricasOperacionais {
  leadTimeDias: number;
  slaColetaAtrasoHoras: number;
  backlogVolume: number;
  topOcorrencias: DashboardTopOcorrencia[];
}

export interface DashboardEvolucaoCusto {
  data: string;
  custo: number;
  entregas: number;
}

export interface DashboardMapaCusto {
  cidade: string;
  uf: string;
  custoTotal: number;
  totalEntregas: number;
  volumeKg: number;
  ctes?: {
    id: string;
    numero: string;
    serie: string;
    emissao: string;
    transportador: string;
    valor: number;
  }[];
}

export interface DashboardTopTransportadora {
  nome: string;
  valor: number;
  quantidade: number;
}

export interface DashboardFunilStatus {
  status: string;
  quantidade: number;
}

export interface DashboardFilterDates {
  start: string;
  end: string;
}

export interface DashboardFilters {
  dateRange: DashboardFilterDates;
  carrierId?: string;
  uf?: string;
}

export const dashboardService = {
  async getExecutiveKPIs(filters: DashboardFilters): Promise<DashboardExecutiveKPIs | null> {
    try {
      if (!supabase) return null;
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_executivo_kpis', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_carrier_id: filters.carrierId || null,
        p_uf: filters.uf || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return null;
      }

      return data as DashboardExecutiveKPIs;
    } catch (e) {

      return null;
    }
  },

  async getEvolucaoCustos(filters: DashboardFilters): Promise<DashboardEvolucaoCusto[]> {
    try {
      if (!supabase) return [];
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_evolucao_custos', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_carrier_id: filters.carrierId || null,
        p_uf: filters.uf || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return [];
      }

      return (data || []) as DashboardEvolucaoCusto[];
    } catch (e) {

      return [];
    }
  },

  async getTopTransportadoras(filters: DashboardFilters): Promise<DashboardTopTransportadora[]> {
    try {
      if (!supabase) return [];
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_top_transportadoras', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_uf: filters.uf || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return [];
      }

      return (data || []) as DashboardTopTransportadora[];
    } catch (e) {

      return [];
    }
  },

  async getFunilOperacional(filters: DashboardFilters): Promise<DashboardFunilStatus[]> {
    try {
      if (!supabase) return [];
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_funil_operacional', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_carrier_id: filters.carrierId || null,
        p_uf: filters.uf || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return [];
      }

      return (data || []) as DashboardFunilStatus[];
    } catch (e) {

      return [];
    }
  },

  async getMetricasOperacionais(filters: DashboardFilters): Promise<DashboardMetricasOperacionais | null> {
    try {
      if (!supabase) return null;
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_metricas_operacionais', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_carrier_id: filters.carrierId || null,
        p_uf: filters.uf || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return null;
      }

      return data as DashboardMetricasOperacionais;
    } catch (e) {

      return null;
    }
  },

  async getMapaCustos(filters: DashboardFilters): Promise<DashboardMapaCusto[]> {
    try {
      if (!supabase) return [];
      const context = await TenantContextHelper.getCurrentContext();
      const { data, error } = await supabase.rpc('get_dashboard_mapa_custos', {
        p_start_date: filters.dateRange.start,
        p_end_date: filters.dateRange.end,
        p_carrier_id: filters.carrierId || null,
        p_organization_id: context?.organizationId || null,
        p_environment_id: context?.environmentId || null,
        p_establishment_id: context?.establishmentId || null
      } as any);

      if (error) {

        return [];
      }

      return (data || []) as DashboardMapaCusto[];
    } catch (e) {

      return [];
    }
  }
};
