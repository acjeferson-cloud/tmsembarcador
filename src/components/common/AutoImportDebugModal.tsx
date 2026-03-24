import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw, AlertCircle, CheckCircle, Clock, Play, Download, Bug, StopCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { autoXmlImportService } from '../../services/autoXmlImportService';
import { establishmentsService } from '../../services/establishmentsService';

interface AutoImportDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: string;
  establishment_id: string | null;
  execution_time: string;
  status: 'success' | 'error' | 'warning' | 'running';
  nfe_imported: number;
  cte_imported: number;
  total_processed: number;
  emails_checked: number;
  error_message: string | null;
  details: any;
  created_at: string;
}

interface EstablishmentConfig {
  id: string;
  codigo: string;
  razao_social: string;
  email_config: any;
}

export const AutoImportDebugModal: React.FC<AutoImportDebugModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [establishments, setEstablishments] = useState<EstablishmentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stopping, setStopping] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Cleanup stuck logs before loading
      await supabase.rpc('cleanup_stuck_import_logs');

      const [logsResponse, estabData] = await Promise.all([
        supabase.rpc('get_xml_logs'),
        establishmentsService.getAll()
      ]);

      if ((logsResponse as any).data) {
        setLogs((logsResponse as any).data);
      } else if ((logsResponse as any).error) {
        console.error("logsResponse error:", (logsResponse as any).error);
      }

      if (estabData) {
        setEstablishments(estabData.filter((e: any) => {
          let metadata = e.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (err) {}
          }
          let email_config = e.email_config;
          if (typeof email_config === 'string') {
            try { email_config = JSON.parse(email_config); } catch (err) {}
          }
          const config = email_config || metadata?.email_config;
          return config?.autoDownloadEnabled === true || config?.autoDownloadEnabled === 'true' || config?.autoDownloadEnabled === 1;
        }).map((e: any) => {
          let metadata = e.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch (err) {}
          }
          let email_config = e.email_config;
          if (typeof email_config === 'string') {
            try { email_config = JSON.parse(email_config); } catch (err) {}
          }
          return {
            ...e,
            email_config: email_config || metadata?.email_config
          };
        }));
      }
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const runManualImport = async () => {
    setRunning(true);
    
    // Dispara a execução sem travar a tela (background)
    autoXmlImportService.runScheduler().then(() => {
      window.dispatchEvent(new CustomEvent('refresh-invoices-list'));
    }).catch(error => {
      console.error('Error running manual import in background:', error);
    }).finally(() => {
      setRunning(false);
      loadData();
    });
  };

  const stopCurrentExecution = async () => {
    setStopping(true);
    try {
      const runningLog = logs.find(l => l.status === 'running');
      if (runningLog) {
        const { error: invokeError } = await supabase.functions.invoke('auto-import-xml-scheduler', {
          body: { action: 'stop', logId: runningLog.id }
        });
        if (invokeError) throw new Error(invokeError.message);

        await loadData();
      }
    } catch (error: any) {
      console.error('Error stopping execution:', error);
    } finally {
      setStopping(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'running':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      default:
        return <Clock className="text-gray-500 dark:text-gray-400" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('autoImport.time.justNow');
    if (diffMins < 60) return t(diffMins === 1 ? 'autoImport.time.minute' : 'autoImport.time.minutes', { count: diffMins });
    if (diffHours < 24) return t(diffHours === 1 ? 'autoImport.time.hour' : 'autoImport.time.hours', { count: diffHours });
    return t(diffDays === 1 ? 'autoImport.time.day' : 'autoImport.time.days', { count: diffDays });
  };

  if (!isOpen) return null;

  const latestLog = logs[0];
  const hasRunningLogs = logs.some(l => l.status === 'running');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bug className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('autoImport.title')}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('autoImport.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{t('autoImport.currentStatus.title')}</span>
                {hasRunningLogs ? (
                  <RefreshCw className="text-blue-600 animate-spin" size={16} />
                ) : (
                  <CheckCircle className="text-blue-600" size={16} />
                )}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {hasRunningLogs ? t('autoImport.currentStatus.running') : t('autoImport.currentStatus.waiting')}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {t('autoImport.currentStatus.interval')}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">{t('autoImport.lastExecution.title')}</span>
                <Clock className="text-green-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-green-900">
                {latestLog ? getTimeSince(latestLog.execution_time) : t('autoImport.lastExecution.never')}
              </div>
              <div className="text-xs text-green-700 mt-1">
                {latestLog ? formatDate(latestLog.execution_time) : t('autoImport.lastExecution.noDate')}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">{t('autoImport.establishments.title')}</span>
                <Download className="text-purple-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {establishments.length}
              </div>
              <div className="text-xs text-purple-700 mt-1">
                {t('autoImport.establishments.active')}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('autoImport.establishments.configuredTitle')}</h3>
            </div>
            {establishments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p>{t('autoImport.establishments.noActive')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {establishments.map((est) => (
                  <div key={est.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{est.codigo} - {est.razao_social}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Email: {est.email_config?.emailAddress || t('autoImport.establishments.notConfigured')}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        {t('autoImport.establishments.lastTime')}{est.email_config?.lastAutoDownload
                          ? formatDate(est.email_config.lastAutoDownload)
                          : t('autoImport.establishments.never')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('autoImport.history.title')}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadData}
                  disabled={refreshing}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{t('autoImport.history.refresh')}</span>
                </button>
                {hasRunningLogs && (
                  <button
                    onClick={stopCurrentExecution}
                    disabled={stopping}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {stopping ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>{t('autoImport.history.stopping')}</span>
                      </>
                    ) : (
                      <>
                        <StopCircle size={14} />
                        <span>{t('autoImport.history.stop')}</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={runManualImport}
                  disabled={running || hasRunningLogs}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {running ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{t('autoImport.history.running')}</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>{t('autoImport.history.runNow')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Clock className="mx-auto mb-2" size={32} />
                  <p>{t('autoImport.history.noLogs')}</p>
                  <p className="text-sm mt-1">{t('autoImport.history.noLogsDesc')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatDate(log.execution_time)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                                {log.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {getTimeSince(log.execution_time)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {log.total_processed} {t('autoImport.history.processed')}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {log.nfe_imported} NFe • {log.cte_imported} CTe
                          </div>
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                            <div className="text-sm text-red-800">
                              <div className="font-medium mb-1">{t('autoImport.history.error')}</div>
                              <div className="font-mono text-xs">{log.error_message}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.details && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white font-medium">
                              {t('autoImport.history.viewDetails')}
                            </summary>
                            <div className="mt-2 bg-gray-900 text-gray-100 rounded-lg p-3 font-mono text-xs overflow-auto max-h-40">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            {t('autoImport.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
