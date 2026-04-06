import React from 'react';
import { Edit, Trash2, Eye, Building, MapPin, Hash, FileText, Mail } from 'lucide-react';
import { Establishment } from '../../services/establishmentsService';
import { useTranslation } from 'react-i18next';

interface EstablishmentCardProps {
  establishment: Establishment;
  onView: (establishment: Establishment) => void;
  onEdit: (establishment: Establishment) => void;
  onDelete: (establishmentId: string) => void;
}

export const EstablishmentCard: React.FC<EstablishmentCardProps> = ({ 
  establishment, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const { t } = useTranslation();

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'matriz': return 'bg-blue-100 text-blue-800';
      case 'filial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasEmailConfig = establishment.email_config &&
    establishment.email_config.email &&
    establishment.email_config.host;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">{establishment.codigo}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{establishment.fantasia || establishment.razao_social}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">CNPJ: {establishment.cnpj}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onView(establishment)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('establishments.buttons.view')}
          >
            <Eye size="1rem" />
          </button>
          <button 
            onClick={() => onEdit(establishment)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            title={t('establishments.buttons.edit')}
          >
            <Edit size="1rem" />
          </button>
          <button 
            onClick={() => onDelete(establishment.id)}
            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
            title={t('establishments.buttons.delete')}
          >
            <Trash2 size="1rem" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Hash size="0.875rem" />
          <span>Código: {establishment.codigo}</span>
          <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
            {establishment.tracking_prefix}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin size="0.875rem" />
          <span>{establishment.endereco}, {establishment.bairro}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin size="0.875rem" />
          <span>{establishment.cidade} - {establishment.estado}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MapPin size="0.875rem" />
          <span>CEP: {establishment.cep}</span>
        </div>
        
        {establishment.inscricao_estadual && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <FileText size="0.875rem" />
            <span>IE: {establishment.inscricao_estadual}</span>
          </div>
        )}
        
        {hasEmailConfig && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Mail size="0.875rem" />
            <span>{establishment.email_config.email}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t('establishments.form.fields.type')}:</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-1 capitalize">{establishment.tipo === 'matriz' ? t('establishments.form.fields.typeOptions.matriz') : establishment.tipo === 'filial' ? t('establishments.form.fields.typeOptions.filial') : establishment.tipo}</span>
        </div>
        <div className="text-right flex items-center space-x-2">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(establishment.tipo)}`}>
            <Building size="0.875rem" className="mr-1" />
            <span className="capitalize">{establishment.tipo === 'matriz' ? t('establishments.form.fields.typeOptions.matriz') : establishment.tipo === 'filial' ? t('establishments.form.fields.typeOptions.filial') : establishment.tipo}</span>
          </div>
          
          {hasEmailConfig && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Mail size="0.875rem" className="mr-1" />
              <span>E-mail</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
