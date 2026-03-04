import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { ElectronicDocument } from '../../data/electronicDocumentsData';
import { formatCNPJ, formatCurrency, formatAccessKey } from '../../utils/formatters';

interface DanfePreviewProps {
  document: ElectronicDocument;
  onClose: () => void;
}

export const DanfePreview: React.FC<DanfePreviewProps> = ({ document, onClose }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = document.getElementById('danfe-content');
      if (printContent) {
        printWindow.document.write(`
          <html>
            <head>
              <title>DANFE - ${document.chaveAcesso}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .danfe-container { max-width: 800px; margin: 0 auto; border: 1px solid #000; }
                .danfe-header { display: flex; border-bottom: 1px solid #000; }
                .danfe-title { font-size: 14px; font-weight: bold; text-align: center; padding: 5px; }
                .danfe-section { border-bottom: 1px solid #000; padding: 5px; }
                .danfe-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
                .danfe-field { margin-bottom: 5px; }
                .danfe-label { font-size: 8px; font-weight: bold; }
                .danfe-value { font-size: 10px; }
                .danfe-barcode { text-align: center; padding: 10px; }
                .danfe-footer { text-align: center; font-size: 10px; padding: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 3px; font-size: 9px; }
                th { background-color: #f0f0f0; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDownload = () => {
    const printContent = document.getElementById('danfe-content');
    if (printContent) {
      const html = `
        <html>
          <head>
            <title>DANFE - ${document.chaveAcesso}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .danfe-container { max-width: 800px; margin: 0 auto; border: 1px solid #000; }
              .danfe-header { display: flex; border-bottom: 1px solid #000; }
              .danfe-title { font-size: 14px; font-weight: bold; text-align: center; padding: 5px; }
              .danfe-section { border-bottom: 1px solid #000; padding: 5px; }
              .danfe-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
              .danfe-field { margin-bottom: 5px; }
              .danfe-label { font-size: 8px; font-weight: bold; }
              .danfe-value { font-size: 10px; }
              .danfe-barcode { text-align: center; padding: 10px; }
              .danfe-footer { text-align: center; font-size: 10px; padding: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 3px; font-size: 9px; }
              th { background-color: #f0f0f0; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE_${document.chaveAcesso}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Extrair informações da chave de acesso
  const extractAccessKeyInfo = (key: string) => {
    if (!key || key.length !== 44) return { uf: '', anoMes: '', cnpj: '', modelo: '', serie: '', numero: '', tipo: '', codigo: '' };
    
    return {
      uf: key.substring(0, 2),
      anoMes: key.substring(2, 6),
      cnpj: key.substring(6, 20),
      modelo: key.substring(20, 22),
      serie: key.substring(22, 25),
      numero: key.substring(25, 34),
      tipo: key.substring(34, 35),
      codigo: key.substring(35, 43),
      digito: key.substring(43, 44)
    };
  };

  const keyInfo = extractAccessKeyInfo(document.chaveAcesso);
  const emissionDate = new Date(document.dataAutorizacao);
  const formattedEmissionDate = emissionDate.toLocaleDateString('pt-BR');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <FileText size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">DANFE - Documento Auxiliar da Nota Fiscal Eletrônica</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download size={16} />
              <span>Download</span>
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
          {/* DANFE Content */}
          <div id="danfe-content" className="border border-gray-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-gray-800">
              <div className="border-r border-gray-800 p-2">
                <div className="text-xs font-bold mb-1">IDENTIFICAÇÃO DO EMITENTE</div>
                <div className="text-lg font-bold">{document.emitente.razaoSocial}</div>
                <div className="text-xs">{document.emitente.endereco}</div>
                <div className="text-xs">{document.emitente.cidade} - {document.emitente.uf} - CEP: {document.emitente.cep}</div>
                <div className="text-xs">CNPJ: {document.emitente.cnpj}</div>
                {document.emitente.inscricaoEstadual && (
                  <div className="text-xs">IE: {document.emitente.inscricaoEstadual}</div>
                )}
              </div>
              
              <div className="col-span-2 p-2 flex flex-col items-center justify-center">
                <div className="text-xl font-bold text-center">DANFE</div>
                <div className="text-sm text-center">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
                <div className="grid grid-cols-2 w-full mt-2 gap-2">
                  <div className="border border-gray-800 p-1 text-center">
                    <div className="text-xs font-bold">ENTRADA</div>
                    <div className="w-4 h-4 border border-gray-800 mx-auto"></div>
                  </div>
                  <div className="border border-gray-800 p-1 text-center">
                    <div className="text-xs font-bold">SAÍDA</div>
                    <div className="w-4 h-4 border border-gray-800 mx-auto bg-gray-800"></div>
                  </div>
                </div>
                <div className="text-sm font-bold mt-2">Nº {document.numeroDocumento}</div>
                <div className="text-sm font-bold">SÉRIE {document.serie}</div>
                <div className="text-sm">FOLHA 1/1</div>
              </div>
            </div>
            
            {/* Barcode Section */}
            <div className="border-b border-gray-800 p-2">
              <div className="text-xs font-bold mb-1">CHAVE DE ACESSO</div>
              <div className="text-sm font-mono text-center">{formatAccessKey(document.chaveAcesso)}</div>
              <div className="h-12 bg-gray-200 flex items-center justify-center mt-1">
                <div className="text-xs text-center">Código de Barras</div>
              </div>
              <div className="text-xs text-center mt-1">Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da SEFAZ Autorizadora</div>
            </div>
            
            {/* Nature of Operation */}
            <div className="border-b border-gray-800 p-2">
              <div className="text-xs font-bold mb-1">NATUREZA DA OPERAÇÃO</div>
              <div className="text-sm">VENDA DE MERCADORIA</div>
            </div>
            
            {/* Protocol Information */}
            <div className="border-b border-gray-800 p-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-bold mb-1">PROTOCOLO DE AUTORIZAÇÃO DE USO</div>
                  <div className="text-sm">{document.protocoloAutorizacao}</div>
                </div>
                <div>
                  <div className="text-xs font-bold mb-1">DATA DE AUTORIZAÇÃO</div>
                  <div className="text-sm">{new Date(document.dataAutorizacao).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
            
            {/* Recipient Information */}
            {document.destinatario && (
              <div className="border-b border-gray-800 p-2">
                <div className="text-xs font-bold mb-1">DESTINATÁRIO / REMETENTE</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <div className="text-xs font-bold">NOME / RAZÃO SOCIAL</div>
                    <div className="text-sm">{document.destinatario.razaoSocial}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold">CNPJ / CPF</div>
                    <div className="text-sm">{document.destinatario.cnpjCpf}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="col-span-2">
                    <div className="text-xs font-bold">ENDEREÇO</div>
                    <div className="text-sm">{document.destinatario.endereco}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold">CEP</div>
                    <div className="text-sm">{document.destinatario.cep}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <div className="text-xs font-bold">MUNICÍPIO</div>
                    <div className="text-sm">{document.destinatario.cidade}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold">UF</div>
                    <div className="text-sm">{document.destinatario.uf}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold">DATA DE EMISSÃO</div>
                    <div className="text-sm">{formattedEmissionDate}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tax Information */}
            <div className="border-b border-gray-800 p-2">
              <div className="text-xs font-bold mb-1">CÁLCULO DO IMPOSTO</div>
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <div className="text-xs font-bold">BASE DE CÁLC. ICMS</div>
                  <div className="text-sm">{formatCurrency(document.valorIcms ? document.valorTotal : 0)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold">VALOR DO ICMS</div>
                  <div className="text-sm">{formatCurrency(document.valorIcms || 0)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold">VALOR DO FRETE</div>
                  <div className="text-sm">{formatCurrency(document.valorFrete || 0)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold">VALOR DO SEGURO</div>
                  <div className="text-sm">R$ 0,00</div>
                </div>
                <div>
                  <div className="text-xs font-bold">DESCONTO</div>
                  <div className="text-sm">R$ 0,00</div>
                </div>
                <div>
                  <div className="text-xs font-bold">VALOR TOTAL</div>
                  <div className="text-sm font-bold">{formatCurrency(document.valorTotal)}</div>
                </div>
              </div>
            </div>
            
            {/* Products Table */}
            <div className="border-b border-gray-800 p-2">
              <div className="text-xs font-bold mb-1">DADOS DOS PRODUTOS / SERVIÇOS</div>
              <table className="w-full border border-gray-800">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="text-xs p-1 border border-gray-800">CÓDIGO</th>
                    <th className="text-xs p-1 border border-gray-800">DESCRIÇÃO</th>
                    <th className="text-xs p-1 border border-gray-800">NCM</th>
                    <th className="text-xs p-1 border border-gray-800">CFOP</th>
                    <th className="text-xs p-1 border border-gray-800">UN</th>
                    <th className="text-xs p-1 border border-gray-800">QUANT</th>
                    <th className="text-xs p-1 border border-gray-800">VALOR UNIT</th>
                    <th className="text-xs p-1 border border-gray-800">VALOR TOTAL</th>
                    <th className="text-xs p-1 border border-gray-800">ICMS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dados simulados de produtos */}
                  <tr>
                    <td className="text-xs p-1 border border-gray-800">001</td>
                    <td className="text-xs p-1 border border-gray-800">MERCADORIA CONFORME NOTA FISCAL</td>
                    <td className="text-xs p-1 border border-gray-800">0000.00.00</td>
                    <td className="text-xs p-1 border border-gray-800">5102</td>
                    <td className="text-xs p-1 border border-gray-800">UN</td>
                    <td className="text-xs p-1 border border-gray-800">1,000</td>
                    <td className="text-xs p-1 border border-gray-800">{formatCurrency(document.valorTotal)}</td>
                    <td className="text-xs p-1 border border-gray-800">{formatCurrency(document.valorTotal)}</td>
                    <td className="text-xs p-1 border border-gray-800">{document.valorIcms ? (document.valorIcms / document.valorTotal * 100).toFixed(2) + '%' : '0,00%'}</td>
                  </tr>
                  {/* Linhas em branco para preencher o espaço */}
                  {[...Array(5)].map((_, index) => (
                    <tr key={index}>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                      <td className="text-xs p-1 border border-gray-800">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Additional Information */}
            <div className="border-b border-gray-800 p-2">
              <div className="text-xs font-bold mb-1">INFORMAÇÕES ADICIONAIS</div>
              <div className="text-xs">
                Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.
                Informações complementares da nota fiscal: Documento emitido conforme legislação vigente.
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-2 text-center">
              <div className="text-xs">DANFE gerado pelo sistema TMS Embarcador Log Axis - www.logaxis.com.br</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};