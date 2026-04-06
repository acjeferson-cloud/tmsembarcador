import React, { useState, useEffect } from 'react';
import { ArrowLeft, Hash, Info } from 'lucide-react';
import { Occurrence, getNextOccurrenceCode, isValidOccurrenceCode, isOccurrenceCodeUnique } from '../../data/occurrencesData';
import { InlineMessage } from '../common/InlineMessage';
import { useTranslation } from 'react-i18next';

interface OccurrenceFormProps {
  onBack: () => void;
  onSave: (occurrence: any) => void;
  occurrence?: Occurrence;
}

export const OccurrenceForm: React.FC<OccurrenceFormProps> = ({ onBack, onSave, occurrence }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    codigo: occurrence?.codigo || '',
    descricao: occurrence?.descricao || ''
  });

  const [codeError, setCodeError] = useState('');

  // Auto-generate code for new occurrences
  useEffect(() => {
    if (!occurrence && !formData.codigo) {
      const nextCode = getNextOccurrenceCode();
      setFormData(prev => ({
        ...prev,
        codigo: nextCode
      }));
    }
  }, [occurrence]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear code error when code changes
    if (name === 'codigo') {
      validateCode(value);
    }
  };

  const validateCode = (codigo: string) => {
    setCodeError('');
    
    if (!codigo) {
      setCodeError(t('occurrences.form.codeRequired'));
      return false;
    }

    if (!isValidOccurrenceCode(codigo)) {
      setCodeError(t('occurrences.form.codeInvalid'));
      return false;
    }

    if (!occurrence && !isOccurrenceCodeUnique(codigo)) {
      setCodeError(t('occurrences.form.codeExists'));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code
    if (!validateCode(formData.codigo)) {
      return;
    }
    
    // Validate description
    if (!formData.descricao) {
      setCodeError(t('occurrences.form.descRequired'));
      return;
    }

    if (formData.descricao.length > 100) {
      setCodeError(t('occurrences.form.descLength'));
      return;
    }

    onSave(formData);
  };

  const generateNewCode = () => {
    const nextCode = getNextOccurrenceCode();
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
          <span>{t('occurrences.form.back')}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {occurrence ? t('occurrences.form.titleEdit') : t('occurrences.form.titleNew')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('occurrences.form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('occurrences.form.infoTitle')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('occurrences.form.codeLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleCodeChange}
                  required
                  maxLength={3}
                  disabled={!!occurrence}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    codeError ? 'border-red-300' : 'border-gray-300'
                  } ${occurrence ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder={t('occurrences.form.codePlaceholder')}
                />
                {!occurrence && (
                  <button
                    type="button"
                    onClick={generateNewCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Gerar próximo código"
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
                    <p className="text-sm text-blue-800 font-medium">{t('occurrences.form.sequentialTitle')}</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {occurrence ? t('occurrences.form.sequentialDescEdit') : t('occurrences.form.sequentialDescNew')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('occurrences.form.descLabel')}
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                required
                maxLength={100}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('occurrences.form.descPlaceholder')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('occurrences.form.descCharCount', { count: 100 - formData.descricao.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-2">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('occurrences.form.aboutCodesTitle')}</h3>
              <p className="text-blue-800 mb-4">
                {t('occurrences.form.aboutCodesDesc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('occurrences.form.codesDeliveryTitle')}</p>
                  <p className="text-blue-700">{t('occurrences.form.codesDeliveryDesc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-blue-900">{t('occurrences.form.codesProblemTitle')}</p>
                  <p className="text-blue-700">{t('occurrences.form.codesProblemDesc')}</p>
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
            {t('occurrences.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={!!codeError}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {occurrence ? t('occurrences.form.update') : t('occurrences.form.save')}
          </button>
        </div>
      </form>
    </div>
  );
};
