import React, { useState } from 'react';
import { Eye, EyeOff, RotateCw, Trash2, History, AlertTriangle, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { ApiKeyConfig, apiKeysService } from '../../services/apiKeysService';
import { useTranslation } from 'react-i18next';

interface ApiKeyCardProps {
  apiKey: ApiKeyConfig;
  onRotate: (apiKey: ApiKeyConfig) => void;
  onDelete: (apiKey: ApiKeyConfig) => void;
  onViewHistory: (apiKey: ApiKeyConfig) => void;
  onRefresh: () => void;
}

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  apiKey,
  onRotate,
  onDelete,
  onViewHistory,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (!apiKey.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <XCircle className="w-3 h-3" />
          Inativa
        </span>
      );
    }

    if (apiKey.monthly_limit && apiKey.current_usage >= apiKey.monthly_limit) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Limite Excedido
        </span>
      );
    }

    if (apiKey.monthly_limit && apiKey.current_usage >= (apiKey.monthly_limit * apiKey.alert_threshold_percent / 100)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Próximo do Limite
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        <CheckCircle className="w-3 h-3" />
        Ativa
      </span>
    );
  };

  const getUsagePercentage = () => {
    if (!apiKey.monthly_limit) return 0;
    return Math.min((apiKey.current_usage / apiKey.monthly_limit) * 100, 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= apiKey.alert_threshold_percent) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysSinceRotation = () => {
    if (!apiKey.rotated_at) return 0;
    const rotatedDate = new Date(apiKey.rotated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - rotatedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceRotation = getDaysSinceRotation();
  const needsRotation = daysSinceRotation > 180;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {apiKeysService.getKeyTypeIcon(apiKey.key_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {apiKey.key_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {apiKeysService.getKeyTypeLabel(apiKey.key_type)}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {apiKey.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{apiKey.description}</p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Chave:
              </span>
              <code className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                {showKey ? apiKey.api_key : apiKeysService.maskApiKey(apiKey.api_key)}
              </code>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition-colors"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyKey}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 transition-colors"
                title="Copiar"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {apiKey.monthly_limit && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Uso Mensal</span>
                <span className="font-medium">
                  {apiKey.current_usage.toLocaleString('pt-BR')} / {apiKey.monthly_limit.toLocaleString('pt-BR')}
                  <span className="text-gray-400 ml-1">
                    ({getUsagePercentage().toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor()}`}
                  style={{ width: `${getUsagePercentage()}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Última rotação:</span>
              <p className={`font-medium mt-1 ${needsRotation ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(apiKey.rotated_at)}
                {needsRotation && (
                  <span className="block text-red-500 text-xs mt-0.5">
                    (há {daysSinceRotation} dias)
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Último uso:</span>
              <p className="font-medium text-gray-900 dark:text-white mt-1">
                {formatDate(apiKey.last_used_at)}
              </p>
            </div>
          </div>

          {apiKey.expires_at && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <span className="text-yellow-700 font-medium">
                Expira em: {formatDate(apiKey.expires_at)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {apiKey.environment}
            </span>
            {apiKey.rotation_schedule && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded" title="Rotação programada">
                🔄 Automática
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onRotate(apiKey)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RotateCw className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Rotacionar</span>
          </button>
          <button
            onClick={() => onViewHistory(apiKey)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Histórico</span>
          </button>
          <button
            onClick={() => onDelete(apiKey)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
