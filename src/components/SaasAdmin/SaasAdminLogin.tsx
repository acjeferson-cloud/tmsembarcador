import React, { useState, useRef } from 'react';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { tenantAuthService } from '../../services/tenantAuthService';
import { logger } from '../../utils/logger';
import { SaasAdminMfaSetup } from './SaasAdminMfaSetup';
import { SaasAdminMfaChallenge } from './SaasAdminMfaChallenge';

interface SaasAdminLoginProps {
  onLoginSuccess: () => void;
}

export const SaasAdminLogin: React.FC<SaasAdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<'LOGIN' | 'MFA_SETUP' | 'MFA_CHALLENGE'>('LOGIN');
  
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const turnstileRef = useRef<TurnstileInstance>(null);

  // A Site Key do Cloudflare Turnstile é 100% pública por design.
  // Para evitar quebras no GCP causadas por Secrets desatualizados (com as tentativas das chaves anteriores),
  // fixamos a chave definitiva em código para garantir a mesma perfeição do Localhost na Produção.
  const turnstileSiteKey = '0x4AAAAAACwBQZiSuRibNl-J';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!captchaToken) {
        throw new Error('Validação de segurança não concluída. Por favor, aguarde o Cloudflare verificar.');
      }

      const result = await tenantAuthService.loginSaasAdmin(email, password, captchaToken);

      if (result.success) {
        if (result.needsMfaSetup) {
          logger.info('Admin needs MFA setup', 'SaasAdminLogin');
          setLoginStep('MFA_SETUP');
        } else if (result.needsMfaChallenge) {
          logger.info('Admin needs MFA challenge', 'SaasAdminLogin');
          setLoginStep('MFA_CHALLENGE');
        } else {
          // Já logado ou backend bypass
          logger.info('SaaS Admin logged in successfully', 'SaasAdminLogin');
          onLoginSuccess();
        }
      } else {
        console.error('Login failed:', result.error);
        setError(result.error || 'Falha no login');
        turnstileRef.current?.reset(); // reset token on Auth fail
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      logger.error('Login error', err, 'SaasAdminLogin');
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
      turnstileRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  if (loginStep === 'MFA_SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-md w-full mx-4">
          <SaasAdminMfaSetup 
            onSetupComplete={() => onLoginSuccess()} 
            onCancel={() => setLoginStep('LOGIN')} 
          />
        </div>
      </div>
    );
  }

  if (loginStep === 'MFA_CHALLENGE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-md w-full mx-4">
          <SaasAdminMfaChallenge 
            adminEmail={email}
            onChallengeSuccess={() => onLoginSuccess()} 
            onCancel={() => setLoginStep('LOGIN')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            SaaS Admin Console
          </h1>
          <p className="text-gray-300">
            Painel de Administração Global
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email do Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@exemplo.com.br"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Cloudflare Turnstile */}
            <div className="flex justify-center my-4">
              <Turnstile 
                ref={turnstileRef}
                siteKey={turnstileSiteKey} 
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setError('A validação anti-bot falhou. Tente novamente.')}
                options={{
                  theme: 'light',
                  size: 'normal',
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Autenticando...
                </>
              ) : !captchaToken ? (
                <>
                  <Shield className="w-5 h-5 mr-2 opacity-50" />
                  Aguardando Segurança (Cloudflare)...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Entrar no Admin Console
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-800 text-center flex flex-col gap-2">
                <span><strong>Acesso Restrito:</strong> Apenas administradores SaaS autorizados podem acessar este painel.</span>
                {!captchaToken && (
                  <span className="text-red-600 font-semibold mt-1">
                    [!] O widget de segurança do Cloudflare falhou ao carregar. Desative AdBlockers ou verifique o domínio.
                  </span>
                )}
              </p>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex flex-col items-center gap-1">
          <p className="text-gray-400 text-sm">
            © 2026 TMS Embarcador Log Axis. Todos os direitos reservados.
          </p>
          <span className="inline-block px-2 py-1 bg-gray-800 text-gray-500 text-xs rounded border border-gray-700 shadow-sm font-medium tracking-wide">
            v1.26.8
          </span>
        </div>
      </div>
    </div>
  );
};
