import { supabase } from '../lib/supabase';

export interface SimulationFilters {
  period: string;
  startDate: string;
  endDate: string;
  carrierIds: string[];
  route: string;
  originState: string;
  originCity: string;
  destinationState: string;
  destinationCity: string;
  weightRange: string;
  modal?: string;
  businessPartnerId?: string;
  minWeight?: number;
  maxWeight?: number;
  minValue?: number;
  maxValue?: number;
}

export interface SimulationResult {
  carrierId: string;
  totalCost: number;
  averageCost: number;
  optimizedOrdersCount: number;
  carrierName?: string;
  color?: string;
}

export interface SimulationResponse {
  success: boolean;
  results: SimulationResult[];
  totalOrdersProcessed: number;
  message?: string;
  error?: string;
}

export const logisticsSimulatorService = {
  /**
   * Dispara a simulação em lote no Backend (Edge Function)
   */
  async simulateBatch(filters: SimulationFilters): Promise<SimulationResponse> {
    try {
      const storedUser = localStorage.getItem('tms-user');
      let organizationId = null;
      let environmentId = null;

      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        organizationId = userObj.organization_id || userObj.user?.organization_id;
        environmentId = userObj.environment_id || userObj.user?.environment_id;
      }
      if (!organizationId || !environmentId) {
        throw new Error('Ambiente não selecionado.');
      }

      if (!filters.startDate || !filters.endDate) {
        throw new Error('Período de datas é obrigatório.');
      }

      if (!filters.carrierIds || filters.carrierIds.length < 2) {
        throw new Error('Selecione pelo menos duas transportadoras para comparar.');
      }

      const payload = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        carrierIds: filters.carrierIds,
        organizationId,
        environmentId,
        modal: filters.modal !== 'all' ? filters.modal : undefined,
        businessPartnerId: filters.businessPartnerId,
        destinationState: filters.destinationState !== 'all' ? filters.destinationState : undefined,
        destinationCity: filters.destinationCity !== 'all' ? filters.destinationCity : undefined,
        minWeight: filters.minWeight,
        maxWeight: filters.maxWeight,
        minValue: filters.minValue,
        maxValue: filters.maxValue
      };

      const { data, error } = await supabase!.functions.invoke('simulate-freight-batch', {
        body: payload
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        throw new Error(error.message || 'Falha ao processar simulação. Verifique as configurações das tabelas.');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro reportado pelo simulador.');
      }

      // Populate carrier names fetching from DB if needed
      // Actually, we can fetch all carriers in frontend and map the names
      return data as SimulationResponse;
    } catch (error: any) {
      console.error('Logistics Simulator Error:', error);
      return {
        success: false,
        results: [],
        totalOrdersProcessed: 0,
        error: error.message || 'Ocorreu um erro ao rodar a simulação.'
      };
    }
  }
};
