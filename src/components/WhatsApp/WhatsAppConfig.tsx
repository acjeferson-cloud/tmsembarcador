import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, AlertCircle, MessageSquare, FileText, Plus, Trash2, Edit, Receipt, Info } from 'lucide-react';
import { whatsappService, WhatsAppConfig as IWhatsAppConfig, WhatsAppTemplate } from '../../services/whatsappService';
import { useAuth } from '../../hooks/useAuth';
import { WhatsAppExtract } from './WhatsAppExtract';
import { useTranslation } from 'react-i18next';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';

export const WhatsAppConfig: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isActive: whatsappActive, isLoading: whatsappLoading } = useInnovation(
    INNOVATION_IDS.WHATSAPP,
    user?.id
  );
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'extract'>('config');
  const [config, setConfig] = useState<IWhatsAppConfig>({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    webhook_verify_token: '',
    is_active: true
  });

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await whatsappService.getActiveConfig();
      if (data) {
        setConfig({
          ...data,
          access_token: data.access_token || '',
          phone_number_id: data.phone_number_id || '',
          business_account_id: data.business_account_id || '',
          webhook_verify_token: data.webhook_verify_token || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      }
    } catch (error) {
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await whatsappService.getAllTemplates();
      // Filtrar templates com dados válidos e adicionar valores padrão
      const validTemplates = data.filter(t => t && t.template_name).map(t => ({
        ...t,
        template_name: t.template_name || '',
        body_text: t.body_text || '',
        category: t.category || 'UTILITY',
        approval_status: t.approval_status || 'PENDING',
        template_language: t.template_language || 'pt_BR',
        is_active: t.is_active !== undefined ? t.is_active : true
      }));
      setTemplates(validTemplates);
    } catch (error) {
      setTemplates([]);
    }
  };

  const handleSaveConfig = async () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: t('whatsapp.config.notContractedMsg') });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const result = await whatsappService.saveConfig({
      ...config,
      created_by: user?.supabaseUser?.id
    });

    if (result.success) {
      setSaveMessage({ type: 'success', text: t('whatsapp.config.saveSuccess') });
      await loadConfig();
    } else {
      setSaveMessage({ type: 'error', text: result.error || t('whatsapp.config.saveError') });
    }

    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!whatsappActive) {
      setTestResult({ success: false, message: t('whatsapp.config.notContractedMsg') });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await whatsappService.testConnection(config);

    if (result.success) {
      setTestResult({ success: true, message: t('whatsapp.config.testSuccess') });
    } else {
      setTestResult({ success: false, message: result.error || t('whatsapp.config.testError') });
    }

    setIsTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleSaveTemplate = async () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: t('whatsapp.config.notContractedMsg') });
      return;
    }

    if (!editingTemplate) return;

    if (!editingTemplate.template_name || !editingTemplate.body_text) {
      setSaveMessage({ type: 'error', text: t('whatsapp.config.nameAndBodyRequired') });
      return;
    }

    setIsSaving(true);
    const result = await whatsappService.saveTemplate({
      ...editingTemplate,
      template_name: editingTemplate.template_name.trim(),
      body_text: editingTemplate.body_text.trim(),
      category: editingTemplate.category || 'UTILITY',
      approval_status: editingTemplate.approval_status || 'APPROVED',
      template_language: editingTemplate.template_language || 'pt_BR',
      created_by: user?.supabaseUser?.id
    });

    if (result.success) {
      setSaveMessage({ type: 'success', text: t('whatsapp.config.saveTemplateSuccess') });
      await loadTemplates();
      setShowTemplateForm(false);
      setEditingTemplate(null);
    } else {
      setSaveMessage({ type: 'error', text: result.error || t('whatsapp.config.saveTemplateError') });
    }

    setIsSaving(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: t('whatsapp.config.notContractedMsg') });
      return;
    }

    if (!confirm(t('whatsapp.config.deleteTemplateConfirm'))) return;

    const result = await whatsappService.deleteTemplate(templateId);

    if (result.success) {
      setSaveMessage({ type: 'success', text: t('whatsapp.config.deleteTemplateSuccess') });
      await loadTemplates();
    } else {
      setSaveMessage({ type: 'error', text: result.error || t('whatsapp.config.deleteTemplateError') });
    }
  };

  const handleNewTemplate = () => {
    if (!whatsappActive) {
      setSaveMessage({ type: 'error', text: t('whatsapp.config.notContractedMsg') });
      return;
    }

    setEditingTemplate({
      template_name: '',
      template_language: 'pt_BR',
      category: 'UTILITY',
      body_text: '',
      is_active: true,
      approval_status: 'APPROVED',
      variables: []
    });
    setShowTemplateForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('whatsapp.config.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('whatsapp.config.subtitle')}</p>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg border ${
          saveMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        </div>
      )}

      {/* Innovation Notice */}
      {!whatsappActive && !whatsappLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>{t('whatsapp.config.notice.title')}</strong> {t('whatsapp.config.notice.text')} <strong>{t('whatsapp.config.notice.link')}</strong>{t('whatsapp.config.notice.textEnd')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>{t('whatsapp.config.tabs.config')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>{t('whatsapp.config.tabs.templates')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'extract'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Receipt size={16} />
              <span>{t('whatsapp.config.tabs.extract')}</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'config' && (
        <>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('whatsapp.config.api.accessToken')}
              </label>
              <input
                type="password"
                value={config.access_token}
                onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('whatsapp.config.api.accessTokenPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('whatsapp.config.api.accessTokenHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('whatsapp.config.api.phoneId')}
              </label>
              <input
                type="text"
                value={config.phone_number_id}
                onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('whatsapp.config.api.phoneIdPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('whatsapp.config.api.phoneIdHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('whatsapp.config.api.accountId')}
              </label>
              <input
                type="text"
                value={config.business_account_id}
                onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('whatsapp.config.api.accountIdPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('whatsapp.config.api.accountIdHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('whatsapp.config.api.webhookToken')}
              </label>
              <input
                type="text"
                value={config.webhook_verify_token || ''}
                onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                disabled={!whatsappActive}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t('whatsapp.config.api.webhookTokenPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('whatsapp.config.api.webhookTokenHelp')}
              </p>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={!whatsappActive || isSaving || !config.access_token || !config.phone_number_id || !config.business_account_id}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{isSaving ? t('whatsapp.config.buttons.saving') : t('whatsapp.config.buttons.saveConfig')}</span>
              </button>

              <button
                onClick={handleTestConnection}
                disabled={!whatsappActive || isTesting || !config.access_token || !config.phone_number_id}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube size={16} />
                <span>{isTesting ? t('whatsapp.config.buttons.testing') : t('whatsapp.config.buttons.testConnection')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                {t('whatsapp.config.howTo.title')}
              </h3>
              <ol className="text-sm text-green-800 dark:text-green-400 space-y-2 list-decimal list-inside">
                <li>{t('whatsapp.config.howTo.step1')} <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">{t('whatsapp.config.howTo.link')}</a></li>
                <li>{t('whatsapp.config.howTo.step2')}</li>
                <li>{t('whatsapp.config.howTo.step3')}</li>
                <li>{t('whatsapp.config.howTo.step4')}</li>
                <li>{t('whatsapp.config.howTo.step5')}</li>
              </ol>
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="text-xs text-yellow-900 dark:text-yellow-300 font-medium mb-1">{t('whatsapp.config.howTo.warningTitle')}</p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  {t('whatsapp.config.howTo.warning1')}
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  {t('whatsapp.config.howTo.warning2')}
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                  {t('whatsapp.config.howTo.warning3')}
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('whatsapp.templates.title')}
            </p>
            <button
              onClick={handleNewTemplate}
              disabled={!whatsappActive}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>{t('whatsapp.templates.newTemplateHeader')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('whatsapp.templates.noTemplates')}
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.template_name || t('whatsapp.templates.unnamed')}
                        </h3>
                        {template.approval_status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            template.approval_status === 'APPROVED'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : template.approval_status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {template.approval_status}
                          </span>
                        )}
                        {template.category && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {template.category}
                          </span>
                        )}
                      </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {template.body_text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        if (!whatsappActive) {
                          setSaveMessage({ type: 'error', text: 'Recurso não contratado. Ative em Inovações & Sugestões.' });
                          return;
                        }
                        setEditingTemplate(template);
                        setShowTemplateForm(true);
                      }}
                      disabled={!whatsappActive}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id!)}
                      disabled={!whatsappActive}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>

          {showTemplateForm && editingTemplate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTemplate.id ? t('whatsapp.templates.editTemplateHeader') : t('whatsapp.templates.newTemplateHeader')}
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('whatsapp.templates.form.name')}
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.template_name || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                      disabled={!!editingTemplate.id}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      placeholder={t('whatsapp.templates.form.namePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('whatsapp.templates.form.description')}
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.description || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      disabled={!whatsappActive}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('whatsapp.templates.form.descriptionPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('whatsapp.templates.form.body')}
                    </label>
                    <textarea
                      value={editingTemplate.body_text || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
                      rows={6}
                      disabled={!whatsappActive}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('whatsapp.templates.form.bodyPlaceholder')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('whatsapp.templates.form.bodyHelp')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('whatsapp.templates.form.category')}
                      </label>
                      <select
                        value={editingTemplate.category || 'UTILITY'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                        disabled={!whatsappActive}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="UTILITY">UTILITY</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('whatsapp.templates.form.approvalStatus')}
                      </label>
                      <select
                        value={editingTemplate.approval_status || 'APPROVED'}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, approval_status: e.target.value })}
                        disabled={!whatsappActive}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingTemplate.is_active}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                      disabled={!whatsappActive}
                      className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                      {t('whatsapp.templates.form.active')}
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={!whatsappActive || isSaving || !editingTemplate.template_name || !editingTemplate.body_text}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? t('whatsapp.templates.form.saving') : t('whatsapp.templates.form.save')}
                    </button>
                    <button
                      onClick={() => {
                        setShowTemplateForm(false);
                        setEditingTemplate(null);
                      }}
                      className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('whatsapp.templates.form.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'extract' && <WhatsAppExtract />}
    </div>
  );
};
