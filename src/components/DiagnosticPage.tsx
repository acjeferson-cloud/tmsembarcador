import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DiagnosticState {
  hasEnvUrl: boolean;
  hasEnvKey: boolean;
  connectionTest: {
    success: boolean;
    error: string | null;
    data: unknown;
  } | null;
  rpcTest: {
    success: boolean;
    error: string | null;
    errorCode: string | null;
    data: unknown;
  } | null;
  generalError?: string;
}

export default function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticState>({
    hasEnvUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasEnvKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    connectionTest: null,
    rpcTest: null,
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const { data: connData, error: connError } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        setDiagnostics((prev) => ({
          ...prev,
          connectionTest: {
            success: !connError,
            error: connError?.message || null,
            data: connData
          }
        }));

        const { data: rpcData, error: rpcError } = await supabase
          .rpc('validate_user_credentials', {
            p_email: 'test@test.com',
            p_password: 'test123',
            p_ip_address: null,
            p_user_agent: 'diagnostic-test'
          });

        setDiagnostics((prev) => ({
          ...prev,
          rpcTest: {
            success: !rpcError,
            error: rpcError?.message || null,
            errorCode: rpcError?.code || null,
            data: rpcData
          }
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setDiagnostics((prev) => ({
          ...prev,
          generalError: errorMessage
        }));
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Diagnóstico de Conexão Supabase
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Variáveis de Ambiente
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className={diagnostics.hasEnvUrl ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.hasEnvUrl ? '✓' : '✗'}
              </span>
              <span className="font-semibold">VITE_SUPABASE_URL:</span>
              <span className="text-blue-600">{diagnostics.hasEnvUrl ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={diagnostics.hasEnvKey ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.hasEnvKey ? '✓' : '✗'}
              </span>
              <span className="font-semibold">VITE_SUPABASE_ANON_KEY:</span>
              <span className="text-blue-600">{diagnostics.hasEnvKey ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Teste de Conexão
          </h2>
          {diagnostics.connectionTest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={diagnostics.connectionTest.success ? 'text-green-600 text-2xl' : 'text-red-600 text-2xl'}>
                  {diagnostics.connectionTest.success ? '✓' : '✗'}
                </span>
                <span className="font-semibold">
                  {diagnostics.connectionTest.success ? 'CONEXÃO OK' : 'FALHA NA CONEXÃO'}
                </span>
              </div>
              {diagnostics.connectionTest.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                  <p className="text-red-800 font-mono text-sm">
                    {diagnostics.connectionTest.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Testando...</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Teste de Função RPC (validate_user_credentials)
          </h2>
          {diagnostics.rpcTest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={diagnostics.rpcTest.success ? 'text-green-600 text-2xl' : 'text-red-600 text-2xl'}>
                  {diagnostics.rpcTest.success ? '✓' : '✗'}
                </span>
                <span className="font-semibold">
                  {diagnostics.rpcTest.success ? 'FUNÇÃO RPC OK' : 'FUNÇÃO RPC NÃO ENCONTRADA'}
                </span>
              </div>
              {diagnostics.rpcTest.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                  <p className="text-red-800 font-semibold">Erro:</p>
                  <p className="text-red-800 font-mono text-sm">{diagnostics.rpcTest.error}</p>
                  {diagnostics.rpcTest.errorCode && (
                    <p className="text-red-600 font-mono text-xs mt-1">
                      Código: {diagnostics.rpcTest.errorCode}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Testando...</p>
          )}
        </div>

        {diagnostics.generalError && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mt-6">
            <h3 className="font-semibold text-red-800 mb-2">Erro Geral:</h3>
            <p className="text-red-700 font-mono text-sm">{diagnostics.generalError}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">O que fazer se houver erros:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Verificar se as variáveis de ambiente estão corretas na plataforma de hospedagem</li>
            <li>Limpar o cache do build e fazer redeploy</li>
            <li>Verificar se a URL do Supabase está correta no painel do Supabase</li>
            <li>Verificar se as Row Level Security (RLS) policies estão configuradas corretamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
