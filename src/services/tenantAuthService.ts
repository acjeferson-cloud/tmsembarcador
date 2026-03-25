import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface LoginResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  organization_id?: string;
  email?: string;
  name?: string;
  profile?: string;
  establishment_id?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan_id: string;
    subscription_status: string;
  };
}

interface SaasAdminLoginResponse {
  success: boolean;
  error?: string;
  admin_id?: string;
  email?: string;
  name?: string;
  role?: string;
  is_saas_admin?: boolean;
  needsMfaSetup?: boolean;
  needsMfaChallenge?: boolean;
}

class TenantAuthService {
  async loginTMS(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.rpc('tms_login', {
        p_email: email,
        p_password: password,
      });

      if (error) {
        logger.error('TMS login error', error, 'TenantAuthService');
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.success) {
        return data;
      }

      const session = await supabase.auth.getSession();
      if (session.data.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            organization_id: data.organization_id,
            user_id: data.user_id,
            profile: data.profile,
            establishment_id: data.establishment_id,
          },
        });

        if (updateError) {
          logger.error('Error updating user metadata', updateError, 'TenantAuthService');
        }
      }

      logger.info(`User logged in: ${email}`, 'TenantAuthService');

      return data;
    } catch (error) {
      logger.error('Login exception', error, 'TenantAuthService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async loginSaasAdmin(email: string, password: string): Promise<SaasAdminLoginResponse> {
    try {
      // 1. BLOCKS CHECK (Brute Force / Rate Limit protection)
      const { data: isBlocked } = await supabase.rpc('check_saas_login_block', { p_email: email });
      if (isBlocked) {
        // Generic error message to prevent enumeration or revealing block status precisely
        return { success: false, error: 'Muitas tentativas falhas. Por segurança, aguarde 15 minutos para tentar novamente.' };
      }

      // 2. Authenticate with Supabase Auth natively
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        logger.error('SaaS admin auth login error', authError, 'TenantAuthService');
        await supabase.rpc('register_saas_login_attempt', { p_email: email, p_success: false, p_type: 'password' });
        return {
          success: false,
          error: 'Usuário ou senha inválidos.',
        };
      }

      if (!authData.session || !authData.user) {
        return { success: false, error: 'Usuário ou senha inválidos.' };
      }

      // 3. We don't verify saas_admins yet, but we should make sure the user is actually a saas_admin
      // This is natively verified if the migration set raw_app_meta_data.is_saas_admin = true
      const isSaasAdminFlag = authData.user.app_metadata?.is_saas_admin === true;
      const saasAdminId = authData.user.app_metadata?.saas_admin_id;

      if (!isSaasAdminFlag) {
        // Fallback check against the DB just in case trigger didn't run or is fresh
        const { data: adminRecord, error: adminError } = await supabase
          .from('saas_admins')
          .select('id, nome, ativo')
          .eq('auth_user_id', authData.user.id)
          .single();
          
        if (adminError || !adminRecord || !adminRecord.ativo) {
          await supabase.rpc('register_saas_login_attempt', { p_email: email, p_success: false, p_type: 'password' });
          await supabase.auth.signOut();
          return { success: false, error: 'Usuário ou senha inválidos.' };
        }

        // Update metadata explicitly
        await supabase.auth.updateUser({
          data: {
            is_saas_admin: true,
            saas_admin_id: adminRecord.id,
          },
        });

        // Registration of successful authentication (fallback), resetting failed attempts counters
        await supabase.rpc('register_saas_login_attempt', { p_email: email, p_success: true, p_type: 'password' });
        logger.info(`SaaS admin logged in (fallback metadata sync): ${email}`, 'TenantAuthService');
        return {
          success: true,
          admin_id: adminRecord.id,
          email: email,
          name: adminRecord.nome,
          is_saas_admin: true
        };
      }

      // Registration of successful authentication, resetting failed attempts counters
      await supabase.rpc('register_saas_login_attempt', { p_email: email, p_success: true, p_type: 'password' });

      // 4. Verificação do Status de MFA
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      let needsMfaSetup = false;
      let needsMfaChallenge = false;

      if (!mfaError && mfaData) {
        if (mfaData.currentLevel === 'aal1') {
          // Checa se tem fatores cadastrados e VERIFICADOS
          const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
          if (!factorsError && factorsData) {
            const verifiedTotp = factorsData.totp.filter(f => f.status === 'verified');
            if (verifiedTotp.length > 0) {
              needsMfaChallenge = true;
            } else {
              needsMfaSetup = true;
            }
          }
        }
      }

      logger.info(`SaaS admin logged in (AAL1): ${email}`, 'TenantAuthService');

      return {
          success: true,
          admin_id: saasAdminId,
          email: email,
          name: authData.user.user_metadata?.name || 'Admin',
          is_saas_admin: true,
          needsMfaSetup,
          needsMfaChallenge
      };
    } catch (error) {
      logger.error('Admin login exception', error, 'TenantAuthService');
      return {
        success: false,
        error: 'Usuário ou senha inválidos.',
      };
    }
  }

  async getCurrentOrganizationId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return null;
      }

      const orgId = session.user.app_metadata?.organization_id;

      if (!orgId) {
        const { data, error } = await supabase.rpc('get_current_organization_id');

        if (error) {
          logger.error('Error getting organization_id', error, 'TenantAuthService');
          return null;
        }

        return data;
      }

      return orgId;
    } catch (error) {
      logger.error('Error in getCurrentOrganizationId', error, 'TenantAuthService');
      return null;
    }
  }

  async isSaasAdmin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return false;
      }

      const isSaasAdmin = session.user.app_metadata?.is_saas_admin === true;

      if (!isSaasAdmin) {
        // Fallback for older RPC
        const { data, error } = await supabase.rpc('is_saas_admin');
        if (error || data !== true) return false;
      }

      // MFA Check: Require AAL2 for SaaS Admin access
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      // If user has AAL2 session, they are fully authenticated
      if (mfaData?.currentLevel === 'aal2') {
        return true;
      }

      // If user has NO factors enrolled, we might force them to setup, but technically
      // SaasAdminLogin handles the setup. If they somehow bypass it, we block them here.
      // Wait, what if they just used a backup code? We check the bypass token.
      const bypassToken = localStorage.getItem('saas_admin_backup_bypass');
      if (bypassToken) {
        const tokenAge = Date.now() - parseInt(bypassToken);
        // Valid for 24 hours
        if (tokenAge < 24 * 60 * 60 * 1000) {
          return true;
        } else {
          localStorage.removeItem('saas_admin_backup_bypass');
        }
      }

      logger.warn('Acesso negado: Administrador exigido nível MFA AAL2', 'TenantAuthService');
      return false;

    } catch (error) {
      logger.error('Error in isSaasAdmin', error, 'TenantAuthService');
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('saas_admin_backup_bypass');
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Logout error', error, 'TenantAuthService');
        throw error;
      }

      logger.info('User logged out', 'TenantAuthService');
    } catch (error) {
      logger.error('Logout exception', error, 'TenantAuthService');
      throw error;
    }
  }

  async validateOrganizationAccess(organizationId: string): Promise<boolean> {
    try {
      const currentOrgId = await this.getCurrentOrganizationId();

      if (!currentOrgId) {
        return false;
      }

      const isSaasAdmin = await this.isSaasAdmin();

      if (isSaasAdmin) {
        return true;
      }

      return currentOrgId === organizationId;
    } catch (error) {
      logger.error('Error validating organization access', error, 'TenantAuthService');
      return false;
    }
  }
}

export const tenantAuthService = new TenantAuthService();
