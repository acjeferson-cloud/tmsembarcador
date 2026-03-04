import { supabase } from '../lib/supabase';

export interface UserEnvironment {
  organization_id: string;
  organization_codigo: string;
  organization_nome: string;
  environment_id: string;
  environment_codigo: string;
  environment_nome: string;
  environment_tipo: string;
  environment_logo_url: string | null;
  establishments_count: number;
  user_id: string;
  user_nome: string;
}

export const userEnvironmentsService = {
  /**
   * Busca todos os environments disponíveis para um usuário pelo email
   */
  async getUserEnvironments(email: string): Promise<UserEnvironment[]> {
    const { data, error } = await supabase.rpc('get_user_available_environments', {
      p_email: email,
    });

    if (error) {
      console.error('Error fetching user environments:', error);
      throw new Error('Não foi possível carregar os ambientes disponíveis');
    }

    return data || [];
  },
};
