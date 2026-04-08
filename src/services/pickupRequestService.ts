import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import emailOutgoingConfigService from './emailOutgoingConfigService';
import { pickupsService } from './pickupsService';
import { establishmentsService } from './establishmentsService';
import { TenantContextHelper } from '../utils/tenantContext';

export interface PickupRequest {
  id?: string;
  pickup_id: string;
  organization_id?: string;
  environment_id?: string;
  establishment_id?: string;
  request_number: string;
  requested_at: string;
  requested_by?: string | null;
  requested_by_name: string;
  notification_method: 'email' | 'whatsapp' | 'both';
  email_sent: boolean;
  whatsapp_sent: boolean;
  carrier_email?: string;
  carrier_phone?: string;
  romaneio_pdf_url?: string;
  status: 'pending' | 'sent' | 'failed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface RequestPickupParams {
  pickupIds: string[];
  notificationMethod: 'email' | 'whatsapp' | 'both';
  carrierEmail?: string;
  carrierPhone?: string;
  userId?: string | number | null;
  userName: string;
  pdfBase64: string;
  establishmentId: string;
}

interface RomaneioData {
  pickupNumber: string;
  carrierName: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  contactName: string;
  contactPhone: string;
  scheduledDate: string;
  invoices: Array<{
    numero_nota: string;
    serie: string;
    chave_nfe: string;
    data_emissao: string;
    numero_pedido?: string;
    quantidade_volumes: number;
    metros_cubicos?: number;
    peso: number;
    valor_total: number;
    mercadoria?: string;
  }>;
  totals: {
    totalInvoices: number;
    totalVolumes: number;
    totalCubicMeters: number;
    totalWeight: number;
    totalValue: number;
  };
}

export const pickupRequestService = {
  async generateRomaneio(pickupIds: string[]): Promise<{ success: boolean; pdfBase64?: string; romaneioData?: RomaneioData; error?: string }> {
    try {
      if (!pickupIds || pickupIds.length === 0) {
        return { success: false, error: 'Lista de coletas inválida' };
      }

      // We'll use the first pickup as base for contact and address info, 
      // since grouped pickups belong to the same branch/carrier.
      const pickup = await pickupsService.getById(pickupIds[0]);

      if (!pickup) {
        return { success: false, error: 'Coleta não encontrada' };
      }

      // Fetch establishment data to use as pickup location for the email (as requested, the 
      // pickup originates from the logged user's establishment branch)
      let establishment: any = null;
      if (pickup.establishment_id) {
        establishment = await establishmentsService.getById(pickup.establishment_id);
      }

      let allRawInvoices: any[] = [];
      let manualTotals = { volumes: 0, cubic: 0, weight: 0 };
      let accumulatedPickupNumbers: string[] = [];

      for (const pId of pickupIds) {
        const pData = await pickupsService.getById(pId);
        if (pData) {
          accumulatedPickupNumbers.push(pData.pickup_number || '-');
          manualTotals.volumes += (pData.packages_quantity || 0);
          manualTotals.cubic += (pData.total_volume || 0);
          manualTotals.weight += (pData.total_weight || 0);
        }
        
        const rawInvoicesData = await pickupsService.getPickupInvoices(pId);
        allRawInvoices = allRawInvoices.concat(rawInvoicesData);
      }

      const invoices = allRawInvoices.map((item: any) => {
        const inv = item.invoices_nfe || item.invoices;
        if (!inv) return null;

        const cubic_meters = inv.cubagem_total || (inv.products || []).reduce((acc: number, p: any) => acc + (Number(p.cubagem) || 0), 0) || inv.metros_cubicos || 0;

        return {
          numero_nota: inv.numero || inv.numero_nota || '-',
          serie: inv.serie || '-',
          chave_nfe: inv.chave_acesso || inv.chave_nfe || '-',
          data_emissao: inv.data_emissao || new Date().toISOString(),
          numero_pedido: inv.numero_pedido || '',
          quantidade_volumes: inv.quantidade_volumes || 1,
          metros_cubicos: cubic_meters,
          peso: inv.peso_total || inv.peso || 0,
          valor_total: inv.valor_total || 0,
          mercadoria: inv.mercadoria || ''
        };
      }).filter(Boolean) as any[];

      const totals = {
        totalInvoices: invoices.length,
        totalVolumes: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.quantidade_volumes || 0), 0) : manualTotals.volumes,
        totalCubicMeters: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.metros_cubicos || 0), 0) : manualTotals.cubic,
        totalWeight: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.peso || 0), 0) : manualTotals.weight,
        totalValue: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.valor_total || 0), 0) : 0
      };

      // Since the request asks to use establishment data for address and contact:
      const address = establishment ? (establishment.logradouro || establishment.endereco || pickup.pickup_address || '-') : (pickup.pickup_address || '-');
      const city = establishment ? (establishment.cidade || pickup.pickup_city || '-') : (pickup.pickup_city || '-');
      const state = establishment ? (establishment.estado || pickup.pickup_state || '-') : (pickup.pickup_state || '-');
      const zip = establishment ? (establishment.cep || pickup.pickup_zip || '-') : (pickup.pickup_zip || '-');
      const contactName = establishment ? (establishment.razao_social || establishment.fantasia || pickup.contact_name || '-') : (pickup.contact_name || '-');
      const contactPhone = establishment ? (establishment.telefone || pickup.contact_phone || '-') : (pickup.contact_phone || '-');

      const romaneioData: RomaneioData = {
        pickupNumber: accumulatedPickupNumbers.join(', '),
        carrierName: pickup.carrier_name || '-',
        pickupAddress: address,
        pickupCity: city,
        pickupState: state,
        pickupZip: zip,
        contactName: contactName,
        contactPhone: contactPhone,
        scheduledDate: pickup.scheduled_date || new Date().toISOString(),
        invoices,
        totals
      };

      const pdfBase64 = this.createRomaneioPDF(romaneioData);

      return { success: true, pdfBase64, romaneioData };
    } catch (error) {

      return { success: false, error: 'Erro ao gerar romaneio' };
    }
  },

  createRomaneioPDF(data: RomaneioData): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ROMANEIO DE COLETA', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número da Coleta: ${data.pickupNumber}`, 15, yPos);

    yPos += 7;
    doc.text(`Transportador: ${data.carrierName}`, 15, yPos);

    yPos += 7;
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados da Coleta', 15, yPos);

    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Endereço: ${data.pickupAddress}`, 15, yPos);

    yPos += 5;
    doc.text(`Cidade: ${data.pickupCity}/${data.pickupState} - CEP: ${data.pickupZip}`, 15, yPos);

    yPos += 5;
    doc.text(`Contato: ${data.contactName} - Tel: ${data.contactPhone}`, 15, yPos);

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas Fiscais', 15, yPos);

    yPos += 7;
    doc.setFontSize(8);

    const headers = ['NF', 'Série', 'Emissão', 'Pedido', 'Vols', 'Peso', 'Valor'];
    const colWidths = [25, 15, 25, 25, 15, 25, 30];
    let xPos = 15;

    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });

    yPos += 5;
    doc.setFont('helvetica', 'normal');

    data.invoices.forEach((invoice) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      xPos = 15;
      doc.text(invoice.numero_nota || '-', xPos, yPos);
      xPos += colWidths[0];

      doc.text(invoice.serie || '-', xPos, yPos);
      xPos += colWidths[1];

      doc.text(invoice.data_emissao ? new Date(invoice.data_emissao).toLocaleDateString('pt-BR') : '-', xPos, yPos);
      xPos += colWidths[2];

      doc.text(invoice.numero_pedido || '-', xPos, yPos);
      xPos += colWidths[3];

      doc.text(String(invoice.quantidade_volumes || 0), xPos, yPos);
      xPos += colWidths[4];

      doc.text(`${invoice.peso || 0} kg`, xPos, yPos);
      xPos += colWidths[5];

      doc.text(`R$ ${(invoice.valor_total || 0).toFixed(2)}`, xPos, yPos);

      yPos += 5;
    });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAIS', 15, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Notas: ${data.totals.totalInvoices}`, 15, yPos);
    doc.text(`Total de Volumes: ${data.totals.totalVolumes}`, 70, yPos);

    yPos += 5;
    doc.text(`Peso Total: ${data.totals.totalWeight.toFixed(2)} kg`, 15, yPos);
    doc.text(`m³ Total: ${data.totals.totalCubicMeters.toFixed(3)}`, 70, yPos);

    yPos += 5;
    doc.text(`Valor Total: R$ ${data.totals.totalValue.toFixed(2)}`, 15, yPos);

    return doc.output('datauristring').split(',')[1];
  },

  async requestPickup(params: RequestPickupParams): Promise<{ success: boolean; requestIds?: string[]; error?: string }> {
    try {
      const ctx = await TenantContextHelper.getCurrentContext();
      if (!params.pdfBase64) {
        return { success: false, error: 'PDF da coleta é obrigatório' };
      }

      const requestNumber = `REQ-${Date.now()}`;
      const generatedRequests: string[] = [];

      let emailSent = false;
      let whatsappSent = false;
      let finalStatus: 'sent' | 'failed' | 'pending' = 'failed';

      // Insert logic for each pickup
      for (const pId of params.pickupIds) {
        let tenantInfo: { org?: string; env?: string; est?: string } = { 
           org: ctx?.organizationId || undefined, 
           env: ctx?.environmentId || undefined, 
           est: ctx?.establishmentId || params.establishmentId 
        };
        try {
           const { data: pkData } = await (supabase as any).from('pickups').select('organization_id, environment_id, establishment_id').eq('id', pId).single();
           if (pkData) {
              tenantInfo.org = pkData.organization_id || tenantInfo.org;
              tenantInfo.env = pkData.environment_id || tenantInfo.env;
              tenantInfo.est = pkData.establishment_id || tenantInfo.est;
           }
        } catch(e) {}

        const requestData: Partial<PickupRequest> = {
          pickup_id: pId,
          organization_id: tenantInfo.org,
          environment_id: tenantInfo.env,
          establishment_id: tenantInfo.est,
          request_number: requestNumber,
          requested_at: new Date().toISOString(),
          requested_by: (typeof params.userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId)) ? params.userId : null,
          requested_by_name: params.userName,
          notification_method: params.notificationMethod,
          carrier_email: params.carrierEmail,
          carrier_phone: params.carrierPhone,
          email_sent: false,
          whatsapp_sent: false,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: request, error: requestError } = await (supabase as any)
          .from('pickup_requests')
          .insert(requestData)
          .select()
          .single();

        if (requestError || !request) {
           console.error(`Falha ao registrar log log para coleta ${pId}`, requestError);
           continue; 
        }

        generatedRequests.push(request.id);

        await (supabase as any)
          .from('pickups')
          .update({
            status: 'solicitada',
            requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', pId);
      }

      if (generatedRequests.length === 0) {
        return { success: false, error: 'Falha ao processar inserções no banco.' };
      }

      if ((params.notificationMethod === 'email' || params.notificationMethod === 'both') && params.carrierEmail) {
        try {
          const config = await emailOutgoingConfigService.getActiveConfig(params.establishmentId);
          if (config) {
            const { romaneioData, pdfBase64: internalPdf } = await this.generateRomaneio(params.pickupIds);

            let rawBase64Content = '';
            if (internalPdf) {
               // internalPdf is generated as split(',')[1], so it's already raw
               rawBase64Content = internalPdf.includes('base64,') ? internalPdf.split('base64,')[1] : internalPdf;
            } else {
               rawBase64Content = params.pdfBase64.includes('base64,') 
                 ? params.pdfBase64.split('base64,')[1] 
                 : params.pdfBase64.replace(/^data:.*?,/, '');
            }

            const establishmentObj: any = await establishmentsService.getById(params.establishmentId);
            const logoUrl = establishmentObj?.logo_claro_url || 'https://raw.githubusercontent.com/acjeferson-cloud/tmsembarcador/main/public/logo-logaxis.png';
            const signName = establishmentObj?.fantasia || establishmentObj?.razao_social || 'Sua Empresa';

            let htmlBody = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333; text-align: center; background-color: #ffffff;">
                <div style="margin-bottom: 30px; padding-top: 20px;">
                  <img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 250px; display: block; margin: 0 auto;" />
                </div>
                <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px;">Solicitação de Coleta</h2>
                <p style="text-align: left; font-size: 14px; line-height: 1.6;">Olá,</p>
                <p style="text-align: left; font-size: 14px; line-height: 1.6;">Você possui uma nova solicitação de coleta registrada no sistema para ser realizada. Abaixo estão os detalhes completos da carga e do local de coleta:</p>
            `;

            if (romaneioData) {
              const scheduledDateStr = romaneioData.scheduledDate ? new Date(romaneioData.scheduledDate).toLocaleDateString('pt-BR') : '-';
              
              let invoiceHtmlRows = '';
              romaneioData.invoices.forEach((inv: any) => {
                 invoiceHtmlRows += `
                   <tr style="border-bottom: 1px solid #e5e7eb;">
                     <td style="padding: 8px; text-align: left; color: #374151;">${inv.serie || '-'}/${inv.numero_nota || '-'}</td>
                     <td style="padding: 8px; text-align: center; color: #374151;">${inv.quantidade_volumes || 1}</td>
                     <td style="padding: 8px; text-align: right; color: #374151;">${Number(inv.peso || 0).toFixed(2)} kg</td>
                     <td style="padding: 8px; text-align: right; color: #374151;">${Number(inv.metros_cubicos || 0).toFixed(3)} m³</td>
                     <td style="padding: 8px; text-align: right; color: #374151;">R$ ${Number(inv.valor_total || 0).toFixed(2)}</td>
                   </tr>
                 `;
              });

              htmlBody += `
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: left;">
                  <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Detalhes da Coleta</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #374151;">
                    <tr><td style="padding: 4px 0;"><strong>Número/Romaneio:</strong> ${romaneioData.pickupNumber}</td></tr>
                    <tr><td style="padding: 4px 0;"><strong>Endereço:</strong> ${romaneioData.pickupAddress}</td></tr>
                    <tr><td style="padding: 4px 0;"><strong>Cidade/UF:</strong> ${romaneioData.pickupCity}/${romaneioData.pickupState} - CEP: ${romaneioData.pickupZip}</td></tr>
                    <tr><td style="padding: 4px 0;"><strong>Contato Local:</strong> ${romaneioData.contactName} (${romaneioData.contactPhone})</td></tr>
                    <tr><td style="padding: 4px 0;"><strong>Data Agendada:</strong> ${scheduledDateStr}</td></tr>
                  </table>
                </div>

                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: left;">
                  <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Resumo da Carga</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #374151;">
                     <tr>
                        <td style="padding: 4px 0; width: 50%;"><strong>Qtd. Notas Fiscais:</strong> ${romaneioData.totals.totalInvoices}</td>
                        <td style="padding: 4px 0; width: 50%;"><strong>Total Volumes:</strong> ${romaneioData.totals.totalVolumes}</td>
                     </tr>
                     <tr>
                        <td style="padding: 4px 0; width: 50%;"><strong>Peso Total:</strong> ${romaneioData.totals.totalWeight.toFixed(2)} kg</td>
                        <td style="padding: 4px 0; width: 50%;"><strong>Metros Cúbicos:</strong> ${romaneioData.totals.totalCubicMeters.toFixed(3)} m³</td>
                     </tr>
                     <tr>
                        <td style="padding: 4px 0;" colspan="2"><strong>Valor Total da Carga:</strong> R$ ${romaneioData.totals.totalValue.toFixed(2)}</td>
                     </tr>
                  </table>
                </div>

                <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: left;">
                  <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Detalhes das Notas Fiscais</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                      <tr style="background-color: #f3f4f6;">
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #d1d5db; color: #1f2937;">Série/Número</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 2px solid #d1d5db; color: #1f2937;">Vols</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db; color: #1f2937;">Peso</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db; color: #1f2937;">Metros C³</th>
                        <th style="padding: 8px; text-align: right; border-bottom: 2px solid #d1d5db; color: #1f2937;">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoiceHtmlRows}
                    </tbody>
                  </table>
                </div>
              `;
            }

            htmlBody += `
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-size: 14px; line-height: 1.6; color: #6b7280;">
                  <p>Atenciosamente,<br/><br/><strong style="color: #374151;">${signName}</strong></p>
                </div>
              </div>
            `;

            const emailData = {
              from: { email: config.from_email, name: config.from_name },
              to: params.carrierEmail,
              subject: `Solicitação de Coleta - Log Axis (${requestNumber})`,
              html: htmlBody,
              attachments: [
                {
                   filename: `Relatorio_Coleta_${requestNumber}.pdf`,
                   content: rawBase64Content,
                   encoding: 'base64'
                }
              ]
            };

            const payload = {
              email: emailData,
              smtp_config: { host: config.smtp_host, port: config.smtp_port, secure: config.smtp_secure, auth: { user: config.smtp_user, pass: config.smtp_password } }
            };

            const { data: edgeData, error: edgeError } = await supabase!.functions.invoke('send-test-email', { body: payload });
            
            if (!edgeError && edgeData?.success) {
              emailSent = true;
            } else {

              return { success: false, error: `Falha ao enviar e-mail via Edge Function: ${(edgeError?.message || edgeData?.error || 'Erro desconhecido')}` };
            }
          } else {

            return { success: false, error: 'A filial de embarque ("Meus Dados") não possui um E-mail de Saída configurado e ativo. Vá em Configurações > E-mail de Saída.' };
          }
        } catch (emailErr: any) {

          return { success: false, error: `Erro na comunicação com servidor de e-mail: ${emailErr.message}` };
        }
      }

      if (params.notificationMethod === 'whatsapp' || params.notificationMethod === 'both') {
        if (params.carrierPhone) {
          // Placeholder para envio real no futuro
          whatsappSent = true;
        }
      }

      if (emailSent || whatsappSent) {
         finalStatus = 'sent';
      }

      // Update all generated requests status
      for (const reqId of generatedRequests) {
        await (supabase as any)
          .from('pickup_requests')
          .update({
            email_sent: emailSent,
            whatsapp_sent: whatsappSent,
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', reqId);
      }

      return { success: true, requestIds: generatedRequests };
    } catch (error) {

      return { success: false, error: 'Erro ao solicitar coleta' };
    }
  },

  async getPickupRequests(pickupId: string): Promise<PickupRequest[]> {
    try {
      const { data, error } = await supabase!
        .from('pickup_requests')
        .select('*')
        .eq('pickup_id', pickupId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {

      return [];
    }
  }
};
