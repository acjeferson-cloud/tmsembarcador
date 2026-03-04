import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Search, Filter, Download, History, User, Calendar, File as FileEdit, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ChangeLog as ChangeLogType, fetchLogs, getLogsStats, getFieldLabel, LogFilters } from '../../services/logsService';
import { formatDistanceToNow } from '../../utils/formatters';

export const ChangeLog: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Configurações' },
    { label: 'Log de Modificações', current: true }
  ];

  const [logs, setLogs] = useState<ChangeLogType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, byAction: {}, byEntity: {} });
  const [filters, setFilters] = useState<LogFilters>({
    entityType: undefined,
    actionType: undefined
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [currentPage, filters]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await fetchLogs(currentPage, itemsPerPage, filters);
      setLogs(result.logs);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const statsData = await getLogsStats();
    setStats(statsData);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.user_name.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.field_name?.toLowerCase().includes(search) ||
      log.old_value?.toLowerCase().includes(search) ||
      log.new_value?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return <Plus className="w-4 h-4" />;
      case 'UPDATE':
        return <FileEdit className="w-4 h-4" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'text-green-600 bg-green-100';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-100';
      case 'DELETE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'Criação';
      case 'UPDATE':
        return 'Edição';
      case 'DELETE':
        return 'Exclusão';
      default:
        return actionType;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      establishment: 'Estabelecimento',
      user: 'Usuário',
      city: 'Cidade',
      state: 'Estado',
      country: 'País',
      carrier: 'Transportadora',
      businessPartner: 'Parceiro de Negócio',
      freightRate: 'Tabela de Frete',
      invoice: 'Nota Fiscal',
      cte: 'CT-e',
      order: 'Pedido',
      pickup: 'Coleta',
      reverseLogistics: 'Logística Reversa'
    };
    return labels[entityType] || entityType;
  };

  const handleExport = () => {
    const csvContent = [
      ['Tipo', 'Entidade', 'ID', 'Ação', 'Usuário', 'Campo', 'Valor Anterior', 'Novo Valor', 'Data/Hora'].join(','),
      ...filteredLogs.map(log => [
        getEntityTypeLabel(log.entity_type),
        log.entity_type,
        log.entity_id,
        getActionLabel(log.action_type),
        log.user_name,
        log.field_name ? getFieldLabel(log.field_name) : '',
        log.old_value || '',
        log.new_value || '',
        new Date(log.created_at).toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-modificacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log de Modificações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Histórico detalhado de todas as alterações no sistema</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criações</p>
              <p className="text-2xl font-bold text-green-600">{stats.byAction['CREATE'] || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Edições</p>
              <p className="text-2xl font-bold text-blue-600">{stats.byAction['UPDATE'] || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exclusões</p>
              <p className="text-2xl font-bold text-red-600">{stats.byAction['DELETE'] || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.entityType || ''}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Entidades</option>
            <option value="establishment">Estabelecimentos</option>
            <option value="user">Usuários</option>
            <option value="businessPartner">Parceiros de Negócio</option>
            <option value="carrier">Transportadoras</option>
            <option value="city">Cidades</option>
            <option value="state">Estados</option>
            <option value="country">Países</option>
            <option value="freightRate">Tabelas de Frete</option>
            <option value="invoice">Notas Fiscais</option>
            <option value="cte">CT-es</option>
            <option value="order">Pedidos</option>
            <option value="pickup">Coletas</option>
            <option value="reverseLogistics">Logística Reversa</option>
          </select>

          <select
            value={filters.actionType || ''}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Ações</option>
            <option value="CREATE">Criação</option>
            <option value="UPDATE">Edição</option>
            <option value="DELETE">Exclusão</option>
          </select>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Entidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor Anterior
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Novo Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Carregando logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum log encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                        <span>{getActionLabel(log.action_type)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{getEntityTypeLabel(log.entity_type)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">ID: {log.entity_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {log.field_name ? getFieldLabel(log.field_name) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={log.old_value || ''}>
                        {log.old_value || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={log.new_value || ''}>
                        {log.new_value || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(log.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> de{' '}
                <span className="font-medium">{totalCount}</span> logs
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Sobre o Log de Modificações</h3>
        <p className="text-blue-800 mb-4">
          Este sistema registra automaticamente todas as alterações realizadas no sistema, fornecendo um histórico
          completo e auditável de todas as operações.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Rastreabilidade</p>
            <p className="text-blue-700">Auditoria completa de ações</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Usuário</p>
            <p className="text-blue-700">Identificação de responsável</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Histórico</p>
            <p className="text-blue-700">Valores antes e depois</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="font-semibold text-blue-900">Exportação</p>
            <p className="text-blue-700">Relatórios em CSV</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
