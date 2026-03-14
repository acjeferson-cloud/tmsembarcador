import React, { useState, useEffect } from 'react';
import { Building, Search, CheckSquare, Square, Info } from 'lucide-react';
import { establishmentsService, Establishment } from '../../services/establishmentsService';

interface EstablishmentSelectorProps {
  selectedEstablishments: string[];
  onChange: (establishments: string[]) => void;
}

import { useTranslation } from 'react-i18next';

export const EstablishmentSelector: React.FC<EstablishmentSelectorProps> = ({
  selectedEstablishments,
  onChange
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [localEstablishments, setLocalEstablishments] = useState<string[]>(selectedEstablishments);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  // Load establishments
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        const data = await establishmentsService.getAll();
        setEstablishments(data);
      } catch (error) {
      }
    };
    loadEstablishments();
  }, []);

  // Update local establishments when prop changes
  useEffect(() => {
    setLocalEstablishments(selectedEstablishments);
  }, [selectedEstablishments]);

  // Filter establishments based on search term
  const filteredEstablishments = establishments.filter(establishment =>
    (establishment.razao_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (establishment.fantasia && establishment.fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (establishment.codigo || '').includes(searchTerm)
  );

  // Toggle establishment selection
  const toggleEstablishment = (establishmentCode: string) => {
    const newEstablishments = localEstablishments.includes(establishmentCode)
      ? localEstablishments.filter(code => code !== establishmentCode)
      : [...localEstablishments, establishmentCode];
    setLocalEstablishments(newEstablishments);
    onChange(newEstablishments);
  };

  // Select all establishments
  const selectAll = () => {
    const allCodes = establishments.map(e => e.codigo);
    setLocalEstablishments(allCodes);
    onChange(allCodes);
  };

  // Clear all establishments
  const clearAll = () => {
    setLocalEstablishments([]);
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('users.establishments.searchPlaceholder') || "Buscar estabelecimentos..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {t('users.establishments.selectAll') || 'Selecionar Todos'}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors text-sm"
          >
            {t('users.establishments.clearAll') || 'Limpar Todos'}
          </button>
        </div>
      </div>

      {/* Information Box */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info size={16} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">{t('users.establishments.title') || 'Estabelecimentos do Usuário'}</p>
            <p className="text-xs text-blue-700 mt-1">
              {t('users.establishments.desc') || 'Selecione os estabelecimentos que este usuário poderá acessar. Após o login, o usuário deverá selecionar um dos estabelecimentos permitidos para iniciar o trabalho.'}
            </p>
          </div>
        </div>
      </div>

      {/* Establishments List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8 font-medium text-gray-700 dark:text-gray-300">{t('users.establishments.tableEst') || 'Estabelecimento'}</div>
            <div className="col-span-4 font-medium text-gray-700 dark:text-gray-300">{t('users.establishments.tableAccess') || 'Acesso'}</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredEstablishments.length > 0 ? (
            filteredEstablishments.map((establishment) => (
              <div key={establishment.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900">
                <div className="px-4 py-3">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8">
                      <div className="flex items-center">
                        <Building size={18} className="text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {establishment.fantasia || establishment.razao_social}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {establishment.codigo} - {(establishment.tipo || '').charAt(0).toUpperCase() + (establishment.tipo || '').slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <button
                        type="button"
                        onClick={() => toggleEstablishment(establishment.codigo)}
                        className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white"
                      >
                        {localEstablishments.includes(establishment.codigo) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} className="text-gray-400" />
                        )}
                        <span className="ml-2">
                          {localEstablishments.includes(establishment.codigo) ? (t('users.establishments.allowed') || 'Permitido') : (t('users.establishments.notAllowed') || 'Não permitido')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              {t('users.establishments.notFound') || 'Nenhum estabelecimento encontrado.'}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {localEstablishments.length} {t('users.establishments.selectedCount') || 'estabelecimento(s) selecionado(s)'}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {establishments.length} total
          </span>
        </div>
      </div>
    </div>
  );
};