import React, { useState } from 'react';
import { Login } from './Login';
import { EnvironmentSelector } from './EnvironmentSelector';
import { authWithEnvironmentService } from '../../services/authWithEnvironmentService';

interface LoginWithEnvironmentFlowProps {
  onLoginSuccess: (loginData: any) => void;
}

export const LoginWithEnvironmentFlow: React.FC<LoginWithEnvironmentFlowProps> = ({
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'login' | 'select-environment'>('login');
  const [validatedEmail, setValidatedEmail] = useState<string>('');
  const [validatedPassword, setValidatedPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);

  console.log('[LoginWithEnvironmentFlow] Current step:', step);

  const handleLoginSubmit = async (email: string, password: string, remember: boolean) => {
    try {
      console.log('[LoginWithEnvironmentFlow] Validating credentials for:', email);

      // Validar credenciais
      const result = await authWithEnvironmentService.validateCredentials(email, password);
      console.log('[LoginWithEnvironmentFlow] Validation result:', result);

      if (!result.success) {
        console.error('[LoginWithEnvironmentFlow] Validation failed:', result.error);
        throw new Error(result.error || 'Credenciais inválidas');
      }

      // Credenciais válidas, passar para seleção de environment
      console.log('[LoginWithEnvironmentFlow] Credentials valid, switching to environment selection');
      setValidatedEmail(email);
      setValidatedPassword(password);
      setRememberMe(remember);
      setStep('select-environment');
    } catch (error) {
      console.error('[LoginWithEnvironmentFlow] Login error:', error);
      throw error;
    }
  };

  const handleEnvironmentSelect = async (environmentId: string, establishmentCode: string) => {
    try {
      // Fazer login no environment selecionado
      const loginResult = await authWithEnvironmentService.loginWithEnvironment(
        validatedEmail,
        environmentId
      );

      if (!loginResult.success) {
        throw new Error(loginResult.error || 'Erro ao fazer login no ambiente');
      }

      // Chamar callback de sucesso com os dados do login
      onLoginSuccess({
        ...loginResult,
        rememberMe,
      });
    } catch (error) {
      console.error('Environment selection error:', error);
      throw error;
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setValidatedEmail('');
    setValidatedPassword('');
  };

  if (step === 'select-environment') {
    return (
      <EnvironmentSelector
        email={validatedEmail}
        password={validatedPassword}
        onSelect={handleEnvironmentSelect}
        onBack={handleBackToLogin}
      />
    );
  }

  return <Login onLogin={handleLoginSubmit} />;
};
