import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Plus, Search, Filter, Download, DollarSign, Calendar, Truck, Edit, Trash2, Eye, CheckCircle, XCircle, Calculator, Copy } from 'lucide-react';
import { FreightRateTable as FreightRateTableType } from '../../services/freightRatesService';
import { freightRatesService } from '../../services/freightRatesService';
import { getAllCities } from '../../data/citiesData';
import { brazilianStates } from '../../data/statesData';
import { FreightRateTableForm } from './FreightRateTableForm';
import { carriersService } from '../../services/carriersService';
import { CopyFreightTableModal } from './CopyFreightTableModal';
import { useActivityLogger } from '../../hooks/useActivityLogger';

export const FreightRates: React.FC = () => {
  useActivityLogger('Cotação de frete', 'Acesso', 'Acessou os relatórios de Cotação de Fretes');

  const breadcrumbItems = [
    { label: 'Cotação de Fretes', current: true }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [carrierFilter, setCarrierFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [viewingTable, setViewingTable] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [carriersList, setCarriersList] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteData, setQuoteData] = useState({
    originType: 'cep',
    destinationType: 'cep',
    originCep: '',
    destinationCep: '',
    originState: '',
    originCity: '',
    destinationState: '',
    destinationCity: '',
    weight: '',
    volume: '',
    value: ''
  });
  const [quoteResult, setQuoteResult] = useState<any>(null);

  // Load tables from Supabase
  useEffect(() => {
    loadTables();
    loadCarriers();
  }, [refreshKey]);

  // Check for tariff parameter in URL
  useEffect(() => {
    const checkUrlParams = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1]);
      const tariffId = params.get('tariff');
      const tableId = params.get('table');

      if (tariffId && tables.length > 0) {
        try {
          const result = await freightRatesService.getFreightRateWithTable(tariffId);
          if (result) {
            handleViewTable(result.table);
            window.history.replaceState(null, '', '#/freight-rates');
          }
        } catch (error) {

        }
      } else if (tableId && tables.length > 0) {
        const table = tables.find(t => t.id === tableId);
        if (table) {
          handleEditTable(table);
          window.history.replaceState(null, '', '#/freight-rates');
        }
      }
    };

    checkUrlParams();
  }, [tables]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await freightRatesService.getAllTables();
      setTables(data);
    } catch (err: any) {



      setError('Erro ao carregar tabelas de frete');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCarriers = async () => {
    try {
      const data = await carriersService.getAllCarriers();
      setCarriersList(data);
    } catch (err: any) {

    }
  };

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Filtrar cidades por estado
  const getFilteredCities = (stateId: string) => {
    return getAllCities().filter(city => city.stateId === stateId);
  };

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.transportador_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || table.status === statusFilter;
    const matchesCarrier = carrierFilter === 'Todos' || table.transportador_id === carrierFilter;
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  const handleNewTable = () => {
    setEditingTable(null);
    setShowForm(true);
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setShowForm(true);
  };

  const handleViewTable = (table: any) => {
    setViewingTable(table);
    setShowView(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tabela de frete?')) {
      try {
        await freightRatesService.deleteFreightRateTable(tableId);
        alert('Tabela de frete excluída com sucesso!');
        forceRefresh();
      } catch (err) {

        alert('Erro ao excluir tabela de frete.');
      }
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setEditingTable(null);
    setViewingTable(null);
  };

  const handleSaveTable = () => {
    alert('Tabela de frete salva com sucesso!');
    setShowForm(false);
    setEditingTable(null);
    forceRefresh();
  };

  const handleQuoteFreight = () => {
    // Simular cálculo de frete baseado nos dados inseridos
    const baseRate = 0.15; // 15% do valor da mercadoria
    const weightRate = 2.5; // R$ 2,50 por kg
    const volumeRate = 150; // R$ 150 por m³
    
    const valueAmount = parseFloat(quoteData.value) || 0;
    const weightAmount = parseFloat(quoteData.weight) || 0;
    const volumeAmount = parseFloat(quoteData.volume) || 0;
    
    const valueBasedRate = valueAmount * baseRate;
    const weightBasedRate = weightAmount * weightRate;
    const volumeBasedRate = volumeAmount * volumeRate;
    
    const totalFreight = Math.max(valueBasedRate, weightBasedRate, volumeBasedRate);
    const icms = totalFreight * 0.12; // 12% ICMS
    const totalWithTaxes = totalFreight + icms;
    
    setQuoteResult({
      freight: totalFreight,
      icms: icms,
      total: totalWithTaxes,
      deliveryTime: '3-5 dias úteis'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isTableActive = (table: any) => {
    const today = new Date().toISOString().split('T')[0];
    return table.status === 'ativo' && table.data_inicio <= today && table.data_fim >= today;
  };

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Transportador', 'Data Início', 'Data Fim', 'Status', 'Criado Em'].join(','),
      ...filteredTables.map(table => [
        table.nome,
        table.transportador_nome || '',
        table.data_inicio,
        table.data_fim,
        table.status,
        table.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tabelas_frete.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showForm) {
    return (
      <FreightRateTableForm
        onBack={handleBackToList}
        onSave={handleSaveTable}
        table={editingTable}
      />
    );
  }

  if (showView) {
    return (
      <FreightRateTableForm
        onBack={handleBackToList}
        onSave={() => {}}
        table={viewingTable}
        readOnly={true}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tabelas de Frete</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie as tabelas de frete e tarifas por transportador</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleNewTable}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Tabela</span>
          </button>
          <button
            onClick={() => setShowQuoteForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Calculator size={20} />
            <span>Cotar Frete</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Tabelas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{tables.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tabelas Ativas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{tables.filter(t => t.status === 'ativo').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tabelas Vigentes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {tables.filter(t => isTableActive(t)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transportadores</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {new Set(tables.map(t => t.transportadorId)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome da tabela ou transportador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Todos">Todos os Transportadores</option>
            {carriersList.map(carrier => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.codigo} - {carrier.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCopyModal(true)}
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Copy size={18} />
            <span>Copiar Tabela</span>
          </button>

          <button
            onClick={handleExport}
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredTables.length} tabelas</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-600" />
              <span>{tables.filter(t => t.status === 'ativo').length} ativas</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle size={14} className="text-gray-600 dark:text-gray-400" />
              <span>{tables.filter(t => t.status === 'inativo').length} inativas</span>
            </div>
          </div>
        </div>
      </div>

      {showQuoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Cotação de Frete</h2>
              <button
                onClick={() => {
                  setShowQuoteForm(false);
                  setQuoteResult(null);
                  setQuoteData({
                    originType: 'cep',
                    destinationType: 'cep',
                    originCep: '',
                    destinationCep: '',
                    originState: '',
                    originCity: '',
                    destinationState: '',
                    destinationCity: '',
                    weight: '',
                    volume: '',
                    value: ''
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origem *
                </label>
                <div className="space-y-2">
                  <select
                    value={quoteData.originType}
                    onChange={(e) => setQuoteData({...quoteData, originType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cep">Por CEP</option>
                    <option value="city">Por UF + Cidade</option>
                  </select>
                  
                  {quoteData.originType === 'cep' ? (
                    <input
                      type="text"
                      placeholder="Digite o CEP de origem"
                      value={quoteData.originCep}
                      onChange={(e) => setQuoteData({...quoteData, originCep: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={quoteData.originState}
                        onChange={(e) => setQuoteData({
                          ...quoteData, 
                          originState: e.target.value,
                          originCity: '' // Reset city when state changes
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione o Estado</option>
                        {brazilianStates.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                      
                      {quoteData.originState && (
                        <select
                          value={quoteData.originCity}
                          onChange={(e) => setQuoteData({...quoteData, originCity: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione a Cidade</option>
                          {getFilteredCities(quoteData.originState).map(city => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destino *
                </label>
                <div className="space-y-2">
                  <select
                    value={quoteData.destinationType}
                    onChange={(e) => setQuoteData({...quoteData, destinationType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cep">Por CEP</option>
                    <option value="city">Por UF + Cidade</option>
                  </select>
                  
                  {quoteData.destinationType === 'cep' ? (
                    <input
                      type="text"
                      placeholder="Digite o CEP de destino"
                      value={quoteData.destinationCep}
                      onChange={(e) => setQuoteData({...quoteData, destinationCep: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={quoteData.destinationState}
                        onChange={(e) => setQuoteData({
                          ...quoteData, 
                          destinationState: e.target.value,
                          destinationCity: '' // Reset city when state changes
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione o Estado</option>
                        {brazilianStates.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                      
                      {quoteData.destinationState && (
                        <select
                          value={quoteData.destinationCity}
                          onChange={(e) => setQuoteData({...quoteData, destinationCity: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione a Cidade</option>
                          {getFilteredCities(quoteData.destinationState).map(city => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={quoteData.weight}
                  onChange={(e) => setQuoteData({...quoteData, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume (m³)
                </label>
                <input
                  type="number"
                  value={quoteData.volume}
                  onChange={(e) => setQuoteData({...quoteData, volume: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Mercadoria (R$)
                </label>
                <input
                  type="number"
                  value={quoteData.value}
                  onChange={(e) => setQuoteData({...quoteData, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-center mb-6 mt-6">
              <button
                onClick={handleQuoteFreight}
                disabled={
                  (quoteData.originType === 'cep' && !quoteData.originCep) ||
                  (quoteData.destinationType === 'cep' && !quoteData.destinationCep) ||
                  (quoteData.originType === 'city' && (!quoteData.originState || !quoteData.originCity)) ||
                  (quoteData.destinationType === 'city' && (!quoteData.destinationState || !quoteData.destinationCity)) ||
                  !quoteData.weight ||
                  !quoteData.volume ||
                  !quoteData.value
                }
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calcular Frete
              </button>
            </div>

            {quoteResult && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Resultado da Cotação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Valor do Frete</div>
                    <div className="text-lg font-semibold text-green-600">
                      R$ {quoteResult.freight.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">ICMS (12%)</div>
                    <div className="text-lg font-semibold text-orange-600">
                      R$ {quoteResult.icms.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total com Impostos</div>
                    <div className="text-xl font-bold text-blue-600">
                      R$ {quoteResult.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Prazo de Entrega</div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {quoteResult.deliveryTime}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            Carregando tabelas de frete...
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8 text-red-600">
            {error}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            Nenhuma tabela de frete encontrada
          </div>
        ) : (
          filteredTables.map((table) => (
            <div key={table.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{table.nome}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{table.transportador_nome}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleViewTable(table)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditTable(table)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>Vigência: {formatDate(table.data_inicio)} a {formatDate(table.data_fim)}</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <DollarSign size={14} />
                  <span>{table.tarifas?.length || 0} tarifas cadastradas</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Truck size={14} />
                  <span>Transportador: {table.transportador_nome}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-semibold ml-1 ${table.status === 'ativo' ? 'text-green-600' : 'text-gray-600'}`}>
                    {table.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${isTableActive(table) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    {isTableActive(table) ? 'Vigente' : 'Fora de Vigência'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre Tabelas de Frete</h3>
        <p className="text-blue-800 mb-4">
          As tabelas de frete permitem definir valores e prazos de entrega para diferentes tipos de aplicação, 
          como cidades, clientes ou produtos específicos. Cada tabela possui um período de vigência e pode 
          conter múltiplas tarifas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Vigência</p>
            <p className="text-blue-700">Controle por período de validade</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Tarifas</p>
            <p className="text-blue-700">Valores e prazos personalizados</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Aplicação</p>
            <p className="text-blue-700">Por cidade, cliente ou produto</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Transportadores</p>
            <p className="text-blue-700">Múltiplas tabelas por transportador</p>
          </div>
        </div>
      </div>

      {/* Copy Freight Table Modal */}
      <CopyFreightTableModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSuccess={forceRefresh}
      />
    </div>
  );
};