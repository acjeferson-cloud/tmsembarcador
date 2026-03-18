import React, { useState } from 'react';
import { X, Package, Weight, AlertCircle } from 'lucide-react';
import { pickupsService } from '../../services/pickupsService';

interface CreatePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoices: any[];
  onSuccess: (count?: number, desc?: string) => void;
  establishmentId?: string;
  userId?: number;
}

export const CreatePickupModal: React.FC<CreatePickupModalProps> = ({
  isOpen,
  onClose,
  selectedInvoices,
  onSuccess,
  establishmentId,
  userId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totals = selectedInvoices.reduce((acc, invoice) => {
    acc.weight += parseFloat(invoice.pesoTotal || invoice.peso_bruto || invoice.peso || 0);
    acc.volumes += parseInt(invoice.volumes || invoice.quantidade_volumes || invoice.volumes || 0);
    acc.cubicMeters += parseFloat(invoice.metros_cubicos || invoice.cubagem || invoice.cubic_meters || 0);
    acc.value += parseFloat(invoice.valorNFe || invoice.valor_total || 0);
    return acc;
  }, { weight: 0, volumes: 0, cubicMeters: 0, value: 0 });

  const handleCreatePickups = async () => {
    if (selectedInvoices.length === 0) {
      setError('Selecione pelo menos uma nota fiscal');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const estabId = establishmentId || selectedInvoices[0]?.establishment_id;

      if (!estabId) {
        setError('Estabelecimento não identificado');
        setIsLoading(false);
        return;
      }

      const result = await pickupsService.createFromNfes({
        invoiceIds: selectedInvoices.map(inv => inv.id),
        establishmentId: estabId,
        userId
      });

      if (result.success && result.pickups) {
        let txt = '';
        if (result.warning) {
          txt = result.warning + '\n\n';
        }
        
        result.pickups.forEach((pickup) => {
          txt += `${pickup.pickupNumber} - ${pickup.carrierName} (${pickup.invoiceCount} nota${pickup.invoiceCount > 1 ? 's' : ''})\n`;
        });
        
        onSuccess(result.pickups.length, txt.trim());
        onClose();
      } else {
        setError(result.error || 'Erro ao criar coletas');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar criação de coletas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Criar Coletas
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  Resumo das Notas Fiscais Selecionadas
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Volumes</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {totals.volumes}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Weight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Peso Total</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {totals.weight.toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">NFs</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {selectedInvoices.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Metragem Cúbica</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {totals.cubicMeters.toFixed(4)} m³
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Nota Fiscal
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Destinatário
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          Peso
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          Volumes
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          Metragem Cub.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedInvoices.map((invoice, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {invoice.numero || invoice.numero_nfe}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {invoice.cliente || invoice.destinatario || invoice.destinatario_nome}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                            {parseFloat(invoice.pesoTotal || invoice.peso || invoice.peso_bruto || 0).toFixed(2)} kg
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                            {invoice.volumes || invoice.quantidade_volumes || 0}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                            {parseFloat(invoice.metros_cubicos || invoice.cubagem || invoice.cubic_meters || 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button
                  onClick={handleCreatePickups}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Package size={20} />
                  <span>{isLoading ? 'Processando...' : 'Confirmar e Criar Coletas'}</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
        </div>
      </div>
    </div>
  );
};
