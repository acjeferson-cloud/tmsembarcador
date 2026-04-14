import { jsPDF } from 'jspdf';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { FreightQuoteHistory, QuoteResult } from './freightQuoteService';

export const quotePdfService = {
  getEstablishmentLogo: async (establishmentId?: number): Promise<string> => {
    try {
      if (!establishmentId) return '';

      const { data: establishment } = await supabase
        .from('establishments')
        .select('logo_url')
        .eq('id', establishmentId)
        .single();
        
      if (establishment?.logo_url) {
        return establishment.logo_url;
      }
      
      const sessionData = localStorage.getItem('tenant_context');
      if (sessionData) {
        const context = JSON.parse(sessionData);
        if (context.metadata?.logo_url) {
          return context.metadata.logo_url;
        }
      }
      return '';
    } catch (e) {
      return '';
    }
  },

  generateQuotePDF: async (quotes: any[], action: 'print' | 'download' = 'download', context?: { user?: any; establishment?: any; filters?: any }): Promise<string> => {
    // Retrato (Portrait) orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    const establishment = context?.establishment;
    const user = context?.user || {};

    let logoDataUrl = '';
    if (establishment?.id) {
       logoDataUrl = await quotePdfService.getEstablishmentLogo(establishment.id);
    }
    
    // Add multiple quotes with page breaks
    for (let c = 0; c < quotes.length; c++) {
      const quote = quotes[c];
      
      if (c > 0) {
        pdf.addPage();
      }

      // --- HEADER BEGIN ---
      const drawHeader = (startY: number) => {
        if (logoDataUrl) {
          try {
            pdf.addImage(logoDataUrl, 'PNG', margin, margin, 40, 15, '', 'FAST');
          } catch (e) {
             // Fallback
             pdf.setFontSize(16);
             pdf.setFont('helvetica', 'bold');
             pdf.text(establishment?.nome_fantasia || 'TMS Embarcador', margin, margin + 10);
          }
        } else {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(establishment?.nome_fantasia || 'TMS Embarcador', margin, margin + 10);
        }

        // Top Right: Title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text("COTAÇÃO DE FRETE (SPOT)", pageWidth - margin, margin + 10, { align: 'right' });
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Cotação N°: ${quote.quote_number || quote.id || '-'}`, pageWidth - margin, margin + 15, { align: 'right' });
        
        const dateObj = quote.created_at ? new Date(quote.created_at) : new Date();
        pdf.text(`Data: ${dateObj.toLocaleDateString('pt-BR')}`, pageWidth - margin, margin + 19, { align: 'right' });
        
        // Line separator
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

        return margin + 28;
      };

      // Header Box Helper
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

      let yPos = drawHeader(margin);

      // -- INFORMAÇÕES DA COTAÇÃO --
      let contentY = drawSectionBox('INFORMAÇÕES GERAIS', yPos, 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const modalStr = quote.selected_modals && quote.selected_modals.length > 0 
        ? quote.selected_modals.join(', ').toUpperCase()
        : 'TODOS MODO(S)';
        
      const userDisplay = quote.user_display_name || quote.users?.nome || '-';
        
      pdf.text(`Solicitante: ${userDisplay}`, margin + 5, contentY + 6);
      pdf.text(`Modais: ${modalStr}`, margin + 85, contentY + 6);
      
      let cargoValueStr = formatCurrency(Number(quote.cargo_value || 0));
      pdf.text(`Valor Mercadoria: ${cargoValueStr}`, margin + 145, contentY + 6);

      yPos += 25;

      // -- ENDEREÇOS (ORIGEM / DESTINO) --
      contentY = drawSectionBox('ORIGEM E DESTINO', yPos, 20);
      pdf.setFontSize(9);
      
      const originDisplay = quote.origin_city && quote.origin_city.nome
         ? `${quote.origin_city.nome}/${quote.origin_city.states?.sigla || ''}`
         : quote.origin_zip_code || 'Não informado';
         
      const destDisplay = quote.destination_city && quote.destination_city.nome
         ? `${quote.destination_city.nome}/${quote.destination_city.states?.sigla || ''}`
         : quote.destination_zip_code || 'Não informado';

      pdf.setFont('helvetica', 'bold');
      pdf.text("Origem:", margin + 5, contentY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(originDisplay, margin + 25, contentY + 6);

      pdf.setFont('helvetica', 'bold');
      pdf.text("Destino:", margin + 95, contentY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(destDisplay, margin + 115, contentY + 6);

      yPos += 25;
      
      // -- DETALHES DE PESO E VOLUME --
      contentY = drawSectionBox('PESO E CUBAGEM', yPos, 15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Peso Real: ${Number(quote.weight || 0).toFixed(2)} KG`, margin + 5, contentY + 5);
      pdf.text(`Volumes: ${quote.volume_qty || 1}`, margin + 65, contentY + 5);
      pdf.text(`Cubagem: ${Number(quote.cubic_meters || 0).toFixed(4)} m³`, margin + 125, contentY + 5);

      yPos += 20;

      // -- OPORTUNIDADES LOCADAS (QUOTE RESULTS) --
      const results: QuoteResult[] = quote.quote_results || [];
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`RESULTADOS OBTIDOS (${results.length})`, margin, yPos);
      yPos += 3;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setDrawColor(200, 200, 200);
      
      // Header Table
      let tY = yPos + 5;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transportadora', margin + 2, tY);
      pdf.text('Modal', margin + 65, tY);
      pdf.text('Prazo', margin + 95, tY);
      pdf.text('% Dif', margin + 125, tY);
      pdf.text('Valor Total', margin + 155, tY);
      pdf.text('Situação', margin + 175, tY);

      yPos += 7;
      pdf.setFont('helvetica', 'normal');

      // Sort results by totalValue ascending
      results.sort((a, b) => Number(a.totalValue) - Number(b.totalValue));

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        
        // Check Page break
        if (yPos > pageHeight - 30) {
           pdf.addPage();
           yPos = margin;
           yPos = drawHeader(yPos);
        }

        const isEven = i % 2 === 0;
        if (!isEven) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos, contentWidth, 7, 'F');
        }

        tY = yPos + 5;
        pdf.setFontSize(8);
        
        // Transp
        let carrName = item.carrierName || 'Desconhecida';
        if (carrName.length > 30) carrName = carrName.substring(0, 30) + '...';
        pdf.text(carrName, margin + 2, tY);
        
        // Modal
        pdf.text((item.modal || '-').toUpperCase(), margin + 65, tY);
        
        // Prazo
        pdf.text(`${item.deliveryTimeDays || 0} dias`, margin + 95, tY);
        
        // % Diff
        let diffStr = '0.00%';
        if (item.percentageAboveLowest !== undefined) {
           diffStr = `${Number(item.percentageAboveLowest).toFixed(2)}%`;
        }
        pdf.text(diffStr, margin + 125, tY);
        
        // Valor Total
        pdf.text(formatCurrency(item.totalValue), margin + 155, tY);
        
        // IS Nominated
        if (item.isNominated) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 128, 0);
            pdf.text('ELEITA', margin + 175, tY);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
        } else {
            pdf.text('-', margin + 175, tY);
        }

        yPos += 7;
      }
      
      pdf.rect(margin, yPos - (results.length * 7), contentWidth, (results.length * 7)); // table external border
    }

    // Footers
    const totalPages = pdf.getNumberOfPages();
    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 12;
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, footerY - 5, pageWidth, 20, 'F');
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        pdf.text(`Gerado por: ${user.name || user.nome || 'Sistema'}`, margin, footerY);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
        
        pdf.text(`Data/Hora: ${formatDateTime(new Date().toISOString())}`, margin, footerY + 4);
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Documento gerado pelo sistema TMS Embarcador - LogAxis- Um único sistema. Todos os seus embarques!', pageWidth / 2, footerY + 8, { align: 'center' });
    }

    if (action === 'print') {
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    } else {
      pdf.save(`cotacoes_spot_${new Date().getTime()}.pdf`);
      return '';
    }
  }
};
