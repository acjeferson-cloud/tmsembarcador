import React, { useState } from 'react';
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import zxcvbn from 'zxcvbn';
import { InlineMessage } from '../common/InlineMessage';

export interface PasswordValidationFormProps {
  onSubmit: (password: string) => Promise<void>;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export const PasswordValidationForm: React.FC<PasswordValidationFormProps> = ({
  onSubmit,
  isLoading = false,
  title,
  subtitle,
  buttonText
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strength score (0-4)
  const passwordScore = password ? zxcvbn(password).score : 0;
  
  const validatePassword = (): boolean => {
    if (!password) {
      setError(t('users.form.fields.passwordRequired', 'Senhas são obrigatórias'));
      return false;
    }
    if (password.length < 8) {
      setError(t('users.form.fields.passwordMinLength', 'A senha deve ter pelo menos 8 caracteres'));
      return false;
    }
    if (passwordScore < 3) {
      // Score < 3 means Weak
      setError(t('users.form.fields.passwordWeakFeedback', 'A senha é muito fraca. Misture letras maiúsculas, minúsculas, números e símbolos especiais.'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('users.form.fields.passwordMismatch', 'A confirmação de senha não confere'));
      return false;
    }
    
    setError(null);
    return true;
  };

  const getStrengthColor = (score: number) => {
    if (!password) return 'bg-gray-200 dark:bg-gray-700';
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getStrengthLabel = (score: number) => {
    if (!password) return '';
    switch (score) {
      case 0:
      case 1:
        return t('users.form.fields.passwordStrengthWeak', 'Fraca');
      case 2:
        return t('users.form.fields.passwordStrengthReasonable', 'Razoável');
      case 3:
        return t('users.form.fields.passwordStrengthGood', 'Boa');
      case 4:
        return t('users.form.fields.passwordStrengthStrong', 'Forte');
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir a senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate strength bars
  const renderStrengthBars = () => {
    return (
      <div className="mt-2">
        <div className="flex items-center space-x-1 h-2 mb-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`flex-1 h-full rounded-full transition-colors ${
                password ? (passwordScore >= level || (passwordScore === 0 && level === 1) ? getStrengthColor(passwordScore) : 'bg-gray-200 dark:bg-gray-700') : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        {password && (
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-400">Força da senha:</span>
            <span className={`font-semibold ${
              passwordScore < 2 ? 'text-red-500' : 
              passwordScore === 2 ? 'text-yellow-600 dark:text-yellow-500' : 
              passwordScore === 3 ? 'text-blue-500' : 'text-green-500'
            }`}>
              {getStrengthLabel(passwordScore)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const processing = isLoading || isSubmitting;

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
          <Shield size={28} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title || t('passwordReset.title', 'Criar Nova Senha')}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {subtitle || t('passwordReset.subtitle', 'Sua senha deve ter no mínimo 8 caracteres, contendo letras, números e símbolos.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 animate-fadeIn">
            <div className="flex items-start tracking-tight space-x-2 text-sm text-red-800">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Nova Senha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('users.form.fields.newPassword', 'Nova Senha')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="••••••••••••"
              disabled={processing}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={processing}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {renderStrengthBars()}
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('users.form.fields.confirmPassword', 'Confirmar Senha')}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="••••••••••••"
              disabled={processing}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={processing}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {password && confirmPassword && password === confirmPassword && (
            <p className="mt-2 text-xs text-green-600 flex items-center">
              <CheckCircle size={12} className="mr-1" />
              Senhas conferem
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={processing || !password || !confirmPassword}
          className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center mt-4"
        >
          {processing ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processando...</span>
            </div>
          ) : (
            buttonText || t('passwordReset.buttonSubmit', 'Alterar Senha e Acessar')
          )}
        </button>
      </form>
    </div>
  );
};
