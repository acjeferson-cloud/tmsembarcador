import React, { useState, useEffect } from 'react';
import { Building, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { Establishment } from '../../data/establishmentsData';
import { useTranslation } from 'react-i18next';

interface EstablishmentSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  establishments: Establishment[];
  onSelect: (establishmentId: number) => void;
  isChangingEstablishment?: boolean;
}

export const EstablishmentSelectionModal: React.FC<EstablishmentSelectionModalProps> = ({
  isOpen,
  onClose,
  establishments,
  onSelect,
  isChangingEstablishment = false
}) => {
  const { t } = useTranslation();
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);



  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedEstablishment(null);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  // Bloquear ESC quando modal for obrigatório
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se não tem onClose (modal obrigatório), bloquear ESC
      if (isOpen && !onClose && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setError(t('establishmentSelection.mandatoryWarning'));
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, onClose, t]);

  if (!isOpen) return null;

  // Filter establishments based on search term
  const filteredEstablishments = establishments.filter(establishment => 
    establishment.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (establishment.fantasia && establishment.fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
    establishment.codigo.includes(searchTerm)
  );

  const handleSelect = async () => {
    if (selectedEstablishment !== null) {
      try {
        // Call onSelect prop which handles everything
        await onSelect(selectedEstablishment);
      } catch (error) {
        setError(t('establishmentSelection.errorSelecting'));
      }
    } else {
      setError(t('establishmentSelection.pleaseSelect'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Só permite fechar clicando no backdrop se onClose existir
        if (onClose && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-slate-900">
        <img
          src="/image.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/40 via-blue-50/30 to-gray-100/40 dark:from-blue-900/20 dark:to-slate-900/30"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full relative z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isChangingEstablishment ? t('establishmentSelection.titleChange') : t('establishmentSelection.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isChangingEstablishment
                  ? t('establishmentSelection.subtitleChange')
                  : t('establishmentSelection.subtitle')}
              </p>
              {!onClose && (
                <p className="text-red-600 text-sm font-medium mt-2">
                  ⚠️ {t('establishmentSelection.mandatoryWarning')}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder={t('establishmentSelection.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Establishments List */}
          <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {filteredEstablishments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredEstablishments.map((establishment) => (
                  <div 
                    key={establishment.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedEstablishment === establishment.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => setSelectedEstablishment(establishment.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {selectedEstablishment === establishment.id ? (
                          <CheckCircle size={24} className="text-blue-600" />
                        ) : (
                          <Building size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {establishment.fantasia || establishment.razaoSocial}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-2">{establishment.codigo}</span>
                          <span className="mr-2">•</span>
                          <span className="capitalize">{establishment.tipo}</span>
                          {establishment.cidade && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{establishment.cidade}/{establishment.estado}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                {t('establishmentSelection.noEstablishmentsFound')}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleSelect}
            disabled={selectedEstablishment === null}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingEstablishment ? t('establishmentSelection.changeButton') : t('establishmentSelection.accessButton')}
          </button>
        </div>
      </div>
    </div>
  );
};