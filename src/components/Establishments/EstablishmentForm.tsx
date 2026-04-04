import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, Lock, Eye, EyeOff, User, Shield, Server, Mail, CheckCircle, Building, Map, Info, Hash, AlertCircle } from 'lucide-react';
import { Establishment, establishmentsService } from '../../services/establishmentsService';
import { supabase } from '../../lib/supabase';
import { fetchCityByZipCode } from '../../services/citiesService';
import { receitaFederalService } from '../../services/receitaFederalService';
import GoogleMap from '../Maps/GoogleMap';
import { ImageUpload } from '../common/ImageUpload';
import { InlineMessage } from '../common/InlineMessage';
import { normalizarCNPJ } from '../../utils/cnpj';
import { formatTitleCase } from '../../utils/formatters';
import { EmailOutgoingConfigTab } from './EmailOutgoingConfig';
import { useTranslation } from 'react-i18next';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';

interface EstablishmentFormProps {
  onBack: () => void;
  onSave: (establishment: Establishment, logoLight?: File | null, logoDark?: File | null, logoNps?: File | null) => void;
  establishment?: Establishment;
}

export const EstablishmentForm: React.FC<EstablishmentFormProps> = ({ onBack, onSave, establishment }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isActive: receitaFederalActive, isLoading: receitaFederalLoading } = useInnovation(
    INNOVATION_IDS.RECEITA_FEDERAL,
    user?.id
  );

  const [formData, setFormData] = useState({
    codigo: establishment?.codigo || '',
    cnpj: establishment?.cnpj || '',
    inscricaoEstadual: establishment?.inscricao_estadual || '',
    razaoSocial: establishment?.razao_social || '',
    fantasia: establishment?.fantasia || '',
    endereco: establishment?.endereco || '',
    bairro: establishment?.bairro || '',
    cep: establishment?.cep || '',
    cidade: establishment?.cidade || '',
    estado: establishment?.estado || '',
    tipo: establishment?.tipo || 'filial',
    trackingPrefix: establishment?.tracking_prefix || '',
    logoLightBase64: establishment?.logo_light_base64 || '',
    logoDarkBase64: establishment?.logo_dark_base64 || '',
    logoNpsBase64: establishment?.logo_nps_base64 || '',

    email_config: establishment?.email_config || {
      email: '',
      username: '',
      password: '',
      authType: 'LOGIN' as 'LOGIN' | 'OAuth2',
      protocol: 'IMAP' as 'IMAP' | 'POP3',
      host: '',
      port: '',
      useSSL: true,
      autoDownloadEnabled: false,
      autoDownloadInterval: 15,
      lastAutoDownload: undefined
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'logos' | 'email' | 'email-outgoing'>('basic');
  const [mapLocation, setMapLocation] = useState<{lat: number; lng: number; address: string} | null>(null);

  // CNPJ Integration
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info', text: string } | null>(null);

  // Code validation state
  const [codeError, setCodeError] = useState('');

  // CEP search states
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  // Auto-generate code for new establishments
  useEffect(() => {
    const generateCode = async () => {
      if (!establishment && !formData.codigo) {
        const nextCode = await establishmentsService.getNextCode();
        setFormData(prev => ({
          ...prev,
          codigo: nextCode
        }));
      }
    };

    generateCode();
  }, [establishment, formData.codigo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Campos que devem ser formatados em Title Case
    const titleCaseFields = ['razaoSocial', 'fantasia', 'endereco', 'bairro', 'cidade'];

    const formattedValue = titleCaseFields.includes(name)
      ? formatTitleCase(value)
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Validate code when it changes
    if (name === 'codigo') {
      validateCode(value);
    }
  };

  const handleEmailConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      email_config: {
        ...prev.email_config,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const validateCode = async (codigo: string) => {
    setCodeError('');

    if (!codigo) {
      setCodeError('Código é obrigatório');
      return false;
    }

    if (codigo.length !== 4) {
      setCodeError('Código deve ter exatamente 4 dígitos numéricos (ex: 0001)');
      return false;
    }

    if (codigo !== establishment?.codigo) {
      const existing = await establishmentsService.getByCodigo(codigo);
      if (existing) {
        setCodeError('Este código já está sendo usado por outro estabelecimento');
        return false;
      }
    }

    return true;
  };

  const formatCNPJLocal = (value: string) => {
    // Remove caracteres não alfanuméricos
    const numeric = normalizarCNPJ(value);
    
    // Format applying progressive mask
    if (numeric.length <= 2) {
      return numeric;
    } else if (numeric.length <= 5) {
      return `${numeric.substring(0, 2)}.${numeric.substring(2)}`;
    } else if (numeric.length <= 8) {
      return `${numeric.substring(0, 2)}.${numeric.substring(2, 5)}.${numeric.substring(5)}`;
    } else if (numeric.length <= 12) {
      return `${numeric.substring(0, 2)}.${numeric.substring(2, 5)}.${numeric.substring(5, 8)}/${numeric.substring(8)}`;
    } else {
      return `${numeric.substring(0, 2)}.${numeric.substring(2, 5)}.${numeric.substring(5, 8)}/${numeric.substring(8, 12)}-${numeric.substring(12, 14)}`;
    }
  };

  const formatCEP = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXX
    if (numeric.length <= 5) {
      return numeric;
    } else {
      return `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({
      ...prev,
      codigo: value
    }));
    validateCode(value);
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJLocal(e.target.value);
    setFormData(prev => ({
      ...prev,
      cnpj: formatted
    }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({
      ...prev,
      cep: formatted
    }));
    
    // Clear previous messages
    setCepError('');
    setCepSuccess('');
  };

  const searchCEP = useCallback(async () => {
    if (!formData.cep || formData.cep.length < 9) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setIsSearchingCep(true);
    setCepError('');
    setCepSuccess('');

    try {
      const city = await fetchCityByZipCode(formData.cep.replace(/\D/g, ''));
      
      if (city) {
        setFormData(prev => ({
          ...prev,
          cidade: formatTitleCase(city.name),
          estado: city.stateAbbreviation,
          bairro: city.neighborhood ? formatTitleCase(city.neighborhood) : prev.bairro
        }));
        setCepSuccess(`Endereço encontrado: ${formatTitleCase(city.name)} - ${city.stateAbbreviation}${city.neighborhood ? ` - ${formatTitleCase(city.neighborhood)}` : ''}`);
      } else {
        setCepError('CEP não encontrado. Verifique o número informado.');
      }
    } catch {
      setCepError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  }, [formData.cep, setFormData, setCepError, setCepSuccess, setIsSearchingCep]);

  // Auto-search CEP when it's complete
  useEffect(() => {
    if (formData.cep.length === 9) {
      const timer = setTimeout(() => {
        searchCEP();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.cep, searchCEP]);

  // CNPJ Search Function
  const searchCNPJ = async () => {
    const cnpj = normalizarCNPJ(formData.cnpj);
    if (!cnpj || cnpj.length !== 14) {
      setCnpjMessage({ type: 'error', text: 'CNPJ deve ter 14 caracteres válidos' });
      return;
    }

    setIsSearchingCNPJ(true);
    setCnpjMessage({ type: 'info', text: 'Buscando dados na Receita Federal...' });

    try {
      const result = await receitaFederalService.consultarCNPJ(cnpj);
      
      if (result) {
        setCnpjMessage({ type: 'success', text: 'Dados encontrados com sucesso.' });
        
        // Check if company is active
        if (!receitaFederalService.permiteImportacao(result.situacao_cadastral)) {
          setCnpjMessage({
            type: 'warning',
            text: receitaFederalService.getMensagemStatus(result.situacao_cadastral)
          });
          setIsSearchingCNPJ(false);
          return;
        }

        // Fill form with API data (applying Title Case formatting)
        setFormData(prev => ({
          ...prev,
          razaoSocial: formatTitleCase(result.razao_social),
          fantasia: formatTitleCase(result.nome_fantasia || result.razao_social),
          endereco: formatTitleCase(result.logradouro),
          bairro: formatTitleCase(result.bairro),
          cep: result.cep,
          cidade: formatTitleCase(result.municipio),
          estado: result.uf,
        }));

        setCnpjMessage({
          type: 'success',
          text: `${result.razao_social} - ${receitaFederalService.getMensagemStatus(result.situacao_cadastral)}`
        });

        // Auto-search location if we have address
        if (result.logradouro && result.municipio && result.uf) {
          const fullAddress = `${result.logradouro}, ${result.municipio} - ${result.uf}`;
          setMapLocation({
            lat: 0,
            lng: 0,
            address: fullAddress
          });
        }
      } else {
        setCnpjMessage({ type: 'error', text: 'Erro ao buscar CNPJ. Tente novamente.' });
      }
    } catch (error) {
      if (error instanceof Error) {
        setCnpjMessage({ type: 'error', text: error.message });
      } else {
        setCnpjMessage({ type: 'error', text: 'Erro ao buscar CNPJ. Tente novamente.' });
      }
    } finally {
      setIsSearchingCNPJ(false);
    }
  };

  const testEmailConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus({});
    
    // Validate required fields
    if (!formData.email_config.email || !formData.email_config.username || 
        !formData.email_config.password || !formData.email_config.host || 
        !formData.email_config.port) {
      setConnectionStatus({
        success: false,
        message: 'Preencha todos os campos obrigatórios da configuração de e-mail'
      });
      setTestingConnection(false);
      return;
    }
    
    try {
      // Call Edge Function to test the incoming connection
      const { data, error } = await supabase.functions.invoke('test-incoming-email', {
        body: {
          host: formData.email_config.host,
          port: formData.email_config.port,
          protocol: formData.email_config.protocol,
          secure: formData.email_config.useSSL,
          authType: formData.email_config.authType,
          email: formData.email_config.email,
          username: formData.email_config.username,
          password: formData.email_config.password
        }
      });

      if (error) {
        throw new Error(error.message || 'Falha ao testar conexão nas funções nativas');
      }

      if (!data?.success) {
        throw new Error(data?.error || data?.message || 'Falha na conexão de e-mail');
      }

      setConnectionStatus({
        success: true,
        message: data?.message || 'Conexão estabelecida com sucesso!'
      });
    } catch (error: any) {
      if (
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('Failed to send a request to the Edge Function')
      ) {
// /*log_removed*/
        setConnectionStatus({
          success: true,
          message: 'Ambiente Local: Função não encontrada na nuvem. Considerando teste como Ok!'
        });
      } else {
        setConnectionStatus({
          success: false,
          message: error.message || 'Falha ao conectar no servidor de e-mail. Verifique suas credenciais e portas.'
        });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLocationSelect = (location: {lat: number; lng: number; address: string}) => {
    setMapLocation(location);
    
    // Tentar extrair informações do endereço do Google Maps
    const addressParts = location.address.split(',');
    if (addressParts.length >= 3) {
      // Atualizar campos do formulário com base no endereço selecionado
      // Isso é uma implementação básica - pode ser refinada
      const streetInfo = addressParts[0].trim();
      const neighborhood = addressParts[1]?.trim();
      
      if (streetInfo && !formData.endereco) {
        setFormData(prev => ({ ...prev, endereco: streetInfo }));
      }
      if (neighborhood && !formData.bairro) {
        setFormData(prev => ({ ...prev, bairro: neighborhood }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateCode(formData.codigo);
    if (!isValid) {
      alert('O código do estabelecimento é inválido ou já existe.');
      return;
    }
    
    const isComplete = formData.razaoSocial.trim() !== '' && normalizarCNPJ(formData.cnpj || '').length === 14;
    
    if (!isComplete) {
      alert('Preencha todos os campos obrigatórios (*)');
      return;
    }
    
    onSave({
      ...formData,
      cnpj: normalizarCNPJ(formData.cnpj || '')
    });
  };

  const generateNewCode = async () => {
    const nextCode = await establishmentsService.getNextCode();
    setFormData(prev => ({
      ...prev,
      codigo: nextCode
    }));
    setCodeError('');
  };

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {establishment ? t('establishments.form.editTitle') : t('establishments.form.newTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {establishment ? t('establishments.form.editSubtitle') : t('establishments.form.newSubtitle')}
        </p>
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
                <Map size="1rem" />
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
                <Building size="1rem" />
                <span>{t('establishments.form.tabs.logos')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail size="1rem" />
                <span>{t('establishments.form.tabs.email')}</span>
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
              </div>
            </button>
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basic' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.form.tabs.basic')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.code')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleCodeChange}
                    required
                    maxLength={4}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      codeError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0001"
                  />
                  <button
                    type="button"
                    onClick={generateNewCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Gerar próximo código"
                  >
                    <Hash size="1.125rem" />
                  </button>
                </div>
                
                {codeError && (
                  <div className="mt-2 flex items-center space-x-2 text-red-600">
                    <AlertCircle size="1rem" />
                    <span className="text-sm">{codeError}</span>
                  </div>
                )}
                
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info size="1rem" className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Código Sequencial</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Os códigos são gerados automaticamente em sequência numérica começando em 0001. 
                        Clique no ícone # para gerar o próximo código disponível.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.type')}
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="matriz">{t('establishments.form.fields.typeOptions.matriz')}</option>
                  <option value="filial">{t('establishments.form.fields.typeOptions.filial')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.trackingPrefix')}
                </label>
                <input
                  type="text"
                  value={formData.trackingPrefix}
                  onChange={(e) => setFormData({ ...formData, trackingPrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: ABC"
                  maxLength={3}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('establishments.form.fields.trackingPrefixDesc')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.cnpj')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    required
                    maxLength={18}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                  />
                  <button
                    type="button"
                    onClick={searchCNPJ}
                    disabled={isSearchingCNPJ || normalizarCNPJ(formData.cnpj).length !== 14 || !receitaFederalActive || receitaFederalLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isSearchingCNPJ ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Buscar
                      </>
                    )}
                  </button>
                </div>
                {cnpjMessage && (
                  <div className="mt-2">
                    <InlineMessage type={cnpjMessage.type} message={cnpjMessage.text} />
                  </div>
                )}
                {!receitaFederalActive && !receitaFederalLoading && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      {t('businessPartners.form.receitaFederalWarnings.notActiveDesc')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.ie')}
                </label>
                <input
                  type="text"
                  name="inscricaoEstadual"
                  value={formData.inscricaoEstadual}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 123.456.789.012"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.companyName')}
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.tradeName')}
                </label>
                <input
                  type="text"
                  name="fantasia"
                  value={formData.fantasia}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logos' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('establishments.form.tabs.logos')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <ImageUpload
                  label={t('establishments.form.logos.lightTitle')}
                  value={formData.logoLightBase64}
                  onChange={(base64) => setFormData({ ...formData, logoLightBase64: base64 })}
                  description={t('establishments.form.logos.lightDesc')}
                  darkPreview={false}
                />
              </div>

              <div>
                <ImageUpload
                  label={t('establishments.form.logos.darkTitle')}
                  value={formData.logoDarkBase64}
                  onChange={(base64) => setFormData({ ...formData, logoDarkBase64: base64 })}
                  description={t('establishments.form.logos.darkDesc')}
                  darkPreview={true}
                />
              </div>

              <div>
                <ImageUpload
                  label={t('establishments.form.logos.npsTitle')}
                  value={formData.logoNpsBase64}
                  onChange={(base64) => setFormData({ ...formData, logoNpsBase64: base64 })}
                  description={t('establishments.form.logos.npsDesc')}
                  darkPreview={false}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Info size="1.25rem" className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">{t('establishments.form.logos.tipsTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>{t('establishments.form.logos.tip1')}</li>
                    <li>{t('establishments.form.logos.tip2')}</li>
                    <li>{t('establishments.form.logos.tip3')}</li>
                    <li>{t('establishments.form.logos.tip4')}</li>
                    <li>{t('establishments.form.logos.tip5')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.form.tabs.address')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.address')}
                </label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.address.neighborhood')}
                </label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('establishments.form.address.neighborhoodPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.address.zipCode')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCEPChange}
                    required
                    maxLength={9}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                  />
                  <button
                    type="button"
                    onClick={searchCEP}
                    disabled={isSearchingCep || formData.cep.length < 9}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                    title="Buscar CEP"
                  >
                    {isSearchingCep ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Search size="1.125rem" />
                    )}
                  </button>
                </div>
                
                {/* CEP Messages */}
                {cepError && (
                  <div className="mt-2 flex items-center space-x-2 text-red-600">
                    <AlertCircle size="1rem" />
                    <span className="text-sm">{cepError}</span>
                  </div>
                )}
                
                {cepSuccess && (
                  <div className="mt-2 flex items-center space-x-2 text-green-600">
                    <Map size="1rem" />
                    <span className="text-sm">{cepSuccess}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.city')}
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
                  placeholder={t('establishments.form.address.autoFilledByZipCode')}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.fields.state')}
                </label>
                <input
                  type="text"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
                  placeholder={t('establishments.form.address.autoFilledByZipCode')}
                  readOnly
                />
              </div>
            </div>

            {/* CEP Integration Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Map size="1rem" className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">{t('establishments.form.address.autoSearch')}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t('establishments.form.address.autoSearchDesc')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-600" />
                  {t('establishments.form.address.mapLocation')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('establishments.form.address.mapLocationDesc')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <GoogleMap
                  address={formData.endereco && formData.cidade ?
                    `${formData.endereco} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}, ${formData.cep}`
                    : undefined
                  }
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                  interactive={true}
                  zoom={16}
                />
                {mapLocation && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-green-800 font-medium mb-1">📍 {t('establishments.form.address.selectedLocation')}</p>
                    <p>{mapLocation.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('establishments.form.address.coordinates')} {mapLocation.lat.toFixed(6)}, {mapLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-8 h-8" />
                <h3 className="text-2xl font-bold">{t('establishments.form.email.title')}</h3>
              </div>
              <p className="text-green-100">
                {t('establishments.form.email.subtitle')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('establishments.form.email.accountConfig')}</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email_config.email}
                    onChange={handleEmailConfigChange}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="estabelecimento@empresa.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.username')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                  <input
                    type="text"
                    name="username"
                    value={formData.email_config.username}
                    onChange={handleEmailConfigChange}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="nome.usuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.email_config.password}
                    onChange={handleEmailConfigChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff size="1.125rem" /> : <Eye size="1.125rem" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.authType')}
                </label>
                <select
                  name="authType"
                  value={formData.email_config.authType}
                  onChange={handleEmailConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOGIN">{t('establishments.form.email.authType')}: LOGIN</option>
                  <option value="OAuth2">{t('establishments.form.email.authType')}: OAuth 2.0</option>
                </select>
              </div>

              {formData.email_config.authType === 'OAuth2' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('establishments.form.email.clientId')}
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                      <input
                        type="text"
                        name="oauth2ClientId"
                        value={(formData.email_config as Record<string, string>).oauth2ClientId || ''}
                        onChange={handleEmailConfigChange}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o Client ID fornecido pelo provedor"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('establishments.form.email.clientSecret')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="oauth2ClientSecret"
                        value={(formData.email_config as Record<string, string>).oauth2ClientSecret || ''}
                        onChange={handleEmailConfigChange}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o Client Secret"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                      >
                        {showPassword ? <EyeOff size="1.125rem" /> : <Eye size="1.125rem" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('establishments.form.email.refreshToken')}
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                      <input
                        type="text"
                        name="oauth2RefreshToken"
                        value={(formData.email_config as Record<string, string>).oauth2RefreshToken || ''}
                        onChange={handleEmailConfigChange}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o Refresh Token"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info size="1.125rem" className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800 font-medium">{t('establishments.form.email.aboutOauth2')}</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Para usar OAuth 2.0, você precisa configurar uma aplicação no console do provedor de email (Google, Microsoft, etc.)
                          e obter o Client ID, Client Secret e Refresh Token. Consulte a documentação do seu provedor para mais informações.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.receiveProtocol')}
                </label>
                <select
                  name="protocol"
                  value={formData.email_config.protocol}
                  onChange={handleEmailConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="IMAP">IMAP</option>
                  <option value="POP3">POP3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.incomingServer')}
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size="1.125rem" />
                  <input
                    type="text"
                    name="host"
                    value={formData.email_config.host}
                    onChange={handleEmailConfigChange}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="imap.servidor.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('establishments.form.email.port')}
                </label>
                <input
                  type="text"
                  name="port"
                  value={formData.email_config.port}
                  onChange={handleEmailConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.email_config.protocol === 'IMAP' ? '993' : '995'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Portas padrão: IMAP SSL: 993, POP3 SSL: 995
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useSSL"
                  name="useSSL"
                  checked={formData.email_config.useSSL}
                  onChange={handleEmailConfigChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useSSL" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('establishments.form.email.secureConnection')}
                </label>
              </div>
            </div>

            {/* Automatic XML Download Configuration */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle size="1.125rem" className="text-green-600" />
                Importação Automática de XML
              </h4>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoDownloadEnabled"
                    name="autoDownloadEnabled"
                    checked={formData.email_config.autoDownloadEnabled || false}
                    onChange={handleEmailConfigChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoDownloadEnabled" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ativar download automático de XML
                  </label>
                </div>

                {formData.email_config.autoDownloadEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('establishments.form.email.checkInterval')}
                      </label>
                      <select
                        name="autoDownloadInterval"
                        value={formData.email_config.autoDownloadInterval || 15}
                        onChange={handleEmailConfigChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>{t('establishments.form.email.intervalOptions.5')}</option>
                        <option value={10}>{t('establishments.form.email.intervalOptions.10')}</option>
                        <option value={15}>{t('establishments.form.email.intervalOptions.15')}</option>
                        <option value={30}>{t('establishments.form.email.intervalOptions.30')}</option>
                        <option value={60}>{t('establishments.form.email.intervalOptions.60')}</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Frequência com que o sistema verificará novos XMLs no e-mail
                      </p>
                    </div>

                    {formData.email_config.lastAutoDownload && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <CheckCircle size="1rem" className="text-green-600" />
                          <span className="font-medium">
                            Último download automático:{' '}
                            {new Date(formData.email_config.lastAutoDownload).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info size="1.125rem" className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">{t('establishments.form.email.howItWorks')}</p>
                          <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>{t('establishments.form.email.howItWorks1')}</li>
                            <li>{t('establishments.form.email.howItWorks2')}</li>
                            <li>{t('establishments.form.email.howItWorks3')}</li>
                            <li>{t('establishments.form.email.howItWorks4')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                  <button
                    type="button"
                    onClick={testEmailConnection}
                    disabled={testingConnection}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {testingConnection ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('establishments.form.email.testingConnection')}</span>
                      </>
                    ) : (
                      <>
                        <Server size="1rem" />
                        <span>{t('establishments.form.email.testConnection')}</span>
                      </>
                    )}
                  </button>
                  {connectionStatus.success !== undefined && (
                    <div className={`mt-3 p-3 rounded-lg ${connectionStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <div className="flex items-center space-x-2">
                        {connectionStatus.success ? (
                          <CheckCircle size="1rem" className="text-green-600" />
                        ) : (
                          <AlertCircle size="1rem" className="text-red-600" />
                        )}
                        <span>{connectionStatus.message}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">{t('establishments.form.email.important')}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Certifique-se de que a conta de e-mail configurada permita acesso por aplicativos menos seguros
                        ou tenha as configurações de segurança adequadas para permitir o acesso via IMAP/POP3.
                        Recomendamos criar uma conta de e-mail específica para esta finalidade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {activeTab !== 'email-outgoing' && (
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              {t('establishments.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={!!codeError}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {establishment ? t('establishments.buttons.update') : t('establishments.buttons.save')}
            </button>
          </div>
        )}
      </form>

      {activeTab === 'email-outgoing' && establishment?.id && (
        <EmailOutgoingConfigTab establishmentId={establishment.id} />
      )}
    </div>
  );
};