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

  async loginSaasAdmin(email: string, passwordHash: string): Promise<SaasAdminLoginResponse> {
    try {
      const { data, error } = await supabase.rpc('saas_admin_login', {
        p_email: email,
        p_password_hash: passwordHash,
      });

      if (error) {
        logger.error('SaaS admin login error', error, 'TenantAuthService');
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
            is_saas_admin: true,
            saas_admin_id: data.admin_id,
            role: data.role,
          },
        });

        if (updateError) {
          logger.error('Error updating admin metadata', updateError, 'TenantAuthService');
        }
      }

      logger.info(`SaaS admin logged in: ${email}`, 'TenantAuthService');

      return data;
    } catch (error) {
      logger.error('Admin login exception', error, 'TenantAuthService');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

      if (isSaasAdmin) {
        return true;
      }

      const { data, error } = await supabase.rpc('is_saas_admin');

      if (error) {
        logger.error('Error checking saas admin', error, 'TenantAuthService');
        return false;
      }

      return data === true;
    } catch (error) {
      logger.error('Error in isSaasAdmin', error, 'TenantAuthService');
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
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
