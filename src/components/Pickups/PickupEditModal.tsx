import React, { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';

interface PickupEditModalProps {
  pickup: any;
  onClose: () => void;
  onUpdatePickup: (id: string, updates: any) => Promise<void>;
}

export const PickupEditModal: React.FC<PickupEditModalProps> = ({ pickup, onClose, onUpdatePickup }) => {
  const [dataAgendada, setDataAgendada] = useState(() => {
    const rawDate = pickup.scheduled_date || pickup.data_agendada || pickup.dataAgendada;
    if (!rawDate) return '';
    try {
      if (rawDate.length === 10 && rawDate.includes('-')) {
         return `${rawDate}T00:00`;
      }
      
      // Impede que T00:00:00 exato em UTC se transforme em 21:00 do dia anterior
      if (typeof rawDate === 'string' && rawDate.includes('T00:00:00')) {
        const datePart = rawDate.split('T')[0];
        return `${datePart}T00:00`;
      }

      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  });
  const [observacoes, setObservacoes] = useState(pickup.observations || pickup.observacoes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalDate = dataAgendada;
      if (dataAgendada && dataAgendada.includes('T')) {
         const d = new Date(dataAgendada);
         if (!isNaN(d.getTime())) {
           finalDate = d.toISOString();
         }
      } else if (dataAgendada) {
         // Se for apenas data YYYY-MM-DD
         finalDate = `${dataAgendada}T00:00:00Z`;
      }
      
      await onUpdatePickup(pickup.id || pickup.id_coleta, { dataAgendada: finalDate, observacoes });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Coleta</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pickup.pickup_number || pickup.numeroColeta || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar size={16} />
              Data Agendada
            </label>
            <input
              type="datetime-local"
              value={dataAgendada}
              min={pickup.created_at || pickup.dataCriacao ? new Date(pickup.created_at || pickup.dataCriacao).toISOString().split('T')[0] + 'T00:00' : undefined}
              onChange={(e) => setDataAgendada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FileText size={16} />
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
