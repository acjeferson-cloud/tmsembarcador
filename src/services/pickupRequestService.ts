import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import emailOutgoingConfigService from './emailOutgoingConfigService';
import { pickupsService } from './pickupsService';
import { establishmentsService } from './establishmentsService';

export interface PickupRequest {
  id?: string;
  pickup_id: string;
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
  pickupId: string;
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
  async generateRomaneio(pickupId: string): Promise<{ success: boolean; pdfBase64?: string; romaneioData?: RomaneioData; error?: string }> {
    try {
      const pickup = await pickupsService.getById(pickupId);

      if (!pickup) {
        return { success: false, error: 'Coleta não encontrada' };
      }

      // Fetch establishment data to use as pickup location for the email (as requested, the 
      // pickup originates from the logged user's establishment branch)
      let establishment: any = null;
      if (pickup.establishment_id) {
        establishment = await establishmentsService.getById(pickup.establishment_id);
      }

      const rawInvoicesData = await pickupsService.getPickupInvoices(pickupId);

      const invoices = rawInvoicesData.map((item: any) => {
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
        totalVolumes: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.quantidade_volumes || 0), 0) : (pickup.packages_quantity || 0),
        totalCubicMeters: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.metros_cubicos || 0), 0) : (pickup.total_volume || 0), // Use total_volume mapping for manual pick-ups
        totalWeight: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.peso || 0), 0) : (pickup.total_weight || 0),
        totalValue: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.valor_total || 0), 0) : 0 // Valor_total is not stored on manual pickup creation fallback directly, keep 0 or calculate
      };

      // Since the request asks to use establishment data for address and contact:
      const address = establishment ? (establishment.logradouro || establishment.endereco || pickup.pickup_address || '-') : (pickup.pickup_address || '-');
      const city = establishment ? (establishment.cidade || pickup.pickup_city || '-') : (pickup.pickup_city || '-');
      const state = establishment ? (establishment.estado || pickup.pickup_state || '-') : (pickup.pickup_state || '-');
      const zip = establishment ? (establishment.cep || pickup.pickup_zip || '-') : (pickup.pickup_zip || '-');
      const contactName = establishment ? (establishment.razao_social || establishment.fantasia || pickup.contact_name || '-') : (pickup.contact_name || '-');
      const contactPhone = establishment ? (establishment.telefone || pickup.contact_phone || '-') : (pickup.contact_phone || '-');

      const romaneioData: RomaneioData = {
        pickupNumber: pickup.pickup_number || '-',
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

  async requestPickup(params: RequestPickupParams): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      if (!params.pdfBase64) {
        return { success: false, error: 'PDF da coleta é obrigatório' };
      }

      const requestNumber = `REQ-${Date.now()}`;

      const requestData: Partial<PickupRequest> = {
        pickup_id: params.pickupId,
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

      const { data: request, error: requestError } = await supabase
        .from('pickup_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError || !request) {

        return { success: false, error: `Erro ao criar solicitação na base: ${requestError?.message || 'Motivo desconhecido'}` };
      }

      await supabase
        .from('pickups')
        .update({
          status: 'solicitada',
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.pickupId);

      let emailSent = false;
      let whatsappSent = false;
      let finalStatus: 'sent' | 'failed' | 'pending' = 'failed';

      if ((params.notificationMethod === 'email' || params.notificationMethod === 'both') && params.carrierEmail) {
        try {
          const config = await emailOutgoingConfigService.getActiveConfig(params.establishmentId);
          if (config) {
            const { romaneioData, pdfBase64: internalPdf } = await this.generateRomaneio(params.pickupId);

            let rawBase64Content = '';
            if (internalPdf) {
               // internalPdf is generated as split(',')[1], so it's already raw
               rawBase64Content = internalPdf.includes('base64,') ? internalPdf.split('base64,')[1] : internalPdf;
            } else {
               rawBase64Content = params.pdfBase64.includes('base64,') 
                 ? params.pdfBase64.split('base64,')[1] 
                 : params.pdfBase64.replace(/^data:.*?,/, '');
            }

            let htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: left;">
                <h2 style="color: #2563eb;">Nova Solicitação de Coleta</h2>
                <p>Olá,</p>
                <p>Você possui uma nova solicitação de coleta registrada no sistema TMS.</p>
            `;

            if (romaneioData) {
              const scheduledDateStr = romaneioData.scheduledDate ? new Date(romaneioData.scheduledDate).toLocaleDateString('pt-BR') : '-';
              
              htmlBody += `
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Detalhes da Coleta</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;"><strong>Número:</strong> ${romaneioData.pickupNumber}</li>
                    <li style="margin-bottom: 8px;"><strong>Endereço:</strong> ${romaneioData.pickupAddress}</li>
                    <li style="margin-bottom: 8px;"><strong>Cidade/UF:</strong> ${romaneioData.pickupCity}/${romaneioData.pickupState} - CEP: ${romaneioData.pickupZip}</li>
                    <li style="margin-bottom: 8px;"><strong>Contato Local:</strong> ${romaneioData.contactName} (${romaneioData.contactPhone})</li>
                    <li style="margin-bottom: 8px;"><strong>Data Agendada:</strong> ${scheduledDateStr}</li>
                  </ul>
                </div>

                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1f2937;">Resumo da Carga</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;"><strong>Qtd. Notas Fiscais:</strong> ${romaneioData.totals.totalInvoices}</li>
                    <li style="margin-bottom: 8px;"><strong>Total Volumes:</strong> ${romaneioData.totals.totalVolumes}</li>
                    <li style="margin-bottom: 8px;"><strong>Peso Total:</strong> ${romaneioData.totals.totalWeight.toFixed(2)} kg</li>
                    <li style="margin-bottom: 8px;"><strong>Metros Cúbicos:</strong> ${romaneioData.totals.totalCubicMeters.toFixed(3)} m³</li>
                    <li style="margin-bottom: 0;"><strong>Valor Total da Carga:</strong> R$ ${romaneioData.totals.totalValue.toFixed(2)}</li>
                  </ul>
                </div>
              `;
            }

            htmlBody += `
                <br/>
                <p>Atenciosamente,<br/><br/><strong>Equipe Log Axis</strong></p>
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

            const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-test-email', { body: payload });
            
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

      await supabase
        .from('pickup_requests')
        .update({
          email_sent: emailSent,
          whatsapp_sent: whatsappSent,
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      return { success: true, requestId: request.id };
    } catch (error) {

      return { success: false, error: 'Erro ao solicitar coleta' };
    }
  },

  async getPickupRequests(pickupId: string): Promise<PickupRequest[]> {
    try {
      const { data, error } = await supabase
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
