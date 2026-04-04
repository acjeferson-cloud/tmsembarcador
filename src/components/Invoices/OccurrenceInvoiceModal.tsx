import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, Upload, AlertCircle, FileText, Info } from 'lucide-react';
import { occurrencesService } from '../../services/occurrencesService';
import { DeliveryProofModal } from './DeliveryProofModal';

interface OccurrenceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (occurrenceData: any) => Promise<void>;
  invoiceId?: string;
  carrierName?: string;
  userId?: number;
}

export const OccurrenceInvoiceModal: React.FC<OccurrenceInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoiceNumber,
  invoiceId,
  carrierName,
  userId
}) => {
  const { t } = useTranslation();

  const [occurrencesList, setOccurrencesList] = useState<any[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState('');
  const [showDeliveryProof, setShowDeliveryProof] = useState(false);
  const [pendingOccurrence, setPendingOccurrence] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [observacao, setObservacao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOccurrences();
    }
  }, [isOpen]);

  const loadOccurrences = async () => {
    try {
      const data = await occurrencesService.getAll();
      setOccurrencesList(data);
    } catch (err) {
// /*log_removed*/
      setError(t('invoices.modals.occurrence.errorLoad'));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedOccurrenceId) {
      setError(t('invoices.modals.occurrence.errorSelect'));
      return;
    }
    
    if (!date || !time) {
      setError(t('invoices.modals.occurrence.errorDateTime'));
      return;
    }

    setIsLoading(true);

    try {
      const occurrenceDef = occurrencesList.find(o => o.id === selectedOccurrenceId);
      
      const payload = {
        codigo: occurrenceDef?.codigo,
        descricao: occurrenceDef?.descricao,
        data_ocorrencia: `${date}T${time}:00`,
        observacao: observacao.trim() || undefined,
        criado_em: new Date().toISOString()
      };

      if (occurrenceDef && ['001', '002'].includes(occurrenceDef.codigo) && invoiceId && userId !== undefined) {
        setPendingOccurrence(payload);
        setShowDeliveryProof(true);
      } else {
        await onSave(payload);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || t('invoices.modals.occurrence.errorSave'));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOccurrenceDef = occurrencesList.find(o => o.id === selectedOccurrenceId);
  const isDelivery = selectedOccurrenceDef && ['001', '002'].includes(selectedOccurrenceDef.codigo);

  if (showDeliveryProof && invoiceId && userId) {
    return (
      <DeliveryProofModal
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        carrierName={carrierName}
        userId={userId}
        onClose={() => {
          setPendingOccurrence(null);
          setShowDeliveryProof(false);
        }}
        onSuccess={async () => {
          if (pendingOccurrence) {
            await onSave(pendingOccurrence);
          }
          onClose();
        }}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('invoices.modals.occurrence.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">NF-e: {invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-gray-700 p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form id="occurrenceForm" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('invoices.modals.occurrence.type')} *
              </label>
              <select
                required
                value={selectedOccurrenceId}
                onChange={(e) => setSelectedOccurrenceId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('invoices.modals.occurrence.select')}...</option>
                {occurrencesList.map(occ => (
                  <option key={occ.id} value={occ.id}>
                    [{occ.codigo}] {occ.descricao}
                  </option>
                ))}
              </select>
            </div>

            {isDelivery && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-start gap-3 mt-4">
                <Info size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">Esta ocorrência exige o preenchimento do <strong>Comprovante de Entrega</strong>. Você será direcionado para a próxima tela após "Continuar".</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('invoices.modals.occurrence.date')} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('invoices.modals.occurrence.time')} *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes opcionais sobre a ocorrência..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            {t('invoices.modals.common.cancel')}
          </button>
          <button
            type="submit"
            form="occurrenceForm"
            disabled={isLoading || !selectedOccurrenceId}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Upload size={18} className="animate-bounce" />
                <span>{t('invoices.form.saving')}</span>
              </>
            ) : (
              <span>{isDelivery ? "Continuar para Comprovante" : t('invoices.modals.occurrence.title')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
