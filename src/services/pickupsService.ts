import { supabase } from '../lib/supabase';
import { usersService } from './usersService';
import { TenantContextHelper } from '../utils/tenantContext';

interface Pickup {
  id?: string;
  pickup_number?: string;
  pickup_number_seq?: number;
  establishment_id?: string;
  customer_id?: string;
  customer_name: string;
  carrier_id?: string;
  carrier_name: string;
  carrier_email?: string;
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

interface CreatePickupFromInvoicesParams {
  invoiceIds: string[];
  establishmentId: string;
  userId?: number;
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
      const ctx = await TenantContextHelper.getCurrentContext();
      
      let query = (supabase as any)
        .from('pickups')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          pickup_invoices(count)
        `);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedPickups = (data || []).map((p: any) => ({
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
        created_by: p.metadata?.created_by,
        observations: p.observacoes || ''
      })) as Pickup[];

      try {
        const users = await usersService.getAll();
        // Since `created_by` numeric IDs match the `useAuth` user.id (which is `u.codigo` as integer),
        // we map the users list by `Number(u.codigo)` or fallback to direct numeric conversion.
        const userMap = new Map(users.map(u => {
          const numericId = Number(u.codigo) || (typeof u.id === 'number' ? u.id : parseInt(String(u.id), 10));
          return [!isNaN(numericId) ? numericId : u.id, u.nome];
        }));

        return mappedPickups.map(p => ({
            ...p,
            usuarioResponsavel: (p.created_by ? userMap.get(p.created_by) : null) || p.contact_name || 'Usuário Sistema'
        }));
      } catch (err) {
        console.warn('Could not map users, falling back to contact_name', err);
        return mappedPickups;
      }
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
          carrier:carriers(id, razao_social, codigo, email),
          pickup_invoices(count)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const pickupData: any = {
        id: data.id,
        pickup_number: data.numero_coleta,
        establishment_id: data.establishment_id,
        customer_name: data.contato_nome || '',
        carrier_id: data.carrier_id,
        carrier_name: data.carrier?.razao_social || '',
        carrier_email: data.carrier?.email || '',
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
        created_by: data.metadata?.created_by,
        observations: data.observacoes || ''
      } as unknown as Pickup;

      try {
        if (pickupData.created_by) {
          const user = await usersService.getByCodigo(pickupData.created_by.toString());
          if (user && user.nome) {
            pickupData.usuarioResponsavel = user.nome;
          }
        }
      } catch (err) {
        // Fallback to initial value
      }

      return pickupData;
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
          invoices_nfe (
            id,
            numero,
            serie,
            chave_acesso,
            data_emissao,
            quantidade_volumes,
            peso_total,
            cubagem_total,
            valor_total,
            customer:invoices_nfe_customers(
              razao_social
            ),
            products:invoices_nfe_products(
              cubagem
            )
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
      const ctx = await TenantContextHelper.getCurrentContext();

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

      // Buscar os dados do Estabelecimento (Galpão/CD) para coletas normais
      const { data: estab } = await (supabase as any)
        .from('establishments')
        .select('*')
        .eq('id', establishmentId)
        .maybeSingle();

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
        const isReverse = firstInvoice.direction === 'reverse';

        let pickupLogradouro = '';
        let pickupCidade = '';
        let pickupEstado = '';
        let pickupCep = '';
        let pickupContato = '';
        let pickupTelefone = '';

        if (isReverse) {
          // Logística Reversa: Transportadora coleta no endereço do Cliente/Destinatário Original
          pickupLogradouro = dest.logradouro || dest.endereco || '';
          pickupCidade = dest.cidade || '';
          pickupEstado = dest.estado || '';
          pickupCep = dest.cep || '';
          pickupContato = dest.razao_social || '';
          pickupTelefone = dest.telefone || '';
        } else {
          // Envio Normal: Transportadora coleta no CD do Embarcador
          const meta = estab?.metadata || {};
          const addr = meta?.address || {};
          pickupLogradouro = addr.logradouro || meta.endereco || '';
          pickupCidade = addr.city || meta.cidade || estab?.cidade || '';
          pickupEstado = addr.state || meta.uf || estab?.estado || '';
          pickupCep = addr.zipCode || meta.cep || '';
          pickupContato = estab?.razao_social || '';
          pickupTelefone = meta.phone || meta.telefone || '';
        }

        // In XML NFe imported, we didn't strictly map total weight and volume globally in the DB schema, 
        // we map it if present or leave it 0
        const totalWeight = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.peso) || 0), 0);
        const totalPackages = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.quantidade_volumes) || 0), 0);
        const totalValue = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.valor_total) || 0), 0);

        const pickupNumber = `COL-${String(nextNum).padStart(4, '0')}`;
        nextNum++;

        const pickupData = {
          organization_id: ctx?.organizationId || null,
          environment_id: ctx?.environmentId || null,
          establishment_id: establishmentId,
          carrier_id: group.carrierId,
          numero_coleta: pickupNumber,
          data_agendada: new Date().toISOString().split('T')[0],
          data_solicitacao: new Date().toISOString(),
          logradouro: pickupLogradouro,
          cidade: pickupCidade,
          estado: pickupEstado,
          cep: pickupCep,
          contato_nome: pickupContato,
          contato_telefone: pickupTelefone,
          quantidade_volumes: totalPackages,
          peso_total: totalWeight,
          valor_total: totalValue,
          status: 'emitida',
          observacoes: `Coleta criada automaticamente a partir de ${group.invoices.length} NFe(s)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: userId ? { created_by: userId } : {}
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

        // Update the status of these invoices to "coletada"
        await (supabase as any)
          .from('invoices_nfe')
          .update({ situacao: 'coletada', updated_at: new Date().toISOString() })
          .in('id', group.invoices.map((inv: any) => inv.id));

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
      const ctx = await TenantContextHelper.getCurrentContext();

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
        const totalPackages = group.invoices.reduce((sum: number, inv: any) => sum + (inv.quantidade_volumes || 0), 0);
        const totalValue = group.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.valor_total) || 0), 0);

        const pickupNumber = `COL-${String(nextNum).padStart(4, '0')}`;
        nextNum++;

        const pickupData = {
          organization_id: ctx?.organizationId || null,
          environment_id: ctx?.environmentId || null,
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
          updated_at: new Date().toISOString(),
          metadata: userId ? { created_by: userId } : {}
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

  async updateStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('pickups')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar status da coleta' };
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
      const ctx = await TenantContextHelper.getCurrentContext();
      
      let query = (supabase as any)
        .from('pickups')
        .select(`
          *,
          carrier:carriers(id, razao_social, codigo),
          pickup_invoices(count)
        `)
        .gte('data_agendada', startDate)
        .lte('data_agendada', endDate);

      if (ctx?.organizationId) query = query.eq('organization_id', ctx.organizationId);
      if (ctx?.environmentId) query = query.eq('environment_id', ctx.environmentId);
      if (ctx?.establishmentId) query = query.eq('establishment_id', ctx.establishmentId);

      const { data, error } = await query.order('data_agendada');

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
