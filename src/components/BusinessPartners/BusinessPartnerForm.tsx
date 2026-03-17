import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, User, Users, MapPin, FileText, Plus, Trash2, Map, Phone, Mail, Search, Loader, Info, MessageSquare } from 'lucide-react';
import { BusinessPartner, BusinessPartnerContact, BusinessPartnerAddress } from '../../types';
import GoogleMap from '../Maps/GoogleMap';
import { receitaFederalService } from '../../services/receitaFederalService';
import { findOrCreateCityByCEP } from '../../services/citiesService';
import { InlineMessage } from '../common/InlineMessage';
import { useInnovation, INNOVATION_IDS } from '../../hooks/useInnovation';
import { useAuth } from '../../hooks/useAuth';
import { InteractionLogsTab } from './InteractionLogsTab';

interface BusinessPartnerFormProps {
  partner: BusinessPartner | null;
  onSave: (partner: Partial<BusinessPartner>) => void;
  onClose: () => void;
}

const BusinessPartnerForm: React.FC<BusinessPartnerFormProps> = ({
  partner,
  onSave,
  onClose
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isActive: receitaFederalActive, isLoading: receitaFederalLoading } = useInnovation(
    INNOVATION_IDS.RECEITA_FEDERAL,
    user?.id
  );

  const [activeTab, setActiveTab] = useState('basic');
  const [showMap, setShowMap] = useState(false);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    documentType: 'cnpj' as 'cpf' | 'cnpj',
    email: '',
    phone: '',
    type: 'customer' as 'customer' | 'supplier' | 'both',
    status: 'active' as 'active' | 'inactive',
    observations: '',
    website: '',
    taxRegime: 'simples' as 'simples' | 'presumido' | 'real' | 'mei',
    creditLimit: 0,
    paymentTerms: 30,
    notes: ''
  });

  const [contacts, setContacts] = useState<BusinessPartnerContact[]>([]);
  const [addresses, setAddresses] = useState<BusinessPartnerAddress[]>([]);
  const [loadingCEP, setLoadingCEP] = useState<{[key: number]: boolean}>({});
  const [cepMessages, setCepMessages] = useState<{[key: number]: {type: 'success' | 'error', text: string}}>({});

  // Função para formatar telefone brasileiro
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';

    if (cleaned.length <= 2) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        document: partner.document,
        documentType: partner.documentType,
        email: partner.email,
        phone: partner.phone,
        type: partner.type,
        status: partner.status,
        observations: partner.observations,
        website: partner.website || '',
        taxRegime: partner.taxRegime || 'simples',
        creditLimit: partner.creditLimit || 0,
        paymentTerms: partner.paymentTerms || 30,
        notes: partner.notes || ''
      });
      setContacts(partner.contacts || []);
      // Mapear address_type para type para compatibilidade
      setAddresses(
        (partner.addresses || []).map(addr => ({
          ...addr,
          type: addr.type || addr.address_type || 'commercial'
        }))
      );
    }
  }, [partner]);

  const handleConsultarCNPJ = async () => {
    if (!formData.document || formData.documentType !== 'cnpj') {
      setCnpjMessage({ type: 'error', text: t('businessPartners.form.validation.invalidCNPJ', 'Informe um CNPJ válido.') });
      return;
    }

    setIsLoadingCNPJ(true);
    setCnpjMessage(null);

    try {
      const dados = await receitaFederalService.consultarCNPJ(formData.document);

      const permiteImportacao = receitaFederalService.permiteImportacao(dados.situacao_cadastral);
      const mensagemStatus = receitaFederalService.getMensagemStatus(dados.situacao_cadastral);

      if (!permiteImportacao) {
        setCnpjMessage({
          type: 'error',
          text: `❌ Importação não permitida. ${mensagemStatus}\n\nApenas empresas com situação ATIVA podem ser cadastradas.`
        });
        setIsLoadingCNPJ(false);
        return;
      }

      setFormData(prev => ({
        ...prev,
        document: dados.cnpj,
        name: dados.razao_social,
        email: dados.email || prev.email,
        phone: dados.ddd_telefone_1 || prev.phone,
      }));

      let cityData = null;
      let cityName = dados.municipio;
      let stateName = dados.uf;

      if (dados.cep) {
        try {
          console.log('Verificando cidade pelo CEP:', dados.cep);
          cityData = await findOrCreateCityByCEP(dados.cep);
          cityName = cityData.name;
          stateName = cityData.stateAbbreviation;
          console.log('Cidade validada/criada:', cityName);
        } catch (error) {
          console.warn('Não foi possível validar/criar cidade:', error);
        }
      }

      const newAddress: BusinessPartnerAddress = {
        id: Date.now().toString(),
        street: dados.logradouro,
        number: dados.numero,
        complement: dados.complemento,
        neighborhood: dados.bairro,
        city: cityName,
        state: stateName,
        zip_code: dados.cep,
        type: 'commercial' as const,
        is_primary: addresses.length === 0,
      };

      setAddresses(prev => prev.length === 0 ? [newAddress] : prev);

      const successMessage = cityData
        ? `✓ Dados carregados com sucesso! Cidade "${cityName}" validada no cadastro. ${mensagemStatus}`
        : `✓ Dados carregados com sucesso! ${mensagemStatus}`;

      setCnpjMessage({
        type: 'success',
        text: successMessage
      });
    } catch (error) {
      setCnpjMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao consultar CNPJ.'
      });
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  const validateAddress = (address: BusinessPartnerAddress): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Verificar ambos os campos por compatibilidade (type e address_type)
    const addressType = address.type || address.address_type;
    if (!addressType) {
      errors.push('Tipo de endereço é obrigatório');
    }
    if (!address.street || address.street.trim() === '') {
      errors.push('Logradouro é obrigatório');
    }
    if (!address.city || address.city.trim() === '') {
      errors.push('Cidade é obrigatória');
    }
    if (!address.state || address.state.trim() === '') {
      errors.push('Estado é obrigatório');
    }
    if (!address.zip_code || address.zip_code.replace(/\D/g, '').length !== 8) {
      errors.push('CEP válido é obrigatório (8 dígitos)');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se existe pelo menos um endereço
    if (addresses.length === 0) {
      alert(t('businessPartners.form.validation.minOneAddress', 'É obrigatório cadastrar pelo menos um endereço para o parceiro de negócios.'));
      setActiveTab('addresses');
      return;
    }

    // Validar todos os endereços
    const invalidAddresses: { index: number; errors: string[] }[] = [];
    addresses.forEach((address, index) => {
      const validation = validateAddress(address);
      if (!validation.valid) {
        invalidAddresses.push({ index: index + 1, errors: validation.errors });
      }
    });

    if (invalidAddresses.length > 0) {
      const errorMessages = invalidAddresses.map(
        ({ index, errors }) => `Endereço #${index}:\n- ${errors.join('\n- ')}`
      ).join('\n\n');

      alert(`Por favor, corrija os seguintes erros nos endereços:\n\n${errorMessages}`);
      setActiveTab('addresses');
      return;
    }

    // Verificar se pelo menos um endereço está marcado como principal
    const hasPrimary = addresses.some(addr => addr.isPrimary);
    if (!hasPrimary && addresses.length > 0) {
      addresses[0].isPrimary = true;
    }

    // Mapear type para address_type antes de salvar no banco
    const addressesForSave = addresses.map(addr => ({
      ...addr,
      address_type: addr.type || addr.address_type || 'commercial'
    }));

    console.log('[BusinessPartnerForm] Submitting partner data:', {
      ...formData,
      creditLimit: formData.creditLimit,
      notes: formData.notes
    });

    onSave({
      ...formData,
      contacts,
      addresses: addressesForSave
    });
  };

  const handleShowOnMap = () => {
    if (addresses.length > 0 && addresses[0].street && addresses[0].city && addresses[0].state) {
      setShowMap(true);
    } else {
      alert(t('businessPartners.form.validation.fillAddressFirst', 'Por favor, preencha o endereço, cidade e estado antes de visualizar no mapa.'));
    }
  };

  const addContact = () => {
    const newContact: BusinessPartnerContact = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      isPrimary: false,
      receiveWhatsappNotifications: false,
      receiveEmailNotifications: false,
      // Email notification preferences (all unchecked by default)
      emailNotifyOrderCreated: false,
      emailNotifyOrderInvoiced: false,
      emailNotifyAwaitingPickup: false,
      emailNotifyPickedUp: false,
      emailNotifyInTransit: false,
      emailNotifyOutForDelivery: false,
      emailNotifyDelivered: false,
      // WhatsApp notification preferences (all unchecked by default)
      whatsappNotifyOrderCreated: false,
      whatsappNotifyOrderInvoiced: false,
      whatsappNotifyAwaitingPickup: false,
      whatsappNotifyPickedUp: false,
      whatsappNotifyInTransit: false,
      whatsappNotifyOutForDelivery: false,
      whatsappNotifyDelivered: false
    };
    setContacts([...contacts, newContact]);
  };

  const updateContact = (index: number, field: keyof BusinessPartnerContact, value: any) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };

    // If setting as primary, unset others
    if (field === 'isPrimary' && value) {
      updatedContacts.forEach((contact, i) => {
        if (i !== index) contact.isPrimary = false;
      });
    }

    setContacts(updatedContacts);
  };

  const removeContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    // If removed contact was primary and there are others, make first one primary
    if (contacts[index].isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }
    setContacts(updatedContacts);
  };

  const addAddress = () => {
    const newAddress: BusinessPartnerAddress = {
      id: Date.now().toString(),
      type: 'commercial',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Brasil',
      isPrimary: addresses.length === 0
    };
    setAddresses([...addresses, newAddress]);
  };

  const updateAddress = (index: number, field: keyof BusinessPartnerAddress, value: any) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };

    // If setting as primary, unset others
    if (field === 'isPrimary' && value) {
      updatedAddresses.forEach((address, i) => {
        if (i !== index) address.isPrimary = false;
      });
    }

    setAddresses(updatedAddresses);
  };

  const removeAddress = (index: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    // If removed address was primary and there are others, make first one primary
    if (addresses[index].isPrimary && updatedAddresses.length > 0) {
      updatedAddresses[0].isPrimary = true;
    }
    setAddresses(updatedAddresses);
  };

  const handleCEPSearch = async (index: number, cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
      setCepMessages({ ...cepMessages, [index]: { type: 'error', text: 'CEP deve conter 8 dígitos' } });
      return;
    }

    setLoadingCEP({ ...loadingCEP, [index]: true });
    setCepMessages({ ...cepMessages, [index]: { type: 'success', text: 'Buscando CEP...' } });

    try {
      // Garante que a cidade está cadastrada no sistema e retorna os dados completos
      const cityData = await findOrCreateCityByCEP(cleanCEP);

      if (!cityData) {
        setCepMessages({ ...cepMessages, [index]: { type: 'error', text: 'CEP não encontrado' } });
        return;
      }

      console.log('📍 [BusinessPartnerForm] Dados da cidade retornados:', cityData);

      // Buscar dados adicionais do ViaCEP para preencher rua e bairro
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const viaCepData = await viaCepResponse.json();

      // Preenche o endereço com os dados validados da cidade
      const updatedAddresses = [...addresses];
      updatedAddresses[index] = {
        ...updatedAddresses[index],
        city: cityData.name,
        state: cityData.stateAbbreviation,
        neighborhood: cityData.neighborhood || viaCepData.bairro || updatedAddresses[index].neighborhood,
        street: viaCepData.logradouro || updatedAddresses[index].street,
        zip_code: cleanCEP,
        country: 'Brasil'
      };
      setAddresses(updatedAddresses);
      setCepMessages({ ...cepMessages, [index]: { type: 'success', text: `CEP encontrado: ${cityData.name}/${cityData.stateAbbreviation}` } });

      setTimeout(() => {
        setCepMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[index];
          return newMessages;
        });
      }, 3000);
    } catch (error) {
      console.error('❌ [BusinessPartnerForm] Erro ao buscar CEP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar CEP. Tente novamente.';
      setCepMessages({ ...cepMessages, [index]: { type: 'error', text: errorMessage } });
    } finally {
      setLoadingCEP({ ...loadingCEP, [index]: false });
    }
  };

  const tabs = [
    { id: 'basic', label: t('businessPartners.form.tabs.basicData', 'Dados Básicos'), icon: User },
    { id: 'contacts', label: t('businessPartners.form.tabs.contacts', 'Pessoas de Contato'), icon: Users },
    { id: 'addresses', label: t('businessPartners.form.tabs.addresses', 'Endereços'), icon: MapPin },
    { id: 'observations', label: t('businessPartners.form.tabs.observations', 'Observações'), icon: FileText }
  ];

  if (partner) {
    tabs.push({ id: 'interactions', label: 'Registros de Interações', icon: MessageSquare });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {partner ? t('businessPartners.form.editTitle', 'Editar Parceiro') : t('businessPartners.form.title', 'Novo Parceiro')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Data Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('businessPartners.form.name', 'Nome/Razão Social *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('businessPartners.form.documentType', 'Tipo de Documento')}
                    </label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'cpf' | 'cnpj' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cnpj">CNPJ</option>
                      <option value="cpf">CPF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('businessPartners.form.document', 'Cód. CNPJ ou CPF *')}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        required
                        value={formData.document}
                        onChange={(e) => {
                          setFormData({ ...formData, document: e.target.value });
                          setCnpjMessage(null);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={formData.documentType === 'cnpj' ? t('businessPartners.form.documentPlaceholder', '00.000.000/0000-00') : t('businessPartners.form.documentPlaceholderCpf', '000.000.000-00')}
                      />
                      {formData.documentType === 'cnpj' && (
                        <button
                          type="button"
                          onClick={handleConsultarCNPJ}
                          disabled={isLoadingCNPJ || !formData.document || !receitaFederalActive || receitaFederalLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
                          title={!receitaFederalActive ? 'Integração com a Receita Federal não está ativa' : ''}
                        >
                          {isLoadingCNPJ ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              <span>{t('businessPartners.form.searching', 'Consultando...')}</span>
                            </>
                          ) : (
                            <>
                              <Search size={16} />
                              <span>{t('businessPartners.form.searchAction', 'Buscar')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {cnpjMessage && (
                      <div className="mt-2">
                        <InlineMessage
                          type={cnpjMessage.type}
                          message={cnpjMessage.text}
                        />
                      </div>
                    )}
                    {formData.documentType === 'cnpj' && !receitaFederalActive && !receitaFederalLoading && (
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
                      {t('businessPartners.form.partnerType', 'Tipo de Parceiro *')}
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="customer">{t('businessPartners.typeCustomer', 'Cliente')}</option>
                      <option value="supplier">{t('businessPartners.typeSupplier', 'Fornecedor')}</option>
                      <option value="both">{t('businessPartners.typeBoth', 'Ambos')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('businessPartners.form.status', 'Status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">{t('businessPartners.statusActive', 'Ativo')}</option>
                      <option value="inactive">{t('businessPartners.statusInactive', 'Inativo')}</option>
                    </select>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      {t('businessPartners.form.email', 'E-mail Principal')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {t('businessPartners.form.phone', 'Telefone Principal')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('businessPartners.form.website', 'Website')}
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.empresa.com"
                  />
                </div>

                {/* Informações Fiscais e Comerciais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('businessPartners.form.taxRegime', 'Regime Tributário')}
                    </label>
                    <select
                      value={formData.taxRegime}
                      onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simples">{t('businessPartners.form.taxRegimes.simples', 'Simples Nacional')}</option>
                      <option value="presumido">{t('businessPartners.form.taxRegimes.presumido', 'Lucro Presumido')}</option>
                      <option value="real">{t('businessPartners.form.taxRegimes.real', 'Lucro Real')}</option>
                      <option value="mei">{t('businessPartners.form.taxRegimes.mei', 'MEI')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('businessPartners.form.creditLimit', 'Limite de Crédito (R$)')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('businessPartners.form.paymentTerms', 'Prazo de Pagamento (dias)')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('businessPartners.form.tabs.contacts', 'Pessoas de Contato')}</h3>
                  <button
                    type="button"
                    onClick={addContact}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('businessPartners.form.addContact', 'Adicionar Contato')}</span>
                  </button>
                </div>

                {contacts.map((contact, index) => (
                  <div key={contact.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('businessPartners.form.contactItem', 'Contato')} #{index + 1}</h4>
                        {contact.isPrimary && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {t('businessPartners.form.primaryContactLabel', 'Principal')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('businessPartners.form.removeContact', 'Remover contato')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('businessPartners.form.contactName', 'Nome Completo *')}
                        </label>
                        <input
                          type="text"
                          required
                          value={contact.name || ''}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Digite o nome completo"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('businessPartners.form.contactEmail', 'E-mail *')}
                        </label>
                        <input
                          type="email"
                          required
                          value={contact.email || ''}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="email@empresa.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('businessPartners.form.contactPhone', 'Telefone *')}
                        </label>
                        <input
                          type="tel"
                          required
                          value={contact.phone || ''}
                          onChange={(e) => updateContact(index, 'phone', formatPhoneNumber(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('businessPartners.form.contactPosition', 'Cargo')}
                        </label>
                        <input
                          type="text"
                          value={contact.position || ''}
                          onChange={(e) => updateContact(index, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Gerente Comercial"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('businessPartners.form.contactDepartment', 'Departamento')}
                        </label>
                        <input
                          type="text"
                          value={contact.department || ''}
                          onChange={(e) => updateContact(index, 'department', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Comercial, Financeiro"
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contact.isPrimary || false}
                          onChange={(e) => updateContact(index, 'isPrimary', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('businessPartners.form.setAsPrimaryContact', 'Definir como contato principal')}
                        </span>
                      </label>

                      <div className="space-y-2">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contact.receiveWhatsappNotifications ?? false}
                            onChange={(e) => updateContact(index, 'receiveWhatsappNotifications', e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('businessPartners.form.receiveWhatsappNotifications', 'Receber notificações via WhatsApp')}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('businessPartners.form.whatsappNotifyDesc', 'Este contato receberá atualizações sobre pedidos via WhatsApp')}
                            </p>
                          </div>
                        </label>

                        {contact.receiveWhatsappNotifications && (
                          <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyOrderCreated ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyOrderCreated', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Pedido Realizado</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyOrderInvoiced ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyOrderInvoiced', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Pedido Faturado</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyAwaitingPickup ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyAwaitingPickup', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Aguardando Coleta</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyPickedUp ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyPickedUp', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Coletado pela Transportadora</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyInTransit ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyInTransit', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Em Transporte</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyOutForDelivery ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyOutForDelivery', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Saiu para Entrega</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.whatsappNotifyDelivered ?? false}
                                onChange={(e) => updateContact(index, 'whatsappNotifyDelivered', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Entrega Realizada</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contact.receiveEmailNotifications ?? false}
                            onChange={(e) => updateContact(index, 'receiveEmailNotifications', e.target.checked)}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('businessPartners.form.receiveEmailNotifications', 'Receber notificações via E-mail')}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('businessPartners.form.emailNotifyDesc', 'Este contato receberá atualizações sobre pedidos via e-mail')}
                            </p>
                          </div>
                        </label>

                        {contact.receiveEmailNotifications && (
                          <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyOrderCreated ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyOrderCreated', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Pedido Realizado</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyOrderInvoiced ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyOrderInvoiced', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Pedido Faturado</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyAwaitingPickup ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyAwaitingPickup', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Aguardando Coleta</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyPickedUp ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyPickedUp', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Coletado pela Transportadora</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyInTransit ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyInTransit', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Em Transporte</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyOutForDelivery ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyOutForDelivery', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Saiu para Entrega</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.emailNotifyDelivered ?? false}
                                onChange={(e) => updateContact(index, 'emailNotifyDelivered', e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">Entrega Realizada</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {contacts.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">{t('businessPartners.form.noContactsTitle', 'Nenhum contato cadastrado')}</p>
                    <p className="text-sm mt-2">{t('businessPartners.form.noContactsDesc', 'Clique em "Adicionar Contato" para incluir pessoas de contato')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('businessPartners.form.tabs.addresses', 'Endereços')}</h3>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('businessPartners.form.addAddress', 'Adicionar Endereço')}</span>
                  </button>
                </div>

                {addresses.map((address, index) => (
                  <div key={address.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('businessPartners.form.addressItem', 'Endereço')} #{index + 1}</h4>
                        {address.isPrimary && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            {t('businessPartners.form.primaryAddressLabel', 'Principal')}
                          </span>
                        )}
                        <select
                          value={address.type || 'commercial'}
                          onChange={(e) => updateAddress(index, 'type', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="commercial">{t('businessPartners.form.addressTypes.commercial', 'Comercial')}</option>
                          <option value="billing">{t('businessPartners.form.addressTypes.billing', 'Cobrança')}</option>
                          <option value="shipping">{t('businessPartners.form.addressTypes.shipping', 'Expedição')}</option>
                          <option value="delivery">{t('businessPartners.form.addressTypes.delivery', 'Entrega')}</option>
                          <option value="correspondence">{t('businessPartners.form.addressTypes.correspondence', 'Correspondência')}</option>
                          <option value="both">{t('businessPartners.form.addressTypes.both', 'Cobrança e Entrega')}</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('businessPartners.form.removeAddress', 'Remover endereço')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* CEP Field with Search Button */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.cep', 'CEP *')}</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={address.zipCode || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateAddress(index, 'zipCode', value);
                              }}
                              onBlur={(e) => {
                                const cep = e.target.value.replace(/\D/g, '');
                                if (cep.length === 8) {
                                  handleCEPSearch(index, cep);
                                }
                              }}
                              placeholder="00000-000"
                              maxLength={9}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => handleCEPSearch(index, address.zipCode || '')}
                              disabled={loadingCEP[index]}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                              title={t('businessPartners.form.searchLabel', 'Buscar CEP')}
                            >
                              {loadingCEP[index] ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Search className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {cepMessages[index] && (
                            <div className={`mt-2 text-xs ${cepMessages[index].type === 'error' ? 'text-red-600' : 'text-green-600'} flex items-center gap-1`}>
                              <Info className="w-3 h-3" />
                              <span>{cepMessages[index].text}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.street', 'Logradouro *')}</label>
                          <input
                            type="text"
                            required
                            value={address.street || ''}
                            onChange={(e) => updateAddress(index, 'street', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Rua, Avenida, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.number', 'Número *')}</label>
                          <input
                            type="text"
                            required
                            value={address.number || ''}
                            onChange={(e) => updateAddress(index, 'number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nº"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.complement', 'Complemento')}</label>
                          <input
                            type="text"
                            value={address.complement || ''}
                            onChange={(e) => updateAddress(index, 'complement', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Apto, Sala, Bloco"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.neighborhood', 'Bairro *')}</label>
                          <input
                            type="text"
                            required
                            value={address.neighborhood || ''}
                            onChange={(e) => updateAddress(index, 'neighborhood', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nome do bairro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.city', 'Cidade *')}</label>
                          <input
                            type="text"
                            required
                            value={address.city || ''}
                            onChange={(e) => updateAddress(index, 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nome da cidade"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.state', 'Estado *')}</label>
                          <input
                            type="text"
                            required
                            value={address.state || ''}
                            onChange={(e) => updateAddress(index, 'state', e.target.value.toUpperCase())}
                            maxLength={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            placeholder="UF"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessPartners.form.country', 'País')}</label>
                          <input
                            type="text"
                            value={address.country || 'Brasil'}
                            onChange={(e) => updateAddress(index, 'country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="País"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={address.is_primary || false}
                            onChange={(e) => updateAddress(index, 'is_primary', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('businessPartners.form.setAsPrimaryAddress', 'Definir como endereço principal')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {addresses.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">{t('businessPartners.form.noAddressesTitle', 'Nenhum endereço cadastrado')}</p>
                    <p className="text-sm mt-2">{t('businessPartners.form.noAddressesDesc', 'Clique em "Adicionar Endereço" para incluir endereços')}</p>
                  </div>
                )}

                {addresses.length > 0 && addresses[0].street && addresses[0].city && (
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleShowOnMap}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Map className="w-4 h-4" />
                      {t('businessPartners.form.viewOnMap', 'Visualizar no Mapa')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Observations Tab */}
            {activeTab === 'observations' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('businessPartners.form.observationsLabel', 'Observações')}
                  </label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('businessPartners.form.observationsPlaceholder', 'Digite aqui observações importantes sobre este parceiro de negócios...')}
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('businessPartners.form.notesLabel', 'Notas Adicionais')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('businessPartners.form.notesPlaceholder', 'Informações adicionais sobre o parceiro de negócios...')}
                  />
                </div>
              </div>
            )}

            {/* Interactions Tab */}
            {activeTab === 'interactions' && partner && (
              <InteractionLogsTab businessPartnerId={partner.id} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              {t('businessPartners.form.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{t('businessPartners.form.save', 'Salvar')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal do Mapa */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('businessPartners.form.mapTitle', 'Localização no Mapa')}</h3>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="h-96">
              <GoogleMap
                address={`${addresses[0]?.street}, ${addresses[0]?.city}, ${addresses[0]?.state}, Brasil`}
                title={formData.name || 'Parceiro de Negócios'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPartnerForm;