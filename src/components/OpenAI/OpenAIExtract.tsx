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
  Cpu,
  Zap
} from 'lucide-react';
import {
  openaiTransactionsService,
  OpenAITransaction,
  TransactionFilters,
  TransactionSummary
} from '../../services/openaiTransactionsService';
import { useTranslation } from 'react-i18next';

interface OpenAIExtractProps {
  disabled?: boolean;
}

export const OpenAIExtract: React.FC<OpenAIExtractProps> = ({ disabled = false }) => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<OpenAITransaction[]>([]);
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
        openaiTransactionsService.getTransactions(filters),
        openaiTransactionsService.getTransactionSummary(filters)
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
    const filename = `extrato-openai-${filters.startDate}-${filters.endDate}.csv`;
    openaiTransactionsService.downloadCSV(transactions, filename);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('openai.extractPage.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('openai.extractPage.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={disabled}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Filter className="w-4 h-4" />
            {t('openai.extractPage.filters')}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0 || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('openai.extractPage.exportCSV')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('openai.extractPage.filters')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('openai.extractPage.startDate')}
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
                {t('openai.extractPage.endDate')}
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
                {t('openai.extractPage.model')}
              </label>
              <select
                value={filters.model || ''}
                onChange={(e) => handleFilterChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('openai.extractPage.all')}</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="text-embedding-ada-002">Ada Embeddings</option>
                <option value="dall-e-3">DALL-E 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('openai.extractPage.requestType')}
              </label>
              <select
                value={filters.requestType || ''}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('openai.extractPage.all')}</option>
                <option value="chat_completion">{t('openai.extractPage.requestTypes.chat_completion')}</option>
                <option value="completion">{t('openai.extractPage.requestTypes.completion')}</option>
                <option value="embedding">{t('openai.extractPage.requestTypes.embedding')}</option>
                <option value="image_generation">{t('openai.extractPage.requestTypes.image_generation')}</option>
                <option value="audio_transcription">{t('openai.extractPage.requestTypes.audio_transcription')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('openai.extractPage.status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('openai.extractPage.all')}</option>
                <option value="sucesso">{t('openai.extractPage.statusOptions.sucesso')}</option>
                <option value="erro">{t('openai.extractPage.statusOptions.erro')}</option>
                <option value="timeout">{t('openai.extractPage.statusOptions.timeout')}</option>
                <option value="limite_excedido">{t('openai.extractPage.statusOptions.limite_excedido')}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleApplyFilters}
              disabled={disabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('openai.extractPage.applyFilters')}
            </button>
            <button
              onClick={handleClearFilters}
              disabled={disabled}
              className="px-4 py-2 bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('openai.extractPage.clearFilters')}
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('openai.extractPage.summary.totalRequests')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.totalTransactions}
                </p>
              </div>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('openai.extractPage.summary.totalTokens')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(summary.totalTokens)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('openai.extractPage.summary.totalCost')}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('openai.extractPage.summary.successRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.successRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
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
                  {t('openai.extractPage.table.datetime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.model')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.tokens')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.value')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('openai.extractPage.table.time')}
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
                    <p className="text-gray-600 dark:text-gray-400">{t('openai.extractPage.empty')}</p>
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {openaiTransactionsService.getModelLabel(transaction.model)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {t(`openai.extractPage.requestTypes.${transaction.request_type}`, transaction.request_type.replace('_', ' '))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('openai.extractPage.table.promptAndCompletion', { prompt: formatNumber(transaction.prompt_tokens), completion: formatNumber(transaction.completion_tokens) })}
                        </div>
                        <div className="font-medium">
                          {t('openai.extractPage.table.total')}: {formatNumber(transaction.total_tokens)}
                        </div>
                      </div>
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
                          {t(`openai.extractPage.statusOptions.${transaction.status}`, transaction.status)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">{t('openai.extractPage.footer.totalTransactions', { count: transactions.length })}</span>
            </div>
            <div className="text-center">
              <span>{t('openai.extractPage.footer.totalTokens')} <strong>{formatNumber(summary?.totalTokens || 0)}</strong></span>
            </div>
            <div className="text-right">
              <span>{t('openai.extractPage.footer.totalCost')} <strong>R$ {summary?.totalCost.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
