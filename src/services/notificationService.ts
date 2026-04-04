import { supabase } from '../lib/supabase';

const isValidUUID = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  priority: 'info' | 'warning' | 'critical';
  link?: string;
  is_read: boolean;
  created_at: string;
  organization_id: string;
  environment_id: string;
  user_id?: string;
}

export const notificationService = {
  async getNotifications(limit = 20): Promise<AppNotification[]> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      const { organization_id, environment_id, id: userId } = JSON.parse(savedUser);
      if (!supabase) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id);

      if (userId && isValidUUID(String(userId))) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      if (!supabase) return false;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) return false;
      const { organization_id, environment_id, id: userId } = JSON.parse(savedUser);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  },
  
  async createNotification(payload: Partial<AppNotification>): Promise<boolean> {
    try {
        const savedUser = localStorage.getItem('tms-user');
        const { organization_id, environment_id, id: userId } = JSON.parse(savedUser);
        if (!supabase) return false;
        
        const insertPayload: any = {
            ...payload,
            organization_id,
            environment_id
        };
        
        if (userId && isValidUUID(String(userId))) {
            insertPayload.user_id = userId;
        }

        const { error } = await supabase
          .from('notifications')
          .insert(insertPayload);
        if (error) throw error;
        return true;
    } catch (error) {

        return false;
    }
  }
};
