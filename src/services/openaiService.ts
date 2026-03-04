import { supabase } from '../lib/supabase';
import { openaiTransactionsService } from './openaiTransactionsService';

export interface OpenAIConfig {
  id?: string;
  api_key: string;
  modelo: string;
  temperatura: number;
  max_tokens: number;
  ativo: boolean;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const openaiService = {
  async getActiveConfig(): Promise<OpenAIConfig | null> {
    try {
      console.log('🤖 [OPENAI] Loading config...');

      // Get organization and environment from localStorage
      const organizationId = localStorage.getItem('organizationId');
      const environmentId = localStorage.getItem('environmentId');

      console.log('🔍 [OPENAI] Context:', { organizationId, environmentId });

      let query = supabase
        .from('openai_config')
        .select('*')
        .eq('ativo', true);

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
        console.error('❌ [OPENAI] Error:', error);
        return null;
      }

      console.log('✅ [OPENAI] Config:', data ? 'Found' : 'Not found');
      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração do OpenAI:', error);
      return null;
    }
  },

  async saveConfig(config: OpenAIConfig): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organization, environment and establishment from localStorage
      const organizationId = localStorage.getItem('organizationId');
      const environmentId = localStorage.getItem('environmentId');
      const establishmentId = localStorage.getItem('establishmentId');

      console.log('💾 [OPENAI] Saving config with context:', {
        organizationId,
        environmentId,
        establishmentId
      });

      // Validate required fields
      if (!organizationId || !environmentId) {
        console.error('❌ [OPENAI] Missing organization_id or environment_id');
        return {
          success: false,
          error: 'Dados de organização ou environment não encontrados. Faça login novamente.'
        };
      }

      // Build the update query to deactivate existing configs for this org/env
      let deactivateQuery = supabase
        .from('openai_config')
        .update({ ativo: false })
        .eq('ativo', true)
        .eq('organization_id', organizationId)
        .eq('environment_id', environmentId);

      // Deactivate existing configs for this org/env
      await deactivateQuery;

      // Insert the new configuration with org/env/establishment context
      const insertData = {
        api_key: config.api_key,
        modelo: config.modelo,
        temperatura: config.temperatura,
        max_tokens: config.max_tokens,
        ativo: config.ativo,
        organization_id: organizationId,
        environment_id: environmentId,
        establishment_id: establishmentId || config.establishment_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 [OPENAI] Insert data:', insertData);

      const { error } = await supabase
        .from('openai_config')
        .insert(insertData);

      if (error) {
        console.error('❌ [OPENAI] Error saving:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [OPENAI] Config saved successfully with context:', {
        organization_id: organizationId,
        environment_id: environmentId,
        establishment_id: establishmentId
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [OPENAI] Exception:', error);
      return { success: false, error: 'Erro ao salvar configuração' };
    }
  },

  async testConnection(apiKey: string, model: string = 'gpt-3.5-turbo'): Promise<{ success: boolean; error?: string }> {
    try {
      // Testar a API Key fazendo uma requisição simples à OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Responda apenas com "OK" se você estiver funcionando.'
            }
          ],
          max_tokens: 10
        })
      });

      const data = await response.json();

      if (response.ok && data.choices && data.choices.length > 0) {
        return { success: true };
      } else if (response.status === 401) {
        return {
          success: false,
          error: 'API Key inválida. Verifique se a chave está correta e ativa no painel da OpenAI.'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Limite de requisições excedido. Verifique sua cota na OpenAI.'
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: `Modelo "${model}" não encontrado ou não disponível para sua conta.`
        };
      } else if (data.error) {
        return {
          success: false,
          error: `Erro da OpenAI: ${data.error.message || 'Erro desconhecido'}`
        };
      } else {
        return {
          success: false,
          error: `Erro ao testar API (Status ${response.status})`
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

  async generateChatCompletion(
    prompt: string,
    config?: Partial<OpenAIConfig>
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      // Buscar configuração ativa se não fornecida
      let activeConfig = config as OpenAIConfig;
      if (!config || !config.api_key) {
        const dbConfig = await this.getActiveConfig();
        if (!dbConfig) {
          return {
            success: false,
            error: 'Nenhuma configuração ativa do OpenAI encontrada. Configure a API Key primeiro.'
          };
        }
        activeConfig = dbConfig;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeConfig.api_key}`
        },
        body: JSON.stringify({
          model: activeConfig.modelo || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: activeConfig.temperatura || 0.7,
          max_tokens: activeConfig.max_tokens || 1000
        })
      });

      const data = await response.json();

      if (response.ok && data.choices && data.choices.length > 0) {
        return {
          success: true,
          response: data.choices[0].message.content
        };
      } else if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Erro ao gerar resposta'
        };
      } else {
        return {
          success: false,
          error: 'Resposta inválida da API OpenAI'
        };
      }
    } catch (error) {
      console.error('Erro ao gerar chat completion:', error);
      return {
        success: false,
        error: 'Erro ao se comunicar com a API OpenAI'
      };
    }
  },

  async logTransaction(params: {
    model: string;
    requestType: 'chat_completion' | 'completion' | 'embedding' | 'image_generation' | 'audio_transcription' | 'text_to_speech';
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    userId?: string;
    establishmentId?: string;
    orderId?: string;
    quoteId?: string;
    status: 'sucesso' | 'erro' | 'timeout' | 'limite_excedido' | 'invalido';
    statusCode?: number;
    errorMessage?: string;
    requestId?: string;
    responseTimeMs?: number;
    requestData?: any;
    responseData?: any;
  }): Promise<void> {
    try {
      const unitCost = this.calculateApiCost(params.model, params.totalTokens);

      await openaiTransactionsService.createTransaction({
        transaction_date: new Date().toISOString(),
        model: params.model,
        request_type: params.requestType,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens,
        total_tokens: params.totalTokens,
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
        request_data: params.requestData,
        response_data: params.responseData
      });
    } catch (error) {
      console.error('Erro ao registrar transação OpenAI:', error);
    }
  },

  calculateApiCost(model: string, totalTokens: number): number {
    const costs: { [key: string]: { input: number; output: number } } = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
      'text-embedding-ada-002': { input: 0.0001, output: 0 },
      'text-embedding-3-small': { input: 0.00002, output: 0 },
      'text-embedding-3-large': { input: 0.00013, output: 0 }
    };

    const modelCost = costs[model] || costs['gpt-3.5-turbo'];
    const costPer1kTokens = (modelCost.input + modelCost.output) / 2;
    return (totalTokens / 1000) * costPer1kTokens;
  }
};
