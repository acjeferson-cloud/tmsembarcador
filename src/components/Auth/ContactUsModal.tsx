import React from 'react';
import { X, Mail, Phone, MessageCircle, Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5512996489573?text=Olá, preciso de ajuda com o sistema TMS', '_blank');
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:suporte@logaxis.com.br?subject=Solicitação de Suporte';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+551140004000';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('login.contactUsTitle')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('login.contactUsDescription')}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-green-50 hover:border-green-500 transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <MessageCircle className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 dark:text-white">WhatsApp</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">(12) 99648-9573</p>
            </div>
          </button>

          <button
            onClick={handleEmailClick}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Mail className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 dark:text-white">E-mail</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">suporte@logaxis.com.br</p>
            </div>
          </button>

          <button
            onClick={handlePhoneClick}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 hover:border-orange-500 transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
              <Phone className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 dark:text-white">{t('login.phone')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">(11) 4000-4000</p>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('login.businessHours')}</p>
                <p>{t('login.businessHoursDetails')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('login.address')}</p>
                <p>São José dos Campos, SP - Brasil</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
