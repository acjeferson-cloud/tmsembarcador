import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculator, MapPin, Package, DollarSign, Award, Search, History, TrendingDown, Users } from 'lucide-react';
import { freightQuoteService, QuoteParams, QuoteResult, FreightQuoteHistory } from '../../services/freightQuoteService';
import { getAllStates, getCitiesByState, fetchCityByIbgeCode } from '../../services/citiesService';
import { businessPartnersService } from '../../services/businessPartnersService';
import { Toast } from '../common/Toast';
import { QuoteResultsTable } from './QuoteResultsTable';
import { QuoteHistoryTable } from './QuoteHistoryTable';
import { useAuth } from '../../hooks/useAuth';
import { establishmentsService, Establishment } from '../../services/establishmentsService';

const FreightQuote: React.FC = () => {
  const { currentEstablishment, user } = useAuth();
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
  const [originCities, setOriginCities] = useState<any[]>([]);
  const [destinationCities, setDestinationCities] = useState<any[]>([]);
  const [businessPartners, setBusinessPartners] = useState<any[]>([]);
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
  }, []);

  useEffect(() => {
    if (states.length > 0 && currentEstablishment) {
      loadEstablishmentOrigin();
    }
  }, [currentEstablishment, states]);

  const loadEstablishmentOrigin = async () => {
    if (!currentEstablishment) return;

    try {
      const establishments = await establishmentsService.getAll();
      let establishment = establishments.find(e => e.codigo === currentEstablishment.codigo);

      if (!establishment) {
        establishment = establishments.find(e =>
          String(e.id) === String(currentEstablishment.id) ||
          e.codigo === (currentEstablishment as any).code
        );
      }

      if (establishment && establishment.estado && establishment.cidade) {
        setOriginMode('cidade');
        setOriginState(establishment.estado);

        // Carregar cidades do estado e encontrar a cidade do estabelecimento
        const cities = await getCitiesByState(establishment.estado);
        setOriginCities(cities);

        const cityData = cities.find(c => c.name === establishment!.cidade);
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
      console.error('❌ Erro ao carregar origem do estabelecimento:', error);
    }
  };

  const loadStates = async () => {
    const data = await getAllStates();
    setStates(data);
  };

  const loadHistory = async () => {
    console.log('📋 Carregando histórico de cotações...');
    const data = await freightQuoteService.getHistory();
    console.log('📋 Histórico carregado:', data?.length || 0, 'registros');
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
      const city = await freightQuoteService.findCityByZipCode(cleanZip);
      if (city) {
        if (type === 'origin') {
          setOriginState(city.state_abbreviation);
          setOriginCity(city.ibge_code);
          setFormData({ ...formData, originCityId: city.ibge_code });
        } else {
          setDestinationState(city.state_abbreviation);
          setDestinationCity(city.ibge_code);
          setFormData({ ...formData, destinationCityId: city.ibge_code });
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destinationCityId) {
      setToast({ message: 'Selecione a cidade de destino', type: 'error' });
      return;
    }

    if (formData.weight <= 0) {
      setToast({ message: 'Peso deve ser maior que zero', type: 'error' });
      return;
    }

    if (formData.cargoValue <= 0) {
      setToast({ message: 'Valor da mercadoria deve ser maior que zero', type: 'error' });
      return;
    }

    if (selectedModals.length === 0) {
      setToast({ message: 'Selecione pelo menos um modal de transporte', type: 'error' });
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
          establishmentId: currentEstablishment?.id,
          selectedModals
        },
        userId,
        userName,
        userEmail
      );

      if (quoteResults.length === 0) {
        setToast({ message: 'Nenhuma transportadora encontrada para o destino informado', type: 'error' });
      } else {
        setResults(quoteResults);
        setToast({ message: `${quoteResults.length} cotações encontradas`, type: 'success' });
        console.log('🔄 Recarregando histórico de cotações...');
        await loadHistory();
        console.log('✅ Histórico recarregado!');
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao calcular cotação', type: 'error' });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cotação de Fretes</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Simule e compare fretes entre transportadoras</p>
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
            Nova Cotação
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
            Histórico
          </button>
        </div>
      </div>

      {activeTab === 'quote' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dados da Cotação</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Origem</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOriginMode('cidade');
                          setFormData({ ...formData, originZipCode: '' });
                        }}
                        className={`px-3 py-1 text-xs rounded ${
                          originMode === 'cidade'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        UF+Cidade
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOriginMode('cep');
                          setOriginState('');
                          setOriginCity('');
                          setFormData({ ...formData, originCityId: undefined });
                        }}
                        className={`px-3 py-1 text-xs rounded ${
                          originMode === 'cep'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        CEP
                      </button>
                    </div>
                  </div>

                  {originMode === 'cidade' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          UF
                        </label>
                        <select
                          value={originState}
                          onChange={(e) => handleStateChange('origin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione...</option>
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      {originState && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cidade
                          </label>
                          <select
                            value={originCity}
                            onChange={(e) => handleCityChange('origin', e.target.value)}
                            disabled={loadingOriginCities}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="">{loadingOriginCities ? 'Carregando...' : 'Selecione...'}</option>
                            {sortedOriginCities.map(city => (
                              <option key={city.ibgeCode} value={city.ibgeCode}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CEP
                        </label>
                        <input
                          type="text"
                          placeholder="00000000"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {originCity && originState && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              UF
                            </label>
                            <input
                              type="text"
                              value={originState}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={originCities.find(c => c.ibgeCode === originCity)?.name || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Destino *</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDestinationMode('cidade');
                          setFormData({ ...formData, destinationZipCode: '' });
                        }}
                        className={`px-3 py-1 text-xs rounded ${
                          destinationMode === 'cidade'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        UF+Cidade
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDestinationMode('cep');
                          setDestinationState('');
                          setDestinationCity('');
                          setFormData({ ...formData, destinationCityId: undefined });
                        }}
                        className={`px-3 py-1 text-xs rounded ${
                          destinationMode === 'cep'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        CEP
                      </button>
                    </div>
                  </div>

                  {destinationMode === 'cidade' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          UF *
                        </label>
                        <select
                          required
                          value={destinationState}
                          onChange={(e) => handleStateChange('destination', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione...</option>
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      {destinationState && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cidade *
                          </label>
                          <select
                            required
                            value={destinationCity}
                            onChange={(e) => handleCityChange('destination', e.target.value)}
                            disabled={loadingDestCities}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="">{loadingDestCities ? 'Carregando...' : 'Selecione...'}</option>
                            {sortedDestinationCities.map(city => (
                              <option key={city.ibgeCode} value={city.ibgeCode}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CEP *
                        </label>
                        <input
                          type="text"
                          placeholder="00000000"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {destinationCity && destinationState && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              UF
                            </label>
                            <input
                              type="text"
                              value={destinationState}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={destinationCities.find(c => c.ibgeCode === destinationCity)?.name || ''}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Parceiro de Negócios
                  </label>
                  <select
                    value={formData.businessPartnerId || ''}
                    onChange={(e) => setFormData({ ...formData, businessPartnerId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {businessPartners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Peso (kg) *
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
                      placeholder="0,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Volumes *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.volumeQty || ''}
                      onChange={(e) => setFormData({ ...formData, volumeQty: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    M³ (Cubagem)
                  </label>
                  <input
                    type="text"
                    value={cubicMetersFormatted}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value, 4);
                      setCubicMetersFormatted(formatted);
                      setFormData({ ...formData, cubicMeters: parseFormattedNumber(formatted) });
                    }}
                    placeholder="0,0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor da Mercadoria *
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
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Modais de Transporte *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('rodoviario')}
                        onChange={() => handleModalToggle('rodoviario')}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">🚛 Rodoviário</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('aereo')}
                        onChange={() => handleModalToggle('aereo')}
                        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">✈️ Aéreo</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('aquaviario')}
                        onChange={() => handleModalToggle('aquaviario')}
                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">🚢 Aquaviário</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedModals.includes('ferroviario')}
                        onChange={() => handleModalToggle('ferroviario')}
                        className="w-4 h-4 text-gray-600 dark:text-gray-400 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">🚂 Ferroviário</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Selecione os modais que deseja considerar na cotação
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span>Calculando...</span>
                  ) : (
                    <span>
                      <Search className="w-4 h-4 inline mr-2" />
                      Cotar Frete
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {results.length > 0 ? (
              <QuoteResultsTable results={results} cargoValue={formData.cargoValue} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma cotação realizada</h3>
                <p className="text-gray-600 dark:text-gray-400">Preencha os dados ao lado e clique em "Cotar Frete"</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <QuoteHistoryTable history={history} onRefresh={loadHistory} />
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
