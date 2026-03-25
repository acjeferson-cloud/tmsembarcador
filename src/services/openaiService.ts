import { supabase } from '../lib/supabase';
import { openaiTransactionsService } from './openaiTransactionsService';
import { TenantContextHelper } from '../utils/tenantContext';

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
      if (!supabase) return null;
      const ctx = await TenantContextHelper.getCurrentContext();
      let query = (supabase as any)
        .from('openai_config')
        .select('*')
        .eq('ativo', true);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      
      // Strict establishment isolation if available
      if (ctx?.establishmentId) {
        query = query.eq('establishment_id', ctx.establishmentId);
      } else {
        query = query.is('establishment_id', null);
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

  async saveConfig(config: OpenAIConfig): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) throw new Error('Supabase indisponível');
      const ctx = await TenantContextHelper.getCurrentContext();
      
      if (!ctx?.organizationId || !ctx?.environmentId) {
        return {
          success: false,
          error: 'Dados de organização ou environment não encontrados. Faça login novamente.'
        };
      }

      // First, deactivate any existing configs for this SAME exact hierarchy to ensure single source of truth
      let deactivateQuery = (supabase as any)
        .from('openai_config')
        .update({ ativo: false })
        .eq('organization_id', ctx.organizationId)
        .eq('environment_id', ctx.environmentId);
        
      if (ctx.establishmentId) {
        deactivateQuery = deactivateQuery.eq('establishment_id', ctx.establishmentId);
      } else {
        deactivateQuery = deactivateQuery.is('establishment_id', null);
      }
      
      await deactivateQuery;

      // Check if a discrete record already exists to overwrite instead of insert
      let checkQuery = (supabase as any).from('openai_config')
        .select('id')
        .eq('organization_id', ctx.organizationId)
        .eq('environment_id', ctx.environmentId);

      if (ctx.establishmentId) {
        checkQuery = checkQuery.eq('establishment_id', ctx.establishmentId);
      } else {
        checkQuery = checkQuery.is('establishment_id', null);
      }

      const { data: existingRecords } = await checkQuery.limit(1);

      if (existingRecords && existingRecords.length > 0) {
        // OVERRIDE (Update)
        const { error } = await (supabase as any)
          .from('openai_config')
          .update({
             api_key: config.api_key,
             modelo: config.modelo,
             temperatura: config.temperatura,
             max_tokens: config.max_tokens,
             ativo: config.ativo,
             updated_at: new Date().toISOString()
          })
          .eq('id', existingRecords[0].id);

        if (error) return { success: false, error: error.message };
      } else {
        // DISCRETE CREATION (Insert)
        const insertData = {
          api_key: config.api_key,
          modelo: config.modelo,
          temperatura: config.temperatura,
          max_tokens: config.max_tokens,
          ativo: config.ativo,
          organization_id: ctx.organizationId,
          environment_id: ctx.environmentId,
          establishment_id: ctx.establishmentId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { error } = await (supabase as any)
          .from('openai_config')
          .insert(insertData);

        if (error) return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
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
        request_data: params.requestData,
        response_data: params.responseData
      });
    } catch (error) {
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
