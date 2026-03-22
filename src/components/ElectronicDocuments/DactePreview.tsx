import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { formatCurrency, formatAccessKey } from '../../utils/formatters';

import { useTranslation } from 'react-i18next';

interface DactePreviewProps {
  document: ElectronicDocument;
  onClose: () => void;
}

export const DactePreview: React.FC<DactePreviewProps> = ({ document, onClose }) => {
  const { t } = useTranslation();
  const getHtmlContent = () => `
    <html>
      <head>
        <title>DACTE - ${document.chaveAcesso}</title>
        <style>
          @page { size: A4 portrait; margin: 5mm; }
          *, *:before, *:after { box-sizing: border-box; }
          html, body { width: 100%; margin: 0; padding: 0; font-family: "Times New Roman", Times, serif; font-size: 10px; color: #000; overflow-x: hidden; box-sizing: border-box; }
          .dacte-container { width: 98%; max-width: 100%; margin: 0 auto; padding-right: 2px; }
          .box { border: 1px solid #000; padding: 3px 4px; border-radius: 2px; position: relative; }
          .lbl { font-size: 6px; text-transform: uppercase; font-weight: bold; margin-bottom: 3px; display: block; letter-spacing: 0.2px; }
          .val { font-size: 9px; font-weight: bold; display: block; line-height: 1.2; }
          .row { display: flex; width: 100%; margin-top: -1px; }
          .row > .box { margin-left: -1px; flex: 1; }
          .row > .box:first-child { margin-left: 0; }
          
          /* Title bands */
          .section-title { font-size: 8px; font-weight: bold; text-transform: uppercase; margin: 10px 0 2px 0; background: #eee; padding: 3px; border: 1px solid #000; text-align: center; }
          
          /* Headers & Canhoto */
          .canhoto-container { margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          
          .header-main { display: flex; margin-bottom: 5px; }
          .header-left { width: 40%; border: 1px solid #000; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
          .header-center { width: 20%; border: 1px solid #000; margin-left: -1px; text-align: center; padding: 4px; }
          .header-right { width: 40%; border: 1px solid #000; margin-left: -1px; padding: 4px; }
          
          .barcode { height: 40px; border: 1px solid #ccc; margin: 5px 0; text-align: center; line-height: 40px; font-size: 10px; background: #eee; }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .mt-1 { margin-top: 5px; }
          .font-sm { font-size: 8px; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="dacte-container">
          
          <!-- CANHOTO -->
          <div class="canhoto-container">
            <div class="row">
              <div class="box" style="width: 80%; flex: none;">
                <span class="lbl" style="font-size: 7px;">DECLARO QUE RECEBI OS VOLUMES DESTE CONHECIMENTO EM PERFEITO ESTADO PELO QUE DOU POR CUMPRIDO O PRESENTE CONTRATO DE TRANSPORTE</span>
                <div class="row mt-1 border-0" style="margin-top:15px;">
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px;">
                    <span class="lbl font-sm">NOME</span>
                  </div>
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px; margin-left: 10px; width: 25%; flex: none;">
                    <span class="lbl font-sm">RG / IDENTIDADE</span>
                  </div>
                  <div class="box border-0" style="border:none; border-top: 1px solid #000; padding-top:2px; margin-left: 10px;">
                    <span class="lbl font-sm">ASSINATURA / CARIMBO</span>
                  </div>
                </div>
              </div>
              <div class="box text-center" style="width: 20%; flex: none; display: flex; flex-direction: column; justify-content: center;">
                <b style="font-size: 14px;">CT-e</b><br/>
                <span style="font-size: 11px;">Nº ${document.numeroDocumento}</span><br/>
                <span style="font-size: 10px;">Série ${document.serie}</span>
              </div>
            </div>
          </div>
          
          <!-- HEADER PRINCIPAL -->
          <div class="header-main text-center bg-gray">
             <div style="width: 100%; border: 1px solid #000; padding: 4px; font-weight:bold; font-size:12px; background:#eee;">
               TIPO DO CT-E: 0 - CT-e Normal
             </div>
          </div>
          <div class="header-main">
            <!-- EMITENTE -->
            <div class="header-left">
              <div class="text-center" style="font-size: 11px; font-weight: bold; margin-bottom: 5px;">
                ${document.emitente.razaoSocial}
              </div>
              <div style="font-size: 9px; text-align: center;">
                ${document.emitente.endereco}<br/>
                ${document.emitente.cidade} - ${document.emitente.uf} - CEP: ${document.emitente.cep}
              </div>
              <div style="font-size: 10px; text-align: center; margin-top:5px;">
                <b>CNPJ: ${document.emitente.cnpj}</b>
              </div>
            </div>
            
            <!-- DACTE -->
            <div class="header-center">
              <b style="font-size: 16px;">DACTE</b><br/>
              <span style="font-size: 9px;">Documento Auxiliar do<br/>Conhecimento de Transporte<br/>Eletrônico</span><br/>
              <br/>
              <b style="font-size: 12px;">MODAL RODOVIÁRIO</b><br/>
              <span style="font-size: 9px;">Página 1 de 1</span><br/>
              <br/>
              <b style="font-size: 11px;">Nº ${document.numeroDocumento}</b><br/>
              <b style="font-size: 11px;">SÉRIE: ${document.serie}</b>
            </div>
            
            <!-- CHAVE/BARRAS -->
            <div class="header-right">
              <div class="barcode">|||| |||||| ||||||| |||||||| ||||| CÓDIGO DE BARRAS</div>
              <span class="lbl mt-1">CHAVE DE ACESSO</span>
              <div class="val text-center" style="font-size: 11px; margin-bottom: 5px;">
                ${formatAccessKey(document.chaveAcesso)}
              </div>
              <div style="font-size: 8px; text-align: center;">
                Consulta de autenticidade no portal nacional do CT-e www.cte.fazenda.gov.br/portal ou no site da Sefaz Autorizadora.
              </div>
              <div class="row mt-1" style="margin-left:-4px; margin-right:-4px; margin-bottom:-4px; border-top:1px solid #000;">
                 <div class="box" style="border:none; border-right:1px solid #000; width:50%; flex:none;">
                   <span class="lbl text-center">PROTOCOLO DE AUTORIZAÇÃO</span>
                   <span class="val text-center" style="display:block;">${document.protocoloAutorizacao || ' - '}</span>
                 </div>
                 <div class="box" style="border:none; width:50%; flex:none;">
                   <span class="lbl text-center">DATA DA AUTORIZAÇÃO</span>
                   <span class="val text-center" style="display:block;">${new Date(document.dataAutorizacao).toLocaleString('pt-BR')}</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">CFOP - NATUREZA DA PRESTAÇÃO</span>
              <span class="val">5351 - PRESTAÇÃO DE SERVIÇO DE TRANSPORTE</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">MUNICÍPIO DE INÍCIO DA PRESTAÇÃO</span>
              <span class="val">${document.emitente.cidade} - ${document.emitente.uf}</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">MUNICÍPIO DE TÉRMINO DA PRESTAÇÃO</span>
              <span class="val">${document.destinatario?.cidade} - ${document.destinatario?.uf}</span>
            </div>
          </div>
          
          <!-- TOMADOR -->
          <div class="section-title">TOMADOR DO SERVIÇO</div>
          <div class="row">
            <div class="box" style="width: 50%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.emitente.razaoSocial || document.destinatario?.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.emitente.cidade || document.destinatario?.cidade || ''}</span>
            </div>
            <div class="box" style="width: 5%; flex: none;">
              <span class="lbl">UF</span>
              <span class="val">${document.emitente.uf || document.destinatario?.uf || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.emitente.cnpj || document.destinatario?.cnpjCpf || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">INSCRIÇÃO ESTADUAL</span>
              <span class="val"></span>
            </div>
          </div>

          <!-- REMETENTE -->
          <div class="section-title">REMETENTE</div>
          <div class="row">
            <div class="box" style="width: 40%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.emitente.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 30%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val">${document.emitente.endereco || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.emitente.cidade || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.emitente.cnpj || ''}</span>
            </div>
          </div>

          <!-- DESTINATÁRIO -->
          <div class="section-title">DESTINATÁRIO</div>
          <div class="row">
            <div class="box" style="width: 40%; flex: none;">
              <span class="lbl">NOME/RAZÃO SOCIAL</span>
              <span class="val">${document.destinatario?.razaoSocial || ''}</span>
            </div>
            <div class="box" style="width: 30%; flex: none;">
              <span class="lbl">ENDEREÇO</span>
              <span class="val">${document.destinatario?.endereco || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">MUNICÍPIO</span>
              <span class="val">${document.destinatario?.cidade || ''}</span>
            </div>
            <div class="box" style="width: 15%; flex: none;">
              <span class="lbl">CNPJ/CPF</span>
              <span class="val">${document.destinatario?.cnpjCpf || ''}</span>
            </div>
          </div>

          <!-- INFORMAÇÕES DA CARGA -->
          <div class="section-title">INFORMAÇÕES DA CARGA</div>
          <div class="row">
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">PRODUTO PREDOMINANTE</span>
              <span class="val">DIVERSOS</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">OUTRAS CARACTERÍSTICAS</span>
              <span class="val"></span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">VALOR TOTAL DA MERCADORIA</span>
              <span class="val font-bold text-right" style="display:block;">${formatCurrency(document.valorTotal)}</span>
            </div>
            <div class="box" style="width: 25%; flex: none;">
              <span class="lbl">PESO BRUTO TOTAL (KG)</span>
              <span class="val text-right" style="display:block;">${document.pesoTotal || '0,000'}</span>
            </div>
          </div>
          
          <div class="row" style="margin-top:5px;">
             <div class="box" style="width:50%;">
                <div style="font-size:7px; font-weight:bold; border-bottom:1px solid #000; margin:-2px -4px 2px -4px; padding:2px; text-align:center; background:#eee;">COMPONENTES DO VALOR DA PRESTAÇÃO</div>
                <div class="row" style="border:none; margin:0;">
                   <div style="width:50%; font-size:8px;">FRETE PESO<br/>FRETE VALOR<br/>PEDÁGIO / OUTROS</div>
                   <div style="width:50%; font-size:8px; text-align:right;">${formatCurrency(document.valorFrete || 0)}<br/>R$ 0,00<br/>R$ 0,00</div>
                </div>
             </div>
             <div class="box" style="width:50%; background:#f9f9f9;">
                <span class="lbl text-center" style="font-size:8px;">VALOR TOTAL DA PRESTAÇÃO DO SERVIÇO</span>
                <span class="val text-center" style="display:block; font-size:14px; margin-top:5px;">${formatCurrency(document.valorFrete || 0)}</span>
             </div>
          </div>

          <!-- TRIBUTOS ICMS -->
          <div class="section-title">INFORMAÇÕES RELATIVAS AOS IMPOSTOS</div>
          <div class="row">
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">SITUAÇÃO TRIBUTÁRIA</span>
              <span class="val">00-Tributação Normal</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">BASE DE CÁLCULO</span>
              <span class="val">${formatCurrency(document.valorIcms ? (document.valorFrete || 0) : 0)}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">ALÍQUOTA ICMS</span>
              <span class="val">${document.valorIcms ? '12,00%' : '0,00%'}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">VALOR DO ICMS</span>
              <span class="val">${formatCurrency(document.valorIcms || 0)}</span>
            </div>
            <div class="box text-center" style="width: 20%; flex: none;">
              <span class="lbl">% RED. BASE CÁLC.</span>
              <span class="val">0,00%</span>
            </div>
          </div>
          
          <!-- DOCS ORIGINARIOS -->
          <div class="section-title">DOCUMENTOS ORIGINÁRIOS</div>
          <div class="row">
            <div class="box" style="height: 60px;">
              <span class="lbl">CHAVES DE ACESSO DAS NF-e VINCULADAS</span>
              <span class="val font-sm" style="font-weight: normal;">
                (Exibição de NF-e vinculadas ao transporte)
              </span>
            </div>
          </div>
          
          <!-- OBSERVAÇÕES -->
          <div class="section-title text-center" style="margin-top: 10px;">OBSERVAÇÕES / USO ADUANEIRO</div>
          <div class="row">
            <div class="box" style="height: 80px;">
              <span class="lbl">OBSERVAÇÕES DO CONTRIBUINTE</span>
              <span class="val font-sm" style="font-weight: normal;">
                O ICMS ESTÁ INCLUIDO NO VALOR DO FRETE.<br/>
                PROCON ESTADUAL.<br/>
                DACTE Impresso pelo TMS Embarcador Log Axis.
              </span>
            </div>
          </div>
          
        </div>
      </body>
    </html>
  `;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getHtmlContent());
      printWindow.document.close();
      printWindow.onload = function() { printWindow.print(); printWindow.close(); }
    }
  };

  const handleDownload = () => {
    const html = getHtmlContent();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `DACTE_${document.chaveAcesso}.html`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">DACTE - Documento Auxiliar do Conhecimento de Transporte Eletrônico</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Printer size={16} />
              <span>{t('electronicDocs.preview.print')}</span>
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download size={16} />
              <span>{t('electronicDocs.preview.downloadHtml')}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div id="dacte-content" className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center p-12 text-center">
            <FileText size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">{t('electronicDocs.preview.printTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md" dangerouslySetInnerHTML={{ __html: t('electronicDocs.preview.dacteSuccess') }}>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};