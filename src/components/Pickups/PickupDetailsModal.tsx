import React, { useState } from 'react';
import { X, Package, Truck, Calendar, User, MapPin, FileText, Info, History, ClipboardCheck } from 'lucide-react';
import { PickupInvoicesTab } from './PickupInvoicesTab';
import { PickupRequestHistoryTab } from './PickupRequestHistoryTab';
import { PickupProofModal } from './PickupProofModal';
import { useAuth } from '../../hooks/useAuth';

interface PickupDetailsModalProps {
  pickup: any;
  onClose: () => void;
}

export const PickupDetailsModal: React.FC<PickupDetailsModalProps> = ({ pickup, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'invoices' | 'history'>('details');
  const [showProofModal, setShowProofModal] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitida':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      case 'solicitada':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'realizada':
      case 'coleta_realizada':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'cancelada':
      case 'coleta_cancelada':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'emitida':
        return 'Emitida';
      case 'solicitada':
        return 'Solicitada';
      case 'realizada':
      case 'coleta_realizada':
        return 'Realizada';
      case 'cancelada':
      case 'coleta_cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes da Coleta</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pickup.pickup_number || pickup.numeroColeta || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Info size={18} />
            Informações Gerais
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText size={18} />
            Notas Fiscais
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <History size={18} />
            Histórico de Envios
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(pickup.status)}`}>
                  {getStatusLabel(pickup.status)}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transportador */}
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transportador</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {pickup.carrier_name || pickup.transportador || '-'}
                    </p>
                  </div>
                </div>

                {/* Quantidade de Volumes */}
                <div className="flex items-start space-x-3">
                  <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade de Volumes</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {pickup.packages_quantity || pickup.quantidadeNotas || 0}
                    </p>
                  </div>
                </div>

                {/* Data de Criação */}
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Criação</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {formatDate(pickup.created_at || pickup.dataCriacao)}
                    </p>
                  </div>
                </div>

                {/* Usuário Responsável */}
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuário Responsável</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {pickup.usuarioResponsavel || '-'}
                    </p>
                  </div>
                </div>

                {/* Endereço de Coleta */}
                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Endereço de Coleta</p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {pickup.pickup_address || pickup.enderecoColeta || '-'}
                      {pickup.pickup_city && pickup.pickup_state && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {' '}- {pickup.pickup_city}/{pickup.pickup_state}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Peso Total */}
                {pickup.total_weight && (
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Peso Total</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {pickup.total_weight} kg
                      </p>
                    </div>
                  </div>
                )}

                {/* Volume Total */}
                {pickup.total_volume && (
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume Total</p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {pickup.total_volume} m³
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Data de Solicitação */}
              {(pickup.dataSolicitacao || pickup.scheduled_date) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Data de Solicitação</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        {formatDate(pickup.dataSolicitacao || pickup.scheduled_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data de Realização */}
              {(pickup.dataRealizacao || pickup.actual_pickup_date) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">Data de Realização</p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {formatDate(pickup.dataRealizacao || pickup.actual_pickup_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              {(pickup.observacoes || pickup.observations) && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pickup.observacoes || pickup.observations}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'invoices' ? (
            <PickupInvoicesTab pickupId={pickup.id} />
          ) : (
            <PickupRequestHistoryTab pickupId={pickup.id} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowProofModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <ClipboardCheck size={18} />
            Ver Comprovante
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Comprovante */}
      {showProofModal && user && (
        <PickupProofModal
          pickup={pickup}
          onClose={() => setShowProofModal(false)}
          onSuccess={() => {
            setShowProofModal(false);
          }}
          userId={user.id}
          userName={user.name || user.email}
        />
      )}
    </div>
  );
};
