import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, usersService } from '../../services/usersService';
import { PasswordValidationForm } from './PasswordValidationForm';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface ForcePasswordResetScreenProps {
  user: User;
  onComplete: () => Promise<void>;
}

export const ForcePasswordResetScreen: React.FC<ForcePasswordResetScreenProps> = ({ 
  user, 
  onComplete 
}) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [, setError] = useState<string | null>(null);

  const handleSubmit = async (newPassword: string) => {
    try {
      setError(null);
      
      const dbUser = await usersService.getByEmail(user.email);
      if (!dbUser) throw new Error(t('forcePasswordReset.errors.userNotFound', 'Usuário não encontrado no banco de dados.'));
      
      const msgBuffer = new TextEncoder().encode(newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (dbUser.senha_hash === newHash) {
        throw new Error(t('forcePasswordReset.errors.samePassword', 'A nova senha não pode ser igual à senha atual que você está usando.'));
      }
      
      const realId = dbUser.id.toString();

      await usersService.update(realId, { senha: newPassword });
      await usersService.clearForcePasswordReset(realId);
      await onComplete();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('forcePasswordReset.errors.generic', 'Falha grave ao redefinir a senha.'));
    }
  };

  const username = ((user as any).name || user.nome || 'Usuário').split(' ')[0];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <div className="hidden lg:block lg:w-1/2 relative bg-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-slate-900/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"
          alt="Segurança"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('forcePasswordReset.title', 'Segurança em Primeiro Lugar')}
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              {t('forcePasswordReset.description', 'Sua conta foi sinalizada para uma redefinição obrigatória de credenciais pelos administradores de segurança do Log Axis.')}
            </p>
            <div className="mt-8 flex items-center space-x-3 text-sm text-blue-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>{t('forcePasswordReset.secureEnv', 'Ambiente Protegido Log Axis')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <button 
          onClick={logout}
          className="absolute top-8 right-8 flex items-center space-x-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span>{t('forcePasswordReset.logout', 'Sair (Logout)')}</span>
        </button>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/logo-logaxis.png" 
              alt="Log Axis" 
              className="h-14 w-auto object-contain" 
            />
          </div>

          <PasswordValidationForm 
            title={t('forcePasswordReset.hello', 'Olá, {{name}}', { name: username })}
            subtitle={t('forcePasswordReset.subtitle', 'Por medida de segurança, o Administrador determinou que você deve atualizar sua senha de acesso agora mesmo.')}
            buttonText={t('forcePasswordReset.button', 'Atualizar Senha & Acessar')}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
