import React from 'react';
import { X, Edit, DollarSign, Sparkles, Check } from 'lucide-react';
import { InnovationCrud } from '../../services/innovationsCrudService';

interface InnovationViewProps {
  innovation: InnovationCrud;
  onClose: () => void;
  onEdit: () => void;
}

export const InnovationView: React.FC<InnovationViewProps> = ({
  innovation,
  onClose,
  onEdit
}) => {
  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${innovation.is_active ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Sparkles className={`w-5 h-5 ${innovation.is_active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {innovation.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {innovation.category.charAt(0).toUpperCase() + innovation.category.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sobre esta inovação
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {innovation.description}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-xs text-gray-600 dark:text-gray-400">A partir de</p>
                <p className="text-3xl font-bold text-blue-600">
                  R$ {formatPrice(innovation.monthly_price)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">por mês</p>
              </div>
            </div>

            {innovation.detailed_description && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  Descrição Detalhada
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {innovation.detailed_description}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>Será adicionado à sua mensalidade</span>
              </div>
              {innovation.is_active ? (
                <span className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm font-medium">
                  <Check className="w-4 h-4" />
                  <span>Ativo</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                  Inativo
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ícone</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {innovation.icon}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ordem de Exibição</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {innovation.display_order}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Criado em</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(innovation.created_at)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Atualizado em</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(innovation.updated_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
