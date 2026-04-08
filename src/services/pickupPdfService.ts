import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/formatters';
import { pickupsService } from './pickupsService';
import { supabase } from '../lib/supabase';

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
    const rawDate = new Date(dateString);
    if(isNaN(rawDate.getTime())) return dateString;
    return rawDate.toLocaleDateString('pt-BR');
  } catch (_e) {
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

export const pickupPdfService = {
  generatePickupPDF: async (pickups: any[], action: 'print' | 'download' | 'base64' = 'download', context?: { user?: any; establishment?: any; filters?: any }): Promise<string> => {
    const pdf = new jsPDF({
      orientation: 'landscape',
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
    console.log("[PDF_LOGO] Passo 1: Logo inicial extraído de currentEstablishment:", logoBase64 ? "SIM (URL/Base64)" : "NÃO", est);

    const estId = String(est.id || est.establishment_id);
    if (!logoBase64 && estId && estId !== 'undefined' && estId !== 'null') {
       console.log("[PDF_LOGO] Passo 2: Logo ausente. Buscando no banco de dados para ID ou CNPJ:", estId, est.cnpj);
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
              
           if (error) console.error("[PDF_LOGO] Erro na busca DBest:", error);
           if (!error && dbEst) {
               console.log("[PDF_LOGO] Banco retornou dbEst:", dbEst);
               logoBase64 = dbEst.metadata?.logo_light_base64 || dbEst.metadata?.logo_dark_base64 || dbEst.metadata?.logo_light_url || dbEst.metadata?.logo_url || dbEst.logo_url;
               console.log("[PDF_LOGO] Logo base64 gerado pelo dbEst:", logoBase64 ? "SIM" : "NÃO");
           } else {
               console.log("[PDF_LOGO] dbEst retornado vazio ou nulo!");
           }
       } catch (_e) { 
           console.error("[PDF_LOGO] Exceção na busca dbEst:", _e);
       }
    }

    if (logoBase64 && logoBase64.startsWith('http')) {
       console.log("[PDF_LOGO] Passo 3: Logo é uma URL HTTP externa/pública! Iniciando download nativo via Supabase...", logoBase64);
       try {
           let path = logoBase64;
           if (logoBase64.includes('/public/logos/')) {
               path = logoBase64.split('/public/logos/')[1];
           } else if (logoBase64.includes('/public/')) {
               path = logoBase64.split('/public/')[1];
               if (path.startsWith('logos/')) path = path.replace('logos/', '');
           }
           console.log("[PDF_LOGO] Caminho de download extraído (bucket logos):", path);
           
           const { data: blob, error: downloadError } = await (supabase as any).storage.from('logos').download(path);
           
           if (blob) {
               console.log("[PDF_LOGO] Blob baixado com sucesso! Tamanho:", blob.size, "Tipo original:", blob.type);
               logoBase64 = await new Promise((resolve) => {
                   const reader = new FileReader();
                   reader.onloadend = () => {
                       let result = reader.result as string;
                       console.log("[PDF_LOGO] File Reader gerou string iniciando com:", result.substring(0, 40));
                       if (result.startsWith('data:application/octet-stream;')) {
                           console.log("[PDF_LOGO] Modificando MIME type de octet-stream para image/png!");
                           result = result.replace('data:application/octet-stream;', 'data:image/png;');
                       }
                       resolve(result);
                   };
                   reader.readAsDataURL(blob);
               });
               console.log("[PDF_LOGO] Final logoBase64 pronto para o jsPDF! Inicia com:", logoBase64?.substring(0, 40));
           } else {
               console.error("[PDF_LOGO] Nenhum blob baixado da Storage! Erro:", downloadError);
               logoBase64 = undefined;
           }
       } catch (err) {
           console.error("[PDF_LOGO] Falha destrutiva ao tentar baixar a logo:", err);
           logoBase64 = undefined;
       }
    } else {
       console.log("[PDF_LOGO] Passo 3 ignorado: logoBase64 não existe ou já é nativo data:image", !!logoBase64);
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    let totalPages = 1;

    const drawHeader = () => {
      let currentX = margin;
      
      // Draw Logo if exists
      if (logoBase64) {
        try {
          console.log("[PDF_LOGO] Passo 4: Tentando adicionar imagem ao jsPDF...");
          // force optional "PNG" param if we want, but letting jsPDF detect it
          pdf.addImage(logoBase64, margin, margin, 40, 15);
          currentX = margin + 45;
          console.log("[PDF_LOGO] Passo 4 concluído: Imagem adicionada sem erros no jsPDF!");
        } catch (_err) {
          console.error("[PDF_LOGO] Erro crítico no jsPDF.addImage:", _err);
        }
      } else {
        console.log("[PDF_LOGO] Passo 4: Ignorado pois logoBase64 é undefined ou nulo.");
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
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text("ROMANEIO DE COLETAS", pageWidth - margin, margin + 10, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const now = new Date();
      pdf.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, pageWidth - margin, margin + 15, { align: 'right' });
      
      // Line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 22, pageWidth - margin, margin + 22);

      return margin + 28;
    };

    const drawFooter = (pageNumber: number) => {
      const footerY = pageHeight - 12;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Gerado por: ${user.name || user.nome || 'Sistema'}`, margin, footerY);
      pdf.text(`Data/Hora: ${formatDateTime(new Date().toISOString())}`, margin, footerY + 4);
      
      pdf.setFont('helvetica', 'italic');
      pdf.text('Documento gerado pelo sistema TMS Embarcador - LogAxis- Um único sistema. Todos os seus embarques!', pageWidth / 2, footerY + 2, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Página ${pageNumber} de {totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    };

    let yPos = drawHeader();
    let currentPage = 1;
    drawFooter(currentPage);

    // Adjusted columns
    // Columns: Nfe | Emissão | Cliente Destinatário | Destino | Qtd | Peso | Cubagem | Valor
    const colXs = [margin, margin + 20, margin + 40, margin + 135, margin + 190, margin + 205, margin + 228, margin + 250];
    const headers = ["NF-e/Série", "Emissão", "Cliente", "Destino (Cidade/UF)", "Qtd", "Peso", "Cubagem", "Valor Total"];
    
    const totalsGerais = {
      volumes: 0,
      peso: 0,
      cubagem: 0,
      valor: 0
    };

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    for (const pickup of pickups) {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        currentPage++;
        totalPages++;
        yPos = drawHeader();
        drawFooter(currentPage);
      }

      const numColeta = pickup.numeroColeta || pickup.pickup_number || pickup.id || '-';
      const transportador = (pickup.transportador || pickup.carrier_name || '-').toUpperCase();
      const numNotas = pickup.quantidadeNotas || pickup.packages_quantity || 0;
      
      // Pickup Header Row
      pdf.setFillColor(210, 220, 230); // Blueish gray for Pickup distinct
      pdf.rect(margin, yPos, contentWidth, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`COLETA: ${numColeta}  -  TRANSPORTADORA: ${transportador}  -  TOTAL NFs: ${numNotas}`, margin + 2, yPos + 5.5);
      yPos += 8;

      // Draw table headers for the NFs inside this pickup
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, yPos, contentWidth, 6, 'F');
      pdf.setFontSize(8);
      headers.forEach((h, i) => {
        pdf.text(h, colXs[i] + 2, yPos + 4);
      });
      yPos += 6;

      // Fetch Invoices
      let invoices: any[] = [];
      try {
         const fetched = await pickupsService.getPickupInvoices(pickup.id);
         invoices = fetched.map(fi => fi.invoices_nfe).filter(Boolean);
      } catch (_e) {
         // ignore
      }
      
      if (invoices.length === 0) {
         pdf.setFont('helvetica', 'italic');
         pdf.text('Nenhuma nota fiscal vinculada encontrada ou não foi possível carregar os detalhes.', margin + 2, yPos + 4.5);
         pdf.setFont('helvetica', 'normal');
         yPos += 6;
      } else {
         const subTotals = { volumes: 0, peso: 0, cubagem: 0, valor: 0 };

         invoices.forEach((nfe: any, idx: number) => {
           if (yPos > pageHeight - 30) {
             pdf.addPage();
             currentPage++;
             totalPages++;
             yPos = drawHeader();
             drawFooter(currentPage);
             
             // Draw headers again on new page
             pdf.setFillColor(230, 230, 230);
             pdf.rect(margin, yPos, contentWidth, 6, 'F');
             pdf.setFontSize(8);
             pdf.setFont('helvetica', 'bold');
             headers.forEach((h, i) => {
               pdf.text(h, colXs[i] + 2, yPos + 4);
             });
             yPos += 6;
           }

           if (idx % 2 === 0) {
             pdf.setFillColor(248, 249, 250);
             pdf.rect(margin, yPos, contentWidth, 6, 'F');
           }

           pdf.setFont('helvetica', 'normal');

           // Ensure Destinatario
           let customerArray = nfe.customer || [];
           if (!Array.isArray(customerArray)) customerArray = [customerArray];
           const destinatarioInfo = customerArray[0];
           
           let clienteNome = '-';
           let destino = '-';
           if (destinatarioInfo) {
               clienteNome = (destinatarioInfo.razao_social || destinatarioInfo.nome_fantasia || '-');
               const cid = destinatarioInfo.cidade || '';
               const uf = destinatarioInfo.estado || '';
               destino = cid && uf ? `${cid}/${uf}` : (cid || uf || '-');
           }
           clienteNome = clienteNome.substring(0, 56); // limit chars
           destino = destino.substring(0, 28);

           const nfNumSerie = `${nfe.numero || ''}/${nfe.serie || ''}`;
           const dataE = formatDate(nfe.data_emissao);
           const qtd = Number(nfe.quantidade_volumes || 0);
           const peso = Number(nfe.peso_total || 0);
           const cub = Number(nfe.cubagem_total || 0);
           const val = Number(nfe.valor_total || 0);

           subTotals.volumes += qtd; subTotals.peso += peso; subTotals.cubagem += cub; subTotals.valor += val;
           totalsGerais.volumes += qtd; totalsGerais.peso += peso; totalsGerais.cubagem += cub; totalsGerais.valor += val;

           pdf.text(nfNumSerie, colXs[0] + 2, yPos + 4);
           pdf.text(dataE, colXs[1] + 2, yPos + 4);
           pdf.text(clienteNome, colXs[2] + 2, yPos + 4);
           pdf.text(destino, colXs[3] + 2, yPos + 4);
           pdf.text(String(qtd), colXs[4] + 2, yPos + 4);
           pdf.text(`${peso.toFixed(2)} KG`, colXs[5] + 2, yPos + 4);
           pdf.text(`${cub.toFixed(4)}`, colXs[6] + 2, yPos + 4);
           pdf.text(formatCurrency(val), colXs[7] + 2, yPos + 4);

           yPos += 6;
         });

         // Pickup Subtotals Row
         pdf.setFillColor(240, 240, 240);
         pdf.rect(margin, yPos, contentWidth, 6, 'F');
         pdf.setFont('helvetica', 'bold');
         pdf.text(`Subtotal Coleta ${numColeta}:`, colXs[2] + 2, yPos + 4, { align: 'right' });
         pdf.text(String(subTotals.volumes), colXs[4] + 2, yPos + 4);
         pdf.text(`${subTotals.peso.toFixed(2)} KG`, colXs[5] + 2, yPos + 4);
         pdf.text(`${subTotals.cubagem.toFixed(4)} m³`, colXs[6] + 2, yPos + 4);
         pdf.text(formatCurrency(subTotals.valor), colXs[7] + 2, yPos + 4);
         yPos += 8;
      }
      yPos += 4; // Spacing before next pickup
    }

    if (yPos > pageHeight - 35) {
      pdf.addPage();
      currentPage++;
      totalPages++;
      yPos = drawHeader();
      drawFooter(currentPage);
    }

    pdf.setFillColor(220, 220, 220);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text("TOTAIS GERAIS:", margin + 2, yPos + 5.5);
    
    pdf.text(String(totalsGerais.volumes.toFixed(0)), colXs[4] + 2, yPos + 5.5);
    pdf.text(`${totalsGerais.peso.toFixed(2)} KG`, colXs[5] + 2, yPos + 5.5);
    pdf.text(`${totalsGerais.cubagem.toFixed(4)} m³`, colXs[6] + 2, yPos + 5.5);
    pdf.text(formatCurrency(totalsGerais.valor), colXs[7] + 2, yPos + 5.5);

    // Signature Area
    yPos += 25;
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      currentPage++;
      totalPages++;
      yPos = drawHeader();
      drawFooter(currentPage);
      yPos += 25;
    }
    
    pdf.setDrawColor(0, 0, 0);
    const sigWidth = 80;
    const centerSig1 = (pageWidth / 3);
    const centerSig2 = (pageWidth / 3) * 2;
    
    pdf.line(centerSig1 - (sigWidth / 2), yPos, centerSig1 + (sigWidth / 2), yPos);
    pdf.text("Assinatura do Motorista / Transportador", centerSig1, yPos + 5, { align: 'center' });
    pdf.text("Placa do Veículo:", centerSig1 - (sigWidth / 2), yPos + 10);

    pdf.line(centerSig2 - (sigWidth / 2), yPos, centerSig2 + (sigWidth / 2), yPos);
    pdf.text("Assinatura do Responsável da Expedição", centerSig2, yPos + 5, { align: 'center' });
    
    // Assign total pages
    for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setFillColor(255, 255, 255);
        const footerY = pageHeight - 12;
        pdf.rect(pageWidth - margin - 30, footerY - 3, 30, 5, 'F');
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    }

    if (action === 'base64') {
      return pdf.output('datauristring');
    } else if (action === 'print') {
      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
    } else {
      pdf.save(pickups.length > 1 ? 'romaneio_coletas.pdf' : `romaneio_${pickups[0].numeroColeta || pickups[0].pickup_number || 'export'}.pdf`);
      return '';
    }
  }
};
