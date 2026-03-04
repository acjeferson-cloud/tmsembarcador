import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, Brain, Key, Info, Sliders, Receipt, Building2 } from 'lucide-react';
import { openaiService, OpenAIConfig as IOpenAIConfig } from '../../services/openaiService';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { OpenAIExtract } from './OpenAIExtract';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useTranslation } from 'react-i18next';

export const OpenAIConfig: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isActive: openaiActive, isLoading: openaiLoading } = useInnovation(
    INNOVATION_IDS.OPENAI,
    user?.id
  );
  const [activeTab, setActiveTab] = useState<'config' | 'extract' | 'organization'>('config');
  const [config, setConfig] = useState<IOpenAIConfig>({
    api_key: '',
    modelo: 'gpt-3.5-turbo',
    temperatura: 0.7,
    max_tokens: 1000,
    ativo: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get org/env from localStorage
  const organizationId = localStorage.getItem('organizationId');
  const environmentId = localStorage.getItem('environmentId');

  const breadcrumbItems = [
    { label: t('menu.settings') },
    { label: t('openai.pageTitle'), current: true }
  ];

  const modelOptions = [
    { value: 'gpt-3.5-turbo', label: t('openai.models.gpt35turbo'), description: t('openai.models.gpt35turboDescription') },
    { value: 'gpt-4', label: t('openai.models.gpt4'), description: t('openai.models.gpt4Description') },
    { value: 'gpt-4-turbo-preview', label: t('openai.models.gpt4turbo'), description: t('openai.models.gpt4turboDescription') },
    { value: 'gpt-4o', label: t('openai.models.gpt4o'), description: t('openai.models.gpt4oDescription') }
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await openaiService.getActiveConfig();
      if (data) {
        setConfig({
          ...data,
          api_key: data.api_key || '',
          modelo: data.modelo || 'gpt-3.5-turbo',
          temperatura: data.temperatura || 0.7,
          max_tokens: data.max_tokens || 1000,
          ativo: data.ativo !== undefined ? data.ativo : true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!openaiActive) {
      setSaveMessage({ type: 'error', text: t('openai.messages.notContracted') });
      return;
    }

    if (!config.api_key.trim()) {
      setSaveMessage({ type: 'error', text: t('openai.messages.required') });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await openaiService.saveConfig(config);

    if (result.success) {
      setSaveMessage({ type: 'success', text: t('openai.messages.saveSuccess') });
      await loadConfig();
    } else {
      setSaveMessage({ type: 'error', text: result.error || t('openai.messages.saveError') });
    }

    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!openaiActive) {
      setTestResult({ success: false, message: t('openai.messages.notContracted') });
      return;
    }

    if (!config.api_key.trim()) {
      setTestResult({ success: false, message: t('openai.messages.required') });
      setTimeout(() => setTestResult(null), 5000);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await openaiService.testConnection(config.api_key, config.modelo);

    if (result.success) {
      setTestResult({
        success: true,
        message: t('openai.messages.testSuccess')
      });
    } else {
      setTestResult({ success: false, message: result.error || t('openai.messages.testError') });
    }

    setIsTesting(false);
    setTimeout(() => setTestResult(null), 8000);
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
          <Brain className="h-8 w-8 text-green-600" />
          <span>{t('openai.pageTitle')}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('openai.subtitle')}
        </p>
      </div>

      {/* Innovation Notice */}
      {!openaiActive && !openaiLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              {t('openai.messages.notContracted')}
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
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Key size={16} />
              <span>{t('openai.tabs.config')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'extract'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Receipt size={16} />
              <span>{t('openai.tabs.extract')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'organization'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Building2 size={16} />
              <span>{t('openai.tabs.organization')}</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'config' && (
      <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-600" />
            <span>{t('openai.form.apiKey')}</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('openai.form.apiKey')} *
              </label>
              <input
                type="password"
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                disabled={!openaiActive}
                placeholder={t('openai.form.apiKeyPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('openai.form.model')}
              </label>
              <select
                value={config.modelo}
                onChange={(e) => setConfig({ ...config, modelo: e.target.value })}
                disabled={!openaiActive}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {modelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {modelOptions.find(m => m.value === config.modelo)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('openai.form.temperature')}: {config.temperatura}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperatura}
                onChange={(e) => setConfig({ ...config, temperatura: parseFloat(e.target.value) })}
                disabled={!openaiActive}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('openai.form.temperatureDescription')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('openai.form.maxTokens')}
              </label>
              <input
                type="number"
                value={config.max_tokens}
                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 1000 })}
                disabled={!openaiActive}
                min="100"
                max="4000"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('openai.form.maxTokensDescription')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={config.ativo}
                onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
                disabled={!openaiActive}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                {t('openai.form.active')}
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={handleSaveConfig}
            disabled={!openaiActive || isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSaving ? t('common.saving') : t('openai.buttons.save')}</span>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={!openaiActive || isTesting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <TestTube size={18} />
            <span>{isTesting ? t('openai.testConnection.testing') : t('openai.buttons.test')}</span>
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
            <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                {t('openai.organizationIsolation.description')}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                {t('openai.organizationIsolation.warning')}
              </p>
            </div>
          </div>
        </div>
      </>
      )}

      {activeTab === 'extract' && <OpenAIExtract />}

      {activeTab === 'organization' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <span>{t('openai.organizationIsolation.title')}</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('openai.organizationIsolation.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('openai.organizationIsolation.currentOrg')}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {organizationId || 'N/A'}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('openai.organizationIsolation.currentEnv')}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {environmentId || 'N/A'}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              {t('openai.organizationIsolation.howItWorks')}
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('openai.organizationIsolation.benefit1')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('openai.organizationIsolation.benefit2')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t('openai.organizationIsolation.benefit3')}</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {t('openai.organizationIsolation.warning')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
