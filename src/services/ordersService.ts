import { supabase } from '../lib/supabase';
import { setSessionContext } from '../lib/sessionContext';

export interface Order {
  id?: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  issue_date: string;
  entry_date: string;
  expected_delivery?: string;
  carrier_id?: string;
  carrier_name?: string;
  freight_value: number;
  order_value: number;
  destination_city?: string;
  destination_state?: string;
  destination_zip_code?: string;
  destination_street?: string;
  destination_number?: string;
  destination_complement?: string;
  destination_neighborhood?: string;
  recipient_phone?: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  tracking_code?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by?: number;
  delivery_status?: OrderDeliveryStatus[];
  items?: OrderItem[];
  weight?: number;
  volume_qty?: number;
  cubic_meters?: number;
  freight_results?: any[];
  best_carrier_id?: string;
  serie?: string;
}

export interface OrderDeliveryStatus {
  id?: string;
  order_id: string;
  status: string;
  date: string;
  location?: string;
  observation?: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  weight?: number;
  cubic_meters?: number;
  created_at?: string;
}

// Mapeador para converter dados do banco (PT) para interface (EN)
const mapOrderFromDb = (dbOrder: any): Order => {
  // Map DB status to frontend status
  let mappedStatus = dbOrder.status || 'emitido';
  if (dbOrder.status === 'processando' || dbOrder.status === 'pendente' || dbOrder.status === 'emitido') mappedStatus = 'emitido';
  else if (dbOrder.status === 'coletado') mappedStatus = 'coletado';
  else if (dbOrder.status === 'em_transito') mappedStatus = 'em_transito';
  else if (dbOrder.status === 'saiu_entrega') mappedStatus = 'saiu_entrega';
  else if (dbOrder.status === 'entregue') mappedStatus = 'entregue';
  else if (dbOrder.status === 'cancelado') mappedStatus = 'cancelado';

  return {
    id: dbOrder.id,
    serie: dbOrder.serie || '',
    order_number: dbOrder.numero_pedido || dbOrder.numero || '',
    customer_id: dbOrder.business_partner_id,
    customer_name: dbOrder.business_partner_name || dbOrder.business_partners?.razao_social || 'Cliente não informado',
    issue_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],
    entry_date: dbOrder.data_pedido || new Date().toISOString().split('T')[0],
    expected_delivery: dbOrder.data_prevista_entrega,
    carrier_id: dbOrder.carrier_id,
    carrier_name: dbOrder.carrier_name || dbOrder.carriers?.razao_social || 'Transportadora não informada',
    freight_value: parseFloat(dbOrder.valor_frete || '0'),
    order_value: parseFloat(dbOrder.valor_mercadoria || '0'),
    destination_city: dbOrder.destino_cidade || '',
    destination_state: dbOrder.destino_estado || '',
    destination_zip_code: dbOrder.destino_cep || '',
    destination_street: dbOrder.destino_logradouro || '',
    destination_number: dbOrder.destino_numero || '',
    destination_complement: dbOrder.destino_complemento || '',
    destination_neighborhood: dbOrder.destino_bairro || '',
    recipient_phone: dbOrder.destino_telefone,
    status: mappedStatus as any,
    tracking_code: dbOrder.codigo_rastreio || dbOrder.numero_pedido || dbOrder.numero || '', // Usar rastreio ou número do pedido se ausente
    observations: dbOrder.observacoes,
    created_at: dbOrder.created_at,
    updated_at: dbOrder.updated_at,
    created_by: 1, // Default
    delivery_status: dbOrder.delivery_status || [],
      items: dbOrder.items?.map((item: any) => ({
      id: item.id,
      product_code: item.produto_codigo || '',
      product_description: item.produto_descricao || '',
      quantity: Number(item.quantidade) || 1,
      unit_price: Number(item.valor_unitario) || 0,
      total_price: Number(item.valor_total) || 0,
      weight: Number(item.peso) || 0,
      cubic_meters: Number(item.cubagem) || 0
    })) || [],
    weight: parseFloat(dbOrder.weight || '0'),
    volume_qty: parseInt(dbOrder.volume_qty || '1'),
    cubic_meters: parseFloat(dbOrder.cubic_meters || '0'),
    freight_results: dbOrder.freight_results || [],
    best_carrier_id: dbOrder.best_carrier_id
  };
};

export const ordersService = {
  async getAll(): Promise<Order[]> {
    try {
      let orgId: string | undefined;
      let envId: string | undefined;

      const storedUser = localStorage.getItem('tms-user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        orgId = userObj.organization_id || userObj.user?.organization_id;
        envId = userObj.environment_id || userObj.user?.environment_id;
        
        if (orgId && envId) {
          await setSessionContext(orgId, envId);
        }
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          business_partners (razao_social),
          carriers (razao_social)
        `);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }
      if (envId) {
        query = query.eq('environment_id', envId);
      }

      const { data, error } = await query.order('data_pedido', { ascending: false });

      if (error) {
        throw error;
      }



      // Mapear dados do banco (português) para interface (inglês)
      const mapped = (data || []).map(mapOrderFromDb);


      return mapped;
    } catch (error) {

      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_status:order_delivery_status(*),
          items:order_items(*),
          business_partners(*),
          carriers(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapOrderFromDb(data) : null;
    } catch (error) {

      return null;
    }
  },

  async create(order: Order): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      const userData = JSON.parse(savedUser);
      if (!userData.organization_id || !userData.environment_id) {
        throw new Error('Dados de organização incompletos. Contate o suporte.');
      }




      const { delivery_status, ...orderData } = order;


      // Map frontend status to database status
      let dbStatus = 'pendente';
      if (orderData.status === 'confirmed' || orderData.status === 'processando') dbStatus = 'processando';
      else if (orderData.status === 'in_transit' || orderData.status === 'em_transito') dbStatus = 'em_transito';
      else if (orderData.status === 'delivered' || orderData.status === 'entregue') dbStatus = 'entregue';
      else if (orderData.status === 'cancelled' || orderData.status === 'cancelado') dbStatus = 'cancelado';
      else if (orderData.status === 'pendente') dbStatus = 'pendente';
      else if (orderData.status as any === 'emitido') dbStatus = 'processando'; // Map emitido to processando if it exists

      const dataToInsert = {
        organization_id: userData.organization_id,
        environment_id: userData.environment_id,
        establishment_id: userData.establishment_id || null,
        serie: orderData.serie || null,
        numero_pedido: String(orderData.order_number || ''),
        business_partner_id: orderData.customer_id || null,
        data_pedido: orderData.issue_date || new Date().toISOString().split('T')[0],
        data_prevista_entrega: orderData.expected_delivery || null,
        carrier_id: orderData.carrier_id || null,
        valor_frete: Number(orderData.freight_value || 0),
        valor_mercadoria: Number(orderData.order_value || 0),
        destino_cep: orderData.destination_zip_code ? orderData.destination_zip_code.replace(/\D/g, '') : null,
        destino_logradouro: orderData.destination_street || null,
        destino_numero: orderData.destination_number || null,
        destino_complemento: orderData.destination_complement || null,
        destino_bairro: orderData.destination_neighborhood || null,
        destino_cidade: orderData.destination_city || null,
        destino_estado: orderData.destination_state || null,
        status: dbStatus,
        observacoes: orderData.observations || null,
        codigo_rastreio: orderData.tracking_code || null,
        weight: Number(orderData.weight || 0),
        volume_qty: Number(orderData.volume_qty || 1),
        cubic_meters: Number(orderData.cubic_meters || 0),
        freight_results: orderData.freight_results || [],
        best_carrier_id: orderData.best_carrier_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };



      const { data, error } = await supabase
        .from('orders')
        .insert(dataToInsert as any)
        .select()
        .single();




      if (error) {




        return { success: false, error: error.message || 'Erro desconhecido ao criar pedido' };
      }

      if (delivery_status && delivery_status.length > 0) {
        const statusToInsert = delivery_status.map(status => ({
          ...status,
          order_id: data.id,
          created_at: new Date().toISOString()
        }));

        await supabase.from('order_delivery_status').insert(statusToInsert);
      }


      return { success: true, id: data.id };
    } catch (error: any) {





      let errorMessage = 'Erro ao criar pedido';

      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet ou se o Supabase está configurado corretamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  },

  async update(id: string, order: Partial<Order>): Promise<{ success: boolean; error?: string }> {
    try {
      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      const userData = JSON.parse(savedUser);
      if (!userData.organization_id || !userData.environment_id) {
        throw new Error('Dados de organização incompletos. Contate o suporte.');
      }
      
      const { delivery_status, ...orderData } = order;

      let dbStatus = undefined;
      if (orderData.status) {
        if (orderData.status === 'confirmed' || orderData.status === 'processando') dbStatus = 'processando';
        else if (orderData.status === 'coletado') dbStatus = 'coletado';
        else if (orderData.status === 'in_transit' || orderData.status === 'em_transito') dbStatus = 'em_transito';
        else if (orderData.status === 'saiu_entrega') dbStatus = 'saiu_entrega';
        else if (orderData.status === 'delivered' || orderData.status === 'entregue') dbStatus = 'entregue';
        else if (orderData.status === 'cancelled' || orderData.status === 'cancelado') dbStatus = 'cancelado';
        else if (orderData.status === 'pendente') dbStatus = 'pendente';
        else if (orderData.status === 'emitido') dbStatus = 'processando';
      }

      const dataToUpdate: any = {
        updated_at: new Date().toISOString()
      };

      if (orderData.serie !== undefined) dataToUpdate.serie = orderData.serie || null;
      if (orderData.order_number !== undefined) dataToUpdate.numero_pedido = String(orderData.order_number || '');
      if (orderData.customer_id !== undefined) dataToUpdate.business_partner_id = orderData.customer_id || null;
      if (orderData.issue_date !== undefined) dataToUpdate.data_pedido = orderData.issue_date || new Date().toISOString().split('T')[0];
      if (orderData.expected_delivery !== undefined) dataToUpdate.data_prevista_entrega = orderData.expected_delivery || null;
      if (orderData.carrier_id !== undefined) dataToUpdate.carrier_id = orderData.carrier_id || null;
      if (orderData.freight_value !== undefined) dataToUpdate.valor_frete = Number(orderData.freight_value || 0);
      if (orderData.order_value !== undefined) dataToUpdate.valor_mercadoria = Number(orderData.order_value || 0);
      if (orderData.destination_city !== undefined) dataToUpdate.destino_cidade = orderData.destination_city || null;
      if (orderData.destination_state !== undefined) dataToUpdate.destino_estado = orderData.destination_state || null;
      if (dbStatus !== undefined) dataToUpdate.status = dbStatus;
      if (orderData.observations !== undefined) dataToUpdate.observacoes = orderData.observations || null;
      if (orderData.tracking_code !== undefined) dataToUpdate.codigo_rastreio = orderData.tracking_code || null;
      if (orderData.weight !== undefined) dataToUpdate.weight = Number(orderData.weight || 0);
      if (orderData.volume_qty !== undefined) dataToUpdate.volume_qty = Number(orderData.volume_qty || 1);
      if (orderData.cubic_meters !== undefined) dataToUpdate.cubic_meters = Number(orderData.cubic_meters || 0);
      if (orderData.freight_results !== undefined) dataToUpdate.freight_results = orderData.freight_results || [];
      if (orderData.best_carrier_id !== undefined) dataToUpdate.best_carrier_id = orderData.best_carrier_id || null;

      const { error } = await supabase
        .from('orders')
        .update(dataToUpdate as any)
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar pedido' };
    }
  },

  async addDeliveryStatus(orderId: string, status: OrderDeliveryStatus): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('order_delivery_status')
        .insert({
          ...status,
          order_id: orderId,
          created_at: new Date().toISOString()
        });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao adicionar status' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete associated items
      const { error: errorItems } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);
        
      if (errorItems) return { success: false, error: 'Erro ao excluir itens do pedido: ' + errorItems.message };

      // 2. Delete associated delivery status traces
      const { error: errorStatus } = await supabase
        .from('order_delivery_status')
        .delete()
        .eq('order_id', id);

      if (errorStatus) return { success: false, error: 'Erro ao excluir status de entrega: ' + errorStatus.message };

      // 3. Delete the parent order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Excessão ao deletar pedido:', error);
      return { success: false, error: 'Erro interno ao excluir pedido' };
    }
  },

  async addItems(orderId: string, items: any[]): Promise<{ success: boolean; error?: string }> {
    try {




      const savedUser = localStorage.getItem('tms-user');
      if (!savedUser) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      const userData = JSON.parse(savedUser);

      const itemsToInsert = items.map(item => ({
        order_id: orderId,
        organization_id: userData.organization_id,
        environment_id: userData.environment_id,
        produto_codigo: item.product_code || null,
        produto_descricao: item.product_description,
        quantidade: Number(item.quantity) || 1,
        valor_unitario: Number(item.unit_price) || 0,
        valor_total: Number(item.total_price) || 0,
        peso: Number(item.weight) || 0,
        volume: Number(item.quantity) || 1, // Usando quantity como volume(qtd volumes) para os itens 
        cubagem: Number(item.cubic_meters) || 0
      }));

      await setSessionContext(userData.organization_id, userData.environment_id);

      const { error } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (error) {

        return { success: false, error: error.message };
      }


      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao adicionar itens' };
    }
  },

  async updateItems(orderId: string, items: any[]): Promise<{ success: boolean; error?: string }> {
    try {




      // Delete existing items

      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) {

        return { success: false, error: deleteError.message };
      }

      // Insert new items
      if (items.length > 0) {
        const savedUser = localStorage.getItem('tms-user');
        if (!savedUser) {
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        const userData = JSON.parse(savedUser);

        const itemsToInsert = items.map(item => ({
          order_id: orderId,
          organization_id: userData.organization_id,
          environment_id: userData.environment_id,
          produto_codigo: item.product_code || null,
          produto_descricao: item.product_description,
          quantidade: Number(item.quantity) || 1,
          valor_unitario: Number(item.unit_price) || 0,
          valor_total: Number(item.total_price) || 0,
          peso: Number(item.weight) || 0,
          volume: Number(item.quantity) || 1,
          cubagem: Number(item.cubic_meters) || 0
        }));

        await setSessionContext(userData.organization_id, userData.environment_id);

        const { error: insertError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (insertError) {

          return { success: false, error: insertError.message };
        }
      }


      return { success: true };
    } catch (error) {

      return { success: false, error: 'Erro ao atualizar itens' };
    }
  }
};
