import React, { useState } from 'react';
import { X, RotateCw, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { ApiKeyConfig, apiKeysService } from '../../services/apiKeysService';
import { useTranslation } from 'react-i18next';
import { Toast, ToastType } from '../common/Toast';

interface ApiKeyRotationModalProps {
  apiKey: ApiKeyConfig;
  currentUserId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApiKeyRotationModal: React.FC<ApiKeyRotationModalProps> = ({
  apiKey,
  currentUserId,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [newApiKey, setNewApiKey] = useState('');
  const [rotationReason, setRotationReason] = useState('');
  const [rotationType, setRotationType] = useState<'manual' | 'scheduled' | 'emergency'>('manual');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleTestKey = async () => {
    if (!newApiKey.trim()) {
      setTestResult({
        valid: false,
        message: 'Por favor, insira uma chave para testar'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await apiKeysService.testKey(apiKey.key_type, newApiKey);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        valid: false,
        message: 'Erro ao testar a chave'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRotate = async () => {
    if (!newApiKey.trim()) {
      setToast({
        message: 'Por favor, insira a nova chave de API',
        type: 'warning'
      });
      return;
    }

    if (!rotationReason.trim()) {
      setToast({
        message: 'Por favor, informe o motivo da rotação',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiKeysService.rotateKey(apiKey.id, newApiKey, currentUserId, rotationReason);

      if (notes.trim()) {
        console.log('Rotation notes:', notes);
      }

      setToast({
        message: 'Chave rotacionada com sucesso!',
        type: 'success'
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error rotating key:', error);
      setToast({
        message: 'Erro ao rotacionar a chave. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RotateCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Rotacionar Chave de API
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

        <div className="p-6 space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Atenção</p>
                <p>
                  A rotação da chave substituirá a chave atual por uma nova.
                  Certifique-se de que a nova chave está correta antes de confirmar.
                  Esta ação ficará registrada no histórico de auditoria.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chave Atual
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <code className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {apiKeysService.maskApiKey(apiKey.api_key)}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nova Chave de API *
              </label>
              <textarea
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder="Cole aqui a nova chave de API..."
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                testResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${testResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestKey}
                disabled={isTesting || !newApiKey.trim()}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Testar Chave
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Rotação *
              </label>
              <select
                value={rotationType}
                onChange={(e) => setRotationType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Programada</option>
                <option value="emergency">Emergência</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo da Rotação *
              </label>
              <select
                value={rotationReason}
                onChange={(e) => setRotationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um motivo...</option>
                <option value="Rotação preventiva de segurança">Rotação preventiva de segurança</option>
                <option value="Chave comprometida">Chave comprometida</option>
                <option value="Rotação programada">Rotação programada</option>
                <option value="Expiração da chave">Expiração da chave</option>
                <option value="Melhoria de segurança">Melhoria de segurança</option>
                <option value="Troca de fornecedor">Troca de fornecedor</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas Adicionais
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Informações adicionais sobre a rotação..."
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Informações da Chave Atual
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Última rotação:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(apiKey.rotated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Uso mensal:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {apiKey.monthly_limit
                    ? `${apiKey.current_usage} / ${apiKey.monthly_limit}`
                    : 'Ilimitado'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRotate}
            disabled={isLoading || !newApiKey.trim() || !rotationReason}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Rotacionando...
              </>
            ) : (
              <>
                <RotateCw className="w-4 h-4" />
                Rotacionar Chave
              </>
            )}
          </button>
        </div>
      </div>

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
