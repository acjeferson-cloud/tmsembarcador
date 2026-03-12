import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Sparkles, MessageCircle, MessageSquare, MapPin, Package, DollarSign, Lightbulb, ShieldAlert, Lock, History } from 'lucide-react';
import { Innovation, fetchInnovations, activateInnovation, deactivateInnovation, isInnovationActivated } from '../../services/innovationsService';
import { Toast, ToastType } from '../common/Toast';
import { NewSuggestionModal } from '../Suggestions/NewSuggestionModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { innovationsHistoryService, InnovationHistoryEntry } from '../../services/innovationsHistoryService';
import { InnovationsHistoryTable } from './InnovationsHistoryTable';

interface InnovationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  Sparkles,
  MessageCircle,
  MessageSquare,
  MapPin,
  Package,
  DollarSign
};

export const InnovationsModal: React.FC<InnovationsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [activatedInnovations, setActivatedInnovations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);
  const [userNumericId, setUserNumericId] = useState<number>(1);
  const { user, currentEstablishment } = useAuth();
  const [activeTab, setActiveTab] = useState<'innovations' | 'history'>('innovations');
  const [history, setHistory] = useState<InnovationHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isAdmin = user?.perfil === 'administrador';

  useEffect(() => {
    const loadUserId = async () => {
      if (!user?.email) {
        setUserNumericId(1);
        return;
      }

      try {
        // Usar RPC para bypassar RLS
        const { data: contextData, error } = await supabase
          .rpc('get_user_context_for_session', { p_email: user.email });

        if (contextData?.success && !error) {
          const numericId = parseInt(contextData.codigo) || 1;
          setUserNumericId(numericId);
        } else {
          setUserNumericId(1);
        }
      } catch (error) {
        setUserNumericId(1);
      }
    };

    loadUserId();
  }, [user?.email]);

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  useEffect(() => {
    if (isOpen && userNumericId) {
      loadInnovations();
      loadHistory();
    }
  }, [isOpen, userNumericId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await innovationsHistoryService.getRecentHistory(100);
      setHistory(data);
    } catch (error) {
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!autoPlayEnabled || innovations.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % innovations.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, innovations.length]);

  const loadInnovations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInnovations();
      setInnovations(data);

      const activatedSet = new Set<string>();
      for (const innovation of data) {
        const isActivated = await isInnovationActivated(userNumericId, innovation.id);
        if (isActivated) {
          activatedSet.add(innovation.id);
        }
      }
      setActivatedInnovations(activatedSet);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev - 1 + innovations.length) % innovations.length);
  };

  const handleNext = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev + 1) % innovations.length);
  };

  const handleViewDetails = (innovation: Innovation) => {
    setSelectedInnovation(innovation);
  };

  const handleActivate = async (innovationId: string) => {
    if (!isAdmin) {
      setToast({
        message: t('innovations.adminOnlyActivate'),
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await activateInnovation(userNumericId, innovationId);

      if (result.success) {
        setActivatedInnovations(prev => new Set(prev).add(innovationId));
        setToast({ message: result.message, type: 'success' });
        setSelectedInnovation(null);

        const innovation = innovations.find(i => i.id === innovationId);
        if (innovation) {
          const historyResult = await innovationsHistoryService.createHistoryEntry({
            innovation_id: innovationId,
            innovation_name: innovation.name,
            action: 'ativacao',
            user_id: userNumericId,
            user_name: user?.name || user?.email || 'Usuário',
            establishment_code: currentEstablishment?.codigo || '0000',
          });
          if (historyResult.success) {
            await loadHistory();
          } else {
          }
        } else {
        }
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (error) {
      setToast({ message: t('innovations.errorActivating'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (innovationId: string) => {
    if (!isAdmin) {
      setToast({
        message: t('innovations.adminOnlyActivate'),
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await deactivateInnovation(userNumericId, innovationId);

      if (result.success) {
        setActivatedInnovations(prev => {
          const newSet = new Set(prev);
          newSet.delete(innovationId);
          return newSet;
        });
        setToast({ message: result.message, type: 'success' });
        setSelectedInnovation(null);

        const innovation = innovations.find(i => i.id === innovationId);
        if (innovation) {
          const historyResult = await innovationsHistoryService.createHistoryEntry({
            innovation_id: innovationId,
            innovation_name: innovation.name,
            action: 'desativacao',
            user_id: userNumericId,
            user_name: user?.name || user?.email || 'Usuário',
            establishment_code: currentEstablishment?.codigo || '0000',
          });
          if (historyResult.success) {
            await loadHistory();
          } else {
          }
        } else {
        }
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao desativar recurso', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Sparkles;
    return IconComponent;
  };

  if (!isOpen) return null;

  const currentInnovation = innovations[currentIndex];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('innovations.title')}</h2>
                <p className="text-blue-100 text-xs">{t('innovations.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab(activeTab === 'innovations' ? 'history' : 'innovations')}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {activeTab === 'innovations' ? 'Histórico' : 'Recursos'}
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white dark:bg-gray-800 hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Admin Warning Message for Non-Admins */}
          {!isAdmin && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-l-4 border-amber-500 p-4 flex-shrink-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-amber-900">{t('innovations.adminWarning')}</h3>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t('innovations.adminWarningText')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'history' ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Ativações/Desativações</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registro de todas as alterações em recursos contratados</p>
                </div>
                <InnovationsHistoryTable history={history} loading={loadingHistory} />
              </div>
            ) : isLoading && innovations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400">Carregando recursos...</p>
              </div>
            ) : innovations.length === 0 ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Sparkles className="w-16 h-16 text-gray-400" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum recurso disponível</h3>
                    <p className="text-gray-600 dark:text-gray-400">Em breve novos recursos estarão disponíveis.</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                  <button
                    onClick={() => setShowNewSuggestionModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all group"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 group-hover:animate-pulse" />
                    <span className="text-amber-900 text-sm font-medium">
                      Não achou o que procurava? Clique aqui para enviar uma sugestão!
                    </span>
                  </button>
                </div>
              </div>
            ) : selectedInnovation ? (
              /* Detail View */
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedInnovation(null)}
                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar aos recursos</span>
                </button>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {React.createElement(getIcon(selectedInnovation.icon), {
                        className: 'w-12 h-12 text-blue-600'
                      })}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedInnovation.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{selectedInnovation.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400">A partir de</p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {formatPrice(selectedInnovation.monthly_price)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">por mês</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Sobre este recurso</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {selectedInnovation.detailed_description || selectedInnovation.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span>Será adicionado à sua mensalidade</span>
                    </div>
                    {activatedInnovations.has(selectedInnovation.id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="font-semibold text-sm">Ativado</span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeactivate(selectedInnovation.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-colors"
                          >
                            {isLoading ? 'Desativando...' : 'Desativar'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => handleActivate(selectedInnovation.id)}
                          disabled={isLoading || !isAdmin}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            !isAdmin
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isLoading ? 'Ativando...' : !isAdmin ? (
                            <span className="flex items-center space-x-1">
                              <Lock className="w-3 h-3" />
                              <span>Ativar Recurso</span>
                            </span>
                          ) : 'Ativar Recurso'}
                        </button>
                        {!isAdmin && (
                          <p className="text-xs text-amber-600 mt-1">Apenas administradores</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Button in Detail View */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={() => setShowNewSuggestionModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all group"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 group-hover:animate-pulse" />
                    <span className="text-amber-900 text-sm font-medium">
                      Não achou o que procurava? Clique aqui para enviar uma sugestão!
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Carousel View */
              <div className="space-y-4">
                {/* Carousel */}
                <div className="relative">
                  <div className="overflow-hidden rounded-lg">
                    {currentInnovation && (
                      <div className="bg-gradient-to-br from-blue-50 to-white p-5 border border-blue-200">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {React.createElement(getIcon(currentInnovation.icon), {
                              className: 'w-16 h-16 text-blue-600'
                            })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0 pr-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                  {currentInnovation.name}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {currentInnovation.description}
                                </p>
                              </div>
                              {activatedInnovations.has(currentInnovation.id) && (
                                <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg flex-shrink-0">
                                  <Check className="w-4 h-4" />
                                  <span className="font-semibold text-xs">Ativado</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-lg font-bold text-blue-600">
                                  R$ {formatPrice(currentInnovation.monthly_price)}/mês
                                </span>
                              </div>
                              <button
                                onClick={() => handleViewDetails(currentInnovation)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  {innovations.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </button>
                    </>
                  )}
                </div>

                {/* Indicators */}
                {innovations.length > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    {innovations.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index);
                          setAutoPlayEnabled(false);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? 'w-8 bg-blue-600'
                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* All Resources Grid */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Todos os Recursos Disponíveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {innovations.map((innovation) => {
                      const Icon = getIcon(innovation.icon);
                      const isActivated = activatedInnovations.has(innovation.id);

                      return (
                        <div
                          key={innovation.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleViewDetails(innovation)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className={`p-2 rounded-lg ${isActivated ? 'bg-green-100' : 'bg-blue-100'}`}>
                                <Icon className={`w-5 h-5 ${isActivated ? 'text-green-600' : 'text-blue-600'}`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{innovation.name}</h4>
                                {isActivated && (
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{innovation.description}</p>
                              <p className="text-xs font-semibold text-blue-600">
                                R$ {formatPrice(innovation.monthly_price)}/mês
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Button in Carousel View */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={() => setShowNewSuggestionModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all group"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-600 group-hover:animate-pulse" />
                    <span className="text-amber-900 text-sm font-medium">
                      Não achou o que procurava? Clique aqui para enviar uma sugestão!
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewSuggestionModal && (
        <NewSuggestionModal
          isOpen={showNewSuggestionModal}
          onClose={() => setShowNewSuggestionModal(false)}
          userId={userNumericId}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
