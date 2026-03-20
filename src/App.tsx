import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Package, Truck, DollarSign, TrendingUp } from 'lucide-react';
import { LoginWithEnvironmentFlow } from './components/Auth/LoginWithEnvironmentFlow';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { FioriMenu } from './components/Layout/FioriMenu';
import { EstablishmentSelectionModal } from './components/Auth/EstablishmentSelectionModal';
import { OrganizationEnvironmentSelector } from './components/Auth/OrganizationEnvironmentSelector';
import { useAuth } from './hooks/useAuth';
import { useAutoXmlImport } from './hooks/useAutoXmlImport';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const ControlTower = lazy(() => import('./components/ControlTower/ControlTower').then(m => ({ default: m.ControlTower })));
const Countries = lazy(() => import('./components/Countries/Countries').then(m => ({ default: m.Countries })));
const States = lazy(() => import('./components/States/States').then(m => ({ default: m.States })));
const Cities = lazy(() => import('./components/Cities/Cities').then(m => ({ default: m.Cities })));
const Carriers = lazy(() => import('./components/Carriers/Carriers').then(m => ({ default: m.Carriers })));
const BusinessPartners = lazy(() => import('./components/BusinessPartners/BusinessPartners').then(m => ({ default: m.BusinessPartners })));
const Calculator = lazy(() => import('./components/Calculator/Calculator'));
const FreightQuote = lazy(() => import('./components/FreightQuote/FreightQuote'));
const Establishments = lazy(() => import('./components/Establishments/Establishments').then(m => ({ default: m.Establishments })));
const Users = lazy(() => import('./components/Users/Users').then(m => ({ default: m.Users })));
const ElectronicDocuments = lazy(() => import('./components/ElectronicDocuments/ElectronicDocuments').then(m => ({ default: m.ElectronicDocuments })));
const FreightRates = lazy(() => import('./components/FreightRates/FreightRates').then(m => ({ default: m.FreightRates })));
const Occurrences = lazy(() => import('./components/Occurrences/Occurrences').then(m => ({ default: m.Occurrences })));
const RejectionReasons = lazy(() => import('./components/RejectionReasons/RejectionReasons').then(m => ({ default: m.RejectionReasons })));
const CTes = lazy(() => import('./components/CTes/CTes').then(m => ({ default: m.CTes })));
const Invoices = lazy(() => import('./components/Invoices/Invoices').then(m => ({ default: m.Invoices })));
const Pickups = lazy(() => import('./components/Pickups/Pickups').then(m => ({ default: m.Pickups })));
const Bills = lazy(() => import('./components/Bills/Bills').then(m => ({ default: m.Bills })));
const Orders = lazy(() => import('./components/Orders/Orders').then(m => ({ default: m.Orders })));
const ReportViewer = lazy(() => import('./components/Reports/ReportViewer').then(m => ({ default: m.ReportViewer })));
const EDIInput = lazy(() => import('./components/EDI/EDIInput').then(m => ({ default: m.EDIInput })));
const EDIOutput = lazy(() => import('./components/EDI/EDIOutput').then(m => ({ default: m.EDIOutput })));
const ImplementationCenter = lazy(() => import('./components/ImplementationCenter/ImplementationCenter').then(m => ({ default: m.ImplementationCenter })));
const ChangeLog = lazy(() => import('./components/ChangeLog/ChangeLog').then(m => ({ default: m.ChangeLog })));
const LicenseManagement = lazy(() => import('./components/Licenses/LicenseManagement').then(m => ({ default: m.LicenseManagement })));
const ApiKeysManagement = lazy(() => import('./components/ApiKeys/ApiKeysManagement').then(m => ({ default: m.ApiKeysManagement })));
const RejectionHistoryReport = lazy(() => import('./components/Reports/RejectionHistoryReport'));
const ReverseLogistics = lazy(() => import('./components/ReverseLogistics/ReverseLogistics'));
const LogisticsSimulator = lazy(() => import('./components/LogisticsSimulator/LogisticsSimulator'));
const WhatsAppConfig = lazy(() => import('./components/WhatsApp/WhatsAppConfig').then(m => ({ default: m.WhatsAppConfig })));
const GoogleMapsConfig = lazy(() => import('./components/GoogleMaps/GoogleMapsConfig').then(m => ({ default: m.GoogleMapsConfig })));
const OpenAIConfig = lazy(() => import('./components/OpenAI/OpenAIConfig').then(m => ({ default: m.OpenAIConfig })));
const Holidays = lazy(() => import('./components/Holidays/Holidays').then(m => ({ default: m.Holidays })));
const NPSDashboard = lazy(() => import('./components/NPS/NPSDashboard').then(m => ({ default: m.NPSDashboard })));
const NPSConfiguration = lazy(() => import('./components/NPS/NPSConfig').then(m => ({ default: m.NPSConfiguration })));
const NPSResposta = lazy(() => import('./components/NPS/NPSResposta').then(m => ({ default: m.NPSResposta })));
const PublicTracking = lazy(() => import('./components/PublicTracking/PublicTracking'));
const PublicPickupScheduling = lazy(() => import('./components/PublicPickupScheduling/PublicPickupScheduling').then(m => ({ default: m.PublicPickupScheduling })));
const SaasAdminConsole = lazy(() => import('./components/SaasAdmin/SaasAdminConsole').then(m => ({ default: m.SaasAdminConsole })));
const SaasAdminApp = lazy(() => import('./components/SaasAdmin/SaasAdminApp').then(m => ({ default: m.SaasAdminApp })));
const DeliveryTracking = lazy(() => import('./components/DeliveryTracking/DeliveryTracking').then(m => ({ default: m.DeliveryTracking })));
import { ThemeProvider } from './context/ThemeContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineAlert } from './components/common/OfflineAlert';
import { SpotlightSearch } from './components/Layout/SpotlightSearch';
import DiagnosticPage from './components/DiagnosticPage';
import { InnovationsProvider } from './contexts/InnovationsContext';

// Report definitions
const reportTypes = [
  {
    id: 'cte-audit',
    title: 'Relatório de Auditoria de CT-es',
    description: 'Apresenta o resultado das auditorias automáticas realizadas sobre os CT-es importados',
    icon: FileCheck, 
    color: 'blue',
    fields: [
      'Nº CT-e', 'Série', 'Data de emissão', 'Transportador', 'UF de destino',
      'Valor do CT-e (XML)', 'Valor de custo (TMS)', 'Diferença (%)',
      'Status da auditoria', 'Motivo da Reprovação', 'Nome do usuário'
    ],
    filters: ['Período', 'Transportador', 'Status da auditoria', 'UF', 'Nº CT-e']
  },
  {
    id: 'invoice-reconciliation',
    title: 'Relatório de Conciliação de Faturas',
    description: 'Verifica se os valores cobrados nas faturas dos transportadores estão em conformidade com os CT-es',
    icon: DollarSign,
    color: 'green',
    fields: [
      'Nº da fatura', 'Transportador', 'Período', 'Valor da fatura',
      'Total de CT-es vinculados', 'Valor total dos CT-es',
      'Diferença entre valor faturado e aprovado',
      'Status da conciliação', 'Data de recebimento e processamento'
    ],
    filters: ['Período', 'Transportador', 'Status de conciliação', 'Nº da fatura']
  },
  {
    id: 'deliveries-occurrences',
    title: 'Relatório de Entregas com Ocorrências',
    description: 'Lista entregas que apresentaram ocorrências registradas via EDI (layout OCOREN)',
    icon: AlertTriangle,
    color: 'orange',
    fields: [
      'Nº CT-e', 'Transportador', 'Data de entrega',
      'Código da Ocorrência', 'Descrição', 'Tipo (Crítica/Informativa)',
      'Status final da entrega', 'Data e hora da ocorrência', 'Cidade/UF'
    ],
    filters: ['Período', 'Transportador', 'Código da Ocorrência', 'UF']
  },
  {
    id: 'nfe-without-cte',
    title: 'Relatório de NF-e Não Atendida (Sem CT-e)',
    description: 'Lista notas fiscais emitidas que ainda não possuem CT-e vinculado',
    icon: Package,
    color: 'red',
    fields: [
      'Nº NF-e', 'Data de emissão', 'Destinatário', 'Valor',
      'Status logístico', 'Estabelecimento emissor', 'UF de destino'
    ],
    filters: ['Período', 'Estabelecimento', 'UF', 'Cliente']
  },
  {
    id: 'rejection-history',
    title: 'Relatório de Histórico de Reprovações',
    description: 'Consolida todas as reprovações de CT-es e faturas, com agrupamento por motivo e transportador',
    icon: XCircle,
    color: 'purple',
    fields: [
      'Tipo de documento', 'Nº documento', 'Transportador', 'Data', 'Valor envolvido',
      'Motivo da reprovação', 'Responsável pela decisão', 'Observações'
    ],
    filters: ['Período', 'Transportador', 'Motivo', 'Tipo de documento']
  },
  {
    id: 'carrier-efficiency',
    title: 'Relatório de Eficiência dos Transportadores',
    description: 'Avalia indicadores logísticos por transportador, como pontualidade, divergência de valor, taxa de ocorrências',
    icon: BarChart3,
    color: 'indigo',
    fields: [
      '% de CT-es aprovados sem divergência',
      '% de entregas com ocorrências críticas',
      '% de notas atendidas no prazo (SLA de entrega)',
      'Média de diferença de valor entre custo previsto e CT-e',
      'Taxa de rejeição de faturas'
    ],
    filters: ['Período', 'Transportador', 'Estabelecimento']
  },
  {
    id: 'xml-download-history',
    title: 'Relatório de Download de XMLs de CT-es',
    description: 'Histórico de downloads realizados pelo usuário para controle de uso da ferramenta e rastreabilidade',
    icon: Download,
    color: 'teal',
    fields: [
      'Usuário', 'Data/hora do download', 'Qtde de CT-es exportados',
      'Nome do arquivo gerado', 'Intervalo de data selecionado', 'Transportadores envolvidos'
    ],
    filters: ['Período', 'Usuário', 'Transportador']
  },
  {
    id: 'tolerance-usage',
    title: 'Relatório de Uso de Tolerância Contratual',
    description: 'Aponta quantos CT-es foram aprovados com base em tolerâncias de valor previamente configuradas por transportador',
    icon: Clock,
    color: 'cyan',
    fields: [
      'Nº CT-e', 'Transportador', 'Valor do CT-e', 'Valor do custo',
      'Diferença (R$)', 'Tolerância aplicada (%)',
      'Data da auditoria', 'Usuário responsável', 'Justificativa'
    ],
    filters: ['Período', 'Transportador', 'Faixa de tolerância']
  }
];

import { 
  FileCheck, 
  AlertTriangle, 
  XCircle, 
  BarChart3, 
  Download, 
  Clock,
  Settings,
  FileText,
  Sparkles
} from 'lucide-react';
import { useInnovations } from './contexts/InnovationsContext';
import { menuConfig } from './data/menuConfig';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('control-tower');
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuType, setMenuType] = useState<'sidebar' | 'fiori'>('sidebar');
  const {
    user,
    loginWithEnvironmentData,
    currentEstablishment,
    showEstablishmentSelector,
    selectEstablishment,
    getUserEstablishmentsFromDB,
    availableEstablishments,
    isLoading,
    showOrgEnvSelector,
    selectOrganizationEnvironment
  } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  useAutoXmlImport();

  // Inicializar na Torre de Controle após o login
  useEffect(() => {
    if (user && !isLoading && !hasInitialized) {
      setCurrentPage('control-tower');
      localStorage.setItem('tms-current-page', 'control-tower');
      setHasInitialized(true);
    }

    if (!user) {
      setHasInitialized(false);
    }

    const savedMenuType = localStorage.getItem('tms-menu-type');
    if (savedMenuType && (savedMenuType === 'sidebar' || savedMenuType === 'fiori')) {
      setMenuType(savedMenuType as 'sidebar' | 'fiori');
    }
  }, [user, isLoading, hasInitialized]);

  // Salvar a página atual e o tipo de menu no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('tms-current-page', currentPage);
  }, [currentPage]);
  
  useEffect(() => {
    localStorage.setItem('tms-menu-type', menuType);
  }, [menuType]);

  const handleLoginSuccess = async (loginData: any, rememberMe: boolean) => {
    console.log('🎯 [APP] Login bem-sucedido, processando dados:', loginData);
    await loginWithEnvironmentData(loginData, rememberMe);
    // No need to set currentPage here as it's now handled in the login function
  };

  useEffect(() => {
    const handleAppNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handlePageChange(customEvent.detail);
      }
    };
    window.addEventListener('app-navigate', handleAppNavigate);
    return () => window.removeEventListener('app-navigate', handleAppNavigate);
  }, []);

  const handlePageChange = (page: string) => {
    // Check if user has permission to access this page
    if (user && user.perfil === 'personalizado' && user.permissoes) {
      // For personalized users, check if they have permission for this page
      if (!user.permissoes.includes(page)) {
        alert('Você não tem permissão para acessar esta página.');
        return;
      }
    }
    
    setCurrentPage(page);
    setSelectedItemId(undefined);
    // Increment refresh key to force component re-render
    setRefreshKey(prevKey => prevKey + 1);
    // Salvar a página atual no localStorage
    localStorage.setItem('tms-current-page', page);
  };

  const handleNavigateWithId = (section: string, id?: string) => {
    setCurrentPage(section);
    setSelectedItemId(id);
  };
  
  const toggleMenuType = () => {
    setMenuType(prev => prev === 'sidebar' ? 'fiori' : 'sidebar');
  };

  // Get the current report based on the page ID
  const getCurrentReport = () => {
    const reportId = currentPage.replace('report-', '');
    return reportTypes.find(r => r.id === reportId);
  };

  const renderCurrentPage = () => {
    const { isInnovationActive, isLoading: innovationsLoading } = useInnovations();

    // Check if user has permission to access this page
    if (user && user.perfil === 'personalizado' && user.permissoes) {
      // For personalized users, check if they have permission for this page
      if (!user.permissoes.includes(currentPage)) {
        return (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Acesso Negado</h2>
              <p className="text-red-600">
                Você não tem permissão para acessar esta página. Por favor, entre em contato com o administrador do sistema.
              </p>
            </div>
          </div>
        );
      }
    }
    
    let isFeatureLocked = false;
    // Check for Innovation Locks
    if (!innovationsLoading) {
      const currentMenuItem = (() => {
        const findItem = (items: any[], id: string): any => {
          for (const i of items) {
            if (i.id === id) return i;
            if (i.submenu) {
              const found = findItem(i.submenu, id);
              if (found) return found;
            }
          }
          return null;
        };
        return findItem(menuConfig, currentPage);
      })();

      if (currentMenuItem?.innovationKey && !isInnovationActive(currentMenuItem.innovationKey)) {
        isFeatureLocked = true;
      }
    }

    const renderContent = () => {
      // Handle special case for Fiori menu
      if (currentPage === 'fiori') {
        return <FioriMenu onPageChange={handlePageChange} />;
      }
      
      // Handle report pages
      if (currentPage.startsWith('report-')) {
        const report = getCurrentReport();
        if (report) {
          return <ReportViewer key={`${currentPage}-${refreshKey}`} report={report} onBack={() => handlePageChange('reports')} />;
        }
      }
      
      // Pass refreshKey to each component to force re-render when page changes
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={`dashboard-${refreshKey}`} />;
      case 'control-tower':
        return <ControlTower key={`control-tower-${refreshKey}`} />;
      case 'calculator':
        return <Calculator key={`calculator-${refreshKey}`} />;
      case 'freight-quote':
        return <FreightQuote key={`freight-quote-${refreshKey}`} />;
      case 'orders':
        return <Orders key={`orders-${refreshKey}`} initialId={selectedItemId} />;
      case 'invoices':
        return <Invoices key={`invoices-${refreshKey}`} initialId={selectedItemId} />;
      case 'pickups':
        return <Pickups key={`pickups-${refreshKey}`} initialId={selectedItemId} />;
      case 'ctes':
        return <CTes key={`ctes-${refreshKey}`} initialId={selectedItemId} />;
      case 'bills':
        return <Bills key={`bills-${refreshKey}`} initialId={selectedItemId} />;
      case 'delivery-tracking':
        return <DeliveryTracking key={`delivery-tracking-${refreshKey}`} />;
      case 'reverse-logistics':
        return <ReverseLogistics key={`reverse-logistics-${refreshKey}`} />;
      case 'electronic-docs':
        return <ElectronicDocuments key={`electronic-docs-${refreshKey}`} />;
      case 'logistics-simulator':
        return <LogisticsSimulator key={`logistics-simulator-${refreshKey}`} />;
      case 'edi-input':
        return <EDIInput key={`edi-input-${refreshKey}`} />;
      case 'edi-output':
        return <EDIOutput key={`edi-output-${refreshKey}`} />;
      case 'carriers':
        return <Carriers key={`carriers-${refreshKey}`} />;
      case 'business-partners':
        return <BusinessPartners key={`business-partners-${refreshKey}`} />;
      case 'freight-rates':
        return <FreightRates key={`freight-rates-${refreshKey}`} />;
      case 'establishments':
        return <Establishments key={`establishments-${refreshKey}`} />;
      case 'users':
        return <Users key={`users-${refreshKey}`} />;
      case 'countries':
        return <Countries key={`countries-${refreshKey}`} />;
      case 'states':
        return <States key={`states-${refreshKey}`} />;
      case 'cities':
        return <Cities key={`cities-${refreshKey}`} />;
      case 'occurrences':
        return <Occurrences key={`occurrences-${refreshKey}`} />;
      case 'rejection-reasons':
        return <RejectionReasons key={`rejection-reasons-${refreshKey}`} />;
      case 'implementation-center':
        return <ImplementationCenter key={`implementation-center-${refreshKey}`} />;
      case 'change-log':
        return <ChangeLog key={`change-log-${refreshKey}`} />;
      case 'license-management':
        return <LicenseManagement key={`license-management-${refreshKey}`} />;
      case 'api-keys':
        return <ApiKeysManagement key={`api-keys-${refreshKey}`} />;
      case 'holidays':
        return <Holidays key={`holidays-${refreshKey}`} />;
      case 'rejection-history':
        return <RejectionHistoryReport key={`rejection-history-${refreshKey}`} />;
      case 'whatsapp-config':
        return <WhatsAppConfig key={`whatsapp-config-${refreshKey}`} />;
      case 'google-maps-config':
        return <GoogleMapsConfig key={`google-maps-config-${refreshKey}`} />;
      case 'openai-config':
        return <OpenAIConfig key={`openai-config-${refreshKey}`} />;
      case 'nps-dashboard':
        return <NPSDashboard key={`nps-dashboard-${refreshKey}`} />;
      case 'nps-config':
        return <NPSConfiguration key={`nps-config-${refreshKey}`} />;
      default:
        return <Dashboard key={`dashboard-${refreshKey}`} />;
      }
    };

    const content = renderContent();

    if (isFeatureLocked) {
      return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* Banner Inline no Topo */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm z-10 shrink-0">
            <div className="flex items-start sm:items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl shrink-0">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-300">
                  💡 Inovação disponível para contratação!
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                  Este recurso pode trazer ganhos importantes para sua operação, mas ainda não está habilitado.<br className="hidden sm:block" />
                  Fale com o administrador e solicite a ativação em: <strong>Painel de Administrador &gt; Inovações & Sugestões</strong>.
                </p>
              </div>
            </div>
          </div>
          
          {/* Component Content Disabled (Readonly Mode) */}
          <div className="flex-1 overflow-auto opacity-50 saturate-50 pointer-events-none select-none transition-all duration-300">
            {content}
          </div>
        </div>
      );
    }

    return content;
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <LoginWithEnvironmentFlow onLoginSuccess={handleLoginSuccess} />;
  }

  // CRÍTICO: SEMPRE verificar se há estabelecimento selecionado
  // NUNCA permitir acesso ao sistema sem estabelecimento
  if (!currentEstablishment || showEstablishmentSelector) {
    console.log('[APP] Mostrando modal de estabelecimento:', {
      currentEstablishment,
      showEstablishmentSelector,
      availableEstablishmentsCount: availableEstablishments.length,
      availableEstablishments
    });

    return (
      <EstablishmentSelectionModal
        isOpen={true}
        establishments={availableEstablishments}
        onSelect={async (establishmentId) => {
          await selectEstablishment(establishmentId);
        }}
        // NÃO permitir fechar sem selecionar
        onClose={undefined}
      />
    );
  }

  return (
    <>
      <SpotlightSearch onNavigate={handlePageChange} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {menuType === 'sidebar' && (
          <Sidebar
            currentPage={currentPage}
            onPageChange={handlePageChange}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        <div className={`flex-1 flex flex-col ${menuType === 'sidebar' ? 'lg:ml-0' : ''} min-h-screen`}>
          <Header
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            menuType={menuType}
            onToggleMenuType={toggleMenuType}
            onNavigate={handleNavigateWithId}
          />
          <main className="flex-1 overflow-y-auto dark:text-white">
            {currentPage === 'fiori' ? (
              <FioriMenu onPageChange={handlePageChange} />
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
                    </div>
                  </div>
                }
              >
                {renderCurrentPage()}
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// Main App component that checks for public routes FIRST
function App() {
  const urlPath = window.location.pathname;
  const npsMatch = urlPath.match(/\/nps-responder\/([^/?]+)/);
  const trackingMatch = urlPath.match(/\/rastrear/);
  const pickupSchedulingMatch = urlPath.match(/\/agendamento-coleta\/([^/?]+)/);
  const diagnosticMatch = urlPath.match(/\/diagnostic/);
  const saasAdminMatch = urlPath.match(/\/SaasAdminConsole/);

  if (diagnosticMatch) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConnectionProvider>
            <DiagnosticPage />
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (saasAdminMatch) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConnectionProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-white">Carregando SaaS Admin Console...</p>
                  </div>
                </div>
              }
            >
              <SaasAdminApp />
            </Suspense>
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (npsMatch) {
    const token = npsMatch[1];
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConnectionProvider>
            <OfflineAlert />
            <NPSResposta token={token} />
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (pickupSchedulingMatch) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConnectionProvider>
            <OfflineAlert />
            <PublicPickupScheduling />
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  if (trackingMatch) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <ConnectionProvider>
            <OfflineAlert />
            <PublicTracking />
          </ConnectionProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConnectionProvider>
          <InnovationsProvider>
            <OfflineAlert />
            <AppContent />
          </InnovationsProvider>
        </ConnectionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;