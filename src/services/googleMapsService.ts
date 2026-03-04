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
      console.log('🗺️ [GOOGLE_MAPS] Loading config...');

      // Get organization and environment from localStorage (same keys as OpenAI)
      const organizationId = localStorage.getItem('organizationId');
      const environmentId = localStorage.getItem('environmentId');

      console.log('🔍 [GOOGLE_MAPS] Context:', { organizationId, environmentId });

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
        console.error('❌ [GOOGLE_MAPS] Error:', error);
        return null;
      }

      console.log('✅ [GOOGLE_MAPS] Config:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('❌ [GOOGLE_MAPS] Erro ao buscar configuração:', error);
      return null;
    }
  },

  async saveConfig(config: GoogleMapsConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organization, environment and establishment from localStorage
      const organizationId = localStorage.getItem('organizationId');
      const environmentId = localStorage.getItem('environmentId');
      const establishmentId = localStorage.getItem('establishmentId');

      console.log('💾 [GOOGLE_MAPS] Saving config with context:', {
        organizationId,
        environmentId,
        establishmentId
      });

      // Validate required fields
      if (!organizationId || !environmentId) {
        console.error('❌ [GOOGLE_MAPS] Missing organization_id or environment_id');
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

      // Insert the new configuration with org/env/establishment context
      const insertData = {
        organization_id: organizationId,
        environment_id: environmentId,
        establishment_id: establishmentId || null,
        api_key: config.api_key,
        is_active: config.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 [GOOGLE_MAPS] Insert data:', insertData);

      const { error } = await supabase
        .from('google_maps_config')
        .insert(insertData);

      if (error) {
        console.error('❌ [GOOGLE_MAPS] Error saving:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [GOOGLE_MAPS] Config saved successfully with context:', {
        organization_id: organizationId,
        environment_id: environmentId,
        establishment_id: establishmentId
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [GOOGLE_MAPS] Exception:', error);
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
      console.error('Erro ao testar conexão:', error);
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
        user_id: params.userId,
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
      console.error('Erro ao registrar transação Google Maps:', error);
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
