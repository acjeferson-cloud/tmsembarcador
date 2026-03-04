import React, { useState, useEffect } from 'react';
import { Calculator, HelpCircle, BarChart3, MapPin, TrendingUp } from 'lucide-react';
import { getCurrentSessionContext } from '../../lib/sessionContext';
import { isDemoOrganizationSync } from '../../utils/organizationHelpers';

interface SimulationFilters {
  period: string;
  route: string;
  originState: string;
  originCity: string;
  destinationState: string;
  destinationCity: string;
  weightRange: string;
  simulatedCarrier: string;
  simulatedMethod: string;
  maxCostVariation: number;
  maxTimeVariation: number;
  maxSLAVariation: number;
  prioritizedMetric: 'cost' | 'time' | 'sla';
  optimizationType: 'new' | 'existing';
}

const LogisticsSimulator: React.FC = () => {
  const [filters, setFilters] = useState<SimulationFilters>({
    period: 'last60days',
    route: 'all',
    originState: 'all',
    originCity: 'all',
    destinationState: 'all',
    destinationCity: 'all',
    weightRange: 'all',
    simulatedCarrier: 'all',
    simulatedMethod: 'all',
    maxCostVariation: 0,
    maxTimeVariation: 0,
    maxSLAVariation: 0,
    prioritizedMetric: 'time',
    optimizationType: 'new'
  });

  // Dados de demonstração - Mostra apenas para organization de demonstração
  const [optimizationStats, setOptimizationStats] = useState({
    totalOrders: 0,
    optimizedOrders: 0,
    optimizationRate: 0,
    totalMethods: 0,
    optimizedMethods: 0,
    methodOptimizationRate: 0,
    totalRoutes: 0,
    optimizedRoutes: 0,
    routeOptimizationRate: 0
  });

  const [regionData, setRegionData] = useState<Array<{ region: string; percentage: number; orders: number }>>([]);

  // Carregar dados mockados apenas para organization de demonstração
  useEffect(() => {
    const loadDemoData = async () => {
      const context = await getCurrentSessionContext();
      const isDemo = isDemoOrganizationSync(context.organizationId);

      if (isDemo) {
        setOptimizationStats({
          totalOrders: 2093902,
          optimizedOrders: 93961,
          optimizationRate: 4.5,
          totalMethods: 33,
          optimizedMethods: 17,
          methodOptimizationRate: 51.5,
          totalRoutes: 42105,
          optimizedRoutes: 8134,
          routeOptimizationRate: 19.3
        });

        setRegionData([
          { region: 'SUDESTE', percentage: 63.13, orders: 59319 },
          { region: 'SUL', percentage: 19.48, orders: 18301 },
          { region: 'CENTRO-OESTE', percentage: 9.47, orders: 8900 },
          { region: 'NORDESTE', percentage: 7.92, orders: 7441 }
        ]);
      }
    };

    loadDemoData();
  }, []);

  const handleFilterChange = (key: keyof SimulationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            Simulador Logístico
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise comparativa entre transportadoras e simulação de cenários logísticos
          </p>
        </div>
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Period Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Últimos 60 dias
          </label>
          <select
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last30days">Últimos 30 dias</option>
            <option value="last60days">Últimos 60 dias</option>
            <option value="last90days">Últimos 90 dias</option>
          </select>
        </div>

        {/* Route Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rota (cidade)
          </label>
          <select
            value={filters.route}
            onChange={(e) => handleFilterChange('route', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="sp-rj">São Paulo - Rio de Janeiro</option>
            <option value="sp-mg">São Paulo - Minas Gerais</option>
          </select>
        </div>

        {/* Origin State/City */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            UF | Cidade origem
          </label>
          <select
            value={filters.originState}
            onChange={(e) => handleFilterChange('originState', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
          </select>
        </div>

        {/* Destination State/City */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            UF | Cidade destino
          </label>
          <select
            value={filters.destinationState}
            onChange={(e) => handleFilterChange('destinationState', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
          </select>
        </div>

        {/* Weight Range */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Faixa de peso
          </label>
          <select
            value={filters.weightRange}
            onChange={(e) => handleFilterChange('weightRange', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="0-10">0-10 kg</option>
            <option value="10-50">10-50 kg</option>
            <option value="50+">50+ kg</option>
          </select>
        </div>

        {/* Simulated Carrier */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transportadora simulada
          </label>
          <select
            value={filters.simulatedCarrier}
            onChange={(e) => handleFilterChange('simulatedCarrier', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="correios">Correios</option>
            <option value="jadlog">Jadlog</option>
            <option value="total">Total Express</option>
          </select>
        </div>

        {/* Simulated Method */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método simulado
          </label>
          <select
            value={filters.simulatedMethod}
            onChange={(e) => handleFilterChange('simulatedMethod', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="express">Expresso</option>
            <option value="standard">Padrão</option>
            <option value="economic">Econômico</option>
          </select>
        </div>
      </div>

      {/* Variation Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cost Variation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custo (melhor variação até)
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">R$ 0,00</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.maxCostVariation}
                onChange={(e) => handleFilterChange('maxCostVariation', parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-lg appearance-none cursor-pointer"
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                R$ {filters.maxCostVariation.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Time Variation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prazo (melhor variação até)
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">0,00</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="30"
                value={filters.maxTimeVariation}
                onChange={(e) => handleFilterChange('maxTimeVariation', parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-lg appearance-none cursor-pointer"
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                {filters.maxTimeVariation} dias
              </div>
            </div>
          </div>
        </div>

        {/* SLA Variation */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SLA (melhor variação até)
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">0,0</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.maxSLAVariation}
                onChange={(e) => handleFilterChange('maxSLAVariation', parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer"
              />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                {filters.maxSLAVariation}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Optimization Type */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Otimização com tabelas
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('optimizationType', 'new')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                filters.optimizationType === 'new'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Novas
            </button>
            <button
              onClick={() => handleFilterChange('optimizationType', 'existing')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                filters.optimizationType === 'existing'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vigentes
            </button>
          </div>
        </div>

        {/* Prioritized Metric */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Métrica priorizada
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('prioritizedMetric', 'cost')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                filters.prioritizedMetric === 'cost'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custo
            </button>
            <button
              onClick={() => handleFilterChange('prioritizedMetric', 'time')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                filters.prioritizedMetric === 'time'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prazo
            </button>
            <button
              onClick={() => handleFilterChange('prioritizedMetric', 'sla')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                filters.prioritizedMetric === 'sla'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              SLA
            </button>
          </div>
        </div>
      </div>

      {/* General Overview Tab */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button className="px-6 py-4 text-sm font-medium text-green-600 border-b-2 border-green-600 bg-green-50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Otimização geral
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. pedidos</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.totalOrders.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. pedidos otimizados</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.optimizedOrders.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 font-medium">
                {optimizationStats.optimizationRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. métodos</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.totalMethods}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. métodos otimizados</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.optimizedMethods}
              </div>
              <div className="text-sm text-green-600 font-medium">
                {optimizationStats.methodOptimizationRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. rotas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.totalRoutes.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qtd. rotas otimizadas</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {optimizationStats.optimizedRoutes.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 font-medium">
                {optimizationStats.routeOptimizationRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maps and Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Origin Map */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Origem
          </h3>
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Mapa do Brasil - Origem</p>
              <p className="text-sm">Visualização das regiões de origem</p>
            </div>
          </div>
        </div>

        {/* Origin Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Distribuição e qtd. pedidos otimizados por Região | UF | Cidade origem
          </h3>
          <div className="space-y-4">
            {regionData.map((region, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {region.region}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white min-w-[60px]">
                      {region.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px]">
                      {region.orders.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Map */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Destino
          </h3>
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Mapa do Brasil - Destino</p>
              <p className="text-sm">Visualização das regiões de destino</p>
            </div>
          </div>
        </div>

        {/* Destination Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Distribuição e qtd. pedidos otimizados por Região | UF | Cidade destino
          </h3>
          <div className="space-y-4">
            {regionData.map((region, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {region.region}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white min-w-[60px]">
                      {region.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px]">
                      {region.orders.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsSimulator;