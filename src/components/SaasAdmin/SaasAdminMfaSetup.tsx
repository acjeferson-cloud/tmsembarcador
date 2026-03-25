import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Copy, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import { saasAdminLogsService } from '../../services/saasAdminLogsService';

interface SaasAdminMfaSetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

export const SaasAdminMfaSetup: React.FC<SaasAdminMfaSetupProps> = ({ onSetupComplete, onCancel }) => {
  const [factorId, setFactorId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'backup_codes'>('setup');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const hasInitialized = React.useRef(false);
  
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initMfaSetup();
    }
  }, []);

  const initMfaSetup = async () => {
    try {
      // 1. Enroll fresh factor utilizing a unique friendlyName to bypass conflicts
      // from any hanging unverified factors that might have been created previously.

      // 2. Enroll fresh factor
      const uniqueName = `SaaS-Admin-${new Date().getTime()}`;
      const { data, error } = await supabase.auth.mfa.enroll({ 
        factorType: 'totp',
        friendlyName: uniqueName
      });
      
      if (error) {
        throw error;
      }

      setFactorId(data.id);
      setQrCodeUrl(data.totp.qr_code);
    } catch (err: any) {
      console.error('Error starting MFA setup', err);
      setError(`Erro na API do Supabase: ${err.message || JSON.stringify(err)}`);
    }
  };

  const generateBackupCodes = async () => {
    // Generate 8 codes of 8 hex chars each
    const codes = Array.from({ length: 8 }, () => {
      const array = new Uint8Array(4);
      crypto.getRandomValues(array);
      return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    });

    setBackupCodes(codes);

    // Hash codes for storage
    const hashedCodes = await Promise.all(codes.map(async (code) => {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(code));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }));

    // Save to database
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.rpc('store_mfa_backup_codes', {
        p_auth_user_id: userData.user.id,
        p_hashed_codes: hashedCodes
      });
      if (error) {
        console.error('Erro ao salvar códigos de backup', error);
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length < 6) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      
      if (challenge.error) {
        throw challenge.error;
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode
      });

      if (verify.error) {
        throw verify.error;
      }

      logger.info('MFA configurado com sucesso para admin', 'SaasAdminMfaSetup');
      
      await saasAdminLogsService.logAction(
        'MFA_SETUP_SUCCESS',
        'MFA_TOTP',
        'Configuração inicial de MFA e geração de backup codes.',
        { changes: { method: 'totp' } }
      );

      // Load backup codes and show them
      await generateBackupCodes();
      setStep('backup_codes');
      
    } catch (err: any) {
      console.error('MFA verify error', err);
      
      saasAdminLogsService.logAction(
        'MFA_SETUP_FAILED',
        'MFA_TOTP',
        'Falha na configuração inicial do MFA.',
        { changes: { error: err.message } }
      ).catch(e => console.error('Failed to log mfa setup error', e));

      setError('Código inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    alert('Códigos copiados para a área de transferência!');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurar Autenticação em 2 Passos
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Proteja sua conta de administrador com código de segurança.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {step === 'setup' ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <p className="text-sm font-medium mb-4 text-center dark:text-gray-300">
              Escaneie este QR Code no Google Authenticator ou Authy
            </p>
            {qrCodeUrl ? (
              <div className="bg-white p-2 border-4 border-white rounded-lg inline-block text-center">
                <img src={qrCodeUrl} alt="MFA QR Code" className="w-[150px] h-[150px] mx-auto" />
              </div>
            ) : (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            )}
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Digite o código de 6 dígitos gerado no app
              </label>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                required
              />
            </div>

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={isLoading || verifyCode.length < 6 || !factorId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex justify-center items-center"
              >
                {isLoading ? <RefreshCw className="animate-spin h-5 w-5" /> : 'Verificar e Ativar'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg"
              >
                Cancelar Login
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-green-800">Autenticação 2FA ativada!</h3>
              <p className="text-sm text-green-700 mt-1">
                Guarde os códigos de recuperação abaixo em um local seguro. Eles são a única forma de acessar o painel caso perca seu celular.
              </p>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-center">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="font-mono bg-white border rounded py-1 text-sm tracking-wider">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={copyCodes}
              className="mt-4 w-full flex items-center justify-center text-sm text-blue-600 font-medium hover:text-blue-800"
            >
              <Copy className="h-4 w-4 mr-2" /> Copiar códigos
            </button>
          </div>

          <button
            onClick={onSetupComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Acessar Admin Console
          </button>
        </div>
      )}
    </div>
  );
};
