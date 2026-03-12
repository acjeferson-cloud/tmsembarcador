import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, AlertCircle, Map, Key, Info, Receipt } from 'lucide-react';
import { googleMapsService, GoogleMapsConfig as IGoogleMapsConfig } from '../../services/googleMapsService';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { GoogleMapsExtract } from './GoogleMapsExtract';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useTranslation } from 'react-i18next';

export const GoogleMapsConfig: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isActive: googleMapsActive, isLoading: googleMapsLoading } = useInnovation(
    INNOVATION_IDS.GOOGLE_MAPS,
    user?.id
  );
  const [activeTab, setActiveTab] = useState<'config' | 'extract'>('config');
  const [config, setConfig] = useState<IGoogleMapsConfig>({
    api_key: '',
    is_active: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const breadcrumbItems = [
    { label: t('menu.settings') },
    { label: t('googleMaps.pageTitle'), current: true }
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await googleMapsService.getActiveConfig();
      if (data) {
        setConfig({
          ...data,
          api_key: data.api_key || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      }
    } catch (error) {
    }
  };

  const handleSaveConfig = async () => {
    if (!googleMapsActive) {
      setSaveMessage({ type: 'error', text: t('googleMaps.messages.notContracted') });
      return;
    }

    if (!config.api_key.trim()) {
      setSaveMessage({ type: 'error', text: t('googleMaps.messages.required') });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await googleMapsService.saveConfig({
      ...config,
      created_by: (user?.supabaseUser?.id as unknown) as number
    });

    if (result.success) {
      setSaveMessage({ type: 'success', text: t('googleMaps.messages.saveSuccess') });
      await loadConfig();
    } else {
      setSaveMessage({ type: 'error', text: result.error || t('googleMaps.messages.saveError') });
    }

    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!googleMapsActive) {
      setTestResult({ success: false, message: t('googleMaps.messages.notContracted') });
      return;
    }

    if (!config.api_key.trim()) {
      setTestResult({ success: false, message: t('googleMaps.messages.required') });
      setTimeout(() => setTestResult(null), 5000);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await googleMapsService.testConnection(config.api_key);

    if (result.success) {
      setTestResult({ success: true, message: t('googleMaps.messages.testSuccess') });
    } else {
      setTestResult({ success: false, message: result.error || t('googleMaps.messages.testError') });
    }

    setIsTesting(false);
    setTimeout(() => setTestResult(null), 8000);
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
          <Map className="h-8 w-8 text-blue-600" />
          <span>{t('googleMaps.pageTitle')}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('googleMaps.subtitle')}
        </p>
      </div>

      {/* Innovation Notice */}
      {!googleMapsActive && !googleMapsLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              {t('googleMaps.messages.notContracted')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Key size={16} />
              <span>{t('googleMaps.tabs.config')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'extract'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Receipt size={16} />
              <span>{t('googleMaps.tabs.extract')}</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'config' && (
      <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Key className="h-5 w-5 text-blue-600" />
            <span>{t('googleMaps.form.apiKey')}</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('googleMaps.form.apiKey')} *
              </label>
              <input
                type="text"
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                disabled={!googleMapsActive}
                placeholder={t('googleMaps.form.apiKeyPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={config.is_active}
                onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                disabled={!googleMapsActive}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                {t('googleMaps.form.active')}
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={handleSaveConfig}
            disabled={!googleMapsActive || isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSaving ? t('common.saving') : t('googleMaps.buttons.save')}</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={!googleMapsActive || isTesting}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <TestTube size={18} />
            <span>{isTesting ? t('googleMaps.testConnection.testing') : t('googleMaps.buttons.test')}</span>
          </button>
        </div>

        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveMessage.text}
              </span>
            </div>
          </div>
        )}

        {testResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                Como obter as credenciais do Google Maps:
              </h3>
              <ol className="text-sm text-green-800 dark:text-green-400 space-y-2 list-decimal list-inside">
                <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console</a></li>
                <li>Crie ou selecione um Projeto</li>
                <li>Vá em "APIs e Serviços" &gt; "Biblioteca" e habilite: <strong>Geocoding API</strong>, <strong>Maps JavaScript API</strong>, e <strong>Places API</strong></li>
                <li>Vá em "APIs e Serviços" &gt; "Credenciais"</li>
                <li>Clique em "Criar Credenciais" e escolha "Chave de API"</li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="text-xs text-yellow-900 dark:text-yellow-300 font-medium mb-1">Custos da Plataforma Google Maps:</p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  O Google Maps Platform não é gratuito para uso em produção contínua. As requisições (como extração de coordenadas, cálculo de distâncias ou autocompletar de endereços)
                  geram custo em dólar conforme a tabela oficial da Google.
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  É <strong>obrigatório</strong> ter uma conta de faturamento (cartão de crédito) vinculada no Google Cloud, mesmo que o Google ofereça um crédito recorrente mensal de $200. Recomendamos configurar quotas/limites por API no Console para evitar gastos inesperados.
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  {t('googleMaps.organizationIsolation.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
      )}

      {activeTab === 'extract' && <GoogleMapsExtract />}
    </div>
  );
};
