import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Edit, Mail, Phone, MapPin, Building2, User, Calendar, Eye, FileText } from 'lucide-react';
import { BusinessPartner } from '../../types';
import { BusinessPartnerVision360 } from './BusinessPartnerVision360';

interface BusinessPartnerViewProps {
  partner: BusinessPartner;
  onEdit: (partner: BusinessPartner) => void;
  onClose: () => void;
}

const BusinessPartnerView: React.FC<BusinessPartnerViewProps> = ({
  partner,
  onEdit,
  onClose
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'vision360' | 'details'>('vision360');
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'supplier':
        return 'bg-orange-100 text-orange-800';
      case 'both':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer':
        return t('businessPartners.typeCustomer', 'Cliente');
      case 'supplier':
        return t('businessPartners.typeSupplier', 'Fornecedor');
      case 'both':
        return t('businessPartners.typeBoth', 'Cliente/Fornecedor');
      default:
        return t('businessPartners.view.typeLabel.default', 'Desconhecido');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'billing':
        return t('businessPartners.view.addressTypeLabel.billing', 'Cobrança');
      case 'delivery':
        return t('businessPartners.view.addressTypeLabel.delivery', 'Entrega');
      case 'correspondence':
        return t('businessPartners.view.addressTypeLabel.correspondence', 'Correspondência');
      case 'commercial':
        return t('businessPartners.view.addressTypeLabel.commercial', 'Comercial');
      case 'shipping':
        return t('businessPartners.view.addressTypeLabel.shipping', 'Expedição');
      case 'both':
        return t('businessPartners.view.addressTypeLabel.both', 'Cobrança e Entrega');
      default:
        return t('businessPartners.view.addressTypeLabel.default', 'Outro');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {partner.documentType === 'cnpj' ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <User className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{partner.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{partner.document}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(partner)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>{t('businessPartners.view.actions.edit', 'Editar')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
              title={t('businessPartners.view.actions.close', 'Fechar')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('vision360')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vision360'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye size={16} />
                <span>{t('businessPartners.view.tabs.vision360', 'Visão 360')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>{t('businessPartners.view.tabs.basicData', 'Dados Básicos')}</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'vision360' ? (
            <BusinessPartnerVision360
              partnerId={partner.id}
              partnerName={partner.name}
              partnerType={partner.type}
            />
          ) : (
            <div>
          {/* Basic Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('businessPartners.view.sections.basicInfo', 'Informações Básicas')}</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('businessPartners.view.labels.type', 'Tipo')}</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(partner.type)}`}>
                    {getTypeLabel(partner.type)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('businessPartners.view.labels.status', 'Status')}</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
                    {partner.status === 'active' ? t('businessPartners.view.statusLabel.active', 'Ativo') : t('businessPartners.view.statusLabel.inactive', 'Inativo')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('businessPartners.view.labels.email', 'Email')}</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{partner.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('businessPartners.view.labels.phone', 'Telefone')}</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{partner.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts */}
          {partner.contacts && partner.contacts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('businessPartners.view.sections.contacts', 'Pessoas de Contato')}</h3>
              <div className="space-y-4">
                {partner.contacts.map((contact) => (
                  <div key={contact.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contact.position}</p>
                        {contact.department && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{contact.department}</p>
                        )}
                      </div>
                      {contact.isPrimary && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {t('businessPartners.view.labels.primaryContact', 'Principal')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{contact.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addresses */}
          {partner.addresses && partner.addresses.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('businessPartners.view.sections.addresses', 'Endereços')}</h3>
              <div className="space-y-4">
                {partner.addresses.map((address) => (
                  <div key={address.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getAddressTypeLabel(address.type)}
                        </span>
                      </div>
                      {address.is_primary && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {t('businessPartners.view.labels.primaryAddress', 'Principal')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      <p>{address.street}, {address.number}</p>
                      {address.complement && <p>{address.complement}</p>}
                      <p>{address.neighborhood}</p>
                      <p>{address.city}, {address.state} - {address.zip_code}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          {partner.observations && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('businessPartners.view.sections.observations', 'Observações')}</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{partner.observations}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('businessPartners.view.sections.systemInfo', 'Informações do Sistema')}</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.view.labels.createdAt', 'Criado em')}</p>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(partner.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.view.labels.updatedAt', 'Última atualização')}</p>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(partner.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPartnerView;
