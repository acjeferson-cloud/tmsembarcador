import React, { useState } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Truck, MapPin, Package, Calculator as CalcIcon } from 'lucide-react';
import { getAllCities } from '../../data/citiesData';
import { brazilianStates } from '../../data/statesData';
import { cepService } from '../../services/cepService';

interface CalculatorData {
  origem: string;
  destino: string;
  peso: string;
  quantidadeVolumes: string;
  metrosCubicos: string;
  valorMercadoria: string;
  origemCep: string;
  destinoCep: string;
  origemUf: string;
  origemCidade: string;
  destinoUf: string;
  destinoCidade: string;
}

export default function Calculator() {
  const breadcrumbItems = [
    { label: 'Calculadora de Frete', current: true }
  ];

  const [formData, setFormData] = useState<CalculatorData>({
    origem: '',
    destino: '',
    peso: '',
    quantidadeVolumes: '',
    metrosCubicos: '',
    valorMercadoria: '',
    origemCep: '',
    destinoCep: '',
    origemUf: '',
    origemCidade: '',
    destinoUf: '',
    destinoCidade: ''
  });

  const [origemSearchType, setOrigemSearchType] = useState<'cep' | 'cidade'>('cep');
  const [destinoSearchType, setDestinoSearchType] = useState<'cep' | 'cidade'>('cep');
  const [loadingOrigemCep, setLoadingOrigemCep] = useState(false);
  const [loadingDestinoCep, setLoadingDestinoCep] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCepSearch = async (cep: string, type: 'origem' | 'destino') => {
    if (cep.length !== 8) return;
    
    const setLoading = type === 'origem' ? setLoadingOrigemCep : setLoadingDestinoCep;
    setLoading(true);
    
    try {
      const address = await cepService.getAddressByCep(cep);
      if (address) {
        const state = brazilianStates.find(s => s.uf === address.uf);
        const city = getAllCities().find(c => 
          c.name.toLowerCase() === address.city.toLowerCase() && 
          c.state === address.uf
        );
        
        if (type === 'origem') {
          setFormData(prev => ({
            ...prev,
            origemCep: cep,
            origemUf: address.uf,
            origemCidade: address.city,
            origem: `${address.city} - ${address.uf}`
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            destinoCep: cep,
            destinoUf: address.uf,
            destinoCidade: address.city,
            destino: `${address.city} - ${address.uf}`
          }));
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (uf: string, cidade: string, type: 'origem' | 'destino') => {
    const city = getAllCities().find(c => 
      c.name === cidade && c.state === uf
    );
    
    if (type === 'origem') {
      setFormData(prev => ({
        ...prev,
        origemUf: uf,
        origemCidade: cidade,
        origemCep: city?.zipCode || '',
        origem: `${cidade} - ${uf}`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        destinoUf: uf,
        destinoCidade: cidade,
        destinoCep: city?.zipCode || '',
        destino: `${cidade} - ${uf}`
      }));
    }
  };

  const getFilteredCities = (uf: string) => {
    return getAllCities().filter(city => city.state === uf);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de cálculo aqui
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Calculadora de Frete
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Calcule o valor do frete de forma rápida e precisa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="space-y-8">
            {/* Origem e Destino */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                Origem e Destino
              </h2>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Origem
                  </label>
                  
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setOrigemSearchType('cep')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        origemSearchType === 'cep'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Por CEP
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrigemSearchType('cidade')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        origemSearchType === 'cidade'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Por UF + Cidade
                    </button>
                  </div>

                  {origemSearchType === 'cep' ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.origemCep}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          setFormData(prev => ({ ...prev, origemCep: cep }));
                          if (cep.length === 8) {
                            handleCepSearch(cep, 'origem');
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o CEP (somente números)"
                        maxLength={8}
                      />
                      {loadingOrigemCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={formData.origemUf}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, origemUf: e.target.value, origemCidade: '' }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione o Estado</option>
                        {brazilianStates.map(state => (
                          <option key={state.uf} value={state.uf}>
                            {state.name} ({state.uf})
                          </option>
                        ))}
                      </select>
                      
                      {formData.origemUf && (
                        <select
                          value={formData.origemCidade}
                          onChange={(e) => {
                            handleCitySelect(formData.origemUf, e.target.value, 'origem');
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione a Cidade</option>
                          {getFilteredCities(formData.origemUf).map(city => (
                            <option key={`${city.state}-${city.name}`} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
                  {formData.origem && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ {formData.origem} {formData.origemCep && `(CEP: ${formData.origemCep})`}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Destino
                  </label>
                  
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setDestinoSearchType('cep')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        destinoSearchType === 'cep'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Por CEP
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinoSearchType('cidade')}
                      className={`px-3 py-1 text-xs rounded-full ${
                        destinoSearchType === 'cidade'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Por UF + Cidade
                    </button>
                  </div>

                  {destinoSearchType === 'cep' ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.destinoCep}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          setFormData(prev => ({ ...prev, destinoCep: cep }));
                          if (cep.length === 8) {
                            handleCepSearch(cep, 'destino');
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite o CEP (somente números)"
                        maxLength={8}
                      />
                      {loadingDestinoCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={formData.destinoUf}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, destinoUf: e.target.value, destinoCidade: '' }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione o Estado</option>
                        {brazilianStates.map(state => (
                          <option key={state.uf} value={state.uf}>
                            {state.name} ({state.uf})
                          </option>
                        ))}
                      </select>
                      
                      {formData.destinoUf && (
                        <select
                          value={formData.destinoCidade}
                          onChange={(e) => {
                            handleCitySelect(formData.destinoUf, e.target.value, 'destino');
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione a Cidade</option>
                          {getFilteredCities(formData.destinoUf).map(city => (
                            <option key={`${city.state}-${city.name}`} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
                  {formData.destino && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ {formData.destino} {formData.destinoCep && `(CEP: ${formData.destinoCep})`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Dados da Carga */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Package className="w-6 h-6 mr-2 text-blue-600" />
                Dados da Carga
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso (kg)
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="peso"
                      value={formData.peso}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 100"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade de Volumes
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metros Cúbicos (m³)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2.500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da Mercadoria (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 15000.00"
                  />
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resultado da Cotação</h2>
              
              {result !== null ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-2xl font-bold text-blue-600">
                      R$ {result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-sm text-blue-600">Valor estimado do frete</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Origem:</span>
                      <span className="font-medium">{origin || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Destino:</span>
                      <span className="font-medium">{destination || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Peso:</span>
                      <span className="font-medium">{weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Distância:</span>
                      <span className="font-medium">{distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Valor por km:</span>
                      <span className="font-medium">R$ {(result / parseFloat(distance)).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Este é um valor estimado. O valor final pode variar conforme 
                      condições específicas do transporte, tipo de carga e disponibilidade.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalcIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Preencha os dados para calcular a cotação</p>
                </div>
              )}
            </div>

            {/* Information Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Taxa Base</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">R$ 2,50 por quilômetro percorrido</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Taxa por Peso</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">R$ 0,15 por kg por quilômetro</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Precisão</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estimativa com base em médias de mercado</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}