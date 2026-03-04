import React from 'react';
import { Eye, Edit, Trash2, Package, User, Calendar, Clock, AlertCircle, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { ReverseLogistics } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ReverseLogisticsCardProps {
  order: ReverseLogistics;
  onView: (order: ReverseLogistics) => void;
  onEdit: (order: ReverseLogistics) => void;
  onDelete: (orderId: string) => void;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
}

export const ReverseLogisticsCard: React.FC<ReverseLogisticsCardProps> = ({
  order,
  onView,
  onEdit,
  onDelete,
  isSelected,
  onSelect
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-indigo-100 text-indigo-800';
      case 'processed': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle size={14} />;
      case 'in_transit': return <RefreshCw size={14} className="animate-spin" />;
      case 'received': return <Package size={14} />;
      case 'processed': return <CheckCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'return': return 'bg-orange-100 text-orange-800';
      case 'exchange': return 'bg-blue-100 text-blue-800';
      case 'warranty': return 'bg-green-100 text-green-800';
      case 'defect': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'return': 'Devolução',
      'exchange': 'Troca',
      'warranty': 'Garantia',
      'defect': 'Defeito'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'in_transit': 'Em Trânsito',
      'received': 'Recebido',
      'processed': 'Processado',
      'completed': 'Concluído',
      'rejected': 'Rejeitado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    };
    return labels[priority] || priority;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const totalValue = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(order.id)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{order.reverseOrderNumber}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pedido: {order.originalOrderNumber}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(order.type)}`}>
            {getTypeLabel(order.type)}
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="ml-1">{getStatusLabel(order.status)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <User size={14} />
          <span className="truncate">{order.customerName}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <AlertCircle size={14} />
          <span className="truncate">Motivo: {order.reason}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Calendar size={14} />
            <span>Solicitado: {new Date(order.requestDate).toLocaleDateString('pt-BR')}</span>
          </div>
          {order.priority && (
            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(order.priority)}`}>
              <TrendingUp size={12} className="mr-1" />
              {getPriorityLabel(order.priority)}
            </div>
          )}
        </div>

        {order.trackingCode && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Package size={14} />
            <span className="font-mono text-xs">{order.trackingCode}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Package size={14} />
          <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
            <span className="font-semibold text-gray-900 dark:text-white ml-1">{formatCurrency(totalValue)}</span>
          </div>
          {order.refundAmount && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Reembolso:</span>
              <span className="font-semibold text-green-600 ml-1">{formatCurrency(order.refundAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(order)}
            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 text-sm"
          >
            <Eye size={16} />
            <span>Visualizar</span>
          </button>

          <button
            onClick={() => onEdit(order)}
            className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg hover:bg-yellow-100 transition-colors flex items-center justify-center space-x-1 text-sm"
          >
            <Edit size={16} />
            <span>Editar</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
                onDelete(order.id);
              }
            }}
            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
