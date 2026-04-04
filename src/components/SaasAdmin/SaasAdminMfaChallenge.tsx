import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertCircle, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import { saasAdminLogsService } from '../../services/saasAdminLogsService';

interface SaasAdminMfaChallengeProps {
  onChallengeSuccess: () => void;
  onCancel: () => void;
  adminEmail: string;
}

export const SaasAdminMfaChallenge: React.FC<SaasAdminMfaChallengeProps> = ({ onChallengeSuccess, onCancel, adminEmail }) => {
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackupMode, setIsBackupMode] = useState(false);

  useEffect(() => {
    loadFactor();
  }, []);

  const loadFactor = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data && data.totp.length > 0) {
      setFactorId(data.totp[0].id);
    } else {
      setError('Nenhum fator MFA encontrado. Contate outro administrador.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. BLOCKS CHECK (removido)

      if (isBackupMode) {
        // Backup code flow
        // 1. Hash the code
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedCode = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 2. Validate it via RPC
        const { data: isValid, error: rpcError } = await supabase.rpc('verify_saas_mfa_backup_code', {
          p_email: adminEmail,
          p_code_hash: hashedCode
        });

        if (rpcError || !isValid) {
          throw new Error('Código de recuperação inválido ou já utilizado.');
        }

        // 3. To simulate AAL2 so the frontend doesn't block them immediately,
        // we set a temporary localStorage flag that the guard checks (since we didn't use unenroll edge function)
        localStorage.setItem('saas_admin_backup_bypass', Date.now().toString());
        logger.info('Admin used backup code successfully', 'SaasAdminMfaChallenge');
        
        await saasAdminLogsService.logAction(
          'MFA_BACKUP_USE_SUCCESS',
          'MFA_BACKUP',
          'Admin autenticou usando um código de recuperação.',
          { changes: { method: 'backup_code', email: adminEmail } }
        );

        onChallengeSuccess();
        return;
      }

      // Standard TOTP flow
      if (!factorId) throw new Error('Fator não carregado');

      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code
      });

      if (verify.error) throw verify.error;

      logger.info('MFA challenge success', 'SaasAdminMfaChallenge');
      
      await saasAdminLogsService.logAction(
        'MFA_VERIFY_SUCCESS',
        'MFA_TOTP',
        'Admin verificou o código TOTP com sucesso.',
        { changes: { method: 'totp' } }
      );

      onChallengeSuccess();
    } catch (err: any) {
      saasAdminLogsService.logAction(
        'MFA_VERIFY_FAILED',
        'MFA_TOTP',
        'Falha na validação do código MFA.',
        { changes: { error: err.message, isBackupMode } }
      ).catch(e => null);

      setError(err.message === 'Usuário ou senha inválidos.' ? err.message : 'Código inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verificação de Segurança
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {isBackupMode 
            ? 'Insira um código de recuperação válido'
            : 'Abra seu app autenticador e digite o código de 6 dígitos.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Código {isBackupMode ? 'de Recuperação' : 'TOTP'}
          </label>
          <input
            type="text"
            maxLength={isBackupMode ? 8 : 6}
            value={code}
            onChange={(e) => isBackupMode ? setCode(e.target.value) : setCode(e.target.value.replace(/\D/g, ''))}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
            placeholder={isBackupMode ? "abcdef12" : "000000"}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={isLoading || (isBackupMode ? code.length < 8 : code.length < 6)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex justify-center items-center"
          >
            {isLoading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Verificar Código'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsBackupMode(!isBackupMode);
              setCode('');
              setError(null);
            }}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg flex items-center justify-center border border-gray-200"
          >
            <Key className="w-4 h-4 mr-2" />
            {isBackupMode ? 'Usar código do Autenticador (MFA)' : 'Usar código de recuperação'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4"
          >
            Voltar ao Login
          </button>
        </div>
      </form>
    </div>
  );
};
