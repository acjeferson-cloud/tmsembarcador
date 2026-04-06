import React from 'react';
import { ArrowLeft, Edit, FileText, Hash, Calendar, User } from 'lucide-react';
import { Occurrence } from '../../data/occurrencesData';
import { useTranslation } from 'react-i18next';

interface OccurrenceViewProps {
  onBack: () => void;
  onEdit: () => void;
  occurrence: Occurrence;
  isAdmin?: boolean;
}

export const OccurrenceView: React.FC<OccurrenceViewProps> = ({ onBack, onEdit, occurrence, isAdmin }) => {
  const { t } = useTranslation();

  // Determine if this is a delivery success or problem occurrence
  const isDeliveryProblem = parseInt(occurrence.codigo) >= 50 || 
                           ['003', '004', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016'].includes(occurrence.codigo);
  
  const getStatusColor = () => {
    if (occurrence.codigo === '001') return 'bg-green-100 text-green-800'; // Entrega normal
    if (isDeliveryProblem) return 'bg-red-100 text-red-800'; // Problemas
    return 'bg-yellow-100 text-yellow-800'; // Outras situações
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>{t('occurrences.view.back')}</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('occurrences.view.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('occurrences.view.subtitle')}</p>
          </div>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>{t('occurrences.view.edit')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            {/* Code */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{occurrence.codigo}</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{occurrence.descricao}</h2>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {isDeliveryProblem ? t('occurrences.view.problem') : t('occurrences.view.delivery')}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.codeLabel')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{occurrence.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.typeLabel')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{isDeliveryProblem ? t('occurrences.view.problem') : t('occurrences.view.delivery')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('occurrences.view.descTitle')}</h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200">{occurrence.descricao}</p>
          </div>
        </div>

        {/* EDI Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('occurrences.view.ediTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Hash className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.ediCode')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{occurrence.codigo}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <FileText className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.ediFormat')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{occurrence.codigo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        {(occurrence.criadoEm || occurrence.alteradoEm) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('occurrences.view.auditTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {occurrence.criadoEm && (
                <div className="flex items-center space-x-3">
                  <Calendar className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.createdAt')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(occurrence.criadoEm)}</p>
                  </div>
                </div>
              )}
              
              {occurrence.criadoPor && (
                <div className="flex items-center space-x-3">
                  <User className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.createdBy')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{t('occurrences.view.userPrefix', { id: occurrence.criadoPor })}</p>
                  </div>
                </div>
              )}
              
              {occurrence.alteradoEm && (
                <div className="flex items-center space-x-3">
                  <Calendar className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.updatedAt')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(occurrence.alteradoEm)}</p>
                  </div>
                </div>
              )}
              
              {occurrence.alteradoPor && (
                <div className="flex items-center space-x-3">
                  <User className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('occurrences.view.updatedBy')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{t('occurrences.view.userPrefix', { id: occurrence.alteradoPor })}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('occurrences.view.usageTitle')}</h3>
          <p className="text-blue-800 mb-4">
            {t('occurrences.view.usageDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900">{t('occurrences.view.integrationTitle')}</p>
              <p className="text-blue-700">{t('occurrences.view.integrationDesc')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900">{t('occurrences.view.trackingTitle')}</p>
              <p className="text-blue-700">{t('occurrences.view.trackingDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
