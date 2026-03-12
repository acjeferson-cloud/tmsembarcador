import { supabase } from '../lib/supabase';
import { googleMapsTransactionsService } from './googleMapsTransactionsService';

export interface GoogleMapsConfig {
  id?: string;
  api_key: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export const googleMapsService = {
  async getActiveConfig(): Promise<GoogleMapsConfig | null> {
    try {
      // Get organization and environment from localStorage (same keys as OpenAI)
      const organizationId = localStorage.getItem('tms-selected-org-id');
      const environmentId = localStorage.getItem('tms-selected-env-id');
      let query = supabase
        .from('google_maps_config')
        .select('*')
        .eq('is_active', true);

      // Filter by organization and environment if available
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (environmentId) {
        query = query.eq('environment_id', environmentId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  async saveConfig(config: GoogleMapsConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organization, environment and establishment from localStorage
      const organizationId = localStorage.getItem('tms-selected-org-id');
      const environmentId = localStorage.getItem('tms-selected-env-id');
      const savedEstablishment = localStorage.getItem('tms-current-establishment');
      const establishmentId = savedEstablishment ? JSON.parse(savedEstablishment).id : null;
      // Validate required fields
      if (!organizationId || !environmentId) {
        return {
          success: false,
          error: 'Dados de organização ou environment não encontrados. Faça login novamente.'
        };
      }

      // Deactivate existing configs for this org/env
      await supabase
        .from('google_maps_config')
        .update({ is_active: false })
        .eq('is_active', true)
        .eq('organization_id', organizationId)
        .eq('environment_id', environmentId);

      // Insert the new configuration with org/env context
      const insertData = {
        organization_id: organizationId,
        environment_id: environmentId,
        api_key: config.api_key,
        is_active: config.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('google_maps_config')
        .insert(insertData);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao salvar configuração' };
    }
  },

  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Testar a API Key fazendo uma requisição simples ao Google Maps
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=São+Paulo&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        return { success: true };
      } else if (data.status === 'REQUEST_DENIED') {
        return { 
          success: false, 
          error: 'API Key inválida ou sem permissões necessárias. Verifique as configurações no Google Cloud Console.' 
        };
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        return { 
          success: false, 
          error: 'Limite de uso da API excedido. Verifique sua cota no Google Cloud Console.' 
        };
      } else {
        return { 
          success: false, 
          error: `Erro ao testar API: ${data.status} - ${data.error_message || 'Erro desconhecido'}` 
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro de rede ao testar API. Verifique sua conexão com a internet.'
      };
    }
  },

  async logTransaction(params: {
    serviceType: 'geocoding' | 'distance_matrix' | 'directions' | 'autocomplete' | 'places' | 'elevation' | 'timezone' | 'static_map';
    origin?: string;
    destination?: string;
    coordinates?: string;
    userId?: string;
    establishmentId?: string;
    orderId?: string;
    quoteId?: string;
    status: 'sucesso' | 'erro' | 'timeout' | 'limite_excedido' | 'invalido';
    statusCode?: number;
    errorMessage?: string;
    requestId?: string;
    responseTimeMs?: number;
    requestParams?: any;
    apiResponse?: any;
  }): Promise<void> {
    try {
      const unitCost = this.calculateApiCost(params.serviceType);

      await googleMapsTransactionsService.createTransaction({
        transaction_date: new Date().toISOString(),
        service_type: params.serviceType,
        origin: params.origin,
        destination: params.destination,
        coordinates: params.coordinates,
        user_id: undefined, // IGNORADO: O ID de usuário do TMS é numérico, e a coluna no BD é UUID
        establishment_id: params.establishmentId,
        order_id: params.orderId,
        quote_id: params.quoteId,
        unit_cost: unitCost,
        status: params.status,
        status_code: params.statusCode,
        error_message: params.errorMessage,
        request_id: params.requestId,
        response_time_ms: params.responseTimeMs,
        request_params: params.requestParams,
        api_response: params.apiResponse
      });
    } catch (error) {
    }
  },

  calculateApiCost(serviceType: string): number {
    const costs: { [key: string]: number } = {
      geocoding: 0.0050,
      distance_matrix: 0.0100,
      directions: 0.0100,
      autocomplete: 0.0028,
      places: 0.0170,
      elevation: 0.0050,
      timezone: 0.0050,
      static_map: 0.0020
    };

    return costs[serviceType] || 0.0050;
  }
};
