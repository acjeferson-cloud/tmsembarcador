import { jsPDF } from 'jspdf';
import { Order } from './ordersService';
import { formatCurrency, formatPhone } from '../utils/formatters';

// Função para formatar CNPJ/CPF com a máscara correta
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

// Formatar data em string
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
};

// Service principal
export const orderPdfService = {
  
  /**
   * Gera PDF iterando sobre uma lista de pedidos.
   * Suporta layout com quebra de página se emitir múltiplos pedidos por vez.
   * Retorna os bytes do PDF para download interno ou print iframe.
   */
  generateOrderPDF: (orders: Order[], action: 'print' | 'download' = 'download'): string => {
    // Cria instância do jsPDF. a4 vertical padrão
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Função utilitária para contornos customizados (caixas preenchidas, etc)
    const drawSectionBox = (title: string, startY: number, height: number, filled = true) => {
      if (filled) {
        pdf.setFillColor(243, 244, 246); // gray-100
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

    orders.forEach((order, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      // -- HEADERS --
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`PEDIDO DE TRANSPORTE - ${order.order_number || 'S/N'}`, pageWidth / 2, margin + 10, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Emitido em: ${formatDate(order.issue_date)}`, pageWidth - margin, margin + 5, { align: 'right' });
      if (order.tracking_code) {
        pdf.text(`Cód. Rastreio: ${order.tracking_code}`, pageWidth - margin, margin + 10, { align: 'right' });
      }

      let yPos = margin + 20;

      // -- DADOS DO PEDIDO --
      let contentY = drawSectionBox('INFORMAÇÕES INICIAIS', yPos, 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Status: ${String(order.status || 'N/A').toUpperCase()}`, margin + 5, contentY + 6);
      pdf.text(`Previsão de Entrega: ${formatDate(order.expected_delivery)}`, margin + 65, contentY + 6);
      pdf.text(`Valor Merc.: ${formatCurrency(order.order_value)}`, margin + 135, contentY + 6);

      yPos += 25;

      // -- CLIENTE DE DESTINO --
      contentY = drawSectionBox('DESTINO (CLIENTE / RECEBEDOR)', yPos, 40);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.customer_name || 'Não informado'}`, margin + 5, contentY + 6);
      
      pdf.setFont('helvetica', 'normal');
      yPos = contentY + 12;
      
      if (order.recipient_phone) {
        pdf.text(`Telefone: ${formatPhone(order.recipient_phone)}`, margin + 5, yPos);
        yPos += 6;
      }
      
      let fullAddress = `${order.destination_street || ''}`;
      if (order.destination_number) fullAddress += `, ${order.destination_number}`;
      if (order.destination_complement) fullAddress += ` - ${order.destination_complement}`;
      
      pdf.text(`Endereço: ${fullAddress}`, margin + 5, yPos);
      yPos += 6;
      pdf.text(`Bairro: ${order.destination_neighborhood || ''}`, margin + 5, yPos);
      yPos += 6;
      pdf.text(`Cidade/UF: ${order.destination_city || ''} - ${order.destination_state || ''}  |  CEP: ${formatCnpjCpf(order.destination_zip_code || '')}`, margin + 5, yPos);
      
      yPos += 15;

      // -- TRANSPORTADORA DEFINIDA (SE HOUVER) --
      if (order.carrier_name) {
        contentY = drawSectionBox('TRANSPORTADORA APLICADA', yPos, 20);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Empresa: ${order.carrier_name}`, margin + 5, contentY + 6);
        pdf.text(`Frete Pactuado: ${formatCurrency(order.freight_value || 0)}`, margin + 135, contentY + 6);
        
        yPos += 25;
      }

      // -- ITENS DO PEDIDO (PRODUTOS) --
      contentY = drawSectionBox('ITENS (CUBAGEM E PESAGEM)', yPos, 60); // Base height, extends if too many
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cód.', margin + 2, contentY + 6);
      pdf.text('Descrição Produto', margin + 25, contentY + 6);
      pdf.text('Qtd.', margin + 95, contentY + 6);
      pdf.text('Peso (kg)', margin + 115, contentY + 6);
      pdf.text('M³', margin + 135, contentY + 6);
      pdf.text('V. Unit.', margin + 155, contentY + 6);
      pdf.text('V. Total', margin + 175, contentY + 6);
      
      pdf.line(margin, contentY + 8, margin + contentWidth, contentY + 8);
      
      pdf.setFont('helvetica', 'normal');
      let itemY = contentY + 13;
      
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          pdf.text(item.product_code || '-', margin + 2, itemY);
          
          // Truncate long descriptions
          let desc = item.product_description || '-';
          if (desc.length > 38) desc = desc.substring(0, 35) + '...';
          pdf.text(desc, margin + 25, itemY);
          
          pdf.text(String(item.quantity) || '1', margin + 95, itemY);
          pdf.text(String(item.weight || '0'), margin + 115, itemY);
          pdf.text(String(item.cubic_meters || '0'), margin + 135, itemY);
          pdf.text(formatCurrency(item.unit_price || 0), margin + 155, itemY);
          pdf.text(formatCurrency(item.total_price || 0), margin + 175, itemY);
          
          itemY += 6;
        });
      } else {
        pdf.text('Nenhum item discriminado no pedido.', margin + 5, itemY);
        itemY += 6;
      }
      
      // Totals divider
      pdf.line(margin, itemY + 2, margin + contentWidth, itemY + 2);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Totalizações da Carga:', margin + 5, itemY + 8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Peso (kg): ${order.weight || 0}`, margin + 50, itemY + 8);
      pdf.text(`Volumes: ${order.volume_qty || 1}`, margin + 90, itemY + 8);
      pdf.text(`Cubagem (m³): ${order.cubic_meters || 0}`, margin + 130, itemY + 8);
      
      yPos = itemY + 20;

      // -- OBSERVAÇÕES --
      if (order.observations) {
        contentY = drawSectionBox('OBSERVAÇÕES DO PEDIDO', yPos, 30, false);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        addWrappedText(order.observations, margin + 5, contentY + 6, contentWidth - 10, 8);
        yPos += 35;
      }
      
      // -- FOOTER --
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Documento não fiscal. Impresso pelo sistema TMS Embarcador Log Axis.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    });

    if (action === 'print') {
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    } else {
      pdf.save(orders.length > 1 ? 'pedidos-transportador.pdf' : `pedido_${orders[0].order_number || 'export'}.pdf`);
      return '';
    }
  }
};
