import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, FileText, Users, Truck, MapPin, Settings, Calculator, BarChart3, AlertTriangle, RefreshCw, Database, Home, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  content?: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<string>('introducao');
  const [expandedItems, setExpandedItems] = useState<string[]>(['tms-gestor']);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: 'tms-gestor',
      title: 'TMS Embarcador Log Axis',
      icon: <Home className="w-4 h-4" />,
      children: [
        {
          id: 'introducao',
          title: 'Introdução',
          icon: <FileText className="w-4 h-4" />,
          content: `
            <h2 class="text-2xl font-bold text-gray-800 mb-4">TMS Embarcador Log Axis</h2>
            <p class="mb-4">O TMS Embarcador Log Axis é uma solução completa de gerenciamento de transporte (TMS - Transportation Management System) para empresas de logística e transporte, oferecendo controle total sobre operações de frete e distribuição.</p>
            <p class="mb-4">O TMS Embarcador Log Axis ajuda no gerenciamento de todos os aspectos de sua operação logística, fornecendo acesso a informações em tempo real por meio de um sistema integrado. A aplicação divide-se em vários módulos, cada um abrangendo uma função operacional diferente.</p>
            <p class="mb-4">O TMS Embarcador Log Axis foi desenvolvido para ser uma solução flexível e amplificável. A aplicação está disponível via web, com interfaces otimizadas para desktop e dispositivos móveis.</p>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-blue-700">
                    <strong>Nota:</strong> Esta ajuda online se aplica à versão atual do TMS Embarcador Log Axis. Se um recurso ou função estiver disponível em apenas uma versão, isso deverá ser informado de modo claro.
                  </p>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'area-trabalho',
          title: 'Área de Trabalho',
          icon: <Home className="w-4 h-4" />,
          children: [
            {
              id: 'dashboard',
              title: 'Dashboard',
              icon: <BarChart3 className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
                <p class="mb-4">O Dashboard é a tela principal do TMS Embarcador Log Axis, oferecendo uma visão geral das operações de transporte em tempo real.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Métricas de performance em tempo real</li>
                  <li>Gráficos de entregas e status</li>
                  <li>Alertas e notificações importantes</li>
                  <li>Resumo financeiro das operações</li>
                </ul>
              `
            },
            {
              id: 'pedidos',
              title: 'Pedidos',
              icon: <FileText className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Gestão de Pedidos</h2>
                <p class="mb-4">Módulo responsável pelo controle e acompanhamento de todos os pedidos de transporte.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Criação e edição de pedidos</li>
                  <li>Acompanhamento de status</li>
                  <li>Integração com transportadoras</li>
                  <li>Histórico completo de movimentações</li>
                </ul>
              `
            }
          ]
        },
        {
          id: 'documentos',
          title: 'Documentos Operacionais',
          icon: <FileText className="w-4 h-4" />,
          children: [
            {
              id: 'notas-fiscais',
              title: 'Notas Fiscais',
              icon: <FileText className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Notas Fiscais</h2>
                <p class="mb-4">Gerenciamento completo de notas fiscais relacionadas às operações de transporte.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Importação automática de XML</li>
                  <li>Validação de dados fiscais</li>
                  <li>Associação com CT-es</li>
                  <li>Relatórios fiscais</li>
                </ul>
              `
            },
            {
              id: 'ctes',
              title: 'CT-es',
              icon: <FileText className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Conhecimentos de Transporte Eletrônico</h2>
                <p class="mb-4">Controle completo dos CT-es emitidos e recebidos.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Emissão de CT-es</li>
                  <li>Consulta de status na SEFAZ</li>
                  <li>Cancelamento e correção</li>
                  <li>Impressão de DACTE</li>
                </ul>
              `
            }
          ]
        },
        {
          id: 'configuracoes',
          title: 'Configurações',
          icon: <Settings className="w-4 h-4" />,
          children: [
            {
              id: 'usuarios',
              title: 'Usuários',
              icon: <Users className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Gestão de Usuários</h2>
                <p class="mb-4">Controle de acesso e permissões do sistema.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Cadastro de usuários</li>
                  <li>Definição de perfis e permissões</li>
                  <li>Controle de estabelecimentos</li>
                  <li>Auditoria de acessos</li>
                </ul>
              `
            },
            {
              id: 'transportadoras',
              title: 'Transportadoras',
              icon: <Truck className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Cadastro de Transportadoras</h2>
                <p class="mb-4">Gerenciamento de parceiros de transporte.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Cadastro completo de transportadoras</li>
                  <li>Documentação e certificações</li>
                  <li>Avaliação de performance</li>
                  <li>Integração via EDI</li>
                </ul>
              `
            }
          ]
        },
        {
          id: 'ferramentas',
          title: 'Ferramentas',
          icon: <Calculator className="w-4 h-4" />,
          children: [
            {
              id: 'calculadora',
              title: 'Calculadora de Frete',
              icon: <Calculator className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Calculadora de Frete</h2>
                <p class="mb-4">Ferramenta para cálculo de fretes baseada em tabelas configuráveis.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Cálculo por peso, volume e distância</li>
                  <li>Aplicação de taxas adicionais</li>
                  <li>Simulação de cenários</li>
                  <li>Histórico de cotações</li>
                </ul>
              `
            },
            {
              id: 'torre-controle',
              title: 'Torre de Controle',
              icon: <BarChart3 className="w-4 h-4" />,
              content: `
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Torre de Controle</h2>
                <p class="mb-4">Centro de monitoramento operacional em tempo real.</p>
                <h3 class="text-lg font-semibold mb-2">Funcionalidades:</h3>
                <ul class="list-disc pl-6 mb-4">
                  <li>Monitoramento de entregas</li>
                  <li>Alertas de atraso</li>
                  <li>Métricas de performance</li>
                  <li>Mapa de rastreamento</li>
                </ul>
              `
            }
          ]
        }
      ]
    }
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleFeedback = (helpful: boolean) => {
    // Aqui você pode implementar a lógica para enviar feedback
    alert(helpful ? t('help.feedbackThanks') : t('help.feedbackImprove'));
  };

  const findItemById = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isSelected = selectedItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
            if (item.content) {
              setSelectedItem(item.id);
            }
          }}
        >
          {hasChildren && (
            <span className="mr-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          <span className="mr-2">{item.icon}</span>
          <span className="text-sm font-medium">{item.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedItemData = findItemById(menuItems, selectedItem);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('help.title')}</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">📋 {t('help.tableOfContents')}</h2>
            </div>
          <div className="py-2">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                {selectedItemData?.content ? (
                  <div>
                    <div dangerouslySetInnerHTML={{ __html: selectedItemData.content }} />
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">🤔 {t('help.wasHelpful')}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedback(true)}
                          className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          👍 {t('help.yes')}
                        </button>
                        <button
                          onClick={() => handleFeedback(false)}
                          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          👎 {t('help.no')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('help.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{t('help.selectTopic')}</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;