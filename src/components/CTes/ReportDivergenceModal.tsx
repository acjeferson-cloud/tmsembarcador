import React, { useState } from 'react';
import { X, Download, Mail, MessageCircle, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { cteDivergenceReportService, DivergenceReportData } from '../../services/cteDivergenceReportService';
import { whatsappService } from '../../services/whatsappService';
import { supabase } from '../../lib/supabase';

interface ReportDivergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cteData: DivergenceReportData;
  establishmentId: string;
  establishmentName: string;
  userId: string;
}

export const ReportDivergenceModal: React.FC<ReportDivergenceModalProps> = ({
  isOpen,
  onClose,
  cteData,
  establishmentId,
  establishmentName,
  userId
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  if (!isOpen) return null;

  const divergentCount = cteData.comparisonData.filter(item => item.status === 'divergent').length;
  const correctCount = cteData.comparisonData.filter(item => item.status === 'correct').length;

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, establishmentName);

      const savedReportId = await cteDivergenceReportService.saveReport(
        cteData,
        userId,
        establishmentId
      );
      setReportId(savedReportId);

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CTe_${cteData.cteNumber}_${cteData.carrierName}_Divergencia.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Relatório gerado e baixado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro ao gerar o relatório. Tente novamente.';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendByEmail = async () => {
    if (!cteData.carrierEmail) {
      setMessage({
        type: 'error',
        text: 'O transportador não possui email cadastrado.'
      });
      return;
    }

    setIsSendingEmail(true);
    setMessage(null);

    try {
      const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, establishmentName);

      let currentReportId = reportId;
      if (!currentReportId) {
        currentReportId = await cteDivergenceReportService.saveReport(
          cteData,
          userId,
          establishmentId
        );
        setReportId(currentReportId);
      }

      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        const emailSubject = `Relatório de Divergência - CT-e ${cteData.cteNumber}`;
        const emailBody = `
          <h2>Relatório de Divergência de CT-e</h2>
          <p>Prezado transportador <strong>${cteData.carrierName}</strong>,</p>
          <p>Segue em anexo o relatório detalhado de divergência identificada no CT-e <strong>${cteData.cteNumber}</strong>.</p>

          <h3>Resumo:</h3>
          <ul>
            <li>Taxas corretas: ${correctCount}</li>
            <li>Taxas divergentes: ${divergentCount}</li>
          </ul>

          <p>Por favor, revisar os valores divergentes e tomar as providências necessárias.</p>

          <p>Atenciosamente,<br>${establishmentName}</p>
        `;

        const { data, error } = await supabase.functions.invoke('enviar-email-nps', {
          body: {
            estabelecimentoId: establishmentId,
            to: cteData.carrierEmail,
            subject: emailSubject,
            html: emailBody
          }
        });

        if (error) {
          throw new Error(error.message || 'Falha ao invocar função de envio de email');
        }

        if (!data?.success) {
          throw new Error(data?.error || data?.message || 'Falha na resposta do envio de email');
        }

        await cteDivergenceReportService.markAsSentByEmail(currentReportId, cteData.carrierEmail);

        setMessage({
          type: 'success',
          text: `Email enviado com sucesso para ${cteData.carrierEmail}!`
        });
      };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao enviar email. Verifique a configuração de email do estabelecimento.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendByWhatsApp = async () => {
    if (!cteData.carrierPhone) {
      setMessage({
        type: 'error',
        text: 'O transportador não possui telefone cadastrado.'
      });
      return;
    }

    setIsSendingWhatsApp(true);
    setMessage(null);

    try {
      let currentReportId = reportId;
      if (!currentReportId) {
        currentReportId = await cteDivergenceReportService.saveReport(
          cteData,
          userId,
          establishmentId
        );
        setReportId(currentReportId);
      }

      const whatsappMessage = `
*Relatório de Divergência - CT-e ${cteData.cteNumber}*

Prezado transportador *${cteData.carrierName}*,

Identificamos divergências no CT-e ${cteData.cteNumber}.

*Resumo:*
✓ Taxas corretas: ${correctCount}
✗ Taxas divergentes: ${divergentCount}

Por favor, revisar os valores divergentes conforme relatório detalhado.

Atenciosamente,
${establishmentName}
      `.trim();

      await whatsappService.sendMessage(
        establishmentId,
        cteData.carrierPhone,
        whatsappMessage
      );

      await cteDivergenceReportService.markAsSentByWhatsApp(currentReportId, cteData.carrierPhone);

      setMessage({
        type: 'success',
        text: `Mensagem enviada com sucesso para ${cteData.carrierPhone}!`
      });
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao enviar WhatsApp. Verifique a configuração do WhatsApp.'
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reportar Divergência</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Sobre o Relatório de Divergência
                </h3>
                <p className="text-sm text-blue-800">
                  Este relatório contém uma análise detalhada das divergências identificadas entre
                  os valores calculados pelo TMS e os valores apresentados no CT-e. O documento
                  inclui as fórmulas de cálculo utilizadas e os valores base considerados.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">CT-e</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{cteData.cteNumber}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transportador</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{cteData.carrierName}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taxas Corretas</div>
                <div className="text-xl font-bold text-green-700">{correctCount}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taxas Divergentes</div>
                <div className="text-xl font-bold text-red-700">{divergentCount}</div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Gerando Relatório...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Baixar Relatório (PDF)</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendByEmail}
              disabled={isSendingEmail || !cteData.carrierEmail}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingEmail ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Enviando por Email...</span>
                </>
              ) : (
                <>
                  <Mail size={20} />
                  <span>
                    {cteData.carrierEmail
                      ? `Enviar por Email (${cteData.carrierEmail})`
                      : 'Email não cadastrado'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleSendByWhatsApp}
              disabled={isSendingWhatsApp || !cteData.carrierPhone}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Enviando por WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={20} />
                  <span>
                    {cteData.carrierPhone
                      ? `Enviar por WhatsApp (${cteData.carrierPhone})`
                      : 'WhatsApp não cadastrado'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
