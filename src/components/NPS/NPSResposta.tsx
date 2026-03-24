import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { npsService, NPSOpinioes } from '../../services/npsService';
import { Toast, ToastType } from '../common/Toast';
import { useTranslation } from 'react-i18next';

interface NPSRespostaProps {
  token: string;
}

const getNotaColor = (nota: number): string => {
  if (nota <= 6) return 'bg-[#FF5722]';
  if (nota <= 8) return 'bg-[#FFEB3B]';
  return 'bg-[#4CAF50]';
};



const getNotaTextColorOnBackground = (nota: number): string => {
  if (nota <= 6) return 'text-white';
  if (nota <= 8) return 'text-gray-800';
  return 'text-white';
};



export const NPSResposta: React.FC<NPSRespostaProps> = ({ token }) => {
  const { t } = useTranslation();
  const [pesquisa, setPesquisa] = useState<any>(null);
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [opinioes, setOpinioes] = useState<NPSOpinioes>({});
  const [avaliarAnonimo, setAvaliarAnonimo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const criterios = [
    { key: 'velocidade_processamento', label: t('nps.resposta.criterias.processingSpeed') },
    { key: 'clareza_informacoes', label: t('nps.resposta.criterias.infoClarity') },
    { key: 'pontualidade_entrega', label: t('nps.resposta.criterias.deliveryPunctuality') },
    { key: 'condicoes_mercadoria', label: t('nps.resposta.criterias.merchandiseConditions') },
  ];

  useEffect(() => {
    loadPesquisa();
  }, [token]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const notaParam = urlParams.get('nota');
    if (notaParam !== null) {
      const notaValue = parseInt(notaParam, 10);
      if (!isNaN(notaValue) && notaValue >= 0 && notaValue <= 10) {
        setNota(notaValue);
      }
    }
  }, []);

  const loadPesquisa = async () => {
    try {
      setIsLoading(true);

      const data = await npsService.getPesquisaByToken(token);


      if (!data) {
        console.error('❌ Pesquisa não encontrada');
        setToast({
          message: t('nps.resposta.evaluationNotFound'),
          type: 'error',
        });
        return;
      }

      if (data.status === 'respondida') {
        setSubmitted(true);
      } else if (data.status === 'expirada') {
        setToast({
          message: t('nps.resposta.evaluationExpired'),
          type: 'error',
        });
      }

      setPesquisa(data);
    } catch (error) {
      console.error('❌ Erro ao carregar pesquisa:', error);
      setToast({
        message: t('nps.resposta.errorSending'), // Fallback error message
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpiniao = (criterio: string, valor: 'positivo' | 'negativo') => {
    setOpinioes(prev => ({
      ...prev,
      [criterio]: prev[criterio as keyof NPSOpinioes] === valor ? null : valor,
    }));
  };

  const handleSubmit = async () => {
    if (nota === null) {
      setToast({
        message: t('nps.resposta.validationSelectNote'),
        type: 'error',
      });
      return;
    }

    try {
      setIsSending(true);

      await npsService.responderPesquisa(token, {
        nota,
        comentario: comentario || undefined,
        opinioes,
        avaliar_anonimo: avaliarAnonimo,
      });

      setSubmitted(true);
      setToast({
        message: t('nps.resposta.thanksAlert'),
        type: 'success',
      });
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setToast({
        message: t('nps.resposta.errorSending'),
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('nps.resposta.loading')}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {t('nps.resposta.thanksScreenTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('nps.resposta.thanksScreenSub')}
          </p>
        </div>
      </div>
    );
  }

  if (!pesquisa) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('nps.resposta.notFoundScreen')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6">
        {/* Painel esquerdo - Avaliação */}
        <div className={`${getNotaColor(nota ?? 5)} rounded-lg shadow-lg p-8 flex flex-col items-center justify-center text-center`}>
          <h1 className={`text-3xl font-bold mb-6 ${getNotaTextColorOnBackground(nota ?? 5)}`}>
            {t('nps.resposta.rateTitle')}
          </h1>

          <p className={`text-base mb-8 max-w-md ${getNotaTextColorOnBackground(nota ?? 5)}`}>
            {t('nps.resposta.rateQuestion')}
          </p>

          {/* Nota grande */}
          <div className={`text-9xl font-bold mb-6 ${getNotaTextColorOnBackground(nota ?? 5)}`}>
            {nota !== null ? nota : '-'}
          </div>

          {/* Escala visual */}
          <div className="w-full max-w-sm mb-6">
            <div className="relative h-2 bg-white dark:bg-gray-800/30 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-white dark:bg-gray-800/50 transition-all duration-300"
                style={{ width: nota !== null ? `${(nota / 10) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-sm ${getNotaTextColorOnBackground(nota ?? 5)}`}>0</span>
              <span className={`text-sm ${getNotaTextColorOnBackground(nota ?? 5)}`}>10</span>
            </div>
          </div>

          {/* Seletor de notas */}
          <div className="grid grid-cols-11 gap-2 w-full max-w-md">
            {[...Array(11)].map((_, i) => (
              <button
                key={i}
                onClick={() => setNota(i)}
                className={`
                  h-10 rounded-lg font-semibold transition-all
                  ${nota === i
                    ? 'bg-white shadow-lg transform scale-110'
                    : 'bg-white/20 hover:bg-white/40'
                  }
                  ${nota === i ? 'text-gray-800' : getNotaTextColorOnBackground(nota ?? 5)}
                `}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Painel direito - Opiniões */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            {t('nps.resposta.leaveOpinion')}
          </h2>

          <div className="space-y-4 mb-6">
            {criterios.map((criterio) => (
              <div
                key={criterio.key}
                className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {criterio.label}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpiniao(criterio.key, 'negativo')}
                    className={`p-2 rounded-lg transition-all ${
                      opinioes[criterio.key as keyof NPSOpinioes] === 'negativo'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-white text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpiniao(criterio.key, 'positivo')}
                    className={`p-2 rounded-lg transition-all ${
                      opinioes[criterio.key as keyof NPSOpinioes] === 'positivo'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-white text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('nps.resposta.howCanWeImproveLabel')}
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={t('nps.resposta.howCanWeImprovePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={avaliarAnonimo}
                onChange={(e) => setAvaliarAnonimo(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('nps.resposta.anonReview')}</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSending || nota === null}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? t('nps.resposta.submitting') : t('nps.resposta.submitReview')}
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
