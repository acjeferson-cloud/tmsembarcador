import React, { useState } from 'react';
import { CatalogItem } from '../../services/catalogItemsService';
import { ArrowLeft, Package, Tag, Hash, FileText, Info } from 'lucide-react';
import { InlineMessage } from '../common/InlineMessage';
import { useTranslation } from 'react-i18next';

interface CatalogItemFormProps {
  onBack: () => void;
  onSave: (data: CatalogItem) => void;
  item: CatalogItem | null;
}

export const CatalogItemForm: React.FC<CatalogItemFormProps> = ({ 
  onBack, 
  onSave, 
  item 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    item_code: item?.item_code || '',
    item_description: item?.item_description || '',
    ean_code: item?.ean_code || '',
    ncm_code: item?.ncm_code || '',
  });
  
  const [codeError, setCodeError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_code.trim()) {
      setCodeError('Código é obrigatório');
      return;
    }

    if (!formData.item_description.trim()) {
      setCodeError('Descrição é obrigatória');
      return;
    }

    onSave({
      id: item?.id,
      item_code: formData.item_code.trim(),
      item_description: formData.item_description.trim(),
      ean_code: formData.ean_code.trim() || undefined,
      ncm_code: formData.ncm_code.replace(/\D/g, '') || undefined,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Catálogo de Itens</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {item ? 'Editar Item do Catálogo' : 'Novo Item'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Preencha os dados do item</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações do Item</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código Interno do Produto (cProd) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.item_code}
                  onChange={(e) => {
                     setFormData({ ...formData, item_code: e.target.value });
                     setCodeError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    codeError && !formData.item_code.trim() ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-900 dark:text-white`}
                  placeholder="EX: 12345"
                />
              </div>
              
              {codeError && !formData.item_code.trim() && (
                <div className="mt-2">
                  <InlineMessage type="error" message={codeError} />
                </div>
              )}
              
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Código do Produto</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Código de SKU ou Identificador único usado na empresa para rastrear a restrição.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição da Mercadoria *
              </label>
              <textarea
                required
                value={formData.item_description}
                onChange={(e) => {
                  setFormData({ ...formData, item_description: e.target.value });
                  setCodeError('');
                }}
                maxLength={100}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  codeError && !formData.item_description.trim() ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-900 dark:text-white`}
                placeholder="Digite a descrição da mercadoria"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Máximo de 100 caracteres. Restantes: {100 - formData.item_description.length}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                EAN / GTIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ean_code}
                  onChange={(e) => setFormData({ ...formData, ean_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                  placeholder="Ex: 7891234567890"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código NCM
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ncm_code}
                  onChange={(e) => setFormData({ ...formData, ncm_code: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                  placeholder="Ex: 85171231"
                  maxLength={8}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6">
          <div className="flex items-start space-x-2">
            <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Sobre Restrições de Itens</h3>
              <p className="text-blue-800 dark:text-blue-200/80 mb-4">
                O preenchimento do código do item afeta diretamente como o Motor de Cálculo processa fretes restritos para NFe baseadas nestes itens.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">NCM e EAN</p>
                  <p className="text-blue-700 dark:text-blue-400">Restrições logísticas podem ser aplicadas genericamente a famílias inteiras de NCM se preenchidas aqui.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Vinculação</p>
                  <p className="text-blue-700 dark:text-blue-400">Após salvar, vincule este item ao Transportador/Tabela na aba Tabela de Fretes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {item ? 'Atualizar Item' : 'Salvar Item'}
          </button>
        </div>
      </form>
    </div>
  );
};
