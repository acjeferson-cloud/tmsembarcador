import React, { useState, useEffect } from 'react';
import { ArrowLeft, Hash, Info, Tag, Plus } from 'lucide-react';
import {
  RejectionReason,
  getNextRejectionReasonCode,
  isValidRejectionReasonCode,
  isRejectionReasonCodeUnique
} from '../../data/rejectionReasonsData';
import { InlineMessage } from '../common/InlineMessage';
import { useTranslation } from 'react-i18next';

interface RejectionReasonFormProps {
  onBack: () => void;
  onSave: (reason: any) => void;
  reason?: RejectionReason;
  categories: string[];
}

export const RejectionReasonForm: React.FC<RejectionReasonFormProps> = ({ 
  onBack, 
  onSave, 
  reason,
  categories 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    codigo: reason?.codigo || '',
    categoria: reason?.categoria || (categories.length > 0 ? categories[0] : ''),
    descricao: reason?.descricao || '',
    ativo: reason?.ativo !== undefined ? reason.ativo : true
  });

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Auto-generate code for new reasons
  useEffect(() => {
    if (!reason && !formData.codigo) {
      const nextCode = getNextRejectionReasonCode();
      setFormData(prev => ({
        ...prev,
        codigo: nextCode
      }));
    }
  }, [reason]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear code error when code changes
    if (name === 'codigo') {
      validateCode(value);
    }
  };

  const validateCode = (codigo: string) => {
    setCodeError('');
    
    if (!codigo) {
      setCodeError(t('rejectionReasons.form.validations.codeRequired'));
      return false;
    }

    if (!isValidRejectionReasonCode(codigo)) {
      setCodeError(t('rejectionReasons.form.validations.codeFormat'));
      return false;
    }

    if (!reason && !isRejectionReasonCodeUnique(codigo)) {
      setCodeError(t('rejectionReasons.form.validations.codeUnique'));
      return false;
    }

    return true;
  };

  const formatCode = (value: string) => {
    // Remove non-numeric characters and limit to 3 digits
    const numeric = value.replace(/\D/g, '').slice(0, 3);
    
    // Pad with leading zeros if less than 3 digits
    return numeric.padStart(3, '0');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setFormData(prev => ({
      ...prev,
      codigo: formatted
    }));
    validateCode(formatted);
  };

  const handleAddNewCategory = () => {
    if (!newCategory.trim()) {
      alert(t('rejectionReasons.form.validations.newCategoryRequired'));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      categoria: newCategory.trim()
    }));
    
    setNewCategory('');
    setShowNewCategoryInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code
    if (!validateCode(formData.codigo)) {
      return;
    }
    
    // Validate description
    if (!formData.descricao) {
      alert(t('rejectionReasons.form.validations.descriptionRequired'));
      return;
    }

    if (formData.descricao.length > 200) {
      alert(t('rejectionReasons.form.validations.descriptionMaxLength'));
      return;
    }
    
    // Validate category
    if (!formData.categoria) {
      alert(t('rejectionReasons.form.validations.categoryRequired'));
      return;
    }

    onSave(formData);
  };

  const generateNewCode = () => {
    const nextCode = getNextRejectionReasonCode();
    setFormData(prev => ({
      ...prev,
      codigo: nextCode
    }));
    setCodeError('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('rejectionReasons.form.backBtn')}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {reason ? t('rejectionReasons.form.editTitle') : t('rejectionReasons.form.newTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('rejectionReasons.form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('rejectionReasons.form.infoSection.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('rejectionReasons.form.codeLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleCodeChange}
                  required
                  maxLength={3}
                  disabled={!!reason}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    codeError ? 'border-red-300' : 'border-gray-300'
                  } ${reason ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="001"
                />
                {!reason && (
                  <button
                    type="button"
                    onClick={generateNewCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                    title={t('rejectionReasons.form.generateCodeTooltip')}
                  >
                    <Hash size={18} />
                  </button>
                )}
              </div>
              
              {codeError && (
                <div className="mt-2">
                  <InlineMessage type="error" message={codeError} />
                </div>
              )}
              
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">{t('rejectionReasons.form.codeGuideTitle')}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {!reason ? t('rejectionReasons.form.codeGuideNew') : t('rejectionReasons.form.codeGuideEdit')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('rejectionReasons.form.categoryLabel')}
              </label>
              {!showNewCategoryInput ? (
                <div className="flex space-x-2">
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(true)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('rejectionReasons.form.newCategoryPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('rejectionReasons.form.addBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(false)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('rejectionReasons.form.cancelBtn')}
                  </button>
                </div>
              )}
              
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Tag size={16} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">{t('rejectionReasons.form.categoryGuideTitle')}</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t('rejectionReasons.form.categoryGuideDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('rejectionReasons.form.descriptionLabel')}
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                required
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('rejectionReasons.form.descriptionPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('rejectionReasons.form.descriptionLimit', { count: 200 - formData.descricao.length })}
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('rejectionReasons.form.activeLabel')}
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('rejectionReasons.form.activeDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-2">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('rejectionReasons.infoBox.title')}</h3>
              <p className="text-blue-800 mb-4">
                {t('rejectionReasons.infoBox.description1')} {t('rejectionReasons.infoBox.description2')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('rejectionReasons.infoBox.features.audit.title')}</p>
                  <p className="text-blue-700">{t('rejectionReasons.infoBox.features.audit.desc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('rejectionReasons.infoBox.features.categorization.title')}</p>
                  <p className="text-blue-700">{t('rejectionReasons.infoBox.features.categorization.desc')}</p>
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
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            {t('rejectionReasons.form.cancelBtn')}
          </button>
          <button
            type="submit"
            disabled={!!codeError}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reason ? t('rejectionReasons.form.updateBtn') : t('rejectionReasons.form.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
