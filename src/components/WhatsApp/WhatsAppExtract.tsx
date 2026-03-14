import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import {
  whatsappTransactionsService,
  WhatsAppTransaction,
  TransactionFilters,
  TransactionSummary
} from '../../services/whatsappTransactionsService';

import { useTranslation } from 'react-i18next';

export const WhatsAppExtract: React.FC = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<WhatsAppTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const [transactionsData, summaryData] = await Promise.all([
        whatsappTransactionsService.getTransactions(filters),
        whatsappTransactionsService.getTransactionSummary(filters)
      ]);
      setTransactions(transactionsData);
      setSummary(summaryData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleApplyFilters = () => {
    loadTransactions();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleExportCSV = () => {
    const filename = `extrato-whatsapp-${filters.startDate}-${filters.endDate}.csv`;
    whatsappTransactionsService.downloadCSV(transactions, filename);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregue':
      case 'lida':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'falha':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'enviada':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      enviada: 'bg-blue-100 text-blue-700',
      entregue: 'bg-green-100 text-green-700',
      lida: 'bg-green-200 text-green-800',
      falha: 'bg-red-100 text-red-700',
      pendente: 'bg-yellow-100 text-yellow-700'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      texto: t('whatsapp.extract.filters.messageOptions.text'),
      imagem: t('whatsapp.extract.filters.messageOptions.image'),
      template: t('whatsapp.extract.filters.messageOptions.template'),
      documento: t('whatsapp.extract.filters.messageOptions.document'),
      audio: t('whatsapp.extract.filters.messageOptions.audio'),
      video: t('whatsapp.extract.filters.messageOptions.video'),
      localizacao: t('whatsapp.extract.filters.messageOptions.location')
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('whatsapp.extract.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('whatsapp.extract.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('whatsapp.extract.buttons.filters')}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('whatsapp.extract.buttons.export')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('whatsapp.extract.filters.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('whatsapp.extract.filters.startDate')}
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('whatsapp.extract.filters.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('whatsapp.extract.filters.transactionType')}
              </label>
              <select
                value={filters.transactionType || ''}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('whatsapp.extract.filters.transactionOptions.all')}</option>
                <option value="envio">{t('whatsapp.extract.filters.transactionOptions.send')}</option>
                <option value="recebimento">{t('whatsapp.extract.filters.transactionOptions.receive')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('whatsapp.extract.filters.messageType')}
              </label>
              <select
                value={filters.messageType || ''}
                onChange={(e) => handleFilterChange('messageType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('whatsapp.extract.filters.messageOptions.all')}</option>
                <option value="texto">{t('whatsapp.extract.filters.messageOptions.text')}</option>
                <option value="imagem">{t('whatsapp.extract.filters.messageOptions.image')}</option>
                <option value="template">{t('whatsapp.extract.filters.messageOptions.template')}</option>
                <option value="documento">{t('whatsapp.extract.filters.messageOptions.document')}</option>
                <option value="audio">{t('whatsapp.extract.filters.messageOptions.audio')}</option>
                <option value="video">{t('whatsapp.extract.filters.messageOptions.video')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('whatsapp.extract.filters.status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('whatsapp.extract.filters.statusOptions.all')}</option>
                <option value="enviada">{t('whatsapp.extract.filters.statusOptions.sent')}</option>
                <option value="entregue">{t('whatsapp.extract.filters.statusOptions.delivered')}</option>
                <option value="lida">{t('whatsapp.extract.filters.statusOptions.read')}</option>
                <option value="falha">{t('whatsapp.extract.filters.statusOptions.failed')}</option>
                <option value="pendente">{t('whatsapp.extract.filters.statusOptions.pending')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('whatsapp.extract.summary.totalMessages')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.totalTransactions}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('whatsapp.extract.summary.totalCost')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  R$ {summary.totalCost.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('whatsapp.extract.summary.sentMessages')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.bySentType.envio || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('whatsapp.extract.summary.receivedMessages')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.bySentType.recebimento || 0}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.message')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.recipient')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.phone')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.value')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('whatsapp.extract.table.template')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t('whatsapp.extract.table.noTransactions')}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(transaction.transaction_date).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'envio'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {transaction.transaction_type === 'envio' 
                          ? t('whatsapp.extract.filters.transactionOptions.send') 
                          : t('whatsapp.extract.filters.transactionOptions.receive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getTypeLabel(transaction.message_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.recipient_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.recipient_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      R$ {Number(transaction.unit_cost).toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            transaction.status
                          )}`}
                        >
                          {t(`whatsapp.extract.filters.statusOptions.${transaction.status}`) || transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.template_name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{t('whatsapp.extract.table.totalDisplayed', { count: transactions.length })}</span>
            <span>
              {t('whatsapp.extract.table.periodCost')} <strong>R$ {summary?.totalCost.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
