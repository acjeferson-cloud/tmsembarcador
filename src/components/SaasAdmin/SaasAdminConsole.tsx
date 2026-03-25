import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Database,
  Activity,
  FileText,
  Settings,
  AlertTriangle,
  TrendingUp,
  Palette,
  Package,
  Layers,
  Sparkles,
  LogOut
} from 'lucide-react';
import { SaasAdminDashboard } from './SaasAdminDashboard';
import { SaasTenantsManagement } from './SaasTenantsManagement';
import { SaasAdminLogs } from './SaasAdminLogs';
import { WhiteLabelManagement } from './WhiteLabelManagement';
import { SaasPlansManager } from './SaasPlansManager';
import { SaasEnvironmentsView } from './SaasEnvironmentsView';
import { InnovationsCrud } from '../Innovations/InnovationsCrud';
import { tenantAuthService } from '../../services/tenantAuthService';

type TabType = 'dashboard' | 'tenants' | 'plans' | 'environments' | 'whitelabel' | 'databases' | 'metrics' | 'logs' | 'alerts' | 'innovations' | 'settings';

export function SaasAdminConsole() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleLogout = async () => {
    try {
      await tenantAuthService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao sair:', error);
      // Fallback reload just in case
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants' as TabType, label: 'Organizações', icon: Users },
    { id: 'environments' as TabType, label: 'Ambientes', icon: Layers },
    { id: 'plans' as TabType, label: 'Planos', icon: Package },
    { id: 'whitelabel' as TabType, label: 'White Label', icon: Palette },
    { id: 'databases' as TabType, label: 'Bases de Dados', icon: Database },
    { id: 'metrics' as TabType, label: 'Métricas', icon: TrendingUp },
    { id: 'logs' as TabType, label: 'Logs de Auditoria', icon: FileText },
    { id: 'alerts' as TabType, label: 'Alertas', icon: AlertTriangle },
    { id: 'innovations' as TabType, label: 'Inovações', icon: Sparkles },
    { id: 'settings' as TabType, label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Painel Administrativo Global</h1>
              <p className="text-blue-100">Console de gerenciamento SaaS Multi-Tenant</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-700 px-4 py-2 rounded-lg">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Sistema Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                title="Sair do painel global"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-6">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full px-6 py-6">
        {activeTab === 'dashboard' && <SaasAdminDashboard />}
        {activeTab === 'tenants' && <SaasTenantsManagement />}
        {activeTab === 'environments' && <SaasEnvironmentsView />}
        {activeTab === 'plans' && <SaasPlansManager />}
        {activeTab === 'logs' && <SaasAdminLogs />}
        {activeTab === 'whitelabel' && <WhiteLabelManagement />}

        {activeTab === 'databases' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Gestão de Bases de Dados</h2>
            <p className="text-gray-600 dark:text-gray-400">Em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Métricas e Monitoramento</h2>
            <p className="text-gray-600 dark:text-gray-400">Em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Alertas e Notificações</h2>
            <p className="text-gray-600 dark:text-gray-400">Em desenvolvimento...</p>
          </div>
        )}

        {activeTab === 'innovations' && <InnovationsCrud />}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Configurações Globais</h2>
            <p className="text-gray-600 dark:text-gray-400">Em desenvolvimento...</p>
          </div>
        )}
      </div>
    </div>
  );
}
