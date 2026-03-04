import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Info } from 'lucide-react';
import { BrazilianCity, cityTypes } from '../../types/cities';
import { createCity, updateCity, fetchCityById as fetchCityByIdFromService } from '../../services/citiesService';
import { supabase } from '../../lib/supabase';

interface CityFormProps {
  onBack: () => void;
  onSave: () => void;
  city?: BrazilianCity;
}

interface State {
  id: string;
  nome: string;
  sigla: string;
  regiao: string;
}

export const CityForm: React.FC<CityFormProps> = ({ onBack, onSave, city }) => {
  const [formData, setFormData] = useState({
    name: city?.name || '',
    ibgeCode: city?.ibgeCode || '',
    stateId: city?.stateId || '',
    stateName: city?.stateName || '',
    stateAbbreviation: city?.stateAbbreviation || '',
    zipCodeStart: city?.zipCodeStart || '',
    zipCodeEnd: city?.zipCodeEnd || '',
    type: city?.type || 'cidade' as const,
    region: city?.region || '',
  });

  const [zipCodeRanges, setZipCodeRanges] = useState(
    city?.zipCodeRanges || [{ start: '', end: '', area: '', neighborhood: '' }]
  );

  const [states, setStates] = useState<State[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // ✅ NOVO: Carregar estados do banco
  useEffect(() => {
    const loadStates = async () => {
      try {
        const { data, error } = await supabase
          .from('states')
          .select('id, nome, sigla, regiao')
          .order('nome', { ascending: true });

        if (error) throw error;
        setStates(data || []);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      }
    };

    loadStates();
  }, []);

  // If editing, load the full city data with ZIP code ranges
  useEffect(() => {
    const loadCityData = async () => {
      if (city?.id) {
        console.log('🏙️ [CITY FORM] Loading city data for ID:', city.id);
        const fullCity = await fetchCityByIdFromService(city.id);

        if (fullCity) {
          console.log('✅ [CITY FORM] City loaded:', fullCity);
          setFormData({
            name: fullCity.name,
            ibgeCode: fullCity.ibgeCode,
            stateId: fullCity.stateId || '',
            stateName: fullCity.stateName,
            stateAbbreviation: fullCity.stateAbbreviation,
            zipCodeStart: fullCity.zipCodeStart,
            zipCodeEnd: fullCity.zipCodeEnd,
            type: fullCity.type,
            region: fullCity.region,
          });

          if (fullCity.zipCodeRanges && fullCity.zipCodeRanges.length > 0) {
            setZipCodeRanges(fullCity.zipCodeRanges);
          }
        }
      }
    };

    loadCityData();
  }, [city]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ NOVO: Handler para mudança de estado
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    const selectedState = states.find(s => s.id === stateId);

    if (selectedState) {
      console.log('📍 [CITY FORM] State selected:', selectedState);
      setFormData(prev => ({
        ...prev,
        stateId: selectedState.id,
        stateName: selectedState.nome,
        stateAbbreviation: selectedState.sigla,
        region: selectedState.regiao
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        stateId: '',
        stateName: '',
        stateAbbreviation: '',
        region: ''
      }));
    }

    // Clear errors
    setErrors(prev => ({
      ...prev,
      stateId: '',
      stateName: '',
      stateAbbreviation: '',
      region: ''
    }));
  };

  const handleZipRangeChange = (index: number, field: string, value: string) => {
    const updatedRanges = [...zipCodeRanges];
    updatedRanges[index] = { ...updatedRanges[index], [field]: value };
    setZipCodeRanges(updatedRanges);
  };

  const addZipRange = () => {
    setZipCodeRanges([...zipCodeRanges, { start: '', end: '', area: '', neighborhood: '' }]);
  };

  const removeZipRange = (index: number) => {
    if (zipCodeRanges.length > 1) {
      setZipCodeRanges(zipCodeRanges.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name) {
      newErrors.name = 'Nome da cidade é obrigatório';
    }

    if (!formData.ibgeCode) {
      newErrors.ibgeCode = 'Código IBGE é obrigatório';
    } else if (!/^\d{7}$/.test(formData.ibgeCode)) {
      newErrors.ibgeCode = 'Código IBGE deve ter 7 dígitos';
    }

    // ✅ CORRIGIDO: Validar stateId ao invés de stateName
    if (!formData.stateId) {
      newErrors.stateId = 'Estado é obrigatório';
    }

    if (!formData.zipCodeStart) {
      newErrors.zipCodeStart = 'CEP Inicial é obrigatório';
    } else if (!/^\d{5}-\d{3}$/.test(formData.zipCodeStart)) {
      newErrors.zipCodeStart = 'CEP deve estar no formato 00000-000';
    }

    if (!formData.zipCodeEnd) {
      newErrors.zipCodeEnd = 'CEP Final é obrigatório';
    } else if (!/^\d{5}-\d{3}$/.test(formData.zipCodeEnd)) {
      newErrors.zipCodeEnd = 'CEP deve estar no formato 00000-000';
    }

    // Validate ZIP code ranges
    const validRanges = zipCodeRanges.filter(range => range.start && range.end);

    if (validRanges.length === 0) {
      newErrors.zipCodeRanges = 'Por favor, adicione pelo menos uma faixa de CEP válida';
    } else {
      for (let i = 0; i < zipCodeRanges.length; i++) {
        const range = zipCodeRanges[i];
        if (range.start && !/^\d{5}-\d{3}$/.test(range.start)) {
          newErrors[`zipRange_${i}_start`] = 'CEP deve estar no formato 00000-000';
        }
        if (range.end && !/^\d{5}-\d{3}$/.test(range.end)) {
          newErrors[`zipRange_${i}_end`] = 'CEP deve estar no formato 00000-000';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate ZIP code ranges
      const validRanges = zipCodeRanges.filter(range => range.start && range.end);

      if (validRanges.length === 0) {
        alert('Por favor, adicione pelo menos uma faixa de CEP válida.');
        setIsSubmitting(false);
        return;
      }

      // ✅ CORRIGIDO: Incluir stateId
      const cityData = {
        name: formData.name,
        ibgeCode: formData.ibgeCode,
        stateId: formData.stateId,
        stateName: formData.stateName,
        stateAbbreviation: formData.stateAbbreviation,
        zipCodeStart: formData.zipCodeStart,
        zipCodeEnd: formData.zipCodeEnd,
        type: formData.type as 'cidade' | 'distrito' | 'povoado',
        region: formData.region,
        zipCodeRanges: validRanges
      };

      console.log('💾 [CITY FORM] Saving city:', cityData);

      if (city?.id) {
        // Update existing city
        const updated = await updateCity(city.id, cityData);
        console.log('✅ [CITY FORM] City updated:', updated);
      } else {
        // Create new city
        const created = await createCity(cityData as any);
        console.log('✅ [CITY FORM] City created:', created);
      }

      onSave();
    } catch (error) {
      console.error('Error saving city:', error);
      alert('Erro ao salvar cidade. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatZipCode = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXX
    if (numeric.length <= 5) {
      return numeric;
    } else {
      return `${numeric.slice(0, 5)}-${numeric.slice(5, 8)}`;
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const formatted = formatZipCode(e.target.value);
    setFormData(prev => ({
      ...prev,
      [fieldName]: formatted
    }));
    
    // Clear error when field is edited
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleZipRangeInputChange = (index: number, field: string, value: string) => {
    if (field === 'start' || field === 'end') {
      value = formatZipCode(value);
      
      // Clear error when field is edited
      if (errors[`zipRange_${index}_${field}`]) {
        setErrors(prev => ({ ...prev, [`zipRange_${index}_${field}`]: '' }));
      }
    }
    handleZipRangeChange(index, field, value);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Cidades</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {city ? 'Editar Cidade' : 'Nova Cidade'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Preencha os dados da localidade com faixas detalhadas de CEP</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Cidade *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="São Paulo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código IBGE *
              </label>
              <input
                type="text"
                name="ibgeCode"
                value={formData.ibgeCode}
                onChange={handleInputChange}
                required
                maxLength={7}
                className={`w-full px-3 py-2 border ${errors.ibgeCode ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="3550308"
              />
              {errors.ibgeCode && (
                <p className="mt-1 text-sm text-red-600">{errors.ibgeCode}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                name="stateId"
                value={formData.stateId}
                onChange={handleStateChange}
                required
                className={`w-full px-3 py-2 border ${errors.stateId ? 'border-red-300' : 'border-gray-300'} dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Selecione o Estado</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.nome} ({state.sigla})
                  </option>
                ))}
              </select>
              {errors.stateId && (
                <p className="mt-1 text-sm text-red-600">{errors.stateId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                UF *
              </label>
              <input
                type="text"
                name="stateAbbreviation"
                value={formData.stateAbbreviation}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 bg-gray-100 dark:bg-gray-600 dark:text-white rounded-lg cursor-not-allowed"
                placeholder="Automático"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Região *
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 bg-gray-100 dark:bg-gray-600 dark:text-white rounded-lg cursor-not-allowed"
                placeholder="Automático"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {cityTypes.filter(type => type !== 'Todos').map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faixa Geral de CEP</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CEP Inicial *
              </label>
              <input
                type="text"
                name="zipCodeStart"
                value={formData.zipCodeStart}
                onChange={(e) => handleZipCodeChange(e, 'zipCodeStart')}
                required
                maxLength={9}
                className={`w-full px-3 py-2 border ${errors.zipCodeStart ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="01000-000"
              />
              {errors.zipCodeStart && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCodeStart}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CEP Final *
              </label>
              <input
                type="text"
                name="zipCodeEnd"
                value={formData.zipCodeEnd}
                onChange={(e) => handleZipCodeChange(e, 'zipCodeEnd')}
                required
                maxLength={9}
                className={`w-full px-3 py-2 border ${errors.zipCodeEnd ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="01999-999"
              />
              {errors.zipCodeEnd && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCodeEnd}</p>
              )}
            </div>
          </div>
        </div>


        {/* Detailed ZIP Code Ranges */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Faixas Detalhadas de CEP</h2>
            <button
              type="button"
              onClick={addZipRange}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Plus size={16} />
              <span>Adicionar Faixa</span>
            </button>
          </div>

          {errors.zipCodeRanges && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.zipCodeRanges}</p>
            </div>
          )}

          <div className="space-y-4">
            {zipCodeRanges.map((range, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Faixa {index + 1}</h3>
                  {zipCodeRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeZipRange(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remover faixa"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CEP Inicial *
                    </label>
                    <input
                      type="text"
                      value={range.start}
                      onChange={(e) => handleZipRangeInputChange(index, 'start', e.target.value)}
                      maxLength={9}
                      className={`w-full px-3 py-2 border ${errors[`zipRange_${index}_start`] ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      placeholder="01000-000"
                    />
                    {errors[`zipRange_${index}_start`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`zipRange_${index}_start`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CEP Final *
                    </label>
                    <input
                      type="text"
                      value={range.end}
                      onChange={(e) => handleZipRangeInputChange(index, 'end', e.target.value)}
                      maxLength={9}
                      className={`w-full px-3 py-2 border ${errors[`zipRange_${index}_end`] ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      placeholder="01999-999"
                    />
                    {errors[`zipRange_${index}_end`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`zipRange_${index}_end`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Área/Região
                    </label>
                    <input
                      type="text"
                      value={range.area || ''}
                      onChange={(e) => handleZipRangeChange(index, 'area', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Centro, Zona Sul..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bairro/Região
                    </label>
                    <input
                      type="text"
                      value={range.neighborhood || ''}
                      onChange={(e) => handleZipRangeChange(index, 'neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Vila Madalena, Copacabana..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dica:</p>
                <p>
                  As faixas detalhadas permitem especificar diferentes áreas e bairros dentro da cidade. 
                  Isso facilita a organização e busca por localidades específicas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </span>
            ) : (
              <span>{city ? 'Atualizar' : 'Salvar'} Cidade</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};