import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { establishmentsService, Establishment } from '../../services/establishmentsService';

interface AutoDownloadStatusProps {
  establishmentId: string;
}

export const AutoDownloadStatus: React.FC<AutoDownloadStatusProps> = ({ establishmentId }) => {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadEstablishment();
  }, [establishmentId]);

  const loadEstablishment = async () => {
    try {
      const data = await establishmentsService.getById(establishmentId);
      setEstablishment(data);
    } catch (error) {
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEstablishment();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!establishment?.email_config?.autoDownloadEnabled) {
    return null;
  }

  const lastDownload = establishment.email_config.lastAutoDownload;
  const interval = establishment.email_config.autoDownloadInterval || 15;

  const getTimeSinceLastDownload = () => {
    if (!lastDownload) return null;

    const now = new Date();
    const lastDate = new Date(lastDownload);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'há menos de 1 minuto';
    if (diffMinutes === 1) return 'há 1 minuto';
    if (diffMinutes < 60) return `há ${diffMinutes} minutos`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'há 1 dia';
    return `há ${diffDays} dias`;
  };

  const isOverdue = () => {
    if (!lastDownload) return false;

    const now = new Date();
    const lastDate = new Date(lastDownload);
    const diffMinutes = (now.getTime() - lastDate.getTime()) / (1000 * 60);

    return diffMinutes > (interval * 2);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
      isOverdue()
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-green-50 border-green-200'
    }`}>
      {isOverdue() ? (
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className={`text-sm font-medium ${
            isOverdue() ? 'text-yellow-800' : 'text-green-800'
          }`}>
            Importação Automática de XML Ativa
          </span>
        </div>
        {lastDownload ? (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Última verificação: {formatDateTime(lastDownload)} ({getTimeSinceLastDownload()}) •
            Próxima em até {interval} minutos
          </p>
        ) : (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Aguardando primeira verificação (a cada {interval} minutos)
          </p>
        )}
      </div>

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-1.5 hover:bg-white dark:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
        title="Atualizar status"
      >
        <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
