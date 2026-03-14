import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { InnovationCrud } from '../../services/innovationsCrudService';
import { useTranslation } from 'react-i18next';

interface InnovationFormProps {
  innovation: InnovationCrud | null;
  onSave: (data: Omit<InnovationCrud, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const ICON_OPTIONS = [
  'Sparkles', 'MessageCircle', 'MessageSquare', 'MapPin',
  'Package', 'DollarSign', 'Zap', 'TrendingUp', 'Shield'
];

const CATEGORY_OPTIONS = [
  'integracao', 'automacao', 'relatorios', 'comunicacao', 'financeiro', 'geral'
];

export const InnovationForm: React.FC<InnovationFormProps> = ({
  innovation,
  onSave,
  onClose
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailed_description: '',
    monthly_price: 0,
    icon: 'Sparkles',
    category: 'geral',
    is_active: true,
    display_order: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (innovation) {
      setFormData({
        name: innovation.name,
        description: innovation.description,
        detailed_description: innovation.detailed_description || '',
        monthly_price: innovation.monthly_price,
        icon: innovation.icon,
        category: innovation.category,
        is_active: innovation.is_active,
        display_order: innovation.display_order
      });
    }
  }, [innovation]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('innovations.form.errors.nameRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('innovations.form.errors.descRequired');
    }

    if (formData.monthly_price < 0) {
      newErrors.monthly_price = t('innovations.form.errors.priceNegative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {innovation ? t('innovations.form.editTitle') : t('innovations.form.newTitle')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('innovations.form.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('innovations.form.namePlaceholder')}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.desc')}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('innovations.form.descPlaceholder')}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.detailedDesc')}
              </label>
              <textarea
                value={formData.detailed_description}
                onChange={(e) => handleChange('detailed_description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t('innovations.form.detailedDescPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.price')}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => handleChange('monthly_price', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.monthly_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('innovations.form.pricePlaceholder')}
              />
              {errors.monthly_price && (
                <p className="text-red-500 text-sm mt-1">{errors.monthly_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.order')}
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t('innovations.form.orderPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.icon')}
              </label>
              <select
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('innovations.form.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {t(`innovations.categories.${category}`) || category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('innovations.form.activeCheck')}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('innovations.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{innovation ? t('innovations.buttons.update') : t('innovations.buttons.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
