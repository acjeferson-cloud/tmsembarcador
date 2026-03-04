import React from 'react';
import { Clock, User, Building, TrendingUp, TrendingDown } from 'lucide-react';
import { InnovationHistoryEntry } from '../../services/innovationsHistoryService';

interface InnovationsHistoryTableProps {
  history: InnovationHistoryEntry[];
  loading: boolean;
}

export const InnovationsHistoryTable: React.FC<InnovationsHistoryTableProps> = ({ history, loading }) => {
  console.log('🔍 InnovationsHistoryTable renderizando:', { loading, historyCount: history.length, history });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action: 'ativacao' | 'desativacao') => {
    if (action === 'ativacao') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <TrendingUp className="w-3 h-3" />
          Ativação
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <TrendingDown className="w-3 h-3" />
        Desativação
      </span>
    );
  };

  if (loading) {
    console.log('⏳ Loading state...');
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    console.log('📭 Empty state...');
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Nenhum histórico disponível</p>
      </div>
    );
  }

  console.log('✅ Renderizando tabela com', history.length, 'registros');

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data/Hora
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recurso
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ação
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usuário
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Estabelecimento
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
          {history.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:bg-gray-900 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(entry.created_at)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.innovation_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getActionBadge(entry.action)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                  <User className="w-4 h-4 text-gray-400" />
                  {entry.user_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                  <Building className="w-4 h-4 text-gray-400" />
                  {entry.establishment_code}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
