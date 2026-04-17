import React, { useState } from 'react';
import { X, Download, Mail, MessageCircle, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { cteDivergenceReportService, DivergenceReportData } from '../../services/cteDivergenceReportService';
import { whatsappService } from '../../services/whatsappService';
import { supabase } from '../../lib/supabase';
import { useInnovations } from '../../contexts/InnovationsContext';

interface ReportDivergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cteData: DivergenceReportData;
  establishmentId: string;
  establishmentName: string;
  establishmentCnpj?: string;
  logoBase64?: string;
  logoUrl?: string;
  userId: string;
}

export const ReportDivergenceModal: React.FC<ReportDivergenceModalProps> = ({
  isOpen,
  onClose,
  cteData,
  establishmentId,
  establishmentName,
  establishmentCnpj,
  logoBase64,
  logoUrl,
  userId
}) => {
  const { isInnovationActive } = useInnovations();
  const whatsappActive = isInnovationActive('whatsapp');
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
      const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });

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
// null
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
      const pdfBlob = await cteDivergenceReportService.generatePDF(cteData, { establishmentId, establishmentName, establishmentCnpj, user: { id: userId }, logoBase64 });

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
          // --- BULLETPROOF DB FETCH FOR LOGO ---
          console.log('[EMAIL DB FETCH] Iniciando busca do logotipo para envio. Establishment ID/CNPJ:', establishmentId, establishmentCnpj);
          console.log('[EMAIL DB FETCH] Logo base64 do frontend recebido:', logoBase64 ? logoBase64.substring(0, 30) + '...' : 'Nenhum');
          console.log('[EMAIL DB FETCH] Logo URL do frontend recebida:', logoUrl || 'Nenhum');
          
          let definitiveLogoUrl = '';
          let logoAttachment: any = null;
          
          try {
              let query = (supabase as any).from('establishments').select('metadata');
              
              const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(establishmentId);
              
              if (isUuid) {
                  console.log('[EMAIL DB FETCH] ID é formatado como UUID. Buscando na coluna id.');
                  query = query.eq('id', establishmentId);
              } else {
                  console.log('[EMAIL DB FETCH] ID não é UUID (provavelmente CNPJ). Buscando na coluna cnpj.');
                  const cleanCnpj = establishmentCnpj ? String(establishmentCnpj).replace(/\D/g, '') : String(establishmentId).replace(/\D/g, '');
                  query = query.eq('cnpj', cleanCnpj);
              }
              
              const { data: dbEst, error: dbErr } = await query.maybeSingle();
              
              if (dbErr) {
                 console.error('[EMAIL DB FETCH] Erro na consulta do DB:', dbErr);
              }
              
              if (dbEst) {
                  console.log('[EMAIL DB FETCH] Estabelecimento retornado. Verificando dados:', JSON.stringify(dbEst));
                  
                  const rawVal = dbEst.metadata?.logo_nps_url || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || '';
                  console.log('[EMAIL DB FETCH] Melhor URL/Path de logotipo encontrado bruto:', rawVal || 'Nenhum');
                  
                  if (rawVal) {
                      if (rawVal.startsWith('http')) {
                          console.log('[EMAIL DB FETCH] RESOLVIDO: O banco retornou um HTTP absoluto valido.', rawVal);
                          definitiveLogoUrl = rawVal;
                      } else if (!rawVal.startsWith('data:')) {
                         const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                         let cleanPath = rawVal;
                         if (cleanPath.startsWith('/public/logos/')) cleanPath = cleanPath.substring('/public/logos/'.length);
                         else if (cleanPath.startsWith('logos/')) cleanPath = cleanPath.substring('logos/'.length);
                         
                         definitiveLogoUrl = `${baseUrl}/storage/v1/object/public/logos/${cleanPath}`;
                         console.log('[EMAIL DB FETCH] RESOLVIDO: O banco retornou URL relativa. Montada URL absoluta com base do VITE:', definitiveLogoUrl);
                      }
                  } else {
                      console.log('[EMAIL DB FETCH] Nenhuma URL encontrada no banco. Buscando Base64 do banco...');
                      // Fallback to base64 if url is completely absent
                      const b64 = dbEst.metadata?.logo_nps_base64 || dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_base64 || '';
                      if (b64 && b64.length > 100) {
                         console.log('[EMAIL DB FETCH] RESOLVIDO: Base64 retornado pelo banco. Configurando como Content-ID (cid).');
                         let rawB64 = b64.includes('base64,') ? b64.split('base64,')[1] : b64;
                         logoAttachment = {
                            filename: 'logo.png',
                            content: rawB64,
                            encoding: 'base64',
                            cid: 'logo_empresa',
                            contentDisposition: 'inline'
                         };
                      } else {
                         console.log('[EMAIL DB FETCH] Base64 TAMBÉM VAZIO NO BANCO.');
                      }
                  }
              } else {
                  console.warn('[EMAIL DB FETCH] Nenhum estabelecimento encontrado no DB com esse Filtro!');
              }
          } catch(e) {
              console.error('[EMAIL DB FETCH] Failed to fetch auth logo:', e);
          }

          // Ultimate fallback if DB yielded nothing but screen passed a base64
          if (!definitiveLogoUrl && !logoAttachment && logoBase64 && logoBase64.length > 100) {
              console.log('[EMAIL DB FETCH] ULTIMO RECURSO: DB não tinha o arquivo, injetando o Base64 passado pela Interface (CID fallback).');
              let rawB64 = logoBase64.includes('base64,') ? logoBase64.split('base64,')[1] : logoBase64;
              logoAttachment = {
                 filename: 'logo.png',
                 content: rawB64,
                 encoding: 'base64',
                 cid: 'logo_empresa',
                 contentDisposition: 'inline'
              };
          }
          
          console.log('[EMAIL RESULT] definitiveLogoUrl:', definitiveLogoUrl);
          console.log('[EMAIL RESULT] logoAttachment exists?', !!logoAttachment);
          // --- END BULLETPROOF DB FETCH ---

          let logoHtml = '';
          
          if (definitiveLogoUrl) {
            logoHtml = `<div style="text-align: center; margin-bottom: 30px;">
                 <img src="${definitiveLogoUrl}" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
               </div>`;
          } else if (logoAttachment) {
             logoHtml = `<div style="text-align: center; margin-bottom: 30px;">
                 <img src="cid:logo_empresa" alt="Logo" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
               </div>`;
          }

          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              ${logoHtml}
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb;">Relatório de Divergência de CT-e</h2>
              </div>
              
              <p>Prezado transportador <strong>${cteData.carrierName}</strong>,</p>
              <p>Segue em anexo o relatório detalhado de divergência identificada no CT-e <strong>${cteData.cteNumber}</strong>.</p>
    
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">Resumo da Análise</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 10px; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #22c55e; margin-right: 10px;"></span>
                    <span style="color: #334155;"><strong>Taxas corretas:</strong> ${correctCount}</span>
                  </li>
                  <li style="display: flex; align-items: center;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: #ef4444; margin-right: 10px;"></span>
                    <span style="color: #334155;"><strong>Taxas divergentes:</strong> ${divergentCount}</span>
                  </li>
                </ul>
              </div>
    
              <p>Por favor, revisar os valores divergentes e tomar as providências necessárias.</p>
    
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              
              <p style="color: #64748b; font-size: 14px; margin-bottom: 5px;">Atenciosamente,</p>
              <p style="color: #334155; font-weight: bold; margin-top: 0;">${establishmentName}</p>
            </div>
          `;

          const emailPayload: any = {
            estabelecimentoId: establishmentId,
            to: cteData.carrierEmail,
            subject: emailSubject,
            html: emailBody,
            attachments: [
              {
                filename: `CTe_${cteData.cteNumber}_Divergencia.pdf`,
                content: base64data.split(',')[1],
                encoding: 'base64'
              }
            ]
          };

          if (logoAttachment) {
             emailPayload.attachments.push(logoAttachment);
          }

          const { data, error } = await supabase.functions.invoke('enviar-email-nps', { body: emailPayload });

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
// null
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
// null
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
              disabled={isSendingWhatsApp || !cteData.carrierPhone || !whatsappActive}
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed ${
                !whatsappActive
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
              }`}
              title={!whatsappActive ? 'Integração com WhatsApp não contratada. Ative em Inovações & Sugestões.' : ''}
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Enviando por WhatsApp...</span>
                </>
              ) : (
                <>
                  {whatsappActive && <MessageCircle size={20} />}
                  <span>
                    {!whatsappActive 
                      ? 'WhatsApp não Contratado' 
                      : cteData.carrierPhone
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
