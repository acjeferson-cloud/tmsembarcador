import { supabase, ensureSessionContext } from '../lib/supabase';
import { TenantContextHelper } from '../utils/tenantContext';

export interface NPSConfig {
  id: string;
  establishment_id: string;
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
  establishment_id: string;
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
  establishment_id: string;
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
        .eq('establishment_id', estabelecimentoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {

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
            onConflict: 'establishment_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {

      throw error;
    }
  },

  async criarPesquisaCliente(pesquisa: Partial<NPSPesquisaCliente>): Promise<NPSPesquisaCliente> {
    try {
      // Garantir que o contexto da sessão está configurado
      await ensureSessionContext();

      // Log 1: Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();


      // NOVO: Obter contexto (organization_id e environment_id)

      const context = await TenantContextHelper.getCurrentContext();

      if (!context || !context.organizationId || !context.environmentId) {
        const errorMsg = 'Contexto multi-tenant não encontrado. É necessário estar logado e ter organização/ambiente selecionados.';

        throw new Error(errorMsg);
      }



      // Log 2: Verificar dados que serão inseridos (incluindo context)
      const dadosInsert = {
        ...pesquisa,
        organization_id: context.organizationId,
        environment_id: context.environmentId,
        created_at: new Date().toISOString(),
      };


      // Log 3: Tentar inserir

      const { data, error } = await supabase
        .from('nps_pesquisas_cliente')
        .insert(dadosInsert)
        .select()
        .single();

      // Log 4: Resultado
      if (error) {

        throw error;
      }


      return data;
    } catch (error: any) {

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
        .eq('establishment_id', estabelecimentoId)
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
        .or(`environment_id.eq.${estabelecimentoId},establishment_id.eq.${estabelecimentoId}`)
        // Permitir que mostre tanto as respondidas quanto os testes pendentes que o usuario enviou na tela de config
        .in('status', ['respondida', 'pendente'])
        // Se a data de resposta for nula (teste), filtrar pela data de envio
        .or(`data_resposta.gte.${dataInicio},data_envio.gte.${dataInicio}`)
        .or(`data_resposta.lte.${dataFim},data_envio.lte.${dataFim}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

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
        .or(`environment_id.eq.${estabelecimentoId},establishment_id.eq.${estabelecimentoId}`)
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

      throw error;
    }
  },

  gerarDadosDemonstracao(dataInicio: string, dataFim: string): any[] {
    const transportadoras = [
      { id: '11111111-1111-4111-a111-111111111111', razao_social: 'Transportadora Express Ltda' },
      { id: '22222222-2222-4222-a222-222222222222', razao_social: 'LogTrans Transportes' },
      { id: '33333333-3333-4333-a333-333333333333', razao_social: 'RodoLog Logística' },
      { id: '44444444-4444-4444-a444-444444444444', razao_social: 'Fast Cargo Transportes' },
      { id: '55555555-5555-4555-a555-555555555555', razao_social: 'TransNacional S.A.' },
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
          establishment_id: 'demo-estabelecimento',
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

  async getPesquisaByToken(token: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('nps_dispatches')
        .select(`
          *
        `)
        .eq('token', token)
        .maybeSingle();

      if (data) {
        // Mapear status do masculino-neutro (novo backend) para feminino (frontend legado espera)
        if (data.status === 'respondido') {
          data.status = 'respondida';
        } else if (data.status === 'expirado') {
          data.status = 'expirada';
        }
      }

      return data;
    } catch (error) {
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
      const { data, error } = await supabase.functions.invoke('enviar-email-nps', {
        body: {
          estabelecimentoId,
          to,
          subject,
          html,
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao invocar a função Edge enviar-email-nps');
      }

      if (!data?.success) {
        throw new Error(data?.error || data?.message || 'Falha na resposta da função enviar-email-nps');
      }

      return data;
    } catch (error: any) {
      console.warn('⚠️ [npsService] Erro ao disparar email de NPS:', error);
      throw error;
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
  ): Promise<any> {
    try {
      // 1. Atualizar a nova tabela event-driven
      const { data: dispatchData, error: distError } = await supabase
        .from('nps_dispatches')
        .update({
          score: resposta.nota,
          feedback: resposta.comentario,
          status: 'respondido',
          updated_at: new Date().toISOString()
        })
        .eq('token', token)
        .select(`
          *,
          invoices_nfe(
            id,
            numero,
            carrier_id,
            establishment_id,
            customer:invoices_nfe_customers(razao_social, email)
          )
        `)
        .single();
        
      if (distError) throw distError;

      // 2. Injetar na tabela legada para não quebrar o Dashboard Analítico de NPS
      if (dispatchData && dispatchData.invoices_nfe) {
        const inv = dispatchData.invoices_nfe;
        const customerRow = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
        
        // Verifica se a pesquisa já existia no legado (caso um token seja reutilizado/re-enviado)
        const { data: existingLegacy } = await supabase
           .from('nps_pesquisas_cliente')
           .select('id')
           .eq('token_pesquisa', token)
           .maybeSingle();
           
        if (!existingLegacy) {
          await supabase.from('nps_pesquisas_cliente').insert({
             pedido_id: inv.id || 'N/A', // Using invoice_id as pedido_id
             transportador_id: inv.carrier_id || null,
             establishment_id: inv.establishment_id,
             cliente_nome: customerRow?.razao_social || dispatchData.recipient_email || 'Cliente Desconhecido',
             cliente_email: dispatchData.recipient_email,
             nota: resposta.nota,
             comentario: resposta.comentario,
             opinioes: resposta.opinioes,
             avaliar_anonimo: resposta.avaliar_anonimo,
             status: 'respondida',
             data_envio: dispatchData.dispatched_at || dispatchData.created_at,
             data_resposta: new Date().toISOString(),
             canal_envio: dispatchData.channel || 'email',
             token_pesquisa: token,
             organization_id: dispatchData.organization_id,
             environment_id: dispatchData.environment_id,
             created_at: dispatchData.created_at
          });
        } else {
          await supabase.from('nps_pesquisas_cliente').update({
             nota: resposta.nota,
             comentario: resposta.comentario,
             opinioes: resposta.opinioes,
             avaliar_anonimo: resposta.avaliar_anonimo,
             status: 'respondida',
             data_resposta: new Date().toISOString()
          }).eq('token_pesquisa', token);
        }
      }

      return dispatchData;
    } catch (error) {
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
        p_establishment_id: estabelecimentoId,
        p_periodo_inicio: periodoInicio,
        p_periodo_fim: periodoFim,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {

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
        .eq('environment_id', estabelecimentoId)
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
          .or(`environment_id.eq.${estabelecimentoId},establishment_id.eq.${estabelecimentoId}`)
          .in('status', ['respondida', 'pendente'])
          .or(`data_resposta.gte.${periodoInicio},data_envio.gte.${periodoInicio}`)
          .or(`data_resposta.lte.${periodoFim},data_envio.lte.${periodoFim}`);

        if (error) throw error;

        const grouped = data.reduce((acc: any, item: any) => {
          const tid = item.transportador_id;
          if (!acc[tid]) {
            acc[tid] = {
              transportador_id: tid,
              razao_social: item.transportador?.razao_social || (tid ? 'Desconhecido' : 'Geral (S/ Transportadora)'),
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
          .eq('environment_id', estabelecimentoId)
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
        .eq('establishment_id', estabelecimentoId)
        .eq('status', 'pendente')
        .lt('data_envio', dataLimite.toISOString())
        .select();

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {

      throw error;
    }
  },
};
