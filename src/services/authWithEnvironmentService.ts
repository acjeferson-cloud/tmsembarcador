import { supabase } from '../lib/supabase';

export interface ValidateCredentialsResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  name?: string;
  error?: string;
}

export interface LoginWithEnvironmentResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  name?: string;
  codigo?: string;
  foto_perfil_url?: string;
  avatar?: string;
  profile?: string;
  organization_id?: string;
  organization_code?: string;
  organization_name?: string;
  environment_id?: string;
  environment_code?: string;
  environment_name?: string;
  establishment_id?: string;
  establishment_code?: string;
  establishment_name?: string;
  permissions?: any;
  metadata?: any;
  error?: string;
}

export const authWithEnvironmentService = {
  /**
   * Valida apenas as credenciais do usuário (email/senha)
   * Não faz login completo, apenas verifica se as credenciais estão corretas
   */
  async validateCredentials(
    email: string,
    password: string
  ): Promise<ValidateCredentialsResponse> {
    try {
      const { data, error } = await supabase.rpc('validate_user_credentials_only', {
        p_email: email,
        p_password: password,
      });

      if (error) {

        return {
          success: false,
          error: 'Erro ao validar credenciais'
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Credenciais inválidas'
        };
      }

      return data as ValidateCredentialsResponse;
    } catch (err) {

      return {
        success: false,
        error: 'Erro ao validar credenciais'
      };
    }
  },

  /**
   * Faz login com um environment específico
   * Usado após o usuário escolher o environment
   */
  async loginWithEnvironment(
    email: string,
    environmentId: string
  ): Promise<LoginWithEnvironmentResponse> {
    try {
      const { data, error } = await supabase.rpc('tms_login_with_environment', {
        p_email: email,
        p_environment_id: environmentId,
      });

      if (error) {

        return {
          success: false,
          error: 'Erro ao fazer login no ambiente selecionado'
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Dados de login não encontrados'
        };
      }

      return data as LoginWithEnvironmentResponse;
    } catch (err) {

      return {
        success: false,
        error: 'Erro ao fazer login no ambiente selecionado'
      };
    }
  },
};
