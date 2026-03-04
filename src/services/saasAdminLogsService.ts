import { supabase } from '../lib/supabase';

export interface AdminLog {
  id: string;
  admin_user_id?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  tenant_id?: string;
  description: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const saasAdminLogsService = {
  async getLogs(filters?: {
    tenantId?: string;
    adminUserId?: string;
    actionType?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AdminLog[]> {
    try {
      let query = supabase
        .from('saas_admin_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  },

  async createLog(log: Partial<AdminLog>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('saas_admin_logs')
        .insert({
          ...log,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, id: data.id };
    } catch (error: any) {
      console.error('Erro ao criar log:', error);
      return { success: false, error: error.message };
    }
  },

  async logAction(
    actionType: string,
    resourceType: string,
    description: string,
    options?: {
      resourceId?: string;
      tenantId?: string;
      changes?: any;
    }
  ): Promise<void> {
    try {
      await this.createLog({
        action_type: actionType,
        resource_type: resourceType,
        description,
        resource_id: options?.resourceId,
        tenant_id: options?.tenantId,
        changes: options?.changes
      });
    } catch (error) {
      console.error('Erro ao registrar ação:', error);
    }
  },

  async getLogsByTenant(tenantId: string, limit: number = 50): Promise<AdminLog[]> {
    return this.getLogs({ tenantId, limit });
  },

  async getLogsByAction(actionType: string, limit: number = 50): Promise<AdminLog[]> {
    return this.getLogs({ actionType, limit });
  },

  async getLogsByResource(resourceType: string, resourceId: string, limit: number = 50): Promise<AdminLog[]> {
    return this.getLogs({ resourceType, limit });
  }
};
