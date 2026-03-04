import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, User, Mail, Phone, Building, Shield, Calendar, MapPin, FileText, Clock, AlertTriangle, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { User as UserType } from '../../services/usersService';
import { establishmentsService, Establishment } from '../../services/establishmentsService';

interface UserViewProps {
  onBack: () => void;
  onEdit: () => void;
  user: UserType;
}

// Menu structure from Sidebar.tsx (simplified for display)
const menuItems = [
  { id: 'fiori', label: 'Área de trabalho' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'control-tower', label: 'Torre de Controle' },
  { id: 'carriers', label: 'Transportadores' },
  { id: 'calculator', label: 'Cotação de Fretes' },
  { 
    id: 'operational-docs', 
    label: 'Documentos Operacionais',
    hasSubmenu: true,
    submenu: [
      { id: 'orders', label: 'Pedidos' },
      { id: 'invoices', label: 'Notas Fiscais' },
      { id: 'ctes', label: 'CT-es' },
      { id: 'bills', label: 'Faturas' }
    ]
  },
  { id: 'shipments', label: 'Rastreamento de Entregas' },
  { id: 'reverse-logistics', label: 'Logística Reversa' },
  { id: 'electronic-docs', label: 'Documentos Eletrônicos' },
  { 
    id: 'edi', 
    label: 'EDI',
    hasSubmenu: true,
    submenu: [
      { id: 'edi-input', label: 'EDIs de Entrada' },
      { id: 'edi-output', label: 'EDIs de Saída' }
    ]
  },
  { 
    id: 'reports', 
    label: 'Relatórios',
    hasSubmenu: true,
    submenu: [
      { id: 'report-cte-audit', label: 'Auditoria de CT-es' },
      { id: 'report-invoice-reconciliation', label: 'Conciliação de Faturas' },
      { id: 'report-deliveries-occurrences', label: 'Entregas com Ocorrências' },
      { id: 'report-nfe-without-cte', label: 'NF-e Não Atendida' },
      { id: 'report-rejection-history', label: 'Histórico de Reprovações' },
      { id: 'report-carrier-efficiency', label: 'Eficiência dos Transportadores' },
      { id: 'report-xml-download-history', label: 'Download de XMLs de CT-es' },
      { id: 'report-tolerance-usage', label: 'Uso de Tolerância Contratual' }
    ]
  },
  { 
    id: 'settings', 
    label: 'Configurações',
    hasSubmenu: true,
    submenu: [
      { id: 'establishments', label: 'Estabelecimentos' },
      { id: 'users', label: 'Usuários' },
      { id: 'countries', label: 'Países' },
      { id: 'states', label: 'Estados' },
      { id: 'cities', label: 'Cidades' },
      { id: 'occurrences', label: 'Históricos de Ocorrências' },
      { id: 'rejection-reasons', label: 'Motivos de Rejeições' }
    ]
  },
];

export const UserView: React.FC<UserViewProps> = ({ onBack, onEdit, user }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'permissions' | 'establishments'>('details');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        const data = await establishmentsService.getAll();
        setEstablishments(data);
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
      }
    };
    loadEstablishments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'bloqueado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerfilColor = (perfil: string) => {
    switch (perfil) {
      case 'administrador': return 'bg-purple-100 text-purple-800';
      case 'gerente': return 'bg-blue-100 text-blue-800';
      case 'operador': return 'bg-green-100 text-green-800';
      case 'visualizador': return 'bg-yellow-100 text-yellow-800';
      case 'personalizado': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateWorkTime = (admissionDate: string) => {
    const today = new Date();
    const admission = new Date(admissionDate);
    const diffTime = Math.abs(today.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months > 1 ? 'es' : ''}`;
    }
    return `${months} mês${months > 1 ? 'es' : ''}`;
  };

  const isProtectedUser = user.id === 1;

  // Toggle menu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Check if menu is expanded
  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  // Check if a menu is permitted
  const isMenuPermitted = (menuId: string) => {
    if (user.perfil !== 'personalizado') return true; // Non-personalized profiles have all permissions
    return user.permissoes?.includes(menuId) || false;
  };

  // Check if all submenus of a menu are permitted
  const areAllSubmenusPermitted = (menu: any) => {
    if (!menu.hasSubmenu || !menu.submenu) return false;
    if (user.perfil !== 'personalizado') return true; // Non-personalized profiles have all permissions
    
    return menu.submenu.every((submenu: any) => isMenuPermitted(submenu.id));
  };

  // Check if some submenus of a menu are permitted
  const areSomeSubmenusPermitted = (menu: any) => {
    if (!menu.hasSubmenu || !menu.submenu) return false;
    if (user.perfil !== 'personalizado') return true; // Non-personalized profiles have all permissions
    
    return menu.submenu.some((submenu: any) => isMenuPermitted(submenu.id));
  };

  // Get establishment names from IDs
  const getEstablishmentNames = () => {
    if (!user.estabelecimentosPermitidos || user.estabelecimentosPermitidos.length === 0) {
      return ['Todos os estabelecimentos'];
    }
    
    return user.estabelecimentosPermitidos.map(id => {
      const establishment = establishments.find(e => e.id === id);
      return establishment 
        ? `${establishment.codigo} - ${establishment.fantasia || establishment.razaoSocial}`
        : `Estabelecimento ID ${id}`;
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Usuários</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualizar Usuário</h1>
            <p className="text-gray-600 dark:text-gray-400">Detalhes completos do usuário</p>
          </div>
          <div className="flex items-center space-x-3">
            {isProtectedUser && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg flex items-center space-x-2">
                <Shield size={16} />
                <span className="text-sm font-medium">Usuário Protegido</span>
              </div>
            )}
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit size={20} />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Detalhes do Usuário</span>
              </div>
            </button>
            {user.perfil === 'personalizado' && (
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield size={16} />
                  <span>Permissões</span>
                </div>
              </button>
            )}
            {user.estabelecimentosPermitidos && user.estabelecimentosPermitidos.length > 0 && (
              <button
                onClick={() => setActiveTab('establishments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'establishments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building size={16} />
                  <span>Estabelecimentos</span>
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{user.codigo}</span>
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.nome}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{user.cargo} - {user.departamento}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CPF</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Perfil</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(user.perfil)}`}>
                      {user.perfil.charAt(0).toUpperCase() + user.perfil.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">{calculateWorkTime(user.data_admissao)}</p>
                  <p className="text-sm text-blue-700">Tempo de Empresa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">E-mail</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>
              
              {user.telefone && (
                <div className="flex items-center space-x-3">
                  <Phone className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.telefone}</p>
                  </div>
                </div>
              )}
              
              {user.celular && (
                <div className="flex items-center space-x-3">
                  <Phone className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Celular</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.celular}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cargo</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.cargo}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Departamento</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.departamento}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="text-purple-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data de Admissão</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(user.data_admissao)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Perfil de Acesso</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{user.perfil}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building className="text-red-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estabelecimento Principal</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.estabelecimento_nome || 'Não vinculado'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="text-indigo-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Último Login</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(user.ultimo_login)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          {(user.data_nascimento || user.endereco) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.data_nascimento && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-pink-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data de Nascimento</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(user.data_nascimento)}
                        {calculateAge(user.data_nascimento) && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">({calculateAge(user.data_nascimento)} anos)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {user.endereco && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-teal-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.endereco}
                        {user.bairro && `, ${user.bairro}`}
                        {user.cidade && user.estado && (
                          <span className="block text-sm text-gray-600 dark:text-gray-400">
                            {user.cidade} - {user.estado} {user.cep && `- ${user.cep}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Segurança</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{user.tentativas_login}</p>
                <p className="text-sm text-blue-700">Tentativas de Login</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600 capitalize">{user.status}</p>
                <p className="text-sm text-green-700">Status da Conta</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 capitalize">{user.perfil}</p>
                <p className="text-sm text-purple-700">Nível de Acesso</p>
              </div>
            </div>

            {/* Security Alerts */}
            {user.tentativas_login > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-800 font-medium">Alerta de Segurança</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Este usuário possui {user.tentativas_login} tentativa{user.tentativas_login > 1 ? 's' : ''} de login falhada{user.tentativas_login > 1 ? 's' : ''}. 
                      {user.tentativas_login >= 5 ? ' A conta foi bloqueada automaticamente.' : ` Após 5 tentativas a conta será bloqueada.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user.status === 'bloqueado' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Conta Bloqueada</p>
                    <p className="text-xs text-red-700 mt-1">
                      Esta conta foi bloqueada devido ao excesso de tentativas de login. Entre em contato com o administrador para desbloqueio.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audit Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações de Auditoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Criado por</p>
                    <p className="font-medium text-gray-900 dark:text-white">Usuário #{user.criadoPor}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data de Criação</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(user.criadoEm)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {user.alteradoPor && (
                  <div className="flex items-center space-x-3">
                    <User className="text-purple-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Última alteração por</p>
                      <p className="font-medium text-gray-900 dark:text-white">Usuário #{user.alteradoPor}</p>
                    </div>
                  </div>
                )}
                
                {user.alteradoEm && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-orange-500" size={20} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data da última alteração</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(user.alteradoEm)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observations */}
          {user.observacoes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Observações</h3>
              <div className="flex items-start space-x-3">
                <FileText className="text-gray-500 dark:text-gray-400" size={20} />
                <p className="text-gray-700 dark:text-gray-300">{user.observacoes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'permissions' && user.perfil === 'personalizado' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permissões Personalizadas</h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Perfil Personalizado</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Este usuário possui um perfil personalizado com acesso apenas às funcionalidades listadas abaixo.
                    Todas as outras funcionalidades do sistema não estarão disponíveis para este usuário.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Permissions Tree (Read-only) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 font-medium text-gray-700 dark:text-gray-300">Menu</div>
                  <div className="col-span-4 font-medium text-gray-700 dark:text-gray-300">Permissão</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {menuItems.map((menu: any) => (
                  <div key={menu.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900">
                    {/* Parent Menu */}
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-8">
                          <div className="flex items-center">
                            {menu.hasSubmenu ? (
                              <button
                                type="button"
                                onClick={() => toggleMenu(menu.id)}
                                className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                              >
                                {isMenuExpanded(menu.id) ? (
                                  <ChevronDown size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </button>
                            ) : (
                              <div className="w-[18px] mr-2"></div>
                            )}
                            <span className="font-medium text-gray-800 dark:text-gray-200">{menu.label}</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            {isMenuPermitted(menu.id) ? (
                              <CheckSquare size={20} className="text-blue-600" />
                            ) : areSomeSubmenusPermitted(menu) ? (
                              <div className="w-5 h-5 border-2 border-blue-600 rounded-sm flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                              </div>
                            ) : (
                              <Square size={20} className="text-gray-400" />
                            )}
                            <span className="ml-2">
                              {isMenuPermitted(menu.id) ? 'Permitido' : areSomeSubmenusPermitted(menu) ? 'Parcial' : 'Não permitido'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submenus */}
                    {menu.hasSubmenu && isMenuExpanded(menu.id) && menu.submenu && (
                      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                        {menu.submenu.map((submenu: any) => (
                          <div key={submenu.id} className="px-4 py-2 pl-10 hover:bg-gray-100 dark:bg-gray-700">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-8">
                                <span className="text-gray-700 dark:text-gray-300">{submenu.label}</span>
                              </div>
                              <div className="col-span-4">
                                <div className="flex items-center text-gray-700 dark:text-gray-300">
                                  {isMenuPermitted(submenu.id) ? (
                                    <CheckSquare size={20} className="text-blue-600" />
                                  ) : (
                                    <Square size={20} className="text-gray-400" />
                                  )}
                                  <span className="ml-2">
                                    {isMenuPermitted(submenu.id) ? 'Permitido' : 'Não permitido'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Permissions Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Resumo de Permissões</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800">Total de Permissões</p>
                  <p className="text-xl font-bold text-blue-600">{user.permissoes?.length || 0}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-800">Menus Principais</p>
                  <p className="text-xl font-bold text-green-600">
                    {user.permissoes?.filter(p => !p.includes('-')).length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-purple-800">Submenus</p>
                  <p className="text-xl font-bold text-purple-600">
                    {user.permissoes?.filter(p => p.includes('-')).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'establishments' && user.estabelecimentosPermitidos && user.estabelecimentosPermitidos.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estabelecimentos Permitidos</h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Building size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Acesso Restrito a Estabelecimentos</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Este usuário tem acesso apenas aos estabelecimentos listados abaixo.
                    Após o login, o usuário deverá selecionar um destes estabelecimentos para iniciar o trabalho.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Establishments List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="font-medium text-gray-700 dark:text-gray-300">Estabelecimentos Permitidos</div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {user.estabelecimentosPermitidos.map(id => {
                  const establishment = establishments.find(e => e.id === id);
                  return (
                    <div key={id} className="px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center">
                        <Building size={18} className="text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {establishment ? (establishment.fantasia || establishment.razaoSocial) : `Estabelecimento ID ${id}`}
                          </div>
                          {establishment && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {establishment.codigo} - {establishment.tipo.charAt(0).toUpperCase() + establishment.tipo.slice(1)}
                              {establishment.cidade && ` - ${establishment.cidade}/${establishment.estado}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Default Establishment */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Estabelecimento Principal</p>
                  <p className="text-xs text-green-700 mt-1">
                    {user.estabelecimento_nome ? (
                      <>O estabelecimento principal deste usuário é <strong>{user.estabelecimento_nome}</strong>.</>
                    ) : (
                      <>Este usuário não possui um estabelecimento principal definido.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.estabelecimentosPermitidos.length} estabelecimento(s) permitido(s)
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {establishments.length} total no sistema
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};