import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/formatters';

const formatCnpjCpf = (value: string | undefined): string => {
  if (!value) return '';
  const numericValue = value.replace(/\D/g, '');
  if (numericValue.length === 11) {
    return numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numericValue.length === 14) {
    return numericValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
};

export const pickupPdfService = {
  generatePickupPDF: (pickups: any[], action: 'print' | 'download' | 'base64' = 'download'): string => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    const drawSectionBox = (title: string, startY: number, height: number, filled = true) => {
      if (filled) {
        pdf.setFillColor(243, 244, 246);
        pdf.rect(margin, startY, contentWidth, 7, 'F');
      }
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, startY, contentWidth, height);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin + 2, startY + 5);
      
      return startY + 7;
    };

    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
      pdf.setFontSize(fontSize);
      const textLines = pdf.splitTextToSize(text, maxWidth);
      
      if (align === 'center') {
        textLines.forEach((line: string, index: number) => {
          pdf.text(line, x, y + (index * (fontSize * 0.352)), { align: 'center' });
        });
      } else {
        textLines.forEach((line: string, index: number) => {
          pdf.text(line, x, y + (index * (fontSize * 0.352)));
        });
      }
      
      return y + (textLines.length * (fontSize * 0.352));
    };

    pickups.forEach((pickup, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`RELATÓRIO DE COLETA - ${pickup.numeroColeta || pickup.pickup_number || 'S/N'}`, pageWidth / 2, margin + 10, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Emissão da Coleta: ${formatDate(pickup.dataCriacao || pickup.created_at)}`, pageWidth - margin, margin + 5, { align: 'right' });

      let yPos = margin + 20;

      let contentY = drawSectionBox('INFORMAÇÕES GERAIS', yPos, 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Status: ${String(pickup.status || 'N/A').toUpperCase()}`, margin + 5, contentY + 6);
      
      // Truncate carrier name if it's too long
      let carrierName = pickup.transportador || pickup.carrier_name || '-';
      if (carrierName.length > 55) {
        carrierName = carrierName.substring(0, 52) + '...';
      }
      pdf.text(`Transportador: ${carrierName}`, margin + 65, contentY + 6);

      yPos += 25;

      contentY = drawSectionBox('DADOS DE ENDEREÇO DA COLETA', yPos, 30);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Contato: ${pickup.contact_name || pickup.customer_name || 'Não informado'}`, margin + 5, contentY + 6);
      
      pdf.setFont('helvetica', 'normal');
      yPos = contentY + 12;
      
      let fullAddress = `${pickup.pickup_address || pickup.logradouro || ''}`;
      
      pdf.text(`Endereço: ${fullAddress}`, margin + 5, yPos);
      yPos += 6;
      pdf.text(`Cidade/UF: ${pickup.pickup_city || pickup.cidade || ''} - ${pickup.pickup_state || pickup.estado || ''}  |  CEP: ${formatCnpjCpf(pickup.pickup_zip || pickup.cep || '')}`, margin + 5, yPos);
      
      yPos += 15;

      contentY = drawSectionBox('COMPOSIÇÃO DE CARGA (NOTAS FISCAIS)', yPos, 40);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Quantidade de Documentos (NF-es): ${pickup.quantidadeNotas || pickup.packages_quantity || 0}`, margin + 5, contentY + 6);
      pdf.text(`Peso Total Declarado: ${Number(pickup.valorTotal?.[0]?.peso || pickup.total_weight || 0).toFixed(2)} kg`, margin + 5, contentY + 14);
      pdf.text(`Metragem Cúbica Total: ${Number(pickup.total_volume || 0).toFixed(4)} m³`, margin + 5, contentY + 22);
      pdf.text(`Valor Total Declarado: ${formatCurrency(pickup.valorTotal?.[0]?.valor_total || pickup.total_volume || 0)}`, margin + 5, contentY + 30);
      
      yPos += 45;

      if (pickup.observacoes || pickup.observations) {
        contentY = drawSectionBox('OBSERVAÇÕES DA COLETA', yPos, 30, false);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        addWrappedText(pickup.observacoes || pickup.observations, margin + 5, contentY + 6, contentWidth - 10, 8);
        yPos += 35;
      }
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Documento não fiscal. Impresso pelo sistema TMS Embarcador Log Axis.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    });

    if (action === 'base64') {
      return pdf.output('datauristring');
    } else if (action === 'print') {
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    } else {
      pdf.save(pickups.length > 1 ? 'coletas-exportacao.pdf' : `coleta_${pickups[0].numeroColeta || pickups[0].pickup_number || 'export'}.pdf`);
      return '';
    }
  }
};
