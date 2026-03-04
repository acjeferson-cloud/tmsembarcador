import React, { useState, useEffect } from 'react';
import { SaasAdminLogin } from './SaasAdminLogin';
import { SaasAdminConsole } from './SaasAdminConsole';
import { tenantAuthService } from '../../services/tenantAuthService';

export function SaasAdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    try {
      const isSaasAdmin = await tenantAuthService.isSaasAdmin();
      setIsAuthenticated(isSaasAdmin);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }

  function handleLoginSuccess() {
    setIsAuthenticated(true);
  }

  function handleLogout() {
    tenantAuthService.logout();
    setIsAuthenticated(false);
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SaasAdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <SaasAdminConsole />;
}
