import { jsPDF } from 'jspdf';
import { ElectronicDocument } from '../data/electronicDocumentsData';
import { formatCurrency, formatAccessKey } from '../utils/formatters';

// Função para gerar PDF de DANFE ou DACTE
export const generatePDF = (document: ElectronicDocument, type: 'danfe' | 'dacte'): string => {
  // Cria uma nova instância do jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configurações comuns
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Função para adicionar texto com quebra de linha
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    const textLines = pdf.splitTextToSize(text, maxWidth);
    
    if (align === 'center') {
      textLines.forEach((line: string, index: number) => {
        pdf.text(line, x, y + (index * (fontSize * 0.352)), { align: 'center' });
      });
    } else if (align === 'right') {
      textLines.forEach((line: string, index: number) => {
        pdf.text(line, x, y + (index * (fontSize * 0.352)), { align: 'right' });
      });
    } else {
      textLines.forEach((line: string, index: number) => {
        pdf.text(line, x, y + (index * (fontSize * 0.352)));
      });
    }
    
    return y + (textLines.length * (fontSize * 0.352));
  };

  // Adiciona borda ao redor da página
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

  // Título do documento
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  
  if (type === 'danfe') {
    // Gerar DANFE
    pdf.text('DANFE - DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA', pageWidth / 2, margin + 10, { align: 'center' });
    
    // Informações do emitente
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMITENTE', margin + 5, margin + 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let yPos = margin + 25;
    yPos = addWrappedText(document.emitente.razaoSocial, margin + 5, yPos, contentWidth - 10, 10);
    yPos = addWrappedText(`CNPJ: ${document.emitente.cnpj}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Endereço: ${document.emitente.endereco}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`${document.emitente.cidade} - ${document.emitente.uf} - CEP: ${document.emitente.cep}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    
    // Linha divisória
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    // Informações do documento
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DA NOTA FISCAL', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText(`Número: ${document.numeroDocumento}`, margin + 5, yPos, contentWidth - 10, 10);
    yPos = addWrappedText(`Série: ${document.serie}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Data de Emissão: ${new Date(document.dataAutorizacao).toLocaleDateString('pt-BR')}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Valor Total: ${formatCurrency(document.valorTotal)}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    
    // Chave de acesso
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CHAVE DE ACESSO', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText(formatAccessKey(document.chaveAcesso), margin + 5, yPos, contentWidth - 10, 10);
    
    // Destinatário
    if (document.destinatario) {
      yPos += 10;
      pdf.line(margin, yPos, margin + contentWidth, yPos);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESTINATÁRIO', margin + 5, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPos += 15;
      yPos = addWrappedText(document.destinatario.razaoSocial, margin + 5, yPos, contentWidth - 10, 10);
      yPos = addWrappedText(`CNPJ/CPF: ${document.destinatario.cnpjCpf}`, margin + 5, yPos + 5, contentWidth - 10, 10);
      yPos = addWrappedText(`Endereço: ${document.destinatario.endereco}`, margin + 5, yPos + 5, contentWidth - 10, 10);
      yPos = addWrappedText(`${document.destinatario.cidade} - ${document.destinatario.uf} - CEP: ${document.destinatario.cep}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    }
    
    // Informações adicionais
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMAÇÕES ADICIONAIS', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText('Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.', margin + 5, yPos, contentWidth - 10, 10);
    
    // Rodapé
    pdf.setFontSize(8);
    pdf.text('DANFE gerado pelo sistema TMS Embarcador Log Axis - www.logaxis.com.br', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
  } else {
    // Gerar DACTE
    pdf.text('DACTE - DOCUMENTO AUXILIAR DO CONHECIMENTO DE TRANSPORTE ELETRÔNICO', pageWidth / 2, margin + 10, { align: 'center' });
    
    // Informações do emitente
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMITENTE', margin + 5, margin + 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let yPos = margin + 25;
    yPos = addWrappedText(document.emitente.razaoSocial, margin + 5, yPos, contentWidth - 10, 10);
    yPos = addWrappedText(`CNPJ: ${document.emitente.cnpj}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Endereço: ${document.emitente.endereco}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`${document.emitente.cidade} - ${document.emitente.uf} - CEP: ${document.emitente.cep}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    
    // Linha divisória
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    // Informações do documento
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO CONHECIMENTO DE TRANSPORTE', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText(`Número: ${document.numeroDocumento}`, margin + 5, yPos, contentWidth - 10, 10);
    yPos = addWrappedText(`Série: ${document.serie}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Data de Emissão: ${new Date(document.dataAutorizacao).toLocaleDateString('pt-BR')}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    yPos = addWrappedText(`Valor do Frete: ${formatCurrency(document.valorTotal)}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    
    if (document.pesoTotal) {
      yPos = addWrappedText(`Peso Total: ${document.pesoTotal} kg`, margin + 5, yPos + 5, contentWidth - 10, 10);
    }
    
    if (document.modalTransporte) {
      yPos = addWrappedText(`Modal de Transporte: ${document.modalTransporte}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    }
    
    // Chave de acesso
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CHAVE DE ACESSO', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText(formatAccessKey(document.chaveAcesso), margin + 5, yPos, contentWidth - 10, 10);
    
    // Destinatário
    if (document.destinatario) {
      yPos += 10;
      pdf.line(margin, yPos, margin + contentWidth, yPos);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESTINATÁRIO', margin + 5, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPos += 15;
      yPos = addWrappedText(document.destinatario.razaoSocial, margin + 5, yPos, contentWidth - 10, 10);
      yPos = addWrappedText(`CNPJ/CPF: ${document.destinatario.cnpjCpf}`, margin + 5, yPos + 5, contentWidth - 10, 10);
      yPos = addWrappedText(`Endereço: ${document.destinatario.endereco}`, margin + 5, yPos + 5, contentWidth - 10, 10);
      yPos = addWrappedText(`${document.destinatario.cidade} - ${document.destinatario.uf} - CEP: ${document.destinatario.cep}`, margin + 5, yPos + 5, contentWidth - 10, 10);
    }
    
    // Informações adicionais
    yPos += 10;
    pdf.line(margin, yPos, margin + contentWidth, yPos);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMAÇÕES ADICIONAIS', margin + 5, yPos + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 15;
    yPos = addWrappedText('Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.', margin + 5, yPos, contentWidth - 10, 10);
    
    // Rodapé
    pdf.setFontSize(8);
    pdf.text('DACTE gerado pelo sistema TMS Embarcador Log Axis - www.logaxis.com.br', pageWidth / 2, pageHeight - 15, { align: 'center' });
  }

  // Gera o PDF como URL de dados
  const pdfOutput = pdf.output('datauristring');
  return pdfOutput;
};