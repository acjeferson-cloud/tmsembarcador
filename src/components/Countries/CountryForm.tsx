import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { Country } from '../../services/countriesService';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

interface CountryFormProps {
  onBack: () => void;
  onSave: (country: any) => void;
  country?: Country;
}

export const CountryForm: React.FC<CountryFormProps> = ({ onBack, onSave, country }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    code: country?.code || '',
    name: country?.name || '',
    flag: country?.flag || '',
    continent: country?.continent || '',
    capital: country?.capital || '',
    language: country?.language || '',
    bacen_code: country?.bacen_code || '',
    iso3: country?.iso3 || '',
    bandeira_url: country?.bandeira_url || '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const fileName = `flag_${Date.now()}.${fileExt}`;
      const filePath = `flags/${fileName}`;

      if (!supabase) throw new Error('Cliente do Supabase não inicializado');

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
      alert(t('common.error', { defaultValue: 'Erro ao fazer upload da imagem.' }));
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
          <span>{t('countries.actions.back')}</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {country ? t('countries.actions.edit') : t('countries.actions.new')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('countries.form.subtitle', { defaultValue: 'Preencha os dados do país' })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('countries.form.basicInfo', { defaultValue: 'Informações Básicas' })}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.code')}*
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                maxLength={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="AFG"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Afeganistão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.flag')} (Emoji) *
              </label>
              <input
                type="text"
                name="flag"
                value={formData.flag}
                onChange={handleInputChange}
                required
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="🇦🇫"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.continent')} *
              </label>
              <select
                name="continent"
                value={formData.continent}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
              >
                <option value="">{t('countries.form.selectContinent', { defaultValue: 'Selecione o continente' })}</option>
                {[
                  t('countries.continents.northAmerica'), 
                  t('countries.continents.southAmerica'), 
                  t('countries.continents.centralAmerica'), 
                  t('countries.continents.europe'), 
                  t('countries.continents.asia'), 
                  t('countries.continents.africa'), 
                  t('countries.continents.oceania'), 
                  t('countries.continents.caribbean')
                ].map(continent => (
                  <option key={continent} value={continent}>
                    {continent}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.capital')} *
              </label>
              <input
                type="text"
                name="capital"
                value={formData.capital}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Kabul"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.language')} *
              </label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Dari, Pashto"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.iso3', 'Cod. ISO 3166-1')}
              </label>
              <input
                type="text"
                name="iso3"
                value={formData.iso3}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="004"
                maxLength={3}
              />
            </div>

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('countries.form.officialFlag', { defaultValue: 'Bandeira Oficial (Imagem)' })}
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-40 h-24 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                  {formData.bandeira_url ? (
                    <img src={formData.bandeira_url} alt="Bandeira Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">{t('countries.form.noFlag', { defaultValue: 'Sem bandeira' })}</span>
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
                      <span className="text-sm">{t('common.sending', { defaultValue: 'Enviando...' })}</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-2 dark:text-gray-500" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
                        {t('common.upload', { defaultValue: 'Fazer upload de um arquivo' })}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('countries.form.fileLimit', { defaultValue: 'PNG, JPG, SVG ou WEBP até 2MB' })}
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
            {t('countries.actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {country ? t('countries.actions.edit') : t('countries.actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
};