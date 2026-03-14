import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { State } from '../../services/statesService';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface StateFormProps {
  onBack: () => void;
  onSave: (state: any) => void;
  state?: State;
}

export const StateForm: React.FC<StateFormProps> = ({ onBack, onSave, state }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: state?.name || '',
    abbreviation: state?.abbreviation || '',
    ibge_code: state?.ibge_code || '',
    capital: state?.capital || '',
    region: state?.region || '',
    bandeira_url: state?.bandeira_url || ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regions = [
    { value: 'Norte', label: t('states.regions.norte') },
    { value: 'Nordeste', label: t('states.regions.nordeste') },
    { value: 'Centro-Oeste', label: t('states.regions.centro_oeste') },
    { value: 'Sudeste', label: t('states.regions.sudeste') },
    { value: 'Sul', label: t('states.regions.sul') }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `state_${Date.now()}.${fileExt}`;
      const filePath = `states/${fileName}`;

      if (!supabase) throw new Error('Supabase client not initialized');

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setFormData(prev => ({ ...prev, bandeira_url: data.publicUrl }));
      }
    } catch (error) {
      alert(t('states.messages.upload_error'));
    } finally {
      setIsUploading(false);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('states.form.back')}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {state ? t('states.form.title_edit') : t('states.form.title_new')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('states.form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('states.form.basic_info')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.name_label')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder={t('states.form.name_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.abbreviation_label')}
              </label>
              <input
                type="text"
                name="abbreviation"
                value={formData.abbreviation}
                onChange={handleInputChange}
                required
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder={t('states.form.abbreviation_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.ibge_label')}
              </label>
              <input
                type="text"
                name="ibge_code"
                value={formData.ibge_code}
                onChange={handleInputChange}
                required
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder={t('states.form.ibge_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.capital_label')}
              </label>
              <input
                type="text"
                name="capital"
                value={formData.capital}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder={t('states.form.capital_placeholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.region_label')}
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
              >
                <option value="">{t('states.form.region_placeholder')}</option>
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('states.form.flag_label')}
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-40 h-24 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                  {formData.bandeira_url ? (
                    <img src={formData.bandeira_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">{t('states.form.no_flag')}</span>
                  )}
                </div>
                
                <div 
                  className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center text-blue-600">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <span className="text-sm">{t('states.form.uploading')}</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-2 dark:text-gray-500" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
                        {t('states.form.upload_text')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('states.form.upload_hint')}
                      </span>
                    </>
                  )}
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
            className="px-6 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
          >
            {t('states.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {state ? t('states.form.update') : t('states.form.save')}
          </button>
        </div>
      </form>
    </div>
  );
};