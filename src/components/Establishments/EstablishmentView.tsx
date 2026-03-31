import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit, Building, MapPin, Hash, FileText, Globe, Mail, Server, Lock, Eye, EyeOff, User, Shield, Map, Image } from 'lucide-react';
import { Establishment } from '../../services/establishmentsService';
import GoogleMap from '../Maps/GoogleMap';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface EstablishmentViewProps {
  onBack: () => void;
  onEdit: () => void;
  establishment: Establishment;
}

interface EmailOutgoingConfig {
  id: string;
  establishment_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: string;
  smtp_user: string;
  smtp_password: string;
  sender_email: string;
  sender_name: string;
  reply_to_email: string | null;
  is_active: boolean;
  test_email_sent: boolean;
  last_test_date: string | null;
}

export const EstablishmentView: React.FC<EstablishmentViewProps> = ({ onBack, onEdit, establishment }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'logos' | 'email-incoming' | 'email-outgoing'>('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [emailOutgoingConfig, setEmailOutgoingConfig] = useState<EmailOutgoingConfig | null>(null);
  const [loadingOutgoingConfig, setLoadingOutgoingConfig] = useState(false);

  const loadEmailOutgoingConfig = useCallback(async () => {
    try {
      setLoadingOutgoingConfig(true);
      const { data, error } = await supabase!
        .from('email_outgoing_config')
        .select('*')
        .eq('establishment_id', establishment.id)
        .maybeSingle();

      if (error) {
        return;
      }

      setEmailOutgoingConfig(data);
    } catch (err) {
// console.error('Failed to load outgoing email config:', err);
    } finally {
      setLoadingOutgoingConfig(false);
    }
  }, [establishment.id]);

  useEffect(() => {
    if (activeTab === 'email-outgoing') {
      loadEmailOutgoingConfig();
    }
  }, [activeTab, loadEmailOutgoingConfig]);

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'matriz': return 'bg-blue-100 text-blue-800';
      case 'filial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasEmailConfig = establishment.email_config &&
    establishment.email_config.email &&
    establishment.email_config.host;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size="1.25rem" />
          <span>{t('establishments.buttons.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('establishments.view.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('establishments.view.subtitle')}</p>
          </div>
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit size="1.25rem" />
            <span>{t('establishments.buttons.edit')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building size="1rem" />
                <span>{t('establishments.form.tabs.basic')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'address'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin size="1rem" />
                <span>{t('establishments.form.tabs.address')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Image size="1rem" />
                <span>{t('establishments.form.tabs.logos')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email-incoming')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'email-incoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail size="1rem" />
                <span>{t('establishments.form.tabs.email')}</span>
                {!hasEmailConfig && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t('establishments.view.notConfigured')}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email-outgoing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'email-outgoing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Server size="1rem" />
                <span>{t('establishments.form.tabs.emailOutgoing')}</span>
                {!emailOutgoingConfig && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t('establishments.view.notConfigured')}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Code */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{establishment.codigo}</span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{establishment.fantasia || establishment.razao_social}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{establishment.razao_social}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.cnpj')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.code')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.type')}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(establishment.tipo || '')}`}>
                      {establishment.tipo === 'matriz' ? t('establishments.form.fields.typeOptions.matriz') : establishment.tipo === 'filial' ? t('establishments.form.fields.typeOptions.filial') : establishment.tipo}
                    </span>
                  </div>
                  {establishment.inscricao_estadual && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.ie')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.inscricao_estadual}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.trackingPrefix')}</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                      {establishment.tracking_prefix}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.legalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Hash className="text-blue-600" size="1.5rem" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.cnpj')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{establishment.cnpj}</p>
                </div>
              </div>

              {establishment.inscricao_estadual && (
                <div className="flex items-center space-x-3">
                  <FileText className="text-green-600" size="1.5rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.ie')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{establishment.inscricao_estadual}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.generalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{establishment.codigo}</p>
                <p className="text-sm text-blue-700">{t('establishments.form.fields.code')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600 capitalize">{establishment.tipo === 'matriz' ? t('establishments.form.fields.typeOptions.matriz') : establishment.tipo === 'filial' ? t('establishments.form.fields.typeOptions.filial') : establishment.tipo}</p>
                <p className="text-sm text-green-700">{t('establishments.form.fields.type')}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{establishment.estado}</p>
                <p className="text-sm text-purple-700">{t('establishments.form.fields.state')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'address' && (
        <div className="space-y-6">
          {/* Address Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.addressInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="text-blue-500" size="1.25rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.address')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.endereco}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building className="text-green-500" size="1.25rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.neighborhood')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.bairro}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="text-purple-500" size="1.25rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.cep')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cep}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="text-orange-500" size="1.25rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.city')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cidade}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Globe className="text-red-500" size="1.25rem" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.form.fields.state')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.estado}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600" />
                  Localização no Mapa
                </h4>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
                </button>
              </div>

              {showMap && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <GoogleMap
                    address={`${establishment.endereco} - ${establishment.bairro}, ${establishment.cidade} - ${establishment.estado}, ${establishment.cep}`}
                    height="400px"
                    interactive={false}
                    zoom={16}
                  />
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p><strong>{t('establishments.view.fullAddress')}</strong></p>
                    <p>{establishment.endereco}</p>
                    <p>{establishment.bairro} - {establishment.cidade}/{establishment.estado}</p>
                    <p>CEP: {establishment.cep}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logos' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('establishments.form.tabs.logos')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo Light */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('establishments.form.logos.lightTitle')}</h4>
                <div className="bg-gray-900 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_light_base64 ? (
                    <img
                      src={establishment.logo_light_base64}
                      alt="Logo Claro"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center">
                      <Image size="3rem" className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('establishments.view.noLogo')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Dark */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('establishments.form.logos.darkTitle')}</h4>
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_dark_base64 ? (
                    <img
                      src={establishment.logo_dark_base64}
                      alt="Logo Escuro"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <Image size="3rem" className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('establishments.view.noLogo')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo NPS */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('establishments.form.logos.npsTitle')}</h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_nps_base64 ? (
                    <img
                      src={establishment.logo_nps_base64}
                      alt="Logo NPS"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-blue-400 text-center">
                      <Image size="3rem" className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('establishments.view.noLogo')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'email-incoming' && (
        <div className="space-y-6">
          {!hasEmailConfig ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <Mail size="3rem" className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('establishments.view.emailIncoming.notConfiguredTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('establishments.view.emailIncoming.notConfiguredDesc')}</p>
                <button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Edit size="1.25rem" />
                  <span>{t('establishments.view.configureNow')}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Email Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.emailIncoming.configTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.emailAddress')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-green-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.username')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-purple-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.password')}</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showPassword ? establishment.email_config?.password : '••••••••••••'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showPassword ? <EyeOff size="1rem" /> : <Eye size="1rem" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="text-orange-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.authType')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.authType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.emailIncoming.serverConfigTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Server className="text-blue-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.protocol')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.protocol}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Server className="text-green-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.host')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.host}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Hash className="text-purple-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.port')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.port}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-orange-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailIncoming.secure')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.useSSL ? t('common.yes') : t('common.no')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail className="text-green-600" size="1.5rem" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">{t('establishments.view.emailIncoming.activeConfigTitle')}</h3>
                    <p className="text-green-800">
                      {t('establishments.view.emailIncoming.activeConfigDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'email-outgoing' && (
        <div className="space-y-6">
          {loadingOutgoingConfig ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            </div>
          ) : !emailOutgoingConfig ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <Server size="3rem" className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('establishments.view.emailOutgoing.notConfiguredTitle')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t('establishments.view.emailOutgoing.notConfiguredDesc')}</p>
                <button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Edit size="1.25rem" />
                  <span>{t('establishments.view.configureNow')}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SMTP Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.emailOutgoing.smtpConfig')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Server className="text-blue-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.smtpHost')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_host}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Hash className="text-green-500" size="1.25rem" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.port')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_port}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.security')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_secure}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.smtpUser')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_user}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-red-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.password')}</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showSmtpPassword ? emailOutgoingConfig.smtp_password : '••••••••••••'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sender Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.view.emailOutgoing.senderInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.senderEmail')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.sender_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.senderName')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.sender_name}</p>
                    </div>
                  </div>

                  {emailOutgoingConfig.reply_to_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="text-purple-500" size={20} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('establishments.view.emailOutgoing.replyTo')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.reply_to_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Card */}
              {emailOutgoingConfig.is_active ? (
                <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Server className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 mb-2">{t('establishments.view.emailOutgoing.activeTitle')}</h3>
                      <p className="text-green-800">
                        {t('establishments.view.emailOutgoing.activeDesc')}
                        {emailOutgoingConfig.test_email_sent && emailOutgoingConfig.last_test_date && (
                          <> {t('establishments.view.emailOutgoing.lastTest')} {new Date(emailOutgoingConfig.last_test_date).toLocaleString('pt-BR')}.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Server className="text-yellow-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">{t('establishments.view.emailOutgoing.inactiveTitle')}</h3>
                      <p className="text-yellow-800">
                        {t('establishments.view.emailOutgoing.inactiveDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
