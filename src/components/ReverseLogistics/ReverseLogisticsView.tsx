import React from 'react';
import { ArrowLeft, Edit, Package, MapPin, Truck, Calendar, DollarSign, FileText, Clock } from 'lucide-react';
import { ReverseLogistics } from '../../types';
import { reverseLogisticsStatuses, reverseLogisticsTypes, itemConditions, itemActions } from '../../data/reverseLogisticsData';

interface ReverseLogisticsViewProps {
  order: ReverseLogistics;
  onEdit: () => void;
  onClose: () => void;
}

const ReverseLogisticsView: React.FC<ReverseLogisticsViewProps> = ({
  order,
  onEdit,
  onClose
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = reverseLogisticsStatuses.find(s => s.value === status);
    if (!statusConfig) return null;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = reverseLogisticsTypes.find(t => t.value === type);
    if (!typeConfig) return type;

    const colors = {
      return: 'bg-red-100 text-red-800',
      exchange: 'bg-blue-100 text-blue-800',
      warranty: 'bg-green-100 text-green-800',
      defect: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[type as keyof typeof colors]}`}>
        {typeConfig.label}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getConditionLabel = (condition: string) => {
    const conditionConfig = itemConditions.find(c => c.value === condition);
    return conditionConfig?.label || condition;
  };

  const getActionLabel = (action: string) => {
    const actionConfig = itemActions.find(a => a.value === action);
    return actionConfig?.label || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Solicitação {order.reverseOrderNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detalhes da solicitação de logística reversa
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Editar</span>
        </button>
      </div>

      {/* Status and Basic Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {getStatusBadge(order.status)}
            {getTypeBadge(order.type)}
            <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
              Prioridade: {order.priority === 'low' ? 'Baixa' : 
                          order.priority === 'medium' ? 'Média' :
                          order.priority === 'high' ? 'Alta' : 'Urgente'}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Criado em {formatDate(order.createdAt)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pedido Original</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.originalOrderNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Data da Solicitação</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.requestDate)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Valor de Reembolso</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {order.refundAmount ? formatCurrency(order.refundAmount) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer and Reason */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Cliente</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID do Cliente</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customerId}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Motivo da Solicitação</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Motivo Principal</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.reason}</p>
            </div>
            {order.expectedReturnDate && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data Esperada de Retorno</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.expectedReturnDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itens da Solicitação</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Condição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      {item.reason && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.reason}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {getConditionLabel(item.condition)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getActionLabel(item.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Endereço de Coleta</h2>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>{order.pickupAddress.street}</p>
            <p>{order.pickupAddress.neighborhood}</p>
            <p>{order.pickupAddress.city}, {order.pickupAddress.state}</p>
            <p>CEP: {order.pickupAddress.zipCode}</p>
            <p>{order.pickupAddress.country}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Endereço de Retorno</h2>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>{order.returnAddress.street}</p>
            <p>{order.returnAddress.neighborhood}</p>
            <p>{order.returnAddress.city}, {order.returnAddress.state}</p>
            <p>CEP: {order.returnAddress.zipCode}</p>
            <p>{order.returnAddress.country}</p>
          </div>
        </div>
      </div>

      {/* Logistics and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logistics Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <Truck className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informações Logísticas</h2>
          </div>
          <div className="space-y-3">
            {order.carrier && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transportadora</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.carrier}</p>
              </div>
            )}
            {order.trackingCode && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Código de Rastreamento</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.trackingCode}</p>
              </div>
            )}
            {order.exchangeOrderId && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pedido de Troca</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.exchangeOrderId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Solicitação Criada</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            {order.actualReturnDate && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Produto Retornado</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.actualReturnDate)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Última Atualização</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Attachments */}
      {(order.notes || order.attachments?.length) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Observações e Anexos</h2>
          </div>
          
          {order.notes && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Observações</p>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}

          {order.attachments && order.attachments.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Anexos</p>
              <div className="flex flex-wrap gap-2">
                {order.attachments.map((attachment, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {attachment}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReverseLogisticsView;