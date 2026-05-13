import { Order } from './ordersService';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { supabase } from '../lib/supabase';

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

// Service principal
export const orderPdfService = {
  generateOrderPDF: async (orders: Order[], action: 'print' | 'download' = 'download', context?: { user?: any; establishment?: any; filters?: any }): Promise<string> => {
    // Cria instância do jsPDF em Portrait (Exigência do SKILL para pedidos)
    const { jsPDF } = await import('jspdf');
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

    const drawHeader = (order: any) => {
      let currentX = margin;
      
      // Draw Logo Se existir (Obrigatório segundo SKILL)
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
      pdf.text("PEDIDO", pageWidth - margin, margin + 10, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nº: ${order.order_number || order.numero || 'S/N'}`, pageWidth - margin, margin + 15, { align: 'right' });
      pdf.text(`Emitido em: ${formatDate(order.issue_date || order.dataEmissao)}`, pageWidth - margin, margin + 19, { align: 'right' });
      
      // Line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

      return margin + 28;
    };

    // Helper p/ Caixa
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

    let totalPages = 1;

    orders.forEach((order: any, index) => {
      // Quebra de página obrigatória por pedido no SKILL
      if (index > 0) {
        pdf.addPage();
        totalPages++;
      }

      let yPos = drawHeader(order);

      // -- INFORMAÇÕES INICIAIS --
      let contentY = drawSectionBox('INFORMAÇÕES INICIAIS', yPos, 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Emissão: ${formatDate(order.issue_date || order.dataEmissao)}`, margin + 5, contentY + 6);
      pdf.text(`Prev. Entrega: ${formatDate(order.expected_delivery || order.dataPrevisaoEntrega)}`, margin + 45, contentY + 6);
      pdf.text(`Valor Merc.: ${formatCurrency(Number(order.order_value || order.valorPedido || 0))}`, margin + 95, contentY + 6);
      pdf.text(`Rastreio: ${order.tracking_code || order.chaveAcesso || 'Não informado'}`, margin + 140, contentY + 6);

      yPos += 25;

      // -- DESTINO E CLIENTE --
      contentY = drawSectionBox('DESTINO (CLIENTE / RECEBEDOR)', yPos, 40);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.customer_name || order.cliente || 'Não informado'}`, margin + 5, contentY + 6);
      
      pdf.setFont('helvetica', 'normal');
      let subY = contentY + 12;
      
      if (order.recipient_phone) {
        pdf.text(`Telefone: ${formatPhone(order.recipient_phone)}`, margin + 5, subY);
        subY += 6;
      }
      
      let fullAddress = `${order.destination_street || ''}`;
      if (order.destination_number) fullAddress += `, ${order.destination_number}`;
      if (order.destination_complement) fullAddress += ` - ${order.destination_complement}`;
      
      if (fullAddress.trim() === ',' || !fullAddress.trim()) fullAddress = 'Não informado';

      pdf.text(`Endereço: ${fullAddress}`, margin + 5, subY);
      subY += 6;
      pdf.text(`Bairro: ${order.destination_neighborhood || ''}`, margin + 5, subY);
      subY += 6;
      const cid = order.destination_city || order.cidadeDestino || '';
      const uf = order.destination_state || order.ufDestino || '';
      pdf.text(`Cidade/UF: ${cid} - ${uf}  |  CEP: ${formatCnpjCpf(order.destination_zip_code || '')}`, margin + 5, subY);
      
      yPos += 45;

      // -- TRANSPORTADORA APLICADA --
      const transpName = order.carrier_name || order.transportador;
      if (transpName) {
        contentY = drawSectionBox('TRANSPORTADORA APLICADA', yPos, 20);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Empresa: ${transpName}`, margin + 5, contentY + 6);
        pdf.text(`Frete Pactuado: ${formatCurrency(Number(order.freight_value || order.valorFrete || 0))}`, margin + 135, contentY + 6);
        
        yPos += 25;
      }

      // -- ITENS DO PEDIDO (PRODUTOS) E TOTALIZADORES --
      // A tabela precisa ser minimalista com "zebra stripes"
      const maxTableHeight = pageHeight - yPos - 60; // Leave space for totals and footer
      let tableHeight = 20; // Base height just for headers
      const rowHeight = 6;
      
      let items = order.items || [];
      if (items.length > 0) {
          tableHeight = 8 + (items.length * rowHeight) + 10;
      }
      
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setDrawColor(200, 200, 200);
      
      // Header Table
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITENS (CUBAGEM E PESAGEM)', margin + 2, yPos + 5);
      
      pdf.setFontSize(8);
      let tY = yPos + 12;
      
      const colCod = margin + 2;
      const colDesc = margin + 25;
      const colQtd = margin + 100;
      const colPes = margin + 115;
      const colCub = margin + 135;
      const colUni = margin + 155;
      const colTot = margin + 175;

      pdf.text('Cód.', colCod, tY);
      pdf.text('Descrição Produto', colDesc, tY);
      pdf.text('Qtd.', colQtd, tY);
      pdf.text('Peso (KG)', colPes, tY); // "KG" as per skill
      pdf.text('M³', colCub, tY);
      pdf.text('V. Unit.', colUni, tY);
      pdf.text('V. Total', colTot, tY);
      
      tY += 2;
      pdf.line(margin, tY, margin + contentWidth, tY);
      tY += 4;
      
      pdf.setFont('helvetica', 'normal');
      
      if (items.length > 0) {
        items.forEach((item: any, idx: number) => {
          // Zebra Stripes
          if (idx % 2 === 0) {
             pdf.setFillColor(248, 249, 250);
             pdf.rect(margin, tY - 3, contentWidth, 6, 'F');
          }

          pdf.text(item.product_code || '-', colCod, tY);
          
          let desc = item.product_description || '-';
          if (desc.length > 45) desc = desc.substring(0, 42) + '...';
          pdf.text(desc, colDesc, tY);
          
          pdf.text(String(item.quantity) || '1', colQtd, tY);
          pdf.text(String(item.weight || '0'), colPes, tY);
          pdf.text(String(item.cubic_meters || '0'), colCub, tY);
          pdf.text(formatCurrency(Number(item.unit_price || 0)), colUni, tY);
          pdf.text(formatCurrency(Number(item.total_price || 0)), colTot, tY);
          
          tY += rowHeight;
        });
      } else {
        pdf.text('Nenhum item discriminado no pedido.', margin + 5, tY);
        tY += rowHeight;
      }
      
      // Totalizadores do Pedido!
      pdf.line(margin, tY - 2, margin + contentWidth, tY - 2);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, tY - 2, contentWidth, 10, 'F');
      
      tY += 2;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Totalizações da Carga:', margin + 5, tY);
      
      pdf.setFont('helvetica', 'normal');
      
      // Linha 1 de Totais
      const totPes = items.reduce((acc: number, item: any) => acc + (Number(item.weight) || 0), 0) || order.weight || 0;
      pdf.text(`Peso (KG): ${Number(totPes).toFixed(2)}`, margin + 50, tY);
      
      const totVal = items.reduce((acc: number, item: any) => acc + (Number(item.total_price) || 0), 0) || order.order_value || order.valorPedido || 0;
      pdf.text(`Valor Total: ${formatCurrency(Number(totVal))}`, margin + 120, tY);
      
      tY += 4.5;
      
      // Linha 2 de Totais
      const totQtd = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0) || order.volume_qty || 1;
      pdf.text(`Volumes: ${totQtd}`, margin + 50, tY);
      
      const totCub = items.reduce((acc: number, item: any) => acc + (Number(item.cubic_meters) || 0), 0) || order.cubic_meters || 0;
      pdf.text(`Cubagem (m³): ${Number(totCub).toFixed(4)}`, margin + 120, tY);
      
      pdf.rect(margin, yPos, contentWidth, (tY - yPos) + 3.5); // box externa da table
      
      yPos = tY + 10;

      // -- OBSERVAÇÕES --
      if (order.observations) {
        if (yPos > pageHeight - 50) {
            pdf.addPage();
            totalPages++;
            yPos = drawHeader(order);
        }
        contentY = drawSectionBox('OBSERVAÇÕES DO PEDIDO', yPos, 30, false);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        addWrappedText(order.observations, margin + 5, contentY + 6, contentWidth - 10, 8);
        yPos += 35;
      }
    });

    for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 12;
        
        // Wipe small area for safety
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
      let fileName = 'Pedidos.pdf';
      if (orders.length === 1) {
          const num = orders[0].order_number || orders[0].numero || 'Sem_Numero';
          fileName = `Pedido - ${num}.pdf`;
      }
      pdf.save(fileName);
      return '';
    }
  }
};
