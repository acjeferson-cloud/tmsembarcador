import { supabase } from '../lib/supabase';
import { setSessionContext } from '../lib/sessionContext';
import { logoStorageService } from './logoStorageService';
import { TenantContextHelper } from '../utils/tenantContext';
export interface EmailConfig {
  email: string;
  username: string;
  password: string;
  authType: 'LOGIN' | 'OAuth2';
  protocol: 'IMAP' | 'POP3';
  host: string;
  port: string;
  useSSL: boolean;
  autoDownloadEnabled?: boolean;
  autoDownloadInterval?: 5 | 10 | 15 | 30 | 60;
  lastAutoDownload?: string;
}

export interface Establishment {
  id: string;
  organization_id?: string;
  environment_id?: string;
  codigo: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  tipo?: 'matriz' | 'filial';
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;

  // Campos legados para compatibilidade com UI
  fantasia?: string;
  endereco?: string;
  tracking_prefix?: string;
  logo_light_base64?: string;
  logo_dark_base64?: string;
  logo_nps_base64?: string;
  logo_url?: string;
  email_config?: EmailConfig;
  created_by?: number;
  updated_by?: number;
}

// Helper para obter organização do usuário atual - AGORA ASSÍCRONO
async function getUserOrganization(): Promise<{ organizationId: string; environmentId: string | null } | null> {
  try {
    const ctx = await TenantContextHelper.getCurrentContext();
    if (!ctx || !ctx.organizationId || !ctx.environmentId) {
      return null;
    }
    return {
      organizationId: ctx.organizationId,
      environmentId: ctx.environmentId
    };
  } catch (error) {
    return null;
  }
}

export const establishmentsService = {
  async getAll(): Promise<Establishment[]> {
    try {
// console.log('🔗 [establishmentsService.getAll] Iniciando busca...');
      
      const userOrg = await getUserOrganization();
// console.log('🏢 [establishmentsService.getAll] Contexto recuperado:', userOrg);
      
      if (!userOrg) {
// console.warn('⚠️ [establishmentsService.getAll] Abortando: sem userOrg');
        return [];
      }
      
      const { organizationId: organization_id, environmentId: environment_id } = userOrg;

// console.log(`🔧 [establishmentsService.getAll] Configurando contexto da sessão org=${organization_id}, env=${environment_id}`);
      const sessionRes = await setSessionContext(organization_id, environment_id);
// console.log('🔧 [establishmentsService.getAll] Resultado do setSessionContext:', sessionRes);

      // Buscar estabelecimentos diretamente com filtros (RLS vai proteger)
// console.log(`📡 [establishmentsService.getAll] Executando query supabase.from('establishments').select('*').eq('organization_id', ${organization_id}).eq('environment_id', ${environment_id})`);
      
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .order('codigo', { ascending: true });

// console.log('✅ [establishmentsService.getAll] Resposta do Supabase:', { data, error });

      if (error) {
// console.error('❌ [establishmentsService.getAll] Erro do Supabase:', error);
        throw error;
      }

      // Mapear para incluir campos legados para compatibilidade com UI
      const mappedData = (data || []).map((est: any) => ({
        ...est,
        fantasia: est.nome_fantasia,
        endereco: est.logradouro,
        tracking_prefix: est.metadata?.tracking_prefix,
        email_config: est.metadata?.email_config,
        logo_light_base64: est.metadata?.logo_light_url || est.metadata?.logo_light_base64,
        logo_dark_base64: est.metadata?.logo_dark_url || est.metadata?.logo_dark_base64,
        logo_nps_base64: est.metadata?.logo_nps_url || est.metadata?.logo_nps_base64,
      }));

      return mappedData;
    } catch (error) {
      return [];
    }
  },

  async getById(id: string): Promise<Establishment | null> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        return null;
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) return null;

      // Mapear campos legados
      return {
        ...data,
        fantasia: data.nome_fantasia,
        endereco: data.logradouro,
        tracking_prefix: data.metadata?.tracking_prefix,
        email_config: data.metadata?.email_config,
        logo_light_base64: data.metadata?.logo_light_url || data.metadata?.logo_light_base64,
        logo_dark_base64: data.metadata?.logo_dark_url || data.metadata?.logo_dark_base64,
        logo_nps_base64: data.metadata?.logo_nps_url || data.metadata?.logo_nps_base64,
      };
    } catch (error) {
      return null;
    }
  },

  async getByCodigo(codigo: string): Promise<Establishment | null> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        return null;
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('codigo', codigo)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) return null;

      // Mapear campos legados
      return {
        ...data,
        fantasia: data.nome_fantasia,
        endereco: data.logradouro,
        tracking_prefix: data.metadata?.tracking_prefix,
        email_config: data.metadata?.email_config,
        logo_light_base64: data.metadata?.logo_light_url || data.metadata?.logo_light_base64,
        logo_dark_base64: data.metadata?.logo_dark_url || data.metadata?.logo_dark_base64,
        logo_nps_base64: data.metadata?.logo_nps_url || data.metadata?.logo_nps_base64,
      };
    } catch (error) {
      return null;
    }
  },

  async create(establishment: Omit<Establishment, 'id' | 'created_at' | 'updated_at'>): Promise<Establishment | null> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        throw new Error('Usuário não autenticado');
      }

      const { organizationId, environmentId } = userOrg;

      if (!environmentId) {
        throw new Error('Environment ID não encontrado');
      }

      await setSessionContext(organizationId, environmentId);

      const insertData: any = {
        codigo: establishment.codigo,
        nome_fantasia: establishment.fantasia || establishment.nome_fantasia,
        organization_id: organizationId,
        environment_id: environmentId,
      };

      if (establishment.cnpj) insertData.cnpj = establishment.cnpj;
      if (establishment.inscricao_estadual) insertData.inscricao_estadual = establishment.inscricao_estadual;
      if (establishment.inscricao_municipal) insertData.inscricao_municipal = establishment.inscricao_municipal;
      if (establishment.razao_social) insertData.razao_social = establishment.razao_social;
      if (establishment.tipo) insertData.tipo = establishment.tipo;
      if (establishment.cep) insertData.cep = establishment.cep;
      if (establishment.logradouro || establishment.endereco) insertData.logradouro = establishment.logradouro || establishment.endereco;
      if (establishment.numero) insertData.numero = establishment.numero;
      if (establishment.complemento) insertData.complemento = establishment.complemento;
      if (establishment.bairro) insertData.bairro = establishment.bairro;
      if (establishment.cidade) insertData.cidade = establishment.cidade;
      if (establishment.estado) insertData.estado = establishment.estado;
      if (establishment.pais) insertData.pais = establishment.pais;
      if (establishment.telefone) insertData.telefone = establishment.telefone;
      if (establishment.email) insertData.email = establishment.email;
      if (establishment.ativo !== undefined) insertData.ativo = establishment.ativo;

      // Armazenar campos legados no metadata
      if (establishment.tracking_prefix || establishment.email_config) {
        insertData.metadata = {
          tracking_prefix: establishment.tracking_prefix,
          email_config: establishment.email_config,
          logo_light_base64: establishment.logo_light_base64,
          logo_dark_base64: establishment.logo_dark_base64,
          logo_nps_base64: establishment.logo_nps_base64,
        };
      }

      const { data, error } = await supabase
        .from('establishments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data?.id) {
        const currentMetadata = insertData.metadata || {};
        let metadataUpdated = false;

        const uploadLogo = async (base64: string, type: 'light' | 'dark' | 'nps') => {
          if (!base64 || !base64.startsWith('data:image/')) return;
          const result = await logoStorageService.uploadLogoFromBase64(data.id, base64, type);
          if (result.success && result.logoUrl) {
            currentMetadata[`logo_${type}_url`] = result.logoUrl;
            metadataUpdated = true;
          }
        };

        if (establishment.logo_light_base64) await uploadLogo(establishment.logo_light_base64, 'light');
        if (establishment.logo_dark_base64) await uploadLogo(establishment.logo_dark_base64, 'dark');
        if (establishment.logo_nps_base64) await uploadLogo(establishment.logo_nps_base64, 'nps');

        if (metadataUpdated) {
          await supabase
            .from('establishments')
            .update({ metadata: currentMetadata })
            .eq('id', data.id);

          data.metadata = currentMetadata;
        }
      }

      if (!data) return null;

      // Mapear campos legados
      return {
        ...data,
        fantasia: data.nome_fantasia,
        endereco: data.logradouro,
        tracking_prefix: data.metadata?.tracking_prefix,
        email_config: data.metadata?.email_config,
        logo_light_base64: data.metadata?.logo_light_url || data.metadata?.logo_light_base64,
        logo_dark_base64: data.metadata?.logo_dark_url || data.metadata?.logo_dark_base64,
        logo_nps_base64: data.metadata?.logo_nps_url || data.metadata?.logo_nps_base64,
      };
    } catch (error) {
      throw error;
    }
  },

  async update(id: string, establishment: Partial<Establishment>): Promise<Establishment | null> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        throw new Error('Usuário não autenticado');
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (establishment.codigo !== undefined) updateData.codigo = establishment.codigo;
      if (establishment.fantasia !== undefined || establishment.nome_fantasia !== undefined) {
        updateData.nome_fantasia = establishment.fantasia || establishment.nome_fantasia;
      }
      if (establishment.cnpj !== undefined) updateData.cnpj = establishment.cnpj;
      if (establishment.inscricao_estadual !== undefined) updateData.inscricao_estadual = establishment.inscricao_estadual;
      if (establishment.inscricao_municipal !== undefined) updateData.inscricao_municipal = establishment.inscricao_municipal;
      if (establishment.razao_social !== undefined) updateData.razao_social = establishment.razao_social;
      if (establishment.tipo !== undefined) updateData.tipo = establishment.tipo;
      if (establishment.cep !== undefined) updateData.cep = establishment.cep;
      if (establishment.endereco !== undefined || establishment.logradouro !== undefined) {
        updateData.logradouro = establishment.logradouro || establishment.endereco;
      }
      if (establishment.numero !== undefined) updateData.numero = establishment.numero;
      if (establishment.complemento !== undefined) updateData.complemento = establishment.complemento;
      if (establishment.bairro !== undefined) updateData.bairro = establishment.bairro;
      if (establishment.cidade !== undefined) updateData.cidade = establishment.cidade;
      if (establishment.estado !== undefined) updateData.estado = establishment.estado;
      if (establishment.pais !== undefined) updateData.pais = establishment.pais;
      if (establishment.telefone !== undefined) updateData.telefone = establishment.telefone;
      if (establishment.email !== undefined) updateData.email = establishment.email;
      if (establishment.ativo !== undefined) updateData.ativo = establishment.ativo;

      // Atualizar metadata com campos legados
      if (establishment.tracking_prefix !== undefined ||
          establishment.email_config !== undefined ||
          establishment.logo_light_base64 !== undefined ||
          establishment.logo_dark_base64 !== undefined ||
          establishment.logo_nps_base64 !== undefined) {

        // Buscar metadata atual
        const { data: currentData } = await supabase
          .from('establishments')
          .select('metadata')
          .eq('id', id)
          .single();

        const currentMetadata = currentData?.metadata || {};

        updateData.metadata = {
          ...currentMetadata,
          ...(establishment.tracking_prefix !== undefined && { tracking_prefix: establishment.tracking_prefix }),
          ...(establishment.email_config !== undefined && { email_config: establishment.email_config }),
          ...(establishment.logo_light_base64 !== undefined && { logo_light_base64: establishment.logo_light_base64 }),
          ...(establishment.logo_dark_base64 !== undefined && { logo_dark_base64: establishment.logo_dark_base64 }),
          ...(establishment.logo_nps_base64 !== undefined && { logo_nps_base64: establishment.logo_nps_base64 }),
        };
      }

      if (establishment.logo_light_base64 || establishment.logo_dark_base64 || establishment.logo_nps_base64) {
        const uploadLogo = async (base64: string, type: 'light' | 'dark' | 'nps') => {
          if (!base64 || !base64.startsWith('data:image/')) return;
          const result = await logoStorageService.uploadLogoFromBase64(id, base64, type);
          if (result.success && result.logoUrl) {
            updateData.metadata = updateData.metadata || {};
            updateData.metadata[`logo_${type}_url`] = result.logoUrl;
          }
        };

        if (establishment.logo_light_base64) await uploadLogo(establishment.logo_light_base64, 'light');
        if (establishment.logo_dark_base64) await uploadLogo(establishment.logo_dark_base64, 'dark');
        if (establishment.logo_nps_base64) await uploadLogo(establishment.logo_nps_base64, 'nps');
      }

      const { data, error } = await supabase
        .from('establishments')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) return null;

      // Mapear campos legados
      return {
        ...data,
        fantasia: data.nome_fantasia,
        endereco: data.logradouro,
        tracking_prefix: data.metadata?.tracking_prefix,
        email_config: data.metadata?.email_config,
        logo_light_base64: data.metadata?.logo_light_base64,
        logo_dark_base64: data.metadata?.logo_dark_base64,
        logo_nps_base64: data.metadata?.logo_nps_base64,
      };
    } catch (error) {
      throw error;
    }
  },

  async canDelete(id: string, currentUserId?: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Check if establishment has any related records
      const tables = [
        'cte_divergence_reports',
        'freight_quotes_history',
        'google_maps_transactions',
        'invoices_nfe',
        'openai_transactions',
        'pickups',
        'whatsapp_transactions'
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .eq('establishment_id', id)
          .limit(1);

        if (error) {
          continue;
        }

        if (data && data.length > 0) {
          return {
            canDelete: false,
            reason: `Este estabelecimento possui registros vinculados e não pode ser excluído. Para removê-lo, primeiro exclua todos os documentos e movimentações relacionados.`
          };
        }
      }

      // Check if user is trying to delete their current establishment
      if (currentUserId) {
        const { data: userData } = await supabase
          .from('users')
          .select('selected_establishment_id')
          .eq('id', currentUserId)
          .maybeSingle();

        if (userData?.selected_establishment_id === id) {
          return {
            canDelete: false,
            reason: 'Não é possível excluir o estabelecimento que está atualmente selecionado. Selecione outro estabelecimento antes de excluir este.'
          };
        }
      }

      return { canDelete: true };
    } catch (error) {
      return {
        canDelete: false,
        reason: 'Erro ao verificar possibilidade de exclusão. Tente novamente.'
      };
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        throw new Error('Usuário não autenticado');
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  async getNextCode(): Promise<string> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        return '0001';
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('codigo')
        .eq('organization_id', organizationId)
        .order('codigo', { ascending: false })
        .limit(1);

      if (error) {
        return '0001';
      }

      if (!data || data.length === 0) {
        return '0001';
      }

      const lastCode = data[0].codigo;
      const numericCodes = lastCode.match(/\d+/);

      if (numericCodes) {
        const nextNumber = parseInt(numericCodes[0]) + 1;
        return nextNumber.toString().padStart(4, '0');
      }

      return '0001';
    } catch (error) {
      return '0001';
    }
  },

  async getByEstado(estado: string): Promise<Establishment[]> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        return [];
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('estado', estado)
        .eq('organization_id', organizationId)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      // Mapear para incluir campos legados
      const mappedData = (data || []).map(est => ({
        ...est,
        fantasia: est.nome_fantasia,
        endereco: est.logradouro,
        tracking_prefix: est.metadata?.tracking_prefix,
        email_config: est.metadata?.email_config,
        logo_light_base64: est.metadata?.logo_light_url || est.metadata?.logo_light_base64,
        logo_dark_base64: est.metadata?.logo_dark_url || est.metadata?.logo_dark_base64,
        logo_nps_base64: est.metadata?.logo_nps_url || est.metadata?.logo_nps_base64,
      }));

      return mappedData;
    } catch (error) {
      return [];
    }
  },

  async search(searchTerm: string): Promise<Establishment[]> {
    try {
      const userOrg = await getUserOrganization();
      if (!userOrg) {
        return [];
      }

      const { organizationId, environmentId } = userOrg;

      if (environmentId) {
        await setSessionContext(organizationId, environmentId);
      }

      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%,cep.ilike.%${searchTerm}%`)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      // Mapear para incluir campos legados
      const mappedData = (data || []).map(est => ({
        ...est,
        fantasia: est.nome_fantasia,
        endereco: est.logradouro,
        tracking_prefix: est.metadata?.tracking_prefix,
        email_config: est.metadata?.email_config,
        logo_light_base64: est.metadata?.logo_light_base64,
        logo_dark_base64: est.metadata?.logo_dark_base64,
        logo_nps_base64: est.metadata?.logo_nps_base64,
      }));

      return mappedData;
    } catch (error) {
      return [];
    }
  },
};
