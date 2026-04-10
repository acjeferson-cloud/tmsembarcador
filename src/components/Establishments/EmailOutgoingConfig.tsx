import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Eye, EyeOff, Server, Lock, User, Shield } from 'lucide-react';
import emailOutgoingConfigService, { EmailOutgoingConfig, EmailOutgoingConfigInput } from '../../services/emailOutgoingConfigService';
import { Toast, ToastType } from '../common/Toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface EmailOutgoingConfigProps {
  establishmentId: string;
}

export const EmailOutgoingConfigTab: React.FC<EmailOutgoingConfigProps> = ({ establishmentId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [config, setConfig] = useState<EmailOutgoingConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [formData, setFormData] = useState<EmailOutgoingConfigInput>({
    establishment_id: establishmentId,
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: 'TLS',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    ativo: false
  });

  useEffect(() => {
    loadConfig();
  }, [establishmentId]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const data = await emailOutgoingConfigService.getByEstablishment(establishmentId);

      if (data) {
        setConfig(data);
        setFormData({
          establishment_id: data.establishment_id || establishmentId,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_secure: data.smtp_secure,
          smtp_user: data.smtp_user,
          smtp_password: data.smtp_password,
          from_email: data.from_email,
          from_name: data.from_name,
          ativo: data.ativo
        });
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (error: any) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // A validação original estava verificando from_email/from_name, 
    // mas o formulário (e o tipo final service) usa sender_email/sender_name
    if (!formData.smtp_host || !formData.smtp_user || !formData.smtp_password ||
        !formData.from_email || !formData.from_name) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.fillRequired'), type: 'error' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.from_email)) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.invalidSenderEmail'), type: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      
      const sessionStr = localStorage.getItem('tms-session');
      if (sessionStr) {
        try {
          const sessionData = JSON.parse(sessionStr);
          if (sessionData && sessionData.environment_id) {
            formData.environment_id = sessionData.environment_id;
          }
          if (sessionData && sessionData.organization_id) {
            formData.organization_id = sessionData.organization_id;
          }
        } catch (e) {
// null
        }
      }

      if (config) {
        await emailOutgoingConfigService.update(config.id, formData);
        setToast({ message: t('establishments.form.emailOutgoing.messages.updateSuccess'), type: 'success' });
      } else {
        await emailOutgoingConfigService.create(formData);
        setToast({ message: t('establishments.form.emailOutgoing.messages.createSuccess'), type: 'success' });
      }

      await loadConfig();
    } catch (error: any) {
      setToast({ message: error.message || t('establishments.form.emailOutgoing.messages.saveError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.typeTestEmail'), type: 'error' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.invalidTestEmail'), type: 'error' });
      return;
    }

    if (!config) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.saveBeforeTest'), type: 'error' });
      return;
    }

    try {
      setIsTesting(true);
      const result = await emailOutgoingConfigService.testEmailConfig({
        recipient_email: testEmail,
        config_id: config.id
      });

      if (result.success) {
        setToast({ message: result.message, type: 'success' });
        setShowTestDialog(false);
        setTestEmail('');
        await loadConfig();
      } else {
        setToast({
          message: `${result.message}: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error: any) {
      setToast({ message: t('establishments.form.emailOutgoing.messages.testError'), type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8" />
          <h3 className="text-2xl font-bold">{t('establishments.form.emailOutgoing.title')}</h3>
        </div>
        <p className="text-blue-100">
          {t('establishments.form.emailOutgoing.subtitle')}
        </p>
      </div>

      {config && !isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('establishments.form.emailOutgoing.currentConfig')}</h4>
            <div className="flex items-center gap-2">
              {config.ativo && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {t('establishments.form.emailOutgoing.active')}
                </span>
              )}
              {config.test_email_sent && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {t('establishments.form.emailOutgoing.tested')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.smtpServer')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.smtp_host}:{config.smtp_port}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.security')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.smtp_secure}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.smtpUser')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.smtp_user}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.authType')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {config.auth_type === 'OAuth2' ? 'OAuth 2.0' : 'LOGIN (Usuário/Senha)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.senderEmail')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.from_email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.emailOutgoing.senderName')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{config.from_name}</p>
              </div>
            </div>

            {config.reply_to_email && (
              <div className="flex items-start gap-3 md:col-span-2">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">E-mail para Respostas</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.reply_to_email}</p>
                </div>
              </div>
            )}

            {config.last_test_date && (
              <div className="md:col-span-2 bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Último teste realizado</p>
                  <p className="text-sm text-blue-700">
                    {new Date(config.last_test_date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Editar Configuração
            </button>
            <button
              onClick={() => setShowTestDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Testar Envio de E-mail
            </button>
          </div>
        </div>
      )}

      {(isEditing || !config) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {config ? t('establishments.form.emailOutgoing.editConfig') : t('establishments.buttons.new')}
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.emailOutgoing.smtpServer')} *
                </label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.emailOutgoing.portLabel')} *
                </label>
                <input
                  type="number"
                  value={formData.smtp_port}
                  onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.securityType')} *
              </label>
              <select
                value={formData.smtp_secure}
                onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.value as 'TLS' | 'SSL' | 'NONE' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TLS">{t('establishments.form.emailOutgoing.securityOptions.tls')}</option>
                <option value="SSL">{t('establishments.form.emailOutgoing.securityOptions.ssl')}</option>
                <option value="NONE">{t('establishments.form.emailOutgoing.securityOptions.none')}</option>
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('establishments.form.emailOutgoing.securityHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.smtpUser')} *
              </label>
              <input
                type="text"
                value={formData.smtp_user}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('establishments.form.emailOutgoing.smtpUserPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.smtpPassword')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.smtp_password}
                  onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {formData.smtp_host.toLowerCase().includes('gmail') && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">{t('establishments.form.emailOutgoing.gmailWarning')}</p>
                      <p className="mb-2">{t('establishments.form.emailOutgoing.gmailWarningDesc1')}</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>{t('establishments.form.emailOutgoing.gmailWarningStep1Text')} <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('establishments.form.emailOutgoing.gmailWarningStep1Link')}</a></li>
                        <li>{t('establishments.form.emailOutgoing.gmailWarningStep2')}</li>
                        <li>{t('establishments.form.emailOutgoing.gmailWarningStep3Text')} <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('establishments.form.emailOutgoing.gmailWarningStep3Link')}</a></li>
                        <li>{t('establishments.form.emailOutgoing.gmailWarningStep4')}</li>
                        <li>{t('establishments.form.emailOutgoing.gmailWarningStep5')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.authType')} *
              </label>
              <select
                value={formData.auth_type}
                onChange={(e) => setFormData({ ...formData, auth_type: e.target.value as 'LOGIN' | 'OAuth2' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOGIN">{t('establishments.form.emailOutgoing.authTypeLogin')}</option>
                <option value="OAuth2">{t('establishments.form.emailOutgoing.authTypeOauth2')}</option>
              </select>
            </div>

            {formData.auth_type === 'OAuth2' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('establishments.form.emailOutgoing.clientId')} *
                  </label>
                  <input
                    type="text"
                    value={formData.oauth2_client_id}
                    onChange={(e) => setFormData({ ...formData, oauth2_client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('establishments.form.emailOutgoing.clientIdPlaceholder')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('establishments.form.emailOutgoing.clientSecret')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.oauth2_client_secret}
                      onChange={(e) => setFormData({ ...formData, oauth2_client_secret: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('establishments.form.emailOutgoing.clientSecretPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('establishments.form.emailOutgoing.refreshToken')} *
                  </label>
                  <input
                    type="text"
                    value={formData.oauth2_refresh_token}
                    onChange={(e) => setFormData({ ...formData, oauth2_refresh_token: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('establishments.form.emailOutgoing.refreshTokenPlaceholder')}
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">{t('establishments.form.emailOutgoing.aboutOauth2')}</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {t('establishments.form.emailOutgoing.aboutOauth2Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.senderEmail')} *
              </label>
              <input
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('establishments.form.emailOutgoing.senderEmailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.senderName')} *
              </label>
              <input
                type="text"
                value={formData.from_name}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('establishments.form.emailOutgoing.senderNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.replyToEmail')}
              </label>
              <input
                type="email"
                value={formData.reply_to_email}
                onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('establishments.form.emailOutgoing.replyToEmailPlaceholder')}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo || false}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {t('establishments.form.emailOutgoing.activeConfig')}
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {config && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadConfig();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('establishments.buttons.save')}...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('establishments.form.emailOutgoing.testEmail')}</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('establishments.form.emailOutgoing.testEmailDialog.desc')}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('establishments.form.emailOutgoing.testEmailDialog.testEmail')}
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('establishments.form.emailOutgoing.testEmailDialog.testEmailPlaceholder')}
                onKeyPress={(e) => e.key === 'Enter' && handleTestEmail()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTestDialog(false);
                  setTestEmail('');
                }}
                disabled={isTesting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleTestEmail}
                disabled={isTesting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Teste
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
