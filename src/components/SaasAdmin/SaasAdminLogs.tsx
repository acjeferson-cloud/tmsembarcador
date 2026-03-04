import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download } from 'lucide-react';
import { saasAdminLogsService, AdminLog } from '../../services/saasAdminLogsService';

export function SaasAdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await saasAdminLogsService.getLogs({ limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = !actionFilter || log.action_type === actionFilter;
    const matchesResource = !resourceFilter || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const actionTypes = [...new Set(logs.map(log => log.action_type))];
  const resourceTypes = [...new Set(logs.map(log => log.resource_type))];

  const actionLabels: Record<string, string> = {
    create: 'Criação',
    update: 'Atualização',
    delete: 'Exclusão',
    view: 'Visualização',
    export: 'Exportação'
  };

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    view: 'bg-gray-100 text-gray-800',
    export: 'bg-purple-100 text-purple-800'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Histórico completo de ações administrativas</p>
          </div>
          <button
            onClick={() => alert('Funcionalidade de exportação em desenvolvimento')}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nos logs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Ações</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {actionLabels[action] || action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os Recursos</option>
              {resourceTypes.map(resource => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 dark:bg-gray-900 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      actionColors[log.action_type] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {actionLabels[log.action_type] || log.action_type}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {log.resource_type}
                    </span>
                  </div>

                  <p className="text-gray-900 dark:text-white font-medium mb-2">{log.description}</p>

                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-medium">Data:</span>{' '}
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                    {log.ip_address && (
                      <p>
                        <span className="font-medium">IP:</span> {log.ip_address}
                      </p>
                    )}
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Ver alterações
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <FileText className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm || actionFilter || resourceFilter
              ? 'Nenhum log encontrado com os filtros aplicados'
              : 'Nenhum log registrado ainda'}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {actionTypes.map(action => {
          const count = logs.filter(log => log.action_type === action).length;
          return (
            <div key={action} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{actionLabels[action] || action}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
