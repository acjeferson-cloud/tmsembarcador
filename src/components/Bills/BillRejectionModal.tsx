import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Search } from 'lucide-react';
import { getAllRejectionReasons } from '../../data/rejectionReasonsData';
import { Toast, ToastType } from '../common/Toast';

interface BillRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonId: number, observation: string) => void;
  billId?: number;
  billNumber?: string;
}

export const BillRejectionModal: React.FC<BillRejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  billId,
  billNumber
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [observation, setObservation] = useState('');
  const [reasons, setReasons] = useState(getAllRejectionReasons());
  const [filteredReasons, setFilteredReasons] = useState(reasons);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Get unique categories
  const categories = ['Todas as Categorias', ...Array.from(new Set(reasons.map(r => r.categoria)))];
  
  // Filter reasons based on search term and category
  useEffect(() => {
    let filtered = reasons;
    
    if (searchTerm) {
      filtered = filtered.filter(reason => 
        reason.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.codigo.includes(searchTerm)
      );
    }
    
    if (selectedCategory && selectedCategory !== 'Todas as Categorias') {
      filtered = filtered.filter(reason => reason.categoria === selectedCategory);
    }
    
    setFilteredReasons(filtered);
  }, [searchTerm, selectedCategory, reasons]);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedReasonId(null);
      setObservation('');
      setSelectedCategory('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    if (!selectedReasonId) {
      setToast({ message: 'Por favor, selecione um motivo de rejeição.', type: 'warning' });
      return;
    }
    
    onConfirm(selectedReasonId, observation);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <AlertCircle size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reprovar Fatura</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Bill Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Você está reprovando a fatura: <span className="font-semibold text-gray-900 dark:text-white">{billNumber}</span>
            </p>
          </div>
          
          {/* Search and Category Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar motivo de rejeição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reasons List */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
            {filteredReasons.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredReasons.map(reason => (
                  <div 
                    key={reason.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedReasonId === reason.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedReasonId(reason.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <input
                          type="radio"
                          checked={selectedReasonId === reason.id}
                          onChange={() => setSelectedReasonId(reason.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {reason.codigo} - {reason.descricao}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Categoria: {reason.categoria}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nenhum motivo de rejeição encontrado.
              </div>
            )}
          </div>
          
          {/* Observation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações Adicionais (opcional)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Informe detalhes adicionais sobre a rejeição..."
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReasonId}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Rejeição
            </button>
          </div>
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
