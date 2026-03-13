import React from 'react';
import { Edit, Eye, Trash2, Mail, Phone, MapPin, Building2, User } from 'lucide-react';
import { BusinessPartner } from '../../types';
import { useTranslation } from 'react-i18next';

interface BusinessPartnerCardProps {
  partner: BusinessPartner;
  onEdit: (partner: BusinessPartner) => void;
  onView: (partner: BusinessPartner) => void;
  onDelete: (partnerId: string) => void;
}

const BusinessPartnerCard: React.FC<BusinessPartnerCardProps> = ({
  partner,
  onEdit,
  onView,
  onDelete
}) => {
  const { t } = useTranslation();
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

  const primaryContact = partner.contacts.find(c => c.isPrimary) || partner.contacts[0];
  const primaryAddress = partner.addresses.find(a => a.is_primary) || partner.addresses[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {partner.documentType === 'cnpj' ? (
                <Building2 className="w-6 h-6 text-blue-600" />
              ) : (
                <User className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{partner.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{partner.document}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onView(partner)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('businessPartners.card.actions.view', 'Visualizar')}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(partner)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title={t('businessPartners.card.actions.edit', 'Editar')}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                console.log('🗑️ [BusinessPartnerCard] Botão excluir clicado');
                console.log('🗑️ [BusinessPartnerCard] Partner:', partner);
                console.log('🗑️ [BusinessPartnerCard] Partner ID:', partner.id);
                console.log('🗑️ [BusinessPartnerCard] Tipo do ID:', typeof partner.id);
                if (!partner.id) {
                  console.error('❌ [BusinessPartnerCard] ID do parceiro está undefined!');
                  alert(t('businessPartners.card.errors.idNotFound', 'Erro: ID do parceiro não encontrado'));
                  return;
                }
                onDelete(partner.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={t('businessPartners.card.actions.delete', 'Excluir')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(partner.type)}`}>
            {getTypeLabel(partner.type)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
            {partner.status === 'active' ? t('businessPartners.view.statusLabel.active', 'Ativo') : t('businessPartners.view.statusLabel.inactive', 'Inativo')}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span>{partner.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{partner.phone}</span>
          </div>
          {primaryAddress && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{primaryAddress.city}, {primaryAddress.state}</span>
            </div>
          )}
        </div>

        {/* Primary Contact */}
        {primaryContact && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('businessPartners.card.labels.primaryContact', 'Contato Principal')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{primaryContact.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{primaryContact.position}</p>
          </div>
        )}

        {/* Stats */}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t('businessPartners.card.labels.contactsCount', '{{count}} contato(s)', { count: partner.contacts.length })}</span>
            <span>{t('businessPartners.card.labels.addressesCount', '{{count}} endereço(s)', { count: partner.addresses.length })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPartnerCard;