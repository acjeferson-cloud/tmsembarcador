import { supabase } from '../lib/supabase';

interface PickupScheduling {
  id?: string;
  establishment_id?: string;
  token: string;
  carrier_email: string;
  status: 'awaiting_response' | 'link_sent' | 'scheduled';
  scheduled_date?: string;
  scheduled_time?: string;
  carrier_notes?: string;
  expires_at: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface PickupSchedulingInvoice {
  id?: string;
  pickup_scheduling_id: string;
  invoice_id: string;
  created_at?: string;
}

export interface PickupSchedulingWithInvoices extends PickupScheduling {
  invoices?: any[];
  total_weight?: number;
  total_volumes?: number;
  total_cubic_meters?: number;
}

interface CreatePickupSchedulingRequest {
  establishment_id: string;
  carrier_email: string;
  invoice_ids: string[];
  created_by?: string;
  expires_in_hours?: number;
}

class PickupSchedulingService {
  private generateToken(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  }

  async createScheduling(data: CreatePickupSchedulingRequest): Promise<{ success: boolean; data?: PickupScheduling; error?: string }> {
    try {
      const token = this.generateToken();
      const expiresInHours = data.expires_in_hours || 72;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const schedulingData: PickupScheduling = {
        establishment_id: data.establishment_id,
        token,
        carrier_email: data.carrier_email,
        status: 'link_sent',
        expires_at: expiresAt.toISOString(),
        created_by: data.created_by
      };

      const { data: scheduling, error: schedulingError } = await supabase
        .from('pickup_scheduling')
        .insert(schedulingData)
        .select()
        .single();

      if (schedulingError) throw schedulingError;

      const invoiceRelations = data.invoice_ids.map(invoice_id => ({
        pickup_scheduling_id: scheduling.id,
        invoice_id
      }));

      const { error: relationsError } = await supabase
        .from('pickup_scheduling_invoices')
        .insert(invoiceRelations);

      if (relationsError) throw relationsError;

      return { success: true, data: scheduling };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  async getSchedulingByToken(token: string): Promise<{ success: boolean; data?: PickupSchedulingWithInvoices; error?: string }> {
    try {
      const { data: scheduling, error: schedulingError } = await supabase
        .from('pickup_scheduling')
        .select('*')
        .eq('token', token)
        .single();

      if (schedulingError) throw schedulingError;

      if (new Date(scheduling.expires_at) < new Date()) {
        return { success: false, error: 'Link expirado' };
      }

      const { data: relations, error: relationsError } = await supabase
        .from('pickup_scheduling_invoices')
        .select(`
          invoice_id,
          invoices_nfe:invoice_id (
            id,
            numero_nfe,
            serie_nfe,
            chave_acesso,
            emitente_nome,
            destinatario_nome,
            valor_total,
            peso_bruto,
            quantidade_volumes,
            peso_liquido
          )
        `)
        .eq('pickup_scheduling_id', scheduling.id);

      if (relationsError) throw relationsError;

      const invoices = relations?.map(r => r.invoices_nfe) || [];

      const totals = invoices.reduce((acc, invoice: any) => {
        acc.weight += parseFloat(invoice?.peso_bruto || 0);
        acc.volumes += parseInt(invoice?.quantidade_volumes || 0);
        return acc;
      }, { weight: 0, volumes: 0 });

      const result: PickupSchedulingWithInvoices = {
        ...scheduling,
        invoices,
        total_weight: totals.weight,
        total_volumes: totals.volumes,
        total_cubic_meters: 0
      };

      return { success: true, data: result };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  async updateScheduling(token: string, data: { scheduled_date: string; scheduled_time: string; carrier_notes?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pickup_scheduling')
        .update({
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          carrier_notes: data.carrier_notes,
          status: 'scheduled'
        })
        .eq('token', token);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  async getSchedulingsByEstablishment(establishmentId: string): Promise<{ success: boolean; data?: PickupSchedulingWithInvoices[]; error?: string }> {
    try {
      const { data: schedulings, error: schedulingsError } = await supabase
        .from('pickup_scheduling')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (schedulingsError) throw schedulingsError;

      const schedulingsWithInvoices = await Promise.all(
        (schedulings || []).map(async (scheduling) => {
          const { data: relations } = await supabase
            .from('pickup_scheduling_invoices')
            .select(`
              invoice_id,
              invoices_nfe:invoice_id (
                id,
                numero_nfe,
                serie_nfe,
                chave_acesso
              )
            `)
            .eq('pickup_scheduling_id', scheduling.id);

          return {
            ...scheduling,
            invoices: relations?.map(r => r.invoices_nfe) || []
          };
        })
      );

      return { success: true, data: schedulingsWithInvoices };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  async getSchedulingsByInvoice(invoiceId: string): Promise<{ success: boolean; data?: PickupScheduling[]; error?: string }> {
    try {
      const { data: relations, error: relationsError } = await supabase
        .from('pickup_scheduling_invoices')
        .select(`
          pickup_scheduling_id,
          pickup_scheduling:pickup_scheduling_id (*)
        `)
        .eq('invoice_id', invoiceId);

      if (relationsError) throw relationsError;

      const schedulings = relations?.map(r => r.pickup_scheduling).filter(Boolean) || [];

      return { success: true, data: schedulings as PickupScheduling[] };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  async deleteScheduling(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pickup_scheduling')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  generatePublicLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/agendamento-coleta/${token}`;
  }
}

export const pickupSchedulingService = new PickupSchedulingService();
