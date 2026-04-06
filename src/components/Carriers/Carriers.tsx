import React, { useState, useEffect } from 'react';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Star, Phone, Mail, CreditCard as Edit, Trash2, Eye, DollarSign, ArrowLeft, Hash } from 'lucide-react';
import { carriersService, Carrier } from '../../services/carriersService';
import { CarrierForm } from './CarrierForm';
import { CarrierView } from './CarrierView';
import { FreightRateTablesList } from '../FreightRates/FreightRateTablesList';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';
import { useActivityLogger } from '../../hooks/useActivityLogger';

export const Carriers: React.FC = () => {
  const { t } = useTranslation();

  useActivityLogger('Transportadores', 'Acesso', 'Acessou a Gestão de Transportadores');

  const breadcrumbItems = [
    { label: t('menu.settings') },
    { label: t('carriers.pageTitle'), current: true }
  ];

  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showFreightRates, setShowFreightRates] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<any>(null);
  const [viewingCarrier, setViewingCarrier] = useState<any>(null);
  const [carriersList, setCarriersList] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; carrierId?: string }>({ isOpen: false });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      setIsLoading(true);
      const data = await carriersService.getAll();
      setCarriersList(data);
    } catch (error) {
      setToast({ message: t('carriers.messages.loadError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCarriers = carriersList.filter(carrier =>
    carrier.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (carrier.fantasia && carrier.fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
    carrier.cnpj.includes(searchTerm) ||
    (carrier.email && carrier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    carrier.codigo.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredCarriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedCarriers = filteredCarriers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 1;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={14}
            className="text-yellow-400 fill-current"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star size={14} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star size={14} className="text-yellow-400 fill-current" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={14}
            className="text-gray-300"
          />
        );
      }
    }
    return stars;
  };

  const handleNewCarrier = () => {
    setEditingCarrier(null);
    setShowForm(true);
  };

  const handleEditCarrier = (carrier: any) => {
    setEditingCarrier(carrier);
    setShowForm(true);
  };

  const handleViewCarrier = (carrier: any) => {
    setViewingCarrier(carrier);
    setShowView(true);
    setEditMode(false);
  };


  const handleViewFreightRates = (carrier: any) => {
    setViewingCarrier(carrier);
    setShowFreightRates(true);
  };

  const handleDeleteCarrier = (carrierId: string) => {
    setConfirmDialog({ isOpen: true, carrierId });
  };

  const confirmDelete = async () => {
    if (confirmDialog.carrierId) {
      try {
        const carrier = carriersList.find(c => c.id === confirmDialog.carrierId);
        const success = await carriersService.delete(confirmDialog.carrierId);
        if (success) {
          if (carrier) {
            await logDelete('carrier', confirmDialog.carrierId, carrier, 1, 'Administrador');
          }
          setToast({ message: t('carriers.messages.deleteSuccess'), type: 'success' });
          await loadCarriers();
        } else {
          setToast({ message: t('carriers.messages.deleteError'), type: 'error' });
        }
      } catch (error) {
        setToast({ message: t('carriers.messages.deleteError'), type: 'error' });
      }
    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSaveCarrier = async (carrierData: any) => {
    try {
      // Parse tolerances - remove R$ and convert to number
      const parseToleranceValue = (value: string | number | undefined | null) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
      };

      const parseTolerancePercent = (value: string | number | undefined | null) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const cleaned = value.replace(/[%\s]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
      };

      const normalizedData = {
        codigo: carrierData.codigo,
        razao_social: carrierData.razaoSocial,
        fantasia: carrierData.fantasia || null,
        logotipo: carrierData.logotipo || null,
        cnpj: carrierData.cnpj,
        inscricao_estadual: carrierData.inscricaoEstadual || null,
        pais_id: carrierData.pais && carrierData.pais.length === 36 ? carrierData.pais : null,
        estado_id: carrierData.estado && carrierData.estado.length === 36 ? carrierData.estado : null,
        cidade_id: carrierData.cidade && carrierData.cidade.length === 36 ? carrierData.cidade : null,
        logradouro: carrierData.logradouro || null,
        numero: carrierData.numero || null,
        complemento: carrierData.complemento || null,
        bairro: carrierData.bairro || null,
        cep: carrierData.cep || null,
        tolerancia_valor_cte: parseToleranceValue(carrierData.toleranciaValorCte),
        tolerancia_percentual_cte: parseTolerancePercent(carrierData.toleranciaPercentualCte),
        tolerancia_valor_fatura: parseToleranceValue(carrierData.toleranciaValorFatura),
        tolerancia_percentual_fatura: parseTolerancePercent(carrierData.toleranciaPercentualFatura),
        email: carrierData.email || null,
        phone: carrierData.phone || null,
        status: carrierData.status as 'ativo' | 'inativo',
        modal_rodoviario: carrierData.modalRodoviario || false,
        modal_aereo: carrierData.modalAereo || false,
        modal_aquaviario: carrierData.modalAquaviario || false,
        modal_ferroviario: carrierData.modalFerroviario || false,
        considera_sabado_util: carrierData.consideraSabadoUtil || false,
        considera_domingo_util: carrierData.consideraDomingoUtil || false,
        considera_feriados: carrierData.consideraFeriados || false,
        scope: carrierData.scope || 'ESTABLISHMENT',
      };
      if (editingCarrier) {
        const updated = await carriersService.update(editingCarrier.id, {
          ...normalizedData,
          updated_by: null,
        });
        if (updated) {
          await logUpdate('carrier', editingCarrier.id, editingCarrier, updated, 1, 'Administrador');
          setToast({ message: t('carriers.messages.saveSuccess'), type: 'success' });
        } else {
          setToast({ message: t('carriers.messages.saveError'), type: 'error' });
          return;
        }
      } else {
        const result = await carriersService.create({
          ...normalizedData,
          created_by: null,
        });
        if (result) {
          await logCreate('carrier', result.id, result, 1, 'Administrador');
        }
        setToast({ message: t('carriers.messages.saveSuccess'), type: 'success' });
      }

      setShowForm(false);
      setEditingCarrier(null);
      await loadCarriers();
    } catch (error: any) {
      // Mensagem de erro mais detalhada
      const errorMessage = error?.message || '';
      setToast({
        message: errorMessage ? `${t('carriers.messages.saveError')} ${errorMessage}` : t('carriers.messages.saveError'),
        type: 'error'
      });
    }
  };

  const handleBackToList = () => {
    setShowForm(false);
    setShowView(false);
    setShowFreightRates(false);
    setEditingCarrier(null);
    setViewingCarrier(null);
    setEditMode(false);
  };

  if (showForm) {
    return (
      <CarrierForm
        onBack={handleBackToList}
        onSave={handleSaveCarrier}
        carrier={editingCarrier}
      />
    );
  }

  if (showView) {
    return (
      <CarrierView
        onBack={handleBackToList}
        onEdit={() => {
          setShowView(false);
          handleEditCarrier(viewingCarrier);
        }}
        carrier={viewingCarrier}
      />
    );
  }

  if (showFreightRates) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>{t('carriers.backToCarriers')}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('carriers.freightRates.title')} - {viewingCarrier.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('carriers.freightRates.manageTables')}</p>
        </div>
        
        <FreightRateTablesList 
          carrierId={viewingCarrier.id} 
          isEdit={editMode}
          carrierName={viewingCarrier.name} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('carriers.form.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('carriers.subtitle')}</p>
        </div>
        <button 
          onClick={handleNewCarrier}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>{t('carriers.newCarrier')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('carriers.searchPlaceholderExtended')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carriers Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedCarriers.map((carrier) => (
          <div key={carrier.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{carrier.fantasia || carrier.razao_social}</h3>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded">
                    {carrier.codigo}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-0.5">
                      {renderStars(carrier.nps_interno || 0)}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                      {(carrier.nps_interno || 0).toFixed(1)} (Interna)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-0.5">
                      {renderStars(carrier.nps_externo || 0)}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                      {(carrier.nps_externo || 0).toFixed(1)} (Externa)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handleViewCarrier(carrier)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  title={t('carriers.viewAction')}
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => handleEditCarrier(carrier)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1 rounded hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                  title={t('carriers.editAction')}
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteCarrier(carrier.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title={t('carriers.deleteAction')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Logo placeholder - would show actual logo if uploaded */}
            <div className="mb-4 flex justify-center">
              {carrier.logotipo ? (
                <img
                  src={carrier.logotipo}
                  alt={`Logo ${carrier.fantasia || carrier.razao_social}`}
                  className="w-16 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Logo</span>
                </div>
              )}
            </div>

            {/* Transport Modals */}
            {(carrier.modal_rodoviario || carrier.modal_aereo || carrier.modal_aquaviario || carrier.modal_ferroviario) && (
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">{t('carriers.form.modals.attended')}</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {carrier.modal_rodoviario && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200" title={t('carriers.form.modals.rodoviario')}>
                      <span className="mr-1">🚛</span>
                      {t('carriers.form.modals.rodoviario')}
                    </div>
                  )}
                  {carrier.modal_aereo && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs font-medium border border-sky-200" title={t('carriers.form.modals.aereo')}>
                      <span className="mr-1">✈️</span>
                      {t('carriers.form.modals.aereo')}
                    </div>
                  )}
                  {carrier.modal_aquaviario && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium border border-cyan-200" title={t('carriers.form.modals.aquaviario')}>
                      <span className="mr-1">🚢</span>
                      {t('carriers.form.modals.aquaviario')}
                    </div>
                  )}
                  {carrier.modal_ferroviario && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200" title={t('carriers.form.modals.ferroviario')}>
                      <span className="mr-1">🚂</span>
                      {t('carriers.form.modals.ferroviario')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Hash size={14} />
                <span># {carrier.codigo}</span>
              </div>
              <p><strong>CNPJ:</strong> {carrier.cnpj}</p>
              <div className="flex items-center space-x-2">
                <Phone size={14} />
                <span>{carrier.phone || t('carriers.form.notInformed')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} />
                <span>{carrier.email || t('carriers.form.notInformed')}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('carriers.view.activeShipments')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white ml-1">{carrier.active_shipments || 0}</span>
                </div>
                <div className="text-right">
                  <div className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${carrier.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  `}>
                    {carrier.status === 'ativo' ? t('carriers.form.status.active') : t('carriers.form.status.inactive')}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleViewFreightRates(carrier)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 text-sm"
              >
                <DollarSign size={16} />
                <span>{t('carriers.freightRates.title')}</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCarriers.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('carriers.form.emptyState.title')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('carriers.form.emptyState.subtitle')}</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('carriers.pagination.showing', {
                start: startIndex + 1,
                end: Math.min(startIndex + itemsPerPage, filteredCarriers.length),
                total: filteredCarriers.length
              })}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('carriers.pagination.previous', 'Anterior')}
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('carriers.pagination.next', 'Próximo')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={t('carriers.delete.title')}
          message={t('carriers.delete.message', { name: carriersList.find(c => c.id === confirmDialog.carrierId)?.fantasia || carriersList.find(c => c.id === confirmDialog.carrierId)?.razao_social || 'este transportador' })}
          confirmText={t('carriers.delete.confirm')}
          cancelText={t('carriers.delete.cancel')}
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};
