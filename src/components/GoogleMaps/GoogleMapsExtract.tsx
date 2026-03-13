import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MapPin,
  Zap
} from 'lucide-react';
import {
  googleMapsTransactionsService,
  GoogleMapsTransaction,
  TransactionFilters,
  TransactionSummary
} from '../../services/googleMapsTransactionsService';
import { useTranslation } from 'react-i18next';

export const GoogleMapsExtract: React.FC = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<GoogleMapsTransaction[]>([]);
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
        googleMapsTransactionsService.getTransactions(filters),
        googleMapsTransactionsService.getTransactionSummary(filters)
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
    const filename = `extrato-google-maps-${filters.startDate}-${filters.endDate}.csv`;
    googleMapsTransactionsService.downloadCSV(transactions, filename);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'erro':
      case 'invalido':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'limite_excedido':
        return <XCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      sucesso: 'bg-green-100 text-green-700',
      erro: 'bg-red-100 text-red-700',
      timeout: 'bg-orange-100 text-orange-700',
      limite_excedido: 'bg-yellow-100 text-yellow-700',
      invalido: 'bg-gray-100 text-gray-700'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('googleMaps.extractConsumo.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('googleMaps.extractConsumo.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('googleMaps.extractConsumo.filtersBtn')}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('googleMaps.extractConsumo.exportCsv')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('googleMaps.extractConsumo.filters.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('googleMaps.extractConsumo.filters.startDate')}
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
                {t('googleMaps.extractConsumo.filters.endDate')}
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
                {t('googleMaps.extractConsumo.filters.serviceType')}
              </label>
              <select
                value={filters.serviceType || ''}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('googleMaps.extractConsumo.filters.all')}</option>
                <option value="geocoding">{t('googleMaps.extractConsumo.serviceTypes.geocoding')}</option>
                <option value="distance_matrix">{t('googleMaps.extractConsumo.serviceTypes.distance_matrix')}</option>
                <option value="directions">{t('googleMaps.extractConsumo.serviceTypes.directions')}</option>
                <option value="autocomplete">{t('googleMaps.extractConsumo.serviceTypes.autocomplete')}</option>
                <option value="places">{t('googleMaps.extractConsumo.serviceTypes.places')}</option>
                <option value="elevation">{t('googleMaps.extractConsumo.serviceTypes.elevation')}</option>
                <option value="timezone">{t('googleMaps.extractConsumo.serviceTypes.timezone')}</option>
                <option value="static_map">{t('googleMaps.extractConsumo.serviceTypes.static_map')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('googleMaps.extractConsumo.filters.status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('googleMaps.extractConsumo.filters.all')}</option>
                <option value="sucesso">{t('googleMaps.extractConsumo.statuses.sucesso')}</option>
                <option value="erro">{t('googleMaps.extractConsumo.statuses.erro')}</option>
                <option value="timeout">{t('googleMaps.extractConsumo.statuses.timeout')}</option>
                <option value="limite_excedido">{t('googleMaps.extractConsumo.statuses.limite_excedido')}</option>
                <option value="invalido">{t('googleMaps.extractConsumo.statuses.invalido')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('googleMaps.extractConsumo.filters.apply')}
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
            >
              {t('googleMaps.extractConsumo.filters.clear')}
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('googleMaps.extractConsumo.summary.totalRequests')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.totalTransactions}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('googleMaps.extractConsumo.summary.totalCost')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('googleMaps.extractConsumo.summary.successRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.successRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('googleMaps.extractConsumo.summary.avgTime')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.avgResponseTime}ms
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
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
                  {t('googleMaps.extractConsumo.table.dateTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.service')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.origin')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.destination')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.value')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('googleMaps.extractConsumo.table.time')}
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
                    <p className="text-gray-600 dark:text-gray-400">{t('googleMaps.extractConsumo.table.noTransactions')}</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(transaction.transaction_date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {t(`googleMaps.extractConsumo.serviceTypes.${transaction.service_type}`, googleMapsTransactionsService.getServiceLabel(transaction.service_type))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {transaction.origin || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {transaction.destination || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(transaction as any).users?.nome || '-'}
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
                          {t(`googleMaps.extractConsumo.statuses.${transaction.status}`, transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.response_time_ms ? `${transaction.response_time_ms}ms` : '-'}
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
            <span>{t('googleMaps.extractConsumo.footer.totalDisplayed', { count: transactions.length })}</span>
            <span>
              {t('googleMaps.extractConsumo.footer.totalCostPeriod')} <strong>R$ {summary?.totalCost.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
