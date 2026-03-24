import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, Search, Calendar, Filter, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCcw, Send, CheckSquare, X, Play, Activity
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { npsCxService, NpsDispatch, NpsSettings } from '../../services/npsCxService';
import { Toast, ToastType } from '../common/Toast';
import Breadcrumbs from '../Layout/Breadcrumbs';

export const NPSConfiguration = () => {
  const { t } = useTranslation();
  
  // Settings State
  const [settings, setSettings] = useState<NpsSettings>({
    automation_active: false,
    delay_hours: 24,
    expiration_days: 7
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Grid State
  const [dispatches, setDispatches] = useState<NpsDispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    searchText: ''
  });
  
  // Resend / Cancel State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isTestingJob, setIsTestingJob] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const breadcrumbItems = [
    { label: t('NPS / Customer Experience') },
    { label: t('Configurações e Disparos'), current: true }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, dispatchesData] = await Promise.all([
        npsCxService.getSettings(),
        npsCxService.getDispatches({ status: filters.status, searchText: filters.searchText })
      ]);
      
      if (settingsData) {
        setSettings(settingsData);
      }
      setDispatches(dispatchesData);
    } catch (error) {
      console.error('Erro ao carregar dados NPS CX:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const data = await npsCxService.getDispatches({ 
        status: filters.status, 
        searchText: filters.searchText 
      });
      setDispatches(data);
    } catch (error) {
      console.error('Erro ao pesquisar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingConfig(true);
    setConfigSuccess(false);
    try {
      const savedSettings = await npsCxService.saveSettings(settings);
      setSettings(savedSettings);
      setConfigSuccess(true);
      setToast({ message: 'Regras de automação salvas com sucesso!', type: 'success' });
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar settings:', error);
      let errMsg = error.message || 'Erro desconhecido ao salvar configurações Automáticas de NPS.';
      // Dica para cenário de tabela não existente:
      if (errMsg.includes('relation "public.nps_settings" does not exist')) {
         errMsg = 'A tabela nps_settings não existe no banco. Por favor, rode a migração SQL gerada no Supabase!';
      }
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResend = async (id: string, currentEmail: string) => {
    const newEmail = prompt('Confirmar reenvio para E-mail:', currentEmail);
    if (newEmail === null) return; // Cancelled
    
    setProcessingId(id);
    try {
      await npsCxService.resendNps(id, newEmail !== currentEmail ? newEmail : undefined);
      setToast({ message: 'Disparo agendado para reenvio com sucesso na próxima janela do robô.', type: 'info' });
      loadData(); // refresh grid
    } catch (error: any) {
      console.error('Erro ao reenviar NPS:', error);
      setToast({ message: 'Erro ao agendar reenvio: ' + (error.message || 'Desconhecido'), type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja cancelar o envio deste NPS? A Nota Fiscal não será avaliada.')) return;
    
    setProcessingId(id);
    try {
      await npsCxService.cancelNps(id);
      setToast({ message: 'NPS cancelado com sucesso.', type: 'info' });
      loadData(); // refresh grid
    } catch (error: any) {
      console.error('Erro ao cancelar NPS:', error);
      setToast({ message: 'Erro ao cancelar disparo: ' + (error.message || 'Desconhecido'), type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleTestDispatch = async () => {
    setIsTestingJob(true);
    try {
       const res = await npsCxService.triggerTestScheduler();
       setToast({ 
         message: `Teste concluído! Envios realizados: ${res.sent || 0}. Erros encontrados: ${res.errors || 0}.`, 
         type: res.errors > 0 ? 'warning' : 'success' 
       });
       loadData();
    } catch (error: any) {
       console.error('Falha no Teste do Schedule:', error);
       setToast({ 
         message: 'Erro no teste. Verifique se a Edge Function nps-scheduler foi instanciada no Supabase. Detalhes: ' + error.message, 
         type: 'error' 
       });
    } finally {
       setIsTestingJob(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <span className="px-2 py-1 flex items-center gap-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"><Clock size={12}/> Pendente</span>;
      case 'enviado':
        return <span className="px-2 py-1 flex items-center gap-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Send size={12}/> Enviado</span>;
      case 'respondido':
        return <span className="px-2 py-1 flex items-center gap-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle size={12}/> Respondido</span>;
      case 'expirado':
        return <span className="px-2 py-1 flex items-center gap-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700"><Clock size={12}/> Expirado</span>;
      case 'erro':
        return <span className="px-2 py-1 flex items-center gap-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><AlertCircle size={12}/> Erro/Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* HEADER E CONFIGURAÇÕES REVISADO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Settings className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Experience Automations</h1>
              <p className="text-gray-500 dark:text-gray-400">Configure e gerencie o disparo de Pesquisas de Satisfação baseado em Notas Entregues.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button
               onClick={handleTestDispatch}
               disabled={isTestingJob}
               title="Dispara manualmente a rotina que avalia envios de e-mails em lote sem esperar 1 hora"
               className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium border border-indigo-700"
             >
               {isTestingJob ? <RefreshCcw className="animate-spin" size={18} /> : <Activity size={18} />}
               <span className="hidden sm:inline">{isTestingJob ? 'Rodando Robô...' : 'Forçar Disparo Agora (Job)'}</span>
             </button>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Automação de Disparo</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSettings({...settings, automation_active: !settings.automation_active})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.automation_active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.automation_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${settings.automation_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {settings.automation_active ? 'Robô Ativado' : 'Robô Pausado'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ative para permitir que o sistema avalie automaticamente Notas Entregues.</p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delay para envio (Horas)</label>
              <input 
                type="number" 
                min="0"
                value={settings.delay_hours}
                onChange={e => setSettings({...settings, delay_hours: Number(e.target.value)})}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Tempo após a confirmação do evento de Entrega.</p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expiração (Dias)</label>
              <input 
                type="number" 
                min="1"
                value={settings.expiration_days}
                onChange={e => setSettings({...settings, expiration_days: Number(e.target.value)})}
                className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Validade do token do usuário para responder a pesquisa.</p>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingConfig}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {isSavingConfig ? <RefreshCcw className="animate-spin" size={18} /> : <CheckSquare size={18} />}
                <span>{isSavingConfig ? 'Salvando...' : 'Salvar Regras'}</span>
              </button>
            </div>
          </div>
          {configSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm flex items-center justify-center">
              Revisão de automação salva com sucesso! O Robô refletirá essa configuração em sua próxima rodada (A cada hora).
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gestão Operacional de Disparos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por Nº da Nota ou E-mail do Cliente..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setTimeout(handleSearch, 100);
              }}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-black dark:text-white appearance-none"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente de Envio</option>
              <option value="enviado">Enviado (Aguardando Resposta)</option>
              <option value="respondido">Respondido</option>
              <option value="expirado">Expirado</option>
              <option value="erro">Com Erro</option>
            </select>
          </div>
          <button 
            onClick={handleSearch}
            className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Filter size={18} />
            <span>Pesquisar</span>
          </button>
        </div>
      </div>

      {/* GRID DOS ENVIOS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nota Fiscal / Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status NPS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Últ. Atualização</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCcw className="animate-spin mx-auto mb-4" size={24} />
                    Carregando listagem de Customer Experience...
                  </td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma pesquisa de NPS rastreada para os critérios selecionados.
                    <br /> <span className="text-xs text-gray-400">As Notas Entregues aparecerão aqui assim que o evento de status ocorrer para avaliarmos a resposta do seu cliente!</span>
                  </td>
                </tr>
              ) : (
                dispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          NF {dispatch.invoices_nfe?.numero || '-'}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-xs">
                          {dispatch.invoices_nfe?.customer?.[0]?.razao_social || 'Cliente não identificado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {dispatch.recipient_email || <span className="text-red-500 text-xs font-medium">Sem-Email Cadastrado</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(dispatch.status)}
                      {dispatch.error_reason && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={dispatch.error_reason}>
                          {dispatch.error_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-xs text-gray-500 dark:text-gray-400">
                         {formatDate(dispatch.dispatched_at || dispatch.scheduled_for || dispatch.created_at)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        dispatch.score === null ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' :
                        dispatch.score >= 9 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                        dispatch.score >= 7 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {dispatch.score !== null ? dispatch.score : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(dispatch.status === 'pendente' || dispatch.status === 'erro' || dispatch.status === 'enviado') && (
                        <div className="flex justify-end gap-2">
                           <button
                             onClick={() => handleResend(dispatch.id, dispatch.recipient_email || '')}
                             disabled={processingId === dispatch.id}
                             title="Forçar Reenvio"
                             className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                           >
                             <Play size={16} />
                           </button>
                           {dispatch.status === 'pendente' && (
                            <button
                               onClick={() => handleCancel(dispatch.id)}
                               disabled={processingId === dispatch.id}
                               title="Cancelar Agendamento"
                               className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                             >
                               <X size={16} />
                             </button>
                           )}
                        </div>
                      )}
                      {dispatch.status === 'respondido' && (
                        <button
                          title="Visualizar Resposta/Feedback"
                          className="text-sm font-medium text-blue-600 hover:underline"
                          onClick={() => alert(`Feedback Registrado pelo Cliente: \n\n"${dispatch.feedback || 'Sem comentários adicionais.'}"`)}
                        >
                          Ver Feedback
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
