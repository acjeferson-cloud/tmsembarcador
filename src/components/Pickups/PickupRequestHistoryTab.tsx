import React, { useEffect, useState } from 'react';
import { Send, Mail, MessageSquare, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { pickupRequestService, PickupRequest } from '../../services/pickupRequestService';

interface PickupRequestHistoryTabProps {
  pickupId: string;
}

export const PickupRequestHistoryTab: React.FC<PickupRequestHistoryTabProps> = ({ pickupId }) => {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [pickupId]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await pickupRequestService.getPickupRequests(pickupId);
      setRequests(data);
    } catch (error) {
// /*log_removed*/
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'failed':
        return 'Falha no Envio';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando histórico...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Nenhuma solicitação de coleta foi enviada ainda</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400 mt-2">
          Use o botão "Solicitar Coleta ao Transportador" para enviar a primeira solicitação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>{requests.length}</strong> solicitação{requests.length > 1 ? 'ões' : ''} enviada{requests.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(request.status)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {request.request_number}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(request.requested_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>Solicitado por: {request.requested_by_name}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(request.requested_at)}</span>
              </div>

              {request.notification_method && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Send className="w-4 h-4" />
                  <span>
                    Método:{' '}
                    {request.notification_method === 'email' && 'E-mail'}
                    {request.notification_method === 'whatsapp' && 'WhatsApp'}
                    {request.notification_method === 'both' && 'E-mail e WhatsApp'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-4 text-sm">
                {request.email_sent !== null && (
                  <div className={`flex items-center gap-2 ${request.email_sent ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    <Mail className="w-4 h-4" />
                    <span>
                      E-mail: {request.email_sent ? '✓ Enviado' : '✗ Não enviado'}
                    </span>
                    {request.carrier_email && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">({request.carrier_email})</span>
                    )}
                  </div>
                )}

                {request.whatsapp_sent !== null && (
                  <div className={`flex items-center gap-2 ${request.whatsapp_sent ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      WhatsApp: {request.whatsapp_sent ? '✓ Enviado' : '✗ Não enviado'}
                    </span>
                    {request.carrier_phone && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">({request.carrier_phone})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {request.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Observações:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{request.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
