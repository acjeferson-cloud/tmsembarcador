import React, { useState } from 'react';
import { ArrowLeft, Edit, Calendar, DollarSign, Clock, User, MapPin, Package, Info, Plus, Trash2, Eye, Map, Receipt, AlertTriangle, Copy } from 'lucide-react';
import { FreightRateTable, FreightRate, deleteFreightRate, addFreightRate, updateFreightRate } from '../../data/freightRatesData';
import { FreightRateView } from './FreightRateView';
import { FreightRateForm } from './FreightRateForm';
import { FreightRateCitiesModal } from './FreightRateCitiesModal';
import { AdditionalFeesModal } from './AdditionalFeesModal';
import RestrictedItemsModal from './RestrictedItemsModal';
import { freightRatesService } from '../../services/freightRatesService';
import { Toast, ToastType } from '../common/Toast';

interface FreightRateTableViewProps {
  onBack: () => void;
  onEdit: () => void;
  table: FreightRateTable;
}

export const FreightRateTableView: React.FC<FreightRateTableViewProps> = ({ onBack, onEdit, table }) => {
  const [showRateView, setShowRateView] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showRestrictedItemsModal, setShowRestrictedItemsModal] = useState(false);
  const [selectedRate, setSelectedRate] = useState<FreightRate | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rates, setRates] = useState<FreightRate[]>(table.tarifas);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const isTableActive = () => {
    const today = new Date().toISOString().split('T')[0];
    return table.status === 'ativo' && table.dataInicio <= today && table.dataFim >= today;
  };

  const getTipoAplicacaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return 'Por Cidade';
      case 'cliente': return 'Por Cliente';
      case 'produto': return 'Por Produto';
      default: return tipo;
    }
  };

  const getTipoAplicacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'cidade': return <MapPin size={16} className="text-blue-600" />;
      case 'cliente': return <User size={16} className="text-green-600" />;
      case 'produto': return <Package size={16} className="text-purple-600" />;
      default: return <DollarSign size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const handleViewRate = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowRateView(true);
  };

  const handleNewRate = () => {
    setSelectedRate(null);
    setShowRateForm(true);
  };

  const handleEditRate = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowRateForm(true);
  };

  const handleDeleteRate = (rateId: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarifa?')) {
      const success = deleteFreightRate(table.id, rateId);
      if (success) {
        alert('Tarifa excluída com sucesso!');
        setRates(table.tarifas);
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Erro ao excluir tarifa.');
      }
    }
  };

  const handleSaveRate = (rateData: Partial<FreightRate>) => {
    try {
      if (selectedRate) {
        // Update existing rate
        const updated = updateFreightRate(table.id, selectedRate.id, rateData);
        if (updated) {
          alert('Tarifa atualizada com sucesso!');
        } else {
          alert('Erro ao atualizar tarifa.');
          return;
        }
      } else {
        // Add new rate
        const added = addFreightRate(table.id, rateData as Omit<FreightRate, 'id' | 'codigo'>);
        if (added) {
          alert('Tarifa adicionada com sucesso!');
        } else {
          alert('Erro ao adicionar tarifa.');
          return;
        }
      }
      
      setRates(table.tarifas);
      setShowRateForm(false);
      setSelectedRate(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving rate:', error);
      alert('Erro ao salvar tarifa. Tente novamente.');
    }
  };

  const handleBackToTable = () => {
    setShowRateView(false);
    setShowRateForm(false);
    setSelectedRate(null);
  };

  const handleManageCities = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowCitiesModal(true);
  };

  const handleCloseCitiesModal = () => {
    setShowCitiesModal(false);
    setSelectedRate(null);
  };

  const handleManageFees = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowFeesModal(true);
  };

  const handleCloseFeesModal = () => {
    setShowFeesModal(false);
    setSelectedRate(null);
  };

  const handleDuplicateRate = async (rate: FreightRate) => {
    if (window.confirm(`Tem certeza que deseja duplicar a tarifa "${rate.descricao}"?\n\nSerão copiados:\n- Todos os valores e parâmetros\n- Faixas de valores\n- Taxas adicionais\n- Itens restritos\n\nNÃO serão copiadas as cidades vinculadas.`)) {
      try {
        await freightRatesService.duplicateRate(rate.id);
        setToast({ message: 'Tarifa duplicada com sucesso!', type: 'success' });

        const updatedRates = await freightRatesService.getRatesByTable(table.id);
        setRates(updatedRates);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Erro ao duplicar tarifa:', error);
        setToast({ message: 'Erro ao duplicar tarifa. Tente novamente.', type: 'error' });
      }
    }
  };

  if (showRateView && selectedRate) {
    return (
      <FreightRateView
        onBack={handleBackToTable}
        onEdit={() => {
          setShowRateView(false);
          handleEditRate(selectedRate);
        }}
        onDelete={handleDeleteRate}
        rate={selectedRate}
        tableId={table.id}
      />
    );
  }

  if (showRateForm) {
    return (
      <FreightRateForm
        onBack={handleBackToTable}
        onSave={handleSaveRate}
        rate={selectedRate || undefined}
        tableId={table.id}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Tabelas de Frete</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Tabela de Frete</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos da tabela e suas tarifas</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFeesModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Receipt size={20} />
              <span>Taxas Adicionais</span>
            </button>
            <button
              onClick={() => setShowRestrictedItemsModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <AlertTriangle size={20} />
              <span>Itens Restritos</span>
            </button>
            <button
              onClick={handleNewRate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Nova Tarifa</span>
            </button>
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>Editar Tabela</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign size={48} className="text-blue-600" />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{table.nome}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Transportador: {table.transportadorNome}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vigência</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(table.dataInicio)} a {formatDate(table.dataFim)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    table.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {table.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tarifas</p>
                  <p className="font-medium text-gray-900 dark:text-white">{rates.length} tarifas cadastradas</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Situação</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isTableActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isTableActive() ? 'Vigente' : 'Fora de Vigência'}
                  </span>
                </div>
                {table.modal && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Modal de Transporte</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${
                      table.modal === 'rodoviario' ? 'bg-purple-100 text-purple-800' :
                      table.modal === 'aereo' ? 'bg-sky-100 text-sky-800' :
                      table.modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-800' :
                      table.modal === 'ferroviario' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {table.modal === 'rodoviario' ? '🚛 Rodoviário' :
                       table.modal === 'aereo' ? '✈️ Aéreo' :
                       table.modal === 'aquaviario' ? '🚢 Aquaviário' :
                       table.modal === 'ferroviario' ? '🚂 Ferroviário' :
                       table.modal}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rates List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tarifas</h3>
            <button
              onClick={handleNewRate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <Plus size={16} />
              <span>Nova Tarifa</span>
            </button>
          </div>
          
          {rates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prazo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {rate.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {rate.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          {getTipoAplicacaoIcon(rate.tipoAplicacao)}
                          <span>{getTipoAplicacaoLabel(rate.tipoAplicacao)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {rate.prazoEntrega} {rate.prazoEntrega === 1 ? 'dia' : 'dias'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(rate.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleViewRate(rate)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditRate(rate)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateRate(rate)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Duplicar Tarifa"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManageCities(rate)}
                            className="text-green-600 hover:text-green-900"
                            title="Gerenciar Cidades"
                          >
                            <Map size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRate(rate.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhuma tarifa cadastrada nesta tabela</p>
              <button
                type="button"
                onClick={handleNewRate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar Tarifa</span>
              </button>
            </div>
          )}
        </div>

        {/* Rate Types Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo por Tipo de Aplicação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <MapPin size={20} className="text-blue-600" />
                <h4 className="font-medium text-blue-800">Por Cidade</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {rates.filter(t => t.tipoAplicacao === 'cidade').length}
              </p>
              <p className="text-sm text-blue-700">tarifas cadastradas</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <User size={20} className="text-green-600" />
                <h4 className="font-medium text-green-800">Por Cliente</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {rates.filter(t => t.tipoAplicacao === 'cliente').length}
              </p>
              <p className="text-sm text-green-700">tarifas cadastradas</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Package size={20} className="text-purple-600" />
                <h4 className="font-medium text-purple-800">Por Produto</h4>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {rates.filter(t => t.tipoAplicacao === 'produto').length}
              </p>
              <p className="text-sm text-purple-700">tarifas cadastradas</p>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Auditoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Criado por</p>
                  <p className="font-medium text-gray-900 dark:text-white">Usuário #{table.criadoPor}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Data de Criação</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(table.criadoEm)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {table.alteradoPor && (
                <div className="flex items-center space-x-3">
                  <User className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Última alteração por</p>
                    <p className="font-medium text-gray-900 dark:text-white">Usuário #{table.alteradoPor}</p>
                  </div>
                </div>
              )}
              
              {table.alteradoEm && (
                <div className="flex items-center space-x-3">
                  <Calendar className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data da última alteração</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(table.alteradoEm)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info size={24} className="text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre Tarifas</h3>
              <p className="text-blue-800 mb-4">
                As tarifas definem os valores e prazos de entrega para diferentes aplicações. Cada tarifa possui um código 
                único e pode ser aplicada por cidade, cliente ou produto.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Por Cidade</p>
                  <p className="text-blue-700">Baseado na origem e destino</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Por Cliente</p>
                  <p className="text-blue-700">Específico para um cliente</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">Por Produto</p>
                  <p className="text-blue-700">Baseado no tipo de produto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCitiesModal && selectedRate && (
        <FreightRateCitiesModal
          rate={selectedRate}
          tableId={table.id}
          onClose={handleCloseCitiesModal}
          onUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {showFeesModal && (
        <AdditionalFeesModal
          freightRateTableId={table.id}
          freightRateTableName={table.nome}
          onClose={() => setShowFeesModal(false)}
        />
      )}

      {showRestrictedItemsModal && (
        <RestrictedItemsModal
          freightRateTableId={table.id.toString()}
          freightRateTableName={table.nome}
          onClose={() => setShowRestrictedItemsModal(false)}
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