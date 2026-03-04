import { supabase } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface ChangeLog {
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
  organization_id: string;
  environment_id: string;
}

export interface LogFilters {
  entityType?: string;
  actionType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Obtém organization_id e environment_id do contexto atual
 */
async function getContextIds(): Promise<{ organizationId: string | null; environmentId: string | null }> {
  try {
    const context = await TenantContextHelper.getCurrentContext();
    if (!context) {
      console.warn('⚠️ Contexto não encontrado ao registrar log');
      return { organizationId: null, environmentId: null };
    }
    return {
      organizationId: context.organizationId,
      environmentId: context.environmentId
    };
  } catch (error) {
    console.error('❌ Erro ao obter contexto para log:', error);
    return { organizationId: null, environmentId: null };
  }
}

/**
 * Registra uma criação de entidade
 */
export async function logCreate(
  entityType: string,
  entityId: string,
  newData: any,
  userId: number,
  userName: string
): Promise<void> {
  try {
    // Obter contexto (organization_id e environment_id)
    const { organizationId, environmentId } = await getContextIds();

    if (!organizationId || !environmentId) {
      console.error('❌ Não é possível registrar log sem organization_id e environment_id');
      return;
    }

    const logs: Omit<ChangeLog, 'id' | 'created_at'>[] = [];

    // Para CREATE, registramos os valores principais como novos valores
    Object.entries(newData).forEach(([key, value]) => {
      // Ignorar campos internos e IDs
      if (key === 'id' || key.startsWith('_')) return;

      logs.push({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'CREATE',
        user_id: userId,
        user_name: userName,
        field_name: key,
        old_value: null,
        new_value: String(value || ''),
        organization_id: organizationId,
        environment_id: environmentId
      });
    });

    if (logs.length > 0) {
      const { error } = await supabase
        .from('change_logs')
        .insert(logs);

      if (error) {
        console.error('Error logging creation:', error);
      }
    }
  } catch (error) {
    console.error('Error in logCreate:', error);
  }
}

/**
 * Registra uma atualização de entidade
 */
export async function logUpdate(
  entityType: string,
  entityId: string,
  oldData: any,
  newData: any,
  userId: number,
  userName: string
): Promise<void> {
  try {
    // Obter contexto (organization_id e environment_id)
    const { organizationId, environmentId } = await getContextIds();

    if (!organizationId || !environmentId) {
      console.error('❌ Não é possível registrar log sem organization_id e environment_id');
      return;
    }

    const logs: Omit<ChangeLog, 'id' | 'created_at'>[] = [];

    // Comparar os dados antigos com os novos e registrar apenas as diferenças
    Object.entries(newData).forEach(([key, newValue]) => {
      const oldValue = oldData[key];

      // Ignorar campos internos, IDs e valores iguais
      if (key === 'id' || key.startsWith('_')) return;
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

      logs.push({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'UPDATE',
        user_id: userId,
        user_name: userName,
        field_name: key,
        old_value: String(oldValue || ''),
        new_value: String(newValue || ''),
        organization_id: organizationId,
        environment_id: environmentId
      });
    });

    if (logs.length > 0) {
      const { error } = await supabase
        .from('change_logs')
        .insert(logs);

      if (error) {
        console.error('Error logging update:', error);
      }
    }
  } catch (error) {
    console.error('Error in logUpdate:', error);
  }
}

/**
 * Registra uma exclusão de entidade
 */
export async function logDelete(
  entityType: string,
  entityId: string,
  oldData: any,
  userId: number,
  userName: string
): Promise<void> {
  try {
    // Obter contexto (organization_id e environment_id)
    const { organizationId, environmentId } = await getContextIds();

    if (!organizationId || !environmentId) {
      console.error('❌ Não é possível registrar log sem organization_id e environment_id');
      return;
    }

    const logs: Omit<ChangeLog, 'id' | 'created_at'>[] = [];

    // Para DELETE, registramos os valores anteriores
    Object.entries(oldData).forEach(([key, value]) => {
      // Ignorar campos internos e IDs
      if (key === 'id' || key.startsWith('_')) return;

      logs.push({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'DELETE',
        user_id: userId,
        user_name: userName,
        field_name: key,
        old_value: String(value || ''),
        new_value: null,
        organization_id: organizationId,
        environment_id: environmentId
      });
    });

    if (logs.length > 0) {
      const { error } = await supabase
        .from('change_logs')
        .insert(logs);

      if (error) {
        console.error('Error logging deletion:', error);
      }
    }
  } catch (error) {
    console.error('Error in logDelete:', error);
  }
}

/**
 * Busca logs com filtros e paginação
 */
export async function fetchLogs(
  page: number = 1,
  pageSize: number = 50,
  filters: LogFilters = {}
): Promise<{ logs: ChangeLog[]; totalCount: number }> {
  try {
    console.log('🔍 Fetching logs from change_logs table...');
    console.log('📄 Page:', page, 'PageSize:', pageSize);
    console.log('🔧 Filters:', filters);

    // Buscar o count separadamente para evitar problemas
    let countQuery = supabase
      .from('change_logs')
      .select('*', { count: 'exact', head: true });

    // Aplicar os mesmos filtros ao count
    if (filters.entityType) {
      countQuery = countQuery.eq('entity_type', filters.entityType);
    }
    if (filters.actionType) {
      countQuery = countQuery.eq('action_type', filters.actionType);
    }
    if (filters.userId) {
      countQuery = countQuery.eq('user_id', filters.userId);
    }
    if (filters.startDate) {
      countQuery = countQuery.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      countQuery = countQuery.lte('created_at', filters.endDate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ Error fetching count:', countError);
    }

    console.log('📊 Total count from separate query:', count);

    // Buscar os dados com paginação
    let dataQuery = supabase
      .from('change_logs')
      .select('*');

    // Aplicar filtros
    if (filters.entityType) {
      dataQuery = dataQuery.eq('entity_type', filters.entityType);
    }
    if (filters.actionType) {
      dataQuery = dataQuery.eq('action_type', filters.actionType);
    }
    if (filters.userId) {
      dataQuery = dataQuery.eq('user_id', filters.userId);
    }
    if (filters.startDate) {
      dataQuery = dataQuery.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      dataQuery = dataQuery.lte('created_at', filters.endDate);
    }

    // Ordenação e paginação
    dataQuery = dataQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error } = await dataQuery;

    if (error) {
      console.error('❌ Error fetching logs:', error);
      return { logs: [], totalCount: 0 };
    }

    console.log('✅ Logs fetched successfully!');
    console.log('📦 Data length:', data?.length);
    console.log('📝 Sample data:', data?.[0]);

    return {
      logs: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('❌ Error in fetchLogs:', error);
    return { logs: [], totalCount: 0 };
  }
}

/**
 * Busca logs de uma entidade específica
 */
async function fetchEntityLogs(
  entityType: string,
  entityId: string
): Promise<ChangeLog[]> {
  try {
    const { data, error } = await supabase
      .from('change_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entity logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchEntityLogs:', error);
    return [];
  }
}

/**
 * Retorna estatísticas dos logs
 */
export async function getLogsStats(): Promise<{
  total: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
}> {
  try {
    console.log('📊 Fetching logs stats from change_logs table...');

    const { data, error } = await supabase
      .from('change_logs')
      .select('action_type, entity_type');

    if (error) {
      console.error('❌ Error fetching logs stats:', error);
      return { total: 0, byAction: {}, byEntity: {} };
    }

    console.log('✅ Stats data fetched:', data?.length, 'records');

    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};

    data?.forEach((log) => {
      byAction[log.action_type] = (byAction[log.action_type] || 0) + 1;
      byEntity[log.entity_type] = (byEntity[log.entity_type] || 0) + 1;
    });

    console.log('📈 Stats calculated:', { total: data?.length || 0, byAction, byEntity });

    return {
      total: data?.length || 0,
      byAction,
      byEntity
    };
  } catch (error) {
    console.error('❌ Error in getLogsStats:', error);
    return { total: 0, byAction: {}, byEntity: {} };
  }
}

/**
 * Mapeia nomes de campos para labels amigáveis
 */
export function getFieldLabel(fieldName: string): string {
  const fieldLabels: Record<string, string> = {
    // Estabelecimentos
    razaoSocial: 'Razão Social',
    fantasia: 'Nome Fantasia',
    cnpj: 'CNPJ',
    inscricaoEstadual: 'Inscrição Estadual',
    inscricaoMunicipal: 'Inscrição Municipal',
    endereco: 'Endereço',
    numero: 'Número',
    complemento: 'Complemento',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'Estado',
    cep: 'CEP',
    telefone: 'Telefone',
    email: 'Email',
    responsavel: 'Responsável',
    // Usuários
    nome: 'Nome',
    cpf: 'CPF',
    cargo: 'Cargo',
    departamento: 'Departamento',
    perfil: 'Perfil',
    status: 'Status',
    // Parceiros de Negócio
    name: 'Nome',
    document: 'Documento',
    document_type: 'Tipo de Documento',
    phone: 'Telefone',
    type: 'Tipo',
    website: 'Website',
    tax_regime: 'Regime Tributário',
    credit_limit: 'Limite de Crédito',
    payment_terms: 'Prazo de Pagamento',
    // Transportadoras
    abbreviation: 'Sigla',
    // Estados e Cidades
    capital: 'Capital',
    region: 'Região',
    ibge_code: 'Código IBGE',
    // Genéricos
    codigo: 'Código',
    descricao: 'Descrição',
    observacoes: 'Observações',
    observations: 'Observações',
    ativo: 'Ativo',
    active: 'Ativo'
  };

  return fieldLabels[fieldName] || fieldName;
}
