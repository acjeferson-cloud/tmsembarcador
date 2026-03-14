import React, { useEffect, useState } from 'react';
import { X, History, AlertTriangle, Clock, User, FileText, Loader } from 'lucide-react';
import { ApiKeyConfig, ApiKeyRotationHistory, apiKeysService } from '../../services/apiKeysService';
import { useTranslation } from 'react-i18next';

interface ApiKeyHistoryModalProps {
  apiKey: ApiKeyConfig;
  onClose: () => void;
}

export const ApiKeyHistoryModal: React.FC<ApiKeyHistoryModalProps> = ({
  apiKey,
  onClose
}) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ApiKeyRotationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [apiKey.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiKeysService.getRotationHistory(apiKey.id);
      setHistory(data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getRotationTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRotationTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return t('apiKeys.status.manual');
      case 'scheduled':
        return t('apiKeys.status.scheduled');
      case 'emergency':
        return t('apiKeys.status.emergency');
      case 'expired':
        return t('apiKeys.status.expired');
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('apiKeys.historyModal.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {apiKey.key_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('apiKeys.historyModal.noRotations')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                        {history.length - index}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${getRotationTypeColor(item.rotation_type)}`}
                          >
                            {getRotationTypeLabel(item.rotation_type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.rotation_reason || t('apiKeys.rotationModal.reasonNoSpec', { defaultValue: 'Sem motivo especificado' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(item.rotated_at)}</span>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">{item.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-red-50 rounded border border-red-100">
                      <span className="text-xs text-red-600 font-medium block mb-1">
                        {t('apiKeys.historyModal.previousKeyHash')}
                      </span>
                      <code className="text-xs font-mono text-red-700 break-all">
                        {item.old_key_hash || 'N/A'}
                      </code>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-100">
                      <span className="text-xs text-green-600 font-medium block mb-1">
                        {t('apiKeys.historyModal.newKeyHash')}
                      </span>
                      <code className="text-xs font-mono text-green-700 break-all">
                        {item.new_key_hash}
                      </code>
                    </div>
                  </div>

                  {item.rotated_by && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{t('apiKeys.historyModal.rotatedBy', { user: item.rotated_by })}</span>
                    </div>
                  )}

                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:text-gray-300">
                        {t('apiKeys.historyModal.metadata')}
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{t('apiKeys.historyModal.aboutHistory')}</p>
                <p>
                  {t('apiKeys.historyModal.historyDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            {t('apiKeys.historyModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
