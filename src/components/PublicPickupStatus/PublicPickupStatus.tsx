import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export function PublicPickupStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');

  const isConfirm = status === 'confirm';
  const isReject = status === 'reject';
  
  if (!isConfirm && !isReject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Inválido</h1>
          <p className="text-gray-600 mb-8">
            Ocorreu um erro ao processar sua solicitação. O link utilizado não é válido ou expirou.
          </p>
          <div className="pt-6 border-t border-gray-100 text-sm text-gray-400">
            Equipe LogAxis
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {isConfirm ? (
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        ) : (
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isConfirm ? 'Coleta Confirmada' : 'Coleta Recusada'}
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          {isConfirm 
            ? 'Agradecemos a confirmação! A coleta foi registrada com sucesso na data solicitada.'
            : 'Sua restrição foi registrada. Nossa equipe entrará em contato em breve para alinhar uma nova data ou opção de atendimento.'}
        </p>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-500 font-medium tracking-wide">
          TMS EMBARCADOR • LOGAXIS
        </div>
      </div>
    </div>
  );
}
