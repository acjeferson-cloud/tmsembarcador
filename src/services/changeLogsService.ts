import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id?: number;
  user_name: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  organization_id?: string;
  environment_id?: string;
}

export const changeLogsService = {
  async getAll(limit = 100): Promise<ChangeLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getByEntity(entityType: string, entityId: string): Promise<ChangeLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getByUser(userId: number): Promise<ChangeLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  async create(log: Omit<ChangeLog, 'id' | 'created_at'>): Promise<ChangeLog | null> {
    try {
      const context = await TenantContextHelper.getCurrentContext();
      const orgId = context?.organizationId || localStorage.getItem('tms-selected-org-id');
      const envId = context?.environmentId || localStorage.getItem('tms-selected-env-id');

      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .insert({
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          action_type: log.action_type,
          user_id: log.user_id,
          user_name: log.user_name,
          field_name: log.field_name,
          old_value: log.old_value,
          new_value: log.new_value,
          organization_id: orgId || null,
          environment_id: envId || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async getStats() {
    try {
      const logs = await this.getAll();

      const total = logs.length;
      const byActionType: Record<string, number> = {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0
      };

      const byEntityType: Record<string, number> = {};

      logs.forEach(log => {
        byActionType[log.action_type] = (byActionType[log.action_type] || 0) + 1;
        byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
      });

      return {
        total,
        byActionType,
        byEntityType
      };
    } catch (error) {
      return {
        total: 0,
        byActionType: { CREATE: 0, UPDATE: 0, DELETE: 0 },
        byEntityType: {}
      };
    }
  },

  async logCreate(params: {
    entityType: string;
    entityId: string;
    entityName: string;
    userId?: number;
    userName: string;
  }): Promise<void> {
    try {
      await this.create({
        entity_type: params.entityType,
        entity_id: params.entityId,
        action_type: 'CREATE',
        user_id: params.userId,
        user_name: params.userName,
        field_name: 'registro',
        new_value: `Criado: ${params.entityName}`
      });
    } catch (error) {
    }
  },

  async logUpdate(params: {
    entityType: string;
    entityId: string;
    fieldName: string;
    oldValue: any;
    newValue: any;
    userId?: number;
    userName: string;
  }): Promise<void> {
    try {
      const oldValueStr = params.oldValue !== null && params.oldValue !== undefined
        ? String(params.oldValue)
        : '';
      const newValueStr = params.newValue !== null && params.newValue !== undefined
        ? String(params.newValue)
        : '';

      if (oldValueStr !== newValueStr) {
        await this.create({
          entity_type: params.entityType,
          entity_id: params.entityId,
          action_type: 'UPDATE',
          user_id: params.userId,
          user_name: params.userName,
          field_name: params.fieldName,
          old_value: oldValueStr,
          new_value: newValueStr
        });
      }
    } catch (error) {
    }
  },

  async logDelete(params: {
    entityType: string;
    entityId: string;
    entityName: string;
    userId?: number;
    userName: string;
  }): Promise<void> {
    try {
      await this.create({
        entity_type: params.entityType,
        entity_id: params.entityId,
        action_type: 'DELETE',
        user_id: params.userId,
        user_name: params.userName,
        field_name: 'registro',
        old_value: `Excluído: ${params.entityName}`
      });
    } catch (error) {
    }
  },

  async logMultipleUpdates(params: {
    entityType: string;
    entityId: string;
    oldData: any;
    newData: any;
    userId?: number;
    userName: string;
    fieldsToLog?: string[];
  }): Promise<void> {
    try {
      const fields = params.fieldsToLog || Object.keys(params.newData);

      for (const field of fields) {
        if (field === 'updated_at' || field === 'created_at') continue;

        const oldValue = params.oldData?.[field];
        const newValue = params.newData?.[field];

        await this.logUpdate({
          entityType: params.entityType,
          entityId: params.entityId,
          fieldName: field,
          oldValue,
          newValue,
          userId: params.userId,
          userName: params.userName
        });
      }
    } catch (error) {
    }
  }
};
