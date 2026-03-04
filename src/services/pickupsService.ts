import { supabase } from '../lib/supabase';

interface Pickup {
  id?: string;
  pickup_number?: string;
  pickup_number_seq?: number;
  establishment_id?: string;
  customer_id?: string;
  customer_name: string;
  carrier_id?: string;
  carrier_name: string;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  pickup_address: string;
  pickup_city: string;
  pickup_state: string;
  pickup_zip: string;
  contact_name: string;
  contact_phone: string;
  packages_quantity: number;
  total_weight: number;
  total_volume?: number;
  status: 'emitida' | 'solicitada' | 'realizada' | 'cancelada';
  actual_pickup_date?: string;
  driver_name?: string;
  vehicle_plate?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
}

interface PickupInvoice {
  id?: string;
  pickup_id: string;
  invoice_id: string;
  freight_table_name?: string;
  freight_rate_value?: number;
  created_at?: string;
}

interface Invoice {
  id: string;
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
  transportador_nome?: string;
  transportador_id?: string;
}

interface CreatePickupFromInvoicesParams {
  invoiceIds: string[];
  establishmentId: string;
  userId: number;
}

interface CreatePickupResult {
  success: boolean;
  pickups?: Array<{
    pickupId: string;
    pickupNumber: string;
    carrierName: string;
    invoiceCount: number;
  }>;
  error?: string;
  warning?: string;
}

export const pickupsService = {
  async getAll(): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar coletas:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Pickup | null> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar coleta:', error);
      return null;
    }
  },

  async getPickupInvoices(pickupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pickup_invoices')
        .select(`
          *,
          invoices (
            id,
            numero_nota,
            serie,
            chave_nfe,
            data_emissao,
            numero_pedido,
            quantidade_volumes,
            metros_cubicos,
            peso,
            valor_total,
            mercadoria,
            transportador_nome
          )
        `)
        .eq('pickup_id', pickupId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notas da coleta:', error);
      return [];
    }
  },

  async createFromInvoices(params: CreatePickupFromInvoicesParams): Promise<CreatePickupResult> {
    try {
      const { invoiceIds, establishmentId, userId } = params;

      if (!invoiceIds || invoiceIds.length === 0) {
        return { success: false, error: 'Nenhuma nota fiscal selecionada' };
      }

      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .in('id', invoiceIds);

      if (invoicesError || !invoices || invoices.length === 0) {
        return { success: false, error: 'Erro ao buscar notas fiscais selecionadas' };
      }

      const invoicesByCarrier = invoices.reduce((acc: any, invoice: any) => {
        const carrierId = invoice.transportador_id || 'sem_transportador';
        const carrierName = invoice.transportador_nome || 'Sem Transportador';

        if (!acc[carrierId]) {
          acc[carrierId] = {
            carrierName,
            carrierId: invoice.transportador_id,
            invoices: []
          };
        }
        acc[carrierId].invoices.push(invoice);
        return acc;
      }, {});

      const carrierGroups = Object.values(invoicesByCarrier) as any[];
      const multipleCarriers = carrierGroups.length > 1;

      const createdPickups = [];

      for (const group of carrierGroups) {
        const firstInvoice = group.invoices[0];

        const totalWeight = group.invoices.reduce((sum: number, inv: any) => sum + (inv.peso || 0), 0);
        const totalVolume = group.invoices.reduce((sum: number, inv: any) => sum + (inv.metros_cubicos || 0), 0);
        const totalPackages = group.invoices.reduce((sum: number, inv: any) => sum + (inv.quantidade_volumes || 0), 0);

        const pickupData = {
          establishment_id: establishmentId,
          carrier_id: group.carrierId,
          carrier_name: group.carrierName,
          customer_name: firstInvoice.destinatario_nome || 'Cliente',
          scheduled_date: new Date().toISOString(),
          pickup_address: firstInvoice.remetente_endereco || '',
          pickup_city: firstInvoice.remetente_cidade || '',
          pickup_state: firstInvoice.remetente_uf || '',
          pickup_zip: firstInvoice.remetente_cep || '',
          contact_name: firstInvoice.remetente_nome || '',
          contact_phone: firstInvoice.remetente_telefone || '',
          packages_quantity: totalPackages,
          total_weight: totalWeight,
          total_volume: totalVolume > 0 ? totalVolume : null,
          status: 'coleta_emitida' as const,
          observations: `Coleta criada automaticamente a partir de ${group.invoices.length} nota(s) fiscal(is)`,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: pickup, error: pickupError } = await supabase
          .from('pickups')
          .insert(pickupData)
          .select('id, pickup_number_seq')
          .single();

        if (pickupError || !pickup) {
          console.error('Erro ao criar coleta:', pickupError);
          continue;
        }

        const pickupNumber = `COL-${String(pickup.pickup_number_seq).padStart(5, '0')}`;

        await supabase
          .from('pickups')
          .update({ pickup_number: pickupNumber })
          .eq('id', pickup.id);

        const pickupInvoices = group.invoices.map((invoice: any) => ({
          pickup_id: pickup.id,
          invoice_id: invoice.id,
          freight_table_name: invoice.tabela_frete || null,
          freight_rate_value: invoice.tarifa_frete || null,
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('pickup_invoices')
          .insert(pickupInvoices);

        createdPickups.push({
          pickupId: pickup.id,
          pickupNumber,
          carrierName: group.carrierName,
          invoiceCount: group.invoices.length
        });
      }

      if (createdPickups.length === 0) {
        return { success: false, error: 'Não foi possível criar nenhuma coleta' };
      }

      return {
        success: true,
        pickups: createdPickups,
        warning: multipleCarriers
          ? `As notas fiscais pertencem a ${carrierGroups.length} transportadores diferentes. Foram criadas ${createdPickups.length} coletas separadas.`
          : undefined
      };

    } catch (error) {
      console.error('Erro ao criar coletas:', error);
      return { success: false, error: 'Erro ao criar coletas a partir das notas fiscais' };
    }
  },

  async update(id: string, pickup: Partial<Pickup>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pickups')
        .update({
          ...pickup,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar coleta:', error);
      return { success: false, error: 'Erro ao atualizar coleta' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pickups')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir coleta:', error);
      return { success: false, error: 'Erro ao excluir coleta' };
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Pickup[]> {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar coletas por período:', error);
      return [];
    }
  }
};
