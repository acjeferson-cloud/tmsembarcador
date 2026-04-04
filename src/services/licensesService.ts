import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';
import { TenantContextHelper } from '../utils/tenantContext';


export interface License {
  id: string;
  total_licenses: number;
  available_licenses: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface LicenseLog {
  id: string;
  user_id: string | null;
  action: 'assigned' | 'revoked' | 'transferred' | 'purchased';
  from_user_id: string | null;
  to_user_id: string | null;
  quantity: number;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export interface UserWithLicense {
  id?: string;
  codigo: string;
  nome: string;
  email: string;
  perfil: string;
  status: string;
  has_license: boolean;
  license_id?: string;
}

export const licensesService = {
  async getLicenseConfig(): Promise<License | null> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId || !ctx.environmentId) {
        throw new Error('Sessão inválida ou contexto não selecionado.');
      }
      const userData = {
        organization_id: ctx.organizationId,
        environment_id: ctx.environmentId,
        establishment_id: ctx.establishmentId || null
      };
      const organizationId = userData.organization_id;

      if (!organizationId) {
        return null;
      }

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  async reconcileLicenses(totalUsers: number, inUseCount: number): Promise<boolean> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId) return false;
      
      const config = await this.getLicenseConfig();
      const targetTotal = totalUsers; // 1 licença contratada para cada usuário do sistema
      const targetAvailable = targetTotal - inUseCount;

      if (config) {
        if (config.total_licenses !== targetTotal || config.available_licenses !== targetAvailable) {
          await (supabase as any).from('licenses').update({
            total_licenses: targetTotal,
            available_licenses: targetAvailable
          }).eq('id', config.id);
        }
      } else {
        const { error } = await (supabase as any).from('licenses').insert({
          organization_id: ctx.organizationId,
          environment_id: ctx.environmentId,
          total_licenses: targetTotal,
          available_licenses: targetAvailable
        });
        if (error) console.error('Error inserting licenses record:', error);
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  async getUsersWithLicenseStatus(): Promise<UserWithLicense[]> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      const organizationId = savedUser ? JSON.parse(savedUser).organization_id : null;

      let query = supabase
        .from('users')
        .select('id, codigo, nome, email, perfil, status, has_license, license_id')
        .order('nome');
        
      if (organizationId) {
          query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  async assignLicense(userId: string, performedBy: string, notes?: string): Promise<boolean> {
    try {
      const config = await this.getLicenseConfig();

      if (!config || config.available_licenses <= 0) {
        throw new Error('Não há licenças disponíveis');
      }

      const { error: updateUserError } = await (supabase as any)
        .from('users')
        .update({ has_license: true })
        .eq('codigo', userId);

      if (updateUserError) throw updateUserError;

      const { error: updateLicensesError } = await (supabase as any)
        .from('licenses')
        .update({
          available_licenses: config.available_licenses - 1
        })
        .eq('id', config.id);

      if (updateLicensesError) throw updateLicensesError;

      const { error: logError } = await (supabase as any)
        .from('license_logs')
        .insert({
          user_id: userId,
          action: 'assigned',
          performed_by: performedBy,
          notes: notes || `Licença atribuída ao usuário ${userId}`
        });

      if (logError) throw logError;

      await changeLogsService.logUpdate({
        entityType: 'license',
        entityId: userId,
        fieldName: 'has_license',
        oldValue: 'false',
        newValue: 'true',
        userName: performedBy
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  async revokeLicense(userId: string, performedBy: string, notes?: string): Promise<boolean> {
    try {
      const config = await this.getLicenseConfig();

      if (!config) {
        throw new Error('Configuração de licenças não encontrada');
      }

      const { error: updateUserError } = await (supabase as any)
        .from('users')
        .update({ has_license: false })
        .eq('codigo', userId);

      if (updateUserError) throw updateUserError;

      const { error: updateLicensesError } = await (supabase as any)
        .from('licenses')
        .update({
          available_licenses: config.available_licenses + 1
        })
        .eq('id', config.id);

      if (updateLicensesError) throw updateLicensesError;

      const { error: logError } = await (supabase as any)
        .from('license_logs')
        .insert({
          user_id: userId,
          action: 'revoked',
          performed_by: performedBy,
          notes: notes || `Licença removida do usuário ${userId}`
        });

      if (logError) throw logError;

      await changeLogsService.logUpdate({
        entityType: 'license',
        entityId: userId,
        fieldName: 'has_license',
        oldValue: 'true',
        newValue: 'false',
        userName: performedBy
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  async transferLicense(
    fromUserId: string,
    toUserId: string,
    performedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error: updateFromError } = await (supabase as any)
        .from('users')
        .update({ has_license: false })
        .eq('codigo', fromUserId);

      if (updateFromError) throw updateFromError;

      const { error: updateToError } = await (supabase as any)
        .from('users')
        .update({ has_license: true })
        .eq('codigo', toUserId);

      if (updateToError) throw updateToError;

      const { error: logError } = await (supabase as any)
        .from('license_logs')
        .insert({
          action: 'transferred',
          from_user_id: fromUserId,
          to_user_id: toUserId,
          performed_by: performedBy,
          notes: notes || `Licença transferida de ${fromUserId} para ${toUserId}`
        });

      if (logError) throw logError;

      await changeLogsService.logUpdate({
        entityType: 'license',
        entityId: fromUserId,
        fieldName: 'has_license',
        oldValue: 'true',
        newValue: 'false',
        userName: performedBy
      });

      await changeLogsService.logUpdate({
        entityType: 'license',
        entityId: toUserId,
        fieldName: 'has_license',
        oldValue: 'false',
        newValue: 'true',
        userName: performedBy
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  async purchaseNewLicenses(quantity: number, performedBy: string): Promise<boolean> {
    try {
      const config = await this.getLicenseConfig();
      const ctx = await TenantContextHelper.getCurrentContext();

      if (!config) {
        if (!ctx || !ctx.organizationId) throw new Error('Contexto inválido');
        // Insere a primeira configuração de licenças para este ambiente
        const { error: insertError } = await (supabase as any).from('licenses').insert({
          organization_id: ctx.organizationId,
          environment_id: ctx.environmentId,
          total_licenses: quantity,
          available_licenses: quantity
        });
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await (supabase as any)
          .from('licenses')
          .update({
            total_licenses: config.total_licenses + quantity,
            available_licenses: config.available_licenses + quantity
          })
          .eq('id', config.id);

        if (updateError) throw updateError;
      }

      const { error: logError } = await (supabase as any)
        .from('license_logs')
        .insert({
          action: 'purchased',
          quantity: quantity,
          performed_by: performedBy,
          notes: `${quantity} nova(s) licença(s) adquirida(s)`
        });

      if (logError) throw logError;

      let finalConfig = config;
      if (!finalConfig) {
        finalConfig = await this.getLicenseConfig();
      }

      if (finalConfig) {
        await changeLogsService.logUpdate({
          entityType: 'license_config',
          entityId: finalConfig.id,
          fieldName: 'total_licenses',
          oldValue: config ? config.total_licenses.toString() : '0',
          newValue: (config ? config.total_licenses : 0 + quantity).toString(),
          userName: performedBy
        });

        await changeLogsService.logUpdate({
          entityType: 'license_config',
          entityId: finalConfig.id,
          fieldName: 'available_licenses',
          oldValue: config ? config.available_licenses.toString() : '0',
          newValue: (config ? config.available_licenses : 0 + quantity).toString(),
          userName: performedBy
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  async getLicenseLogs(limit: number = 50): Promise<LicenseLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('license_logs')
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

  async checkUserLicense(email: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('has_license')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        return false;
      }

      return data?.has_license || false;
    } catch (error) {
      return false;
    }
  },

  async assignLicenseWithKey(userId: string, performedBy: string, notes?: string): Promise<{ success: boolean; licenseKey?: string; error?: string }> {
    try {
      const config = await this.getLicenseConfig();

      if (!config || config.available_licenses <= 0) {
        return { success: false, error: 'Não há licenças disponíveis' };
      }

      // Gerar código único de licença usando a função do banco
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_unique_license_key');

      if (keyError || !keyData) {
        return { success: false, error: 'Erro ao gerar código de licença' };
      }

      const licenseKey = keyData as string;

      // Atualizar usuário com licença e código
      const { error: updateUserError } = await (supabase as any)
        .from('users')
        .update({
          has_license: true,
          license_id: licenseKey
        })
        .eq('codigo', userId);

      if (updateUserError) {
        return { success: false, error: updateUserError.message };
      }

      // Atualizar quantidade de licenças disponíveis
      const { error: updateLicensesError } = await (supabase as any)
        .from('licenses')
        .update({
          available_licenses: config.available_licenses - 1
        })
        .eq('id', config.id);

      if (updateLicensesError) {
        return { success: false, error: updateLicensesError.message };
      }

      // Criar log
      const { error: logError } = await (supabase as any)
        .from('license_logs')
        .insert({
          user_id: userId,
          action: 'assigned',
          performed_by: performedBy,
          notes: notes || `Licença ${licenseKey} atribuída ao usuário ${userId}`
        });

      if (logError) {
      }

      await changeLogsService.logUpdate({
        entityType: 'license',
        entityId: userId,
        fieldName: 'license_key',
        oldValue: '',
        newValue: licenseKey,
        userName: performedBy
      });

      return { success: true, licenseKey };
    } catch (error) {
      return { success: false, error: 'Erro ao atribuir licença' };
    }
  },

  async assignAllUsersLicenses(performedBy: string): Promise<{ success: boolean; assigned: number; errors: string[] }> {
    try {
      const users = await this.getUsersWithLicenseStatus();
      const config = await this.getLicenseConfig();

      if (!config) {
        return { success: false, assigned: 0, errors: ['Configuração de licenças não encontrada'] };
      }

      const usersWithoutLicense = users.filter(u => !u.has_license);
      const errors: string[] = [];
      let assigned = 0;

      // Verificar se há licenças suficientes
      if (config.available_licenses < usersWithoutLicense.length) {
        // Aumentar quantidade de licenças automaticamente
        const additionalLicenses = usersWithoutLicense.length - config.available_licenses;
        const purchased = await this.purchaseNewLicenses(additionalLicenses, performedBy);

        if (!purchased) {
          return {
            success: false,
            assigned: 0,
            errors: ['Não foi possível aumentar quantidade de licenças']
          };
        }
      }

      // Atribuir licença para cada usuário sem licença
      for (const user of usersWithoutLicense) {
        const result = await this.assignLicenseWithKey(user.codigo, performedBy,
          `Licença atribuída em massa - ${new Date().toLocaleDateString()}`);

        if (result.success) {
          assigned++;
        } else {
          errors.push(`${user.nome}: ${result.error || 'Erro desconhecido'}`);
        }
      }

      return { success: assigned > 0, assigned, errors };
    } catch (error) {
      return { success: false, assigned: 0, errors: ['Erro ao processar atribuição em massa'] };
    }
  }
};
