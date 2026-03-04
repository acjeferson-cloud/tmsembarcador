import React, { useState } from 'react';
import { X, Plus, Loader } from 'lucide-react';
import { apiKeysService } from '../../services/apiKeysService';
import { useTranslation } from 'react-i18next';
import { Toast, ToastType } from '../common/Toast';

interface ApiKeyFormModalProps {
  estabelecimentoId: string | null;
  currentUserId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApiKeyFormModal: React.FC<ApiKeyFormModalProps> = ({
  estabelecimentoId,
  currentUserId,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [formData, setFormData] = useState({
    key_type: 'custom' as any,
    key_name: '',
    description: '',
    api_key: '',
    is_active: true,
    environment: 'production' as any,
    monthly_limit: '',
    alert_threshold_percent: 80,
    rotation_schedule: '',
    expires_at: '',
    alert_emails: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key_name || !formData.api_key) {
      setToast({
        message: 'Por favor, preencha os campos obrigatórios',
        type: 'warning'
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiKeysService.createKey({
        estabelecimento_id: estabelecimentoId,
        key_type: formData.key_type,
        key_name: formData.key_name,
        description: formData.description || null,
        api_key: formData.api_key,
        is_active: formData.is_active,
        environment: formData.environment,
        monthly_limit: formData.monthly_limit ? parseInt(formData.monthly_limit) : null,
        alert_threshold_percent: formData.alert_threshold_percent,
        rotation_schedule: formData.rotation_schedule || null,
        expires_at: formData.expires_at || null,
        alert_emails: formData.alert_emails ? formData.alert_emails.split(',').map(e => e.trim()) : null,
        created_by: currentUserId,
        metadata: {}
      });

      setToast({
        message: 'Chave de API criada com sucesso!',
        type: 'success'
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating API key:', error);

      let errorMessage = 'Erro ao criar chave de API. Tente novamente.';

      if (error?.message?.includes('duplicate key') || error?.code === '23505') {
        errorMessage = 'Já existe uma chave ativa deste tipo para este ambiente. Desative a chave existente primeiro.';
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }

      setToast({
        message: errorMessage,
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
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nova Chave de API
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cadastre uma nova chave de API no sistema
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Chave *
              </label>
              <select
                value={formData.key_type}
                onChange={(e) => setFormData({ ...formData, key_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="custom">Customizada</option>
                <option value="google_maps">Google Maps API</option>
                <option value="recaptcha_site">reCAPTCHA Site Key</option>
                <option value="recaptcha_secret">reCAPTCHA Secret Key</option>
                <option value="openai">OpenAI API</option>
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="supabase_service_role">Supabase Service Role</option>
                <option value="smtp">SMTP/Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ambiente *
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="production">Produção</option>
                <option value="staging">Staging</option>
                <option value="development">Desenvolvimento</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Chave *
            </label>
            <input
              type="text"
              value={formData.key_name}
              onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Google Maps API Principal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Descrição opcional..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chave de API *
            </label>
            <textarea
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={3}
              placeholder="Cole a chave de API aqui..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite Mensal
              </label>
              <input
                type="number"
                value={formData.monthly_limit}
                onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alerta em (%)
              </label>
              <input
                type="number"
                value={formData.alert_threshold_percent}
                onChange={(e) => setFormData({ ...formData, alert_threshold_percent: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
                placeholder="80"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Expiração
            </label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emails para Alertas (separados por vírgula)
            </label>
            <input
              type="text"
              value={formData.alert_emails}
              onChange={(e) => setFormData({ ...formData, alert_emails: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ativar chave imediatamente
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Chave
                </>
              )}
            </button>
          </div>
        </form>
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
