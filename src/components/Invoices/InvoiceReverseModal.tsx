import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCcw, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Toast, ToastType } from '../../components/common/Toast';

interface InvoiceReverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any; // Using any or matching the parent's structure
  onSuccess: (newInvoiceId: string) => void;
}

export const InvoiceReverseModal: React.FC<InvoiceReverseModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [motivo, setMotivo] = useState('Logística Reversa Avulsa');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  if (!isOpen) return null;

  const handleCreateReverse = async () => {
    setIsLoading(true);
    try {
      // Chama a function RPC criada na migration para clonar a nota com segurança no DB
      const { data, error } = await (supabase as any).rpc('create_reverse_invoice', {
        p_invoice_id: invoice.id,
        p_motivo: motivo
      });

      if (error) throw error;

      setToast({ message: t("Reversa iniciada com sucesso!"), type: 'success' });
      setTimeout(() => {
        onSuccess(data); // data contains the new invoice UUID
      }, 1500);
    } catch (error: any) {
// /*log_removed*/
      setToast({ message: t("Erro ao gerar logística reversa. Verifique os logs."), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    if (val == null || isNaN(val)) return 'R$ 0,00';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <RefreshCcw size={20} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Iniciar Logística Reversa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800 flex items-start space-x-3">
            <AlertCircle className="text-purple-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Esta ação criará um "espelho" pendente desta Nota Fiscal no sistema (idêntica, mas operando no sentido inverso Cliente ➔ CD).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="block text-xs text-gray-500 dark:text-gray-400">NF Original</span>
              <span className="block font-medium text-gray-900 dark:text-white">{invoice.numero}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="block text-xs text-gray-500 dark:text-gray-400">Valor</span>
              <span className="block font-medium text-green-600 dark:text-green-400">
                {formatCurrency(invoice.valorNFe || invoice.valor_total)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo da Reversa
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="Avaria">Avaria na entrega</option>
              <option value="Arrependimento (CDC)">Arrependimento (Direito do Consumidor)</option>
              <option value="Recusa no Ato">Recusa no ato da entrega</option>
              <option value="Recall / Rechamado">Recall de Produto</option>
              <option value="Logística Reversa Avulsa">Logística Reversa Avulsa / Outros</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateReverse}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Package className="animate-spin" size={18} />
            ) : (
              <RefreshCcw size={18} />
            )}
            <span>{isLoading ? 'Gerando...' : 'Confirmar Reversa'}</span>
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
