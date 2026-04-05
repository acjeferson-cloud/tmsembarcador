import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';
import { TenantContextHelper } from '../utils/tenantContext';


// Interface estendida para a UI usar as propriedades virtuais (total_licenses e available_licenses)
// mas refletindo o banco de dados original (max_users).
export interface License {
  id: string;
  organization_id: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  max_users: number;
  max_establishments: number;
  max_orders_month: number;
  ativa: boolean;
  created_at: string;
  
  // Propriedades virtuais adicionadas para facilitar a UI
  total_licenses?: number;
  available_licenses?: number;
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
      
      const { data, error } = await supabase!
        .from('licenses')
        .select('*')
        .eq('organization_id', organizationId)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }
      
      if (data) {
        const { count } = await supabase!.from('users').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('has_license', true);
        const configData: any = data;
        configData.total_licenses = configData.max_users;
        configData.available_licenses = configData.max_users - (count || 0);
      }
      return data as any as License;
    } catch (error) {
      return null;
    }
  },

  async reconcileLicenses(totalUsers: number): Promise<boolean> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!ctx || !ctx.organizationId) return false;
      if (!supabase) return false;
      
      const config = await this.getLicenseConfig();
      const targetTotal = totalUsers; // 1 licença contratada para cada usuário do sistema

      if (config) {
        if (config.max_users !== targetTotal) {
          await (supabase as any).from('licenses').update({
            max_users: targetTotal
          }).eq('id', config.id);
        }
      } else {
        await (supabase as any).from('licenses').insert({
          organization_id: ctx.organizationId,
          tipo: 'custom',
          data_inicio: new Date().toISOString(),
          max_users: targetTotal,
          max_establishments: 10,
          max_orders_month: 1000,
          ativa: true
        });
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

      if (!config || (config.available_licenses !== undefined && config.available_licenses <= 0)) {
        throw new Error('Não há licenças disponíveis');
      }

      const { error: updateUserError } = await (supabase as any)
        .from('users')
        .update({ has_license: true })
        .eq('codigo', userId);

      if (updateUserError) throw updateUserError;

      // O campo available_licenses não existe no banco, é um cálculo virtual por usuário,
      // logo a atualização foi removida para evitar erro Http 400.

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

      // O campo available_licenses não existe no banco (é derivado da contagem de usuários com licença).
      // Evita o Http 400 ao tentar atualizar coluna que não existe.

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
          tipo: 'custom',
          data_inicio: new Date().toISOString(),
          max_users: quantity,
          max_establishments: 10,
          max_orders_month: 1000,
          ativa: true
        });
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await (supabase as any)
          .from('licenses')
          .update({
            max_users: (config.max_users || 0) + quantity
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
          fieldName: 'max_users',
          oldValue: config ? (config.max_users || 0).toString() : '0',
          newValue: ((config ? config.max_users : 0) + quantity).toString(),
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

      if (!config || (config.available_licenses !== undefined && config.available_licenses <= 0)) {
        return { success: false, error: 'Não há licenças disponíveis' };
      }

      if (!supabase) return { success: false, error: 'Supabase client not initialized' };

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

      // O banco não precisa subtrair fisicamente o available_licenses 
      // pois é um cálculo virtual. Evita Bad Request.

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

      // Verificar se há licenças suficientes (fallback para 0 se undefined)
      const available = config.available_licenses || 0;
      if (available < usersWithoutLicense.length) {
        // Aumentar quantidade de licenças automaticamente
        const additionalLicenses = usersWithoutLicense.length - available;
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
