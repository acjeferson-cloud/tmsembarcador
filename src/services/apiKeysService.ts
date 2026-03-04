import { supabase } from '../lib/supabase';

export interface ApiKeyConfig {
  id: string;
  estabelecimento_id: string | null;
  key_type: 'google_maps' | 'recaptcha_site' | 'recaptcha_secret' | 'openai' | 'whatsapp' | 'supabase_service_role' | 'smtp' | 'custom';
  key_name: string;
  description: string | null;
  api_key: string;
  is_active: boolean;
  environment: 'production' | 'staging' | 'development';
  monthly_limit: number | null;
  current_usage: number;
  last_used_at: string | null;
  usage_reset_day: number;
  rotated_at: string;
  rotated_by: string | null;
  rotation_schedule: string | null;
  next_rotation_date: string | null;
  expires_at: string | null;
  alert_threshold_percent: number;
  alert_emails: string[] | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ApiKeyRotationHistory {
  id: string;
  key_config_id: string;
  old_key_hash: string | null;
  new_key_hash: string;
  rotated_by: string | null;
  rotation_reason: string | null;
  rotation_type: 'manual' | 'scheduled' | 'emergency' | 'expired';
  notes: string | null;
  metadata: Record<string, any>;
  rotated_at: string;
}

export interface ApiKeyUsageStats {
  total_keys: number;
  active_keys: number;
  inactive_keys: number;
  expiring_soon: number;
  over_usage_limit: number;
  by_type: Record<string, number>;
}

class ApiKeysService {
  async getAllKeys(estabelecimentoId?: string): Promise<ApiKeyConfig[]> {
    console.log('🔑 [API_KEYS] Starting query...', { estabelecimentoId });

    // Obter contexto org/env do localStorage
    const orgId = localStorage.getItem('tms-selected-org-id');
    const envId = localStorage.getItem('tms-selected-env-id');

    if (!orgId || !envId) {
      console.error('❌ [API_KEYS] Contexto org/env não encontrado');
      throw new Error('Contexto de organização não encontrado');
    }

    let query = supabase
      .from('api_keys_config')
      .select('*')
      .eq('organization_id', orgId)
      .eq('environment_id', envId)
      .order('created_at', { ascending: false });

    if (estabelecimentoId) {
      query = query.eq('estabelecimento_id', estabelecimentoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [API_KEYS] Error:', error);
      throw error;
    }

    console.log(`✅ [API_KEYS] Found: ${data?.length || 0}`);
    return data || [];
  }

  async getKeyByType(keyType: string, estabelecimentoId?: string, environment: string = 'production'): Promise<ApiKeyConfig | null> {
    let query = supabase
      .from('api_keys_config')
      .select('*')
      .eq('key_type', keyType)
      .eq('is_active', true)
      .eq('environment', environment)
      .maybeSingle();

    if (estabelecimentoId) {
      query = query.eq('estabelecimento_id', estabelecimentoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching API key by type:', error);
      throw error;
    }

    return data;
  }

  async getKeyById(id: string): Promise<ApiKeyConfig | null> {
    const { data, error } = await supabase
      .from('api_keys_config')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching API key by ID:', error);
      throw error;
    }

    return data;
  }

  async createKey(keyData: Partial<ApiKeyConfig>): Promise<ApiKeyConfig> {
    console.log('🔑 [API_KEYS] Creating key...');

    // Obter contexto org/env do localStorage
    const orgId = localStorage.getItem('tms-selected-org-id');
    const envId = localStorage.getItem('tms-selected-env-id');

    if (!orgId || !envId) {
      console.error('❌ [API_KEYS] Contexto org/env não encontrado');
      throw new Error('Contexto de organização não encontrado');
    }

    // Função auxiliar para validar UUID
    const isValidUUID = (value: any): boolean => {
      if (!value || value === '1') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    };

    // Preparar dados garantindo que UUIDs inválidos sejam null
    const preparedData = {
      ...keyData,
      organization_id: orgId,
      environment_id: envId,
      created_by: isValidUUID(keyData.created_by) ? keyData.created_by : null,
      rotated_by: isValidUUID(keyData.rotated_by) ? keyData.rotated_by : null,
      estabelecimento_id: isValidUUID(keyData.estabelecimento_id) ? keyData.estabelecimento_id : null
    };

    const { data, error } = await supabase
      .from('api_keys_config')
      .insert([preparedData])
      .select()
      .single();

    if (error) {
      console.error('❌ [API_KEYS] Error creating key:', error);
      throw error;
    }

    console.log('✅ [API_KEYS] Key created successfully');
    return data;
  }

  async updateKey(id: string, updates: Partial<ApiKeyConfig>): Promise<ApiKeyConfig> {
    const { data, error } = await supabase
      .from('api_keys_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      throw error;
    }

    return data;
  }

  async rotateKey(id: string, newApiKey: string, rotatedBy: string | null, reason?: string): Promise<ApiKeyConfig> {
    // Validar UUID
    const isValidUUID = (value: any): boolean => {
      if (!value || value === '1') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    };

    const updates: Partial<ApiKeyConfig> = {
      api_key: newApiKey,
      rotated_by: isValidUUID(rotatedBy) ? rotatedBy : null,
      rotated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('api_keys_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rotating API key:', error);
      throw error;
    }

    return data;
  }

  async deactivateKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys_config')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating API key:', error);
      throw error;
    }
  }

  async deleteKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  async getRotationHistory(keyConfigId: string): Promise<ApiKeyRotationHistory[]> {
    const { data, error } = await supabase
      .from('api_keys_rotation_history')
      .select('*')
      .eq('key_config_id', keyConfigId)
      .order('rotated_at', { ascending: false });

    if (error) {
      console.error('Error fetching rotation history:', error);
      throw error;
    }

    return data || [];
  }

  async incrementUsage(id: string, amount: number = 1): Promise<void> {
    const { error } = await supabase.rpc('increment_api_key_usage', {
      key_id: id,
      increment_amount: amount
    });

    if (error) {
      const { data: currentKey } = await supabase
        .from('api_keys_config')
        .select('current_usage')
        .eq('id', id)
        .single();

      if (currentKey) {
        await supabase
          .from('api_keys_config')
          .update({
            current_usage: currentKey.current_usage + amount,
            last_used_at: new Date().toISOString()
          })
          .eq('id', id);
      }
    }
  }

  async resetMonthlyUsage(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys_config')
      .update({ current_usage: 0 })
      .eq('id', id);

    if (error) {
      console.error('Error resetting monthly usage:', error);
      throw error;
    }
  }

  async getUsageStats(estabelecimentoId?: string): Promise<ApiKeyUsageStats> {
    const keys = await this.getAllKeys(estabelecimentoId);

    const stats: ApiKeyUsageStats = {
      total_keys: keys.length,
      active_keys: keys.filter(k => k.is_active).length,
      inactive_keys: keys.filter(k => !k.is_active).length,
      expiring_soon: 0,
      over_usage_limit: 0,
      by_type: {}
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      if (key.expires_at && new Date(key.expires_at) <= thirtyDaysFromNow) {
        stats.expiring_soon++;
      }

      if (key.monthly_limit && key.current_usage >= key.monthly_limit) {
        stats.over_usage_limit++;
      }

      stats.by_type[key.key_type] = (stats.by_type[key.key_type] || 0) + 1;
    });

    return stats;
  }

  async checkAlerts(estabelecimentoId?: string): Promise<Array<{ key: ApiKeyConfig; alert_type: string; message: string }>> {
    const keys = await this.getAllKeys(estabelecimentoId);
    const alerts: Array<{ key: ApiKeyConfig; alert_type: string; message: string }> = [];

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      if (!key.is_active) return;

      if (key.expires_at && new Date(key.expires_at) <= thirtyDaysFromNow) {
        alerts.push({
          key,
          alert_type: 'expiring',
          message: `Chave ${key.key_name} expira em breve`
        });
      }

      if (key.monthly_limit && key.current_usage >= key.monthly_limit) {
        alerts.push({
          key,
          alert_type: 'limit_exceeded',
          message: `Chave ${key.key_name} excedeu o limite mensal`
        });
      }

      if (key.monthly_limit && key.current_usage >= (key.monthly_limit * key.alert_threshold_percent / 100)) {
        alerts.push({
          key,
          alert_type: 'approaching_limit',
          message: `Chave ${key.key_name} está próxima do limite (${key.alert_threshold_percent}%)`
        });
      }

      if (key.next_rotation_date && new Date(key.next_rotation_date) <= now) {
        alerts.push({
          key,
          alert_type: 'rotation_due',
          message: `Chave ${key.key_name} precisa ser rotacionada`
        });
      }
    });

    return alerts;
  }

  maskApiKey(apiKey: string, visibleChars: number = 4): string {
    if (!apiKey || apiKey.length <= visibleChars * 2) {
      return apiKey;
    }

    const start = apiKey.substring(0, visibleChars);
    const end = apiKey.substring(apiKey.length - visibleChars);
    const masked = '*'.repeat(Math.min(apiKey.length - (visibleChars * 2), 20));

    return `${start}${masked}${end}`;
  }

  getKeyTypeLabel(keyType: string): string {
    const labels: Record<string, string> = {
      google_maps: 'Google Maps API',
      recaptcha_site: 'reCAPTCHA Site Key',
      recaptcha_secret: 'reCAPTCHA Secret Key',
      openai: 'OpenAI API',
      whatsapp: 'WhatsApp Business API',
      supabase_service_role: 'Supabase Service Role',
      smtp: 'SMTP/Email',
      custom: 'Customizada'
    };

    return labels[keyType] || keyType;
  }

  getKeyTypeIcon(keyType: string): string {
    const icons: Record<string, string> = {
      google_maps: '🗺️',
      recaptcha_site: '🔒',
      recaptcha_secret: '🔐',
      openai: '🤖',
      whatsapp: '💬',
      supabase_service_role: '⚡',
      smtp: '📧',
      custom: '🔑'
    };

    return icons[keyType] || '🔑';
  }

  async testKey(keyType: string, apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      switch (keyType) {
        case 'google_maps':
          const mapsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`
          );
          const mapsData = await mapsResponse.json();
          return {
            valid: mapsData.status === 'OK',
            message: mapsData.status === 'OK' ? 'Chave válida' : `Erro: ${mapsData.error_message || mapsData.status}`
          };

        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          return {
            valid: openaiResponse.ok,
            message: openaiResponse.ok ? 'Chave válida' : 'Chave inválida'
          };

        default:
          return {
            valid: true,
            message: 'Teste não disponível para este tipo de chave'
          };
      }
    } catch (error) {
      return {
        valid: false,
        message: `Erro ao testar chave: ${error}`
      };
    }
  }
}

export const apiKeysService = new ApiKeysService();
