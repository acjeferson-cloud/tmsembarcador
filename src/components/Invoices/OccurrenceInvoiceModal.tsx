import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Camera, Upload, AlertCircle, FileText } from 'lucide-react';
import { occurrencesService } from '../../services/occurrencesService';
import { supabase } from '../../lib/supabase';

interface OccurrenceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (occurrenceData: any) => Promise<void>;
  invoiceNumber: string;
}

export const OccurrenceInvoiceModal: React.FC<OccurrenceInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoiceNumber
}) => {
  const [occurrencesList, setOccurrencesList] = useState<any[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
      console.error('Erro ao buscar ocorrências', err);
      setError('Erro ao carregar histórico de ocorrências');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `occurrence_${invoiceNumber}_${Date.now()}.${fileExt}`;
      const filePath = `invoices_occurrences/${fileName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('pickup-proofs')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage
        .from('pickup-proofs')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Erro no upload da foto', err);
      throw new Error('Falha ao fazer o upload da foto. Verifique seu armazenamento.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedOccurrenceId) {
      setError('Por favor, selecione uma ocorrência.');
      return;
    }
    
    if (!date || !time) {
      setError('Data e hora são obrigatórias.');
      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const occurrenceDef = occurrencesList.find(o => o.id === selectedOccurrenceId);

      await onSave({
        codigo: occurrenceDef?.codigo,
        descricao: occurrenceDef?.descricao,
        data_ocorrencia: `${date}T${time}:00`,
        foto_url: photoUrl,
        criado_em: new Date().toISOString()
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar a ocorrência');
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lançar Ocorrência</h2>
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
                Tipo de Ocorrência *
              </label>
              <select
                required
                value={selectedOccurrenceId}
                onChange={(e) => setSelectedOccurrenceId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione uma ocorrência...</option>
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
                  Data da Ocorrência *
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
                  Hora da Ocorrência *
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
                Foto de Comprovante de Entrega
              </label>
              
              {!photoPreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                      <label htmlFor="photo-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                        <span>Fazer upload de foto</span>
                        <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG até 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                  <img src={photoPreview} alt="Preview" className="w-full h-48 object-contain" />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <label htmlFor="photo-change" className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Camera size={16} />
                      <input id="photo-change" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                    <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="p-2 bg-white dark:bg-gray-800 text-red-600 hover:text-red-700 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
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
            Cancelar
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
                <span>Salvando...</span>
              </>
            ) : (
              <span>Lançar Ocorrência</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
