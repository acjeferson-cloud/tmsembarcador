import { jsPDF } from 'jspdf';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { billsService } from './billsService';

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
    const rawDate = new Date(dateString);
    if(isNaN(rawDate.getTime())) return dateString;
    return rawDate.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateString;
  }
};

const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return '-';
  try {
    const rawDate = new Date(dateString);
    if(isNaN(rawDate.getTime())) return dateString;
    return rawDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (_e) {
    return dateString;
  }
};

interface CTeItem {
    cte_number: string;
    cte_series: string;
    issue_date?: string;
    total_value?: number;
    weight?: number;
    status?: string;
}

// Service principal
export const billPdfService = {
  generateBillPDF: async (bills: any[], action: 'print' | 'download' = 'download', context?: { user?: any; establishment?: any; filters?: any }): Promise<string> => {
    // Cria instância do jsPDF em Portrait (Exigência do SKILL para pedidos/faturas relizados em 1 por página)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const est = context?.establishment || {};
    const user = context?.user || {};
    
    const razaoSocial = est.razaoSocial || est.fantasia || 'EMPRESA NÃO INFORMADA';
    const fantasia = est.fantasia || razaoSocial;
    const cnpj = formatCnpjCpf(est.cnpj) || 'CNPJ NÃO INFORMADO';
    const endereco = est.endereco ? `${est.endereco}, ${est.bairro || ''} - ${est.cidade || ''}/${est.estado || ''}` : 'ENDEREÇO NÃO INFORMADO';

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

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    let totalPages = 0;

    const drawHeader = (bill: any) => {
      let currentX = margin;
      
      // Draw Logo Se existir
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, margin, margin, 40, 15);
          currentX = margin + 45;
        } catch (_err) {}
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      pdf.text(fantasia, currentX, margin + 5);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(razaoSocial, currentX, margin + 10);
      pdf.text(`CNPJ: ${cnpj}`, currentX, margin + 14);
      pdf.text(endereco, currentX, margin + 18);

      // Top Right: Title
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text("FATURA", pageWidth - margin, margin + 10, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nº: ${bill.numero || 'S/N'}`, pageWidth - margin, margin + 15, { align: 'right' });
      pdf.text(`Emitida em: ${formatDate(bill.dataEmissao)}`, pageWidth - margin, margin + 19, { align: 'right' });
      
      // Line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

      return margin + 28;
    };

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

    // Iterate over bills
    for (const [index, bill] of bills.entries()) {
      if (index > 0) {
          pdf.addPage();
      }
      totalPages++;
      let yPos = drawHeader(bill);

      // -- INFORMAÇÕES INICIAIS --
      let contentY = drawSectionBox('INFORMAÇÕES INICIAIS', yPos, 16);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Emissão: ${formatDate(bill.dataEmissao)}`, margin + 5, contentY + 6);
      pdf.text(`Vencimento: ${formatDate(bill.dataVencimento)}`, margin + 50, contentY + 6);
      pdf.text(`Status: ${bill.status || '-'}`, margin + 100, contentY + 6);
      pdf.text(`Valor da Fatura: ${formatCurrency(Number(bill.valorCTes || 0))}`, margin + 150, contentY + 6);
      
      yPos += 20;

      // -- TRANSPORTADORA APLICADA --
      const transpName = bill.transportador;
      if (transpName) {
        contentY = drawSectionBox('TRANSPORTADORA ASSOCIADA', yPos, 20);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Empresa: ${transpName}`, margin + 5, contentY + 6);
        pdf.text(`Custo TMS Auditado: ${formatCurrency(Number(bill.valorCusto || 0))}`, margin + 135, contentY + 6);
        
        yPos += 25;
      }

      // Fetch Items Async (Linked CTes)
      let items: CTeItem[] = [];
      try {
        const ctesData = await billsService.getLinkedCtes(bill.id);
        items = ctesData.map((ct: any) => ({
             cte_number: ct.cte_number || ct.ctes_complete?.number,
             cte_series: ct.cte_series || ct.ctes_complete?.series,
             issue_date: ct.ctes_complete?.issue_date,
             total_value: ct.ctes_complete?.total_value,
             weight: ct.ctes_complete?.weight_kg || 0,
             status: ct.ctes_complete?.status || 'N/A'
        }));
      } catch (err) {
        console.error('Error fetching bill ctes for PDF', err);
      }

      if (items.length > 0) {
         // Sort by number as standard practice
         items = items.sort((a,b) => (Number(a.cte_number) || 0) - (Number(b.cte_number) || 0));
      }

      const rowHeight = 6;
      let tableHeight = 20; 
      if (items.length > 0) {
          tableHeight = 8 + (items.length * rowHeight) + 10;
      }
      
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setDrawColor(200, 200, 200);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTEÚDO DA FATURA (CT-es VINCULADOS)', margin + 2, yPos + 5);
      
      pdf.setFontSize(8);
      let tY = yPos + 12;
      
      const colNum = margin + 2;
      const colSer = margin + 35;
      const colEmi = margin + 65;
      const colSit = margin + 115;
      const colVal = margin + 165;

      pdf.text('Número', colNum, tY);
      pdf.text('Série', colSer, tY);
      pdf.text('Emissão', colEmi, tY);
      pdf.text('Situação', colSit, tY);
      pdf.text('V. Total', colVal, tY);
      
      tY += 2;
      pdf.line(margin, tY, margin + contentWidth, tY);
      tY += 4;
      
      pdf.setFont('helvetica', 'normal');
      
      if (items.length > 0) {
        for (const [idx, item] of items.entries()) {
          // Check page bounds
          if (tY > pageHeight - 40) {
             pdf.rect(margin, yPos, contentWidth, (tY - yPos)); // close box
             pdf.addPage();
             totalPages++;
             yPos = 20; 
             tY = yPos + 12;
             
              pdf.setFillColor(243, 244, 246);
              pdf.rect(margin, yPos, contentWidth, 7, 'F');
              pdf.setDrawColor(200, 200, 200);
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text('CONTEÚDO DA FATURA (CONTINUAÇÃO)', margin + 2, yPos + 5);
              pdf.setFontSize(8);
              
              pdf.text('Número', colNum, tY);
              pdf.text('Série', colSer, tY);
              pdf.text('Emissão', colEmi, tY);
              pdf.text('Situação', colSit, tY);
              pdf.text('V. Total', colVal, tY);
              
              tY += 2;
              pdf.line(margin, tY, margin + contentWidth, tY);
              tY += 4;
          }

          // Zebra Stripes
          if (idx % 2 === 0) {
             pdf.setFillColor(248, 249, 250);
             pdf.rect(margin, tY - 3, contentWidth, 6, 'F');
          }

          pdf.setFont('helvetica', 'normal');
          pdf.text(String(item.cte_number || '-'), colNum, tY);
          pdf.text(String(item.cte_series || '0'), colSer, tY);
          pdf.text(formatDate(item.issue_date), colEmi, tY);
          pdf.text(item.status || '-', colSit, tY);
          pdf.text(formatCurrency(Number(item.total_value || 0)), colVal, tY);
          
          tY += rowHeight;
        }
      } else {
        pdf.text('Nenhum CT-e vinculado à Fatura.', margin + 5, tY);
        tY += rowHeight;
      }
      
      // Totalizadores !!
      pdf.line(margin, tY - 2, margin + contentWidth, tY - 2);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, tY - 2, contentWidth, 10, 'F');
      
      tY += 2;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Totalizações da Fatura:', margin + 5, tY);
      
      pdf.setFont('helvetica', 'normal');
      
      const totVal = items.reduce((acc: number, item: any) => acc + (Number(item.total_value) || 0), 0) || bill.valorCTes || 0;
      pdf.text(`R$ Total CT-es: ${formatCurrency(Number(totVal))}`, margin + 50, tY);
      
      const totQtd = items.length || bill.cteCount || 0;
      pdf.text(`Ctes Auditados: ${totQtd}`, margin + 120, tY);
      
      tY += 4.5;
      
      pdf.rect(margin, yPos, contentWidth, (tY - yPos) + 3.5); // box externa da table
    }

    // Paging
    for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
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
        
        // Slogan do Skill
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Documento gerado pelo sistema TMS Embarcador - LogAxis- Um único sistema. Todos os seus embarques!', pageWidth / 2, footerY + 8, { align: 'center' });
    }

    if (action === 'print') {
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    } else {
      let fileName = 'Faturas.pdf';
      if (bills.length === 1) {
          const num = bills[0].numero || 'S-N';
          fileName = `Fatura - ${num}.pdf`;
      }
      pdf.save(fileName);
      return '';
    }
  }
};
