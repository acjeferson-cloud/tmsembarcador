import { supabase } from '../lib/supabase';
import { changeLogsService } from './changeLogsService';

export interface User {
  id: string;
  codigo?: string;
  nome: string;
  email: string;
  senha?: string;
  senha_hash?: string;
  cpf?: string;
  telefone?: string;
  celular?: string;
  cargo?: string;
  departamento?: string;
  data_admissao?: string;
  data_nascimento?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  perfil?: 'administrador' | 'gerente' | 'operador' | 'visualizador' | 'personalizado';
  tipo?: string;
  permissoes?: string[];
  status?: 'ativo' | 'inativo' | 'bloqueado';
  ativo?: boolean;
  bloqueado?: boolean;
  estabelecimento_id?: string;
  estabelecimento_nome?: string;
  estabelecimentosPermitidos?: string[];
  ultimo_login?: string;
  tentativas_login?: number;
  observacoes?: string;
  foto_perfil_url?: string;
  preferred_language?: 'pt' | 'en' | 'es';
  organization_id?: string;
  environment_id?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  created_by?: string | number;
  updated_by?: string | number;
}

export const usersService = {
  // Helper function to get current org/env from localStorage with auto-recovery
  async getCurrentContext(): Promise<{ orgId: string | null; envId: string | null }> {
    let orgId = localStorage.getItem('tms-selected-org-id');
    let envId = localStorage.getItem('tms-selected-env-id');
    // If context is missing, try to recover from logged user
    if (!orgId || !envId) {
      try {
        const userDataStr = localStorage.getItem('tms-user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          // Try to get context from user data
          if (userData.organization_id && userData.environment_id) {
            orgId = userData.organization_id;
            envId = userData.environment_id;

            // Save to localStorage for future use
            localStorage.setItem('tms-selected-org-id', orgId);
            localStorage.setItem('tms-selected-env-id', envId);
          } else if (userData.email) {
            // Try to fetch from database using RPC function
            const { data, error } = await supabase.rpc('get_user_context', {
              user_email: userData.email
            });

            if (!error && data && data.length > 0) {
              orgId = data[0].organization_id;
              envId = data[0].environment_id;

              // Save to localStorage
              localStorage.setItem('tms-selected-org-id', orgId);
              localStorage.setItem('tms-selected-env-id', envId);
            }
          }
        }
      } catch (error) {
      }
    }

    return { orgId, envId };
  },

  // Helper function to map database fields to camelCase
  mapUserFromDb(dbUser: any): User {
    let status: 'ativo' | 'inativo' | 'bloqueado' = 'ativo';

    if (dbUser.bloqueado === true || dbUser.is_blocked === true) {
      status = 'bloqueado';
    } else if (dbUser.ativo === false) {
      status = 'inativo';
    } else {
      status = 'ativo';
    }

    return {
      id: dbUser.id,
      codigo: dbUser.codigo || dbUser.id.substring(0, 8),
      nome: dbUser.nome,
      email: dbUser.email,
      senha_hash: dbUser.senha_hash || dbUser.encrypted_password,
      cpf: dbUser.cpf,
      telefone: dbUser.telefone || dbUser.phone,
      celular: dbUser.celular,
      cargo: dbUser.cargo,
      departamento: dbUser.departamento,
      data_admissao: dbUser.data_admissao,
      data_nascimento: dbUser.data_nascimento,
      endereco: dbUser.endereco,
      bairro: dbUser.bairro,
      cep: dbUser.cep,
      cidade: dbUser.cidade,
      estado: dbUser.estado,
      perfil: dbUser.perfil || dbUser.tipo,
      tipo: dbUser.tipo,
      permissoes: dbUser.permissoes,
      status,
      ativo: dbUser.ativo,
      bloqueado: dbUser.bloqueado,
      estabelecimento_id: dbUser.estabelecimento_id,
      estabelecimento_nome: dbUser.estabelecimento_nome ||
        (dbUser.establishments ? `${dbUser.establishments.codigo} - ${dbUser.establishments.nome_fantasia}` : undefined),
      estabelecimentosPermitidos: dbUser.estabelecimentos_permitidos || [],
      ultimo_login: dbUser.ultimo_login || dbUser.last_sign_in_at,
      tentativas_login: dbUser.tentativas_login || 0,
      observacoes: dbUser.observacoes,
      foto_perfil_url: dbUser.foto_perfil_url,
      preferred_language: dbUser.preferred_language,
      organization_id: dbUser.organization_id,
      environment_id: dbUser.environment_id,
      metadata: dbUser.metadata || dbUser.raw_user_meta_data,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
      created_by: dbUser.created_by,
      updated_by: dbUser.updated_by
    };
  },

  async getAll(): Promise<User[]> {
    try {
      const { orgId, envId } = await this.getCurrentContext();
      if (!orgId || !envId) {
        // Tentar buscar todos os usuários sem filtro para debug
        const { data: allUsers, error: allError } = await supabase
          .from('users')
          .select('*')
          .limit(5);
        if (allError) void 0;

        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          establishments:estabelecimento_id (
            codigo,
            nome_fantasia
          )
        `)
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .order('codigo', { ascending: true });
      if (error) {
        throw error;
      }

      const mappedUsers = (data || []).map(user => this.mapUserFromDb(user));
      return mappedUsers;
    } catch (error) {
      return [];
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      return null;
    }
  },

  async getByCodigo(codigo: string): Promise<User | null> {
    try {
      const { envId } = await this.getCurrentContext();
      let query = supabase.from('users').select('*').eq('codigo', codigo);
      
      if (envId) {
        query = query.eq('environment_id', envId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        throw error;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      return null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const { envId } = await this.getCurrentContext();
      let query = supabase.from('users').select('*').eq('email', email);
      
      if (envId) {
        query = query.eq('environment_id', envId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        throw error;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      return null;
    }
  },

  async getByCPF(cpf: string): Promise<User | null> {
    try {
      const { envId } = await this.getCurrentContext();
      let query = supabase.from('users').select('*').eq('cpf', cpf);
      
      if (envId) {
        query = query.eq('environment_id', envId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        throw error;
      }

      return data ? this.mapUserFromDb(data) : null;
    } catch (error) {
      return null;
    }
  },

  async getByStatus(status: 'ativo' | 'inativo' | 'bloqueado'): Promise<User[]> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('status', status)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(user => this.mapUserFromDb(user));
    } catch (error) {
      return [];
    }
  },

  async getByPerfil(perfil: string): Promise<User[]> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('perfil', perfil)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(user => this.mapUserFromDb(user));
    } catch (error) {
      return [];
    }
  },

  async getByEstablishment(estabelecimentoId: string): Promise<User[]> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(user => this.mapUserFromDb(user));
    } catch (error) {
      return [];
    }
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        throw new Error('Contexto de org/env não disponível');
      }
      const payloadToInsert = {
        codigo: user.codigo,
        nome: user.nome,
        email: user.email,
        senha_hash: user.senha,
        cpf: user.cpf,
        telefone: user.telefone,
        celular: user.celular,
        cargo: user.cargo,
        departamento: user.departamento,
        data_admissao: user.data_admissao,
        data_nascimento: user.data_nascimento,
        endereco: user.endereco,
        bairro: user.bairro,
        cep: user.cep,
        cidade: user.cidade,
        estado: user.estado,
        perfil: user.perfil,
        permissoes: user.permissoes,
        status: user.status,
        ativo: user.status === 'ativo',
        bloqueado: user.status === 'bloqueado',
        estabelecimento_id: user.estabelecimento_id,
        // estabelecimento_nome removido - campo não existe na tabela
        estabelecimentos_permitidos: user.estabelecimentosPermitidos,
        ultimo_login: user.ultimo_login,
        tentativas_login: user.tentativas_login,
        observacoes: user.observacoes,
        preferred_language: user.preferred_language || 'pt',
        created_by: user.created_by,
        organization_id: orgId,
        environment_id: envId
      };

      console.error('[DEBUG usersService.ts create] Enviando para o Supabase (insert):', JSON.stringify(payloadToInsert, null, 2));

      const { data, error } = await supabase
        .from('users')
        .insert(payloadToInsert)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await changeLogsService.logCreate({
        entityType: 'users',
        entityId: data.id,
        entityName: `${data.nome} (${data.email})`,
        userId: user.created_by,
        userName: user.nome || 'Sistema'
      });

      return this.mapUserFromDb(data);
    } catch (error) {
      throw error;
    }
  },

  async update(id: string, user: Partial<User>): Promise<User | null> {
    try {
      const oldData = await this.getById(id);

      const updateData: any = {
        updated_by: user.updated_by,
      };

      if (user.codigo !== undefined) updateData.codigo = user.codigo;
      if (user.nome !== undefined) updateData.nome = user.nome;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.senha !== undefined) updateData.senha_hash = user.senha;
      if (user.cpf !== undefined) updateData.cpf = user.cpf;
      if (user.telefone !== undefined) updateData.telefone = user.telefone;
      if (user.celular !== undefined) updateData.celular = user.celular;
      if (user.cargo !== undefined) updateData.cargo = user.cargo;
      if (user.departamento !== undefined) updateData.departamento = user.departamento;
      if (user.data_admissao !== undefined) updateData.data_admissao = user.data_admissao;
      if (user.data_nascimento !== undefined) updateData.data_nascimento = user.data_nascimento;
      if (user.endereco !== undefined) updateData.endereco = user.endereco;
      if (user.bairro !== undefined) updateData.bairro = user.bairro;
      if (user.cep !== undefined) updateData.cep = user.cep;
      if (user.cidade !== undefined) updateData.cidade = user.cidade;
      if (user.estado !== undefined) updateData.estado = user.estado;
      if (user.perfil !== undefined) updateData.perfil = user.perfil;
      if (user.permissoes !== undefined) updateData.permissoes = user.permissoes;
      if (user.status !== undefined) {
        updateData.status = user.status;
        updateData.ativo = user.status === 'ativo';
        updateData.bloqueado = user.status === 'bloqueado';
      }
      if (user.estabelecimento_id !== undefined) updateData.estabelecimento_id = user.estabelecimento_id;
      // estabelecimento_nome removido - campo não existe na tabela
      if (user.estabelecimentosPermitidos !== undefined) updateData.estabelecimentos_permitidos = user.estabelecimentosPermitidos;
      if (user.ultimo_login !== undefined) updateData.ultimo_login = user.ultimo_login;
      if (user.foto_perfil_url !== undefined) updateData.foto_perfil_url = user.foto_perfil_url;
      if (user.tentativas_login !== undefined) updateData.tentativas_login = user.tentativas_login;
      if (user.observacoes !== undefined) updateData.observacoes = user.observacoes;
      if (user.preferred_language !== undefined) updateData.preferred_language = user.preferred_language;

      // If password is being updated, update it in Supabase Auth too
      if (user.senha) {
        try {
          // Get the user's email if not provided
          let email = user.email;
          if (!email) {
            const currentUser = await this.getById(id);
            email = currentUser?.email;
          }

          if (email) {
            await this.updateUserPasswordInAuth(email, user.senha);
          }
        } catch (authError) {
          // Continue with database update even if auth update fails
        }
      }
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      if (oldData) {
        await changeLogsService.logMultipleUpdates({
          entityType: 'users',
          entityId: id,
          oldData,
          newData: data,
          userId: user.updated_by,
          userName: oldData.nome || 'Sistema'
        });
      }

      return this.mapUserFromDb(data);
    } catch (error) {
      throw error;
    }
  },

  async updateUserPasswordInAuth(email: string, newPassword: string): Promise<void> {
    try {
      // Get the user by email from Supabase Auth
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        throw listError;
      }

      const authUser = users?.find(u => u.email === email);

      if (authUser) {
        // Update the password in Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { password: newPassword }
        );

        if (updateError) {
          throw updateError;
        }
      } else {
      }
    } catch (error) {
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const user = await this.getById(id);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      if (user) {
        await changeLogsService.logDelete({
          entityType: 'users',
          entityId: id,
          entityName: `${user.nome} (${user.email})`,
          userName: 'Sistema'
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  async getNextCode(): Promise<string> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        return '0001';
      }

      const { data, error } = await supabase
        .from('users')
        .select('codigo')
        .eq('organization_id', orgId)
        .eq('environment_id', envId);

      if (error) {
        return '0001';
      }

      if (!data || data.length === 0) {
        return '0001';
      }

      // Encontrar o maior código numérico
      let maxCode = 0;
      data.forEach(user => {
        const codigo = user.codigo;
        // Verificar se é numérico
        if (codigo && /^\d+$/.test(codigo)) {
          const numericValue = parseInt(codigo, 10);
          if (numericValue > maxCode) {
            maxCode = numericValue;
          }
        }
      });

      const nextNumber = maxCode + 1;
      return nextNumber.toString().padStart(4, '0');
    } catch (error) {
      return '0001';
    }
  },

  async search(searchTerm: string): Promise<User[]> {
    try {
      const { orgId, envId } = await this.getCurrentContext();

      if (!orgId || !envId) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId)
        .eq('environment_id', envId)
        .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%,cargo.ilike.%${searchTerm}%,departamento.ilike.%${searchTerm}%`)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getStats() {
    try {
      const users = await this.getAll();

      const total = users.length;
      const ativos = users.filter(u => u.status === 'ativo').length;
      const inativos = users.filter(u => u.status === 'inativo').length;
      const bloqueados = users.filter(u => u.status === 'bloqueado').length;

      const administradores = users.filter(u => u.perfil === 'administrador').length;
      const gerentes = users.filter(u => u.perfil === 'gerente').length;
      const operadores = users.filter(u => u.perfil === 'operador').length;
      const visualizadores = users.filter(u => u.perfil === 'visualizador').length;
      const personalizados = users.filter(u => u.perfil === 'personalizado').length;

      return {
        total,
        status: { ativos, inativos, bloqueados },
        perfis: { administradores, gerentes, operadores, visualizadores, personalizados }
      };
    } catch (error) {
      return {
        total: 0,
        status: { ativos: 0, inativos: 0, bloqueados: 0 },
        perfis: { administradores: 0, gerentes: 0, operadores: 0, visualizadores: 0, personalizados: 0 }
      };
    }
  },

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.update(userId, { tentativas_login: 0, status: 'ativo' });
  },

  async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (user) {
      const newAttempts = user.tentativas_login + 1;
      const newStatus = newAttempts >= 5 ? 'bloqueado' : user.status;
      await this.update(userId, {
        tentativas_login: newAttempts,
        status: newStatus,
        ultimo_login: newStatus === 'bloqueado' ? user.ultimo_login : new Date().toISOString()
      });
    }
  },

  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, {
      ultimo_login: new Date().toISOString(),
      tentativas_login: 0
    });
  },

  // Validation functions
  async isEmailUnique(email: string, excludeId?: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return !user || user.id === excludeId;
  },

  async isCPFUnique(cpf: string, excludeId?: string): Promise<boolean> {
    const user = await this.getByCPF(cpf);
    return !user || user.id === excludeId;
  },

  async isCodigoUnique(codigo: string, excludeId?: string): Promise<boolean> {
    const user = await this.getByCodigo(codigo);
    return !user || user.id === excludeId;
  },

  isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  async uploadProfilePhoto(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      await this.update(userId, { foto_perfil_url: publicUrl } as Partial<User>);

      return publicUrl;
    } catch (error) {
      return null;
    }
  },

  async deleteProfilePhoto(userId: string, photoUrl: string): Promise<boolean> {
    try {
      const fileName = photoUrl.split('/').pop();

      if (!fileName) {
        return false;
      }

      const { error } = await supabase.storage
        .from('profile-photos')
        .remove([fileName]);

      if (error) {
        throw error;
      }

      await this.update(userId, { foto_perfil_url: null } as Partial<User>);

      return true;
    } catch (error) {
      return false;
    }
  },
};
