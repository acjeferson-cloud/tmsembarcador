import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { holidaysService, Holiday } from '../../services/holidaysService';
import { supabase } from '../../lib/supabase';
import { TenantContextHelper } from '../../utils/tenantContext';

interface HolidayFormProps {
  holiday: Holiday | null;
  onClose: () => void;
  onSave: () => void;
}

export const HolidayForm: React.FC<HolidayFormProps> = ({ holiday, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'nacional' as 'nacional' | 'estadual' | 'municipal',
    is_recurring: false,
    country_id: '',
    state_id: '',
    city_id: ''
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Busca Paises, e de lá ele re-hidrata Estados e Cidades baseados no holiday ou no default(BR)
    loadCountries();
    
    if (holiday?.id) {
      setFormData({
        name: holiday.name || '',
        date: holiday.date || '',
        type: holiday.type || 'nacional',
        is_recurring: holiday.is_recurring || false,
        country_id: holiday.country_id || '',
        state_id: holiday.state_id || '',
        city_id: holiday.city_id || ''
      });
    } else if (holiday?.type) {
      setFormData(prev => ({ ...prev, type: holiday.type }));
    }
  }, [holiday]);

  // Removido useEffect isolado do loadStates para não sobrescrever o loading com país padrão

  const loadCountries = async () => {
    if (!supabase) return; // Prevent linting error if Supabase client is temporarily undefined
    const { data } = await supabase
      .from('countries')
      .select('id, nome, codigo, sigla_iso2')
      .order('nome');

    if (data && data.length > 0) {
      const dbCountries = data as any[];
      setCountries(dbCountries);

      // Definir Brasil como padrão se não houver country_id listado e sendo cadastro novo
      if (!formData.country_id && (!holiday || !holiday.id)) {
         // Procura pelo Brasil ("BR", "BRA" ou "Brasil")
        const brazil = dbCountries.find(c => c.codigo === 'BR' || c.sigla_iso2 === 'BR' || String(c.nome).toLowerCase() === 'brasil');
        if (brazil && brazil.id) {
          setFormData(prev => ({ ...prev, country_id: brazil.id }));
          await loadStates(brazil.id);
        } else {
           // Fallback seguro caso 'loadCountries' não reconheça BR de primeira
           setStates([]);
        }
      } else if (holiday?.id && holiday.country_id) {
         await loadStates(holiday.country_id);
         if (holiday.state_id) {
           await loadCities(holiday.state_id);
         }
      } else if (formData.country_id) {
         await loadStates(formData.country_id);
         if (formData.state_id) {
           await loadCities(formData.state_id);
         }
      }
    }
  };

  const loadStates = async (countryId?: string) => {
    // Se não tiver countryId, não faça a query de estados
    if (!countryId || !supabase) {
      setStates([]);
      return;
    }

    const { data } = await supabase.from('states').select('id, nome, sigla').eq('country_id', countryId).order('nome');

    if (data) {
      const statesMapped = data.map((s: any) => ({...s, name: s.nome, uf: s.sigla}));
      setStates(statesMapped);
    }
  };

  const loadCities = async (stateId: string) => {
    if (!stateId || !supabase) {
      setCities([]);
      return;
    }

    const { data } = await supabase
      .from('cities')
      .select('id, nome') // 'nome' is the proper key according to DDL instead of 'name'
      .eq('state_id', stateId)
      .order('nome');

    if (data) {
      // Maps 'nome' to 'name' so frontend maps match properly for selects
      const citiesMapped = data.map((c: any) => ({...c, name: c.nome}));
      setCities(citiesMapped);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validações
      if (!formData.name.trim()) {
        setError('Nome do feriado é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!formData.date) {
        setError('Data é obrigatória');
        setIsLoading(false);
        return;
      }

      if (!formData.country_id) {
        setError('País é obrigatório');
        setIsLoading(false);
        return;
      }

      if (formData.type === 'estadual' && !formData.state_id) {
        setError('Estado é obrigatório para feriados estaduais');
        setIsLoading(false);
        return;
      }

      if (formData.type === 'municipal' && !formData.city_id) {
        setError('Cidade é obrigatória para feriados municipais');
        setIsLoading(false);
        return;
      }

      // Preparar dados para salvar
      const tenantContext = await TenantContextHelper.getCurrentContext();
      const dataToSave: any = {
        name: formData.name.trim(),
        date: formData.date,
        type: formData.type,
        is_recurring: formData.is_recurring,
        country_id: formData.country_id,
        organization_id: tenantContext?.organizationId || null,
        environment_id: tenantContext?.environmentId || null
      };

      // Adicionar state_id e city_id conforme o tipo
      if (formData.type === 'estadual' || formData.type === 'municipal') {
        dataToSave.state_id = formData.state_id;
      }

      if (formData.type === 'municipal') {
        dataToSave.city_id = formData.city_id;
      }

      if (holiday?.id) {
        await holidaysService.update(holiday.id, dataToSave);
      } else {
        await holidaysService.create(dataToSave);
      }

      onSave();
    } catch (err) {
      setError('Erro ao salvar feriado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setFormData(prev => ({ ...prev, country_id: countryId, state_id: '', city_id: '' }));
    loadStates(countryId);
    setCities([]);
  };

  const handleStateChange = (stateId: string) => {
    setFormData(prev => ({ ...prev, state_id: stateId, city_id: '' }));
    loadCities(stateId);
  };

  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({ ...prev, type: newType as any }));
    if ((newType === 'estadual' || newType === 'municipal') && formData.country_id && states.length === 0) {
      loadStates(formData.country_id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {holiday?.id ? 'Editar Feriado' : 'Novo Feriado'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Feriado *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Dia da Padroeira"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="nacional">Nacional</option>
              <option value="estadual">Estadual</option>
              <option value="municipal">Municipal</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_recurring" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Feriado recorrente (repete todo ano)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              País *
            </label>
            <select
              value={formData.country_id}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione...</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.nome}
                </option>
              ))}
            </select>
          </div>

          {(formData.type === 'estadual' || formData.type === 'municipal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                value={formData.state_id}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name} - {state.uf}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'municipal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cidade *
              </label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.state_id}
              >
                <option value="">Selecione...</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {!formData.state_id && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecione um estado primeiro</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
