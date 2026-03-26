import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Download, X } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '../../context/LanguageContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ContactUsModal } from './ContactUsModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('tms-remembered-email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('tms-remember-me') === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const languages: Array<{code: SupportedLanguage, label: string}> = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' }
  ];

  const handleLanguageClick = (lang: SupportedLanguage) => {
    localStorage.setItem('tms-login-language', lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    const pwaDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (pwaDismissed === 'true') {
      return;
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPWAPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
    } else {
    }

    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setDeferredPrompt(null);
    setShowPWAPrompt(false);
  };

  const handlePWADismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowPWAPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setError(t('login.offlineError'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLogin(email, password, rememberMe);

      if (rememberMe) {
        localStorage.setItem('tms-remember-me', 'true');
        localStorage.setItem('tms-remembered-email', email);
      } else {
        localStorage.removeItem('tms-remember-me');
        localStorage.removeItem('tms-remembered-email');
      }
    } catch (err) {
      setError((err as Error).message || t('login.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Logistics Image */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-slate-900/40 z-10"></div>

        {/* Transportation and technology image */}
        <img
          src="/Tamanho_pequenoveio-de-drone-camiao-no-porto-de-embarque-para-transporte-de-carga-e-logistica-empresarial.jpg"
          alt="Logistics"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
          decoding="sync"
        />

        {/* Animated elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-white/30 rounded-full animate-pulse z-20"></div>
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-white/40 rounded-full animate-pulse delay-1000 z-20"></div>
        <div className="absolute top-1/3 left-20 w-2 h-2 bg-white/50 rounded-full animate-pulse delay-500 z-20"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center px-8 sm:px-12 lg:px-16 bg-white dark:bg-gray-800">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('login.welcomeBack')}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('login.pleaseLogin')}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">{t('login.loginErrorTitle')}</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder={t('login.email')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                    placeholder={t('login.password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  {t('login.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('login.signingIn')}</span>
                  </div>
                ) : (
                  t('login.loginButton')
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('login.dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setShowContactUs(true)}
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t('login.contactUs')}
                </button>
              </p>
            </div>
          </form>

          {/* Language Selector - Official Flags */}
          <div className="flex justify-center items-center space-x-3 pt-4 pb-2">
            {/* Brazil Flag */}
            <button
              type="button"
              onClick={() => handleLanguageClick('pt')}
              className={`group relative w-8 h-6 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 ${
                i18n.language === 'pt' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              title="Português"
            >
              <img src="/flag-brazil.png" alt="Brasil" className="w-full h-full object-cover" />
            </button>

            {/* Spain Flag */}
            <button
              type="button"
              onClick={() => handleLanguageClick('es')}
              className={`group relative w-8 h-6 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 ${
                i18n.language === 'es' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              title="Español"
            >
              <img src="/flag-spain.png" alt="España" className="w-full h-full object-cover" />
            </button>

            {/* USA Flag */}
            <button
              type="button"
              onClick={() => handleLanguageClick('en')}
              className={`group relative w-8 h-6 rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 ${
                i18n.language === 'en' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              title="English"
            >
              <img src="/flag-usa.png" alt="United States" className="w-full h-full object-cover" />
            </button>
          </div>

          {/* Version */}
          <div className="text-center pt-1">
            <p className="text-xs text-gray-400 dark:text-gray-600">V1.22</p>
          </div>
        </div>
      </div>

      {/* PWA Install Prompt */}
      {!isInstalled && showPWAPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slideUp">
          <button
            onClick={handlePWADismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Download className="text-white" size={24} />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Instalar Log Axis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Instale nosso app para acesso rápido!
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={handlePWAInstall}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={handlePWADismiss}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      <ContactUsModal
        isOpen={showContactUs}
        onClose={() => setShowContactUs(false)}
      />
    </div>
  );
};