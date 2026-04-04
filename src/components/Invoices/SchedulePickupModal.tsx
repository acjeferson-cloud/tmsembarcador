import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Package, Weight, Mail, Link as LinkIcon, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { pickupSchedulingService } from '../../services/pickupSchedulingService';
import { useAuth } from '../../hooks/useAuth';

interface SchedulePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoices: any[];
  onSuccess: () => void;
  establishmentId?: string;
}

export const SchedulePickupModal: React.FC<SchedulePickupModalProps> = ({
  isOpen,
  onClose,
  selectedInvoices,
  onSuccess,
  establishmentId
}) => {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [carrierEmail, setCarrierEmail] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const totals = selectedInvoices.reduce((acc, invoice) => {
    acc.weight += parseFloat(invoice.peso_bruto || 0);
    acc.volumes += parseInt(invoice.quantidade_volumes || 0);
    acc.value += parseFloat(invoice.valor_total || 0);
    return acc;
  }, { weight: 0, volumes: 0, value: 0 });

  const handleSchedule = async () => {
    if (!carrierEmail) {
      setError(t('invoices.modals.schedulePickup.errorEmail'));
      return;
    }

    if (!carrierEmail.includes('@')) {
      setError(t('invoices.modals.schedulePickup.errorInvalidEmail'));
      return;
    }

    if (selectedInvoices.length === 0) {
      setError(t('invoices.modals.common.errorSelectInvoice'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const estabId = establishmentId || selectedInvoices[0]?.establishment_id;

      if (!estabId) {
        setError(t('invoices.modals.common.errorEstNotFound'));
        setIsLoading(false);
        return;
      }

      const result = await pickupSchedulingService.createScheduling({
        establishment_id: estabId,
        carrier_email: carrierEmail,
        invoice_ids: selectedInvoices.map(inv => inv.id),
        created_by: user?.supabaseUser?.id,
        expires_in_hours: expiresInHours
      });

      if (result.success && result.data) {
        const link = pickupSchedulingService.generatePublicLink(result.data.token);
        setGeneratedLink(link);

        await sendEmailToCarrier(link);
      } else {
        setError(result.error || t('invoices.modals.schedulePickup.errorCreate'));
      }
    } catch (err: any) {
      setError(err.message || t('invoices.modals.schedulePickup.errorProcess'));
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailToCarrier = async (link: string) => {
  };

  const copyToClipboard = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      } catch (err) {
// console.error('Erro ao copiar link:', err);
      }
    }
  };

  const handleClose = () => {
    if (generatedLink) {
      onSuccess();
    }
    onClose();
    setCarrierEmail('');
    setExpiresInHours(72);
    setGeneratedLink(null);
    setError(null);
    setLinkCopied(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {generatedLink ? t('invoices.modals.schedulePickup.titleCreated') : t('invoices.modals.schedulePickup.title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!generatedLink ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                  {t('invoices.modals.common.summaryTitle')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{t('invoices.modals.common.volumes')}</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {totals.volumes}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Weight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{t('invoices.modals.common.totalWeight')}</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {totals.weight.toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{t('invoices.modals.common.nfs')}</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                        {selectedInvoices.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t('invoices.modals.common.invoice')}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t('invoices.modals.common.recipient')}
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t('invoices.modals.common.weight')}
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t('invoices.modals.common.volumes')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedInvoices.map((invoice, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {invoice.numero_nfe}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {invoice.destinatario_nome}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                            {parseFloat(invoice.peso_bruto || 0).toFixed(2)} kg
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                            {invoice.quantidade_volumes || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('invoices.modals.schedulePickup.carrierEmail')} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={carrierEmail}
                      onChange={(e) => setCarrierEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="transportadora@email.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('invoices.modals.schedulePickup.emailHint')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('invoices.modals.schedulePickup.linkValidity')}
                  </label>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={24}>{t('invoices.modals.schedulePickup.validity24')}</option>
                    <option value={48}>{t('invoices.modals.schedulePickup.validity48')}</option>
                    <option value={72}>{t('invoices.modals.schedulePickup.validity72')}</option>
                    <option value={120}>{t('invoices.modals.schedulePickup.validity120')}</option>
                    <option value={168}>{t('invoices.modals.schedulePickup.validity168')}</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSchedule}
                  disabled={isLoading || !carrierEmail}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={20} />
                  <span>{isLoading ? t('invoices.modals.common.processing') : t('invoices.modals.schedulePickup.createBtn')}</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('invoices.modals.common.cancel')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center py-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('invoices.modals.schedulePickup.createdSuccess')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('invoices.modals.schedulePickup.linkSentTo')} <strong>{carrierEmail}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-2">
                  <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('invoices.modals.schedulePickup.bookingLink')}:
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white break-all font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                      {generatedLink}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy size={16} />
                  <span>{linkCopied ? t('invoices.modals.schedulePickup.linkCopiedBtn') : t('invoices.modals.schedulePickup.copyLinkBtn')}</span>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">{t('invoices.modals.schedulePickup.nextSteps')}:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>{t('invoices.modals.schedulePickup.step1')}</li>
                      <li>{t('invoices.modals.schedulePickup.step2')}</li>
                      <li>{t('invoices.modals.schedulePickup.step3')}</li>
                      <li>{t('invoices.modals.schedulePickup.step4', { hours: expiresInHours })}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('invoices.modals.common.close')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
