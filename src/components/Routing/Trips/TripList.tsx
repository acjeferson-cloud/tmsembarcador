import React from 'react';
import { Eye, Truck, User, Calendar, MapPin, Package } from 'lucide-react';
import { Trip } from '../../../services/tripsService';

interface TripListProps {
  trips: Trip[];
  isLoading: boolean;
  onViewDetails: (trip: Trip) => void;
}

export const TripList: React.FC<TripListProps> = ({ trips, isLoading, onViewDetails }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">Rascunho</span>;
      case 'agendada':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Agendada</span>;
      case 'em_rota':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Em Rota</span>;
      case 'concluida':
        return <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">Concluída</span>;
      case 'cancelada':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">Cancelada</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-2"></div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Nenhum romaneio encontrado</h3>
        <p className="text-gray-500 dark:text-gray-400">Você ainda não gerou nenhuma viagem na Central de Roteirização.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 font-medium">Romaneio</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Veículo / Placa</th>
              <th className="px-6 py-4 font-medium">Motorista</th>
              <th className="px-6 py-4 font-medium text-center">Entregas</th>
              <th className="px-6 py-4 font-medium">Criado em</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{trip.numero_romaneio}</div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(trip.status)}
                </td>
                <td className="px-6 py-4">
                  {trip.vehicle ? (
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{trip.vehicle.placa}</div>
                        <div className="text-xs text-gray-500">{trip.vehicle.tipo}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Não alocado</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {trip.driver ? (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{trip.driver.nome}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Não alocado</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-full text-sm">
                    {trip.stops?.length || 0}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={14} />
                    {formatDate(trip.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetails(trip)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex items-center gap-2 font-medium text-sm"
                  >
                    <Eye size={18} />
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
