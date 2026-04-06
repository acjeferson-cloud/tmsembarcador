import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, ChevronLeft, ChevronRight, List, Map } from 'lucide-react';
import { BusinessPartner } from '../../types';
import { businessPartnersService } from '../../services/businessPartnersService';
import BusinessPartnerCard from './BusinessPartnerCard';
import BusinessPartnerForm from './BusinessPartnerForm';
import BusinessPartnerView from './BusinessPartnerView';
import BusinessPartnersMap from './BusinessPartnersMap';
import Breadcrumbs from '../Layout/Breadcrumbs';
import { Toast, ToastType } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { logCreate, logUpdate, logDelete } from '../../services/logsService';
import { useActivityLogger } from '../../hooks/useActivityLogger';
import { useAuth } from '../../hooks/useAuth';

const BusinessPartners: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  useActivityLogger('Parceiros de Negócios', 'Acesso', 'Acessou a base de Parceiros de Negócios');

  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartner | null>(null);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; partnerId?: string; partnerName?: string }>({ isOpen: false });

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    const data = await businessPartnersService.getAll();
    setBusinessPartners(data);
    setLoading(false);
  };

  const breadcrumbItems = [
    { label: t('common.home', 'Início'), href: '/' },
    { label: t('businessPartners.title', 'Parceiros de Negócios'), href: '/business-partners' }
  ];

  const filteredPartners = businessPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.document.includes(searchTerm) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || partner.type === typeFilter ||
                       (typeFilter === 'both' && partner.type === 'both');

    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredPartners.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPartners = filteredPartners.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  const stats = {
    total: businessPartners.length,
    clients: businessPartners.filter(p => p.type === 'customer' || p.type === 'both').length,
    suppliers: businessPartners.filter(p => p.type === 'supplier' || p.type === 'both').length,
    active: businessPartners.filter(p => p.status === 'active').length
  };

  const handleAdd = () => {
    setEditingPartner(null);
    setShowForm(true);
  };

  const handleEdit = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setShowForm(true);
  };

  const handleView = (partner: BusinessPartner) => {
    setSelectedPartner(partner);
    setShowView(true);
  };

  const handleDelete = (id: string) => {

    // Buscar o nome do parceiro para exibir na confirmação
    const partner = businessPartners.find(p => p.id === id);
    const partnerName = partner ? partner.name : 'este parceiro';

    setConfirmDialog({ isOpen: true, partnerId: id, partnerName });
  };

  const confirmDelete = async () => {

    if (confirmDialog.partnerId) {

      try {
        const partner = businessPartners.find(p => p.id === confirmDialog.partnerId);
        const result = await businessPartnersService.delete(confirmDialog.partnerId);

        if (result.success) {
          if (partner) {
            await logDelete('businessPartner', confirmDialog.partnerId, partner, 1, 'Administrador');
          }
          await loadPartners();
          setToast({ message: t('businessPartners.messages.deleteSuccess', 'Parceiro de negócios excluído com sucesso!'), type: 'success' });
        } else {

          setToast({ message: result.error || t('businessPartners.messages.deleteError', 'Erro ao excluir parceiro'), type: 'error' });
        }
      } catch (error) {

        setToast({ message: t('businessPartners.messages.deleteError', 'Erro inesperado ao excluir parceiro'), type: 'error' });
      }
    } else {

    }
    setConfirmDialog({ isOpen: false });
  };

  const handleSave = async (partnerData: any) => {
    try {

      const dataToSave = {
        name: partnerData.name,
        document: partnerData.document,
        documentType: partnerData.documentType,
        email: partnerData.email,
        phone: partnerData.phone,
        type: partnerData.type,
        status: partnerData.status,
        observations: partnerData.observations,
        website: partnerData.website,
        taxRegime: partnerData.taxRegime,
        creditLimit: partnerData.creditLimit,
        paymentTerms: partnerData.paymentTerms,
        notes: partnerData.notes,
        contacts: partnerData.contacts?.map((c: any) => ({
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          position: c.position || '',
          department: c.department || '',
          isPrimary: c.isPrimary || false,
          receiveEmailNotifications: c.receiveEmailNotifications ?? true,
          receiveWhatsappNotifications: c.receiveWhatsappNotifications ?? true,
          // Email notification preferences
          emailNotifyOrderCreated: c.emailNotifyOrderCreated ?? false,
          emailNotifyOrderInvoiced: c.emailNotifyOrderInvoiced ?? false,
          emailNotifyAwaitingPickup: c.emailNotifyAwaitingPickup ?? false,
          emailNotifyPickedUp: c.emailNotifyPickedUp ?? false,
          emailNotifyInTransit: c.emailNotifyInTransit ?? false,
          emailNotifyOutForDelivery: c.emailNotifyOutForDelivery ?? false,
          emailNotifyDelivered: c.emailNotifyDelivered ?? false,
          // WhatsApp notification preferences
          whatsappNotifyOrderCreated: c.whatsappNotifyOrderCreated ?? false,
          whatsappNotifyOrderInvoiced: c.whatsappNotifyOrderInvoiced ?? false,
          whatsappNotifyAwaitingPickup: c.whatsappNotifyAwaitingPickup ?? false,
          whatsappNotifyPickedUp: c.whatsappNotifyPickedUp ?? false,
          whatsappNotifyInTransit: c.whatsappNotifyInTransit ?? false,
          whatsappNotifyOutForDelivery: c.whatsappNotifyOutForDelivery ?? false,
          whatsappNotifyDelivered: c.whatsappNotifyDelivered ?? false
        })) || [],
        addresses: partnerData.addresses?.filter((a: any) => {
          // Filtrar apenas endereços que têm os campos mínimos preenchidos
          return a.street && a.city && a.state && a.zipCode;
        }).map((a: any) => ({
          type: a.type || 'commercial',
          street: a.street,
          number: a.number || '',
          complement: a.complement || '',
          neighborhood: a.neighborhood || '',
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          country: a.country || 'Brasil',
          isPrimary: a.isPrimary || false
        })) || []
      };


      if (editingPartner?.id) {
        const result = await businessPartnersService.update(editingPartner.id, dataToSave, 1);
        if (result.success) {
          const updated = await businessPartnersService.getById(editingPartner.id);
          if (updated) {
            await logUpdate('businessPartner', editingPartner.id, editingPartner, updated, 1, 'Administrador');
          }
          await loadPartners();
          setToast({ message: t('businessPartners.messages.updateSuccess', 'Parceiro de negócios atualizado com sucesso!'), type: 'success' });
        } else {
          setToast({ message: result.error || t('businessPartners.messages.updateError', 'Erro ao atualizar parceiro'), type: 'error' });
          return;
        }
      } else {
        const result = await businessPartnersService.create(dataToSave as any, 1);
        if (result.success && result.id) {
          const newPartner = await businessPartnersService.getById(result.id);
          if (newPartner) {
            await logCreate('businessPartner', result.id, newPartner, 1, 'Administrador');
          }
          await loadPartners();
          setToast({ message: t('businessPartners.messages.createSuccess', 'Parceiro de negócios criado com sucesso!'), type: 'success' });
        } else {
          const errorMsg = result.error || t('businessPartners.messages.createError', 'Erro ao criar parceiro');

          setToast({ message: errorMsg, type: 'error' });
          return;
        }
      }
      setShowForm(false);
      setEditingPartner(null);
    } catch (error: any) {

      const errorMessage = error?.message || t('businessPartners.messages.updateError', 'Erro inesperado ao salvar parceiro de negócios');
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('businessPartners.title', 'Parceiros de Negócios')}</h1>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('businessPartners.addPartner', 'Novo Parceiro')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.stats.total', 'Total')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.stats.clients', 'Clientes')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.clients}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.stats.suppliers', 'Fornecedores')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.suppliers}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('businessPartners.stats.active', 'Ativos')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('businessPartners.searchPlaceholder', 'Buscar por nome, documento ou email...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('businessPartners.allTypes', 'Todos os tipos')}</option>
                <option value="customer">{t('businessPartners.typeCustomer', 'Cliente')}</option>
                <option value="supplier">{t('businessPartners.typeSupplier', 'Fornecedor')}</option>
                <option value="both">{t('businessPartners.typeBoth', 'Ambos')}</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('businessPartners.allStatuses', 'Todos os status')}</option>
                <option value="active">{t('businessPartners.statusActive', 'Ativo')}</option>
                <option value="inactive">{t('businessPartners.statusInactive', 'Inativo')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              {t('businessPartners.tabs.list', 'Lista')}
            </button>
            <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'map'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Map className="w-4 h-4" />
                {t('businessPartners.tabs.map', 'Mapa')}
              </button>
          </div>
        </div>

        {/* Tab Content - Lista */}
        {activeTab === 'list' && (
          <>
            {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('businessPartners.loading', 'Carregando parceiros...')}</p>
          </div>
        ) : filteredPartners.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPartners.map((partner) => (
                <BusinessPartnerCard
                  key={partner.id}
                  partner={partner}
                  onView={() => handleView(partner)}
                  onEdit={() => handleEdit(partner)}
                  onDelete={() => handleDelete(partner.id)}
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('businessPartners.pagination.showing', 'Mostrando')} <span className="font-medium">{startIndex + 1}</span> {t('businessPartners.pagination.to', 'até')}{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredPartners.length)}</span> {t('businessPartners.pagination.of', 'de')}{' '}
                  <span className="font-medium">{filteredPartners.length}</span> {t('businessPartners.pagination.partners', 'parceiros')}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Mostrar apenas algumas páginas ao redor da atual
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 px-3 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white font-medium'
                                : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('businessPartners.noPartners', 'Nenhum parceiro encontrado')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? t('businessPartners.noPartnersDesc', 'Tente ajustar os filtros de busca.')
                : t('businessPartners.noPartnersInitial', 'Comece adicionando seu primeiro parceiro de negócios.')}
            </p>
            {(!searchTerm && typeFilter === 'all' && statusFilter === 'all') && (
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                {t('businessPartners.addFirstPartner', 'Adicionar Parceiro')}
              </button>
            )}
          </div>
        )}
          </>
        )}

        {/* Tab Content - Mapa */}
        {activeTab === 'map' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <BusinessPartnersMap
              partners={filteredPartners}
              onSelectPartner={handleView}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <BusinessPartnerForm
          partner={editingPartner}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingPartner(null);
          }}
        />
      )}

      {showView && selectedPartner && (
        <BusinessPartnerView
          partner={selectedPartner}
          onEdit={() => {
            setShowView(false);
            handleEdit(selectedPartner);
          }}
          onClose={() => {
            setShowView(false);
            setSelectedPartner(null);
          }}
        />
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
          title={t('businessPartners.deleteConfirm.title', 'Confirmar Exclusão')}
          message={t('businessPartners.deleteConfirm.message', 'Tem certeza que deseja excluir {{name}}?\\n\\nEsta ação NÃO pode ser desfeita!', { name: confirmDialog.partnerName || 'este parceiro' })}
          confirmText={t('common.delete', 'Excluir')}
          cancelText={t('common.cancel', 'Cancelar')}
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false })}
        />
      )}
    </div>
  );
};


export { BusinessPartners };
