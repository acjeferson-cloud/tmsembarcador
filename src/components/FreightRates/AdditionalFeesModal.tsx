import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, DollarSign, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { additionalFeesService, AdditionalFee } from '../../services/additionalFeesService';
import { businessPartnersService } from '../../services/businessPartnersService';
import { statesService } from '../../services/statesService';
import { fetchCities } from '../../services/citiesService';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AdditionalFeesModalProps {
  freightRateTableId: string;
  freightRateTableName: string;
  onClose: () => void;
}

interface BusinessPartner {
  id: string;
  name: string;
  document: string;
}

interface State {
  id: string;
  name: string;
  abbreviation: string;
}

interface City {
  id: string;
  name: string;
}

const CityName: React.FC<{ cityId: string | null; stateId: string | null }> = ({ cityId, stateId }) => {
  const { t } = useTranslation();
  const [cityName, setCityName] = useState<string>(t('carriers.freightRates.additionalFees.loading'));

  useEffect(() => {
    if (!cityId || !stateId) {
      setCityName(t('carriers.freightRates.additionalFees.allCities'));
      return;
    }

    const loadCity = async () => {
      try {
        const result = await fetchCities(1, 1, { searchTerm: cityId });
        if (result.cities.length > 0) {
          setCityName(result.cities[0].name);
        } else {
          setCityName('N/A');
        }
      } catch (error) {
        setCityName('N/A');
      }
    };

    loadCity();
  }, [cityId, stateId, t]);

  return <>{cityName}</>;
};

export const AdditionalFeesModal: React.FC<AdditionalFeesModalProps> = ({
  freightRateTableId,
  freightRateTableName,
  onClose,
}) => {
  const { t } = useTranslation();
  const [fees, setFees] = useState<AdditionalFee[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFee, setEditingFee] = useState<AdditionalFee | null>(null);
  const [loading, setLoading] = useState(true);

  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; feeId?: string }>({ isOpen: false });

  const [formData, setFormData] = useState({
    fee_type: 'TDA' as 'TDA' | 'TDE' | 'TRT' | 'TEC',
    business_partner_id: '',
    consider_cnpj_root: false,
    state_id: '',
    city_id: '',
    fee_value: 0,
    value_type: 'fixed' as 'fixed' | 'percent_weight' | 'percent_value' | 'percent_weight_value' | 'percent_cte',
    minimum_value: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      // Load fees
      const feesData = await additionalFeesService.getByFreightRateTable(freightRateTableId);
      setFees(feesData || []);

      // Load business partners
      const bpData = await businessPartnersService.getAll();
      setBusinessPartners(bpData || []);

      // Load states
      const statesData = await statesService.getAll();
      setStates(statesData || []);

    } catch (error) {
      setFees([]);
      setBusinessPartners([]);
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.state_id) {
      loadCities(formData.state_id);
    } else {
      setCities([]);
      setFormData(prev => ({ ...prev, city_id: '' }));
    }
  }, [formData.state_id]);

  const loadCities = async (stateId: string) => {
    try {
      const state = states.find(s => s.id === stateId);
      if (state) {
        const result = await fetchCities(1, 1000, { stateFilter: state.abbreviation });
        setCities(result.cities.map(c => ({ id: c.ibgeCode, name: c.name })));
      }
    } catch (error) {
      setCities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        business_partner_id: formData.business_partner_id?.trim() || null,
        state_id: formData.state_id?.trim() || null,
        city_id: formData.city_id?.trim() || null,
      };


      if (editingFee) {
        await additionalFeesService.update(editingFee.id, dataToSave);
        setToast({ message: t('carriers.freightRates.additionalFees.updateSuccess'), type: 'success' });
      } else {
        const feeToCreate = {
          freight_rate_table_id: freightRateTableId,
          freight_rate_id: null,
          ...dataToSave,
        };
        await additionalFeesService.create(feeToCreate);
        setToast({ message: t('carriers.freightRates.additionalFees.saveSuccess'), type: 'success' });
      }

      await loadData();
      resetForm();
    } catch (error) {
      setToast({ message: `${t('carriers.freightRates.additionalFees.saveError')}: ${error instanceof Error ? error.message : 'Tente novamente'}`, type: 'error' });
    }
  };

  const handleEdit = (fee: AdditionalFee) => {
    setEditingFee(fee);
    setFormData({
      fee_type: fee.fee_type,
      business_partner_id: fee.business_partner_id || '',
      consider_cnpj_root: fee.consider_cnpj_root,
      state_id: fee.state_id || '',
      city_id: fee.city_id || '',
      fee_value: fee.fee_value,
      value_type: fee.value_type,
      minimum_value: fee.minimum_value,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({ isOpen: true, feeId: id });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.feeId) return;

    try {
      await additionalFeesService.delete(confirmDialog.feeId);
      setToast({ message: t('carriers.freightRates.additionalFees.deleteSuccess'), type: 'success' });
      await loadData();
    } catch (error) {
      setToast({ message: t('carriers.freightRates.additionalFees.deleteError'), type: 'error' });
    } finally {
      setConfirmDialog({ isOpen: false });
    }
  };

  const resetForm = () => {
    setFormData({
      fee_type: 'TDA',
      business_partner_id: '',
      consider_cnpj_root: false,
      state_id: '',
      city_id: '',
      fee_value: 0,
      value_type: 'fixed',
      minimum_value: 0,
    });
    setEditingFee(null);
    setIsEditing(false);
  };

  const getFeeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TDA: t('carriers.freightRates.additionalFees.tda'),
      TDE: t('carriers.freightRates.additionalFees.tde'),
      TRT: t('carriers.freightRates.additionalFees.trt'),
      TEC: t('carriers.freightRates.additionalFees.tec'),
    };
    return types[type] || type;
  };

  const getValueTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      fixed: t('carriers.freightRates.additionalFees.fixedShort'),
      percent_weight: t('carriers.freightRates.additionalFees.pctWeightShort'),
      percent_value: t('carriers.freightRates.additionalFees.pctValueShort'),
      percent_weight_value: t('carriers.freightRates.additionalFees.pctWeightValueShort'),
      percent_cte: t('carriers.freightRates.additionalFees.pctCteShort'),
    };
    return types[type] || type;
  };

  const getValueTypeFullLabel = (type: string) => {
    const types: Record<string, string> = {
      fixed: t('carriers.freightRates.additionalFees.fixed'),
      percent_weight: t('carriers.freightRates.additionalFees.percentWeight'),
      percent_value: t('carriers.freightRates.additionalFees.percentValue'),
      percent_weight_value: t('carriers.freightRates.additionalFees.percentWeightValue'),
      percent_cte: t('carriers.freightRates.additionalFees.percentCte'),
    };
    return types[type] || type;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="text-white" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">{t('carriers.freightRates.additionalFees.title')}</h2>
              <p className="text-orange-100 text-sm">{freightRateTableName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-800 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6 bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingFee ? t('carriers.freightRates.additionalFees.editFee') : t('carriers.freightRates.additionalFees.newFee')}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200"
                >
                  {t('carriers.freightRates.additionalFees.cancel')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.fee')} *
                  </label>
                  <select
                    value={formData.fee_type}
                    onChange={(e) => setFormData({ ...formData, fee_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="TDA">{t('carriers.freightRates.additionalFees.tda')}</option>
                    <option value="TDE">{t('carriers.freightRates.additionalFees.tde')}</option>
                    <option value="TRT">{t('carriers.freightRates.additionalFees.trt')}</option>
                    <option value="TEC">{t('carriers.freightRates.additionalFees.tec')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.businessPartner')} <span className="text-gray-400 text-xs">{t('carriers.freightRates.additionalFees.optional')}</span>
                  </label>
                  <select
                    value={formData.business_partner_id}
                    onChange={(e) => setFormData({ ...formData, business_partner_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('carriers.freightRates.additionalFees.allPartners')}</option>
                    {businessPartners.length === 0 ? (
                      <option value="" disabled>{t('carriers.freightRates.additionalFees.noPartners')}</option>
                    ) : (
                      businessPartners.map((bp) => (
                        <option key={bp.id} value={bp.id}>
                          {bp.name} - {bp.document}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {formData.business_partner_id && (
                  <div className="col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consider_cnpj_root}
                        onChange={(e) => setFormData({ ...formData, consider_cnpj_root: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('carriers.freightRates.additionalFees.considerCnpjRoot')}
                      </span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.state')} <span className="text-gray-400 text-xs">{t('carriers.freightRates.additionalFees.optional')}</span>
                  </label>
                  <select
                    value={formData.state_id}
                    onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('carriers.freightRates.additionalFees.allStates')}</option>
                    {states.length === 0 ? (
                      <option value="" disabled>{t('carriers.freightRates.additionalFees.noStates')}</option>
                    ) : (
                      states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.abbreviation} - {state.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.city')} <span className="text-gray-400 text-xs">{t('carriers.freightRates.additionalFees.optional')}</span>
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.state_id}
                  >
                    <option value="">{!formData.state_id ? t('carriers.freightRates.additionalFees.selectStateFirst') : t('carriers.freightRates.additionalFees.allCities')}</option>
                    {cities.length === 0 && formData.state_id ? (
                      <option value="" disabled>{t('carriers.freightRates.additionalFees.noCities')}</option>
                    ) : (
                      cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.valueType')} *
                  </label>
                  <select
                    value={formData.value_type}
                    onChange={(e) => setFormData({ ...formData, value_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="fixed">{getValueTypeFullLabel('fixed')}</option>
                    <option value="percent_weight">{getValueTypeFullLabel('percent_weight')}</option>
                    <option value="percent_value">{getValueTypeFullLabel('percent_value')}</option>
                    <option value="percent_weight_value">{getValueTypeFullLabel('percent_weight_value')}</option>
                    <option value="percent_cte">{getValueTypeFullLabel('percent_cte')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.feeValue')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fee_value}
                    onChange={(e) => setFormData({ ...formData, fee_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('carriers.freightRates.additionalFees.minimumValue')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_value}
                    onChange={(e) => setFormData({ ...formData, minimum_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
                >
                  {t('carriers.freightRates.additionalFees.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingFee ? t('carriers.freightRates.additionalFees.update') : t('carriers.freightRates.additionalFees.add')}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('carriers.freightRates.additionalFees.registeredFees')} ({fees.length})
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>{t('carriers.freightRates.additionalFees.newFee')}</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">{t('carriers.freightRates.additionalFees.loading')}</p>
                </div>
              ) : fees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.fee')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.partner')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.state')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.city')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.type')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.value')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.minimum')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('carriers.freightRates.additionalFees.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                      {fees.map((fee) => {
                        const bp = businessPartners.find(b => b.id === fee.business_partner_id);
                        const state = states.find(s => s.id === fee.state_id);

                        return (
                          <tr key={fee.id} className="hover:bg-gray-50 dark:bg-gray-900">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {getFeeTypeLabel(fee.fee_type)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                {bp?.name || t('carriers.freightRates.additionalFees.all')}
                                {fee.consider_cnpj_root && (
                                  <div className="flex items-center space-x-1 text-xs text-blue-600 mt-1">
                                    <CheckSquare size={12} />
                                    <span>{t('carriers.freightRates.additionalFees.cnpjRoot')}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{state?.abbreviation || t('carriers.freightRates.additionalFees.all')}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {fee.city_id ? <CityName cityId={fee.city_id} stateId={fee.state_id} /> : t('carriers.freightRates.additionalFees.allCities')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {getValueTypeLabel(fee.value_type)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(fee.fee_value)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(fee.minimum_value)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(fee)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title={t('carriers.freightRates.additionalFees.edit')}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(fee.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title={t('carriers.freightRates.additionalFees.delete')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <DollarSign size={64} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('carriers.freightRates.additionalFees.noFeesRegistered')}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{t('carriers.freightRates.additionalFees.feesApplyToAll')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('carriers.freightRates.additionalFees.configureSpecificFees')}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 shadow-md"
                  >
                    <Plus size={16} />
                    <span>{t('carriers.freightRates.additionalFees.addFee')}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            {t('carriers.freightRates.additionalFees.close')}
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

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={true}
          title={t('carriers.freightRates.additionalFees.confirmDeleteTitle')}
          message={t('carriers.freightRates.additionalFees.confirmDeleteMessage')}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
