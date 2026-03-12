import { supabase } from '../lib/supabase';

interface SaasMetric {
  id: string;
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  metadata?: any;
  created_at: string;
}

interface HealthCheck {
  id: string;
  database_id: string;
  check_type: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message?: string;
  details?: any;
  checked_at: string;
}

interface SaasAlert {
  id: string;
  tenant_id?: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'ignored';
  metadata?: any;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
}

interface DatabaseConnection {
  id: string;
  database_id: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  response_time_ms?: number;
  last_check_at: string;
  error_message?: string;
}

export const saasMetricsService = {
  // ===== MÉTRICAS =====
  async getMetrics(tenantId?: string, metricType?: string): Promise<SaasMetric[]> {
    try {
      let query = supabase
        .from('saas_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getMetricsSummary(tenantId: string): Promise<any> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('saas_metrics')
        .select('metric_type, metric_value')
        .eq('tenant_id', tenantId)
        .gte('period_start', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const summary: any = {};
      data?.forEach(metric => {
        if (!summary[metric.metric_type]) {
          summary[metric.metric_type] = {
            total: 0,
            count: 0,
            average: 0
          };
        }
        summary[metric.metric_type].total += metric.metric_value;
        summary[metric.metric_type].count += 1;
        summary[metric.metric_type].average = summary[metric.metric_type].total / summary[metric.metric_type].count;
      });

      return summary;
    } catch (error) {

      return {};
    }
  },

  // ===== HEALTH CHECKS =====
  async getHealthChecks(databaseId?: string): Promise<HealthCheck[]> {
    try {
      let query = supabase
        .from('saas_health_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(50);

      if (databaseId) {
        query = query.eq('database_id', databaseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async getHealthStatus(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('saas_health_checks')
        .select('status')
        .order('checked_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const latestCheck = data?.[0];
      return {
        status: latestCheck?.status || 'unknown',
        lastCheck: latestCheck?.checked_at || null
      };
    } catch (error) {

      return { status: 'unknown', lastCheck: null };
    }
  },

  // ===== ALERTAS =====
  async getAlerts(tenantId?: string, status?: string): Promise<SaasAlert[]> {
    try {
      let query = supabase
        .from('saas_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async createAlert(alert: Partial<SaasAlert>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saas_alerts')
        .insert(alert)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  async updateAlertStatus(id: string, status: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { status };

      if (status === 'acknowledged') {
        updates.acknowledged_at = new Date().toISOString();
        if (userId) updates.acknowledged_by = userId;
      }

      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('saas_alerts')
        .update(updates)
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  },

  // ===== DATABASE CONNECTIONS =====
  async getDatabaseConnections(): Promise<DatabaseConnection[]> {
    try {
      const { data, error } = await supabase
        .from('saas_database_connections')
        .select('*')
        .order('last_check_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  }
};
