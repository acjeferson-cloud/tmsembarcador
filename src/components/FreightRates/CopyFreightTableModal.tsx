import React, { useState, useEffect } from 'react';
import { Copy, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Toast } from '../common/Toast';

interface CopyFreightTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FreightTable {
  id: string;
  nome: string;
  transportador_id: string;
  data_inicio: string;
  data_fim: string;
  carrier_name?: string;
}

interface Carrier {
  id: string;
  nome_fantasia: string;
  codigo: string;
}

export const CopyFreightTableModal: React.FC<CopyFreightTableModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [freightTables, setFreightTables] = useState<FreightTable[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    sourceTableId: '',
    targetCarrierId: '',
    newTableName: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        sourceTableId: '',
        targetCarrierId: '',
        newTableName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const { TenantContextHelper } = await import('../../utils/tenantContext');
      const ctx = await TenantContextHelper.getCurrentContext();

      let tablesQuery = supabase
        .from('freight_rate_tables')
        .select('id, nome, transportador_id, data_inicio, data_fim')
        .eq('status', 'ativo')
        .order('nome');

      if (ctx?.organizationId) {
        tablesQuery = tablesQuery.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        tablesQuery = tablesQuery.eq('environment_id', ctx.environmentId);
      }

      // Carregar tabelas de frete
      const { data: tables, error: tablesError } = await tablesQuery;

      if (tablesError) throw tablesError;

      // Carregar transportadores com filtros de tenant
      let carrierQuery = supabase
        .from('carriers')
        .select('id, nome_fantasia, codigo')
        .order('nome_fantasia');

      if (ctx?.organizationId) {
        carrierQuery = carrierQuery.eq('organization_id', ctx.organizationId);
      }
      if (ctx?.environmentId) {
        carrierQuery = carrierQuery.eq('environment_id', ctx.environmentId);
      }

      const { data: carriersData, error: carriersError } = await carrierQuery;
      if (carriersError) throw carriersError;

      const carrierMap = new Map(carriersData?.map(c => [c.id, c.nome_fantasia]) || []);

      const formattedTables = (tables || []).map(t => ({
        id: t.id,
        nome: t.nome,
        transportador_id: t.transportador_id,
        data_inicio: t.data_inicio,
        data_fim: t.data_fim,
        carrier_name: carrierMap.get(t.transportador_id) || 'Desconhecido'
      }));

      setFreightTables(formattedTables);
      setCarriers(carriersData || []);
    } catch (error) {

      setToast({
        message: 'Erro ao carregar dados',
        type: 'error'
      });
    }
  };

  const handleCopy = async () => {
    if (!formData.sourceTableId || !formData.targetCarrierId || !formData.newTableName) {
      setToast({
        message: 'Preencha todos os campos obrigatórios',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('copy_freight_rate_table', {
        source_table_id: formData.sourceTableId,
        target_carrier_id: formData.targetCarrierId,
        new_table_name: formData.newTableName,
        new_start_date: new Date(formData.startDate).toISOString(),
        new_end_date: new Date(formData.endDate).toISOString(),
        user_id_param: null
      });

      if (error) throw error;

      setToast({
        message: 'Tabela de frete copiada com sucesso!',
        type: 'success'
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {

      setToast({
        message: error.message || 'Erro ao copiar tabela de frete',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTable = freightTables.find(t => t.id === formData.sourceTableId);
  const selectedCarrier = carriers.find(c => c.id === formData.targetCarrierId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Copiar Tabela de Frete</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Duplicar tabela completa para outro transportador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">O que será copiado:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Todas as tarifas e suas configurações</li>
                <li>Faixas de peso, volume e valor</li>
                <li>Cidades atendidas</li>
                <li>Taxas adicionais (GRIS, Pedágio, TAS, etc)</li>
                <li>Itens restritos (se houver)</li>
              </ul>
            </div>
          </div>

          {/* Source Table */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tabela de Origem *
            </label>
            <select
              value={formData.sourceTableId}
              onChange={(e) => setFormData({ ...formData, sourceTableId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Selecione a tabela a ser copiada...</option>
              {freightTables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.nome} - {table.carrier_name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Carrier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transportador de Destino *
            </label>
            <select
              value={formData.targetCarrierId}
              onChange={(e) => setFormData({ ...formData, targetCarrierId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Selecione o transportador...</option>
              {carriers.map(carrier => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.codigo} - {carrier.nome_fantasia}
                </option>
              ))}
            </select>
          </div>

          {/* New Table Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Nova Tabela *
            </label>
            <input
              type="text"
              value={formData.newTableName}
              onChange={(e) => setFormData({ ...formData, newTableName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Tabela Padrão 2025 - Cópia"
              disabled={loading}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Summary */}
          {selectedTable && selectedCarrier && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Resumo da Cópia:</p>
                  <p>
                    <span className="font-semibold">{selectedTable.nome}</span>
                    {' '}→{' '}
                    <span className="font-semibold">{selectedCarrier.nome_fantasia}</span>
                  </p>
                  <p className="mt-1 text-green-700">
                    Nova tabela: {formData.newTableName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading || !formData.sourceTableId || !formData.targetCarrierId || !formData.newTableName}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Tabela
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
