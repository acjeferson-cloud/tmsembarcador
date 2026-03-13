import React, { useState, useEffect } from 'react';
import { Save, Settings, TrendingUp, Users, MessageSquare, Mail, Send, TestTube, Info } from 'lucide-react';
import { npsService, NPSConfig } from '../../services/npsService';
import { npsEmailTemplateService } from '../../services/npsEmailTemplateService';
import { InlineMessage } from '../common/InlineMessage';
import { Toast, ToastType } from '../common/Toast';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';
import { getBaseUrl } from '../../utils/urlHelpers';

export const NPSConfiguration: React.FC = () => {
  const { user } = useAuth();
  const { isActive: npsActive, isLoading: npsLoading } = useInnovation(
    INNOVATION_IDS.NPS,
    user?.id
  );
  const [config, setConfig] = useState<Partial<NPSConfig>>({
    nps_cliente_ativo: true,
    nps_interno_ativo: true,
    canais_envio: {
      whatsapp: true,
      email: false,
    },
    periodicidade_calculo: 'mensal',
    pesos_criterios: {
      pontualidade: 0.40,
      ocorrencias: 0.30,
      comunicacao: 0.15,
      pod: 0.15,
    },
    dias_para_expirar: 7,
  });

  const [estabelecimentoId, setEstabelecimentoId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async (): Promise<string | null> => {
    try {
      const estabelecimentoStr = localStorage.getItem('tms-current-establishment');
      if (!estabelecimentoStr) {
        console.warn('⚠️ [NPSConfig] Nenhum estabelecimento selecionado no localStorage');
        return null;
      }

      const estabelecimento = JSON.parse(estabelecimentoStr);
      const codigo = estabelecimento.codigo;

      if (!codigo) {
        console.warn('⚠️ [NPSConfig] Estabelecimento sem código:', estabelecimento);
        return null;
      }

      console.log('🔍 [NPSConfig] Buscando estabelecimento por código:', codigo);

      // Buscar estabelecimento (o contexto é configurado automaticamente)
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('establishments')
        .select('id, codigo, razao_social, organization_id, environment_id')
        .eq('codigo', codigo)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [NPSConfig] Erro ao buscar estabelecimento:', error);
        console.error('   Código:', error.code);
        console.error('   Mensagem:', error.message);
        console.error('   Detalhes:', error.details);

        if (error.code === 'PGRST116') {
          setToast({
            message: `Múltiplos estabelecimentos encontrados com código ${codigo}. Verifique o contexto da sessão.`,
            type: 'error',
          });
        } else {
          setToast({
            message: 'Erro ao buscar estabelecimento. Tente novamente',
            type: 'error',
          });
        }
        return null;
      }

      if (!data?.id) {
        console.warn('⚠️ [NPSConfig] Estabelecimento não encontrado com código:', codigo);
        setToast({
          message: `Estabelecimento não encontrado nesta organização/ambiente`,
          type: 'error',
        });
        return null;
      }

      console.log('✅ [NPSConfig] Estabelecimento encontrado:', {
        id: data.id,
        codigo: data.codigo,
        razao_social: data.razao_social,
        organization_id: data.organization_id,
        environment_id: data.environment_id
      });

      setEstabelecimentoId(data.id);

      const existingConfig = await npsService.getConfig(data.id);
      if (existingConfig) {
        setConfig(existingConfig);
      }

      return data.id;
    } catch (error) {
      console.error('❌ [NPSConfig] Erro ao carregar configuração:', error);
      setToast({
        message: 'Erro ao carregar configuração. Tente novamente',
        type: 'error',
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!npsActive) {
      setToast({
        message: 'Recurso não contratado. Ative em Inovações & Sugestões.',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      setValidationError('');

      const totalPesos =
        config.pesos_criterios!.pontualidade +
        config.pesos_criterios!.ocorrencias +
        config.pesos_criterios!.comunicacao +
        config.pesos_criterios!.pod;

      if (Math.abs(totalPesos - 1) > 0.01) {
        setValidationError('A soma dos pesos dos critérios deve ser igual a 100%');
        return;
      }

      await npsService.saveConfig({
        ...config,
        establishment_id: estabelecimentoId,
      });

      setToast({
        message: 'Configurações salvas com sucesso',
        type: 'success',
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      setToast({
        message: 'Erro ao salvar configurações. Tente novamente',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePesoChange = (campo: string, valor: number) => {
    setConfig({
      ...config,
      pesos_criterios: {
        ...config.pesos_criterios!,
        [campo]: valor,
      },
    });
    setValidationError('');
  };

  const handleSendTest = async () => {
    if (!npsActive) {
      setToast({
        message: 'Recurso não contratado. Ative em Inovações & Sugestões.',
        type: 'error',
      });
      return;
    }

    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setToast({
        message: 'Por favor, insira um email válido',
        type: 'error',
      });
      return;
    }

    console.log('🔍 [NPSConfig] Verificando estabelecimento ID:', estabelecimentoId);

    let estabId = estabelecimentoId;

    if (!estabId) {
      console.error('❌ [NPSConfig] estabelecimentoId está vazio!');
      console.log('📋 LocalStorage tms-current-establishment:', localStorage.getItem('tms-current-establishment'));

      // Tentar carregar novamente e obter o ID
      estabId = await loadConfig();

      // Verificar se conseguimos obter o ID
      if (!estabId) {
        setToast({
          message: 'Estabelecimento não identificado. Verifique se você selecionou um estabelecimento válido.',
          type: 'error',
        });
        return;
      }
    }

    try {
      setIsSendingTest(true);
      console.log('✅ [NPSConfig] Iniciando envio de teste com estabelecimento ID:', estabId);

      // Buscar dados do estabelecimento SEMPRE COM A VERSÃO MAIS RECENTE
      const { supabase } = await import('../../lib/supabase');
      const { data: estabelecimentoData, error: fetchError } = await supabase
        .from('establishments')
        .select('razao_social, cnpj, codigo')
        .eq('id', estabId)
        .maybeSingle();

      if (fetchError) {
        console.error('Erro ao buscar estabelecimento:', fetchError);
      }

      console.log('Dados do estabelecimento (fresco do banco):', {
        razao_social: estabelecimentoData?.razao_social,
      });

      // Priorizar logo_nps_base64 para emails NPS
      let logoNps = null;

      console.log('Logo NPS selecionado: Usando logo padrão');

      // Buscar transportadora de exemplo do banco
      const { data: transportadoraData } = await supabase
        .from('carriers')
        .select('id, razao_social, fantasia')
        .limit(1)
        .maybeSingle();

      console.log('🚀 [NPSConfig] Antes de criar pesquisa - Verificando autenticação...');
      const { data: authCheck } = await supabase.auth.getSession();
      console.log('🔐 [NPSConfig] Status de autenticação:', {
        autenticado: !!authCheck?.session,
        email: authCheck?.session?.user?.email,
        accessToken: authCheck?.session?.access_token ? 'Presente' : 'Ausente'
      });

      console.log('📋 [NPSConfig] Gerando registro fantasma de teste de Pesquisa NPS com token para validação...');

      const tokenGerado = 'TESTE-' + Array.from({ length: 26 }, () => Math.random().toString(36).substring(2)).join('').substring(0, 26);

      try {
        await npsService.criarPesquisaCliente({
          pedido_id: "PEDIDO-TESTE",
          cliente_nome: "Cliente Teste",
          cliente_email: testEmail,
          cliente_telefone: "11999999999",
          transportador_id: transportadoraData?.id || null,
          canal_envio: "email",
          token_pesquisa: tokenGerado,
          status: "pendente",
          establishment_id: estabId
        });
        console.log('✅ Pesquisa de Teste inserida no banco com sucesso!');
      } catch (err) {
        console.error('⚠️ [NPSConfig] Erro ao criar pesquisa de teste no banco:', err);
      }

      // Gerar HTML com o template profissional
      const emailHtml = npsEmailTemplateService.generateNPSEmail(
        {
          clienteNome: 'Cliente Teste',
          transportadoraNome: transportadoraData?.fantasia || transportadoraData?.razao_social || 'Transportadora Exemplo',
          numeroPedido: `PED-${Math.floor(Math.random() * 10000)}`,
          dataEntrega: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          tokenPesquisa: tokenGerado,
          itensPedido: [
            {
              codigo: 'SKU-4380',
              descricao: 'Notebook Dell Inspiron',
              quantidade: 2,
              valorUnitario: 1635.00,
              valorTotal: 3270.00
            },
            {
              codigo: 'SKU-7741',
              descricao: 'Smartphone Samsung Galaxy',
              quantidade: 3,
              valorUnitario: 981.00,
              valorTotal: 2943.00
            },
            {
              codigo: 'SKU-9698',
              descricao: 'Monitor LG 24"',
              quantidade: 2,
              valorUnitario: 2098.00,
              valorTotal: 4196.00
            },
            {
              codigo: 'SKU-1640',
              descricao: 'Teclado Mecânico Logitech',
              quantidade: 4,
              valorUnitario: 453.00,
              valorTotal: 1812.00
            },
            {
              codigo: 'SKU-8480',
              descricao: 'Mouse Gamer Razer',
              quantidade: 1,
              valorUnitario: 1811.00,
              valorTotal: 1811.00
            }
          ],
          totalItens: 5,
          valorProdutos: 14032.00,
          valorTotalPedido: 14526.00,
          estabelecimento: {
            razaoSocial: estabelecimentoData?.razao_social || 'Sua Empresa',
            cnpj: estabelecimentoData?.cnpj,
            codigo: estabelecimentoData?.codigo,
            logoBase64: logoNps
          }
        },
        getBaseUrl()
      );

      const emailSubject = 'Avalie sua experiência - Pesquisa de Satisfação';

      const resultado = await npsService.enviarEmailNPS(
        estabId,
        testEmail,
        emailSubject,
        emailHtml
      );

      console.log('Resultado do envio:', resultado);

      let mensagem = resultado.message || `Email de teste enviado com sucesso para ${testEmail}!`;

      if (resultado.note) {
        mensagem += `\n\n${resultado.note}`;
      }

      if (resultado.details) {
        mensagem += `\n${resultado.details}`;
      }

      setToast({
        message: mensagem,
        type: 'success',
      });

      setShowTestModal(false);
      setTestEmail('');
    } catch (error: any) {
      console.error('Erro completo ao enviar teste:', error);
      const errorMessage = error?.message || 'Erro ao enviar email de teste. Verifique as configurações de email do estabelecimento.';
      setToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const totalPesos = config.pesos_criterios
    ? Object.values(config.pesos_criterios).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            Configuração NPS
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure o sistema de avaliação Net Promoter Score
          </p>
        </div>
      </div>

      {/* Innovation Notice */}
      {!npsActive && !npsLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Integração de Serviço de NPS não contratada:</strong> Para utilizar o sistema de pesquisa de satisfação NPS,
              é necessário ativar o serviço em <strong>Inovações & Sugestões</strong>. Sem a ativação, as configurações não terão efeito.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurações Gerais
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      NPS Cliente Final
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pesquisa de satisfação enviada após entregas
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.nps_cliente_ativo}
                    onChange={(e) => setConfig({ ...config, nps_cliente_ativo: e.target.checked })}
                    disabled={!npsActive}
                    className="sr-only peer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      NPS Interno Automático
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avaliação automática baseada em métricas operacionais
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.nps_interno_ativo}
                    onChange={(e) => setConfig({ ...config, nps_interno_ativo: e.target.checked })}
                    disabled={!npsActive}
                    className="sr-only peer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {config.nps_cliente_ativo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Canais de Envio
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">WhatsApp</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.canais_envio?.whatsapp}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          canais_envio: {
                            ...config.canais_envio!,
                            whatsapp: e.target.checked,
                          },
                        })
                      }
                      disabled={!npsActive}
                      className="sr-only peer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">E-mail</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.canais_envio?.email}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          canais_envio: {
                            ...config.canais_envio!,
                            email: e.target.checked,
                          },
                        })
                      }
                      disabled={!npsActive}
                      className="sr-only peer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dias para expirar pesquisa pendente
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.dias_para_expirar}
                  onChange={(e) => setConfig({ ...config, dias_para_expirar: parseInt(e.target.value) })}
                  disabled={!npsActive}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="mt-2">
                  <InlineMessage type="info" message="Pesquisas não respondidas expiram automaticamente após este período" />
                </div>
              </div>
            </div>
          )}

          {config.nps_interno_ativo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                NPS Interno - Configurações
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Periodicidade de Cálculo
                </label>
                <select
                  value={config.periodicidade_calculo}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      periodicidade_calculo: e.target.value as 'semanal' | 'quinzenal' | 'mensal',
                    })
                  }
                  disabled={!npsActive}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Pesos dos Critérios de Avaliação
                </h4>
                <div className="mb-3">
                  {totalPesos === 1 ? (
                    <InlineMessage
                      type="success"
                      message={`Total: ${(totalPesos * 100).toFixed(0)}% - Configuração válida`}
                    />
                  ) : (
                    <InlineMessage
                      type="warning"
                      message={`Total: ${(totalPesos * 100).toFixed(0)}% - Deve somar exatamente 100%`}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pontualidade nas entregas: {(config.pesos_criterios!.pontualidade * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.pesos_criterios!.pontualidade}
                      onChange={(e) => handlePesoChange('pontualidade', parseFloat(e.target.value))}
                      disabled={!npsActive}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ocorrências/Avarias: {(config.pesos_criterios!.ocorrencias * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.pesos_criterios!.ocorrencias}
                      onChange={(e) => handlePesoChange('ocorrencias', parseFloat(e.target.value))}
                      disabled={!npsActive}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comunicação e status: {(config.pesos_criterios!.comunicacao * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.pesos_criterios!.comunicacao}
                      onChange={(e) => handlePesoChange('comunicacao', parseFloat(e.target.value))}
                      disabled={!npsActive}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmação de entrega (POD): {(config.pesos_criterios!.pod * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.pesos_criterios!.pod}
                      onChange={(e) => handlePesoChange('pod', parseFloat(e.target.value))}
                      disabled={!npsActive}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {validationError && (
                <div className="mt-4">
                  <InlineMessage type="error" message={validationError} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTestModal(true)}
              disabled={!npsActive || !config.canais_envio?.email}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="w-5 h-5" />
              Testar Envio NPS
            </button>
            <button
              onClick={handleSave}
              disabled={!npsActive || isLoading || totalPesos !== 1}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <TestTube className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Testar Envio de Pesquisa NPS
              </h3>
            </div>

            <div className="mb-4">
              <InlineMessage
                type="info"
                message="Será criada uma pesquisa de teste. Você receberá um link para simular a resposta do cliente."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email de teste
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
                disabled={isSendingTest}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {isSendingTest ? 'Criando...' : 'Criar Teste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
