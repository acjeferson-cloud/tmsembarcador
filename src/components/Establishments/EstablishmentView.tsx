import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Building, MapPin, Hash, FileText, Globe, Mail, Server, Lock, Eye, EyeOff, User, Shield, Map, Image } from 'lucide-react';
import { Establishment } from '../../services/establishmentsService';
import GoogleMap from '../Maps/GoogleMap';
import { supabase } from '../../lib/supabase';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'logos' | 'email-incoming' | 'email-outgoing'>('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [emailOutgoingConfig, setEmailOutgoingConfig] = useState<EmailOutgoingConfig | null>(null);
  const [loadingOutgoingConfig, setLoadingOutgoingConfig] = useState(false);

  useEffect(() => {
    if (activeTab === 'email-outgoing') {
      loadEmailOutgoingConfig();
    }
  }, [activeTab, establishment.id]);

  const loadEmailOutgoingConfig = async () => {
    try {
      setLoadingOutgoingConfig(true);
      const { data, error } = await supabase
        .from('email_outgoing_config')
        .select('*')
        .eq('establishment_id', establishment.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configuração de e-mail de saída:', error);
        return;
      }

      setEmailOutgoingConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingOutgoingConfig(false);
    }
  };

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
          <ArrowLeft size={20} />
          <span>Voltar para Estabelecimentos</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Estabelecimento</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos do estabelecimento</p>
          </div>
          <button
            onClick={onEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Edit size={20} />
            <span>Editar</span>
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
                <Building size={16} />
                <span>Informações Básicas</span>
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
                <MapPin size={16} />
                <span>Endereço</span>
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
                <Image size={16} />
                <span>Logotipos</span>
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
                <Mail size={16} />
                <span>E-mail de Entrada</span>
                {!hasEmailConfig && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Não configurado
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
                <Server size={16} />
                <span>E-mail de Saída</span>
                {!emailOutgoingConfig && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Não configurado
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(establishment.tipo)}`}>
                      {establishment.tipo.charAt(0).toUpperCase() + establishment.tipo.slice(1)}
                    </span>
                  </div>
                  {establishment.inscricao_estadual && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Inscrição Estadual</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.inscricao_estadual}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Prefixo de Rastreamento</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Legais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Hash className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{establishment.cnpj}</p>
                </div>
              </div>

              {establishment.inscricao_estadual && (
                <div className="flex items-center space-x-3">
                  <FileText className="text-green-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inscrição Estadual</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{establishment.inscricao_estadual}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{establishment.codigo}</p>
                <p className="text-sm text-blue-700">Código</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600 capitalize">{establishment.tipo}</p>
                <p className="text-sm text-green-700">Tipo</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{establishment.estado}</p>
                <p className="text-sm text-purple-700">Estado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'address' && (
        <div className="space-y-6">
          {/* Address Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.endereco}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bairro</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.bairro}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CEP</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cep}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Globe className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cidade</p>
                    <p className="font-medium text-gray-900 dark:text-white">{establishment.cidade}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Globe className="text-red-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
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
                    <p><strong>Endereço completo:</strong></p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Logotipos do Estabelecimento</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo Light */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo Claro (Fundo Escuro)</h4>
                <div className="bg-gray-900 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_light_base64 ? (
                    <img
                      src={establishment.logo_light_base64}
                      alt="Logo Claro"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center">
                      <Image size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sem logo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Dark */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo Escuro (Fundo Claro)</h4>
                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_dark_base64 ? (
                    <img
                      src={establishment.logo_dark_base64}
                      alt="Logo Escuro"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <Image size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sem logo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo NPS */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo para Pesquisa NPS</h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                  {establishment.logo_nps_base64 ? (
                    <img
                      src={establishment.logo_nps_base64}
                      alt="Logo NPS"
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-blue-400 text-center">
                      <Image size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sem logo</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> O logo claro é usado em fundos escuros, o logo escuro em fundos claros, e o logo NPS é usado especificamente nas pesquisas de satisfação enviadas aos clientes.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'email-incoming' && (
        <div className="space-y-6">
          {!hasEmailConfig ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">E-mail de Entrada não configurado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Este estabelecimento ainda não possui uma configuração de e-mail de entrada (IMAP/POP3).</p>
                <button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Edit size={20} />
                  <span>Configurar Agora</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Email Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuração da Conta de E-mail de Entrada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Endereço de E-mail</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Usuário</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Senha</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showPassword ? establishment.email_config?.password : '••••••••••••'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de Autenticação</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.authType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuração do Servidor de Entrada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Server className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Protocolo</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.protocol}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Server className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Servidor (Host)</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.host}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Hash className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Porta</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.port}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conexão Segura (SSL/TLS)</p>
                      <p className="font-medium text-gray-900 dark:text-white">{establishment.email_config?.useSSL ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Configuração Ativa</h3>
                    <p className="text-green-800">
                      Esta conta de e-mail está configurada e pronta para receber mensagens dos transportadores.
                      O sistema verificará automaticamente novos e-mails e processará os anexos conforme as regras definidas.
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
                <p className="text-gray-600 dark:text-gray-400">Carregando configuração...</p>
              </div>
            </div>
          ) : !emailOutgoingConfig ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <Server size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">E-mail de Saída não configurado</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Este estabelecimento ainda não possui uma configuração de servidor SMTP para envio de e-mails.</p>
                <button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                >
                  <Edit size={20} />
                  <span>Configurar Agora</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SMTP Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuração do Servidor SMTP</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Server className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Servidor SMTP</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_host}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Hash className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Porta</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_port}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Segurança</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_secure}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Usuário SMTP</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.smtp_user}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock className="text-red-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Senha</p>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Remetente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">E-mail Remetente</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.sender_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="text-green-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nome do Remetente</p>
                      <p className="font-medium text-gray-900 dark:text-white">{emailOutgoingConfig.sender_name}</p>
                    </div>
                  </div>

                  {emailOutgoingConfig.reply_to_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="text-purple-500" size={20} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">E-mail para Resposta</p>
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
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Configuração Ativa</h3>
                      <p className="text-green-800">
                        Este servidor SMTP está configurado e ativo para envio de e-mails.
                        {emailOutgoingConfig.test_email_sent && emailOutgoingConfig.last_test_date && (
                          <> Último teste realizado em {new Date(emailOutgoingConfig.last_test_date).toLocaleString('pt-BR')}.</>
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
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">Configuração Inativa</h3>
                      <p className="text-yellow-800">
                        Esta configuração SMTP existe mas está desativada. Para ativar, edite as configurações.
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
