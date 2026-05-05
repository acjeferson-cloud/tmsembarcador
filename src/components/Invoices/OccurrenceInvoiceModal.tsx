import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, Upload, AlertCircle, FileText, Info, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { occurrencesService } from '../../services/occurrencesService';
import { deliveryProofService } from '../../services/deliveryProofService';

interface OccurrenceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (occurrenceData: any) => Promise<void>;
  invoiceNumber?: string;
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [observacao, setObservacao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError(t('invoices.modals.occurrence.errorLoad'));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        setError('Formato de imagem inválido. Use JPG ou PNG.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('A foto não pode ter mais que 5MB.');
        return;
      }

      setReceiptPhoto(file);
      setReceiptPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removePhoto = () => {
    setReceiptPhoto(null);
    setReceiptPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedOccurrenceDef = occurrencesList.find(o => o.id === selectedOccurrenceId);
  const isDelivery = selectedOccurrenceDef && ['001', '002', '01', '02'].includes(selectedOccurrenceDef.codigo);

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

    if (isDelivery) {
      if (!receiverName.trim()) {
        setError('O nome do recebedor é obrigatório.');
        return;
      }
      if (!receiverDocument.trim()) {
        setError('O documento (CPF/RG) do recebedor é obrigatório.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const occurrenceDef = occurrencesList.find(o => o.id === selectedOccurrenceId);
      let photoUrl = '';

      if (isDelivery && receiptPhoto && invoiceId) {
        const result = await deliveryProofService.uploadPhoto(invoiceId, receiptPhoto, 1);
        if (result.success && result.url) {
          photoUrl = result.url;
        } else {
          throw new Error(result.error || 'Erro ao fazer upload da foto do canhoto.');
        }
      }

      if (isDelivery && invoiceId && userId !== undefined) {
        await deliveryProofService.saveProof(invoiceId, {
          delivered_at: `${date}T${time}:00`,
          receiver_name: receiverName.trim(),
          receiver_document: receiverDocument.trim(),
          photo_1_url: photoUrl || undefined,
          legal_terms_accepted: true,
          created_by: userId,
          observations: observacao.trim() || undefined
        });
      }

      const payload = {
        codigo: occurrenceDef?.codigo,
        descricao: occurrenceDef?.descricao,
        data_ocorrencia: `${date}T${time}:00`,
        observacao: observacao.trim() || undefined,
        criado_em: new Date().toISOString(),
        nome_recebedor: isDelivery ? receiverName.trim() : undefined,
        documento_recebedor: isDelivery ? receiverDocument.trim() : undefined,
        foto_canhoto: photoUrl || undefined
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || t('invoices.modals.occurrence.errorSave'));
    } finally {
      setIsLoading(false);
    }
  };

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
              {invoiceNumber && <p className="text-sm text-gray-500 dark:text-gray-400">NF-e: {invoiceNumber}</p>}
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

            {isDelivery && (
              <div className="space-y-4 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-2">
                  <Info size={18} />
                  <h3 className="font-medium text-sm">Informações de Entrega</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome do Recebedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Nome completo de quem recebeu"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Documento (CPF/RG) *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverDocument}
                    onChange={(e) => setReceiverDocument(e.target.value)}
                    placeholder="Apenas números ou formato padrão"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anexar Canhoto
                  </label>
                  
                  {receiptPhotoPreview ? (
                    <div className="relative mt-2">
                      <img 
                        src={receiptPhotoPreview} 
                        alt="Preview Canhoto" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-2 w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tirar foto ou galeria</p>
                    </label>
                  )}
                </div>
              </div>
            )}

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
              <span>{t('invoices.modals.occurrence.title')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

