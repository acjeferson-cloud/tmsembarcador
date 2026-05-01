import React, { useState } from 'react';
import { X, Play, CheckCircle2, Printer, MapPin, Package, Truck, User } from 'lucide-react';
import { Trip, tripsService } from '../../../services/tripsService';
import { ToastType } from '../../common/Toast';

interface TripDetailsModalProps {
  trip: Trip;
  onClose: () => void;
  onStatusChange: () => void;
  onShowToast?: (toast: { message: string; type: ToastType }) => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ trip, onClose, onStatusChange, onShowToast }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!trip.id) return;
    
    setIsUpdating(true);
    const result = await tripsService.updateTripStatus(trip.id, newStatus);
    setIsUpdating(false);
    
    if (result.success) {
      if (onShowToast) onShowToast({ message: 'Status atualizado com sucesso!', type: 'success' });
      onStatusChange(); // trigger refresh in parent
    } else {
      if (onShowToast) {
        onShowToast({ message: `Erro ao atualizar status: ${result.error}`, type: 'error' });
      } else {
        alert(`Erro ao atualizar status: ${result.error}`);
      }
    }
  };

  const stops = [...(trip.stops || [])].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Romaneio {trip.numero_romaneio}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                trip.status === 'em_rota' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                trip.status === 'concluida' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
              }`}>
                {trip.status.toUpperCase().replace('_', ' ')}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Criado em {new Date(trip.created_at || '').toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowToast ? onShowToast({ message: 'Em breve: Geração de PDF do Manifesto de Carga', type: 'info' }) : alert('Em breve')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Imprimir Manifesto"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Info Cards */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">VEÍCULO</p>
                <p className="font-bold text-gray-900 dark:text-white">{trip.vehicle?.placa || 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{trip.vehicle?.tipo}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">MOTORISTA</p>
                <p className="font-bold text-gray-900 dark:text-white">{trip.driver?.nome || 'N/A'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{trip.driver?.telefone || 'Sem contato'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">ENTREGAS</p>
                <p className="font-bold text-gray-900 dark:text-white text-2xl leading-none">{trip.stops?.length || 0}</p>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Roteiro de Entregas</h3>
          
          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
            {stops.map((stop, index) => (
              <div key={stop.id} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-4 border-white dark:border-gray-800"></div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded">
                        #{stop.sequence}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Pedido {stop.order?.order_number}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stop.status_execucao === 'realizada' ? 'bg-emerald-100 text-emerald-800' :
                      stop.status_execucao === 'falha' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {stop.status_execucao.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{stop.order?.customer_name}</p>
                      <p>{stop.order?.destination_street}, {stop.order?.destination_number} {stop.order?.destination_complement && `- ${stop.order.destination_complement}`}</p>
                      <p>{stop.order?.destination_neighborhood} - {stop.order?.destination_city}/{stop.order?.destination_state}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          {trip.status === 'agendada' && (
            <button
              onClick={() => handleStatusUpdate('em_rota')}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Play size={18} />
              {isUpdating ? 'Processando...' : 'Iniciar Viagem'}
            </button>
          )}

          {trip.status === 'em_rota' && (
            <button
              onClick={() => handleStatusUpdate('concluida')}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {isUpdating ? 'Processando...' : 'Concluir Viagem'}
            </button>
          )}

          {trip.status === 'concluida' && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle2 size={20} />
              Viagem Finalizada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
