import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

export interface PickupRequest {
  id?: string;
  pickup_id: string;
  request_number: string;
  requested_at: string;
  requested_by: number;
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
  userId: number;
  userName: string;
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
      const { data: pickup, error: pickupError } = await supabase
        .from('pickups')
        .select('*')
        .eq('id', pickupId)
        .maybeSingle();

      if (pickupError || !pickup) {
        return { success: false, error: 'Coleta não encontrada' };
      }

      const { data: pickupInvoices, error: invoicesError } = await supabase
        .from('pickup_invoices')
        .select(`
          *,
          invoices (
            numero_nota,
            serie,
            chave_nfe,
            data_emissao,
            numero_pedido,
            quantidade_volumes,
            metros_cubicos,
            peso,
            valor_total,
            mercadoria
          )
        `)
        .eq('pickup_id', pickupId);

      if (invoicesError || !pickupInvoices || pickupInvoices.length === 0) {
        return { success: false, error: 'Nenhuma nota fiscal vinculada à coleta' };
      }

      const invoices = pickupInvoices
        .map(pi => pi.invoices)
        .filter(inv => inv != null);

      const totals = {
        totalInvoices: invoices.length,
        totalVolumes: invoices.reduce((sum, inv) => sum + (inv.quantidade_volumes || 0), 0),
        totalCubicMeters: invoices.reduce((sum, inv) => sum + (inv.metros_cubicos || 0), 0),
        totalWeight: invoices.reduce((sum, inv) => sum + (inv.peso || 0), 0),
        totalValue: invoices.reduce((sum, inv) => sum + (inv.valor_total || 0), 0)
      };

      const romaneioData: RomaneioData = {
        pickupNumber: pickup.pickup_number || '-',
        carrierName: pickup.carrier_name || '-',
        pickupAddress: pickup.pickup_address || '-',
        pickupCity: pickup.pickup_city || '-',
        pickupState: pickup.pickup_state || '-',
        pickupZip: pickup.pickup_zip || '-',
        contactName: pickup.contact_name || '-',
        contactPhone: pickup.contact_phone || '-',
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
      const romaneioResult = await this.generateRomaneio(params.pickupId);

      if (!romaneioResult.success) {
        return { success: false, error: romaneioResult.error };
      }

      const requestNumber = `REQ-${Date.now()}`;

      const requestData: Partial<PickupRequest> = {
        pickup_id: params.pickupId,
        request_number: requestNumber,
        requested_at: new Date().toISOString(),
        requested_by: params.userId,
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
        return { success: false, error: 'Erro ao criar solicitação de coleta' };
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

      if (params.notificationMethod === 'email' || params.notificationMethod === 'both') {
        if (params.carrierEmail) {

          emailSent = true;
        }
      }

      if (params.notificationMethod === 'whatsapp' || params.notificationMethod === 'both') {
        if (params.carrierPhone) {

          whatsappSent = true;
        }
      }

      await supabase
        .from('pickup_requests')
        .update({
          email_sent: emailSent,
          whatsapp_sent: whatsappSent,
          status: (emailSent || whatsappSent) ? 'sent' : 'failed',
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
