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
      const { data, error } = await (supabase as any)
        .from('pickups')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          pickup_invoices(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        pickup_number: p.numero_coleta,
        establishment_id: p.establishment_id,
        customer_name: p.contato_nome || '',
        carrier_id: p.carrier_id,
        carrier_name: p.carrier?.razao_social || '',
        transportador: p.carrier ? `${p.carrier.codigo ? p.carrier.codigo + ' - ' : ''}${p.carrier.razao_social}` : 'N/A',
        scheduled_date: p.data_agendada || p.data_solicitacao,
        pickup_address: p.logradouro || '',
        pickup_city: p.cidade || '',
        pickup_state: p.estado || '',
        pickup_zip: p.cep || '',
        contact_name: p.contato_nome || '',
        contact_phone: p.contato_telefone || '',
        usuarioResponsavel: p.contato_nome || 'Usuário Sistema',
        packages_quantity: p.pickup_invoices?.[0]?.count || 0,
        total_weight: p.peso_total || 0,
        total_volume: p.valor_total || 0,
        status: p.status,
        created_at: p.created_at,
        observations: p.observacoes || ''
      })) as Pickup[];
    } catch (error) {
      console.error('Error fetching pickups:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Pickup | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('pickups')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          pickup_invoices(count)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        pickup_number: data.numero_coleta,
        establishment_id: data.establishment_id,
        customer_name: data.contato_nome || '',
        carrier_id: data.carrier_id,
        carrier_name: data.carrier?.razao_social || '',
        transportador: data.carrier ? `${data.carrier.codigo ? data.carrier.codigo + ' - ' : ''}${data.carrier.razao_social}` : 'N/A',
        scheduled_date: data.data_agendada || data.data_solicitacao,
        pickup_address: data.logradouro || '',
        pickup_city: data.cidade || '',
        pickup_state: data.estado || '',
        pickup_zip: data.cep || '',
        contact_name: data.contato_nome || '',
        contact_phone: data.contato_telefone || '',
        usuarioResponsavel: data.contato_nome || 'Usuário Sistema',
        packages_quantity: data.pickup_invoices?.[0]?.count || 0,
        total_weight: data.peso_total || 0,
        total_volume: data.valor_total || 0,
        status: data.status,
        created_at: data.created_at,
        observations: data.observacoes || ''
      } as unknown as Pickup;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  },

  async getPickupInvoices(pickupId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
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

      return [];
    }
  },

  async createFromNfes(params: CreatePickupFromInvoicesParams): Promise<CreatePickupResult> {
    try {
      const { invoiceIds, establishmentId, userId } = params;

      if (!invoiceIds || invoiceIds.length === 0) {
        return { success: false, error: 'Nenhuma nota fiscal selecionada' };
      }

      // Buscar as NFes com clientes/transportadores já usando a tabela nova do sistema
      const { data: invoices, error: invoicesError } = await (supabase as any)
        .from('invoices_nfe')
        .select(`
          *,
          customer:invoices_nfe_customers(*),
          carrier:carriers(
            id,
            razao_social,
            cnpj,
            codigo
          ),
          products:invoices_nfe_products(*)
        `)
        .in('id', invoiceIds);

      if (invoicesError || !invoices || invoices.length === 0) {
        return { success: false, error: 'Erro ao buscar notas fiscais selecionadas' };
      }

      // Group by carrier
      const invoicesByCarrier = invoices.reduce((acc: any, invoice: any) => {
        const carrierId = invoice.carrier?.id || 'sem_transportador';
        const carrierName = invoice.carrier?.razao_social || 'Sem Transportador';

        if (!acc[carrierId]) {
          acc[carrierId] = {
            carrierName,
            carrierId: invoice.carrier?.id,
            invoices: []
          };
        }
        acc[carrierId].invoices.push(invoice);
        return acc;
      }, {});

      const carrierGroups = Object.values(invoicesByCarrier) as any[];
      const multipleCarriers = carrierGroups.length > 1;

      // Calculate pickupNumber iteratively
      const { data: lastPickup } = await (supabase as any).from('pickups').select('numero_coleta').order('created_at', { ascending: false }).limit(1);
      let nextNum = 1;
      if (lastPickup && lastPickup.length > 0 && lastPickup[0].numero_coleta) {
        const match = lastPickup[0].numero_coleta.match(/COL-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }

      const createdPickups = [];

      for (const group of carrierGroups) {
        const firstInvoice = group.invoices[0];
        const dest = firstInvoice.customer?.[0] || {};

        // In XML NFe imported, we didn't strictly map total weight and volume globally in the DB schema, 
        // we map it if present or leave it 0
        const totalWeight = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.peso) || 0), 0);
        const totalVolume = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.metros_cubicos) || 0), 0);
        const totalPackages = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.quantidade_volumes) || 0), 0);
        const totalValue = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.valor_total) || 0), 0);

        const pickupNumber = `COL-${String(nextNum).padStart(4, '0')}`;
        nextNum++;

        const pickupData = {
          establishment_id: establishmentId,
          carrier_id: group.carrierId,
          numero_coleta: pickupNumber,
          data_agendada: new Date().toISOString().split('T')[0],
          data_solicitacao: new Date().toISOString(),
          logradouro: dest.endereco || '',
          cidade: dest.cidade || '',
          estado: dest.estado || '',
          cep: dest.cep || '',
          contato_nome: dest.razao_social || '',
          contato_telefone: dest.telefone || '',
          quantidade_volumes: totalPackages,
          peso_total: totalWeight,
          valor_total: totalValue,
          status: 'emitida',
          observacoes: `Coleta criada automaticamente a partir de ${group.invoices.length} NFe(s)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: pickup, error: pickupError } = await (supabase as any)
          .from('pickups')
          .insert(pickupData as any)
          .select('id, numero_coleta')
          .single();

        if (pickupError || !pickup) {
          console.error('Error creating pickup:', pickupError);
          continue;
        }

        const pickupInvoices = group.invoices.map((invoice: any) => ({
          pickup_id: pickup.id,
          invoice_id: invoice.id,
          created_at: new Date().toISOString()
        }));

        await (supabase as any)
          .from('pickup_invoices')
          .insert(pickupInvoices as any);

        createdPickups.push({
          pickupId: pickup.id,
          pickupNumber: pickup.numero_coleta,
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
      console.error('Error in createFromNfes:', error);
      return { success: false, error: 'Erro ao criar coletas a partir das NFes' };
    }
  },

  async createFromInvoices(params: CreatePickupFromInvoicesParams): Promise<CreatePickupResult> {
    try {
      const { invoiceIds, establishmentId, userId } = params;

      if (!invoiceIds || invoiceIds.length === 0) {
        return { success: false, error: 'Nenhuma nota fiscal selecionada' };
      }

      const { data: invoices, error: invoicesError } = await (supabase as any)
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

      // Calculate pickupNumber iteratively
      const { data: lastPickup } = await (supabase as any).from('pickups').select('numero_coleta').order('created_at', { ascending: false }).limit(1);
      let nextNum = 1;
      if (lastPickup && lastPickup.length > 0 && lastPickup[0].numero_coleta) {
        const match = lastPickup[0].numero_coleta.match(/COL-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }

      const createdPickups = [];

      for (const group of carrierGroups) {
        const firstInvoice = group.invoices[0];

        const totalWeight = group.invoices.reduce((sum: number, inv: any) => sum + (inv.peso || 0), 0);
        const totalVolume = group.invoices.reduce((sum: number, inv: any) => sum + (inv.metros_cubicos || 0), 0);
        const totalPackages = group.invoices.reduce((sum: number, inv: any) => sum + (inv.quantidade_volumes || 0), 0);
        const totalValue = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.valor_total) || 0), 0);

        const pickupNumber = `COL-${String(nextNum).padStart(4, '0')}`;
        nextNum++;

        const pickupData = {
          establishment_id: establishmentId,
          carrier_id: group.carrierId,
          numero_coleta: pickupNumber,
          data_agendada: new Date().toISOString().split('T')[0],
          data_solicitacao: new Date().toISOString(),
          logradouro: firstInvoice.remetente_endereco || '',
          cidade: firstInvoice.remetente_cidade || '',
          estado: firstInvoice.remetente_uf || '',
          cep: firstInvoice.remetente_cep || '',
          contato_nome: firstInvoice.remetente_nome || '',
          contato_telefone: firstInvoice.remetente_telefone || '',
          quantidade_volumes: totalPackages,
          peso_total: totalWeight,
          valor_total: totalValue,
          status: 'emitida',
          observacoes: `Coleta criada automaticamente a partir de ${group.invoices.length} nota(s) fiscal(is)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: pickup, error: pickupError } = await (supabase as any)
          .from('pickups')
          .insert(pickupData)
          .select('id, numero_coleta')
          .single();

        if (pickupError || !pickup) {
          console.error('Error creating pickup:', pickupError);
          continue;
        }

        const pickupInvoices = group.invoices.map((invoice: any) => ({
          pickup_id: pickup.id,
          invoice_id: invoice.id,
          created_at: new Date().toISOString()
        }));

        await (supabase as any)
          .from('pickup_invoices')
          .insert(pickupInvoices);

        createdPickups.push({
          pickupId: pickup.id,
          pickupNumber: pickup.numero_coleta,
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

      return { success: false, error: 'Erro ao criar coletas a partir das notas fiscais' };
    }
  },

  async update(id: string, pickup: Partial<Pickup>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('pickups')
        .update({
          ...pickup,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar coleta' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete associated invoice links
      const { error: invoiceError } = await (supabase as any)
        .from('pickup_invoices')
        .delete()
        .eq('pickup_id', id);

      if (invoiceError && invoiceError.code !== 'PGRST116') {
        return { success: false, error: 'Erro ao excluir itens vinculados à coleta desativada' };
      }

      // 2. Delete parent pickup
      const { error } = await (supabase as any)
        .from('pickups')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao excluir coleta' };
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Pickup[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('pickups')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          pickup_invoices(count)
        `)
        .gte('data_agendada', startDate)
        .lte('data_agendada', endDate)
        .order('data_agendada');

      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        id: p.id,
        pickup_number: p.numero_coleta,
        establishment_id: p.establishment_id,
        customer_name: p.contato_nome || '',
        carrier_id: p.carrier_id,
        carrier_name: p.carrier?.razao_social || '',
        transportador: p.carrier ? `${p.carrier.codigo ? p.carrier.codigo + ' - ' : ''}${p.carrier.razao_social}` : 'N/A',
        scheduled_date: p.data_agendada || p.data_solicitacao,
        pickup_address: p.logradouro || '',
        pickup_city: p.cidade || '',
        pickup_state: p.estado || '',
        pickup_zip: p.cep || '',
        contact_name: p.contato_nome || '',
        contact_phone: p.contato_telefone || '',
        usuarioResponsavel: p.contato_nome || 'Usuário Sistema',
        packages_quantity: p.pickup_invoices?.[0]?.count || 0,
        total_weight: p.peso_total || 0,
        total_volume: p.valor_total || 0,
        status: p.status,
        created_at: p.created_at,
        observations: p.observacoes || ''
      })) as Pickup[];
    } catch (error) {

      return [];
    }
  }
};
