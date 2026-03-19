import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface UserActivity {
  id: string;
  organization_id: string;
  environment_id: string;
  user_id?: string;
  user_name: string;
  module_name: string;
  action_type: 'acesso' | 'criacao' | 'edicao' | 'exclusao' | 'aprovacao' | 'reprovacao' | 'importacao' | 'cancelamento' | 'rastreamento';
  description: string;
  created_at: string;
}

export const userActivitiesService = {
  /**
   * Registra uma nova atividade do usuário logado de forma não impeditiva.
   */
  async logActivity(
    module_name: string,
    action_type: UserActivity['action_type'],
    description: string
  ): Promise<void> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      if (!userData) return;

      const orgId = localStorage.getItem('tms-selected-org-id') || userData?.organization_id;
      const envId = localStorage.getItem('tms-selected-env-id') || userData?.environment_id;

      if (!orgId || !envId) return;

      const user_id = String(userData.id || userData.codigo || 'unknown');
      const user_name = userData?.nome || userData?.name || 'Usuário';

      // Clean old records optionally
      if (Math.random() > 0.9) {
         try {
           const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
           await supabase.from('user_activities').delete().lt('created_at', threeDaysAgo);
         } catch(e){}
      }

      if (!supabase) return;
      // @ts-ignore
      await supabase.from('user_activities').insert([{
        organization_id: orgId,
        environment_id: envId,
        user_id,
        user_name,
        module_name,
        action_type,
        description
      }]);
    } catch (error) {
      console.error('Falha ao registrar atividade do usuário:', error);
    }
  },

  /**
   * Busca as atividades recentes do usuário atual
   */
  async getRecentActivities(limit: number = 20): Promise<UserActivity[]> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      if (!userData) return [];

      const orgId = localStorage.getItem('tms-selected-org-id') || userData?.organization_id;
      const envId = localStorage.getItem('tms-selected-env-id') || userData?.environment_id;

      if (!orgId || !envId) return [];
      
      const user_id = String(userData.id || userData.codigo || 'unknown');

      if (!supabase) return [];
      // @ts-ignore
      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Preferir atrelar as atividades ao usuário que está logado
      // if (user_id) { // This block is now redundant as user.id is directly used
      //    query = query.eq('user_id', user_id);
      // }

      const { data, error } = await query;
      
      if (error) {
         console.error('Erro na query getRecentActivities', error);
         return [];
      }

      return data as UserActivity[];
    } catch (error) {
      console.error('Falha ao buscar atividades recentes do usuário:', error);
      return [];
    }
  }
};
