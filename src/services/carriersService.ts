import { supabase } from '../lib/supabase';

export interface Carrier {
  id: string;
  codigo: string;
  razao_social: string;
  fantasia?: string;
  logotipo?: string;
  cnpj: string;
  inscricao_estadual?: string;
  pais_id?: string;
  estado_id?: string;
  cidade_id?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  tolerancia_valor_cte?: number;
  tolerancia_percentual_cte?: number;
  tolerancia_valor_fatura?: number;
  tolerancia_percentual_fatura?: number;
  email?: string;
  phone?: string;
  status: 'ativo' | 'inativo';
  rating?: number;
  active_shipments?: number;
  modal_rodoviario?: boolean;
  modal_aereo?: boolean;
  modal_aquaviario?: boolean;
  modal_ferroviario?: boolean;
  considera_sabado_util?: boolean;
  considera_domingo_util?: boolean;
  considera_feriados?: boolean;
  nps_interno?: number;
  nps_externo?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const carriersService = {
  // Função auxiliar para transformar dados JSONB em campos individuais
  transformCarrierData(carrier: any): any {
    if (!carrier) return null;

    const metadata = carrier.metadata || {};

    return {
      id: carrier.id,
      codigo: carrier.codigo,
      razao_social: carrier.razao_social,
      fantasia: carrier.nome_fantasia,
      logotipo: carrier.logotipo,
      cnpj: carrier.cnpj,
      inscricao_estadual: carrier.inscricao_estadual,
      pais_id: carrier.pais_id,
      estado_id: carrier.estado_id,
      cidade_id: carrier.cidade_id,
      logradouro: carrier.logradouro,
      numero: carrier.numero,
      complemento: carrier.complemento,
      bairro: carrier.bairro,
      cep: carrier.cep,
      email: carrier.email,
      phone: carrier.telefone,
      status: carrier.ativo ? 'ativo' : 'inativo',
      nps_interno: carrier.nps_interno || metadata.nps_interno || 0,
      nps_externo: metadata.nps_externo || 0,
      modal_rodoviario: metadata.modal_rodoviario || false,
      modal_aereo: metadata.modal_aereo || false,
      modal_aquaviario: metadata.modal_aquaviario || false,
      modal_ferroviario: metadata.modal_ferroviario || false,
      considera_sabado_util: metadata.considera_sabado_util || false,
      considera_domingo_util: metadata.considera_domingo_util || false,
      considera_feriados: metadata.considera_feriados !== undefined ? metadata.considera_feriados : true,
      tolerancia_valor_cte: metadata.tolerancia_valor_cte || 0,
      tolerancia_percentual_cte: metadata.tolerancia_percentual_cte || 0,
      tolerancia_valor_fatura: metadata.tolerancia_valor_fatura || 0,
      tolerancia_percentual_fatura: metadata.tolerancia_percentual_fatura || 0,
      rating: metadata.rating || 0,
      active_shipments: metadata.active_shipments || 0,
      created_at: carrier.created_at,
      updated_at: carrier.updated_at,
      created_by: carrier.created_by,
      updated_by: carrier.updated_by
    };
  },

  async getNPSRatings(carrierId: string): Promise<{ nps_interno: number; nps_externo: number }> {
    try {
      const { data: npsInterno, error: errorInterno } = await supabase
        .from('nps_avaliacoes_internas')
        .select('nota_final')
        .eq('transportador_id', carrierId)
        .order('periodo_fim', { ascending: false })
        .limit(10);

      const { data: npsExterno, error: errorExterno } = await supabase
        .from('nps_pesquisas_cliente')
        .select('nota')
        .eq('transportador_id', carrierId)
        .eq('status', 'respondida')
        .not('nota', 'is', null)
        .order('data_resposta', { ascending: false })
        .limit(50);

      const avgInterno = npsInterno && npsInterno.length > 0
        ? npsInterno.reduce((sum, item) => sum + (item.nota_final || 0), 0) / npsInterno.length
        : 0;

      const avgExterno = npsExterno && npsExterno.length > 0
        ? npsExterno.reduce((sum, item) => sum + (item.nota || 0), 0) / npsExterno.length
        : 0;

      return {
        nps_interno: Math.round(avgInterno * 10) / 10,
        nps_externo: Math.round(avgExterno * 10) / 10,
      };
    } catch (error) {
      return { nps_interno: 0, nps_externo: 0 };
    }
  },

  async getAll(): Promise<Carrier[]> {
    try {
      // Buscar contexto do localStorage
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        return [];
      }
      const userData = JSON.parse(savedUser);
      const { organization_id, environment_id, email, codigo } = userData;
      if (!organization_id || !environment_id) {
        return [];
      }
      // Buscar transportadores diretamente com filtros (RLS vai proteger)
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('environment_id', environment_id)
        .order('codigo', { ascending: true });

      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
      }

      const carriers = data || [];

      // Buscar todos os NPS internos de uma vez
      const carrierIds = carriers.map(c => c.id);

      const { data: npsInternoData } = await supabase
        .from('nps_avaliacoes_internas')
        .select('transportador_id, nota_final, periodo_fim')
        .in('transportador_id', carrierIds)
        .order('periodo_fim', { ascending: false });

      const { data: npsExternoData } = await supabase
        .from('nps_pesquisas_cliente')
        .select('transportador_id, nota, data_resposta')
        .in('transportador_id', carrierIds)
        .eq('status', 'respondida')
        .not('nota', 'is', null)
        .order('data_resposta', { ascending: false });

      // Agrupar NPS por transportador
      const npsInternoMap = new Map<string, number[]>();
      const npsExternoMap = new Map<string, number[]>();

      (npsInternoData || []).forEach(item => {
        if (!npsInternoMap.has(item.transportador_id)) {
          npsInternoMap.set(item.transportador_id, []);
        }
        const list = npsInternoMap.get(item.transportador_id)!;
        if (list.length < 10) { // Limitar aos últimos 10
          list.push(item.nota_final || 0);
        }
      });

      (npsExternoData || []).forEach(item => {
        if (!npsExternoMap.has(item.transportador_id)) {
          npsExternoMap.set(item.transportador_id, []);
        }
        const list = npsExternoMap.get(item.transportador_id)!;
        if (list.length < 50) { // Limitar aos últimos 50
          list.push(item.nota || 0);
        }
      });

      // Calcular médias e transformar dados
      const carriersWithNPS = carriers.map(carrier => {
        const npsInternoList = npsInternoMap.get(carrier.id) || [];
        const npsExternoList = npsExternoMap.get(carrier.id) || [];

        const avgInterno = npsInternoList.length > 0
          ? npsInternoList.reduce((sum, nota) => sum + nota, 0) / npsInternoList.length
          : 0;

        const avgExterno = npsExternoList.length > 0
          ? npsExternoList.reduce((sum, nota) => sum + nota, 0) / npsExternoList.length
          : 0;

        const transformedCarrier = this.transformCarrierData(carrier);
        return {
          ...transformedCarrier,
          nps_interno: Math.round(avgInterno * 10) / 10,
          nps_externo: Math.round(avgExterno * 10) / 10,
        };
      });

      return carriersWithNPS;
    } catch (error) {
      return [];
    }
  },

  async getById(id: string): Promise<Carrier | null> {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return this.transformCarrierData(data);
    } catch (error) {
      return null;
    }
  },

  async getByCode(codigo: string): Promise<Carrier | null> {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return this.transformCarrierData(data);
    } catch (error) {
      return null;
    }
  },

  async create(carrier: Omit<Carrier, 'id' | 'created_at' | 'updated_at'>): Promise<Carrier | null> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        throw new Error('Usuário não encontrado');
      }
      const userData = JSON.parse(savedUser);
      const metadata: any = {};
      if (carrier.modal_rodoviario) metadata.modal_rodoviario = true;
      if (carrier.modal_aereo) metadata.modal_aereo = true;
      if (carrier.modal_aquaviario) metadata.modal_aquaviario = true;
      if (carrier.modal_ferroviario) metadata.modal_ferroviario = true;
      if (carrier.considera_sabado_util !== undefined) metadata.considera_sabado_util = carrier.considera_sabado_util;
      if (carrier.considera_domingo_util !== undefined) metadata.considera_domingo_util = carrier.considera_domingo_util;
      if (carrier.considera_feriados !== undefined) metadata.considera_feriados = carrier.considera_feriados;
      if (carrier.tolerancia_valor_cte !== undefined) metadata.tolerancia_valor_cte = carrier.tolerancia_valor_cte;
      if (carrier.tolerancia_percentual_cte !== undefined) metadata.tolerancia_percentual_cte = carrier.tolerancia_percentual_cte;
      if (carrier.tolerancia_valor_fatura !== undefined) metadata.tolerancia_valor_fatura = carrier.tolerancia_valor_fatura;
      if (carrier.tolerancia_percentual_fatura !== undefined) metadata.tolerancia_percentual_fatura = carrier.tolerancia_percentual_fatura;
      if (carrier.rating !== undefined) metadata.rating = carrier.rating;
      if (carrier.active_shipments !== undefined) metadata.active_shipments = carrier.active_shipments;

      // Buscar nomes de país, estado e cidade pelos IDs
      let paisNome = 'Brasil';
      let estadoNome = null;
      let cidadeNome = null;

      if (carrier.pais_id) {
        const { data: pais } = await supabase
          .from('countries')
          .select('nome')
          .eq('id', carrier.pais_id)
          .maybeSingle();
        if (pais) paisNome = pais.nome;
      }

      if (carrier.estado_id) {
        const { data: estado } = await supabase
          .from('states')
          .select('nome')
          .eq('id', carrier.estado_id)
          .maybeSingle();
        if (estado) estadoNome = estado.nome;
      }

      if (carrier.cidade_id) {
        const { data: cidade } = await supabase
          .from('cities')
          .select('nome')
          .eq('id', carrier.cidade_id)
          .maybeSingle();
        if (cidade) cidadeNome = cidade.nome;
      }

      const insertData = {
        organization_id: userData.organization_id,
        environment_id: userData.environment_id,
        codigo: carrier.codigo,
        nome_fantasia: carrier.fantasia || carrier.razao_social,
        razao_social: carrier.razao_social,
        cnpj: carrier.cnpj,
        inscricao_estadual: carrier.inscricao_estadual || null,
        logotipo: carrier.logotipo || null,
        cep: carrier.cep || null,
        logradouro: carrier.logradouro || null,
        numero: carrier.numero || null,
        complemento: carrier.complemento || null,
        bairro: carrier.bairro || null,
        cidade: cidadeNome,
        cidade_id: carrier.cidade_id || null,
        estado: estadoNome,
        estado_id: carrier.estado_id || null,
        pais: paisNome,
        pais_id: carrier.pais_id || null,
        telefone: carrier.phone || null,
        email: carrier.email || null,
        website: null,
        tipo_servico: 'Expresso',
        prazo_coleta: 1,
        prazo_entrega: 3,
        nps_interno: carrier.nps_interno || null,
        ativo: carrier.status === 'ativo',
        metadata: metadata
      };
      const { data, error } = await supabase
        .from('carriers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar transportador: ${error.message}`);
      }
      return this.transformCarrierData(data);
    } catch (error: any) {
      throw error;
    }
  },

  async update(id: string, carrier: Partial<Carrier>): Promise<Carrier | null> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('carriers')
        .select('metadata')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentMetadata = existing?.metadata || {};
      const metadata: any = { ...currentMetadata };

      if (carrier.modal_rodoviario !== undefined) metadata.modal_rodoviario = carrier.modal_rodoviario;
      if (carrier.modal_aereo !== undefined) metadata.modal_aereo = carrier.modal_aereo;
      if (carrier.modal_aquaviario !== undefined) metadata.modal_aquaviario = carrier.modal_aquaviario;
      if (carrier.modal_ferroviario !== undefined) metadata.modal_ferroviario = carrier.modal_ferroviario;
      if (carrier.considera_sabado_util !== undefined) metadata.considera_sabado_util = carrier.considera_sabado_util;
      if (carrier.considera_domingo_util !== undefined) metadata.considera_domingo_util = carrier.considera_domingo_util;
      if (carrier.considera_feriados !== undefined) metadata.considera_feriados = carrier.considera_feriados;
      if (carrier.tolerancia_valor_cte !== undefined) metadata.tolerancia_valor_cte = carrier.tolerancia_valor_cte;
      if (carrier.tolerancia_percentual_cte !== undefined) metadata.tolerancia_percentual_cte = carrier.tolerancia_percentual_cte;
      if (carrier.tolerancia_valor_fatura !== undefined) metadata.tolerancia_valor_fatura = carrier.tolerancia_valor_fatura;
      if (carrier.tolerancia_percentual_fatura !== undefined) metadata.tolerancia_percentual_fatura = carrier.tolerancia_percentual_fatura;
      if (carrier.rating !== undefined) metadata.rating = carrier.rating;
      if (carrier.active_shipments !== undefined) metadata.active_shipments = carrier.active_shipments;

      const updateData: any = { metadata };

      if (carrier.codigo !== undefined) updateData.codigo = carrier.codigo;
      if (carrier.razao_social !== undefined) updateData.razao_social = carrier.razao_social;
      if (carrier.fantasia !== undefined) updateData.nome_fantasia = carrier.fantasia;
      if (carrier.cnpj !== undefined) updateData.cnpj = carrier.cnpj;
      if (carrier.inscricao_estadual !== undefined) updateData.inscricao_estadual = carrier.inscricao_estadual;

      // Buscar nomes de país, estado e cidade pelos IDs
      if (carrier.pais_id !== undefined) {
        updateData.pais_id = carrier.pais_id;
        const { data: pais } = await supabase
          .from('countries')
          .select('nome')
          .eq('id', carrier.pais_id)
          .maybeSingle();
        if (pais) updateData.pais = pais.nome;
      }

      if (carrier.estado_id !== undefined) {
        updateData.estado_id = carrier.estado_id;
        const { data: estado } = await supabase
          .from('states')
          .select('nome')
          .eq('id', carrier.estado_id)
          .maybeSingle();
        if (estado) updateData.estado = estado.nome;
      }

      if (carrier.cidade_id !== undefined) {
        updateData.cidade_id = carrier.cidade_id;
        const { data: cidade } = await supabase
          .from('cities')
          .select('nome')
          .eq('id', carrier.cidade_id)
          .maybeSingle();
        if (cidade) updateData.cidade = cidade.nome;
      }

      if (carrier.logotipo !== undefined) updateData.logotipo = carrier.logotipo;
      if (carrier.logradouro !== undefined) updateData.logradouro = carrier.logradouro;
      if (carrier.numero !== undefined) updateData.numero = carrier.numero;
      if (carrier.complemento !== undefined) updateData.complemento = carrier.complemento;
      if (carrier.bairro !== undefined) updateData.bairro = carrier.bairro;
      if (carrier.cep !== undefined) updateData.cep = carrier.cep;
      if (carrier.email !== undefined) updateData.email = carrier.email;
      if (carrier.phone !== undefined) updateData.telefone = carrier.phone;
      if (carrier.status !== undefined) updateData.ativo = carrier.status === 'ativo';
      if (carrier.nps_interno !== undefined) updateData.nps_interno = carrier.nps_interno;
      const { data, error } = await supabase
        .from('carriers')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }
      return this.transformCarrierData(data);
    } catch (error) {
      throw error;
    }
  },

  async getByCnpj(cnpj: string): Promise<Carrier | null> {
    try {
      const cleanCnpj = cnpj.replace(/\D/g, '');
      if (cleanCnpj.length < 8) {
        return null;
      }

      const cnpjRoot = cleanCnpj.substring(0, 8);
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .ilike('cnpj', `${cnpjRoot}%`)
        .order('codigo', { ascending: true })
        .limit(1);
      if (error) {
        return null;
      }

      const carrier = Array.isArray(data) ? data[0] : data;

      if (carrier) {
        return this.transformCarrierData(carrier);
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      return true;
    } catch (error: any) {
      return false;
    }
  },

  async search(searchTerm: string): Promise<Carrier[]> {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .or(`razao_social.ilike.%${searchTerm}%,fantasia.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('razao_social', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(carrier => this.transformCarrierData(carrier));
    } catch (error) {
      return [];
    }
  },

  async getNextCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('codigo')
        .order('codigo', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || !data.codigo) {
        return '0001';
      }

      const lastCode = data.codigo;
      const codeNumber = parseInt(lastCode, 10);

      if (!isNaN(codeNumber)) {
        const nextNumber = codeNumber + 1;
        return nextNumber.toString().padStart(4, '0');
      }

      return '0001';
    } catch (error) {
      return '0001';
    }
  },

  async getStats() {
    try {
      const carriers = await this.getAll();

      const total = carriers.length;
      const active = carriers.filter(c => c.status === 'ativo').length;
      const inactive = carriers.filter(c => c.status === 'inativo').length;
      const averageRating = carriers.reduce((sum, c) => sum + (c.rating || 0), 0) / total || 0;
      const totalActiveShipments = carriers.reduce((sum, c) => sum + (c.active_shipments || 0), 0);

      return {
        total,
        active,
        inactive,
        averageRating: averageRating.toFixed(1),
        totalActiveShipments,
      };
    } catch (error) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        averageRating: '0.0',
        totalActiveShipments: 0,
      };
    }
  },
};
