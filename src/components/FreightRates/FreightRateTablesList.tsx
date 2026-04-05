import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Download, Calendar, DollarSign, Clock, Edit, Trash2, Eye, CheckCircle, XCircle, Copy } from 'lucide-react';
import { freightRatesService, FreightRateTable } from '../../services/freightRatesService';
import { FreightRateTableView } from './FreightRateTableView';
import { FreightRateTableForm } from './FreightRateTableForm';
import { CopyFreightTableModal } from './CopyFreightTableModal';

interface FreightRateTablesListProps {
  carrierId?: string;
  carrierName?: string;
}

export const FreightRateTablesList: React.FC<FreightRateTablesListProps> = ({ carrierId, carrierName }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingTable, setEditingTable] = useState<FreightRateTable | null>(null);
  const [viewingTable, setViewingTable] = useState<FreightRateTable | null>(null);
  const [tables, setTables] = useState<FreightRateTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopyModal, setShowCopyModal] = useState(false);

  useEffect(() => {
    loadTables();
  }, [carrierId]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const data = carrierId
        ? await freightRatesService.getTablesByCarrier(carrierId)
        : await freightRatesService.getAllTables();
      setTables(data);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (table.transportador_nome && table.transportador_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNewTable = () => {
    setEditingTable(null);
    setShowForm(true);
  };

  const handleEditTable = (table: FreightRateTable) => {
    setEditingTable(table);
    setShowForm(true);
  };

  const handleViewTable = (table: FreightRateTable) => {
    setViewingTable(table);
    setShowView(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (window.confirm(t('carriers.freightRates.deleteConfirm'))) {
      try {
        await freightRatesService.deleteTable(tableId);
        alert(t('carriers.freightRates.deleteSuccess'));
        loadTables();
      } catch (error) {

        alert(t('carriers.freightRates.deleteError'));
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
    setShowForm(false);
    setEditingTable(null);
    loadTables();
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('pt-BR');
  };

  const isTableActive = (table: FreightRateTable) => {
    const today = new Date().toISOString().split('T')[0];
    return table.status === 'ativo' && table.data_inicio <= today && table.data_fim >= today;
  };

  if (showForm) {
    return (
      <FreightRateTableForm
        onBack={handleBackToList}
        onSave={handleSaveTable}
        table={editingTable}
        carrierId={carrierId}
        carrierName={carrierName}
      />
    );
  }

  if (showView) {
    return (
      <FreightRateTableView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditTable(viewingTable!);
        }}
        table={viewingTable!}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {carrierId ? `${t('carriers.freightRates.title')} - ${carrierName}` : t('carriers.freightRates.allTables')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.manageTariffs')}</p>
        </div>
        <button 
          onClick={handleNewTable}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>{t('carriers.freightRates.newTable')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('carriers.freightRates.searchPlaceholder')}
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
            <option value="Todos">{t('carriers.freightRates.allStatuses')}</option>
            <option value="ativo">{t('carriers.freightRates.activeText')}</option>
            <option value="inativo">{t('carriers.freightRates.inactiveText')}</option>
          </select>
          
          <button 
            className="border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download size={18} />
            <span>{t('carriers.freightRates.export')}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <span>{t('carriers.freightRates.totalTables', { count: filteredTables.length })}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={14} className="text-green-600" />
              <span>{t('carriers.freightRates.activeCount', { count: tables.filter(t => t.status === 'ativo').length })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle size={14} className="text-gray-600 dark:text-gray-400" />
              <span>{t('carriers.freightRates.inactiveCount', { count: tables.filter(t => t.status === 'inativo').length })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTables.map((table) => (
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
                  title={t('carriers.freightRates.viewAction')}
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                  title={t('carriers.freightRates.copyTable')}
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleEditTable(table)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  title={t('carriers.freightRates.editAction')}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title={t('carriers.freightRates.deleteAction')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                <span>{t('carriers.freightRates.validity', { start: formatDate(table.data_inicio), end: formatDate(table.data_fim) })}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <DollarSign size={14} />
                <span>{t('carriers.freightRates.registeredTariffs', { count: table.tarifas.length })}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                <span>{t('carriers.freightRates.createdAt', { date: formatDate(table.created_at) })}</span>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <div className={`
                  inline-flex items-center px-2 py-1 rounded text-xs font-medium
                  ${table.table_type === 'Entrada'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'}
                `}>
                  {table.table_type === 'Entrada'
                    ? t('carriers.freightRates.inbound')
                    : t('carriers.freightRates.outbound')}
                </div>

                {table.modal && (
                  <div className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${table.modal === 'rodoviario' ? 'bg-purple-100 text-purple-800' :
                      table.modal === 'aereo' ? 'bg-sky-100 text-sky-800' :
                      table.modal === 'aquaviario' ? 'bg-cyan-100 text-cyan-800' :
                      table.modal === 'ferroviario' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {table.modal === 'rodoviario' ? `🚛 ${t('carriers.modals.rodoviario')}` :
                     table.modal === 'aereo' ? `✈️ ${t('carriers.modals.aereo')}` :
                     table.modal === 'aquaviario' ? `🚢 ${t('carriers.modals.aquaviario')}` :
                     table.modal === 'ferroviario' ? `🚂 ${t('carriers.modals.ferroviario')}` :
                     table.modal}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.statusLabel')}</span>
                <span className={`font-semibold ml-1 ${table.status === 'ativo' ? 'text-green-600' : 'text-gray-600'}`}>
                  {table.status === 'ativo' ? t('carriers.freightRates.activeText') : t('carriers.freightRates.inactiveText')}
                </span>
              </div>
              <div className="text-right">
                <div className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${isTableActive(table) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                `}>
                  {isTableActive(table) ? t('carriers.freightRates.current') : t('carriers.freightRates.notCurrent')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <DollarSign size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('carriers.freightRates.notFound')}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {carrierId 
              ? t('carriers.freightRates.noTablesCarrier') 
              : t('carriers.freightRates.noTablesFilter')}
          </p>
          <button 
            onClick={handleNewTable}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>{t('carriers.freightRates.createTable')}</span>
          </button>
        </div>
      )}

      {/* Copy Freight Table Modal */}
      <CopyFreightTableModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onSuccess={loadTables}
      />
    </div>
  );
};