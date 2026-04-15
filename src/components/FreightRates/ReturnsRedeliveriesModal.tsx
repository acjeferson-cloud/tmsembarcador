import React, { useState } from 'react';
import { X, RefreshCcw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReturnsRedeliveriesModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: {
    devolucao_tipo_cobranca: 'PERCENTUAL' | 'VALOR_FIXO';
    devolucao_valor: number;
    reentrega_tipo_cobranca: 'PERCENTUAL' | 'VALOR_FIXO';
    reentrega_valor: number;
  };
}

export const ReturnsRedeliveriesModal: React.FC<ReturnsRedeliveriesModalProps> = ({
  onClose,
  onSave,
  initialData
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <RefreshCcw className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Automação de Devolução e Reentrega</h2>
              <p className="text-purple-100 text-sm">Configure as taxas excedentes para auditoria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Sessão Devolução */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Regras de Devolução (Ida + Retorno)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxação de Devolução</label>
                <select
                  name="devolucao_tipo_cobranca"
                  value={formData.devolucao_tipo_cobranca || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="">Selecione (Nenhuma automação definida)</option>
                  <option value="PERCENTUAL">Fração / % (Ex: 100%)</option>
                  <option value="VALOR_FIXO">Valor Fixo (Ex: R$ 80)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Normalmente o mercado aplica 100% (Pagando o retorno completo).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor/Percentual Devolução</label>
                <div className="relative">
                  {formData.devolucao_tipo_cobranca === 'VALOR_FIXO' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                  )}
                  <input
                    type="number"
                    name="devolucao_valor"
                    value={formData.devolucao_valor ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder={formData.devolucao_tipo_cobranca === 'PERCENTUAL' ? '100' : '50.00'}
                    className={`w-full py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${formData.devolucao_tipo_cobranca === 'VALOR_FIXO' ? 'pl-8' : 'px-3'}`}
                  />
                  {formData.devolucao_tipo_cobranca === 'PERCENTUAL' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sessão Reentrega */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Regras de Reentrega (Tentativa Custo Fixo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taxação de Reentrega</label>
                <select
                  name="reentrega_tipo_cobranca"
                  value={formData.reentrega_tipo_cobranca || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="">Selecione (Nenhuma automação definida)</option>
                  <option value="PERCENTUAL">Fração / % (Ex: 50%)</option>
                  <option value="VALOR_FIXO">Valor Fixo (Ex: R$ 80)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Usualmente o mercado limita a 50% do valor do frete.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor/Percentual Reentrega</label>
                <div className="relative">
                  {formData.reentrega_tipo_cobranca === 'VALOR_FIXO' && (
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-gray-500 sm:text-sm">R$</span>
                   </div>
                  )}
                  <input
                    type="number"
                    name="reentrega_valor"
                    value={formData.reentrega_valor ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder={formData.reentrega_tipo_cobranca === 'PERCENTUAL' ? '50' : '50.00'}
                    className={`w-full py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${formData.reentrega_tipo_cobranca === 'VALOR_FIXO' ? 'pl-8' : 'px-3'}`}
                  />
                  {formData.reentrega_tipo_cobranca === 'PERCENTUAL' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <p><strong>Nota:</strong> Estas regras serão aplicadas compulsoriamente no processo de Auditoria de Faturas mediante a identificação dos Componentes no CT-e emitido pela transportadora.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save size={20} />
            <span>Confirmar Regras</span>
          </button>
        </div>
      </div>
    </div>
  );
};
