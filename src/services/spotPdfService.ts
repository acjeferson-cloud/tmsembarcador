import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { SpotNegotiation } from './spotNegotiationService';

export const spotPdfService = {
  generateSpotPDF: async (spots: SpotNegotiation[], action: 'print' | 'download' = 'download', context?: { user?: any; establishment?: any }): Promise<string> => {
    // Retrato (Portrait) orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const est = context?.establishment || {};
    const user = context?.user || {};
    
    const razaoSocial = est.razaoSocial || est.fantasia || 'EMPRESA N\u00C3O INFORMADA';
    const fantasia = est.fantasia || razaoSocial;
    
    const formatCNPJ = (cnpj?: string) => {
      if (!cnpj) return '';
      const c = cnpj.replace(/\D/g, '');
      if (c.length !== 14) return cnpj;
      return `${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}`;
    };

    const cnpj = formatCNPJ(est.cnpj) || 'CNPJ N\u00C3O INFORMADO';
    const endereco = est.endereco ? `${est.endereco}, ${est.bairro || ''} - ${est.cidade || ''}/${est.estado || ''}` : 'ENDERE\u00C7O N\u00C3O INFORMADO';

    let logoBase64 = est.metadata?.logo_light_base64 || est.logo_light_base64 || est.logo_light_url || est.metadata?.logo_dark_base64 || est.logo_url;

    const estId = String(est.id || est.establishment_id);
    if (!logoBase64 && estId && estId !== 'undefined' && estId !== 'null') {
       try {
           const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(estId);
           let query = (supabase as any).from('establishments').select('metadata');
           
           const orgId = est.organizationId || est.organization_id;
           const envId = est.environmentId || est.environment_id;
           
           if (orgId) query = query.eq('organization_id', orgId);
           if (envId) query = query.eq('environment_id', envId);
           
           if (isUuid) {
               query = query.eq('id', estId);
           } else if (est.cnpj) {
               const cleanCnpj = est.cnpj.replace(/\D/g, '');
               query = query.eq('cnpj', cleanCnpj);
           } else {
               throw new Error("Neither valid UUID nor CNPJ provided");
           }

           const { data: dbEst, error } = await query.maybeSingle();
              
           if (!error && dbEst) {
               logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || dbEst.logo_url;
           }
       } catch (_e) { }
    }

    if (logoBase64 && logoBase64.startsWith('http')) {
       try {
           let path = logoBase64;
           if (logoBase64.includes('/public/logos/')) {
               path = logoBase64.split('/public/logos/')[1];
           } else if (logoBase64.includes('/public/')) {
               path = logoBase64.split('/public/')[1];
               if (path.startsWith('logos/')) path = path.replace('logos/', '');
           }
           
           const { data: blob } = await (supabase as any).storage.from('logos').download(path);
           
           if (blob) {
               logoBase64 = await new Promise((resolve) => {
                   const reader = new FileReader();
                   reader.onloadend = () => {
                       let result = reader.result as string;
                       if (result.startsWith('data:application/octet-stream;')) {
                           result = result.replace('data:application/octet-stream;', 'data:image/png;');
                       }
                       resolve(result);
                   };
                   reader.readAsDataURL(blob);
               });
           } else {
               logoBase64 = undefined;
           }
       } catch (err) {
           logoBase64 = undefined;
       }
    }

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);


    const formatDate = (isoString?: string) => {
      if (!isoString) return '-';
      if (isoString.length >= 10 && isoString.includes('-')) {
        const [y, m, d] = isoString.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
      return new Date(isoString).toLocaleDateString('pt-BR');
    };

    // Fetch all related invoices
    let spotInvoicesMap: Record<string, any[]> = {};
    try {
      const spotIds = spots.map(s => s.id).filter(Boolean);
      if (spotIds.length > 0) {
        const { data: pivots } = await supabase.from('freight_spot_invoices').select('negotiation_id, invoice_id').in('negotiation_id', spotIds);
        if (pivots && pivots.length > 0) {
            const invoiceIds = pivots.map((p: any) => p.invoice_id);
            const { data: invoices } = await supabase.from('invoices_nfe')
              .select('id, serie, numero, data_emissao, valor_total, peso_total, cubagem_total, destinatario_nome, customer:invoices_nfe_customers(cidade, estado)')
              .in('id', invoiceIds);
            
            if (invoices) {
              pivots.forEach((p: any) => {
                  if (!spotInvoicesMap[p.negotiation_id]) spotInvoicesMap[p.negotiation_id] = [];
                  const inv = invoices.find((i: any) => i.id === p.invoice_id);
                  if (inv) spotInvoicesMap[p.negotiation_id].push(inv);
              });
            }
        }
      }
    } catch(e) { console.error('Erro ao buscar NFs do Spot', e); }

    // Add multiple spots with page breaks
    for (let c = 0; c < spots.length; c++) {
      const spot = spots[c];
      
      if (c > 0) {
        pdf.addPage();
      }

      // --- HEADER BEGIN ---
      const drawHeader = (startY: number) => {
        let currentX = margin;

        if (logoBase64) {
          try {
            pdf.addImage(logoBase64, margin, startY, 40, 15);
            currentX = margin + 45;
          } catch (e) { }
        }

        // Matriz info (MIDDLE)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(fantasia, currentX, startY + 2);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(razaoSocial, currentX, startY + 6);
        pdf.text(`CNPJ: ${cnpj}`, currentX, startY + 10);
        pdf.text(endereco, currentX, startY + 14);

        // Top Right: Title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text("COTAÇÃO SPOT", pageWidth - margin, startY + 5, { align: 'right' });
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`N°: ${spot.code || '-'}`, pageWidth - margin, startY + 10, { align: 'right' });
        pdf.text(`Emitido em: ${formatDate(spot.created_at)}`, pageWidth - margin, startY + 14, { align: 'right' });
        
        // Line separator
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, startY + 18, pageWidth - margin, startY + 18);

        return startY + 24;
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

      // --- INFORMAÇÕES INICIAIS ---
      let contentY = drawSectionBox('INFORMAÇÕES INICIAIS', yPos, 16);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
        
      const getStatusLabel = (s: string) => {
          if (s === 'pendente_faturamento') return 'Pendente de CT-e';
          if (s === 'aguardando_fatura') return 'Aguardando Fatura';
          if (s === 'liquidado') return 'Liquidado';
          if (s === 'cancelado') return 'Cancelado';
          return s;
      };

      pdf.text(`Emissão: ${formatDate(spot.created_at)}`, margin + 5, contentY + 6);
      pdf.text(`Validade: ${formatDate(spot.valid_to)}`, margin + 65, contentY + 6);
      pdf.text(`Status: ${getStatusLabel(spot.status)}`, margin + 125, contentY + 6);

      yPos += 20;

      // --- TRANSPORTADORA APLICADA ---
      contentY = drawSectionBox('TRANSPORTADORA APLICADA', yPos, 16);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      pdf.text(`Empresa: ${spot.carrier_name || '-'}`, margin + 5, contentY + 6);
      pdf.text(`Valor Prometido: ${formatCurrency(Number(spot.agreed_value || 0))}`, margin + 125, contentY + 6);

      yPos += 20;
      
      // --- OBSERVAÇÕES E EVIDÊNCIAS ---
      let splitObs: string[] = [];
      if (spot.observations) {
          splitObs = pdf.splitTextToSize(spot.observations, contentWidth - 4);
      }

      let evidenceMsg = '';
      if (spot.attachment_url) {
          evidenceMsg = "* Evidência Comercial anexada a esta cotação (disponível para consulta diretamente no sistema).";
      }

      let internalHeight = spot.observations ? (splitObs.length * 5) : 6;
      if (evidenceMsg) {
          internalHeight += 6;
      }
      
      let boxHeight = 7 + 4 + internalHeight + 2; // header + top padding + text + bot padding

      contentY = drawSectionBox('OBSERVAÇÕES ADICIONAIS', yPos, boxHeight);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      let textLineY = contentY + 5;
      
      if (spot.observations) {
          pdf.text(splitObs, margin + 2, textLineY);
          textLineY += splitObs.length * 5;
      } else {
          pdf.setTextColor(150, 150, 150);
          pdf.text("Nenhuma observação extra reportada.", margin + 5, textLineY);
          pdf.setTextColor(0, 0, 0);
          textLineY += 6;
      }

      if (evidenceMsg) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text(evidenceMsg, margin + 2, textLineY + 2);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
      }

      yPos += boxHeight + 4;
      
      // --- ITENS (NOTAS FISCAIS) ---
      const myInvoices = spot.id ? spotInvoicesMap[spot.id] || [] : [];
      const invoiceRowHeight = 5;
      let invoicesBoxHeight = 15 + (myInvoices.length * invoiceRowHeight) + 10;
      
      contentY = drawSectionBox('ITENS (NOTAS FISCAIS)', yPos, invoicesBoxHeight);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      let tableY = contentY + 6;
      pdf.text('Série', margin + 2, tableY);
      pdf.text('Nº NFe', margin + 12, tableY);
      pdf.text('Emissão', margin + 35, tableY);
      pdf.text('Destino', margin + 60, tableY);
      pdf.text('Peso (KG)', margin + 115, tableY);
      pdf.text('M³', margin + 135, tableY);
      pdf.text('Valor Merc.', margin + 165, tableY);
      
      pdf.setFont('helvetica', 'normal');
      tableY += 2;
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, tableY, pageWidth - margin, tableY);
      tableY += 5;
      
      let totPeso = 0;
      let totM3 = 0;
      let totValor = 0;
      
      if (myInvoices.length === 0) {
         pdf.setTextColor(150, 150, 150);
         pdf.text("Nenhuma nota fiscal foi associada a este spot.", margin + 2, tableY);
         pdf.setTextColor(0, 0, 0);
      }
      
      myInvoices.forEach((inv) => {
         const ser = String(inv.serie || '-');
         const num = String(inv.numero || '-');
         const dt = formatDate(inv.data_emissao);
         const m3 = Number(inv.cubagem_total || 0);
         const peso = Number(inv.peso_total || 0);
         
         let cidade = inv.customer?.cidade || '';
         let uf = inv.customer?.estado || '';
         let dest = `${cidade}/${uf}`;
         
         if (dest === '/') dest = inv.destinatario_nome || '- / -';
         
         const val = Number(inv.valor_total || 0);
         
         totM3 += m3;
         totPeso += peso;
         totValor += val;

         
         pdf.text(ser, margin + 2, tableY);
         pdf.text(num, margin + 12, tableY);
         pdf.text(dt, margin + 35, tableY);
         pdf.text(pdf.splitTextToSize(dest, 50)[0], margin + 60, tableY);
         pdf.text(peso.toLocaleString('pt-BR', {minimumFractionDigits: 2}), margin + 115, tableY);
         pdf.text(m3.toLocaleString('pt-BR', {minimumFractionDigits: 4}), margin + 135, tableY);
         pdf.text(formatCurrency(val), margin + 165, tableY);
         
         tableY += invoiceRowHeight;
      });
      
      // Footer Totals
      tableY += 1;
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin + 1, tableY, contentWidth - 2, 7, 'F');
      tableY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Totais da Carga (${myInvoices.length} Volumes):`, margin + 2, tableY);
      pdf.text(totPeso.toLocaleString('pt-BR', {minimumFractionDigits: 2}), margin + 115, tableY);
      pdf.text(totM3.toLocaleString('pt-BR', {minimumFractionDigits: 4}), margin + 135, tableY);
      pdf.text(formatCurrency(totValor), margin + 165, tableY);
      
      yPos += invoicesBoxHeight + 4;

    }

    // Footers
    const totalPages = pdf.getNumberOfPages();
    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 15;
        
        // Clear footer area
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
      let fileName = 'Cotações Manuais (Spot).pdf';
      if (spots.length === 1 && spots[0].code) {
          fileName = `Cotação Manual (SPOT) - ${spots[0].code}.pdf`;
      }
      pdf.save(fileName);
      return '';
    }
  }
};
