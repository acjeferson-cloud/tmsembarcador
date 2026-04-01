import React, { useState, useEffect } from 'react';
import { Calculator, HelpCircle, BarChart3, AlertCircle, Loader2, Play, MapPin, TrendingUp, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logisticsSimulatorService, SimulationResult } from '../../services/logisticsSimulatorService';
import { carriersService, Carrier } from '../../services/carriersService';
import { businessPartnersService } from '../../services/businessPartnersService';
import { getCitiesByState } from '../../services/citiesService';
import { AutocompleteSelect } from '../common/AutocompleteSelect';

const LogisticsSimulator: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Initialize dates
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [businessPartners, setBusinessPartners] = useState<any[]>([]);

  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [modal, setModal] = useState('all');
  const [businessPartnerId, setBusinessPartnerId] = useState('');
  const [destinationState, setDestinationState] = useState('all');
  const [destinationCity, setDestinationCity] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');

  useEffect(() => {
    if (destinationState && destinationState !== 'all') {
      getCitiesByState(destinationState).then((res: any) => setCities(res));
    } else {
      setCities([]);
    }
  }, [destinationState]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCarriers, fetchedBps] = await Promise.all([
          carriersService.getAll(),
          businessPartnersService.getAll()
        ]);
        setCarriers(fetchedCarriers.filter(c => c.status === 'ativo'));
        setBusinessPartners(fetchedBps.filter((bp: any) => bp.status === 'ativo' || bp.status === 'active' || bp.ativo));
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    loadData();
  }, []);

  const toggleCarrier = (id: string) => {
    setSelectedCarriers(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSimulate = async () => {
    if (selectedCarriers.length < 2) {
      setError(t('logisticsSimulator.errors.minCarriers'));
      return;
    }
    if (!startDate || !endDate) {
      setError(t('logisticsSimulator.errors.selectPeriod'));
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await logisticsSimulatorService.simulateBatch({
        period: 'custom',
        startDate,
        endDate,
        carrierIds: selectedCarriers,
        route: 'all',
        originState: 'all',
        originCity: 'all',
        destinationState,
        destinationCity: destinationCity.trim() !== '' ? destinationCity : 'all',
        weightRange: 'all',
        modal,
        businessPartnerId: businessPartnerId !== '' ? businessPartnerId : undefined,
        minWeight: minWeight !== '' ? Number(minWeight) : undefined,
        maxWeight: maxWeight !== '' ? Number(maxWeight) : undefined,
        minValue: minValue !== '' ? Number(minValue) : undefined,
        maxValue: maxValue !== '' ? Number(maxValue) : undefined
      });

      if (response.success) {
        // Enforce carrier names into result
        const populatedResults = response.results.map((r: any) => {
           if (r.carrierName && r.carrierName !== 'Transportadora') {
             return r;
           }
           const c = carriers.find(c => c.id === (r.originalCarrierId || r.carrierId));
           return { ...r, carrierName: c?.razao_social || c?.fantasia || t('logisticsSimulator.unknownCarrier') };
        });
        setResults(populatedResults);
        setTotalProcessed(response.totalOrdersProcessed);
      } else {
        setError(response.error || t('logisticsSimulator.errors.simulation'));
      }
    } catch (err: any) {
      setError(err.message || t('logisticsSimulator.errors.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const validResults = results.filter(r => r.totalCost > 0);
  const bestOption = validResults.length > 0 ? validResults[0] : null; 
  const worstOption = validResults.length > 0 ? validResults[validResults.length - 1] : null;
  const potentialSavings = bestOption && worstOption ? worstOption.totalCost - bestOption.totalCost : 0;
  const potentialSavingsPct = bestOption && worstOption && worstOption.totalCost > 0 
    ? (potentialSavings / worstOption.totalCost) * 100 
    : 0;

  return (
    <div className="p-8 pb-24 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            {t('logisticsSimulator.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('logisticsSimulator.subtitle')}
          </p>
        </div>
        <button 
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">{t('logisticsSimulator.helpButton')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">{t('logisticsSimulator.attention')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Warning Notice as requested by User */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start">
        <Calculator className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-blue-800">{t('logisticsSimulator.calculation.title')}</h3>
          <p className="text-sm text-blue-700 mt-1">
            {t('logisticsSimulator.calculation.text1')}
            <strong> {t('logisticsSimulator.calculation.text2')}</strong>
          </p>
        </div>
      </div>

      {/* Config Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8 shadow-sm">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <MapPin className="w-5 h-5 text-gray-500" />
          {t('logisticsSimulator.config.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('logisticsSimulator.config.startDate')}</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('logisticsSimulator.config.endDate')}</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('logisticsSimulator.config.selectCarriers')}
            </label>
            <button 
              onClick={() => {
                if (selectedCarriers.length === carriers.length) {
                  setSelectedCarriers([]);
                } else {
                  setSelectedCarriers(carriers.map(c => c.id));
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              {selectedCarriers.length === carriers.length ? t('logisticsSimulator.config.deselectAll') : t('logisticsSimulator.config.selectAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {carriers.map(c => (
              <label key={c.id} className={`flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-blue-50 transition-colors ${selectedCarriers.includes(c.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedCarriers.includes(c.id)}
                  onChange={() => toggleCarrier(c.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 truncate">{c.codigo ? `${c.codigo} - ` : ''}{c.razao_social || c.fantasia}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {t('logisticsSimulator.config.advancedFilters', 'Filtros Avançados (Opcional)')}
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
          
          {showAdvancedFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-100 dark:border-gray-700">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.modal', 'Modalidade')}</label>
                <AutocompleteSelect
                  options={[
                    { value: 'all', label: typeof t === 'function' ? t('logisticsSimulator.filters.allModals', 'Todos os Modais') as string : 'Todos os Modais' },
                    { value: 'Rodoviário', label: 'Rodoviário' },
                    { value: 'Aéreo', label: 'Aéreo' },
                    { value: 'Aquaviário', label: 'Aquaviário' },
                    { value: 'Ferroviário', label: 'Ferroviário' }
                  ]}
                  value={modal}
                  onChange={(val) => setModal(val)}
                  placeholder={typeof t === 'function' ? t('logisticsSimulator.filters.allModals', 'Todos os Modais') as string : 'Todos os Modais'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.businessPartner', 'Parceiro de Negócio (Cliente)')}</label>
                <AutocompleteSelect
                  options={[
                    { value: '', label: typeof t === 'function' ? t('logisticsSimulator.filters.allPartners', 'Todos os Clientes') as string : 'Todos os Clientes' },
                    ...businessPartners.map(bp => ({
                      value: bp.id,
                      label: `${bp.document ? `${bp.document} - ` : ''}${bp.name || bp.razao_social || bp.fantasia || bp.nome || 'Sem Nome'}`
                    }))
                  ]}
                  value={businessPartnerId}
                  onChange={(val) => setBusinessPartnerId(val)}
                  placeholder={typeof t === 'function' ? t('logisticsSimulator.filters.allPartners', 'Todos os Clientes') as string : 'Todos os Clientes'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.destinationState', 'UF Destino')}</label>
                <AutocompleteSelect
                  options={[
                    { value: 'all', label: typeof t === 'function' ? t('logisticsSimulator.filters.allStates', 'Todos os Estados') as string : 'Todos os Estados' },
                    ...['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => ({
                      value: uf,
                      label: uf
                    }))
                  ]}
                  value={destinationState}
                  onChange={(val) => setDestinationState(val)}
                  placeholder={typeof t === 'function' ? t('logisticsSimulator.filters.allStates', 'Todos os Estados') as string : 'Todos os Estados'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.destinationCity', 'Cidade Destino')}</label>
                <AutocompleteSelect
                  options={[
                    { value: '', label: typeof t === 'function' ? t('logisticsSimulator.filters.allCities', 'Todas as Cidades') as string : 'Todas as Cidades' },
                    ...cities.map((city) => ({
                      value: city.name,
                      label: city.name
                    }))
                  ]}
                  value={destinationCity === 'all' ? '' : destinationCity}
                  onChange={(val) => setDestinationCity(val === '' ? 'all' : val)}
                  placeholder={typeof t === 'function' ? t('logisticsSimulator.filters.cityPlaceholder', 'Ex: São Paulo') as string : 'Ex: São Paulo'}
                  disabled={destinationState === 'all'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.minWeight', 'Peso Mín (kg)')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.maxWeight', 'Peso Máx (kg)')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ilimitado"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.minValue', 'Valor Mín (R$)')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('logisticsSimulator.filters.maxValue', 'Valor Máx (R$)')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ilimitado"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSimulate}
            disabled={loading || selectedCarriers.length < 2}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            {loading ? t('logisticsSimulator.run.processing') : t('logisticsSimulator.run.start')}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Results */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
              <BarChart3 className="w-6 h-6 text-green-600" />
              {t('logisticsSimulator.results.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border-l-4 border-green-500 shadow-sm">
              <div className="text-sm text-gray-500 font-medium tracking-wide min-h-[40px]">{t('logisticsSimulator.results.bestOption.title')}</div>
              <div className="text-2xl font-bold text-gray-900 mt-2 truncate">{bestOption?.carrierName}</div>
              <div className="text-sm font-medium text-green-600 mt-1">{t('logisticsSimulator.results.bestOption.totalCost')}{bestOption?.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500 shadow-sm">
              <div className="text-sm text-gray-500 font-medium tracking-wide min-h-[40px]">{t('logisticsSimulator.results.potentialSavings.title')}</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {potentialSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-sm font-medium text-blue-800 mt-1">{potentialSavingsPct.toFixed(1)}{t('logisticsSimulator.results.potentialSavings.marginSaved')}</div>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow-sm">
              <div className="text-sm text-gray-500 font-medium tracking-wide min-h-[40px]">{t('logisticsSimulator.results.efficiency.title')}</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{totalProcessed}</div>
              <div className="text-sm font-medium text-purple-600 mt-1">{t('logisticsSimulator.results.efficiency.description')}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800">
               <TrendingUp className="w-5 h-5 text-gray-500" />
               {t('logisticsSimulator.results.chart.title')}
             </h3>
             <div className="space-y-6">
                {results.map((res) => {
                  // calculate width relative to the worst option (which is max cost)
                  const pct = worstOption?.totalCost ? (res.totalCost / worstOption.totalCost) * 100 : 0;
                  const isBest = validResults.length > 0 && res.carrierId === bestOption?.carrierId;

                  return (
                    <div key={res.carrierId} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-700">{res.carrierName} {isBest && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{t('logisticsSimulator.results.chart.winner')}</span>} {res.totalCost === 0 && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{t('logisticsSimulator.results.chart.noRates')}</span>}</span>
                        <span className="text-gray-900">{res.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
                        <div 
                           className={`h-full rounded-full transition-all duration-1000 ${isBest ? 'bg-green-500' : 'bg-blue-400'}`} 
                           style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t('logisticsSimulator.results.chart.averageCost')}{res.averageCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                <Calculator className="w-6 h-6 text-blue-600" />
                {t('logisticsSimulator.helpModal.title')}
              </h2>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-gray-700 dark:text-gray-300">
              <p className="text-base">
                {t('logisticsSimulator.helpModal.strategy')}
                <strong className="text-blue-700 dark:text-blue-400">{t('logisticsSimulator.helpModal.strategyBold')}</strong>
                {t('logisticsSimulator.helpModal.strategyEnd')}
              </p>
              
              <ol className="space-y-4 list-decimal list-inside marker:text-blue-600 marker:font-bold">
                <li className="pl-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{t('logisticsSimulator.helpModal.step1Title')}</span>
                  {t('logisticsSimulator.helpModal.step1Text')}
                </li>
                <li className="pl-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{t('logisticsSimulator.helpModal.step2Title')}</span>
                  {t('logisticsSimulator.helpModal.step2Text')}
                </li>
                <li className="pl-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{t('logisticsSimulator.helpModal.step3Title')}</span>
                  {t('logisticsSimulator.helpModal.step3Text')}
                </li>
                <li className="pl-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{t('logisticsSimulator.helpModal.step4Title')}</span>
                  {t('logisticsSimulator.helpModal.step4Text')}
                  <strong className="text-green-700 dark:text-green-400">{t('logisticsSimulator.helpModal.step4Bold')}</strong>
                  {t('logisticsSimulator.helpModal.step4End')}
                  <strong className="text-purple-700 dark:text-purple-400">{t('logisticsSimulator.helpModal.step4BoldSavings')}</strong>
                </li>
              </ol>

              <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border border-blue-100 dark:border-blue-800/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  {t('logisticsSimulator.helpModal.exampleTitle')}
                </h4>
                <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                  {t('logisticsSimulator.helpModal.exampleText')}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
              >
                {t('logisticsSimulator.helpModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsSimulator;