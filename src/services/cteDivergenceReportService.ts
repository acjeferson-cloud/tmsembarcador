import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export interface DivergenceReportData {
  cteId: string;
  cteNumber: string;
  serie: string;
  chave: string;
  carrierId: string;
  carrierName: string;
  carrierCnpj: string;
  carrierEmail?: string;
  carrierPhone?: string;
  emissionDate: string;
  totalValue: number;
  status: string;
  comparisonData: {
    taxName: string;
    tmsValue: number;
    cteValue: number;
    difference: number;
    percentDifference: number;
    status: 'correct' | 'divergent';
    calculation?: {
      formula: string;
      baseValue: number;
      rate: number;
      result: number;
    };
  }[];
}

export const cteDivergenceReportService = {
  async generatePDF(data: DivergenceReportData, context?: { establishmentId?: string; establishmentName?: string; establishmentCnpj?: string; user?: any; logoBase64?: string }): Promise<Blob> {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      let estId = context?.establishmentId;
      let razaoSocial = context?.establishmentName || 'EMPRESA NÃO INFORMADA';
      let fantasia = razaoSocial;
      let cnpj = '';
      let endereco = '';
      let logoBase64: string | undefined = context?.logoBase64;
      
      console.log("[PDF_LOGO] Iniciando PDF. Contexto Logo fornecido:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "undefined");
      
      if (estId && !logoBase64) {
         console.log("[PDF_LOGO] Logo ausente. Disparando DB Query com estId:", estId);
         try {
             const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(estId);
             let query = (supabase as any).from('establishments').select('*');
             if (context?.establishmentCnpj) {
                 const cleanCnpj = context.establishmentCnpj.replace(/\D/g, '');
                 query = query.eq('cnpj', cleanCnpj);
             } else if (isUuid) {
                 query = query.eq('id', estId);
             } else {
                 query = query.eq('codigo', parseInt(estId) || 0);
             }
      
             const { data: dbEst, error: dbErr } = await query.maybeSingle();
             console.log("[PDF_LOGO] DB Query -> Resultado:", !!dbEst, "Erro:", dbErr);
             
             if (dbEst) {
                 fantasia = dbEst.fantasia || dbEst.nome_fantasia || fantasia;
                 razaoSocial = dbEst.razao_social || razaoSocial;
                 cnpj = dbEst.cnpj || '';
                 endereco = dbEst.endereco ? `${dbEst.endereco}, ${dbEst.bairro || ''} - ${dbEst.cidade || ''}/${dbEst.estado || ''}` : '';
                 
                 logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.metadata?.logo_light_url || dbEst.logo_light_base64 || dbEst.logo_url || dbEst.metadata?.logo_url;
                 console.log("[PDF_LOGO] Logo resgatado DB:", logoBase64 ? logoBase64.substring(0, 50) + "..." : "NULO NO BANCO");
             }
         } catch(e) { console.log("[PDF_LOGO] Erro no fallback DB:", e); }
      }
      
      if (logoBase64 && logoBase64.startsWith('http')) {
         console.log("[PDF_LOGO] URL externa HTTP. Iniciando parse Supabase.");
         try {
             let path = logoBase64;
             if (path.includes('/public/logos/')) path = path.split('/public/logos/')[1];
             else if (path.includes('/public/')) path = path.split('/public/')[1].replace('logos/', '');
             
             console.log("[PDF_LOGO] Storage Path Mapeado:", path);
             // CRITICAL FIX: Decoded the URI Component so names like 'Matriz Logo' don't crash
             const { data: blob, error: dnErr } = await (supabase as any).storage.from('logos').download(decodeURIComponent(path));
             
             if (blob) {
                 console.log("[PDF_LOGO] Blob baixado com sucesso, tamanho:", blob.size);
                 logoBase64 = await new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onloadend = () => {
                         let res = reader.result as string;
                         if (res.startsWith('data:application/octet-stream;')) res = res.replace('data:application/octet-stream;', 'data:image/png;');
                         resolve(res);
                     };
                     reader.readAsDataURL(blob);
                 });
                 console.log("[PDF_LOGO] Blob transformado em Base64 Data URL (sucesso)");
             } else {
                 console.log("[PDF_LOGO] Erro download blob:", dnErr);
                 logoBase64 = undefined;
             }
         } catch(e) { 
             console.log("[PDF_LOGO] Erro captura URL via Storage:", e);
             logoBase64 = undefined; 
         }
      }

      const drawHeader = () => {
        let currentX = margin;

        if (logoBase64) {
          try {
            console.log("[PDF_LOGO] Disparando doc.addImage");
            if (!logoBase64.startsWith('http') && !logoBase64.startsWith('data:')) {
              logoBase64 = `data:image/png;base64,${logoBase64}`;
            }
            // Removed strict PDF format constraint
            doc.addImage(logoBase64, margin, margin, 40, 15);
            currentX = margin + 45;
            console.log("[PDF_LOGO] M\u00E9todo doc.addImage finalizado sem crashes");
          } catch(e) {
            console.error("[PDF_LOGO] ERRO FATAL AO INJETAR NO JSPDF: ", e);
          }
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(fantasia, currentX, margin + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(razaoSocial, currentX, margin + 10);
        if(cnpj) {
            const rawCnpj = cnpj.replace(/\D/g, '');
            const fmtCnpj = rawCnpj.length===14 ? rawCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : cnpj;
            doc.text(`CNPJ: ${fmtCnpj}`, currentX, margin + 14);
        }
        if(endereco) doc.text(endereco, currentX, margin + 18);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("RELATÓRIO DE DIVERGÊNCIA - CT-E", pageWidth - margin, margin + 10, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`CT-e: ${data.cteNumber} | Chave: ${data.chave}`, pageWidth - margin, margin + 15, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, margin + 22, pageWidth - margin, margin + 22);
        
        return margin + 28;
      };
      
      const drawFooter = (pageNumber: number) => {
        const footerY = pageHeight - 12;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado por: ${context?.user?.name || context?.user?.nome || 'Sistema'}`, margin, footerY);
        doc.text(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, margin, footerY + 4);
        
        doc.setFont('helvetica', 'italic');
        doc.text('Documento gerado pelo sistema TMS Embarcador - LogAxis- Um único sistema. Todos os seus embarques!', pageWidth / 2, footerY + 2, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      };

      let yPos = drawHeader();
      let totalPages = 1;
      let currentPage = 1;
      drawFooter(currentPage);
      
      const checkPageBreak = (neededSpace: number) => {
          if (yPos + neededSpace > pageHeight - 20) {
              doc.addPage();
              currentPage++;
              totalPages++;
              yPos = drawHeader();
              drawFooter(currentPage);
          }
      };

      // Header info section
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMAÇÕES INICIAIS', margin + 2, yPos + 5.5);
      yPos += 8;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Emissão CT-e: ${new Date(data.emissionDate).toLocaleDateString('pt-BR')}`, margin + 2, yPos + 5);
      doc.text(`Status TMS: ${data.status}`, margin + 60, yPos + 5);
      doc.text(`Valor Original CT-e: R$ ${data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 140, yPos + 5);
      yPos += 12;

      // Transportadora
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANÁLISE DE DIVERGÊNCIAS DETALHADA', margin + 2, yPos + 5.5);
      yPos += 8;
      
      // Table Header
      const colXs = [margin, margin + 60, margin + 110, margin + 160, margin + 210, margin + 250];
      const headers = ["Descrição da Taxa", "Valor Calculado (TMS)", "Valor Cobrado (CT-e)", "Diferença Absoluta", "Diferença %", "Situação"];
      
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, yPos, contentWidth, 6, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => {
        doc.text(h, colXs[i] + 2, yPos + 4);
      });
      yPos += 6;
      
      let totalDiff = 0;
      let hasDivergences = false;
      let totalTMS = 0;
      let totalCTE = 0;
      
      data.comparisonData.forEach((tax, idx) => {
         checkPageBreak(8);
         
         if (idx % 2 === 0) {
             doc.setFillColor(248, 249, 250);
             doc.rect(margin, yPos, contentWidth, 6, 'F');
         }
         
         doc.setFontSize(8);
         doc.setFont('helvetica', 'normal');
         
         const isDivergent = tax.status === 'divergent';
         if (isDivergent) hasDivergences = true;
         
         if (isDivergent) doc.setTextColor(220, 53, 69); // Red text
         
         const formatVal = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
         
         doc.text(tax.taxName, colXs[0] + 2, yPos + 4);
         doc.text(formatVal(tax.tmsValue), colXs[1] + 2, yPos + 4);
         doc.text(formatVal(tax.cteValue), colXs[2] + 2, yPos + 4);
         
         if (isDivergent) {
            doc.text(`${tax.difference > 0 ? '+' : ''}${formatVal(tax.difference)}`, colXs[3] + 2, yPos + 4);
            doc.text(`${tax.percentDifference > 0 ? '+' : ''}${tax.percentDifference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`, colXs[4] + 2, yPos + 4);
            doc.text("DIVERGENTE", colXs[5] + 2, yPos + 4);
            totalDiff += tax.difference;
         } else {
            doc.text("-", colXs[3] + 2, yPos + 4);
            doc.text("-", colXs[4] + 2, yPos + 4);
            doc.setTextColor(40, 167, 69);
            doc.text("CORRETO", colXs[5] + 2, yPos + 4);
         }
         
         doc.setTextColor(0, 0, 0); // Reset
         
         totalTMS += tax.tmsValue;
         totalCTE += tax.cteValue;
         
         yPos += 6;
      });
      
      // Totals
      checkPageBreak(12);
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text("TOTAIS GERAIS:", margin + 2, yPos + 5.5);
      
      const formatTotal = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      doc.text(formatTotal(totalTMS), colXs[1] + 2, yPos + 5.5);
      doc.text(formatTotal(totalCTE), colXs[2] + 2, yPos + 5.5);
      
      if (Math.abs(totalDiff) > 0.01) {
          doc.setTextColor(220, 53, 69);
          doc.text(`${totalDiff > 0 ? '+' : ''}${formatTotal(totalDiff)}`, colXs[3] + 2, yPos + 5.5);
          doc.setTextColor(0, 0, 0);
      }
      
      // Signatures
      yPos += 25;
      checkPageBreak(25);
      
      doc.setDrawColor(0, 0, 0);
      const sigWidth = 80;
      const centerSig1 = (pageWidth / 3);
      const centerSig2 = (pageWidth / 3) * 2;
      
      doc.line(centerSig1 - (sigWidth / 2), yPos, centerSig1 + (sigWidth / 2), yPos);
      doc.text("Assinatura do Transportador", centerSig1, yPos + 5, { align: 'center' });

      doc.line(centerSig2 - (sigWidth / 2), yPos, centerSig2 + (sigWidth / 2), yPos);
      doc.text("Gestor de Logística / Auditoria", centerSig2, yPos + 5, { align: 'center' });
      
      for (let i = 1; i <= doc.getNumberOfPages(); i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setFillColor(255, 255, 255);
          const footerY = pageHeight - 12;
          doc.rect(pageWidth - margin - 30, footerY - 3, 30, 5, 'F');
          doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      }

      return doc.output('blob');
    } catch (error: any) {
      throw new Error(`Falha ao gerar PDF: ${error?.message || 'Erro desconhecido'}`);
    }
  },


  async saveReport(data: DivergenceReportData, userId: string, establishmentId: string): Promise<string> {
    const { data: report, error } = await supabase
      .from('cte_divergence_reports')
      .insert({
        cte_id: data.cteId,
        user_id: userId,
        establishment_id: establishmentId,
        carrier_id: data.carrierId,
        cte_number: data.cteNumber,
        carrier_name: data.carrierName,
        report_data: data
      })
      .select()
      .single();

    if (error) throw error;
    return report.id;
  },

  async markAsSentByEmail(reportId: string, emailTo: string): Promise<void> {
    const { error } = await supabase
      .from('cte_divergence_reports')
      .update({
        sent_by_email: true,
        email_sent_to: emailTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  async markAsSentByWhatsApp(reportId: string, phoneTo: string): Promise<void> {
    const { error } = await supabase
      .from('cte_divergence_reports')
      .update({
        sent_by_whatsapp: true,
        whatsapp_sent_to: phoneTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  async getReportHistory(cteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('cte_divergence_reports')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('cte_id', cteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
