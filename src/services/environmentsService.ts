import { supabase } from '../lib/supabase';

export interface Environment {
  id: string;
  organization_id: string;
  codigo: string;
  nome: string;
  tipo: 'producao' | 'homologacao' | 'teste' | 'sandbox' | 'desenvolvimento';
  status: 'ativo' | 'inativo';
  metadata: Record<string, any>;
  logo_url?: string | null;
  logo_storage_path?: string | null;
  logo_metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEnvironmentInput {
  organization_id: string;
  codigo: string;
  nome: string;
  tipo: Environment['tipo'];
  metadata?: Record<string, any>;
}

export interface UpdateEnvironmentInput {
  codigo?: string;
  nome?: string;
  tipo?: Environment['tipo'];
  status?: Environment['status'];
  metadata?: Record<string, any>;
  logo_url?: string | null;
  logo_storage_path?: string | null;
  logo_metadata?: Record<string, any> | null;
}

class EnvironmentsService {
  /**
   * Lista todos os environments de uma organização
   */
  async getAll(organizationId: string): Promise<Environment[]> {
    const { data, error } = await supabase
      .from('saas_environments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Lista apenas environments ativos
   */
  async getActive(organizationId: string): Promise<Environment[]> {
    const { data, error } = await supabase
      .from('saas_environments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'ativo')
      .order('tipo', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca environment por ID
   */
  async getById(id: string): Promise<Environment | null> {
    const { data, error } = await supabase
      .from('saas_environments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Busca environment por código dentro de uma organização
   */
  async getByCodigo(organizationId: string, codigo: string): Promise<Environment | null> {
    const { data, error } = await supabase
      .from('saas_environments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('codigo', codigo)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Busca o environment de produção de uma organização
   */
  async getProduction(organizationId: string): Promise<Environment | null> {
    const { data, error } = await supabase
      .from('saas_environments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('tipo', 'producao')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Cria um novo environment
   */
  async create(input: CreateEnvironmentInput): Promise<Environment> {
    // Validar se já existe environment com o mesmo código
    const existing = await this.getByCodigo(input.organization_id, input.codigo);
    if (existing) {
      throw new Error('Já existe um ambiente com este código nesta organização');
    }

    const { data, error } = await supabase
      .from('saas_environments')
      .insert({
        organization_id: input.organization_id,
        codigo: input.codigo,
        nome: input.nome,
        tipo: input.tipo,
        status: 'ativo',
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    try {
      // 1. Criar estabelecimento padrão "0001"
      const { data: estData, error: estError } = await supabase
        .from('establishments')
        .insert({
          organization_id: input.organization_id,
          environment_id: data.id,
          codigo: '0001',
          nome_fantasia: 'Estabelecimento Padrão',
          razao_social: 'Estabelecimento Padrão LTDA',
          tipo: 'matriz',
          ativo: true
        })
        .select()
        .single();

      if (estError) /*log_removed*/

      // 2. Criar usuário admin vinculado
      if (estData) {
        // Obter hash dummy ou real. Como o admin loga pelo TMS Admin, a senha mockada serve para registro, 
        // mas ele é ativado via link ou o admin já existente masteriza.
        // O crypto_subtle default password pra '123456' em hex hash mockado, ou null se não enforced:
        const dummyHash = 'e10adc3949ba59abbe56e057f20f883e'; // 123456 MD5 ou equivalente só pro login não crashar
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            organization_id: input.organization_id,
            environment_id: data.id,
            codigo: '0001',
            email: 'jeferson.costa@logaxis.com.br',
            senha_hash: dummyHash,
            nome: 'Jeferson Costa',
            tipo: 'admin',
            ativo: true
          })
          .select()
          .single();

        if (userError) /*log_removed*/

        // 3. Vincular usuário na tabela N para N user_establishments
        if (userData) {
          await supabase
            .from('user_establishments')
            .insert({
              user_id: userData.id,
              establishment_id: estData.id,
              is_default: true
            });
        }
      }
    } catch (autoGenError) {

    }

    return data;
  }

  /**
   * Atualiza um environment
   */
  async update(id: string, input: UpdateEnvironmentInput): Promise<Environment> {
    const { data, error } = await supabase
      .from('saas_environments')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Ativa/desativa um environment
   */
  async toggleActive(id: string): Promise<Environment> {
    const environment = await this.getById(id);
    if (!environment) {
      throw new Error('Environment não encontrado');
    }

    // Não permitir desativar o environment de produção
    if (environment.tipo === 'producao' && environment.status === 'ativo') {
      throw new Error('Não é possível desativar o ambiente de produção');
    }

    const newStatus = environment.status === 'ativo' ? 'inativo' : 'ativo';
    return this.update(id, { status: newStatus });
  }

  /**
   * Deleta um environment (soft delete - apenas desativa)
   * ATENÇÃO: Não deleta os dados, apenas marca como inativo
   */
  async softDelete(id: string): Promise<void> {
    const environment = await this.getById(id);
    if (!environment) {
      throw new Error('Environment não encontrado');
    }

    // Não permitir deletar o environment de produção
    if (environment.tipo === 'producao') {
      throw new Error('Não é possível deletar o ambiente de produção');
    }

    await this.update(id, { status: 'inativo' });
  }

  /**
   * Deleta um environment permanentemente (CUIDADO!)
   * Chama a RPC delete_environment_cascade para limpar mais de 30 tabelas atreladas
   */
  async hardDelete(id: string): Promise<void> {
    const environment = await this.getById(id);
    if (!environment) {
      throw new Error('Environment não encontrado');
    }

    // Não permitir deletar o environment de produção
    if (environment.tipo === 'producao') {
      throw new Error('Não é possível deletar o ambiente de produção');
    }

    // @ts-ignore - The RPC function was added manually via SQL migration
    const { error } = await supabase.rpc('delete_environment_cascade', {
      p_environment_id: id
    });

    if (error) throw error;
  }

  /**
   * Clona dados de um environment para outro
   * ATENÇÃO: Esta é uma operação complexa e deve ser usada com cuidado
   */
  async cloneData(fromEnvironmentId: string, toEnvironmentId: string): Promise<void> {
    const fromEnv = await this.getById(fromEnvironmentId);
    const toEnv = await this.getById(toEnvironmentId);

    if (!fromEnv || !toEnv) {
      throw new Error('Environment de origem ou destino não encontrado');
    }

    if (fromEnv.organization_id !== toEnv.organization_id) {
      throw new Error('Environments devem pertencer à mesma organização');
    }

    // TODO: Implementar lógica de clonagem de dados
    // Isso requer cuidado especial para não corromper dados
    throw new Error('Funcionalidade de clonagem ainda não implementada');
  }

  async getStats(environmentId: string): Promise<{
    total_users: number;
    total_establishments: number;
    total_carriers: number;
    total_invoices: number;
    total_orders: number;
    total_pickups: number;
    total_ctes: number;
    total_bills: number;
    storage_used_mb: number;
  }> {
    // Contadores
    const [users, establishments, carriers, invoices, orders, pickups, ctes, bills] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('establishments').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('carriers').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('invoices_nfe').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('pickups').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('invoices_cte').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
      supabase.from('bills').select('id', { count: 'exact', head: true }).eq('environment_id', environmentId),
    ]);

    return {
      total_users: users.count || 0,
      total_establishments: establishments.count || 0,
      total_carriers: carriers.count || 0,
      total_invoices: invoices.count || 0,
      total_orders: orders.count || 0,
      total_pickups: pickups.count || 0,
      total_ctes: ctes.count || 0,
      total_bills: bills.count || 0,
      storage_used_mb: 0, // TODO: Calcular storage real
    };
  }
}

export const environmentsService = new EnvironmentsService();
