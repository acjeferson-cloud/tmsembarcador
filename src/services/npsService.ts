import { supabase, ensureSessionContext } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface NPSConfig {
  id: string;
  estabelecimento_id: string;
  nps_cliente_ativo: boolean;
  nps_interno_ativo: boolean;
  canais_envio: {
    whatsapp: boolean;
    email: boolean;
  };
  periodicidade_calculo: 'semanal' | 'quinzenal' | 'mensal';
  pesos_criterios: {
    pontualidade: number;
    ocorrencias: number;
    comunicacao: number;
    pod: number;
  };
  dias_para_expirar: number;
  organization_id?: string;
  environment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NPSOpinioes {
  velocidade_processamento?: 'positivo' | 'negativo' | null;
  clareza_informacoes?: 'positivo' | 'negativo' | null;
  pontualidade_entrega?: 'positivo' | 'negativo' | null;
  condicoes_mercadoria?: 'positivo' | 'negativo' | null;
}

interface NPSPesquisaCliente {
  id: string;
  pedido_id: string;
  transportador_id: string;
  estabelecimento_id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  nota?: number;
  comentario?: string;
  opinioes?: NPSOpinioes;
  avaliar_anonimo?: boolean;
  status: 'pendente' | 'respondida' | 'expirada';
  data_envio?: string;
  data_resposta?: string;
  canal_envio?: 'whatsapp' | 'email';
  token_pesquisa: string;
  organization_id: string;
  environment_id: string;
  created_at?: string;
  updated_at?: string;
}

interface NPSAvaliacaoInterna {
  id: string;
  transportador_id: string;
  estabelecimento_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  nota_final: number;
  metricas: Record<string, any>;
  total_entregas: number;
  entregas_no_prazo: number;
  entregas_com_ocorrencia: number;
  tempo_medio_atualizacao?: number;
  tempo_medio_pod?: number;
  created_at?: string;
  updated_at?: string;
}

interface NPSHistoricoEnvio {
  id: string;
  pesquisa_id: string;
  canal: string;
  status_envio: 'enviado' | 'falha' | 'pendente';
  mensagem_erro?: string;
  data_envio: string;
  created_at?: string;
}

interface NPSClienteResult {
  nps_score: number;
  total_respostas: number;
  promotores: number;
  neutros: number;
  detratores: number;
}

export const npsService = {
  async getConfig(estabelecimentoId: string): Promise<NPSConfig | null> {
    try {
      const { data, error } = await supabase
        .from('nps_config')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração NPS:', error);
      throw error;
    }
  },

  async saveConfig(config: Partial<NPSConfig>): Promise<NPSConfig> {
    try {
      const { data, error } = await supabase
        .from('nps_config')
        .upsert(
          {
            ...config,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'estabelecimento_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração NPS:', error);
      throw error;
    }
  },

  async criarPesquisaCliente(pesquisa: Partial<NPSPesquisaCliente>): Promise<NPSPesquisaCliente> {
    try {
      // Garantir que o contexto da sessão está configurado
      await ensureSessionContext();

      // Log 1: Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 [NPS] Verificando sessão de autenticação:', {
        temSessao: !!sessionData?.session,
        usuario: sessionData?.session?.user?.email,
        role: sessionData?.session?.user?.role,
        errorSessao: sessionError
      });

      // NOVO: Obter contexto (organization_id e environment_id)
      console.log('🔍 [NPS] Obtendo contexto do tenant...');
      const context = await TenantContextHelper.getCurrentContext();

      if (!context || !context.organizationId || !context.environmentId) {
        const errorMsg = 'Contexto multi-tenant não encontrado. É necessário estar logado e ter organização/ambiente selecionados.';
        console.error('❌ [NPS]', errorMsg, context);
        throw new Error(errorMsg);
      }

      console.log('✅ [NPS] Contexto obtido:', {
        organizationId: context.organizationId,
        environmentId: context.environmentId
      });

      // Log 2: Verificar dados que serão inseridos (incluindo context)
      const dadosInsert = {
        ...pesquisa,
        organization_id: context.organizationId,
        environment_id: context.environmentId,
        created_at: new Date().toISOString(),
      };
      console.log('📝 [NPS] Dados que serão inseridos:', dadosInsert);

      // Log 3: Tentar inserir
      console.log('⏳ [NPS] Iniciando INSERT na tabela nps_pesquisas_cliente...');
      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .insert(dadosInsert)
        .select()
        .single();

      // Log 4: Resultado
      if (error) {
        console.error('❌ [NPS] ERRO ao inserir pesquisa:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ [NPS] Pesquisa criada com sucesso:', data);
      return data;
    } catch (error: any) {
      console.error('💥 [NPS] ERRO GERAL ao criar pesquisa NPS cliente:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      throw error;
    }
  },

  async getPesquisasCliente(estabelecimentoId: string, filtros?: {
    transportadorId?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<NPSPesquisaCliente[]> {
    try {
      let query = supabase
        .from('nps_pesquisas_cliente')
        .select(`
          *,
          transportador:carriers(razao_social)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('created_at', { ascending: false });

      if (filtros?.transportadorId) {
        query = query.eq('transportador_id', filtros.transportadorId);
      }

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.dataInicio) {
        query = query.gte('data_envio', filtros.dataInicio);
      }

      if (filtros?.dataFim) {
        query = query.lte('data_envio', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pesquisas NPS:', error);
      throw error;
    }
  },

  async getAvaliacoesCliente(
    estabelecimentoId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<NPSPesquisaCliente[]> {
    try {
      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .select(`
          *,
          transportador:carriers(razao_social)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('status', 'respondida')
        .gte('data_resposta', dataInicio)
        .lte('data_resposta', dataFim)
        .order('data_resposta', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações de clientes:', error);
      throw error;
    }
  },

  async getAvaliacoesInterno(
    estabelecimentoId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<any[]> {
    try {
      const startDate = new Date(dataInicio).toISOString().split('T')[0];
      const endDate = new Date(dataFim).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('nps_avaliacoes_internas')
        .select(`
          *,
          transportador:carriers(razao_social)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .gte('periodo_inicio', startDate)
        .lte('periodo_fim', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Se não houver dados reais, retornar dados de demonstração
      if (!data || data.length === 0) {
        return this.gerarDadosDemonstracao(dataInicio, dataFim);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações internas:', error);
      throw error;
    }
  },

  gerarDadosDemonstracao(dataInicio: string, dataFim: string): any[] {
    const transportadoras = [
      { id: 'demo-1', razao_social: 'Transportadora Express Ltda' },
      { id: 'demo-2', razao_social: 'LogTrans Transportes' },
      { id: 'demo-3', razao_social: 'RodoLog Logística' },
      { id: 'demo-4', razao_social: 'Fast Cargo Transportes' },
      { id: 'demo-5', razao_social: 'TransNacional S.A.' },
    ];

    const cenarios = [
      {
        nota: 9.2,
        entregas_no_prazo: 95,
        total_entregas: 100,
        entregas_com_ocorrencia: 2,
        tempo_medio_atualizacao: 2.5,
        tempo_medio_pod: 12,
        metricas: {
          pontualidade: 9.5,
          ocorrencias: 9.8,
          comunicacao: 8.9,
          pod: 8.8
        }
      },
      {
        nota: 7.8,
        entregas_no_prazo: 78,
        total_entregas: 100,
        entregas_com_ocorrencia: 8,
        tempo_medio_atualizacao: 4.2,
        tempo_medio_pod: 18,
        metricas: {
          pontualidade: 7.8,
          ocorrencias: 8.4,
          comunicacao: 7.5,
          pod: 7.6
        }
      },
      {
        nota: 6.5,
        entregas_no_prazo: 68,
        total_entregas: 100,
        entregas_com_ocorrencia: 15,
        tempo_medio_atualizacao: 6.8,
        tempo_medio_pod: 24,
        metricas: {
          pontualidade: 6.8,
          ocorrencias: 7.0,
          comunicacao: 6.2,
          pod: 6.3
        }
      },
      {
        nota: 8.5,
        entregas_no_prazo: 88,
        total_entregas: 100,
        entregas_com_ocorrencia: 5,
        tempo_medio_atualizacao: 3.1,
        tempo_medio_pod: 14,
        metricas: {
          pontualidade: 8.8,
          ocorrencias: 9.0,
          comunicacao: 8.2,
          pod: 8.0
        }
      },
      {
        nota: 5.2,
        entregas_no_prazo: 58,
        total_entregas: 100,
        entregas_com_ocorrencia: 22,
        tempo_medio_atualizacao: 8.5,
        tempo_medio_pod: 32,
        metricas: {
          pontualidade: 5.8,
          ocorrencias: 5.6,
          comunicacao: 5.0,
          pod: 4.8
        }
      }
    ];

    // Gerar avaliações para cada transportadora
    const avaliacoes = transportadoras.map((transp, index) => {
      const cenario = cenarios[index];
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);

      // Dividir período em semanas para gerar múltiplas avaliações
      const avaliacoesPeriodo: any[] = [];
      const diasPorPeriodo = 7;
      let currentDate = new Date(inicio);

      while (currentDate < fim) {
        const periodoFimDate = new Date(currentDate);
        periodoFimDate.setDate(currentDate.getDate() + diasPorPeriodo);

        if (periodoFimDate > fim) {
          periodoFimDate.setTime(fim.getTime());
        }

        // Adicionar variação aleatória nas métricas
        const variacao = (Math.random() - 0.5) * 0.8;

        avaliacoesPeriodo.push({
          id: `demo-${transp.id}-${currentDate.getTime()}`,
          transportador_id: transp.id,
          estabelecimento_id: 'demo-estabelecimento',
          periodo_inicio: currentDate.toISOString().split('T')[0],
          periodo_fim: periodoFimDate.toISOString().split('T')[0],
          nota_final: Math.max(0, Math.min(10, cenario.nota + variacao)),
          metricas: {
            pontualidade: Math.max(0, Math.min(10, cenario.metricas.pontualidade + variacao)),
            ocorrencias: Math.max(0, Math.min(10, cenario.metricas.ocorrencias + variacao)),
            comunicacao: Math.max(0, Math.min(10, cenario.metricas.comunicacao + variacao)),
            pod: Math.max(0, Math.min(10, cenario.metricas.pod + variacao))
          },
          total_entregas: Math.floor(cenario.total_entregas + (Math.random() - 0.5) * 20),
          entregas_no_prazo: Math.floor(cenario.entregas_no_prazo + (Math.random() - 0.5) * 10),
          entregas_com_ocorrencia: Math.floor(cenario.entregas_com_ocorrencia + (Math.random() - 0.5) * 5),
          tempo_medio_atualizacao: Math.max(1, cenario.tempo_medio_atualizacao + (Math.random() - 0.5) * 2),
          tempo_medio_pod: Math.max(5, cenario.tempo_medio_pod + (Math.random() - 0.5) * 5),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          transportador: transp
        });

        currentDate.setDate(currentDate.getDate() + diasPorPeriodo);
      }

      return avaliacoesPeriodo;
    }).flat();

    return avaliacoes;
  },

  async getPesquisaByToken(token: string): Promise<NPSPesquisaCliente | null> {
    try {
      console.log('🔎 Buscando pesquisa NPS por token:', token);

      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .select(`
          *,
          transportador:carriers(razao_social)
        `)
        .eq('token_pesquisa', token)
        .maybeSingle();

      console.log('📥 Resultado da busca:', { data, error });

      if (error) {
        console.error('❌ Erro no Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar pesquisa por token:', error);
      throw error;
    }
  },

  async enviarEmailNPS(
    estabelecimentoId: string,
    to: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Enviando email NPS:', { estabelecimentoId, to });
      console.log('URL:', `${supabaseUrl}/functions/v1/enviar-email-nps`);

      const response = await fetch(`${supabaseUrl}/functions/v1/enviar-email-nps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          estabelecimentoId,
          to,
          subject,
          html,
        }),
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar email';
        try {
          const result = await response.json();
          errorMessage = result.message || result.error || errorMessage;
          console.error('Erro da Edge Function:', result);
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Resposta da Edge Function:', result);

      return result;
    } catch (error: any) {
      console.error('Erro ao enviar email NPS:', error);
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao servidor de email. Verifique sua conexão e tente novamente.');
      }
      throw new Error(error.message || 'Erro ao comunicar com o servidor de email');
    }
  },

  async responderPesquisa(
    token: string,
    resposta: {
      nota: number;
      comentario?: string;
      opinioes?: NPSOpinioes;
      avaliar_anonimo?: boolean;
    }
  ): Promise<NPSPesquisaCliente> {
    try {
      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .update({
          nota: resposta.nota,
          comentario: resposta.comentario,
          opinioes: resposta.opinioes,
          avaliar_anonimo: resposta.avaliar_anonimo,
          status: 'respondida',
          data_resposta: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token_pesquisa', token)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao responder pesquisa:', error);
      throw error;
    }
  },

  async calcularNPSCliente(
    transportadorId: string,
    periodoInicio: string,
    periodoFim: string
  ): Promise<NPSClienteResult> {
    try {
      const { data, error } = await supabase.rpc('calcular_nps_cliente', {
        p_transportador_id: transportadorId,
        p_periodo_inicio: periodoInicio,
        p_periodo_fim: periodoFim,
      });

      if (error) throw error;
      return data[0] || {
        nps_score: 0,
        total_respostas: 0,
        promotores: 0,
        neutros: 0,
        detratores: 0,
      };
    } catch (error) {
      console.error('Erro ao calcular NPS cliente:', error);
      throw error;
    }
  },

  async calcularNPSInterno(
    transportadorId: string,
    estabelecimentoId: string,
    periodoInicio: string,
    periodoFim: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calcular_nps_interno', {
        p_transportador_id: transportadorId,
        p_estabelecimento_id: estabelecimentoId,
        p_periodo_inicio: periodoInicio,
        p_periodo_fim: periodoFim,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Erro ao calcular NPS interno:', error);
      throw error;
    }
  },

  async salvarAvaliacaoInterna(avaliacao: Partial<NPSAvaliacaoInterna>): Promise<NPSAvaliacaoInterna> {
    try {
      const { data, error } = await supabase
        .from('nps_avaliacoes_internas')
        .insert({
          ...avaliacao,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar avaliação interna:', error);
      throw error;
    }
  },

  async getAvaliacoesInternas(estabelecimentoId: string, filtros?: {
    transportadorId?: string;
    periodoInicio?: string;
    periodoFim?: string;
  }): Promise<NPSAvaliacaoInterna[]> {
    try {
      let query = supabase
        .from('nps_avaliacoes_internas')
        .select(`
          *,
          transportador:carriers(razao_social)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('periodo_fim', { ascending: false });

      if (filtros?.transportadorId) {
        query = query.eq('transportador_id', filtros.transportadorId);
      }

      if (filtros?.periodoInicio) {
        query = query.gte('periodo_inicio', filtros.periodoInicio);
      }

      if (filtros?.periodoFim) {
        query = query.lte('periodo_fim', filtros.periodoFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações internas:', error);
      throw error;
    }
  },

  async getRankingTransportadoras(
    estabelecimentoId: string,
    periodoInicio: string,
    periodoFim: string,
    tipo: 'cliente' | 'interno' = 'cliente'
  ): Promise<Array<{
    transportador_id: string;
    razao_social: string;
    nps: number;
    total_respostas?: number;
  }>> {
    try {
      if (tipo === 'cliente') {
        const { data, error} = await supabase
          .from('nps_pesquisas_cliente')
          .select(`
            transportador_id,
            nota,
            transportador:carriers(razao_social)
          `)
          .eq('estabelecimento_id', estabelecimentoId)
          .eq('status', 'respondida')
          .gte('data_resposta', periodoInicio)
          .lte('data_resposta', periodoFim);

        if (error) throw error;

        const grouped = data.reduce((acc: any, item: any) => {
          const tid = item.transportador_id;
          if (!acc[tid]) {
            acc[tid] = {
              transportador_id: tid,
              razao_social: item.transportador?.razao_social || 'Desconhecido',
              promotores: 0,
              neutros: 0,
              detratores: 0,
              total: 0,
            };
          }
          acc[tid].total++;
          if (item.nota >= 9) acc[tid].promotores++;
          else if (item.nota >= 7) acc[tid].neutros++;
          else acc[tid].detratores++;
          return acc;
        }, {});

        return Object.values(grouped).map((item: any) => ({
          transportador_id: item.transportador_id,
          razao_social: item.razao_social,
          nps: item.total > 0
            ? ((item.promotores - item.detratores) / item.total) * 100
            : 0,
          total_respostas: item.total,
        })).sort((a: any, b: any) => b.nps - a.nps);
      } else {
        const { data, error } = await supabase
          .from('nps_avaliacoes_internas')
          .select(`
            transportador_id,
            nota_final,
            total_entregas,
            transportador:carriers(razao_social)
          `)
          .eq('estabelecimento_id', estabelecimentoId)
          .lte('periodo_inicio', periodoFim)
          .gte('periodo_fim', periodoInicio);

        if (error) throw error;

        // Se não houver dados, gerar dados de demonstração
        if (!data || data.length === 0) {
          const dadosDemo = this.gerarDadosDemonstracao(periodoInicio, periodoFim);
          const grouped = dadosDemo.reduce((acc: any, item: any) => {
            const tid = item.transportador_id;
            if (!acc[tid] || item.nota_final > acc[tid].nps) {
              acc[tid] = {
                transportador_id: tid,
                razao_social: item.transportador?.razao_social || 'Desconhecido',
                nps: item.nota_final,
                total_respostas: item.total_entregas,
              };
            }
            return acc;
          }, {});

          return Object.values(grouped).sort((a: any, b: any) => b.nps - a.nps);
        }

        const grouped = data.reduce((acc: any, item: any) => {
          const tid = item.transportador_id;
          if (!acc[tid] || item.nota_final > acc[tid].nps) {
            acc[tid] = {
              transportador_id: tid,
              razao_social: item.transportador?.razao_social || 'Desconhecido',
              nps: item.nota_final,
              total_respostas: item.total_entregas,
            };
          }
          return acc;
        }, {});

        return Object.values(grouped).sort((a: any, b: any) => b.nps - a.nps);
      }
    } catch (error) {
      console.error('Erro ao buscar ranking transportadoras:', error);
      throw error;
    }
  },

  async registrarEnvio(envio: Partial<NPSHistoricoEnvio>): Promise<NPSHistoricoEnvio> {
    try {
      const { data, error } = await supabase
        .from('nps_historico_envios')
        .insert({
          ...envio,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao registrar envio:', error);
      throw error;
    }
  },

  async expirarPesquisasPendentes(estabelecimentoId: string): Promise<number> {
    try {
      const config = await this.getConfig(estabelecimentoId);
      if (!config) return 0;

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - config.dias_para_expirar);

      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .update({
          status: 'expirada',
          updated_at: new Date().toISOString(),
        })
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('status', 'pendente')
        .lt('data_envio', dataLimite.toISOString())
        .select();

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Erro ao expirar pesquisas:', error);
      throw error;
    }
  },
};
