import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, MapPin, Package, DollarSign, Search, History, Users, Plus, Trash2, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { freightQuoteService, QuoteParams, QuoteResult, FreightQuoteHistory } from '../../services/freightQuoteService';
import { getAllStates, getCitiesByState } from '../../services/citiesService';
import { businessPartnersService, BusinessPartner } from '../../services/businessPartnersService';
import { Toast } from '../common/Toast';
import { QuoteResultsTable } from './QuoteResultsTable';
import { QuoteHistoryTable } from './QuoteHistoryTable';
import { useAuth } from '../../hooks/useAuth';
import { establishmentsService } from '../../services/establishmentsService';
import { useTranslation } from 'react-i18next';
import { BrazilianCity } from '../../types/cities';
import { cepService } from '../../services/cepService';
import { catalogItemsService, CatalogItem } from '../../services/catalogItemsService';
import { AutocompleteSelect } from '../common/AutocompleteSelect';
import { FreightRateValuesForm } from '../FreightRates/FreightRateValuesForm';
import { freightRatesService } from '../../services/freightRatesService';

const FreightQuote: React.FC = () => {
  const { currentEstablishment, user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'quote' | 'history'>('quote');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<QuoteParams>({
    originZipCode: '',
    destinationZipCode: '',
    weight: 0,
    volumeQty: 1,
    cubicMeters: 0,
    cargoValue: 0
  });

  const [results, setResults] = useState<QuoteResult[]>([]);
  const [history, setHistory] = useState<FreightQuoteHistory[]>([]);
  const [originCities, setOriginCities] = useState<BrazilianCity[]>([]);
  const [destinationCities, setDestinationCities] = useState<BrazilianCity[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [originState, setOriginState] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [originMode, setOriginMode] = useState<'cep' | 'cidade'>('cidade');
  const [destinationMode, setDestinationMode] = useState<'cep' | 'cidade'>('cidade');
  const [weightFormatted, setWeightFormatted] = useState('');
  const [cubicMetersFormatted, setCubicMetersFormatted] = useState('');
  const [cargoValueFormatted, setCargoValueFormatted] = useState('');
  const [selectedModals, setSelectedModals] = useState<string[]>(['rodoviario', 'aereo', 'aquaviario', 'ferroviario']);
  const [loadingOriginCities, setLoadingOriginCities] = useState(false);
  const [loadingDestCities, setLoadingDestCities] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);

  // Quote Items States
  const [showItemsConfig, setShowItemsConfig] = useState(false);
  const [quoteItems, setQuoteItems] = useState<{itemCode?: string, eanCode?: string, ncmCode?: string, description?: string}[]>([]);
  const [availableCatalogItems, setAvailableCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');

  const formatZipCode = (value: string): string => {
    const digits = value.replace(/\D/g, '').substring(0, 8);
    return digits;
  };

  const formatNumber = (value: string, decimals: number = 2): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '';

    const numValue = parseFloat(cleanValue) / Math.pow(10, decimals);
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const parseFormattedNumber = (value: string): number => {
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  useEffect(() => {
    loadStates();
    loadHistory();
    loadBusinessPartners();
    loadCatalogItems();
  }, []);

  const loadCatalogItems = async () => {
    try {
      const response = await catalogItemsService.getItems('', 1, 9999);
      if (response && response.data) setAvailableCatalogItems(response.data);
    } catch (e) {
      // Ignora erro sileciosamente na UI
    }
  };

  useEffect(() => {
    if (states.length > 0 && currentEstablishment) {
      loadEstablishmentOrigin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEstablishment, states]);

  const loadEstablishmentOrigin = async () => {
    if (!currentEstablishment) return;

    try {
      const establishments = await establishmentsService.getAll();
      let establishment = establishments.find(e => e.codigo === currentEstablishment.codigo);

      if (!establishment) {
        establishment = establishments.find(e =>
          String(e.id) === String(currentEstablishment.id) ||
          e.codigo === (currentEstablishment as unknown as Record<string, unknown>).code
        );
      }

      if (establishment && establishment.estado && establishment.cidade) {
        setOriginMode('cidade');
        setOriginState(establishment.estado);

        // Carregar cidades do estado e encontrar a cidade do estabelecimento
        const cities = await getCitiesByState(establishment.estado);
        setOriginCities(cities);

        const cityData = cities.find((c: BrazilianCity) => c.name === establishment!.cidade);
        if (cityData) {
          setOriginCity(cityData.ibgeCode);
          setFormData(prev => ({
            ...prev,
            originCityId: cityData.ibgeCode,
            originZipCode: ''
          }));
        }
      }
    } catch (error) {
      // Falha ao carregar origem do estabelecimento
    }
  };

  const loadStates = async () => {
    const data = await getAllStates();
    setStates(data);
  };

  const loadHistory = async () => {
    const data = await freightQuoteService.getHistory();
    setHistory(data);
  };

  const loadBusinessPartners = async () => {
    const data = await businessPartnersService.getAll();
    setBusinessPartners(data || []);
  };

  const handleStateChange = async (type: 'origin' | 'destination', state: string) => {
    if (type === 'origin') {
      setOriginState(state);
      setOriginCity('');
      if (state) {
        setLoadingOriginCities(true);
        const cities = await getCitiesByState(state);
        setOriginCities(cities);
        setLoadingOriginCities(false);
      } else {
        setOriginCities([]);
      }
    } else {
      setDestinationState(state);
      setDestinationCity('');
      if (state) {
        setLoadingDestCities(true);
        const cities = await getCitiesByState(state);
        setDestinationCities(cities);
        setLoadingDestCities(false);
      } else {
        setDestinationCities([]);
      }
    }
  };

  const handleCityChange = (type: 'origin' | 'destination', cityId: string) => {
    if (type === 'origin') {
      setOriginCity(cityId);
      setFormData({ ...formData, originCityId: cityId });
    } else {
      setDestinationCity(cityId);
      setFormData({ ...formData, destinationCityId: cityId });
    }
  };

  const handleZipCodeSearch = async (type: 'origin' | 'destination', zipCode: string) => {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length === 8) {
      try {
        let stateAbbr = '';
        let ibgeCode = '';
        
        // Tentar banco de dados primeiro
        const city = await freightQuoteService.findCityByZipCode(cleanZip);
        if (city && city.state_abbreviation && city.ibge_code) {
          stateAbbr = city.state_abbreviation;
          ibgeCode = city.ibge_code;
        } else {
          // Fallback para ViaCEP
          const cepData = await cepService.searchByCEP(cleanZip);
          if (cepData && cepData.uf && cepData.ibge) {
            stateAbbr = cepData.uf;
            ibgeCode = cepData.ibge;
          }
        }

        if (stateAbbr && ibgeCode) {
          if (type === 'origin') {
            setOriginState(stateAbbr);
            setOriginCity(ibgeCode);
            setFormData(prev => ({ ...prev, originCityId: ibgeCode }));
            
            // Carregar dados das cidades do estado para preencher o input (Cidade Automático)
            setLoadingOriginCities(true);
            const cities = await getCitiesByState(stateAbbr);
            setOriginCities(cities);
            setLoadingOriginCities(false);
          } else {
            setDestinationState(stateAbbr);
            setDestinationCity(ibgeCode);
            setFormData(prev => ({ ...prev, destinationCityId: ibgeCode }));
            
            // Carregar dados das cidades do estado para preencher o input (Cidade Automático)
            setLoadingDestCities(true);
            const cities = await getCitiesByState(stateAbbr);
            setDestinationCities(cities);
            setLoadingDestCities(false);
          }
        }
      } catch (error) {
        // Erro silencioso
      }
    }
  };

  const handleModalToggle = (modal: string) => {
    setSelectedModals(prev => {
      if (prev.includes(modal)) {
        return prev.filter(m => m !== modal);
      } else {
        return [...prev, modal];
      }
    });
  };

  const handleAddQuoteItem = () => {
    if (!selectedCatalogItemId) {
      setToast({ message: 'Selecione um item do catálogo para adicioná-lo', type: 'error' });
      return;
    }
    
    // Check if the item is already added
    const catalogItem = availableCatalogItems.find(i => i.id === selectedCatalogItemId);
    if (!catalogItem) return;

    const isAlreadyAdded = quoteItems.some(i => i.itemCode === catalogItem.item_code);
    if (isAlreadyAdded) {
      setToast({ message: 'Iten já inserido na cotação!', type: 'error' });
      return;
    }

    const builtItem = {
      itemCode: catalogItem.item_code || '',
      eanCode: catalogItem.ean_code || '',
      ncmCode: catalogItem.ncm_code || '',
      description: catalogItem.item_description || ''
    };
    
    setQuoteItems(prev => [...prev, builtItem]);
    setSelectedCatalogItemId('');
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.originCityId) {
      setToast({ message: 'Selecione a cidade de origem', type: 'error' });
      return;
    }

    if (!formData.destinationCityId) {
      setToast({ message: t('freightQuote.messages.selectDestination'), type: 'error' });
      return;
    }

    if (formData.weight <= 0) {
      setToast({ message: t('freightQuote.messages.weightGreaterThanZero'), type: 'error' });
      return;
    }

    if (formData.cargoValue <= 0) {
      setToast({ message: t('freightQuote.messages.valueGreaterThanZero'), type: 'error' });
      return;
    }

    if (selectedModals.length === 0) {
      setToast({ message: t('freightQuote.messages.selectAtLeastOneModal'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const userId = user?.supabaseUser?.id;
      const userName = user?.name;
      const userEmail = user?.email;

      const quoteResults = await freightQuoteService.calculateQuote(
        {
          ...formData,
          establishmentId: currentEstablishment?.id?.toString(),
          selectedModals,
          items: quoteItems.length > 0 ? quoteItems : undefined
        },
        userId,
        userName,
        userEmail
      );

      if (quoteResults.length === 0) {
        setToast({ message: t('freightQuote.messages.noCarriersFound'), type: 'error' });
      } else {
        setResults(quoteResults);
        setToast({ message: t('freightQuote.messages.quotesFound', { count: quoteResults.length }), type: 'success' });
        await loadHistory();
      }
    } catch (error) {
      setToast({ message: (error as Error).message || t('freightQuote.messages.errorCalculating'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Usar useMemo para evitar re-cálculos desnecessários
  const sortedOriginCities = useMemo(() =>
    originCities.sort((a, b) => a.name.localeCompare(b.name)),
    [originCities]
  );

  const sortedDestinationCities = useMemo(() =>
    destinationCities.sort((a, b) => a.name.localeCompare(b.name)),
    [destinationCities]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('freightQuote.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('freightQuote.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('quote')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'quote'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            {t('freightQuote.tabs.newQuote')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            {t('freightQuote.tabs.history')}
          </button>
        </div>
      </div>

      {activeTab === 'quote' ? (
        <div className="space-y-6">
          {/* Filtros no Topo 100% */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('freightQuote.form.title')}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Box de Origem e Destino Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Origem */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      {t('freightQuote.form.origin')}
                    </h3>
                    <div className="flex bg-white dark:bg-gray-800 rounded-md p-1 border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setOriginMode('cidade');
                          setFormData({ ...formData, originZipCode: '' });
                        }}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          originMode === 'cidade'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t('freightQuote.form.modeCity')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOriginMode('cep');
                          setOriginState('');
                          setOriginCity('');
                          setFormData({ ...formData, originCityId: undefined });
                        }}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          originMode === 'cep'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t('freightQuote.form.modeCep')}
                      </button>
                    </div>
                  </div>

                  {originMode === 'cidade' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.stateLabel')}</label>
                        <select
                          value={originState}
                          onChange={(e) => handleStateChange('origin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{t('freightQuote.form.select')}</option>
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className={!originState ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.cityLabel')}</label>
                        <select
                          value={originCity}
                          onChange={(e) => handleCityChange('origin', e.target.value)}
                          disabled={loadingOriginCities || !originState}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{loadingOriginCities ? t('freightQuote.form.loading') : t('freightQuote.form.selectCity')}</option>
                          {sortedOriginCities.map(city => (
                            <option key={city.ibgeCode} value={city.ibgeCode}>{city.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.cepLabel')}</label>
                        <input
                          type="text"
                          placeholder={t('freightQuote.form.cepPlaceholder')}
                          value={formData.originZipCode}
                          onInput={(e) => {
                            const input = e.currentTarget;
                            const formatted = formatZipCode(input.value);
                            input.value = formatted;
                            setFormData({ ...formData, originZipCode: formatted });
                            if (formatted.length === 8) {
                              handleZipCodeSearch('origin', formatted);
                            }
                          }}
                          maxLength={8}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      {originCity && originState && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('freightQuote.form.stateAuto')}</label>
                            <input
                              type="text"
                              value={originState}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('freightQuote.form.cityAuto')}</label>
                            <input
                              type="text"
                              value={originCities.find(c => c.ibgeCode === originCity)?.name || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Destino */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-red-500" />
                      {t('freightQuote.form.destination')} <span className="text-red-500 ml-1">*</span>
                    </h3>
                    <div className="flex bg-white dark:bg-gray-800 rounded-md p-1 border border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setDestinationMode('cidade');
                          setFormData({ ...formData, destinationZipCode: '' });
                        }}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          destinationMode === 'cidade'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t('freightQuote.form.modeCity')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDestinationMode('cep');
                          setDestinationState('');
                          setDestinationCity('');
                          setFormData({ ...formData, destinationCityId: undefined });
                        }}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          destinationMode === 'cep'
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t('freightQuote.form.modeCep')}
                      </button>
                    </div>
                  </div>

                  {destinationMode === 'cidade' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.stateLabelReq')}</label>
                        <select
                          required
                          value={destinationState}
                          onChange={(e) => handleStateChange('destination', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{t('freightQuote.form.select')}</option>
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className={!destinationState ? 'opacity-50 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.cityLabelReq')}</label>
                        <select
                          required
                          value={destinationCity}
                          onChange={(e) => handleCityChange('destination', e.target.value)}
                          disabled={loadingDestCities || !destinationState}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">{loadingDestCities ? t('freightQuote.form.loading') : t('freightQuote.form.selectCity')}</option>
                          {sortedDestinationCities.map(city => (
                            <option key={city.ibgeCode} value={city.ibgeCode}>{city.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('freightQuote.form.cepLabelReq')}</label>
                        <input
                          type="text"
                          placeholder={t('freightQuote.form.cepPlaceholder')}
                          required
                          value={formData.destinationZipCode}
                          onInput={(e) => {
                            const input = e.currentTarget;
                            const formatted = formatZipCode(input.value);
                            input.value = formatted;
                            setFormData({ ...formData, destinationZipCode: formatted });
                            if (formatted.length === 8) {
                              handleZipCodeSearch('destination', formatted);
                            }
                          }}
                          maxLength={8}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      {destinationCity && destinationState && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('freightQuote.form.stateAuto')}</label>
                            <input
                              type="text"
                              value={destinationState}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('freightQuote.form.cityAuto')}</label>
                            <input
                              type="text"
                              value={destinationCities.find(c => c.ibgeCode === destinationCity)?.name || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Parametros da Carga em Grid Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* Parceiro */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 whitespace-nowrap">
                    <Users className="w-4 h-4 inline mr-1 text-gray-500" />
                    {t('freightQuote.form.partner')}
                  </label>
                  <select
                    value={formData.businessPartnerId || ''}
                    onChange={(e) => setFormData({ ...formData, businessPartnerId: e.target.value || undefined })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{t('freightQuote.form.partnerOptional')}</option>
                    {businessPartners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor NF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 whitespace-nowrap">
                    <DollarSign className="w-4 h-4 inline mr-1 text-green-500" />
                    {t('freightQuote.form.cargoValue')}
                  </label>
                  <input
                    type="text"
                    required
                    value={cargoValueFormatted}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value, 2);
                      setCargoValueFormatted(formatted);
                      setFormData({ ...formData, cargoValue: parseFormattedNumber(formatted) });
                    }}
                    placeholder={t('freightQuote.form.cargoValuePlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Peso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('freightQuote.form.weight')}
                  </label>
                  <input
                    type="text"
                    required
                    value={weightFormatted}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value, 3);
                      setWeightFormatted(formatted);
                      setFormData({ ...formData, weight: parseFormattedNumber(formatted) });
                    }}
                    placeholder={t('freightQuote.form.weightPlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Volumes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('freightQuote.form.volumes')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.volumeQty || ''}
                    onChange={(e) => setFormData({ ...formData, volumeQty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* M3 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('freightQuote.form.cubicMeters')}
                  </label>
                  <input
                    type="text"
                    value={cubicMetersFormatted}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value, 4);
                      setCubicMetersFormatted(formatted);
                      setFormData({ ...formData, cubicMeters: parseFormattedNumber(formatted) });
                    }}
                    placeholder={t('freightQuote.form.cubicMetersPlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

              </div>

              {/* Seção de Itens da Cotação (Accordion) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mt-6">
                <button
                  type="button"
                  onClick={() => setShowItemsConfig(!showItemsConfig)}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 px-5 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                >
                  <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                    <Tag className="w-5 h-5 mr-2 text-indigo-500" />
                    Composição da Carga / Restrições (Opcional)
                    {quoteItems.length > 0 && (
                      <span className="ml-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                        {quoteItems.length} {quoteItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>
                  {showItemsConfig ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>

                {showItemsConfig && (
                  <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Adicione itens do catálogo para que o motor de cálculo desconsidere transportadoras que possuam restrições a eles.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Selecione o Item do Catálogo</label>
                        <AutocompleteSelect
                          options={availableCatalogItems.map(item => ({
                            value: item.id || '',
                            label: `[${item.item_code}] ${item.item_description} ${item.ncm_code ? `(NCM: ${item.ncm_code})` : ''}`
                          }))}
                          value={selectedCatalogItemId || ''}
                          onChange={val => setSelectedCatalogItemId(val)}
                          placeholder="Digite para buscar as restrições..."
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddQuoteItem}
                          disabled={!selectedCatalogItemId}
                          className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/60 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {quoteItems.length > 0 && (
                      <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-2">Item</th>
                              <th className="px-4 py-2">EAN / NCM</th>
                              <th className="px-4 py-2 w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {quoteItems.map((item, idx) => (
                              <tr key={idx} className="bg-white dark:bg-gray-900">
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                  <div className="font-medium text-indigo-600 dark:text-indigo-400">{item.itemCode || '-'}</div>
                                  <div className="text-gray-500 text-xs">{item.description}</div>
                                </td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-300 text-xs">
                                  <div><strong className="text-gray-500">EAN:</strong> {item.eanCode || '-'}</div>
                                  <div><strong className="text-gray-500">NCM:</strong> {item.ncmCode || '-'}</div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuoteItem(idx)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão e Modais no Bottom do form */}
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                
                <div className="w-full lg:w-auto">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('freightQuote.form.modalsConsidered')}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${selectedModals.includes('rodoviario') ? 'border-purple-500 bg-purple-50/30' : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('rodoviario')}
                        onChange={() => handleModalToggle('rodoviario')}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('freightQuote.modals.road')}</span>
                    </label>
                    <label className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${selectedModals.includes('aereo') ? 'border-sky-500 bg-sky-50/30' : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('aereo')}
                        onChange={() => handleModalToggle('aereo')}
                        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('freightQuote.modals.air')}</span>
                    </label>
                    <label className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${selectedModals.includes('aquaviario') ? 'border-cyan-500 bg-cyan-50/30' : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('aquaviario')}
                        onChange={() => handleModalToggle('aquaviario')}
                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('freightQuote.modals.sea')}</span>
                    </label>
                    <label className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all ${selectedModals.includes('ferroviario') ? 'border-gray-500 bg-gray-50/30 dark:bg-gray-800' : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('ferroviario')}
                        onChange={() => handleModalToggle('ferroviario')}
                        className="w-4 h-4 text-gray-600 dark:text-gray-400 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('freightQuote.modals.rail')}</span>
                    </label>
                  </div>
                </div>

                <div className="w-full lg:w-auto mt-2 lg:mt-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full lg:w-auto px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center whitespace-nowrap"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        {t('freightQuote.form.calculating')}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Search className="w-5 h-5 mr-2" />
                        {t('freightQuote.form.calculateBtn')}
                      </span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Resultados 100% */}
          <div className="w-full">
            {results.length > 0 ? (
              <QuoteResultsTable 
                results={results} 
                cargoValue={formData.cargoValue} 
                onOpenRate={(rate) => setEditingRate(rate)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('freightQuote.emptyState.readyToQuote')}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {t('freightQuote.emptyState.description')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <QuoteHistoryTable history={history} onRefresh={loadHistory} />
      )}

      {editingRate && (
        <FreightRateValuesForm
          rate={editingRate}
          onSave={async (updatedRate) => {
            try {
              await freightRatesService.updateRate(updatedRate.id!, updatedRate);
              setToast({ message: t('carriers.freightRates.form.saveSuccess', 'Valores atualizados com sucesso!'), type: 'success' });
              setEditingRate(null);
              // Rerun calculation to fetch the newly saved prices
              handleSubmit({ preventDefault: () => {} } as React.FormEvent);
            } catch (err: any) {
              setToast({ message: t('carriers.freightRates.form.saveError', 'Erro ao salvar: ') + err.message, type: 'error' });
            }
          }}
          onCancel={() => setEditingRate(null)}
        />
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

export default FreightQuote;
